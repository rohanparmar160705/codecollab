// src/middlewares/rateLimiter.middleware.ts
import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger";

// Global API Limiter (100 reqs per 15 min)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many requests from this IP, please try again later.",
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
});

// Execution Limiter (10 reqs per minute)
export const executionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Execution limit reached. Please wait a moment.",
  },
});
