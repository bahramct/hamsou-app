#!/usr/bin/env node

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const staticDir = join(projectRoot, 'public', 'static');
const fontsSource = join(projectRoot, 'public', 'Fonts');
const fontsDest = join(staticDir, 'Fonts');

// تنظیمات صفحات
const pages = [
  { path: '/', filename: 'index.html', title: 'لندینگ' },
  { path: '/about', filename: 'about.html', title: 'درباره ما' },
  { path: '/privacy', filename: 'privacy.html', title: 'حریم خصوصی' },
  { path: '/contact', filename: 'contact.html', title: 'تماس با ما' },
];

async function startDevServer() {
  console.log('🚀 شروع سرور Next.js...');
  return new Promise((resolve, reject) => {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const server = spawn(npmCmd, ['run', 'dev'], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let output = '';
    const timeout = setTimeout(() => {
      reject(new Error('سرور برای شروع زمان بیشتری نیاز داشت'));
    }, 45000);

    server.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write('.');
      if (text.includes('localhost') || text.includes('ready') || text.includes('compiled')) {
        clearTimeout(timeout);
        console.log('\n✅ سرور آماده است');
        resolve({ process: server, output });
      }
    });

    server.stderr.on('data', (data) => {
      output += data.toString();
    });

    server.on('error', (err) => {
      console.error('Server spawn error:', err);
      reject(err);
    });
  });
}

async function generatePages() {
  let serverProcess = null;

  try {
    // شروع سرور
    const { process: proc } = await startDevServer();
    serverProcess = proc;

    // منتظر باشید تا سرور کاملاً بارگذاری شود
    await new Promise(r => setTimeout(r, 2000));

    // ایجاد دایرکتوری static
    if (!existsSync(staticDir)) {
      mkdirSync(staticDir, { recursive: true });
    }

    // کپی فونت‌ها
    if (existsSync(fontsSource)) {
      console.log('📋 کپی فونت‌ها...');
      if (existsSync(fontsDest)) {
        // حذف دایرکتوری قدیمی
        cpSync(fontsDest, fontsDest, { force: true });
      }
      cpSync(fontsSource, fontsDest, { recursive: true, force: true });
      console.log('✅ فونت‌ها کپی شدند');
    }

    // راه‌اندازی Playwright
    const browser = await chromium.launch();
    const context = await browser.createContext({
      viewport: { width: 1280, height: 720 },
      locale: 'fa-IR',
      colorScheme: 'light',
    });

    console.log('\n📄 تولید صفحات HTML...\n');

    for (const page of pages) {
      try {
        console.log(`⏳ در حال تولید: ${page.title}...`);

        const browserPage = await context.newPage();

        // حذف سکریپت‌های بی‌نیاز برای بهتری عملکرد
        await browserPage.addInitScript(() => {
          window.__NEXT_DATA__ = window.__NEXT_DATA__ || {};
        });

        // رفتن به صفحه
        await browserPage.goto(`http://localhost:3000${page.path}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // منتظر باشید تا صفحه کاملاً لود شود
        await browserPage.waitForLoadState('networkidle');
        await new Promise(r => setTimeout(r, 500));

        // گرفتن HTML
        let html = await browserPage.content();

        // اصلاح مسیرهای نسبی برای static
        html = html
          .replace(/href="\/Fonts/g, 'href="/static/Fonts')
          .replace(/href=['"]\/(?!static|api|_|\[)/g, 'href="/')
          .replace(/src=['"]\/(?!static|api|_|images|\[)/g, 'src="/');

        // ذخیره HTML
        const outputPath = join(staticDir, page.filename);
        writeFileSync(outputPath, html, 'utf-8');
        console.log(`✅ ذخیره شد: ${page.filename}\n`);

        await browserPage.close();
      } catch (error) {
        console.error(`❌ خطا در تولید ${page.title}:`, error.message);
      }
    }

    await context.close();
    await browser.close();

    console.log(`\n🎉 تمام صفحات در ${staticDir} ذخیره شدند!`);
    console.log('📂 فایل‌های تولید‌شده:');
    for (const page of pages) {
      console.log(`   - ${page.filename}`);
    }

  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  } finally {
    if (serverProcess) {
      console.log('\n🛑 توقف سرور...');
      serverProcess.kill();
    }
  }
}

generatePages();
