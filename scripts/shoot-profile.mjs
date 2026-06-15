// scripts/shoot-profile.mjs — اسکرینِ ماکاپِ پروفایل در حالت‌های مختلف (default + popover + modal + drawer).
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const OUT = "mockups/_shots";
const URL = pathToFileURL(resolve("mockups", "profile-redesign.html")).href;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);

  // 1) نمای کامل
  await page.screenshot({ path: `${OUT}/mk-profile-full.png`, fullPage: true });
  console.log("· mk-profile-full");

  // 3) مودالِ تراکنش‌ها
  await page.evaluate(() => window.openTx());
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/mk-profile-txmodal.png` });
  console.log("· mk-profile-txmodal");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 4) دراورِ پشتیبانی (فهرست)
  await page.evaluate(() => window.openSupport(false));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/mk-profile-support.png` });
  console.log("· mk-profile-support");

  // 5) دراورِ پشتیبانی (گفتگو)
  await page.evaluate(() => window.openThread());
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/mk-profile-thread.png` });
  console.log("· mk-profile-thread");

  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
