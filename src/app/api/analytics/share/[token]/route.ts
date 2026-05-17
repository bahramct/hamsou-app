/**
 * GET /api/analytics/share/[token]
 * Get a shared report by token
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Find shared report
    const sharedReport = await db.sharedReport.findUnique({
      where: { shareToken: token },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!sharedReport) {
      return NextResponse.json({ error: 'گزارش یافت نشد' }, { status: 404 });
    }

    // Check if report is active
    if (!sharedReport.isActive) {
      return NextResponse.json({ error: 'این گزارش منقضی شده است' }, { status: 410 });
    }

    // Check expiration
    if (sharedReport.expiresAt && new Date() > sharedReport.expiresAt) {
      // Deactivate expired report
      await db.sharedReport.update({
        where: { id: sharedReport.id },
        data: { isActive: false },
      });
      return NextResponse.json({ error: 'این گزارش منقضی شده است' }, { status: 410 });
    }

    // Check max views
    if (sharedReport.maxViews && sharedReport.views >= sharedReport.maxViews) {
      await db.sharedReport.update({
        where: { id: sharedReport.id },
        data: { isActive: false },
      });
      return NextResponse.json({ error: 'این گزارش به حداکثر تعداد بازدید رسیده است' }, { status: 410 });
    }

    // Increment view count
    await db.sharedReport.update({
      where: { id: sharedReport.id },
      data: { views: { increment: 1 } },
    });

    // Parse report data
    const reportData = JSON.parse(sharedReport.data);

    return NextResponse.json({
      success: true,
      report: {
        id: sharedReport.id,
        title: sharedReport.title,
        description: sharedReport.description,
        reportType: sharedReport.reportType,
        data: reportData,
        createdAt: sharedReport.createdAt,
        expiresAt: sharedReport.expiresAt,
        views: sharedReport.views + 1,
        maxViews: sharedReport.maxViews,
        hasPassword: !!sharedReport.password,
      },
    });
  } catch (error) {
    console.error('Error getting shared report:', error);
    return NextResponse.json({ error: 'خطا در دریافت گزارش' }, { status: 500 });
  }
}
