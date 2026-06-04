# Social Network — همسوگرام (رشد جمعی، نه رقابت)

> **زمینه:** قابلیت اشتراک‌گذاری نمودار پیشرفت، دعوت دوستان به چالش‌های مفید، تعاملات اجتماعی با محوریت **همسویی** (نه رقابت).
> **چالش بزرگ:** این فیچر مستقیم با CLAUDE.md §۱ در تنش است (❌ بدون استریک، امتیاز، مدال، رقابت).
> **هدف این سند:** طراحی شبکه اجتماعی که اصل «بدون رقابت، بدون قضاوت» را نقض نکند.
> **منبع:** DECISION-025، فاز ۳ مانیفست (همسوگرام)

---

## ۱. اصل بنیادین — «همسویی، نه مسابقه»

| همسویی (✅) | رقابت (❌ — خط قرمز) |
|-------------|----------------------|
| «من و دوستم هر دو این هفته به تعهداتمان نگاه می‌کنیم» | «من ۵ روز پشت سر هم انجام دادم، تو ۳ روز» |
| اشتراک «نمودار خودم» با دوست | leaderboard، رتبه |
| چالش گروهی برای موضوع مشترک («هفته بدون تلگرام») | کسی که اول تموم کرد برنده است |
| همراهی، حضور | امتیاز، مدال، نشان |
| نشان دادن «من اینجام» | نشان دادن «من بهترم» |

**DECISION-025** این مرز را توضیح می‌دهد و الزامی می‌کند.

---

## ۲. حریم خصوصی — Opt-in سختگیرانه

| سطح | پیش‌فرض |
|-----|---------|
| همه چیز خصوصی | ✅ پیش‌فرض هر کاربر |
| اشتراک گزارش هفتگی | فقط با URL یک‌بار مصرف (TASK-012) |
| پروفایل عمومی | باید صریحاً enable شود |
| دوست‌یابی | فقط با invite کد، نه جستجو |
| نمایش تعهدهای روزانه | **هرگز** قابل اشتراک عمومی نیست (فقط aggregate در نمودار) |

---

## ۳. ۴ ساب‌سیستم

### A. اشتراک گزارش هفتگی (Report Sharing)
نقطه شروع — یک URL یک‌بار مصرف (یا با expiry) که نمودار + خلاصه فارسی AI را نشان می‌دهد. کاربر بازدیدکننده نیازی به حساب ندارد.

### B. سیستم دوستی (Friendship)
- دعوت با کد یا لینک (نه search by phone)
- accept/reject
- فقط دو طرف می‌توانند فعالیت‌های یکدیگر را ببینند

### C. چالش‌های گروهی (Group Challenges)
- یک کاربر یک «چالش» می‌سازد (موضوع + بازه)
- دعوت دوستان
- هر کس فقط پیشرفت **خود** را می‌بیند + indicator «همه فعال هستند»
- بدون رتبه‌بندی

### D. حلقه‌های همسویی (Hamsoo Circles) — اختیاری در فاز ۳+
- گروه‌های کوچک (۳-۵ نفر)
- هفته‌ای یک «جمع‌بندی همسویی» (آیا همه به تعهداتشان رسیدند؟ — فقط درصد aggregate، نه فردی)
- دسترسی فقط با invite

---

## ۴. مدل داده

```
ProfileVisibility
├── userId
├── isPublic: Boolean
├── displayName: String?
├── bio: String?
└── shareToken: String?  ← برای /u/<token>

Friendship
├── id
├── requesterUserId
├── recipientUserId
├── status: String  ← PENDING | ACCEPTED | BLOCKED
├── createdAt
└── respondedAt: DateTime?

Challenge
├── id
├── ownerUserId
├── title: String
├── description: String
├── startDate, endDate
├── visibility: String  ← FRIENDS_ONLY | INVITE_ONLY
├── createdAt

ChallengeParticipant
├── id
├── challengeId
├── userId
├── joinedAt
└── progress: Int  ← 0-100 (فقط درصد کلی، نه جزئیات)

Circle (فاز ۳+)
├── id
├── name
├── createdByUserId
└── createdAt

CircleMember
├── id
├── circleId
├── userId
└── joinedAt

ShareLink (برای /u/<token> یا /r/<token>)
├── id
├── userId
├── type: String  ← PROFILE | WEEKLY_REPORT
├── targetRef: String?  ← اگر report، ID آن
├── token: String  ← cuid
├── expiresAt: DateTime?
├── viewCount: Int
└── createdAt
```

---

## ۵. درخت تسک

