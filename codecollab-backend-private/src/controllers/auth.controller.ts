// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { success } from "../utils/response";

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password } = req.body;
      let avatarUrl = req.body.avatarUrl || null;

      if (req.file) {
        const { CloudinaryService } = await import(
          "../services/cloudinary.service"
        );
        avatarUrl = await CloudinaryService.uploadImage(req.file.buffer);
      }

      const result = await AuthService.register(
        username,
        email,
        password,
        avatarUrl
      );
      return success(res, "User registered successfully", result, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      return success(res, "Login successful", result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Refresh token
   */
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refresh(refreshToken);
      return success(res, "Token refreshed", result);
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const result = await AuthService.getProfile(userId);
      return success(res, "Profile fetched", result);
    } catch (err) {
      next(err);
    }
  }
}
