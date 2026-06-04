-- CreateTable
CREATE TABLE "AiService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "providerType" TEXT NOT NULL DEFAULT 'openai-compatible',
    "baseURL" TEXT,
    "apiKey" TEXT,
    "model" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "AiService_region_kind_isActive_idx" ON "AiService"("region", "kind", "isActive");
