/**
 * GET /api/analytics/export/templates
 * Returns available PDF report templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAvailableTemplates } from '@/lib/pdf-template-types';

export async function GET(request: NextRequest) {
  try {
    const templates = getAvailableTemplates();

    return NextResponse.json({
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست قالب‌ها' },
      { status: 500 }
    );
  }
}
