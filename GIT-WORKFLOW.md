# راهنمای کار با Git - پروژه همسو

## معرفی

این راهنما توضیح می‌دهد چطور با Git و GitHub در پروژه همسو کار کنید.

### اطلاعات Repository

- **Repository**: https://github.com/bahramct/hamsou-app
- **Branch اصلی**: `main`
- **نوع**: Private Repository

---

## تنظیمات اولیه Git

### بررسی وضعیت Git

```bash
# بررسی اینکه آیا git init شده است
cd /home/z/my-project
git status

# بررسی repository های ریموت
git remote -v

# مشاهده branch ها
git branch -a
```

### تنظیمات User

در این پروژه، git قبلاً کانفیگ شده است:

```bash
# User Name
git config user.name
# خروجی: Bahram Barazande

# User Email
git config user.email
# خروجی: bahram@hamsou.app
```

---

## روال کاری با Git

### 1. مشاهده تغییرات

قبل از هر commit، همیشه وضعیت را بررسی کنید:

```bash
# مشاهده وضعیت کلی
git status

# مشاهده فایل‌های تغییر کرده
git diff

# مشاهده تغییرات فایل خاص
git diff src/app/page.tsx
```

### 2. اضافه کردن فایل‌ها به Staging

```bash
# اضافه کردن همه فایل‌های تغییر کرده
git add .

# اضافه کردن فایل‌های خاص
git add src/app/api/analytics/export/pdf/route.ts

# اضافه کردن با pattern
git add src/components/analytics/*.tsx
```

### 3. ایجاد Commit

```bash
# commit ساده
git commit -m "feat: add PDF export feature"

# commit با توضیح کامل
git commit -m "fix: resolve PDF generation error

- Changed from pdfkit to jsPDF
- Fixed jspdf-autotable import
- Updated all autoTable calls to use correct syntax"
```

### 4. Push به GitHub

```bash
# push به branch جاری
git push

# push با tracking
git push -u origin main

# push به branch خاص
git push origin feature-branch
```

### 5. Pull از GitHub

```bash
# pull با merge
git pull origin main

# pull با rebase (cleaner history)
git pull --rebase origin main
```

---

## استاندارد پیام‌های Commit

این پروژه از **Conventional Commits** استفاده می‌کند:

### فرمت کلی

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types (انواع)

| Type | توضیح | مثال |
|------|-------|------|
| `feat` | قابلیت جدید | `feat: add PDF export with English support` |
| `fix` | اصلاح باگ | `fix: resolve PDF generation error` |
| `docs` | تغییر در مستندات | `docs: update git workflow guide` |
| `style` | تغییر در style/coding (بدون تغییری در عملکرد) | `style: format code with prettier` |
| `refactor` | refactor (بدون تغییر در عملکرد) | `refactor: simplify PDF generation logic` |
| `test` | اضافه/تغییر تست | `test: add unit tests for PDF API` |
| `chore` | تغییرات دیگری (build, deps) | `chore: update jspdf to version 4.2.1` |
| `perf` | بهبود عملکرد | `perf: optimize database queries` |

### مثال‌ها

```bash
# قابلیت جدید
git commit -m "feat(analytics): add PDF export functionality"

# اصلاح باگ
git commit -m "fix(pdf): resolve font loading issue"

# تغییر مستندات
git commit -m "docs: update README with new features"

# به‌روزرسانی dependency
git commit -m "chore: upgrade next.js to version 16"

# چند خطی
git commit -m "feat: implement user authentication

- Add login API endpoint
- Implement JWT token generation
- Add auth middleware for protected routes

Closes #123"
```

---

## چطور از AI Assistant درخواست Git کنید؟

### بعد از تکمیل یک قابلیت

```
لطفاً تغییرات رو commit و push کن:
- نوع: feat
- موضوع: add PDF export with English support
- توضیحات: Added jsPDF-based PDF generation for analytics reports
```

### بعد از اصلاح یک باگ

```
بذار این فیکس رو commit و push کن:
- نوع: fix
- موضوع: resolve PDF generation error
- توضیحات: Fixed jspdf-autotable import syntax
```

### قبل از شروع کار جدید

```
اول از گیت pull بگیر تا آخرین تغییرات رو داشته باشیم
```

### بعد از پایان روز کاری

```
همه تغییرات امروز رو commit و push کن
```

---

## دستورات پرکاربرد Git

### اطلاعات و وضعیت

```bash
git status              # وضعیت فایل‌ها
git log                 # تاریخچه commits
git log --oneline       # خلاصه تاریخچه
git diff                # تغییرات uncommitted
git show <commit-hash>  # جزئیات یک commit
```

### Branch ها

```bash
git branch                    # لیست branch های local
git branch -a                 # لیست همه branch ها
git branch -r                 # لیست branch های remote
git branch <name>             # ایجاد branch جدید
git checkout <name>           # سوئیچ به branch
git checkout -b <name>        # ایجاد و سوئیچ
git branch -d <name>          # حذف branch local
git push origin --delete <name>  # حذف branch remote
```

### Staging و Commit

```bash
git add .                    # همه فایل‌ها
git add <file>               # یک فایل
git reset                    # unstage همه
git reset <file>             # unstage یک فایل
git commit -m "message"      # commit با پیام
git commit --amend           # ویرایش آخرین commit
```

### Push و Pull

```bash
git push                    # push به branch جاری
git push -u origin main     # push با tracking
git pull                    # pull و merge
git pull --rebase           # pull و rebase
git fetch                   # دریافت بدون merge
```

### History

```bash
git log                    # تاریخچه کامل
git log --oneline          # خلاصه
git log --graph            # با گراف
git log --author="Bahram"  # فیلتر بر اساس author
git log --since="1 week"   # فیلتر زمانی
```

