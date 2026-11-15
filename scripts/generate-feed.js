// scripts/generate-feed.js
// Generates public/feed.xml (RSS 2.0 & Atom) for Googlebot and search engines
// Automatically discovers new products, builders, and community items

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteBaseUrl = 'https://demonst.vercel.app';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateRssFeed() {
  console.log('📡 Googlebot & 검색엔진 자동 크롤링용 RSS Feed (feed.xml) 생성 중...');

  let products = [];
  let builders = [];

  try {
    const productsPath = path.join(__dirname, '../src/data/products.json');
    if (fs.existsSync(productsPath)) {
      products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    }
  } catch {}

  try {
    const buildersPath = path.join(__dirname, '../src/data/builders_data.json');
    if (fs.existsSync(buildersPath)) {
      builders = JSON.parse(fs.readFileSync(buildersPath, 'utf8'));
    }
  } catch {}

  const buildDate = new Date().toUTCString();

  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>demonst — 인디 메이커 앱 테스트 &amp; 런치패드</title>
    <link>${siteBaseUrl}/</link>
    <description>사이드 프로젝트와 인디 메이커를 위한 앱 테스트 &amp; 런치패드 플랫폼. 실제 피드백을 모으고 함께 성장하세요.</description>
    <language>ko-KR</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${siteBaseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteBaseUrl}/demon-mascot.png</url>
      <title>demonst</title>
      <link>${siteBaseUrl}/</link>
    </image>
`;

  // 1. Products as RSS Items
  products.forEach((p) => {
    const pUrl = `${siteBaseUrl}/?product=${encodeURIComponent(p.id)}`;
    rss += `    <item>
      <title>${escapeXml(p.title)} — ${escapeXml(p.tagline)}</title>
      <link>${escapeXml(pUrl)}</link>
      <guid isPermaLink="true">${escapeXml(pUrl)}</guid>
      <description>${escapeXml(p.description || p.tagline || '인디 메이커 사이드 프로젝트')}</description>
      <category>${escapeXml(p.category || 'SaaS')}</category>
      <author>demonst1004@gmail.com (${escapeXml(p.author || '인디 메이커')})</author>
      <pubDate>${buildDate}</pubDate>
    </item>
`;
  });

  // 2. Builders as RSS Items
  builders.forEach((b) => {
    const bUrl = `${siteBaseUrl}/?builder=${encodeURIComponent(b.id)}`;
    rss += `    <item>
      <title>빌더 프로필: ${escapeXml(b.name)} (${escapeXml(b.role || '인디 메이커')})</title>
      <link>${escapeXml(bUrl)}</link>
      <guid isPermaLink="true">${escapeXml(bUrl)}</guid>
      <description>${escapeXml(b.bio || '새로운 가치를 코드로 만드는 멋진 인디 메이커입니다.')}</description>
      <category>빌더 / 메이커</category>
      <author>demonst1004@gmail.com (${escapeXml(b.name)})</author>
      <pubDate>${buildDate}</pubDate>
    </item>
`;
  });

  rss += `  </channel>
</rss>
`;

  const outputPath = path.join(__dirname, '../public/feed.xml');
  fs.writeFileSync(outputPath, rss, 'utf8');
  console.log(`✅ feed.xml 생성 완료: ${outputPath} (아이템: ${products.length + builders.length}개)`);
}

generateRssFeed().catch((err) => {
  console.error('Feed generation error:', err);
});
