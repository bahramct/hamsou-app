// ─────────────────────────────────────────────────────────────────────────────
// prisma/seed.ts — بذرکاری RBAC ادمین (DECISION-036)
//
// idempotent: می‌توان بارها اجرا کرد بدون ایجاد رکورد تکراری.
//   - permissionها از کاتالوگ منبع‌حقیقت upsert می‌شوند
//   - نقش‌های پایه (system) upsert + permissionهایشان sync می‌شوند
//   - OWNER اول از env ADMIN_OWNER_USERNAME/ADMIN_OWNER_PASSWORD ساخته می‌شود (DECISION-038)
//
// اجرا:  npm run seed   یا   npx prisma db seed
// ─────────────────────────────────────────────────────────────────────────────

import "./load-env"; // باید اولین import باشد — قبل از new PrismaClient، تا .env.local لود شود
import { PrismaClient } from "@prisma/client";
import {
  ADMIN_PERMISSIONS,
  SYSTEM_ROLES,
  resolveRolePermissions,
} from "../src/lib/admin/permissions";
import { hashPassword, validatePasswordComplexity } from "../src/lib/admin/password";
import {
  PLAN_KEYS,
  PLAN_FEATURES,
  PLAN_DEFAULTS,
  defaultBool,
  defaultQuota,
} from "../src/lib/plans/features";

const prisma = new PrismaClient();

