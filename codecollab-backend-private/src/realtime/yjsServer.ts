// src/realtime/yjsServer.ts
import { Server as HTTPServer } from "http";
import * as WebSocket from "ws";
import jwt from "jsonwebtoken";
import url from "url";
import prisma from "../config/prisma";
import { ENV } from "../config/env";
import * as Y from "yjs";
import { logger } from "../utils/logger";

// We import from the JS file directly to access the docs map which is not always exported in TS types
const { setupWSConnection, docs } = require("y-websocket/bin/utils");
import { redis } from "../config/redis";

function verifyAccessToken(token?: string) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET as string) as any;
    return decoded?.userId as string;
  } catch {
    return null;
  }
}

async function canJoinRoom(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { members: { select: { userId: true } } },
  });
  if (!room) return false;

  const isOwner = room.ownerId === userId;
  const isMember = room.members.some((m) => m.userId === userId);
  if (isOwner || isMember) return true;

  if (room.isPublic) {
    return true;
  }
  return false;
}
/**
 * Persists the current state of a room to the database.
 */
async function saveRoomToDB(
  roomId: string,
  code: string,
  input: string,
  output: string
) {
  try {
    await prisma.room.update({
      where: { id: roomId },
      data: {
        lastKnownCode: code,
        lastKnownInput: input,
        lastKnownOutput: output,
      } as any,
    });
    logger.info(`💾 Room ${roomId} persisted to DB.`);
  } catch (err) {
    logger.error(`❌ Failed to persist room ${roomId}:`, err);
  }
}

async function saveRoomToRedis(
  roomId: string,
  code: string,
  input: string,
  output: string
) {
  try {
    await Promise.all([
      redis.set(`room:code:${roomId}`, code, 3600 * 24),
      redis.set(`room:input:${roomId}`, input, 3600 * 24),
      redis.set(`room:output:${roomId}`, output, 3600 * 24),
    ]);
  } catch (err) {
    logger.error(`❌ Redis save failed for ${roomId}:`, err);
  }
}

export function setupYjsWebSocket() {
  const wss = new WebSocket.Server({ noServer: true });
  logger.info("🔌 Yjs WebSocket server initialized");

  const PERSISTENCE_INTERVAL = 60 * 60 * 1000; // 1 hour

  const handleUpgrade = async (request: any, socket: any, head: any) => {
    try {
      const reqUrl = request.url || "/";
      logger.info(`📡 WebSocket upgrade request: ${reqUrl}`);

      if (!reqUrl.startsWith("/yjs/")) {
        logger.info("⏭️  Not a Yjs request, skipping");
        return;
      }

      const parsed = url.parse(reqUrl, true);
      const parts = (parsed.pathname || "").split("/").filter(Boolean);
      const roomId = parts[1];
      const token = String(parsed.query?.token || "");

      logger.info(`🔐 Authenticating user for room ${roomId}`);
      const userId = verifyAccessToken(token);
      if (!userId) {
        logger.warn(`❌ Invalid token for room ${roomId}`);
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      logger.info(`✅ User ${userId} authenticated, checking room access`);
      const allowed = await canJoinRoom(roomId, userId);
      if (!allowed) {
        logger.warn(`❌ User ${userId} not allowed in room ${roomId}`);
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
        return;
      }

      logger.info(`🎉 User ${userId} granted access to room ${roomId}`);

      wss.handleUpgrade(request, socket as any, head, (ws) => {
        logger.info(`🔗 WebSocket connection UPGRADED for room ${roomId}`);
        wss.emit("connection", ws, request);
        setupWSConnection(ws, request, { docName: roomId, gc: true });
        logger.info(`✅ Yjs setupWSConnection called for room ${roomId}`);

        const doc = docs.get(roomId) as Y.Doc | undefined;
        if (doc && !(doc as any)._persistenceInitialized) {
          (doc as any)._persistenceInitialized = true;

          // 📥 Collaborative Multi-Level Loading Logic
          (async () => {
            const yText = doc.getText("code");
            const yInput = doc.getText("input");
            const yOutput = doc.getMap("output");

            // 1. Check Redis First
            const [cachedCode, cachedInput, cachedOutput] = await Promise.all([
              redis.get<string>(`room:code:${roomId}`),
              redis.get<string>(`room:input:${roomId}`),
              redis.get<string>(`room:output:${roomId}`),
            ]);

            if (cachedCode) {
              if (yText.length === 0) {
                yText.insert(0, cachedCode);
                logger.info(`⚡ Loaded code from Redis for room ${roomId}`);
              }
            } else {
              // 2. Fallback to DB
              const room = (await prisma.room.findUnique({
                where: { id: roomId },
              })) as any;

              if (room) {
                const dbCode = room.lastKnownCode || "";
                const dbInput = room.lastKnownInput || "";
                const dbOutput = room.lastKnownOutput || "";

                if (yText.length === 0 && dbCode) {
                  yText.insert(0, dbCode);
                  logger.info(`📄 Loaded code from DB for room ${roomId}`);
                }

                if (yInput.length === 0 && dbInput) {
                  yInput.insert(0, dbInput);
                }
                if (!yOutput.has("text") && dbOutput) {
                  yOutput.set("text", dbOutput);
                }

                // Warm up Redis
                await saveRoomToRedis(roomId, dbCode, dbInput, dbOutput);
              }
            }

            if (cachedInput && yInput.length === 0) {
              yInput.insert(0, cachedInput);
            }
            if (cachedOutput && !yOutput.has("text")) {
              yOutput.set("text", cachedOutput);
            }

            // 📤 Sync every change to Redis
            doc.on("update", () => {
              const code = yText.toString();
              const input = yInput.toString();
              const output = String(yOutput.get("text") || "");
              saveRoomToRedis(roomId, code, input, output);
            });
          })();

          // ⏰ Periodic DB Sync (1 Hour)
          const interval = setInterval(() => {
            const activeConns = (doc as any).conns?.size || 0;
            if (activeConns > 0) {
              const yText = doc.getText("code");
              const yInput = doc.getText("input");
              const yOutput = doc.getMap("output");

              saveRoomToDB(
                roomId,
                yText.toString(),
                yInput.toString(),
                String(yOutput.get("text") || "")
              );
            } else {
              clearInterval(interval);
              (doc as any)._persistenceInitialized = false;
            }
          }, PERSISTENCE_INTERVAL);

          // 🧹 Final Save on empty room
          ws.on("close", () => {
            setTimeout(() => {
              const activeConns = (doc as any).conns?.size || 0;
              if (activeConns === 0) {
                const yText = doc.getText("code");
                const yInput = doc.getText("input");
                const yOutput = doc.getMap("output");

                const code = yText.toString();
                const input = yInput.toString();
                const output = String(yOutput.get("text") || "");

                saveRoomToDB(roomId, code, input, output);
                saveRoomToRedis(roomId, code, input, output);

                logger.info(`🧹 Room ${roomId} is empty. Saved final state.`);
              }
            }, 3000);
          });
        }
      });
    } catch (e) {
      logger.error("❌ WebSocket upgrade error:", e);
      try {
        socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        socket.destroy();
      } catch {}
    }
  };

  return { wss, handleUpgrade };
}
