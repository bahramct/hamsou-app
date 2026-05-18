# Hamsu Project Setup Guide

This guide will help you set up the Hamsu project for development.

## Prerequisites

- Node.js 18+ and Bun
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hamsu
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

Copy the example file and configure it:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="file:../db/hamsou.db?connection_limit=1"
JWT_SECRET="hamsou-dev-secret-key"
NODE_ENV="development"
AI_PROVIDER="z-ai"
```

### 4. Initialize Database

```bash
bunx prisma generate
bunx prisma db push
```

### 5. Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

---

## Environment Configuration

### Development Environment

Create `.env.local`:

```env
# Database - Use local SQLite
DATABASE_URL="file:../db/hamsou.db?connection_limit=1"

# JWT Secret - Development only
JWT_SECRET="hamsou-dev-secret-key"

# Environment
NODE_ENV="development"

# AI Provider
AI_PROVIDER="z-ai"
```

### Production Environment

Create `.env.production`:

```env
# Database - Production database
DATABASE_URL="file:../db/hamsou-prod.db?connection_limit=1"
# OR use external database:
# DATABASE_URL="postgresql://user:pass@host:5432/hamsou"

# JWT Secret - MUST be changed to secure random string
JWT_SECRET="generate-secure-random-string-here"

# Environment
NODE_ENV="production"

# AI Provider
AI_PROVIDER="z-ai"
```

**Generate secure JWT secret:**
```bash
openssl rand -base64 32
```

---

## Database Management

### Create/Update Schema

1. Edit `prisma/schema.prisma`
2. Push changes:

```bash
bunx prisma db push
```

### Reset Database (Development Only)

⚠️ **WARNING:** This will delete all data!

```bash
bunx prisma db push --force-reset
```

### View Database with Prisma Studio

```bash
bunx prisma studio
```

---

## Development Tools

The project includes development tools that are **only available in development mode**.

### Accessing Dev Tools

1. Open the application in your browser
2. Scroll to the bottom of the page
3. You'll see "ابزارهای توسعه" (Development Tools)

### Available Dev Features

- **Generate Test Data:** Create sample commitments and reflections
- **Delete Test Data:** Clear all test data
- **Test Notifications:** Create test notifications
- **Change Plan:** Switch between FREE, PLUS, PRO plans
- **Create Leaderboard Data:** Test community features

**Note:** These features are automatically disabled in production.

---

## Project Structure

```
hamsu/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── dev/          # Development-only endpoints
│   │   │   ├── ai/           # AI-related endpoints
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
│   │   └── dev-mode.ts      # Dev mode helper
│   └── hooks/               # React hooks
├── prisma/
│   └── schema.prisma        # Database schema
├── db/                      # Database files (git-ignored)
├── docs/                    # Documentation
├── .env.example             # Environment variables template
├── .env.local               # Development environment (git-ignored)
└── package.json
```

---

## Common Issues

### Issue: "DATABASE_URL not found"

**Solution:** Make sure `.env.local` exists and has `DATABASE_URL` set.

### Issue: "Module not found: @/lib/db"

**Solution:** Run `bunx prisma generate` to regenerate Prisma client.

### Issue: "Database is readonly"

**Solution:** Check database file permissions:
```bash
chmod 666 db/hamsou.db
```

### Issue: "Dev tools not working"

**Solution:** Verify `NODE_ENV="development"` in `.env.local` and restart the server.

---

## Additional Resources

- [Development vs Production Separation](./DEV-PROD-SEPARATION.md)
- [AI Implementation Summary](./AI-IMPLEMENTATION-SUMMARY.md)
- [Architecture Documentation](./architecture.md)

---

## Support

For issues and questions:
1. Check the documentation in `docs/` folder
2. Review the troubleshooting section
3. Check dev server logs: `tail -f dev.log`
