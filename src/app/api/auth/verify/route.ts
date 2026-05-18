import { NextResponse } from 'next/server';
import { verifyTokenString } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyTokenString(token);

    if (!decoded) {
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: decoded.userId,
        phone: decoded.phone
      }
    });
  } catch (error: any) {
    console.error('Token verification failed:', error);
    return NextResponse.json(
      { valid: false, error: 'Invalid token' },
      { status: 401 }
    );
  }
}
