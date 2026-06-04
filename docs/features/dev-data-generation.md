# Dev Data Generation — تولید داده تستی و Time-Travel

> **زمینه:** سیستم در حال توسعه نیاز دارد بدون انتظار واقعی، خروجی هر فیچر زمان‌محور را ببیند — بازخورد، گزارش هفتگی، یادآوری، چالش‌های اجتماعی، چت‌بات.
> **هدف این سند:** گسترش معماری Dev/Prod Mode (CLAUDE.md §۱۳) به یک فریم‌ورک کامل برای **تولید داده** و **جابجایی زمان** که در dev فعال است و در bundle prod حذف می‌شود.
> **منبع:** CLAUDE.md §۱۳، DECISION-016، DECISION-021، memory: project-dev-data-generation

---

## ۱. چالش — چرا این لازم است؟

| فیچر | چالش بدون این فریم‌ورک |
|------|------------------------|
| بازخورد تعهد (TASK-006) | باید تا فردا صبر کرد |
| گزارش هفتگی (TASK-009) | باید یک هفته تعهد ثبت کرد |
| فاصله غیرفعالی (TASK-007) | باید چند روز اپ را باز نکرد |
| نوتیفیکیشن (TASK-NOTIF-*) | باید تا زمان واقعی صبر کرد |
| پلن (TASK-PLAN-*) | باید روزها/هفته‌ها صبر کرد تا پیشرفت دید |
| چت‌بات (TASK-AI-CHAT-*) | باید context تاریخچه طولانی داشت |
| شبکه اجتماعی (TASK-SOCIAL-*) | باید کاربر دوم واقعی داشت |
| تحلیل الگو (`pattern-insight`) | بدون تاریخچه ۳ ماهه قابل تست نیست |

---

## ۲. اصول طراحی

| اصل | معنا |
|-----|-------|
| **Tree-shake-safe** | همه کد dev-data از bundle prod حذف می‌شود (همان pattern §۱۳) |
| **Server-only** | API های dev فقط در `IS_DEV_MODE` پاسخ می‌دهند؛ در prod 404 |
| **Reversible** | هر عمل dev (seed، fast-forward) قابل rollback است |
| **Isolated** | عملیات dev فقط روی کاربر فعلی یا کاربران mock-only |
| **Never in Auth/Validation** | هیچ‌گاه validation امنیتی dev-only نمی‌شود |
| **Visible** | همه عملیات dev در `<DevDataPanel>` قابل اجرا و رهگیری است |

---

## ۳. لایه‌ها

```
┌────────────────────────────────────────────────────────┐
│ Layer 1 — Dev Time Source                              │
│   src/lib/dev/time.ts                                  │
│   getNow() → یا time واقعی، یا time جابجاشده dev      │
│   فقط در IS_DEV_MODE قابل override                     │
└────────────────────────────────────────────────────────┘
                          ▲
                          │ مصرف می‌شود توسط
                          │
┌────────────────────────────────────────────────────────┐
│ Layer 2 — Dev Data API                                 │
│   /api/dev/* (همه protected by IS_DEV_MODE)            │
│   - POST /api/dev/seed/entries  → ثبت N تعهد گذشته    │
│   - POST /api/dev/seed/feedback → ثبت بازخورد گذشته   │
│   - POST /api/dev/seed/full-week → یک هفته کامل       │
│   - POST /api/dev/time/set      → جابجایی ساعت سرور    │
│   - POST /api/dev/time/reset    → بازگشت به now واقعی  │
│   - POST /api/dev/reset/me      → پاک کردن داده من    │
│   - POST /api/dev/users/mock    → ساخت کاربر mock      │
└────────────────────────────────────────────────────────┘
                          ▲
┌────────────────────────────────────────────────────────┐
│ Layer 3 — Dev UI Panels (همه پشت <DevOnly>)            │
│   - <DevDataPanel> — wrapper اصلی، گوشه پایین          │
│   - <DevTimeTravel> — UI جابجایی روز                   │
│   - <DevSeedPanel> — seed یک هفته/ماه/تاریخچه          │
│   - <DevMockUsersPanel> — مدیریت کاربران mock          │
│   - <DevAIInspector> — لاگ ورودی/خروجی AI (لینک §AI)   │
└────────────────────────────────────────────────────────┘
                          ▲
┌────────────────────────────────────────────────────────┐
│ Layer 4 — Dev Markers (در DB)                          │
│   ستون نمادین `_devSeed: Boolean?` در مدل‌های seed-able  │
│   → امکان «پاک‌سازی فقط داده‌های seed»                 │
└────────────────────────────────────────────────────────┘
```