### TASK-SOCIAL-MVP | اشتراک گزارش (پایه)
- **فاز:** ۲ (نقطه شروع — جایگزین TASK-012)
- **اولویت:** 🟡 Medium
- **وابستگی:** TASK-009 (گزارش هفتگی)

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-SOCIAL-MVP-01 | مدل ShareLink + helper generation |
| TASK-SOCIAL-MVP-02 | API: ساخت/ابطال link از داشبورد |
| TASK-SOCIAL-MVP-03 | route عمومی `/r/<token>` — نمایش گزارش (read-only) |
| TASK-SOCIAL-MVP-04 | UI «اشتراک گزارش» در صفحه گزارش هفتگی |
| TASK-SOCIAL-MVP-05 | analytics: viewCount (بدون tracking بازدیدکننده) |
| TASK-SOCIAL-MVP-06 | OG image تولید pendant («نمودار همسویی هفته») |

### TASK-SOCIAL-PROFILE | پروفایل عمومی
- **فاز:** ۳
- **وابستگی:** TASK-PROFILE-FULL، TASK-SOCIAL-MVP

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-SOCIAL-PROF-01 | مدل ProfileVisibility |
| TASK-SOCIAL-PROF-02 | UI تنظیمات: enable پروفایل عمومی |
| TASK-SOCIAL-PROF-03 | route عمومی `/u/<token>` |
| TASK-SOCIAL-PROF-04 | کنترل دقیق چه چیزی نمایش داده شود (فقط aggregate) |

### TASK-SOCIAL-FRIENDS | دوستی
- **فاز:** ۳
- **وابستگی:** TASK-SOCIAL-PROFILE

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-SOCIAL-FR-01 | مدل Friendship |
| TASK-SOCIAL-FR-02 | دعوت با کد/لینک (نه جستجو by phone) |
| TASK-SOCIAL-FR-03 | accept/reject + لیست دوستان |
| TASK-SOCIAL-FR-04 | block + گزارش (تعارض اجتماعی) |
| TASK-SOCIAL-FR-05 | feed (فقط aggregate دوستان فعال این هفته — نه جزئیات تعهد) |

### TASK-SOCIAL-CHALLENGES | چالش‌های گروهی
- **فاز:** ۳
- **وابستگی:** TASK-SOCIAL-FRIENDS، TASK-PLAN-* (پلن یک پشتوانه طبیعی برای چالش است)
- **هشدار:** تعارض با §۱ — DECISION-025 الزامی

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-SOCIAL-CH-01 | مدل Challenge + ChallengeParticipant |
| TASK-SOCIAL-CH-02 | UI ساخت چالش (موضوع، بازه، دعوت دوستان) |
| TASK-SOCIAL-CH-03 | UI نمایش چالش — **فقط** پیشرفت خود کاربر + «همه فعال هستند» indicator |
| TASK-SOCIAL-CH-04 | محافظ آنتی-رقابت: هیچ رتبه‌بندی، هیچ امتیاز |
| TASK-SOCIAL-CH-05 | یکپارچگی با dev-mock-users برای تست |

### TASK-SOCIAL-CIRCLES | حلقه‌های همسویی (آینده)
- **فاز:** ۳+ (یا فاز ۴)
- **یادداشت:** فقط placeholder — تصمیم نهایی بعد از feedback کاربران فاز ۳

---

## ۶. UX خط قرمز — این موارد هرگز نباید پیاده شوند

- ❌ Leaderboard، رتبه‌بندی، top performers
- ❌ نشان بستن (badges، medals)
- ❌ امتیاز عددی برای کاربر (XP، points)
- ❌ نمایش جزئیات تعهد دیگری (فقط درصد aggregate)
- ❌ جستجوی کاربر by phone یا email
- ❌ نوتیفیکیشن از نوع «دوستت ۷ روز پشت سر هم انجام داد، تو فقط ۳ روز»
- ❌ مقایسه آماری بین دو کاربر

---

## ۷. تعارض با مانیفست — صریح

این فیچر **بالقوه** ناقض §۱ است. سازگاری فقط با رعایت دقیق:
- **هیچ رقابت** (TASK-SOCIAL-CH-04 محافظ معماری)
- **opt-in سختگیرانه** (هیچ‌چیز پیش‌فرض اشتراکی نیست)
- **aggregate-only** برای داده دیگران
- **نقش AI:** اگر AI در این بخش استفاده شود (مثلاً «خلاصه چالش گروهی»)، هرگز نباید مقایسه فردی تولید کند

DECISION-025 این مرزها را به طور رسمی فریز می‌کند.

---

*آخرین بروزرسانی: ۲۰۲۶-۰۵-۲۷ — ساخت اولیه*
