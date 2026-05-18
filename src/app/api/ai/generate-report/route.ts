import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { startOfWeek, startOfMonth, format } from 'date-fns';

const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';

// Validation schema
const generateReportRequestSchema = z.object({
  type: z.enum(['weekly', 'monthly']),
  date: z.string().optional(), // فرمت: YYYY-MM-DD
});

// Helper function
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // 2. Validation
    const body = await request.json();
    const { type, date } = generateReportRequestSchema.parse(body);

    // 3. محاسبه تاریخ شروع گزارش
    const reportDate = date ? new Date(date) : new Date();

    let reportStart: Date;
    let reportType: string;

    if (type === 'weekly') {
      reportStart = startOfWeek(reportDate, { weekStartsOn: 6 }); // شنبه = 6
      reportType = 'هفتگی';
    } else {
      reportStart = startOfMonth(reportDate);
      reportType = 'ماهانه';
    }

    // 4. تولید گزارش با AI (فقط با context کاربر)
    let response;
    if (type === 'weekly') {
      response = await aiService.generateWeeklyReport(decoded.userId, reportStart);
    } else {
      response = await aiService.generateMonthlyReport(decoded.userId, reportStart);
    }

    return NextResponse.json({
      success: true,
      report: {
        type,
        startDate: format(reportStart, 'yyyy-MM-dd'),
        content: response.content,
        usage: response.usage,
        model: response.model,
      },
    });

  } catch (error: any) {
    console.error('[API] Generate Report Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'خطا در ورودی‌ها',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'خطا در تولید گزارش',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // 2. اطلاعات endpoint
    return NextResponse.json({
      success: true,
      endpoint: '/api/ai/generate-report',
      method: 'POST',
      description: 'تولید گزارش هفتگی یا ماهانه با AI',
      parameters: {
        type: {
          type: 'enum',
          values: ['weekly', 'monthly'],
          required: true,
          description: 'نوع گزارش (هفتگی یا ماهانه)',
        },
        date: {
          type: 'string',
          format: 'YYYY-MM-DD',
          required: false,
          description: 'تاریخ گزارش (پیش‌فرض: امروز)',
        },
      },
      example: {
        weekly: {
          type: 'weekly',
          date: '2025-01-20',
        },
        monthly: {
          type: 'monthly',
          date: '2025-01-01',
        },
      },
    });

  } catch (error: any) {
    console.error('[API] Generate Report GET Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'خطا در دریافت اطلاعات',
      },
      { status: 500 }
    );
  }
}
