#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, cpSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const staticDir = join(projectRoot, 'public', 'static');
const fontsSource = join(projectRoot, 'public', 'Fonts');
const fontsDest = join(staticDir, 'Fonts');
const srcDir = join(projectRoot, 'src');

// ایجاد دایرکتوری static
if (!existsSync(staticDir)) {
  mkdirSync(staticDir, { recursive: true });
}

// کپی فونت‌ها
if (existsSync(fontsSource)) {
  console.log('📋 کپی فونت‌ها...');
  cpSync(fontsSource, fontsDest, { recursive: true, force: true });
  console.log('✅ فونت‌ها کپی شدند');
}

// خواندن فایل‌های استایل و فونت
const globalCss = readFileSync(join(srcDir, 'app', 'globals.css'), 'utf-8');

// تنظیمات صفحات
const pages = [
  {
    path: 'index',
    title: 'لندینگ',
    pageKey: 'landing',
    metaTitle: 'همسو',
    metaDescription: 'کاهش فاصله میان حرف، تصمیم و عمل',
  },
  {
    path: 'about',
    title: 'درباره ما',
    pageKey: 'about',
    metaTitle: 'درباره ما — همسو',
    metaDescription: 'همسو از یک سوال ساخته شد: چرا فاصله‌ای بین آنچه می‌گوییم و آنچه می‌کنیم هست؟',
  },
  {
    path: 'privacy',
    title: 'حریم خصوصی',
    pageKey: 'privacy',
    metaTitle: 'حریم خصوصی — همسو',
    metaDescription: 'همسو متعهد است داده‌های شما را با حداکثر مراقبت و احترام نگه‌داری کند.',
  },
  {
    path: 'contact',
    title: 'تماس با ما',
    pageKey: 'contact',
    metaTitle: 'تماس با ما — همسو',
    metaDescription: 'سوالی داری؟ آرام بپرس. ما از شنیدن از تو خوشحال می‌شویم.',
  },
];

// HTML template با styles و fonts
function createHtmlTemplate(title, pageKey) {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${title}" />

  <!-- Fonts -->
  <link rel="preload" href="/static/Fonts/Pelak FontFamily/webfonts/woff2/Pelak-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/static/Fonts/Farsi Numeral/webfonts/woff2/PelakFA-Regular.woff2" as="font" type="font/woff2" crossorigin />

  <!-- Global Styles -->
  <style>
${globalCss}
  </style>

  <style>
    /* Fallback fonts */
    @font-face {
      font-family: 'Pelak';
      src: url('/static/Fonts/Pelak FontFamily/webfonts/woff2/Pelak-Regular.woff2') format('woff2'),
           url('/static/Fonts/Pelak FontFamily/webfonts/woff/Pelak-Regular.woff') format('woff');
      font-weight: 400;
      font-display: swap;
    }

    @font-face {
      font-family: 'PelakFA';
      src: url('/static/Fonts/Farsi Numeral/webfonts/woff2/PelakFA-Regular.woff2') format('woff2'),
           url('/static/Fonts/Farsi Numeral/webfonts/woff/PelakFA-Regular.woff') format('woff');
      font-weight: 400;
      font-display: swap;
    }

    body {
      font-family: 'Pelak', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* Dark mode support */
    :root {
      color-scheme: light;
    }
  </style>
</head>
<body>
  <noscript>
    <p>برای استفاده از این سایت جاوا اسکریپت را فعال کنید.</p>
  </noscript>

  <div id="__next">
    <main class="grain">
      <!-- Static Page Content Placeholder -->
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <h1>${title}</h1>
          <p>صفحهٔ ${title} - آماده برای پر شدن با محتوای Next.js</p>
        </div>
      </div>
    </main>
  </div>

  <!-- Next.js Scripts -->
  <script src="/_next/static/chunks/webpack.js"></script>
  <script src="/_next/static/chunks/main.js"></script>
</body>
</html>`;
}

console.log('\n📄 تولید صفحات HTML...\n');

for (const page of pages) {
  try {
    const html = createHtmlTemplate(page.title, page.pageKey);
    const filename = page.path === 'index' ? 'index.html' : `${page.path}.html`;
    const outputPath = join(staticDir, filename);

    writeFileSync(outputPath, html, 'utf-8');
    console.log(`✅ ذخیره شد: ${filename}`);
  } catch (error) {
    console.error(`❌ خطا در تولید ${page.title}:`, error.message);
  }
}

console.log(`\n🎉 تمام صفحات در ${staticDir} ذخیره شدند!`);
console.log('\n📝 نکات مهم:');
console.log('   • فونت‌ها در /static/Fonts ذخیره شده‌اند');
console.log('   • استایل‌های Global.css وارد شده‌اند');
console.log('   • محتوای dynamic نیاز به Next.js سرور دارد');
console.log('\n💡 برای full rendering، سرور را اجرا کنید:');
console.log('   npm run dev');
