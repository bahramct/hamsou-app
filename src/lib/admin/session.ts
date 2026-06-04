// ─────────────────────────────────────────────────────────────────────────────
// admin/session.ts — JWT و کوکی session ادمین (DECISION-036)
//
// کاملاً جدا از session کاربر (hamsoo-session):
//   - کوکی جدا: hamsoo-admin-session
//   - payload جدا: { adminId, roleKey }
// Edge-compatible (jose) — در middleware هم استفاده می‌شود.
//
// نکته: permissionها داخل توکن ذخیره نمی‌شوند؛ در هر request از DB resolve می‌شوند
// تا تغییر نقش/دسترسی فوری اعمال شود (auth-server.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE = "hamsoo-admin-session";
const ADMIN_SESSION_DURATION = "12h"; // session کوتاه‌تر برای پنل مدیریتی

export interface AdminSessionPayload {
  adminId: string;
  roleKey: string;
}

export type AdminSessionResult =
  | { valid: true; payload: AdminSessionPayload }
  | { valid: false; payload: null };

function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "[admin/session] متغیر محیطی NEXTAUTH_SECRET تنظیم نشده است."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(
  payload: AdminSessionPayload
): Promise<string> {
  return await new SignJWT({ adminId: payload.adminId, roleKey: payload.roleKey })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ADMIN_SESSION_DURATION)
    .sign(getJwtSecret());
}

export async function verifyAdminSessionToken(
  token: string
): Promise<AdminSessionResult> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const adminId = payload.adminId as string | undefined;
    const roleKey = payload.roleKey as string | undefined;
    if (!adminId || !roleKey) return { valid: false, payload: null };
    return { valid: true, payload: { adminId, roleKey } };
  } catch {
    return { valid: false, payload: null };
  }
}
