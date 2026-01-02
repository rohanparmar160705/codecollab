// src/middlewares/tokenBucket.middleware.ts
import { Request, Response, NextFunction } from "express";

const memoryStore = new Map<string, { count: number; expiresAt: number }>();

export function limitPerWindow({ key, windowSec, max }: { key: (req: Request) => string; windowSec: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const k = key(req);
      if (!k) return next();

      const now = Date.now();
      const record = memoryStore.get(k);

      if (record && record.expiresAt > now) {
        if (record.count >= max) {
          const ttl = Math.ceil((record.expiresAt - now) / 1000);
          res.setHeader("Retry-After", String(ttl));
          return res.status(429).json({ message: "Rate limit exceeded" });
        }
        record.count++;
      } else {
        memoryStore.set(k, { count: 1, expiresAt: now + windowSec * 1000 });
      }

      // Cleanup old entries occasionally (simple probability check)
      if (Math.random() < 0.01) {
        for (const [key, val] of memoryStore.entries()) {
          if (val.expiresAt <= now) memoryStore.delete(key);
        }
      }

      return next();
    } catch (e) {
      return next();
    }
  };
}
