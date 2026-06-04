-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlanFeatureValue" (
    "planKey" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "comingSoon" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "value" INTEGER,
    "label" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("planKey", "featureKey"),
    CONSTRAINT "PlanFeatureValue_planKey_fkey" FOREIGN KEY ("planKey") REFERENCES "Plan" ("key") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PlanFeatureValue" ("enabled", "featureKey", "planKey", "value") SELECT "enabled", "featureKey", "planKey", "value" FROM "PlanFeatureValue";
DROP TABLE "PlanFeatureValue";
ALTER TABLE "new_PlanFeatureValue" RENAME TO "PlanFeatureValue";
CREATE INDEX "PlanFeatureValue_featureKey_idx" ON "PlanFeatureValue"("featureKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- DECISION-042: نگاشت ستون legacy «enabled» به فلگ‌های جدید (یک‌بار، هنگام مهاجرت).
-- امکانات boolean که در پلن «شامل» نبودند (enabled=0) → غیرفعال (خط روی متن).
UPDATE "PlanFeatureValue" SET "disabled" = 1
  WHERE "enabled" = 0
  AND "featureKey" IN ('weekly.reflection', 'support.ticketing', 'social.network');
-- امکاناتی که در کاتالوگ «به‌زودی» بودند → فلگ comingSoon.
UPDATE "PlanFeatureValue" SET "comingSoon" = 1
  WHERE "featureKey" IN ('support.ticketing', 'social.network');
