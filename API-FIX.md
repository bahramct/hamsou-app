# رفع مشکل ارور 500 در API

## مشکل

در سیستم محلی (VSCode CLI)، هنگام ارسال کد OTP ارور 500 دریافت می‌شد، اما در preview panel مشکلی وجود نداشت.

## علل اصلی

1. **Middleware منسوخ شده**: فایل `src/middleware.ts` با فرمت قدیمی Next.js ایجاد شده بود که در Next.js 16 پشتیبانی نمی‌شود.
2. **Relative URL در API Route**: در `api/reports/generate/route.ts` از `/api/ai/chat` استفاده شده بود که در سمت سرور (Server Side) کار نمی‌کند و باید absolute URL استفاده شود.
3. **IPv6 vs IPv4**: در برخی موارد، curl با IPv6 به سرور وصل می‌شد و response را کامل دریافت نمی‌کرد.

## راه‌حل‌ها

### 1. حذف Middleware
```bash
rm src/middleware.ts
```

Middleware در نسخه MVP نیازی نبود و باعث خطای "Cannot find the middleware module" می‌شد.

### 2. استفاده از Absolute URL در API Routes
**قبل از:**
```typescript
const aiResponse = await fetch('/api/ai/chat', {
```

**بعد از:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const aiResponse = await fetch(`${baseUrl}/api/ai/chat`, {
```

### 3. ایجاد API Helper
فایل `src/lib/api.ts` ایجاد شد که شامل:
- `apiFetch()` - wrapper برای fetch با error handling بهتر
- `apiPost()` - helper برای POST requests
- `apiGet()` - helper برای GET requests
- `authApiPost()` - helper برای authenticated POST requests
- `authApiGet()` - helper برای authenticated GET requests
- `getToken()`, `setToken()`, `clearToken()` - مدیریت token
- `getUser()`, `setUser()` - مدیریت user
- `isAuthenticated()` - بررسی احراز هویت

این helperها به:
- مدیریت بهتر خطاها
- جلوگیری از تکرار کد
- استفاده یکنواخت از token در همه درخواست‌ها
- پیام‌های خطای واضح‌تر

کمک می‌کنند.

### 4. بهبود Error Handling در Client
**قبل از:**
```typescript
try {
  const res = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'خطا در ارسال کد');
  }
  // ...
} catch (err: any) {
  setError(err.message);
}
```

**بعد از:**
```typescript
try {
  const data = await apiPost('/api/auth/send-otp', { phone });
  // ...
} catch (err: any) {
  console.error('Send OTP Error:', err);

  if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
    setError('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
  } else if (err.message.includes('500')) {
    setError('خطای داخلی سرور. لطفاً کمی صبر کنید و دوباره تلاش کنید.');
  } else {
    setError(err.message || 'خطا در ارسال کد تأیید');
  }
}
```

## تست سیستم

### تست با curl
```bash
# ارسال OTP
curl -4 -X POST http://127.0.0.1:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'

# تأیید OTP
curl -X POST http://127.0.0.1:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789","code":"1234"}'

# دریافت گزارش هفتگی (با token)
curl http://127.0.0.1:3000/api/reports/weekly \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### تست با اسکریپت
```bash
bun run scripts/test-api.ts
```

## نتیجه

- ✅ همه APIها درست کار می‌کنند
- ✅ Error handling بهبود یافته است
- ✅ پیام‌های خطای واضح‌تر
- ✅ کد تمیزتر و قابل نگهداری بیشتر
- ✅ مشکل ارور 500 حل شده است

## نکات مهم

1. **همیشه از absolute URL در API Routes استفاده کنید** هنگام فراخوانی APIهای دیگر از سمت سرور.
2. **Middleware در Next.js 16 فرمت جدیدی دارد** - اگر نیاز به middleware دارید، از مستندات جدید استفاده کنید.
3. **IPv4 را در curl استفاده کنید** (`-4` flag) برای اطمینان از اتصال صحیح.
4. **Error handling جامع داشته باشید** - هم در سمت کلاینت، هم در سمت سرور.
5. **از helperها و wrapperها استفاده کنید** برای جلوگیری از تکرار کد و مدیریت بهتر.

## تغییرات فایل‌ها

- ✅ `src/lib/api.ts` - جدید ایجاد شد
- ✅ `src/app/(auth)/login/page.tsx` - بهبود error handling
- ✅ `src/app/page.tsx` - استفاده از API helper
- ✅ `src/app/reports/page.tsx` - استفاده از API helper
- ✅ `src/app/api/reports/generate/route.ts` - استفاده از absolute URL
- ❌ `src/middleware.ts` - حذف شد
