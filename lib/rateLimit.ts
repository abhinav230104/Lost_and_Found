import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = { default: 100, auth: 10, upload: 20 };

export function rateLimit(req: NextRequest, type: "default" | "auth" | "upload" = "default") {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const key = `${ip}:${type}`;
  const now = Date.now();
  const limit = MAX_REQUESTS[type];

  if (!requestCounts.has(key)) {
    requestCounts.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true };
  }

  const record = requestCounts.get(key)!;

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + WINDOW_MS;
    return { success: true };
  }

  if (record.count >= limit) {
    return { success: false, retryAfter: Math.ceil((record.resetTime - now) / 1000) };
  }

  record.count++;
  return { success: true };
}

export function createRateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": retryAfter.toString() },
    }
  );
}
