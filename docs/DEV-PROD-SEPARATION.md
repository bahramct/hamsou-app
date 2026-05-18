# Development vs Production Separation Guide

This document explains how the Hamsu project separates development and production environments to prevent issues where development features accidentally break production.

## 📋 Table of Contents

1. [Environment Variables](#environment-variables)
2. [Database Separation](#database-separation)
3. [Development Tools](#development-tools)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)

---

## 🔐 Environment Variables

### File Structure

```
.env.example          # Template (git-tracked) - Copy this for setup
.env.local            # Development only (git-ignored)
.env.production       # Production (git-ignored)
.env.test             # Testing (git-ignored)
```

### Setting Up Development

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your development settings:
   ```env
   DATABASE_URL="file:../db/hamsou.db?connection_limit=1"
   JWT_SECRET="hamsou-dev-secret-key"
   NODE_ENV="development"
   AI_PROVIDER="z-ai"
   ```

### Setting Up Production

1. Copy the example file:
   ```bash
   cp .env.example .env.production
   ```

2. Edit `.env.production` with production settings:
   ```env
   DATABASE_URL="file:../db/hamsou-prod.db?connection_limit=1"
   JWT_SECRET="generate-a-secure-random-string"
   NODE_ENV="production"
   AI_PROVIDER="z-ai"
   ```

**IMPORTANT:** Never commit `.env.production` to version control!

---

## 🗄️ Database Separation

### Development Database

- **Location:** `db/hamsou.db`
- **Purpose:** Local development and testing
- **Reset:** Can be freely reset and modified
- **Data:** Test data, development data

### Production Database

- **Location:** `db/hamsou-prod.db` (or external database URL)
- **Purpose:** Production user data
- **Reset:** NEVER reset without backup
- **Data:** Real user data

### Database Files in .gitignore

All database files are ignored by Git:
```
*.db
*.db-shm
*.db-wal
db/*.db
db/*.db-shm
db/*.db-wal
```

### Creating Separate Databases

To use different databases for dev and prod:

**Development (.env.local):**
```env
DATABASE_URL="file:../db/hamsou-dev.db?connection_limit=1"
```

**Production (.env.production):**
```env
DATABASE_URL="file:../db/hamsou-prod.db?connection_limit=1"
# OR use external database
DATABASE_URL="postgresql://user:pass@host:5432/hamsou"
```

---

## 🛠️ Development Tools

### DevToolsPanel Component

The `DevToolsPanel` component provides development-only features:

**Location:** `src/components/dev/dev-tools-panel.tsx`

**Features:**
- Generate test data
- Delete test data
- Test notifications
- Switch subscription plans
- Create leaderboard test data

**Protection:**
```typescript
if (process.env.NODE_ENV === 'production') {
  return null; // Component not rendered in production
}
```

### Dev API Routes

All development API routes are in `src/app/api/dev/`:

**Available Endpoints:**
- `/api/dev/generate-test-data` - Generate test commitments and reflections
- `/api/dev/create-yesterday-commitment` - Test yesterday reflection flow
- `/api/dev/create-test-notification` - Test notifications
- `/api/dev/create-leaderboard-test-data` - Test community features
- `/api/dev/check-leaderboard-test-data` - Check test data status
- `/api/dev/clear-leaderboard-test-data` - Clear community test data
- `/api/dev/set-plan` - Change subscription plan (dev only)

**Protection Pattern:**
```typescript
export async function POST(request: NextRequest) {
  // Environment check
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 404 }
    );
  }

  // Additional safety check
  if (process.env.DISABLE_DEV_TOOLS === 'true') {
    return NextResponse.json(
      { error: 'Dev tools are disabled' },
      { status: 404 }
    );
  }

  // ... rest of the code
}
```

### Dev Mode Helper

Use the `dev-mode.ts` helper for consistent checks:

```typescript
import { isDevelopment, requireDevelopment } from '@/lib/dev-mode';

// Check if in development
if (isDevelopment()) {
  // Development-only code
}

// Guard function - throws error if not in development
requireDevelopment(); // Throws in production
```

---

## ✅ Best Practices

### When Adding Features

1. **Environment Variables:**
   - Add to `.env.example` first
   - Use `.env.local` for development
   - Document the purpose in comments

2. **Database Changes:**
   - Update `prisma/schema.prisma`
   - Test in development database
   - Never modify production schema directly

3. **Dev Tools:**
   - Place dev-only features in `src/app/api/dev/`
   - Always check `NODE_ENV === 'development'`
   - Use the helper functions from `@/lib/dev-mode`

4. **Testing:**
   - Use test data generation in development
   - Never use dev tools in production
   - Separate test databases

### Code Review Checklist

Before committing changes:

- [ ] No `.env` or `.env.local` files committed
- [ ] No database files (`.db`) committed
- [ ] All dev-only API routes check `NODE_ENV`
- [ ] DevToolsPanel checks `NODE_ENV` on render
- [ ] `.env.example` is updated with new variables
- [ ] Production database is never affected by dev code

### Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in production environment
- [ ] Use separate production database
- [ ] Set secure `JWT_SECRET`
- [ ] Verify dev tools return 404 in production
- [ ] Test with production environment variables
- [ ] Backup production database before migrations

---

## 🔧 Troubleshooting

### Issue: "Database is readonly"

**Cause:** Database file permissions or wrong database path.

**Solution:**
1. Check `.env.local` has correct `DATABASE_URL`
2. Ensure database file has write permissions: `chmod 666 db/hamsou.db`
3. Verify database path matches the file location

### Issue: "Dev tools return 404"

**Cause:** `NODE_ENV` is not set to `development`.

**Solution:**
1. Check `.env.local` has `NODE_ENV="development"`
2. Restart the dev server after changing env variables
3. Verify the environment is loaded: `console.log(process.env.NODE_ENV)`

### Issue: "Production database has test data"

**Cause:** Development tools accidentally used in production.

**Solution:**
1. Verify `NODE_ENV=production` in production
2. Add additional protection with `DISABLE_DEV_TOOLS=true`
3. Backup and restore from backup if needed

### Issue: "Changes to Prisma schema not reflected"

**Cause:** Prisma Client not regenerated after schema changes.

**Solution:**
```bash
bunx prisma generate
bunx prisma db push
```

### Issue: "Git tracking database files"

**Cause:** Database files not in `.gitignore`.

**Solution:**
1. Stop any processes using the database
2. Remove tracked files: `git rm --cached *.db`
3. Update `.gitignore` (already done)
4. Commit the changes

---

## 📞 Getting Help

If you encounter issues:

1. Check this document first
2. Verify environment variables are set correctly
3. Check the dev server logs: `tail -f dev.log`
4. Ensure you're using the correct database for your environment

---

## 📝 Version History

- **v1.0.0** - Initial documentation
  - Environment variable structure
  - Database separation
  - Development tools protection
