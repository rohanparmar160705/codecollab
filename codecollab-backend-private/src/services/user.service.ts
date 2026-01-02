// src/modules/user/user.service.ts
import prisma from "../config/prisma";
import { AppError } from "../utils/appError";
import { CloudinaryService } from "./cloudinary.service";

export class UserService {
  // ✅ Get user profile
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new AppError("User not found", 404);
    return user;
  }

  // ✅ Get all users
  static async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
  }

  // ✅ Update profile fields
  static async updateProfile(
    userId: string,
    data: {
      username?: string;
      password?: string;
      avatarUrl?: string;
      email?: string;
    }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);

    const updateData: Record<string, any> = {};
    if (data.username) updateData.username = data.username;
    if (data.email) updateData.email = data.email;
    if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;
    if (data.password) updateData.passwordHash = data.password;

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  // ✅ Upload Avatar to Cloudinary
  static async uploadAvatar(userId: string, fileBuffer: Buffer) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);

    const avatarUrl = await CloudinaryService.uploadImage(
      fileBuffer,
      "avatars"
    );

    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
  }

  // ✅ Get all rooms a user is part of (Simple)
  static async getUserRooms(userId: string) {
    const memberships = await prisma.roomMember.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            owner: { select: { id: true, username: true } },
          },
        },
      },
    });

    return memberships.map((m: any) => ({
      id: m.room.id,
      name: m.room.name,
      owner: m.room.owner,
      createdAt: m.room.createdAt,
      language: m.room.language,
    }));
  }
}
