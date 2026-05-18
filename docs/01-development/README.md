# Development Guide (راهنمای توسعه)

راهنماهای کامل برای توسعه پروژه همسو.

## فایل‌ها

- **01-development-guide.md** - راهنمای جامع توسعه و جلوگیری از مشکلات
- **02-dev-tools.md** - راهنمای ابزارهای توسعه (DevToolsPanel و API routes)
- **03-git-workflow.md** - راهنمای کار با Git برای این پروژه
- **04-agent-guidelines.md** - دستورالعمل برای AI agents که روی این پروژه کار می‌کنند

## برای کی این بخش است؟

- توسعه‌دهندگان تیم همسو
- AI agents که روی کد کار می‌کنند
- هر کسی که می‌خواهد فیچر جدید اضافه کند

---

## قانون طلایی توسعه

> هر چیزی که برای development هست، باید با `process.env.NODE_ENV` کنترل بشه.

```typescript
// ✅ درست
if (process.env.NODE_ENV === 'development') {
  // development-only code
}

// ❌ غلط
// بدون کنترل NODE_ENV
```

---

## شروع سریع

1. [مطالعه development guide](./01-development-guide.md)
2. [آشنایی با dev tools](./02-dev-tools.md)
3. [مرور git workflow](./03-git-workflow.md)

---

## مشکلات رایج؟

→ [Common Issues](../05-troubleshooting/01-common-issues.md)
