import Redis from "ioredis";
import { logger } from "../utils/logger";

// Default to localhost if not provided
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

if (!process.env.REDIS_URL && process.env.NODE_ENV === "production") {
  logger.error(
    "❌ CRTICAL ERROR: REDIS_URL is not defined in production environment!"
  );
  logger.error(
    "Application cannot start without Redis. Exiting to trigger restart..."
  );
  process.exit(1);
}

class RedisManager {
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  constructor() {
    this.client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.subscriber = new Redis(REDIS_URL);
    this.publisher = new Redis(REDIS_URL);

    this.client.on("error", (err) => {
      logger.error("❌ Redis Client Error", err);
      // In production, consecutive errors should potentially kill the app to reset connection state
      if (
        process.env.NODE_ENV === "production" &&
        err.message.includes("ECONNREFUSED")
      ) {
        process.exit(1);
      }
    });
    this.client.on("connect", () => logger.info("✅ Redis Client Connected"));
  }

  /**
   * Get the main Redis client (for get/set)
   */
  getClient() {
    return this.client;
  }

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, message: any) {
    const payload =
      typeof message === "string" ? message : JSON.stringify(message);
    return this.publisher.publish(channel, payload);
  }

  /**
   * Subscribe to a channel with a callback
   */
  async subscribe(channel: string, callback: (message: any) => void) {
    await this.subscriber.subscribe(channel);
    this.subscriber.on("message", (chan, msg) => {
      if (chan === channel) {
        try {
          callback(JSON.parse(msg));
        } catch {
          callback(msg);
        }
      }
    });
  }

  /**
   * Cache a value with optional expiry
   */
  async set(key: string, value: any, ttlSeconds?: number) {
    const val = JSON.stringify(value);
    if (ttlSeconds) {
      return this.client.setex(key, ttlSeconds, val);
    }
    return this.client.set(key, val);
  }

  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const val = await this.client.get(key);
    if (!val) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  }

  /**
   * Graceful shutdown
   */
  async quit() {
    await Promise.all([
      this.client.quit(),
      this.subscriber.quit(),
      this.publisher.quit(),
    ]);
  }
}

export const redis = new RedisManager();
