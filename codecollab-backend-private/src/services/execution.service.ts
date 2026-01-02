/**
 * Updated Execution Service - Transitioning to Docker Containers
 * Simplified architecture without Redis/Bull queues
 */

import prisma from "../config/prisma";
import { v4 as uuidv4 } from "uuid";
import { ExecutionQueueJob } from "../dtos/execution.dtos";
import { AppError } from "../utils/appError";
import { logger } from "../utils/logger";
import axios from "axios";

// Execution timeout in seconds
const DEFAULT_TIMEOUT = 30; // Increased to handle cold starts
const MAX_TIMEOUT = 60;

// Memory limit in MB
const DEFAULT_MEMORY = 256;
const MAX_MEMORY = 512;

const EXECUTOR_URLS: Record<string, string> = {
  python: process.env.EXECUTOR_PYTHON_URL || "",
  python3: process.env.EXECUTOR_PYTHON_URL || "",
  java: process.env.EXECUTOR_JAVA_URL || "",
  java17: process.env.EXECUTOR_JAVA_URL || "",
  cpp: process.env.EXECUTOR_CPP_URL || "",
  "c++": process.env.EXECUTOR_CPP_URL || "",
  cpp17: process.env.EXECUTOR_CPP_URL || "",
  node: process.env.EXECUTOR_NODE_URL || "",
  nodejs: process.env.EXECUTOR_NODE_URL || "",
  javascript: process.env.EXECUTOR_NODE_URL || "",
};

export interface ExecutionResult {
  success: boolean;
  output: string;
  error: string | null;
  exitCode: number;
  executionTime: number;
  memoryUsed?: number;
  status:
    | "COMPLETED"
    | "FAILED"
    | "TIMEOUT"
    | "ERROR"
    | "INVALID"
    | "COMPILATION_ERROR";
}

