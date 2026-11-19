// scripts/update-index-seo.js
// Injects LIVE Supabase products (with ALL images!), builders (with avatars!),
// 500 curated SEO keywords, and FAQs into index.html for instant Googlebot & Googlebot-Image Wave 1 crawling!

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vwtlhgqmndrshjcekhii.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_It2EcGB26YzpEj6vbZQ5-g_GorZe1C5';

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeImg(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return '';
  return url;
}

async function run() {
  const keywordsModule = await import('../src/data/seoKeywords.ts');
  const { SEO_KEYWORD_CATEGORIES, ALL_SEO_KEYWORDS, SEO_LONG_TAIL_FAQS } = keywordsModule;

  // Fetch live products, builders, feedbacks from Supabase (with local JSON fallback)
  let products = [];
  let builders = [];
  let feedbacks = [];

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const [pRes, bRes, fRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('builders').select('*').order('updated_at', { ascending: false }),
      supabase.from('feedbacks').select('*').order('created_at', { ascending: false }),
    ]);
    if (Array.isArray(pRes?.data) && pRes.data.length > 0) products = pRes.data;
    if (Array.isArray(bRes?.data) && bRes.data.length > 0) builders = bRes.data;
    if (Array.isArray(fRes?.data) && fRes.data.length > 0) feedbacks = fRes.data;
  } catch (err) {
    console.warn('Supabase live fetch fallback to local JSON:', err?.message);
  }

  if (products.length === 0) {
    try {
      products = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/products.json'), 'utf8'));
    } catch {}
  }
  if (builders.length === 0) {
    try {
      builders = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/builders_data.json'), 'utf8'));
    } catch {}
  }

  const indexPath = path.join(__dirname, '../index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  // 1. Replace <meta name="keywords" content="..." />
  const metaKeywordsStr = ALL_SEO_KEYWORDS.join(', ');
  html = html.replace(
    /<meta name="keywords" content="[^"]*" \/>/,
    `<meta name="keywords" content="${metaKeywordsStr}" />`
  );

  // Ensure image-sitemap link is present in <head>
  if (!html.includes('image-sitemap.xml')) {
    html = html.replace(
      /<link rel="alternate" type="application\/rss\+xml"/,
      `<link rel="sitemap" type="application/xml" title="Google Image Sitemap" href="https://demonst.vercel.app/image-sitemap.xml" />\n    <link rel="alternate" type="application/rss+xml"`
    );
  }

  // 2. Generate Live Products HTML with ALL Images (Icon, Screenshot, Gallery, Feedback Captures)
  let totalImageCount = 2; // mascot + logo
  const productsHtml = products
    .map((p) => {
      const imgs = [];
      const seen = new Set();
      const pushImg = (u, alt) => {
        const s = safeImg(u);
        if (!s || seen.has(s)) return;
        seen.add(s);
        imgs.push({ url: s, alt });
        totalImageCount++;
      };

      pushImg(p.screenshot, `${p.title} 대표 스크린샷 - ${p.tagline || ''}`);
      pushImg(p.icon, `${p.title} 앱 로고 아이콘`);
      if (Array.isArray(p.gallery)) {
        p.gallery.forEach((g, idx) => pushImg(g, `${p.title} 서비스 화면 갤러리 #${idx + 1}`));
      }
      feedbacks
        .filter((f) => f.product_id === p.id || f.product_id === p.slug)
        .forEach((f, idx) => {
          if (f.screenshot) pushImg(f.screenshot, `${p.title} 테스터 피드백 캡처 #${idx + 1}`);
        });

      const descPreview = esc((p.description || p.instructions || '').replace(/[#*`]/g, '').slice(0, 260));
      return `
            <li style="margin-bottom: 18px; list-style: none; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px;">
              <a href="/?product=${encodeURIComponent(p.id)}" style="font-weight: bold; font-size: 16px; color: #111827; text-decoration: none;">
                <strong>${esc(p.title)}</strong> — ${esc(p.tagline || '사이드 프로젝트')}
              </a>
              <p style="font-size: 13px; color: #4b5563; margin: 6px 0;">카테고리: ${esc(p.category || '생산성')} · 제작자: ${esc(p.author || '인디 메이커')} · 업보트: ${p.upvotes || 0}</p>
              <p style="font-size: 12px; color: #6b7280; margin: 4px 0;">${descPreview}</p>
              <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                ${imgs.map((im) => `<img src="${esc(im.url)}" alt="${esc(im.alt)}" loading="lazy" style="max-height: 96px; border-radius: 8px;" />`).join('\n                ')}
              </div>
            </li>`;
    })
    .join('');

  // 3. Generate Live Builders HTML with Avatars
  const buildersHtml = builders
    .map((b) => {
      const av = safeImg(b.avatar) || '/demon-mascot.png';
      totalImageCount++;
      return `
            <li style="margin-bottom: 8px; list-style: none;">
              <a href="/?builder=${encodeURIComponent(b.id)}" style="text-decoration: none; color: #111827;">
                <img src="${esc(av)}" alt="${esc(b.name)} 인디 메이커 아바타" width="28" height="28" style="border-radius: 9999px; vertical-align: middle; margin-right: 6px;" />
                <strong>${esc(b.name)}</strong> — ${esc(b.role || '인디 메이커')} (${esc((b.bio || '').slice(0, 80))})
              </a>
            </li>`;
    })
    .join('');

  // 4. Generate Semantic Keywords Directory HTML
  let categoriesHtml = '';
  SEO_KEYWORD_CATEGORIES.forEach((cat) => {
    categoriesHtml += `
        <div style="margin-top: 20px;">
          <h3 style="font-size: 15px; font-weight: bold; color: #1f2937;">📌 ${esc(cat.name)}</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            ${cat.keywords
              .map(
                (kw) =>
                  `<a href="/?q=${encodeURIComponent(
                    kw
                  )}" style="font-size: 12px; padding: 3px 8px; background: #f3f4f6; color: #374151; border-radius: 9999px; text-decoration: none; border: 1px solid #e5e7eb;">#${esc(kw)}</a>`
              )
              .join('\n            ')}
          </div>
        </div>`;
  });

  // 5. Generate Long-Tail FAQ HTML
  let faqsHtml = '';
  SEO_LONG_TAIL_FAQS.forEach((faq, idx) => {
    faqsHtml += `
          <details ${idx === 0 ? 'open' : ''} style="margin-bottom: 12px; padding: 8px 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
            <summary style="font-weight: bold; cursor: pointer; color: #111827;">${esc(faq.q)}</summary>
            <p style="margin-top: 6px; font-size: 13px; color: #4b5563; line-height: 1.6;">${esc(faq.a)}</p>
          </details>`;
  });

  const mainContent = `<main style="max-width: 960px; margin: 0 auto; padding: 30px 20px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <img src="/demon-mascot.png" alt="demonst 인디 메이커 런치패드 공식 마스코트" width="64" height="64" />
          <div>
            <h1>demonst — 인디 메이커 앱 테스트 &amp; 런치패드</h1>
            <p>사이드 프로젝트와 1인 개발자를 위한 가장 빠른 10초 런치패드 &amp; 피드백 플랫폼. 누구나 무료로 웹앱을 런칭하고 초기 테스터의 진솔한 피드백을 모으세요.</p>
          </div>
        </div>

        <section id="featured-apps" style="margin-top: 30px;">
          <h2>🚀 등록된 사이드 프로젝트 (${products.length}개 · 이미지 전체 색인)</h2>
          <ul style="padding: 0;">${productsHtml}
          </ul>
        </section>

        <section id="active-builders" style="margin-top: 30px;">
          <h2>👥 활성 인디 빌더 &amp; 개발자 (${builders.length}명)</h2>
          <ul style="padding: 0;">${buildersHtml}
          </ul>
        </section>

        <!-- 500 Curated Search Query Topics Directory for Googlebot -->
        <section id="seo-topics-directory" style="margin-top: 36px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
          <h2>🔍 사이드 프로젝트 &amp; 인디 메이커 인기 탐색 토픽 (500 검색어)</h2>
          <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
            Google Search Console 및 검색엔진 최적화를 위한 사이드 프로젝트, 앱 테스팅, 베타 테스터 모집, 스타트업 MVP 검증, SaaS 및 AI 기술 스택 종합 키워드 모음입니다.
          </p>
          ${categoriesHtml}
        </section>

        <section id="seo-faq" style="margin-top: 36px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
          <h2>❓ 인디 메이커 &amp; 사이드 프로젝트 자주 묻는 질문 (FAQ)</h2>
          ${faqsHtml}
        </section>
      </main>`;

  // Replace entire <main ...>...</main> idempotently
  html = html.replace(/<main[\s\S]*?<\/main>/, mainContent);

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(
    `✅ index.html SEO 주입 완료! (프로젝트: ${products.length}개, 빌더: ${builders.length}명, 이미지: ${totalImageCount}개, 키워드: ${ALL_SEO_KEYWORDS.length}개)`
  );
}

run().catch(console.error);
