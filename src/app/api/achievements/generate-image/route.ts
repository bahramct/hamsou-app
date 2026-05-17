import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/achievements/generate-image?token=xxx
// Generate a social media shareable image for an achievement
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'توکن اشتراک‌گذاری الزامی است' },
        { status: 400 }
      );
    }

    // Find the shared achievement
    const achievement = await db.sharedAchievement.findUnique({
      where: { shareToken: token },
      include: { user: true },
    });

    if (!achievement) {
      return NextResponse.json(
        { error: 'دستاورد یافت نشد' },
        { status: 404 }
      );
    }

    if (!achievement.isActive) {
      return NextResponse.json(
        { error: 'این لینک دیگر فعال نیست' },
        { status: 410 }
      );
    }

    // Check if expired
    if (achievement.expiresAt && achievement.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'این لینک منقضی شده است' },
        { status: 410 }
      );
    }

    // Parse achievement data
    const data = JSON.parse(achievement.data);
    const userName = achievement.user.name || 'کاربر همسو';
    const title = achievement.title || 'دستاورد من در همسو';
    const description = achievement.description || '';

    // Generate SVG based on achievement type
    let svgContent = '';

    switch (achievement.achievementType) {
      case 'commitment':
        svgContent = generateCommitmentSVG(userName, title, description, data);
        break;
      case 'streak':
        svgContent = generateStreakSVG(userName, title, description, data);
        break;
      case 'plan_completed':
        svgContent = generatePlanCompletedSVG(userName, title, description, data);
        break;
      default:
        svgContent = generateDefaultSVG(userName, title, description, data);
    }

    // Return SVG
    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': 'inline; filename="achievement.svg"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating achievement image:', error);
    return NextResponse.json(
      { error: 'خطا در تولید تصویر' },
      { status: 500 }
    );
  }
}

function generateCommitmentSVG(
  userName: string,
  title: string,
  description: string,
  data: any
): string {
  const days = data.days || 1;
  const emoji = '✅';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <!-- Background Gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="800" height="400" fill="url(#bgGradient)" rx="20" ry="20"/>

  <!-- Card -->
  <rect x="40" y="40" width="720" height="320" fill="white" rx="15" ry="15"/>

  <!-- Emoji Icon -->
  <text x="400" y="100" font-size="60" text-anchor="middle">${emoji}</text>

  <!-- Title -->
  <text x="400" y="150" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">
    ${title}
  </text>

  <!-- Description -->
  <text x="400" y="190" font-size="16" text-anchor="middle" fill="#666">
    ${description || 'یک تعهد موفق!'}
  </text>

  <!-- Days Count -->
  <text x="400" y="250" font-size="48" font-weight="bold" text-anchor="middle" fill="#667eea">
    ${days} روز
  </text>

  <!-- User Name -->
  <text x="400" y="300" font-size="14" text-anchor="middle" fill="#999">
    ${userName} | همسو.app
  </text>
</svg>`;
}

function generateStreakSVG(
  userName: string,
  title: string,
  description: string,
  data: any
): string {
  const streakDays = data.streakDays || 0;
  const emoji = streakDays >= 30 ? '🔥' : streakDays >= 7 ? '⚡' : '✨';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <!-- Background Gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="800" height="400" fill="url(#bgGradient)" rx="20" ry="20"/>

  <!-- Card -->
  <rect x="40" y="40" width="720" height="320" fill="white" rx="15" ry="15"/>

  <!-- Emoji Icon -->
  <text x="400" y="100" font-size="60" text-anchor="middle">${emoji}</text>

  <!-- Title -->
  <text x="400" y="150" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">
    ${title || 'رکورد روزهای متوالی!'}
  </text>

  <!-- Description -->
  <text x="400" y="190" font-size="16" text-anchor="middle" fill="#666">
    ${description || 'ادامه بده، عالی‌ستی!'}
  </text>

  <!-- Streak Count -->
  <text x="400" y="250" font-size="48" font-weight="bold" text-anchor="middle" fill="#f5576c">
    ${streakDays} روز متوالی
  </text>

  <!-- User Name -->
  <text x="400" y="300" font-size="14" text-anchor="middle" fill="#999">
    ${userName} | همسو.app
  </text>
</svg>`;
}

function generatePlanCompletedSVG(
  userName: string,
  title: string,
  description: string,
  data: any
): string {
  const planTitle = data.planTitle || 'برنامه';
  const percentage = data.percentage || 100;
  const emoji = '🏆';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <!-- Background Gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="800" height="400" fill="url(#bgGradient)" rx="20" ry="20"/>

  <!-- Card -->
  <rect x="40" y="40" width="720" height="320" fill="white" rx="15" ry="15"/>

  <!-- Emoji Icon -->
  <text x="400" y="100" font-size="60" text-anchor="middle">${emoji}</text>

  <!-- Title -->
  <text x="400" y="150" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">
    ${title || 'برنامه تکمیل شد!'}
  </text>

  <!-- Plan Title -->
  <text x="400" y="190" font-size="18" text-anchor="middle" fill="#666">
    ${planTitle}
  </text>

  <!-- Percentage -->
  <text x="400" y="250" font-size="48" font-weight="bold" text-anchor="middle" fill="#4facfe">
    ${percentage}%
  </text>

  <!-- User Name -->
  <text x="400" y="300" font-size="14" text-anchor="middle" fill="#999">
    ${userName} | همسو.app
  </text>
</svg>`;
}

function generateDefaultSVG(
  userName: string,
  title: string,
  description: string,
  data: any
): string {
  const emoji = '🌟';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <!-- Background Gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="800" height="400" fill="url(#bgGradient)" rx="20" ry="20"/>

  <!-- Card -->
  <rect x="40" y="40" width="720" height="320" fill="white" rx="15" ry="15"/>

  <!-- Emoji Icon -->
  <text x="400" y="100" font-size="60" text-anchor="middle">${emoji}</text>

  <!-- Title -->
  <text x="400" y="150" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">
    ${title || 'دستاورد من'}
  </text>

  <!-- Description -->
  <text x="400" y="190" font-size="16" text-anchor="middle" fill="#666">
    ${description}
  </text>

  <!-- User Name -->
  <text x="400" y="300" font-size="14" text-anchor="middle" fill="#999">
    ${userName} | همسو.app
  </text>
</svg>`;
}
