// src/modules/auth/auth.service.ts
import prisma from "../config/prisma";
import { AppError } from "../utils/appError";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

export class AuthService {
  // ✅ Register
  static async register(
    username: string,
    email: string,
    password: string,
    avatarUrl?: string
  ) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("Email already registered", 400);

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, email, passwordHash: hashed, avatarUrl },
    });

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    return { user, accessToken, refreshToken };
  }

  // ✅ Login user
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash)
      throw new AppError("Invalid credentials", 401);

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw new AppError("Invalid credentials", 401);

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    return { user, accessToken, refreshToken };
  }

  // ✅ Refresh token
  static async refresh(token: string) {
    try {
      const payload = verifyRefreshToken(token) as any;
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user) throw new AppError("Invalid user", 401);

      const accessToken = signAccessToken({ userId: user.id });
      const refreshToken = signRefreshToken({ userId: user.id });

      return { accessToken, refreshToken };
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }
  }

  // ✅ Get Profile
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
}
