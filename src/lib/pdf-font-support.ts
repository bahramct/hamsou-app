/**
 * PDF Font Support for Persian/Arabic
 * Provides proper font support for jsPDF
 */

import { jsPDF } from 'jspdf';

/**
 * Initialize Persian font support
 */
export function initPersianFont(doc: jsPDF): void {
  try {
    // Try to use a font that supports UTF-8
    // For now, we use the default font
    // In production, load Vazirmatn or Noto Sans Arabic font
    doc.setFont('helvetica');
  } catch (error) {
    console.error('Error initializing Persian font:', error);
  }
}

/**
 * Check if we can render Persian text properly
 */
export function canRenderPersian(): boolean {
  // In production, check if Persian font is loaded
  return false;
}

/**
 * Get fallback text for Persian (when font not available)
 */
export function getPersianFallback(originalText: string): string {
  // For now, return original text
  // In production, this would return English translation or transliteration
  return originalText;
}
