-- CreateTable
CREATE TABLE "AiPromptOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleKey" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "systemTemplate" TEXT NOT NULL,
    "userTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AiConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedById" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "AiPromptOverride_roleKey_locale_isActive_idx" ON "AiPromptOverride"("roleKey", "locale", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AiPromptOverride_roleKey_locale_version_key" ON "AiPromptOverride"("roleKey", "locale", "version");
