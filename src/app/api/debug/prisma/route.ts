import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Checking Prisma Client...');

    const debugInfo = {
      dbExists: !!db,
      dbType: typeof db,
      sharedReportExists: !!db.sharedReport,
      sharedReportType: typeof db.sharedReport,
      createExists: typeof db.sharedReport?.create,
      allModels: Object.keys(db).filter(k => !k.startsWith('_')),
    };

    console.log('[DEBUG] Info:', debugInfo);

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
