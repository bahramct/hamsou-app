# Architecture (معماری)

مستندات معماری سیستم همسو.

## فایل‌ها

- **01-system-architecture.md** - معماری کامل سیستم و componentها
- **02-ai-implementation.md** - خلاصه پیاده‌سازی AI در همسو

## برای کی این بخش است؟

- معماران سیستم
- توسعه‌دهندگان ارشد
- هر کسی که می‌خواهد ساختار داخلی پروژه را بفهمد

---

## معماری کلی

```
hamsu/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── dev/          # Dev-only endpoints
│   │   │   ├── ai/           # AI endpoints
│   │   │   └── ...
│   │   ├── demo/             # Main demo page
│   │   ├── analytics/        # Analytics dashboard
│   │   └── ...
│   ├── components/           # React components
│   │   ├── dev/             # Dev-only components
│   │   ├── ui/              # shadcn/ui components
│   │   └── ...
│   ├── lib/                 # Utility libraries
│   │   ├── ai/              # AI system
│   │   ├── db.ts            # Prisma client
│   │   └── ...
│   └── hooks/               # React hooks
├── prisma/
│   └── schema.prisma        # Database schema
└── db/                      # Database files
```

---

## مولارهای اصلی

| ماژول | مسیر | توضیح |
|-------|------|-------|
| Authentication | `src/lib/auth.ts` | JWT token verification |
| Database | `src/lib/db.ts` | Prisma client singleton |
| AI System | `src/lib/ai/` | AI providers and context builders |
| API Routes | `src/app/api/` | REST API endpoints |
| Dev Tools | `src/components/dev/` | Development-only components |

---

## برای اطلاعات بیشتر

→ [راهنمای توسعه](../01-development/01-development-guide.md)
