import { PrismaClient } from "@prisma/client";

// در dev، Next.js HMR کلاس‌ها را hot-reload می‌کند و باعث ساخت چندین PrismaClient می‌شود.
// با نگه‌داشتن instance روی globalThis از این مشکل جلوگیری می‌کنیم.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
