# Mobile — استراتژی موبایل همسو

> **زمینه:** مانیفست §۱۰ فاز ۳ — «موبایل (PWA یا React Native)». تصمیم نهایی به این سند موکول شده است.
> **هدف این سند:** scope مقایسه گزینه‌ها، تصمیم پیشنهادی، و درخت تسک متناسب.
> **منبع:** DECISION-027

---

## ۱. تصمیم اصلی — PWA-first، RN-later

### تحلیل گزینه‌ها

| معیار | PWA | React Native | Capacitor (Hybrid) |
|-------|-----|--------------|--------------------|
| استفاده مجدد کد | ۹۰٪+ از Next.js | ۳۰-۵۰٪ (فقط منطق) | ۸۰٪+ |
| نزدیکی به Native UX | متوسط | عالی | خوب |
| سرعت توسعه فاز اول | 🟢 سریع | 🔴 کند | 🟡 متوسط |
| Push Notification | ✅ (Web Push) | ✅ (FCM/APNs) | ✅ |
| Offline | ✅ (Service Worker) | ✅ | ✅ |
| App Store / Google Play | ⚠️ غیرمستقیم (TWA) | ✅ مستقیم | ✅ مستقیم |
| ایران: محدودیت دانلود | 🟢 ندارد (وب) | 🔴 Play Store محدود، APK جدا | 🔴 همانند RN |
| Maintenance | یک codebase | دو codebase | یک codebase + native shell |

### پیشنهاد (DECISION-027)
**فاز ۳-A:** PWA کامل (manifest، service worker، web push، offline)
**فاز ۳-B (اگر نیاز بود):** Capacitor wrapper برای پخش در stores
**فاز ۴ (در صورت نیاز عمیق به native):** ارزیابی React Native — فقط اگر PWA کفایت نکرد

**چرا:**
- ایران ⇒ دانلود از store دشوار است؛ PWA با URL سریع‌تر در دسترس
- یک codebase، یک تیم، صرفه‌جویی منابع
- اگر بعداً RN لازم شد، Adapter pattern موجود انتقال منطق را آسان می‌کند

---

## ۲. اصول طراحی PWA همسو

| اصل | معنا |
|-----|-------|
| **Mobile-first از همان فاز ۱** | UI همه صفحات از روز اول باید روی موبایل کار کند (الان هم رعایت می‌شود) |
| **Offline-first برای ثبت تعهد** | حتی بدون اینترنت، کاربر تعهد روزانه را ثبت کند — همگام‌سازی بعداً |
| **Web Push اختیاری** | یادآوری‌ها از طریق Web Push (TASK-NOTIF-* یکپارچه) |
| **Install Prompt محترمانه** | فقط یک بار، در زمان مناسب، با امکان dismiss دائمی |
| **Persian + RTL Native Feel** | فونت PelakFA، scroll و gesture فارسی-دوست |

---

## ۳. درخت تسک

### TASK-MOBILE-PWA | تبدیل به PWA کامل
- **فاز:** ۳
- **اولویت:** 🟠 High (همه فیچرهای فاز ۱-۲ روی موبایل بهتر دیده شوند)
- **وابستگی:** فاز ۲ پایدار، TASK-NOTIF-* (برای Web Push)

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-MOBILE-01 | افزودن `manifest.webmanifest` با آیکون‌ها، theme color، name فارسی |
| TASK-MOBILE-02 | Service Worker با Workbox: cache strategies (CacheFirst برای static، NetworkFirst برای API) |
| TASK-MOBILE-03 | Offline page زیبا برای زمانی که API در دسترس نیست |
| TASK-MOBILE-04 | Background Sync برای ثبت تعهد آفلاین (queue → flush هنگام آنلاین) |
| TASK-MOBILE-05 | یکپارچگی Web Push با NotificationAdapter (لینک TASK-NOTIF) |
| TASK-MOBILE-06 | Install Prompt component (با cooldown ۷ روز پس از dismiss) |
| TASK-MOBILE-07 | تست کامل: lighthouse PWA score ≥ 90، نصب موفق روی Android/iOS |
| TASK-MOBILE-08 | بهینه‌سازی فونت: subset PelakFA + preload + font-display swap |
| TASK-MOBILE-09 | gestures: pull-to-refresh روی داشبورد، swipe در تاریخچه |
| TASK-MOBILE-10 | viewport و safe-area برای iPhone (notch) |

### TASK-MOBILE-CAPACITOR | Wrapper برای Stores (اختیاری، فاز ۳-B)
- **اولویت:** 🟡 Medium
- **شرط:** اگر توزیع از طریق store مفید تشخیص داده شد

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-MOBILE-CAP-01 | راه‌اندازی Capacitor + build pipeline |
| TASK-MOBILE-CAP-02 | تست native push (FCM) به جای Web Push در bundle native |
| TASK-MOBILE-CAP-03 | publish روی Bazaar / Myket (ایران-first) |
| TASK-MOBILE-CAP-04 | Google Play / App Store (در صورت امکان) |

### TASK-MOBILE-RN | React Native (اگر لازم شد، فاز ۴+)
- **شرط:** فقط اگر PWA + Capacitor کفایت نکرد. در حال حاضر در backlog به عنوان placeholder.

---

## ۴. تعارض با مانیفست — هیچ

PWA هیچ تعارضی ندارد. هشدار: نوتیفیکیشن‌های native نباید به «فشار» تبدیل شوند (DECISION-023).

---

*آخرین بروزرسانی: ۲۰۲۶-۰۵-۲۷ — ساخت اولیه*
