// src/modules/user/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { success } from "../utils/response";

export class UserController {
  // ✅ Fetch current user profile
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await UserService.getProfile(userId);
      return success(res, "User profile fetched", user);
    } catch (err) {
      next(err);
    }
  }

  // ✅ Update user profile
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await UserService.updateProfile(userId, req.body);
      return success(res, "Profile updated successfully", user);
    } catch (err) {
      next(err);
    }
  }

  // ✅ Upload Avatar
  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const user = await UserService.uploadAvatar(userId, req.file.buffer);
      return success(res, "Avatar uploaded successfully", user);
    } catch (err) {
      next(err);
    }
  }

  // ✅ List all users (admin - simplified)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getAllUsers();
      return success(res, "All users fetched", users);
    } catch (err) {
      next(err);
    }
  }

  // 🆕 Get all rooms that a user is part of
  static async getUserRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: "User ID missing" });
      const rooms = await UserService.getUserRooms(id);
      return success(res, "User rooms fetched successfully", rooms);
    } catch (err) {
      next(err);
    }
  }
}
