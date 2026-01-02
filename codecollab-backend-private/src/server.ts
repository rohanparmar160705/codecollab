// src/server.ts
import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { Server } from "socket.io";

import { app } from "./app";
import { ENV } from "./config/env";
import { logger } from "./utils/logger";
import { registerCollabGateway } from "./gateways/collab.gateway";
import prisma from "./config/prisma";
// import { createAdapter } from "@socket.io/mongo-adapter";
// import { MongoClient } from "mongodb";

const PORT = ENV.PORT || 4000;

// ✅ Create HTTP server (required for socket.io)
const httpServer = createServer(app);

// ✅ Setup Yjs WebSocket (Manual Upgrade Handler)
import { setupYjsWebSocket } from "./realtime/yjsServer";
const { handleUpgrade: yjsHandleUpgrade } = setupYjsWebSocket();

// ✅ Initialize Socket.IO
// destroyUpgrade: false ensures it doesn't close sockets for other paths (like /yjs/)
const io = new Server(httpServer, {
  cors: {
    origin: ENV.CORS_ORIGINS.split(",").map((url) => url.trim()),
    credentials: true,
  },
  path: "/socket.io/",
  destroyUpgrade: false,
});

// ✅ Handle Yjs Upgrades Manually (Socket.IO ignores them now)
httpServer.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith("/yjs/")) {
    yjsHandleUpgrade(req, socket, head);
  }
});

// =====================================================
// 🔥 HEALTHCHECK ENDPOINT
// =====================================================
app.get("/health", async (req, res) => {
  try {
    // Prisma check
    await prisma.$queryRaw`SELECT 1`;

    const health = {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      app: ENV.APP_NAME,
      environment: ENV.NODE_ENV,
      port: PORT,
      services: {
        database: "connected",
        socketIO: io.engine ? "running" : "not running",
      },
    };

    return res.status(200).json(health);
  } catch (error: any) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
      services: {
        database: "disconnected",
      },
    });
  }
});

// =====================================================

(async () => {
  try {
    // 🔌 Mongo Adapter for Horizontal Scaling
    // if (ENV.MONGO_URL) {
    //   const mongoClient = new MongoClient(ENV.MONGO_URL);
    //   await mongoClient.connect();
    //   const db = mongoClient.db("codecollab_socket");
    //   const mongoCollection = db.collection("socket.io-adapter-events");

    //   io.adapter(createAdapter(mongoCollection));
    //   logger.info("✅ Socket.IO Mongo Adapter connected");
    // }

    // Register collaboration socket handlers
    registerCollabGateway(io);
    httpServer.listen(PORT, () => {
      logger.info(
        `✅ ${ENV.APP_NAME} running on port ${PORT} (${ENV.NODE_ENV})`
      );
      logger.info(`🌐 API URL: ${ENV.APP_URL}`);
    });
  } catch (err: any) {
    logger.error("Failed startup checks: " + err.message);
    process.exit(1);
  }
})();

// ✅ Handle socket connections (optional base setup)
io.on("connection", (socket) => {
  logger.info(`⚡ User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    logger.info(`❌ User disconnected: ${socket.id}`);
  });
});

// ✅ Graceful shutdown handling
process.on("SIGINT", () => {
  logger.warn("🛑 Server shutting down (SIGINT)...");
  httpServer.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  logger.warn("🛑 Server shutting down (SIGTERM)...");
  httpServer.close(() => process.exit(0));
});
