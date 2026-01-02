import { Request, Response, NextFunction } from "express";

/**
 * Simplified permission check.
 * Since we've removed the complex RBAC from the database,
 * we'll bypass this for now or check for simple roles if needed.
 */
export const checkPermission = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // For now, allow all authenticated users to proceed
    next();
  };
};
