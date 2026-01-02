
import { Server } from "socket.io";

/**
 * Bridge BullMQ job lifecycle -> Socket.IO room events for live execution feedback
 * Events emitted to roomId:
 * - execution:status { executionId, jobId, status, progress }
 * - execution:output { executionId, jobId, status, output }
 */
export function registerExecutionEvents(io: Server) {
  // ⚠️ Queue events disabled as Redis/BullMQ were removed.
  // Execution is now handled directly in execution.service.ts
}
