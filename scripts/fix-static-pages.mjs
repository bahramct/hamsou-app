#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const staticDir = join(process.cwd(), 'public', 'static');

const pages = ['index.html', 'about.html', 'privacy.html', 'contact.html', 'login.html'];

console.log('🔧 Fixing static pages...\n');

for (const page of pages) {
  try {
    const filePath = join(staticDir, page);
    let html = readFileSync(filePath, 'utf-8');

    // ۱. تصحیح مسیرهای تصویر
    html = html.replace(/src="\/static\/static\/_next\/image/g, 'src="/static/_next/image');
    html = html.replace(/src="\/static\/_next\/image/g, 'src="/static/_next/image');
    html = html.replace(/srcset="\/static\/static\/_next\/image/g, 'srcset="/static/_next/image');
    html = html.replace(/srcset="\/static\/_next\/image/g, 'srcset="/static/_next/image');

    // ۲. تصحیح لینک‌های anchor
    html = html.replace(/href="index\.html#/g, 'href="#');

    // ۳. حذف Next.js specific attributes
    html = html.replace(/data-nimg="[^"]*"/g, '');
    html = html.replace(/data-jsx="[^"]*"/g, '');
    html = html.replace(/style="color:transparent[^"]*"/g, '');

    // ۴. افزودن meta viewport (اگر نیست)
    if (!html.includes('viewport')) {
      html = html.replace(
        '<head>',
        '<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />'
      );
    }

    // ۵. تصحیح عنوان صفحات
    const titles = {
      'index.html': 'همسو — برای واقعی‌تر زندگی کردن',
      'about.html': 'درباره ما — همسو',
      'privacy.html': 'حریم خصوصی — همسو',
      'contact.html': 'تماس با ما — همسو',
      'login.html': 'لاگین — همسو',
    };

    if (titles[page]) {
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${titles[page]}</title>`);
    }

    writeFileSync(filePath, html, 'utf-8');
    console.log(`✅ ${page} fixed`);
  } catch (error) {
    console.error(`❌ ${page}:`, error.message);
  }
}

// ایجاد styles.css بهتر
const stylesHtml = `/* Global Styles for Static Pages */
:root {
  --color-ink: #0a0a0a;
  --color-charcoal: #2a2a2a;
  --color-stone: #666666;
  --color-fog: #999999;
  --color-sage: #7a8471;
  --color-sage-deep: #5a6451;
  --color-ember: #c75d3c;
  --color-bone: #f0ede5;
  --color-paper: #ffffff;
  --color-stage: #fafaf8;
  --rgb-line: 0, 0, 0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-family: 'Pelak', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 300;
  letter-spacing: -0.005em;
  direction: rtl;
}

body {
  background-color: var(--color-paper);
  color: var(--color-ink);
  line-height: 1.6;
}

a {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

a[disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

img {
  max-width: 100%;
  height: auto;
}

/* Utility classes */
.h-full { height: 100%; }
.h-9 { height: 2.25rem; }
.w-auto { width: auto; }
.w-40 { width: 2.5rem; }
.max-w-7xl { max-width: 80rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-center { text-align: center; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-3 { gap: 0.75rem; }
.rounded-full { border-radius: 9999px; }
.fa-num { font-family: 'PelakFA', serif; }
`;

writeFileSync(join(staticDir, 'styles.css'), stylesHtml, 'utf-8');
console.log('✅ styles.css created');

console.log('\n🎉 All fixes applied!');
console.log('📍 Ready to use static pages');
