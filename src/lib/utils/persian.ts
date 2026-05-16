/**
 * Utility functions for Persian (Farsi) text and number formatting
 */

/**
 * Convert English numbers to Persian numbers
 * @param num - The number or string to convert
 * @returns String with Persian numbers
 */
export function toPersianNumber(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

/**
 * Format a number with Persian thousands separator
 * @param num - The number to format
 * @returns Formatted Persian number string
 */
export function formatPersianNumber(num: number): string {
  return toPersianNumber(num.toLocaleString('en-US'));
}
