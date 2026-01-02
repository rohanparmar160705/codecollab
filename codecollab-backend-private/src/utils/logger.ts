// src/utils/logger.ts
import winston from "winston";
import { ENV } from "../config/env";

const { combine, timestamp, json, colorize, simple, printf } = winston.format;

const logFormat = printf((info: any) => {
  const { level, message, timestamp } = info;
  return `${timestamp} [${level}]: ${message}`;
});

export const logger = winston.createLogger({
  level: ENV.NODE_ENV === "development" ? "debug" : "info",
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.Console({
      format:
        ENV.NODE_ENV === "development"
          ? combine(colorize(), timestamp(), logFormat)
          : combine(timestamp(), json()),
    }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
});

// Stream for Morgan
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
