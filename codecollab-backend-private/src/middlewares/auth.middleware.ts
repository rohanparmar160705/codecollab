import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import prisma from "../config/prisma";

// ✅ 1. authenticate middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token provided" });

  const token = header.split(" ")[1];

  try {
    const payload: any = jwt.verify(token, ENV.JWT_ACCESS_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) return res.status(401).json({ message: "Invalid user" });

    // Store user object in request
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Simplified permission middleware (No RBAC)
export const checkPermission = (action: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Basic check: Authenticated users can do everything for now
    next();
  };
};

export const verifyToken = authenticate;
