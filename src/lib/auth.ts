import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file.');
}

/**
 * بررسی و تأیید توکن JWT از درخواست
 * @param request - درخواست Next.js
 * @returns آبجکت کاربر شامل id و phone یا null در صورت خطا
 */
export async function verifyToken(request: NextRequest): Promise<{ userId: string; phone: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };

    return {
      userId: decoded.userId,
      phone: decoded.phone,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * ساخت توکن JWT برای کاربر
 * @param userId - شناسه کاربر
 * @param phone - شماره تلفن کاربر
 * @returns توکن JWT
 */
export function createToken(userId: string, phone: string): string {
  return jwt.sign(
    { userId, phone },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * توکن را بدون نیاز به درخواست تأیید می‌کند
 * @param token - توکن JWT
 * @returns آبجکت کاربر یا null در صورت خطا
 */
export function verifyTokenString(token: string): { userId: string; phone: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}
