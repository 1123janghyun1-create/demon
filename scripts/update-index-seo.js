// scripts/update-index-seo.js
// Injects the 500 curated SEO keywords and comprehensive semantic content into index.html

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const keywordsModule = await import('../src/data/seoKeywords.ts');
  const { SEO_KEYWORD_CATEGORIES, ALL_SEO_KEYWORDS, SEO_LONG_TAIL_FAQS } = keywordsModule;

  const indexPath = path.join(__dirname, '../index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  // 1. Replace <meta name="keywords" content="..." />
  const metaKeywordsStr = ALL_SEO_KEYWORDS.join(', ');
  html = html.replace(
    /<meta name="keywords" content="[^"]*" \/>/,
    `<meta name="keywords" content="${metaKeywordsStr}" />`
  );

  // 2. Generate Semantic Keywords Directory HTML
  let categoriesHtml = '';
  SEO_KEYWORD_CATEGORIES.forEach((cat) => {
    categoriesHtml += `
        <div style="margin-top: 20px;">
          <h3 style="font-size: 15px; font-weight: bold; color: #1f2937;">📌 ${cat.name}</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            ${cat.keywords
              .map(
                (kw) =>
                  `<a href="/?q=${encodeURIComponent(
                    kw
                  )}" style="font-size: 12px; padding: 3px 8px; background: #f3f4f6; color: #374151; border-radius: 9999px; text-decoration: none; border: 1px solid #e5e7eb;">#${kw}</a>`
              )
              .join('\n            ')}
          </div>
        </div>`;
  });

  // 3. Generate Long-Tail FAQ HTML
  let faqsHtml = '';
  SEO_LONG_TAIL_FAQS.forEach((faq, idx) => {
    faqsHtml += `
          <details ${idx === 0 ? 'open' : ''} style="margin-bottom: 12px; padding: 8px 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
            <summary style="font-weight: bold; cursor: pointer; color: #111827;">${faq.q}</summary>
            <p style="margin-top: 6px; font-size: 13px; color: #4b5563; line-height: 1.6;">${faq.a}</p>
          </details>`;
  });

  const topicsSection = `
        <!-- 500 Curated Search Query Topics Directory for Googlebot -->
        <section id="seo-topics-directory" style="margin-top: 36px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
          <h2>🔍 사이드 프로젝트 &amp; 인디 메이커 인기 탐색 토픽 (500 검색어)</h2>
          <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
            Google Search Console 및 검색엔진 최적화를 위한 사이드 프로젝트, 앱 테스팅, 베타 테스터 모집, 스타트업 MVP 검증, SaaS 및 AI 기술 스택 종합 키워드 모음입니다.
          </p>
          ${categoriesHtml}
        </section>

        <section style="margin-top: 36px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
          <h2>❓ 인디 메이커 &amp; 사이드 프로젝트 자주 묻는 질문 (FAQ)</h2>
          ${faqsHtml}
        </section>
      </main>`;

  // Replace existing FAQ section and close of </main>
  html = html.replace(/<section style="margin-top: 30px;">\s*<h2>❓ 자주 묻는 질문[\s\S]*?<\/main>/, topicsSection);

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`✅ index.html에 500개 SEO 키워드 및 FAQ 주입 완료! (키워드 수: ${ALL_SEO_KEYWORDS.length}개)`);
}

run().catch(console.error);
