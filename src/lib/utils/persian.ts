/**
 * تبدیل اعداد انگلیسی به فارسی
 */
export function toPersianNumber(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const str = String(num);
  return str.replace(/\d/g, (digit) => persianDigits[parseInt(digit, 10)]);
}

/**
 * فرمت کردن عدد با جداکننده هزارگان فارسی
 */
export function formatPersianNumber(num: number | string): string {
  const numStr = String(num).replace(/,/g, '');
  const number = parseInt(numStr, 10);
  if (isNaN(number)) return toPersianNumber(numStr);

  // جدا کردن هزارگان
  const withCommas = number.toLocaleString('en-US');
  return toPersianNumber(withCommas);
}
