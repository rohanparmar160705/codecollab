// src/modules/room/room.service.ts
import prisma from "../config/prisma";
import { AppError } from "../utils/appError";

export class RoomService {
  static async createRoom(
    ownerId: string,
    data: {
      name: string;
      language?: string;
      description?: string;
      isPublic?: boolean;
    }
  ) {
    const isPublic = data.isPublic ?? false;

    return prisma.room.create({
      data: {
        name: data.name,
        language: data.language || "javascript",
        description: data.description || "",
        isPublic,
        ownerId,
        members: {
          create: { userId: ownerId, role: "OWNER" },
        },
      },
    });
  }

  static async getAllRooms(forUserId: string) {
    return prisma.room.findMany({
      where: {
        OR: [
          { ownerId: forUserId },
          { members: { some: { userId: forUserId } } },
        ],
      },
      include: { owner: { select: { id: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getRoomById(id: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true } },
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });
    if (!room) throw new AppError("Room not found", 404);

    // Check access
    const isOwner = room.ownerId === userId;
    const isMember = !!room.members.find((m) => m.userId === userId);

    // If room is public, anyone can access it.
    // If not public, must be owner or member.

    if (room.isPublic || isOwner || isMember) return room;
    throw new AppError(
      "Unauthorized access to room. This room is private.",
      403
    );
  }

  static async deleteRoom(id: string, ownerId: string) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw new AppError("Room not found", 404);
    if (room.ownerId !== ownerId)
      throw new AppError("Only owners can delete rooms", 403);

    await prisma.$transaction([
      prisma.roomMember.deleteMany({ where: { roomId: id } }),
      prisma.message.deleteMany({ where: { roomId: id } }),
      prisma.execution.deleteMany({ where: { roomId: id } }),
      prisma.room.delete({ where: { id } }),
    ]);

    return { message: "Room deleted successfully" };
  }

  static async joinRoom(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError("Room not found", 404);

    const exists = await prisma.roomMember.findFirst({
      where: { roomId, userId },
    });
    if (exists) return { message: "Already a member" };

    const isOwner = room.ownerId === userId;
    if (isOwner) return { message: "Owner already member" };

    // For public rooms, create membership as EDITOR so they appear in the list
    if (room.isPublic) {
      const member = await prisma.roomMember.create({
        data: {
          roomId,
          userId,
          role: "EDITOR", // Default public joiners to EDITOR
        },
      });
      return { message: "Joined public room", member };
    }

    // Private rooms are strictly invite-only by owner
    throw new AppError("Private room - only owner can add members", 403);
  }

  static async leaveRoom(roomId: string, userId: string) {
    const exists = await prisma.roomMember.findFirst({
      where: { roomId, userId },
    });
    if (!exists) throw new AppError("Not a member", 400);

    // Owners usually stay members until room is deleted, but we allow 'leaving' the session
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (room?.ownerId === userId) {
      return { message: "Owner session ended" };
    }

    await prisma.roomMember.delete({ where: { id: exists.id } });
    return { message: "Left room successfully" };
  }

  static async saveContent(roomId: string, userId: string, content: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError("Room not found", 404);

    const isMember = await prisma.roomMember.findFirst({
      where: { roomId, userId },
    });
    if (!isMember && room.ownerId !== userId)
      throw new AppError("Unauthorized", 403);

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: { lastKnownCode: content },
    });

    return { id: updated.id, length: content.length };
  }

  static async setVisibility(
    roomId: string,
    ownerId: string,
    isPublic: boolean
  ) {
    throw new AppError("Room visibility cannot be changed after creation", 400);
  }
}