---

## ۴. Time Source — قلب time-travel

**فایل:** `src/lib/dev/time.ts`

```typescript
// API ساده
import { getNow } from "@/lib/dev/time";
const now = getNow();  // در prod = new Date()؛ در dev = ممکن است override باشد
```

**رفتار:**
- در prod: همیشه `new Date()`، فاصله = ۰
- در dev: یک offset (ms) را که در حافظه سرور نگه می‌دارد، اعمال می‌کند
- offset از طریق `POST /api/dev/time/set` تغییر می‌کند (تاریخ هدف → offset محاسبه و ذخیره)
- offset در حافظه (in-memory) ذخیره می‌شود؛ با restart پاک می‌شود (intentional — fresh slate)
- اختیاری: ذخیره در `prisma/dev.db` در یک جدول `DevState` برای persistence

**قانون:** هر جایی که در سرور `new Date()` می‌نویسیم، باید `getNow()` استفاده کنیم. این یک قانون اجباری است که در lint/code review چک می‌شود.

---

## ۵. Seed Operations

| API | کاربر | مثال خروجی |
|-----|-------|------------|
| `POST /api/dev/seed/entries { days: 7 }` | ۷ تعهد گذشته با تاریخ شمسی واقعی | DailyEntry × 7 |
| `POST /api/dev/seed/feedback { coverage: 0.8 }` | ۸۰٪ تعهدهای بدون بازخورد را تکمیل می‌کند | EntryFeedback × N |
| `POST /api/dev/seed/full-week { withGaps: true }` | یک هفته کامل + فاصله‌های تصادفی | چندین مدل |
| `POST /api/dev/seed/chat-history { messages: 20 }` | ۲۰ پیام چت گذشته (در فاز ۲.۵) | ChatMessage × 20 |
| `POST /api/dev/seed/plan { duration: "1w", goal: "30 pages" }` | یک پلن نمونه با progress | Plan + items |

همه آنها:
- روی **کاربر فعلی session** عمل می‌کنند (نه کاربر دیگر)
- داده‌ها با `_devSeed: true` در DB علامت می‌خورند
- خروجی JSON دقیق برمی‌گردانند (تعداد ساخته‌شده، ID ها)

---

## ۶. Mock Users — برای شبکه اجتماعی و چت

**کاربرد:** TASK-SOCIAL-* و TASK-AI-CHAT-* به «کاربر دوم» نیاز دارند.

`POST /api/dev/users/mock { count: 3, persona: "active" | "lazy" | "gap-prone" }`:
- ۳ کاربر mock با شماره موبایل فیک (`+9890DEVxxxxx`)
- داده‌های seed مناسب persona
- قابل دعوت به چالش‌ها برای تست UI شبکه اجتماعی
- `_isMock: true` در User → در prod هرگز query نمی‌شوند

---

## ۷. ساختار پوشه‌ها

```
src/lib/dev/
├── time.ts             ← Time source (getNow، setOffset)
├── seed.ts             ← توابع seed (server-only)
├── mock-users.ts       ← ساخت/پاک‌سازی mock users
└── personas.ts         ← persona configs برای mock users

src/app/api/dev/        ← همه route ها با IS_DEV_MODE guard
├── seed/
│   ├── entries/route.ts
│   ├── feedback/route.ts
│   ├── full-week/route.ts
│   ├── chat-history/route.ts
│   └── plan/route.ts
├── time/
│   ├── set/route.ts
│   └── reset/route.ts
├── reset/me/route.ts
└── users/mock/route.ts

src/components/dev/     ← UI پنل‌ها (همه پشت <DevOnly>)
├── DevDataPanel.tsx    ← wrapper اصلی (گوشه پایین)
├── DevTimeTravel.tsx
├── DevSeedPanel.tsx
├── DevMockUsersPanel.tsx
└── DevAIInspector.tsx
```

---

## ۸. حفاظت‌های امنیتی (دفاع در عمق)

۳ لایه حفاظت — همه باید هم‌زمان شکست بخورند تا کد dev در prod اجرا شود:

