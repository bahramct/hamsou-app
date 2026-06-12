#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { setTimeout as sleep } from 'timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const staticDir = join(projectRoot, 'public', 'static');
const fontsSource = join(projectRoot, 'public', 'Fonts');
const fontsDest = join(staticDir, 'Fonts');

const BASE_URL = 'http://localhost:3000';
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

const pages = [
  { path: '/', filename: 'index.html', title: 'لندینگ' },
  { path: '/about', filename: 'about.html', title: 'درباره ما' },
  { path: '/privacy', filename: 'privacy.html', title: 'حریم خصوصی' },
  { path: '/contact', filename: 'contact.html', title: 'تماس با ما' },
];

async function waitForServer(url, retries = MAX_RETRIES) {
  console.log(`⏳ در انتظار سرور (${BASE_URL})...`);

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok || response.status === 404) {
        console.log('✅ سرور آماده است\n');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }

    if (i < retries - 1) {
      process.stdout.write('.');
      await sleep(RETRY_DELAY);
    }
  }

  return false;
}

async function downloadPage(path) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

async function generatePages() {
  try {
    // ایجاد دایرکتوری static
    if (!existsSync(staticDir)) {
      mkdirSync(staticDir, { recursive: true });
    }

    // کپی فونت‌ها
    if (existsSync(fontsSource)) {
      console.log('📋 کپی فونت‌ها...');
      cpSync(fontsSource, fontsDest, { recursive: true, force: true });
      console.log('✅ فونت‌ها کپی شدند\n');
    }

    // منتظر سرور
    if (!(await waitForServer(BASE_URL))) {
      console.error('❌ سرور پاسخ نداد. مطمئن شوید "npm run dev" در حال اجرا است.');
      process.exit(1);
    }

    console.log('📄 دانلود و ذخیره صفحات...\n');

    for (const page of pages) {
      try {
        console.log(`⏳ ${page.title}...`);
        const html = await downloadPage(page.path);

        const outputPath = join(staticDir, page.filename);
        writeFileSync(outputPath, html, 'utf-8');

        const sizeMB = (html.length / 1024 / 1024).toFixed(2);
        console.log(`✅ ذخیره شد: ${page.filename} (${sizeMB} MB)\n`);
      } catch (error) {
        console.error(`❌ خطا در ${page.title}: ${error.message}\n`);
      }
    }

    console.log(`\n🎉 اتمام! صفحات در ${staticDir} ذخیره شدند.`);
    console.log('\n📂 فایل‌های تولید‌شده:');
    for (const page of pages) {
      console.log(`   - ${page.filename}`);
    }
    console.log(`   - Fonts/ (${pages.length * 2} فایل)}`);

  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  }
}

generatePages();