---

## سناریوهای رایج

### سناریو 1: تکمیل یک قابلیت و commit

```bash
# 1. بررسی تغییرات
git status

# 2. مشاهده تغییرات
git diff

# 3. اضافه کردن فایل‌ها
git add .

# 4. ایجاد commit
git commit -m "feat: add user profile page"

# 5. Push به GitHub
git push origin main
```

### سناریو 2: اصلاح یک باگ

```bash
# 1. اصلاح باگ در فایل
# ... ویرایش فایل ...

# 2. بررسی تغییرات
git diff src/app/api/analytics/export/pdf/route.ts

# 3. Add و commit
git add src/app/api/analytics/export/pdf/route.ts
git commit -m "fix: resolve PDF generation error"

# 4. Push
git push origin main
```

### سناریو 3: Sync با آخرین تغییرات

```bash
# 1. Pull آخرین تغییرات
git pull origin main

# 2. حل conflict ها (اگر وجود داشت)
# ... ویرایش فایل‌های conflict ...

# 3. Add فایل‌های حل شده
git add .

# 4. Continue merge/rebase
git commit  # اگر merge بود
# یا
git rebase --continue  # اگر rebase بود

# 5. Push
git push origin main
```

### سناریو 4: برگرداندن یک فایل به آخرین commit

```bash
# برگرداندن فایل به آخرین commit (discard local changes)
git checkout -- src/app/page.tsx

# یا با git restore
git restore src/app/page.tsx
```

### سناریو 5: مشاهده و برگرداندن به commit قبلی

```bash
# مشاهده تاریخچه
git log --oneline

# برگرداندن به یک commit (discard همه تغییرات بعدی)
git reset --hard <commit-hash>

# برگرداندن به یک commit (نگهداری تغییرات به صورت uncommitted)
git reset --soft <commit-hash>

# برگرداندن آخرین commit (نگهداری تغییرات)
git reset --soft HEAD~1
```

---

## نکات امنیتی

### Git Credential

این پروژه از **Personal Access Token (PAT)** استفاده می‌کند:

- Token در URL ذخیره شده است
- برای امنیت بیشتر، می‌توانید از **SSH Key** استفاده کنید
- برای حذف token از تاریخچه: `git remote set-url origin https://github.com/bahramct/hamsou-app.git`

### اطلاعات حساس

**هیچوقت** این فایل‌ها را commit نکنید:

- `.env` (فایل‌های محیطی)
- `node_modules/` (dependency ها)
- `.next/` (build artifacts)
- `*.log` (log files)
- کلید‌های API و توکن‌ها

این فایل‌ها در `.gitignore` ذکر شده‌اند.

### Review قبل از Push

همیشه قبل از push بررسی کنید:

```bash
# 1. چه چیزی commit می‌کنید؟
git diff --staged

# 2. چه commit هایی قرار است push شوند؟
git log origin/main..HEAD

# 3. فایل‌های حساس commit نشده باشند
git status
```

---

## Checklist قبل از Push

- [ ] تغییرات مرور شده: `git diff`
- [ ] پیام commit استاندارد است
- [ ] فایل‌های حساس (`.env`, `node_modules`) commit نشده‌اند
- [ ] کد تست شده است
- [ ] Conflicts حل شده‌اند (اگر pull گرفته‌اید)
- [ ] با آخرین تغییرات sync شده‌اید: `git pull`

---

## رفع مشکلات رایج

### مشکل: "Failed to push some refs"

```bash
# راه‌حل: اول pull بگیرید
git pull origin main
# حل conflicts
git add .
git commit -m "resolve merge conflicts"
git push origin main
```

### مشکل: "Everything up-to-date" ولی تغییرات local وجود دارد

```bash
# بررسی branch
git branch

# اگر branch دیگری هست، push کنید
git push origin <branch-name>
```

### مشکل: فایل‌های تغییر کرده را نمی‌بینم

```bash
# بررسی untracked files
git status

# اگر همه فایل‌ها tracked شده‌اند ولی تغییری نمی‌بینید
git diff
```

### مشکل: Authentication failed

```bash
# اگر token منقضی شده است
# 1. token جدید بسازید در GitHub
# 2. remote را آپدیت کنید
git remote set-url origin https://<new-token>@github.com/bahramct/hamsou-app.git
```

---

## نکات برای AI Assistant

### چطور به من بگویید commit کنم؟

✅ **خوب:**
```
لطفاً commit و push کن:
- Type: feat
- Subject: add PDF export feature
- Body: Implemented jsPDF-based PDF generation for analytics reports
```

✅ **خوب:**
```
این تغییرات رو commit کن:
- تغییرات: فایل PDF API اصلاح شد
- نوع: fix
- موضوع: resolve font loading issue
```

❌ **بد:**
```
commit کن
```
(چون من نمی‌دونم چی commit کنم)

### کی از من بخواهید Git اجرا کنم؟

- ✅ بعد از تکمیل یک قابلیت
- ✅ بعد از اصلاح یک باگ
- ✅ بعد از اتمام روز کاری
- ✅ قبل از شروع کار جدید (برای pull)
- ✅ بعد از تغییرات مهم در مستندات

### کی **نیاز** به Git نیست؟

- ❌ در حین توسعه یک قابلیت (چون هنوز کامل نشده)
- ❌ برای تغییرات کوچک و موقتی
- ❌ در حالت test و debug

---

## منابع

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Documentation](https://docs.github.com)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**آخرین بروزرسانی**: 2025-01-15
**وضعیت Repository**: ✅ Active
**Branch اصلی**: `main`
