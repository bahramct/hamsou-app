import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST-PDF] Request received');

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    const stream = new Writable({
      write(chunk: Buffer, encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    doc.pipe(stream);

    // Test basic text
    doc.fontSize(24).text('Test PDF', 50, 50, { align: 'center' });
    doc.fontSize(12).text('This is a test PDF document', 50, 100);
    doc.fontSize(14).text('تست متن فارسی', 50, 150);

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      stream.on('finish', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    console.log('[TEST-PDF] PDF generated successfully');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test.pdf"',
      },
    });
  } catch (error) {
    console.error('[TEST-PDF] Error:', error);
    console.error('[TEST-PDF] Stack:', (error as Error).stack);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
