/**
 * Font Loader for PDF Generation
 * Loads and registers fonts for jsPDF
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { jsPDF } from 'jspdf';

let fontLoaded = false;

/**
 * Load Vazirmatn font from public directory
 */
export function loadVazirmatnFont(doc: jsPDF): void {
  console.log('[FontLoader] loadVazirmatnFont called, fontLoaded:', fontLoaded);
  
  if (fontLoaded) {
    console.log('[FontLoader] Font already loaded, setting Vazirmatn');
    doc.setFont('Vazirmatn');
    return;
  }

  try {
    console.log('[FontLoader] Attempting to load font from:', join(process.cwd(), 'public/fonts/Vazirmatn-Regular.base64'));
    
    // Read font file from public directory (use base64 version for better performance)
    const fontPath = join(process.cwd(), 'public/fonts/Vazirmatn-Regular.base64');
    const fontBase64 = readFileSync(fontPath, 'utf-8').trim();

    console.log('[FontLoader] Font file read, size:', fontBase64.length, 'characters');

    // Add font to jsPDF
    doc.addFileToVFS('Vazirmatn-Regular.ttf', fontBase64);
    doc.addFont('Vazirmatn-Regular.ttf', 'Vazirmatn', 'normal');
    doc.setFont('Vazirmatn');

    fontLoaded = true;

    console.log('[FontLoader] Vazirmatn font loaded successfully');
  } catch (error) {
    console.error('[FontLoader] Error loading Vazirmatn font:', error);
    console.error('[FontLoader] Error stack:', (error as Error).stack);
    // Fall back to default font
    doc.setFont('helvetica');
  }
}

/**
 * Check if font is loaded
 */
export function isFontLoaded(): boolean {
  return fontLoaded;
}
