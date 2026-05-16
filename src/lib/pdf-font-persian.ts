/**
 * Persian Font Helper for jsPDF
 * Provides Persian character support for PDF generation
 */

// Persian characters mapping (basic)
// This is a workaround - in production, use proper font files
const PERSIAN_CHARS = {
  'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 'th',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd',
  'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's',
  'ش': 'sh', 'ص': 'sa', 'ض': 'da', 'ط': 'ta', 'ظ': 'za',
  'ع': 'aa', 'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k',
  'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v',
  'ه': 'h', 'ی': 'y', 'آ': 'aa', 'ء': "'",
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٪': '%', '،': ',', '؛': ';', '؟': '?', '«': '"',
  '»': '"', '‌': ' ', '‌‌': ' ', '‌‌‌': ' ',
};

/**
 * Check if character is Persian
 */
export function isPersianChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 0x0600 && code <= 0x06FF) ||
         (code >= 0xFB50 && code <= 0xFDFF) ||
         (code >= 0xFE70 && code <= 0xFEFF) ||
         char === '۰' || char === '۱' || char === '۲' ||
         char === '۳' || char === '۴' || char === '۵' ||
         char === '۶' || char === '۷' || char === '۸' ||
         char === '۹';
}

/**
 * Transliterate Persian text to Latin (for PDF rendering)
 * This is a workaround until proper font support is added
 */
export function transliteratePersian(text: string): string {
  return text.split('').map(char => {
    return PERSIAN_CHARS[char as keyof typeof PERSIAN_CHARS] || char;
  }).join('');
}

/**
 * Get Persian display text (returns Latin transliteration for now)
 * TODO: Add proper font support in production
 */
export function getPDFText(text: string): string {
  // For now, transliterate Persian to Latin
  // In production, use proper Persian font
  return transliteratePersian(text);
}

/**
 * Format Persian number for PDF
 */
export function getPDFNumber(num: number): string {
  return num.toString();
}
