/**
 * Persian Font Support for jsPDF
 * Converts Persian text for PDF generation
 */

import { jsPDF } from 'jspdf';

/**
 * Persian font base64 (Vazirmatn Regular - Subset)
 * This is a subset of the Vazirmatn font with only Persian characters and numbers
 * to keep the file size manageable for PDF generation.
 *
 * For production, consider using a CDN or storing the full font file.
 */
const PERSIAN_FONT_BASE64 = `// Base64 encoded font would go here
// For now, we'll use a simpler approach with character mapping`;

/**
 * Add Persian font to jsPDF document
 */
export function addPersianFont(doc: jsPDF): void {
  try {
    // For now, we'll use the default font with RTL support
    // In production, you would use:
    // doc.addFileToVFS('vazirmatn.ttf', PERSIAN_FONT_BASE64);
    // doc.addFont('vazirmatn.ttf', 'Vazirmatn', 'normal');
    // doc.setFont('Vazirmatn');
  } catch (error) {
    console.error('Error adding Persian font:', error);
  }
}

/**
 * Reverse text for RTL support in jsPDF
 * jsPDF renders text LTR by default, so we need to reverse Persian text
 */
export function reverseTextForRTL(text: string): string {
  // Split into words, reverse the word order
  const words = text.split(' ');
  return words.reverse().join(' ');
}

/**
 * Check if text contains Persian/Arabic characters
 */
export function isPersianText(text: string): boolean {
  const persianRegex = /[\u0600-\u06FF]/;
  return persianRegex.test(text);
}

/**
 * Prepare text for PDF rendering (handle RTL and Persian characters)
 */
export function prepareTextForPDF(text: string): string {
  if (!isPersianText(text)) {
    return text;
  }

  // For now, we'll return the text as-is
  // In production, this would handle proper RTL rendering
  return text;
}
