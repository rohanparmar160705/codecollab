// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";

import { globalErrorHandler } from "./middlewares/error.middleware";
import {
  globalLimiter,
  executionLimiter,
} from "./middlewares/rateLimiter.middleware";
import { ENV } from "./config/env";
import { logger, stream } from "./utils/logger";

// Route imports
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import roomRoutes from "./routes/room.routes";
import executionRoutes from "./routes/execution.routes";

const app = express();

// ========================================================
// 🧱 Core Middlewares
// ========================================================
app.use(
  cors({
    origin: ENV.CORS_ORIGINS.split(",").map((url) => url.trim()),
    credentials: true,
  })
);
app.use(helmet());
app.use(
  morgan(ENV.NODE_ENV === "development" ? "dev" : "combined", { stream })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use("/api", globalLimiter);

// ========================================================
// 🌍 Routes
// ========================================================
app.get("/api/health", (_, res) => {
  res.json({
    status: "ok",
    message: "CodeCollab backend running 🚀",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/execution", executionLimiter, executionRoutes);

app.use(globalErrorHandler);

export { app };
