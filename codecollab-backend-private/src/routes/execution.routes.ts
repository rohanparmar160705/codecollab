/**
 * Execution Routes - Updated for AWS Lambda execution
 */
import { Router } from "express";
import { ExecutionController } from "../controllers/execution.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { limitPerWindow } from "../middlewares/tokenBucket.middleware";

const router = Router();

// Rate limit configuration
const executeRateLimit = limitPerWindow({
  key: (req) => `exec:${(req as any).user?.id || "anon"}`,
  windowSec: 60,
  max: 10, // 10 executions per minute
});

const directRunRateLimit = limitPerWindow({
  key: (req) => `run:${(req as any).user?.id || "anon"}`,
  windowSec: 60,
  max: 20, // 20 direct runs per minute
});

/**
 * @route POST /api/execution/execute
 * @desc Execute code in a room context (saved to DB)
 * @access Private
 */
router.post(
  "/execute",
  verifyToken,
  executeRateLimit,
  ExecutionController.executeCode
);

/**
 * @route POST /api/execution/run
 * @desc Execute code directly without room context (for testing)
 * @access Private
 */
router.post(
  "/run",
  verifyToken,
  directRunRateLimit,
  ExecutionController.runCode
);

/**
 * @route GET /api/execution
 * @desc Get all executions for current user
 * @access Private
 */
router.get("/", verifyToken, ExecutionController.list);

/**
 * @route GET /api/execution/stats
 * @desc Get execution statistics for current user
 * @access Private
 */
router.get("/stats", verifyToken, ExecutionController.getStats);

/**
 * @route GET /api/execution/languages
 * @desc Get list of supported programming languages
 * @access Public
 */
router.get("/languages", ExecutionController.getSupportedLanguages);

/**
 * @route GET /api/execution/room/:roomId
 * @desc Get executions for a specific room
 * @access Private
 */
router.get("/room/:roomId", verifyToken, ExecutionController.listByRoom);

/**
 * @route GET /api/execution/health-status
 * @desc Check health status of all compiler containers
 * @access Public
 */
router.get("/health-status", verifyToken, ExecutionController.checkHealth);

/**
 * @route GET /api/execution/:id
 * @desc Get single execution by ID
 * @access Private
 */
router.get("/:id", verifyToken, ExecutionController.getById);

export default router;