async function main() {
  console.log("→ بذرکاری RBAC ادمین…");

  // ۱. permissionها — upsert از کاتالوگ
  for (const perm of ADMIN_PERMISSIONS) {
    await prisma.adminPermission.upsert({
      where: { key: perm.key },
      update: { label: perm.label, group: perm.group },
      create: { key: perm.key, label: perm.label, group: perm.group },
    });
  }
  console.log(`  ✓ ${ADMIN_PERMISSIONS.length} permission`);

  // ۲. نقش‌های پایه + sync دسترسی‌ها
  for (const roleDef of SYSTEM_ROLES) {
    const role = await prisma.adminRole.upsert({
      where: { key: roleDef.key },
      update: { label: roleDef.label, description: roleDef.description, isSystem: true },
      create: { key: roleDef.key, label: roleDef.label, description: roleDef.description, isSystem: true },
    });

    const permKeys = resolveRolePermissions(roleDef);
    const perms = await prisma.adminPermission.findMany({
      where: { key: { in: permKeys as string[] } },
      select: { id: true },
    });

    // sync: حذف دسترسی‌های قبلی این نقش، سپس درج دسترسی‌های فعلی
    await prisma.adminRolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.adminRolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
    });
    console.log(`  ✓ نقش «${roleDef.label}» با ${perms.length} دسترسی`);
  }

  // ۳. OWNER اول از env (DECISION-038) — نام کاربری + رمز
  const username = (process.env.ADMIN_OWNER_USERNAME ?? "owner").trim();
  const password = process.env.ADMIN_OWNER_PASSWORD;

  if (!password) {
    console.log(
      "  ⚠ ADMIN_OWNER_PASSWORD تنظیم نشده — OWNER ساخته نشد. " +
        "در .env مقدار ADMIN_OWNER_PASSWORD (و در صورت نیاز ADMIN_OWNER_USERNAME) بگذار و دوباره seed را اجرا کن."
    );
  } else {
    const complexity = validatePasswordComplexity(password);
    if (!complexity.ok) {
      console.log(`  ⚠ ADMIN_OWNER_PASSWORD ضعیف است: ${complexity.error}`);
    } else {
      const ownerRole = await prisma.adminRole.findUniqueOrThrow({ where: { key: "owner" } });
      const existing = await prisma.adminUser.findUnique({ where: { username } });
      if (existing) {
        console.log(`  ✓ OWNER از قبل موجود است: ${username}`);
      } else {
        await prisma.adminUser.create({
          data: {
            username,
            passwordHash: hashPassword(password),
            mustChangePassword: false, // owner رمز خودش را انتخاب کرده
            displayName: "مالک سایت",
            roleId: ownerRole.id,
            isActive: true,
          },
        });
        console.log(`  ✓ OWNER اول ساخته شد: ${username}`);
      }
    }
  }

  // ۴. سرویس‌های AI پیش‌فرض (DECISION-039) — فقط اگر هیچ سرویسی وجود ندارد.
  // رفتار فعلی routing (env) را به مدل سرویس‌محور منتقل می‌کند تا چیزی تغییر نکند.
  const serviceCount = await prisma.aiService.count();
  if (serviceCount === 0) {
    const irProvider = (process.env.AI_PROVIDER_IRAN ?? "mock").trim();
    const intlProvider = (process.env.AI_PROVIDER_INTL ?? "mock").trim();

    await prisma.aiService.create({
      data: { ...serviceFromProvider(irProvider), region: "IR", kind: "text", isDefault: true, isActive: true } });
    await prisma.aiService.create({
      data: { ...serviceFromProvider(intlProvider), region: "INTL", kind: "text", isDefault: true, isActive: true } });
    console.log(`  ✓ سرویس‌های پیش‌فرض: IR=${irProvider}, INTL=${intlProvider}`);
  } else {
    console.log(`  ✓ ${serviceCount} سرویس AI از قبل موجود است — دست‌نخورده ماند.`);
  }

  // ۴.۵ سرویس پیامک پیش‌فرض (DECISION-061) — فقط اگر هیچ سرویسی وجود ندارد.
  // رفتار فعلی env (SMS_PROVIDER) را به مدل سرویس‌محور منتقل می‌کند (انتقال خودکار env→DB).
  const smsCount = await prisma.smsService.count();
  if (smsCount === 0) {
    const provider = (process.env.SMS_PROVIDER ?? "mock").trim();
    if (provider === "smsir") {
      const tid = process.env.SMSIR_TEMPLATE_ID;
      await prisma.smsService.create({
        data: {
          label: "sms.ir (سندباکس)",
          provider: "smsir",
          apiKey: process.env.SMSIR_API_KEY ?? null,
          templateId: tid ? parseInt(tid, 10) : null,
          paramName: process.env.SMSIR_PARAM_NAME ?? "Code",
          baseURL: process.env.SMSIR_BASE_URL ?? null,
          isSandbox: true,
          isActive: true,
          isDefault: true,
        },
      });
      console.log("  ✓ سرویس پیامک پیش‌فرض از env ساخته شد: smsir (sandbox)");
    } else {
      await prisma.smsService.create({
        data: {
          label: "سرویس آزمایشی (Mock)",
          provider: "mock",
          isSandbox: false,
          isActive: true,
          isDefault: true,
        },
      });
      console.log("  ✓ سرویس پیامک پیش‌فرض ساخته شد: mock");
    }
  } else {
    console.log(`  ✓ ${smsCount} سرویس پیامک از قبل موجود است — دست‌نخورده ماند.`);
  }

  // ۴.۶ کارتِ مرجعِ دریافت پرداخت (DECISION-062) — فقط اگر هیچ کارتی وجود ندارد.
  const cardCount = await prisma.bankCard.count();
  if (cardCount === 0) {
    const number = (process.env.PAYMENT_CARD_NUMBER ?? "").replace(/\D/g, "");
    const holder = (process.env.PAYMENT_CARD_HOLDER ?? "").trim();
    const bank = (process.env.PAYMENT_CARD_BANK ?? "").trim();
    if (number.length === 16 && holder && bank) {
      await prisma.bankCard.create({
        data: { cardNumber: number, holderName: holder, bankName: bank, isActive: true, isDefault: true },
      });
      console.log(`  ✓ کارت مرجعِ پرداخت از env ساخته شد: ${bank} / ${holder}`);
    } else {
      console.log("  ⚠ کارت مرجعِ پرداخت در env کامل نیست — از پنل ادمین اضافه کن.");
    }
  } else {
    console.log(`  ✓ ${cardCount} کارت مرجع از قبل موجود است — دست‌نخورده ماند.`);
  }

  // ۵. پلن‌ها + ماتریس امکانات (DECISION-040) — فقط اگر هیچ پلنی وجود ندارد.
  const planCount = await prisma.plan.count();
  if (planCount === 0) {
    for (const key of PLAN_KEYS) {
      const d = PLAN_DEFAULTS[key];
      await prisma.plan.create({
        data: {
          key,
          label: d.label,
          description: d.description,
          order: d.order,
          highlight: d.highlight,
          monthlyPrice: d.monthlyPrice,
          annualPrice: d.annualPrice,
          currency: "IRT",
          isActive: true,
        },
      });
      // ماتریس امکانات از پیش‌فرض‌های کاتالوگ (مدل فلگ‌محور — DECISION-042)
      await prisma.planFeatureValue.createMany({
        data: PLAN_FEATURES.map((f) => {
          const comingSoon = Boolean(f.comingSoon);
          if (f.type === "quota") {
            return { planKey: key, featureKey: f.key, visible: true, comingSoon, disabled: false, value: defaultQuota(f.key, key) };
          }
          const included = defaultBool(f.key, key);
          return { planKey: key, featureKey: f.key, visible: true, comingSoon, disabled: !included, value: null };
        }),
      });
    }
    console.log(`  ✓ ${PLAN_KEYS.length} پلن + ماتریس ${PLAN_FEATURES.length} امکان ساخته شد.`);
  } else {
    console.log(`  ✓ ${planCount} پلن از قبل موجود است — دست‌نخورده ماند.`);
  }

  console.log("✓ بذرکاری کامل شد.");
}

// نام provider (env) → فیلدهای یک AiService متنی، با حفظ رفتار فعلی.
function serviceFromProvider(name: string): {
  label: string; providerType: string; baseURL: string | null; apiKey: string | null; model: string;
} {
  if (name === "gapgpt") {
    return {
      label: "سرویس متنی (GapGPT)",
      providerType: "openai-compatible",
      baseURL: process.env.GAPGPT_BASE_URL ?? "https://api.gapgpt.app/v1",
      apiKey: process.env.GAPGPT_API_KEY ?? null,
      model: process.env.GAPGPT_MODEL ?? "gpt-4o-mini",
    };
  }
  if (name === "openai") {
    return {
      label: "سرویس متنی (OpenAI)",
      providerType: "openai-compatible",
      baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY ?? null,
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    };
  }
  // mock (یا ناشناخته) — بدون تماس واقعی
  return { label: "سرویس آزمایشی (Mock)", providerType: "mock", baseURL: null, apiKey: null, model: "mock" };
}

main()
  .catch((e) => {
    console.error("✗ خطا در بذرکاری:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
