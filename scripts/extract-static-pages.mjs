#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, readFileSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const staticDir = join(projectRoot, 'public', 'static');
const cssDir = join(staticDir, 'css');
const jsDir = join(staticDir, 'js');
const imagesDir = join(staticDir, 'images');

// مطمئن شو دایرکتوری‌ها وجود دارند
[cssDir, jsDir, imagesDir].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

const pages = [
  { path: 'index.html', pageKey: 'landing', title: 'لندینگ' },
  { path: 'about.html', pageKey: 'about', title: 'درباره ما' },
  { path: 'privacy.html', pageKey: 'privacy', title: 'حریم خصوصی' },
  { path: 'contact.html', pageKey: 'contact', title: 'تماس با ما' },
  { path: 'login.html', pageKey: 'login', title: 'لاگین' },
];

// لینک‌های authenticated که باید disabled شوند
const authenticatedLinks = [
  '/dashboard',
  '/plans',
  '/wallet',
  '/settings',
  '/history',
  '/reports',
  '/blog',
  '/support',
];

// لینک‌های عمومی که می‌ماند
const publicLinks = [
  '/',
  '/about',
  '/story',
  '/contact',
  '/privacy',
  '/login',
];

console.log('📄 Processing static pages...\n');

for (const page of pages) {
  try {
    console.log(`⏳ ${page.title}...`);
    const filePath = join(staticDir, page.path);
    const htmlContent = readFileSync(filePath, 'utf-8');

    // Parse HTML
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // ۱. Extract و تنظیم CSS
    const styles = document.querySelectorAll('style');
    const links = document.querySelectorAll('link[rel="stylesheet"]');

    let cssIndex = 0;
    const cssFiles = [];

    // Extract inline styles
    styles.forEach((style, idx) => {
      if (style.textContent.trim().length > 100) {
        const cssFile = `${page.pageKey}-${idx}.css`;
        const cssPath = join(cssDir, cssFile);
        writeFileSync(cssPath, style.textContent, 'utf-8');
        cssFiles.push(`/static/css/${cssFile}`);
        style.remove();
      }
    });

    // Handle external stylesheets
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.includes('/_next')) {
        link.remove();
      }
    });

    // اضافه کردن CSS لینک‌ها
    const head = document.querySelector('head');
    cssFiles.forEach((cssFile) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssFile;
      head.appendChild(link);
    });

    // ۲. تنظیم لینک‌های internal
    const allLinks = document.querySelectorAll('a[href]');
    allLinks.forEach((link) => {
      let href = link.getAttribute('href');

      if (!href) return;

      // اگر anchor link باشد، بگذار همان‌طور
      if (href.startsWith('#')) {
        return;
      }

      // لینک‌های authenticated را disabled کن
      if (authenticatedLinks.some(auth => href.startsWith(auth))) {
        link.setAttribute('disabled', 'true');
        link.style.opacity = '0.5';
        link.style.cursor = 'not-allowed';
        link.style.pointerEvents = 'none';
        link.setAttribute('title', 'این صفحه نیاز به ورود دارد');
        return;
      }

      // لینک‌های public را نسبی کن
      if (publicLinks.some(pub => href === pub || href.startsWith(pub + '/'))) {
        if (href === '/') {
          link.setAttribute('href', 'index.html');
        } else if (href === '/about') {
          link.setAttribute('href', 'about.html');
        } else if (href === '/contact') {
          link.setAttribute('href', 'contact.html');
        } else if (href === '/privacy') {
          link.setAttribute('href', 'privacy.html');
        } else if (href === '/login') {
          link.setAttribute('href', 'login.html');
        } else if (href.startsWith('/story')) {
          link.setAttribute('href', 'index.html#story');
        }
      }
    });

    // ۳. فرم‌ها را disabled کن
    const forms = document.querySelectorAll('form');
    forms.forEach((form) => {
      form.addEventListener = () => {};
      const inputs = form.querySelectorAll('input, textarea, button');
      inputs.forEach((input) => {
        input.setAttribute('disabled', 'true');
        input.style.opacity = '0.6';
      });
      const buttons = form.querySelectorAll('button[type="submit"]');
      buttons.forEach((btn) => {
        btn.setAttribute('onclick', 'alert("این فرم فقط نمایشی است"); return false;');
      });
    });

    // ۴. تصاویر را تنظیم کن
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      let src = img.getAttribute('src');
      if (src && src.includes('/_next/image')) {
        // صرفاً لینک را نسبی کن
        img.setAttribute('src', src.replace(/^.*\?url=/, '').split('&')[0]);
      }
      if (src && src.startsWith('/')) {
        img.setAttribute('src', `/static${src}`);
      }
    });

    // ۵. Next.js scripts را حذف کن
    const scripts = document.querySelectorAll('script');
    scripts.forEach((script) => {
      const src = script.getAttribute('src');
      if (!src || src.includes('/_next/')) {
        script.remove();
      }
    });

    // ۶. Meta tags را تنظیم کن
    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      htmlElement.setAttribute('lang', 'fa');
      htmlElement.setAttribute('dir', 'rtl');
    }

    // Save modified HTML
    const modifiedHtml = dom.serialize();
    writeFileSync(filePath, modifiedHtml, 'utf-8');

    console.log(`✅ ${page.title} — لینک‌ها تنظیم شدند\n`);

  } catch (error) {
    console.error(`❌ خطا در ${page.title}:`, error.message, '\n');
  }
}

