// src/config/env.ts
import * as dotenv from "dotenv";
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 4000,
  APP_NAME: process.env.APP_NAME || "CodeCollab",
  APP_URL: process.env.APP_URL || "http://localhost:4000",
  CLIENT_URLS: process.env.CLIENT_URLS || "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL!,

  // 🔐 JWT
  JWT_SECRET: process.env.JWT_SECRET || "dev_secret",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access_secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh_secret",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // 🧠 Redis
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  // ⚙️ Logging & CORS
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  CORS_ORIGINS: process.env.CORS_ORIGINS || "http://localhost:5173",

  // ⚙️ Execution Engine Config
  EXECUTION_TIMEOUT: Number(process.env.EXECUTION_TIMEOUT) || 10000,

  // 🐳 Docker Images
  DOCKER_IMAGE_NODE: process.env.DOCKER_IMAGE_NODE || "node:18-alpine",
  DOCKER_IMAGE_PYTHON: process.env.DOCKER_IMAGE_PYTHON || "python:3.11-alpine",
  DOCKER_IMAGE_CPP: process.env.DOCKER_IMAGE_CPP || "gcc:latest",
  DOCKER_IMAGE_JAVA: process.env.DOCKER_IMAGE_JAVA || "openjdk:17-slim",

  // ☁️ Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
