// ─────────────────────────────────────────────────────────────────────────────
// Session utilities — همسو
// ساخت و بررسی JWT با کتابخانه jose (Edge-compatible)
// ─────────────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload, SessionResult } from "@/types/auth";

const SESSION_COOKIE = "hamsoo-session";
const SESSION_DURATION = "30d";

function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "[session] متغیر محیطی NEXTAUTH_SECRET تنظیم نشده است. .env.local را بررسی کن."
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * ساخت JWT برای یک کاربر
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ userId: payload.userId, phone: payload.phone })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getJwtSecret());
}

/**
 * بررسی و decode یک JWT
 */
export async function verifySessionToken(token: string): Promise<SessionResult> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userId = payload.userId as string | undefined;
    const phone = payload.phone as string | undefined;

    if (!userId || !phone) return { valid: false, payload: null };

    return { valid: true, payload: { userId, phone } };
  } catch {
    return { valid: false, payload: null };
  }
}

// نام cookie — صادر می‌شود تا middleware هم از همین مقدار استفاده کند
export { SESSION_COOKIE };