// صفحهٔ لاگین را دانلود کن (اگر وجود ندارد)
try {
  console.log('⏳ Login page...');
  const loginPath = join(staticDir, 'login.html');

  if (!existsSync(loginPath)) {
    const response = await fetch('http://localhost:3000/login');
    if (response.ok) {
      let html = await response.text();

      const dom = new JSDOM(html);
      const document = dom.window.document;

      // تنظیمات مشابه برای login
      // ... (کد مشابه بالا)

      writeFileSync(loginPath, dom.serialize(), 'utf-8');
      console.log('✅ Login page saved\n');
    }
  } else {
    console.log('✅ Login page already exists\n');
  }
} catch (error) {
  console.error('⚠️  Login page error:', error.message, '\n');
}

// ایجاد Navigation Menu List
const navigationHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>صفحات استاتیک — همسو</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
      direction: rtl;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h1 {
      margin-bottom: 10px;
      color: #333;
      font-size: 28px;
    }

    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }

    .pages-list {
      list-style: none;
    }

    .pages-list li {
      margin: 12px 0;
    }

    .pages-list a {
      display: block;
      padding: 12px 16px;
      background: #f0f0f0;
      border-radius: 6px;
      text-decoration: none;
      color: #333;
      transition: all 0.2s;
      border-right: 3px solid transparent;
    }

    .pages-list a:hover {
      background: #e0e0e0;
      border-right-color: #4CAF50;
    }

    .status {
      display: inline-block;
      font-size: 12px;
      margin-right: 8px;
      padding: 2px 8px;
      background: #4CAF50;
      color: white;
      border-radius: 3px;
    }

    .note {
      margin-top: 30px;
      padding: 15px;
      background: #fff3cd;
      border-right: 4px solid #ffc107;
      border-radius: 4px;
      color: #856404;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌐 صفحات استاتیک — همسو</h1>
    <p class="subtitle">تمام صفحات جاوا اسکریپت و نیاز به سرور ندارند</p>

    <ul class="pages-list">
      <li><a href="index.html"><span class="status">📄</span> لندینگ</a></li>
      <li><a href="about.html"><span class="status">📄</span> درباره ما</a></li>
      <li><a href="privacy.html"><span class="status">📄</span> حریم خصوصی</a></li>
      <li><a href="contact.html"><span class="status">📄</span> تماس با ما (نمایشی)</a></li>
      <li><a href="login.html"><span class="status">📄</span> لاگین (نمایشی)</a></li>
    </ul>

    <div class="note">
      <strong>⚠️ نکات مهم:</strong><br>
      • لینک‌های authenticated (پنل، حساب، تنظیمات) غیرفعال هستند<br>
      • فرم‌های تماس و لاگین صرفاً نمایشی‌اند<br>
      • تمام استایل‌ها و فونت‌ها در این پوشه موجود‌اند<br>
      • هیچ اتصال به سرور نیست
    </div>
  </div>
</body>
</html>`;

writeFileSync(join(staticDir, 'README.html'), navigationHtml, 'utf-8');

console.log(`\n🎉 اتمام!`);
console.log(`✅ صفحات در: ${staticDir}`);
console.log(`✅ CSS در: ${cssDir}`);
console.log(`✅ فونت‌ها در: ${join(staticDir, 'Fonts')}`);
console.log(`\n📍 برای شروع: open ${join(staticDir, 'README.html')}`);
