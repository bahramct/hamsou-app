-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN "lastSeenAt" DATETIME;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "supportChatHiddenUntil" DATETIME;

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedById" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupportChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastUserAt" DATETIME,
    "lastAdminAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorAdminId" TEXT,
    "body" TEXT NOT NULL,
    "readByAdminAt" DATETIME,
    "readByUserAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SupportChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupportChatMessage_authorAdminId_fkey" FOREIGN KEY ("authorAdminId") REFERENCES "AdminUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SupportChatSession_status_lastUserAt_idx" ON "SupportChatSession"("status", "lastUserAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupportChatSession_userId_dayKey_key" ON "SupportChatSession"("userId", "dayKey");

-- CreateIndex
CREATE INDEX "SupportChatMessage_sessionId_createdAt_idx" ON "SupportChatMessage"("sessionId", "createdAt");
