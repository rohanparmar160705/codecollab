// src/modules/collab/collab.gateway.ts
import { Server, Socket } from "socket.io";
import { redis } from "../config/redis";
import prisma from "../config/prisma";
import { logger } from "../utils/logger";

interface PresenceData {
  userId: string;
  username: string;
  roomId: string;
}

export const registerCollabGateway = (io: Server) => {
  // 🧠 In-Memory Presence Store (RoomId -> Map<UserId, Username>)
  // Note: For multi-instance, presence should ideally be in Redis.
  // We'll keep it simple for now as requested.
  const roomUsers = new Map<string, Map<string, string>>();

  // 📡 Redis Pub/Sub Integration for multi-server scaling
  redis.subscribe("ROOM_EVENTS", (payload) => {
    const { roomId, type, data } = payload;
    io.to(roomId).emit(type, data);
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`🟢 Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info(`❌ Socket disconnected: ${socket.id}`);
    });

    // ===============================
    // 🧩 JOIN ROOM EVENT (Presence)
    // ===============================
    socket.on("join-room", async (data: PresenceData) => {
      const { userId, username, roomId } = data;
      if (!userId || !roomId) return;

      socket.join(roomId);

      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      roomUsers.get(roomId)?.set(userId, username);

      const membersMap = roomUsers.get(roomId);
      const members = membersMap
        ? Array.from(membersMap.entries()).map(([uid, uname]) => ({
            userId: uid,
            username: uname,
          }))
        : [];

      io.to(roomId).emit("presence-update", members);
      logger.info(`👥 ${username} joined room ${roomId}`);
    });

    // ===============================
    // 💬 CHAT
    // ===============================
    socket.on(
      "chat:send",
      async (payload: { roomId: string; userId: string; text: string }) => {
        const { roomId, userId, text } = payload;
        if (!roomId || !userId || !text) return;

        try {
          const msg = await prisma.message.create({
            data: { roomId, userId, text },
          });

          const chatPayload = {
            id: msg.id,
            roomId,
            userId,
            text: msg.text,
            createdAt: msg.createdAt,
          };

          // Broadcast via Redis
          redis.publish("ROOM_EVENTS", {
            roomId,
            type: "chat:receive",
            data: chatPayload,
          });
        } catch (e) {
          logger.error("Chat send error", e);
        }
      }
    );

    // ===============================
    // 🚪 LEAVE ROOM
    // ===============================
    socket.on("leave-room", (data: PresenceData) => {
      const { userId, username, roomId } = data;
      if (!roomId || !userId) return;

      socket.leave(roomId);
      roomUsers.get(roomId)?.delete(userId);

      const membersMap = roomUsers.get(roomId);
      const members = membersMap
        ? Array.from(membersMap.entries()).map(([uid, uname]) => ({
            userId: uid,
            username: uname,
          }))
        : [];

      io.to(roomId).emit("presence-update", members);
      logger.info(`🔴 ${username} left room ${roomId}`);
    });
  });
};