export const ExecutionService = {
  /**
   * Create and execute code immediately using Docker Containers (Deployment Pending)
   * Returns execution result synchronously
   */
  async createExecution({
    userId,
    code,
    language,
    input = "",
    roomId,
    timeout = DEFAULT_TIMEOUT,
    memoryLimit = DEFAULT_MEMORY,
  }: Omit<ExecutionQueueJob, "id"> & {
    roomId: string;
    timeout?: number;
    memoryLimit?: number;
  }) {
    const id = uuidv4();
    const startTime = Date.now();

    logger.info(`Starting execution ${id}`, {
      userId,
      roomId,
      language,
      codeLength: code.length,
    });

    // 0️⃣ Validate room and membership
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError("Room not found", 404);

    const isMember = await prisma.roomMember.findFirst({
      where: { roomId, userId },
    });
    const isOwner = room.ownerId === userId;
    if (!isMember && !isOwner && !room.isPublic) {
      throw new AppError("Not authorized to execute in this private room", 403);
    }

    // 1️⃣ Create execution record in DB with RUNNING status
    const record = await prisma.execution.create({
      data: {
        id,
        user: { connect: { id: userId } },
        room: { connect: { id: roomId } },
        code,
        language,
        input,
        status: "RUNNING",
      },
    });

    // 2️⃣ Execute via Docker
    try {
      const baseUrl = EXECUTOR_URLS[String(language).toLowerCase()];
      if (!baseUrl)
        throw new AppError(`Language ${language} not supported yet`, 400);

      const targetUrl = `${baseUrl}/execute`;
      logger.info(`Sending execution ${id} to ${targetUrl}`);

      const { data } = await axios.post(
        targetUrl,
        { code, input },
        { timeout: 60000 } // Wait up to 60s for Render cold start
      );

      const result: ExecutionResult = {
        success: data.status === "COMPLETED",
        output: data.output || "",
        error: data.error || null,
        exitCode: data.exitCode || 0,
        executionTime: data.executionTime || 0,
        status: data.status || (data.exitCode === 0 ? "COMPLETED" : "FAILED"),
      };

      // 4️⃣ Map Result to DB status
      let dbStatus: any = "COMPLETED";
      if (result.status === "TIMEOUT") dbStatus = "TIMEOUT";
      else if (result.status === "FAILED") dbStatus = "FAILED";
      else if (result.exitCode !== 0) dbStatus = "FAILED";

      // 5️⃣ Update DB with result
      const updatedRecord = await prisma.execution.update({
        where: { id },
        data: {
          status: dbStatus,
          output: result.output || "",
          execTimeMs: result.executionTime,
          errorMessage: result.error || null,
        },
      });

      logger.info(`Execution ${id} completed`, {
        status: dbStatus,
        executionTime: result.executionTime,
        totalTime: Date.now() - startTime,
      });

      return {
        ...updatedRecord,
        jobId: `docker-${id}`,
        executionResult: result,
      };
    } catch (err: any) {
      logger.error(`Execution ${id} failed`, {
        error: err.message,
        stack: err.stack,
      });

      // Update DB with failure
      await prisma.execution.update({
        where: { id },
        data: {
          status: "FAILED",
          errorMessage: err.message || "Execution failed or timed out",
        },
      });

      throw err;
    }
  },

  /**
   * Execute code without room context (for direct API calls)
   */
  async executeCodeDirect({
    userId,
    code,
    language,
    input = "",
    timeout = DEFAULT_TIMEOUT,
  }: {
    userId: string;
    code: string;
    language: string;
    input?: string;
    timeout?: number;
  }): Promise<ExecutionResult> {
    logger.info(`Direct execution for user ${userId}`, {
      language,
      codeLength: code.length,
    });

    return {
      success: false,
      output: "",
      error: "Direct execution temporarily disabled for migration.",
      exitCode: 1,
      executionTime: 0,
      status: "ERROR",
    };
  },

  /**
   * Save execution result to database
   */
  async saveResult(id: string, data: Record<string, any>) {
    return prisma.execution.update({ where: { id }, data });
  },

  /**
   * Fetch all recent executions for a user
   */
  async fetchAll(userId: string) {
    return prisma.execution.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Fetch executions for a specific room
   */
  async fetchByRoom(roomId: string, limit: number = 20) {
    return prisma.execution.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  /**
   * Fetch single execution by ID
   */
  async fetchById(id: string) {
    return prisma.execution.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Get execution statistics for a user
   */
  async getStats(userId: string) {
    const [total, completed, failed] = await Promise.all([
      prisma.execution.count({ where: { userId } }),
      prisma.execution.count({ where: { userId, status: "COMPLETED" } }),
      prisma.execution.count({ where: { userId, status: "FAILED" } }),
    ]);

    const avgTime = await prisma.execution.aggregate({
      where: { userId, status: "COMPLETED" },
      _avg: { execTimeMs: true },
    });

    return {
      total,
      completed,
      failed,
      successRate: total > 0 ? ((completed / total) * 100).toFixed(1) : "0",
      avgExecutionTime: avgTime._avg.execTimeMs || 0,
    };
  },

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    // Return standard languages we support in Docker
    return [
      { name: "python", version: "3.11", supported: true },
      { name: "java", version: "17", supported: true },
      { name: "cpp", version: "17", supported: true },
      { name: "nodejs", version: "18", supported: true },
    ];
  },

  /**
   * Warm up Lambda functions (Deprecated)
   */
  async warmupLambdas() {
    return Promise.resolve();
  },

  /**
   * Check health of all configured runners
   */
  async checkRunnersHealth() {
    const results: Record<
      string,
      { status: string; url: string; latency?: number }
    > = {};
    const languages = ["python", "java", "cpp", "node"];

    const checks = languages.map(async (lang) => {
      const url = EXECUTOR_URLS[lang];
      const start = Date.now();
      try {
        const response = await axios.get(`${url}/health`, {
          timeout: 5000,
          validateStatus: () => true, // Accept any status code
        });

        const isOnline =
          response.status === 200 ||
          (typeof response.data === "string" &&
            response.data.toLowerCase().includes("ok"));

        results[lang] = {
          status: isOnline ? "ONLINE" : "OFFLINE",
          url,
          latency: Date.now() - start,
        };
      } catch (err: any) {
        results[lang] = {
          status: "OFFLINE",
          url,
          latency: -1,
        };
      }
    });

    await Promise.all(checks);
    return results;
  },
};

export default ExecutionService;
