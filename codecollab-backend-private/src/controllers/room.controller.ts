// src/modules/room/room.controller.ts
import { Request, Response, NextFunction } from "express";
import { RoomService } from "../services/room.service";
import {
  createRoomSchema,
  joinRoomSchema,
  setVisibilitySchema,
} from "../validations/room.validation";
import { success } from "../utils/response";

export class RoomController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any)?.id;
      const { error, value } = createRoomSchema.validate(req.body);
      if (error) return res.status(400).json({ message: error.message });

      const room = await RoomService.createRoom(ownerId, value);
      return success(res, "Room created successfully", room, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.id as string;
      const rooms = await RoomService.getAllRooms(userId);
      return success(res, "All rooms fetched", rooms);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id as string;
      const room = await RoomService.getRoomById(id, userId);
      return success(res, "Room fetched", room);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any)?.id;
      const { id } = req.params;
      const result = await RoomService.deleteRoom(id, ownerId);
      return success(res, "Room deleted", result);
    } catch (err) {
      next(err);
    }
  }

  static async join(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = joinRoomSchema.validate(req.body);
      if (error) return res.status(400).json({ message: error.message });

      const result = await RoomService.joinRoom(value.roomId, value.userId);
      return success(res, "Joined room", result);
    } catch (err) {
      next(err);
    }
  }

  static async leave(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId, userId } = req.body;
      if (!roomId || !userId) {
        return res
          .status(400)
          .json({ message: "roomId and userId are required" });
      }

      const result = await RoomService.leaveRoom(roomId, userId);
      return success(res, "Left room successfully", result);
    } catch (err) {
      next(err);
    }
  }

  static async saveContent(req: Request, res: Response, next: NextFunction) {
    try {
      const roomId = req.params.id;
      const userId = (req.user as any)?.id as string;
      const { content, language } = req.body as {
        content?: string;
        language?: string;
      };
      if (typeof content !== "string")
        return res.status(400).json({ message: "content is required" });

      const result = await RoomService.saveContent(roomId, userId, content);
      return success(res, "Content saved", result);
    } catch (err) {
      next(err);
    }
  }

  static async setVisibility(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any)?.id as string;
      const roomId = req.params.id;
      const { error, value } = setVisibilitySchema.validate(req.body);
      if (error) return res.status(400).json({ message: error.message });
      const result = await RoomService.setVisibility(
        roomId,
        ownerId,
        value.isPublic
      );
      return success(res, "Room visibility updated", result);
    } catch (err) {
      next(err);
    }
  }
}
