// src/middlewares/verifyEmail.middleware.ts
import { Request, Response, NextFunction } from "express";

/**
 * Simplified: Always allow access as email verification is removed from the core flow.
 */
export const verifyEmailMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next();
};
