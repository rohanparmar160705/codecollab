/**
 * Execution Controller - Updated for AWS Lambda execution
 */
import { Request, Response } from "express";
import { ExecutionService } from "../services/execution.service";
import { success, error } from "../utils/response";
import { ExecutionCreateDTO } from "../dtos/execution.dtos";
import { AppError } from "../utils/appError";
import { logger } from "../utils/logger";

export const ExecutionController = {
  /**
   * Execute code using AWS Lambda
   * POST /api/execution/execute
   */
  async executeCode(req: Request, res: Response) {
    try {
      const {
        code,
        language,
        input,
        roomId,
        timeout,
      }: ExecutionCreateDTO & {
        roomId?: string;
        timeout?: number;
      } = req.body;
      const userId = (req.user as any)?.id;

      // Validate required fields
      if (!code || !language) {
        return error(res, "Code and language are required", 400);
      }
      if (!roomId) {
        return error(res, "roomId is required", 400);
      }

      logger.info(`Execution request from user ${userId}`, {
        language,
        codeLength: code.length,
        roomId,
      });

      // Execute code via Lambda
      const record = await ExecutionService.createExecution({
        userId,
        code,
        language,
        input: input || "",
        roomId,
        timeout: timeout || 10,
      });

      return success(
        res,
        record.status === "COMPLETED"
          ? "Code executed successfully"
          : "Execution failed or encountered errors",
        {
          executionId: record.id,
          status: record.status,
          output: record.output,
          error: record.errorMessage,
          executionTime: record.execTimeMs,
          language: record.language,
        }
      );
    } catch (err: any) {
      logger.error("Execution error:", {
        error: err.message,
        stack: err.stack,
      });

      if (err instanceof AppError) {
        return error(res, err.message, err.statusCode);
      }
      return error(res, err.message || "Execution failed", 500);
    }
  },

  /**
   * Execute code without room context (for testing)
   * POST /api/execution/run
   */
  async runCode(req: Request, res: Response) {
    try {
      const { code, language, input, timeout } = req.body;
      const userId = (req.user as any)?.id;

      if (!code || !language) {
        return error(res, "Code and language are required", 400);
      }

      const result = await ExecutionService.executeCodeDirect({
        userId,
        code,
        language,
        input: input || "",
        timeout: timeout || 10,
      });

      return success(res, "Code executed", {
        success: result.success,
        status: result.status,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
      });
    } catch (err: any) {
      logger.error("Run code error:", err.message);
      return error(res, err.message || "Execution failed", 500);
    }
  },

  /**
   * Fetch all executions for current user
   * GET /api/execution
   */
  async list(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const executions = await ExecutionService.fetchAll(userId);
      return success(res, "Execution history fetched", executions);
    } catch (err: any) {
      logger.error("List executions error:", err.message);
      return error(res, "Failed to fetch executions", 500);
    }
  },

  /**
   * Fetch executions for a specific room
   * GET /api/execution/room/:roomId
   */
  async listByRoom(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const executions = await ExecutionService.fetchByRoom(roomId, limit);
      return success(res, "Room executions fetched", executions);
    } catch (err: any) {
      logger.error("List room executions error:", err.message);
      return error(res, "Failed to fetch room executions", 500);
    }
  },

  /**
   * Fetch single execution by ID
   * GET /api/execution/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const exec = await ExecutionService.fetchById(id);

      if (!exec) {
        return error(res, "Execution not found", 404);
      }
      return success(res, "Execution fetched", exec);
    } catch (err: any) {
      logger.error("Get execution error:", err.message);
      return error(res, "Failed to fetch execution", 500);
    }
  },

  /**
   * Get execution statistics for current user
   * GET /api/execution/stats
   */
  async getStats(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const stats = await ExecutionService.getStats(userId);
      return success(res, "Execution stats fetched", stats);
    } catch (err: any) {
      logger.error("Get stats error:", err.message);
      return error(res, "Failed to fetch stats", 500);
    }
  },

  /**
   * Get supported languages
   * GET /api/execution/languages
   */
  async getSupportedLanguages(req: Request, res: Response) {
    try {
      const languages = ExecutionService.getSupportedLanguages();
      return success(res, "Supported languages", { languages });
    } catch (err: any) {
      logger.error("Get languages error:", err.message);
      return error(res, "Failed to fetch languages", 500);
    }
  },

  /**
   * Warm up Lambda functions (admin only)
   * POST /api/execution/warmup
   */
  async warmupLambdas(req: Request, res: Response) {
    try {
      await ExecutionService.warmupLambdas();
      return success(res, "Lambda warmup initiated", {});
    } catch (err: any) {
      logger.error("Warmup error:", err.message);
      return error(res, "Failed to warmup lambdas", 500);
    }
  },

  /**
   * Check health of each compiler's container
   * GET /api/execution/health-status
   */
  async checkHealth(req: Request, res: Response) {
    try {
      const healthStatus = await ExecutionService.checkRunnersHealth();
      return success(res, "Compilers health status", healthStatus);
    } catch (err: any) {
      logger.error("Health check error:", err.message);
      return error(res, "Failed to fetch health status", 500);
    }
  },
};

export default ExecutionController;