1. **Build-time:** `NEXT_PUBLIC_APP_MODE` inline → `if (IS_DEV_MODE)` در prod → `if (false)` → tree-shaken
2. **Runtime API:** هر route در `/api/dev/*` ابتدای handler چک `if (!IS_DEV_MODE) return 404`
3. **Runtime UI:** پنل‌ها هم در داخل خود `if (!IS_DEV_MODE) return null` دارند
4. **Data marker:** ستون `_devSeed`/`_isMock` در DB → حتی اگر داده dev به prod نشت کرد (مثلاً export DB)، identifiable است

---

## ۹. درخت تسک

### TASK-DEV-DATA | فریم‌ورک Dev Data Generation
- **فاز:** ۱.۵ (موازی با TASK-AI-ARCH، اولویت بالاتر بعد از TASK-006)
- **اولویت:** 🔴 Critical
- **چرا:** TASK-007 (فاصله) و TASK-009 (گزارش هفتگی) بدون این عملاً قابل تست نیستند

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-DEV-DATA-01 | `src/lib/dev/time.ts` + جایگزینی `new Date()` در سرور با `getNow()` |
| TASK-DEV-DATA-02 | API `/api/dev/time/{set,reset}` + پنل `<DevTimeTravel>` |
| TASK-DEV-DATA-03 | افزودن `_devSeed` به مدل‌های مناسب (migration) |
| TASK-DEV-DATA-04 | API `/api/dev/seed/entries` + UI |
| TASK-DEV-DATA-05 | API `/api/dev/seed/feedback` + API `/api/dev/seed/full-week` |
| TASK-DEV-DATA-06 | API `/api/dev/reset/me` (پاک‌سازی فقط داده‌های seed کاربر فعلی) |
| TASK-DEV-DATA-07 | `<DevDataPanel>` wrapper + integration در root layout |
| TASK-DEV-DATA-08 | تست build prod: مطمئن شدن همه `/api/dev/*` در prod 404 می‌دهد |
| TASK-DEV-DATA-09 | بروزرسانی CLAUDE.md §۱۳ با pattern «هر فیچر زمان‌محور → یک seed/time-travel ساب‌تسک دارد» |

### TASK-DEV-MOCK-USERS | کاربران Mock
- **فاز:** ۲.۵ (قبل از TASK-SOCIAL-* و TASK-AI-CHAT-*)
- **اولویت:** 🟠 High
- **وابستگی:** TASK-DEV-DATA

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-DEV-MOCK-01 | افزودن `_isMock` به User + helper queries که mock را در prod فیلتر می‌کنند |
| TASK-DEV-MOCK-02 | `src/lib/dev/personas.ts` با ۳ persona اولیه |
| TASK-DEV-MOCK-03 | API `/api/dev/users/mock` |
| TASK-DEV-MOCK-04 | `<DevMockUsersPanel>` |

### TASK-DEV-AI-INSPECTOR | لاگ AI در dev
- **فاز:** ۱.۵ (پس از TASK-AI-ARCH)
- **اولویت:** 🟡 Medium
- **وابستگی:** TASK-AI-ARCH

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-DEV-AI-01 | hook در AIOrchestrator برای ضبط هر invocation در حافظه/SQLite |
| TASK-DEV-AI-02 | `<DevAIInspector>` — لیست آخرین فراخوانی‌ها، prompt کامل، خروجی، token count، latency |
| TASK-DEV-AI-03 | امکان «replay» یک فراخوانی با prompt ویرایش‌شده |

---

## ۱۰. قانون اضافه‌شده به CLAUDE.md §۱۳ (پیشنهاد)

> هر فیچر **زمان‌محور** یا وابسته به **کاربر دیگر** باید قبل از merge، حداقل یک ساب‌تسک «Dev tooling» داشته باشد که اجازه می‌دهد بدون انتظار واقعی، کل جریان فیچر تست شود.

این قانون در TASK-DEV-DATA-09 به §۱۳ افزوده می‌شود.

---

## ۱۱. تعارض با مانیفست — هیچ

این یک سیستم **توسعه** است، نه قابلیت محصول. در prod اصلاً وجود ندارد.

---

*آخرین بروزرسانی: ۲۰۲۶-۰۵-۲۷ — ساخت اولیه*
