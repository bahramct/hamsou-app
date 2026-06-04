-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlanBullet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planKey" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "comingSoon" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PlanBullet_planKey_fkey" FOREIGN KEY ("planKey") REFERENCES "Plan" ("key") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PlanBullet" ("id", "order", "planKey", "text") SELECT "id", "order", "planKey", "text" FROM "PlanBullet";
DROP TABLE "PlanBullet";
ALTER TABLE "new_PlanBullet" RENAME TO "PlanBullet";
CREATE INDEX "PlanBullet_planKey_idx" ON "PlanBullet"("planKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
