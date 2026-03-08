/**
 * Persistent OTP store for serverless deploy.
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set;
 * otherwise falls back to in-memory for local dev.
 */

import { generateOtp as generateOtpCode } from "@/lib/otp-store";

const OTP_TTL_SEC = 5 * 60; // 5 minutes
const OTP_KEY_PREFIX = "khethai:otp:";
const MAX_ATTEMPTS = 3;

type OtpEntry = { otp: string; expiresAt: number; attempts: number };

let redisInstance: ReturnType<typeof createRedis> | null | undefined;

function createRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis");
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

function getRedis() {
  if (redisInstance === undefined) redisInstance = createRedis();
  return redisInstance;
}

// In-memory fallback (for local dev when Redis is not configured)
const memoryStore = new Map<string, OtpEntry>();

export async function storeOtp(phone: string, otp: string): Promise<void> {
  const entry: OtpEntry = {
    otp,
    expiresAt: Date.now() + OTP_TTL_SEC * 1000,
    attempts: 0,
  };

  const redis = getRedis();
  if (redis) {
    const key = `${OTP_KEY_PREFIX}${phone}`;
    await redis.set(key, JSON.stringify(entry), { ex: OTP_TTL_SEC });
    return;
  }

  memoryStore.set(phone, entry);
}

export async function verifyOtp(
  phone: string,
  otp: string
): Promise<{ valid: boolean; error?: string }> {
  const redis = getRedis();
  if (redis) {
    const key = `${OTP_KEY_PREFIX}${phone}`;
    const raw = await redis.get<string>(key);
    if (!raw) {
      return { valid: false, error: "OTP expired or not found. Please request a new one." };
    }
    let entry: OtpEntry;
    try {
      entry = typeof raw === "string" ? (JSON.parse(raw) as OtpEntry) : (raw as OtpEntry);
    } catch {
      await redis.del(key);
      return { valid: false, error: "OTP expired or not found. Please request a new one." };
    }

    if (Date.now() > entry.expiresAt) {
      await redis.del(key);
      return { valid: false, error: "OTP has expired. Please request a new one." };
    }
    if (entry.attempts >= MAX_ATTEMPTS) {
      await redis.del(key);
      return { valid: false, error: "Too many attempts. Please request a new OTP." };
    }
    if (entry.otp !== otp) {
      entry.attempts++;
      const ttlRemaining = Math.max(1, Math.floor((entry.expiresAt - Date.now()) / 1000));
      await redis.set(key, JSON.stringify(entry), { ex: ttlRemaining });
      return {
        valid: false,
        error: `Incorrect OTP. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.`,
      };
    }
    await redis.del(key);
    return { valid: true };
  }

  // In-memory fallback
  const entry = memoryStore.get(phone);
  if (!entry) {
    return { valid: false, error: "OTP expired or not found. Please request a new one." };
  }
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(phone);
    return { valid: false, error: "OTP has expired. Please request a new one." };
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    memoryStore.delete(phone);
    return { valid: false, error: "Too many attempts. Please request a new OTP." };
  }
  if (entry.otp !== otp) {
    entry.attempts++;
    return {
      valid: false,
      error: `Incorrect OTP. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.`,
    };
  }
  memoryStore.delete(phone);
  return { valid: true };
}

/** Re-export for API routes that need to generate OTP. */
export function generateOtp(): string {
  return generateOtpCode();
}
