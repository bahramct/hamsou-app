# prompts/ — پرامپت‌های AI همسو

این پوشه **خارج از `src/`** قرار دارد به‌صورت قرارداد (DECISION-029). هدف: جداسازی پرامپت‌ها از کد فیچر، تا content team بدون درگیر شدن با TypeScript آن‌ها را ویرایش کند.

## ساختار

```
prompts/
└── <role-id>/
    ├── v1.fa.md           ← پرامپت فارسی نسخه ۱ (همیشه canonical)
    ├── v1.en.md           ← (آینده) پرامپت انگلیسی نسخه ۱
    └── v2.fa.md           ← (آینده) نسخه ۲ فارسی — نسخه قبلی پاک نمی‌شود
```

## قرارداد یک فایل پرامپت

```markdown
---
role: weekly-report
version: 1.0.0
locale: fa
jsonMode: true
---

## SYSTEM

متن نقش — شخصیت، لحن، خط قرمزها، انتظار خروجی.
{{PLACEHOLDER}}های اینجا هم پر می‌شوند.

## USER

داده ورودی کاربر با placeholder ها:
{{INPUT_JSON}}، {{WEEK_START}}، …
```

### frontmatter (الزامی)

| فیلد | نوع | توضیح |
|------|-----|-------|
| `role` | string | باید با `roleId` در کد match کند |
| `version` | semver | تغییر معنایی پرامپت = bump نسخه |
| `locale` | "fa" \| "en" | زبان متن این فایل |
| `jsonMode` | boolean | اگر `true`: orchestrator خروجی را با Zod parse می‌کند |

### Sections (الزامی)

- `## SYSTEM` — معرفی نقش به Provider. شخصیت، لحن، خط قرمزها، شرح خروجی.
- `## USER` — متن کاربر. شامل داده ورودی به‌صورت placeholder.

### Placeholder ها

- syntax: `{{NAME_IN_UPPER_SNAKE}}`
- متغیر unknown در template → خطای fail-fast
- متغیر unused در input → خطای fail-fast (تا dead vars جمع شوند)

## افزودن نقش جدید

1. ساخت پوشه `prompts/<new-role>/`
2. ساخت `v1.fa.md` با ساختار بالا
3. ساخت `src/lib/ai/roles/<new-role>/` با schema.ts و index.ts
4. register در `src/lib/ai/bootstrap.ts`
5. مصرف: `invokeAI("<new-role>", input, ctx)`

## ویرایش پرامپت موجود (تغییر کوچک — همان نسخه)

- متن `v1.fa.md` را ویرایش کن
- در dev: bypass cache — هر request از disk می‌خواند
- در prod: سرور reload نیاز دارد

## ویرایش پرامپت موجود (تغییر معنایی — نسخه جدید)

- فایل `v2.fa.md` بساز — نسخه قبلی پاک نمی‌شود
- `version: "2.0.0"` در frontmatter
- در کد نقش (`src/lib/ai/roles/<role>/index.ts`) `ROLE_VERSION` را آپدیت کن
- مصرف‌کننده‌ها (`invokeAI`) به نسخه آخر default می‌شوند — برای A/B test می‌توان `roleVersion: "1.0.0"` در ctx فرستاد

## خط قرمزها (CLAUDE.md §۱)

هیچ پرامپتی نباید:
- لحن قضاوتی داشته باشد
- کاربر را با دیگران مقایسه کند
- پیام «باید» / «نباید» تجویز کند
- پیام انگیزشی مصنوعی تولید کند
- استریک / امتیاز / مدال ذکر کند

اگر یکی از این‌ها در پرامپت دیده شد → یک bug است، نه feature.
