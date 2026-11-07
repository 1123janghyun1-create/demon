import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vwtlhgqmndrshjcekhii.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_It2EcGB26YzpEj6vbZQ5-g_GorZe1C5';
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

function normalizeImageUrl(url, baseUrl) {
  if (!url) return '';
  if (url.startsWith('data:')) return ''; // Google sitemaps do not support data URIs
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function generate() {
  console.log('🤖 Googlebot 자동 크롤링용 sitemap.xml 생성 중...');

  let products = [];
  let builders = [];

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: pData } = await supabase.from('products').select('*');
    if (pData) products = pData;

    const { data: bData } = await supabase.from('builders').select('*');
    if (bData) builders = bData;
  } catch (err) {
    console.warn('Supabase fetch failed during sitemap generation, using local cache:', err);
  }

  // Fallback to local files if empty
  if (products.length === 0) {
    try {
      const localP = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/products.json'), 'utf8'));
      if (Array.isArray(localP)) products = localP;
    } catch {}
  }
  if (builders.length === 0) {
    try {
      const localB = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/builders_data.json'), 'utf8'));
      if (Array.isArray(localB)) builders = localB;
    } catch {}
  }

  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- 1. demonst 메인 홈 -->
  <url>
    <loc>${siteBaseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${siteBaseUrl}/demon-mascot.png</image:loc>
      <image:title>demonst - 10초 런치패드 &amp; 앱 테스팅 플랫폼</image:title>
      <image:caption>인디 메이커와 1인 개발자를 위한 사이드 프로젝트 피드백 &amp; 테스트 플랫폼</image:caption>
    </image:image>
  </url>

  <!-- 2. 주요 탭 페이지 (Google Search Console 표준: '#' 대신 '?tab=' 쿼리 사용) -->
  <url>
    <loc>${siteBaseUrl}/?tab=test</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/?tab=builders</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/?tab=leaderboard</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/?tab=community</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/?tab=submit</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/?tab=about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;

  // 3. 등록된 프로젝트 및 스크린샷 이미지 크롤링 대상
  products.forEach((p) => {
    const pUrl = `${siteBaseUrl}/?product=${encodeURIComponent(p.id)}`;
    xml += `  <url>
    <loc>${pUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
`;
    const screenshotUrl = normalizeImageUrl(p.screenshot, siteBaseUrl);
    if (screenshotUrl) {
      xml += `    <image:image>
      <image:loc>${escapeXml(screenshotUrl)}</image:loc>
      <image:title>${escapeXml(p.title)} 스크린샷</image:title>
      <image:caption>${escapeXml(p.tagline || p.title)}</image:caption>
    </image:image>
`;
    }
    const iconUrl = normalizeImageUrl(p.icon, siteBaseUrl);
    if (iconUrl) {
      xml += `    <image:image>
      <image:loc>${escapeXml(iconUrl)}</image:loc>
      <image:title>${escapeXml(p.title)} 로고</image:title>
    </image:image>
`;
    }
    xml += `  </url>
`;
  });

  // 4. 등록된 빌더 프로필 및 아바타 이미지 크롤링 대상
  builders.forEach((b) => {
    const bUrl = `${siteBaseUrl}/?builder=${encodeURIComponent(b.id)}`;
    xml += `  <url>
    <loc>${bUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
`;
    const avatarUrl = normalizeImageUrl(b.avatar, siteBaseUrl);
    if (avatarUrl) {
      xml += `    <image:image>
      <image:loc>${escapeXml(avatarUrl)}</image:loc>
      <image:title>${escapeXml(b.name)} 빌더 프로필</image:title>
      <image:caption>${escapeXml(b.role || '인디 메이커')}</image:caption>
    </image:image>
`;
    }
    xml += `  </url>
`;
  });

  xml += `</urlset>
`;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`✅ sitemap.xml 생성 완료: ${outputPath} (프로젝트: ${products.length}개, 빌더: ${builders.length}명)`);
}

generate().catch((err) => {
  console.error('Sitemap generation error:', err);
});
