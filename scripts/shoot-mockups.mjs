// scripts/shoot-mockups.mjs — اسکرین از خودِ فایل‌های ماکاپ (file://) برای مقایسهٔ side-by-side.
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const OUT = "mockups/_shots";
const FILES = ["dashboard-unified.html", "dashboard-todaypanel.html", "goal-journey.html"];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const f of FILES) {
    const url = pathToFileURL(resolve("mockups", f)).href;
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const out = `${OUT}/mk-${f.replace(/\.html$/, "")}.png`;
    await page.screenshot({ path: out, fullPage: true });
    console.log("· " + out);
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
