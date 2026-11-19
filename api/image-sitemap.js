// api/image-sitemap.js
// Dedicated Google Image Sitemap (/image-sitemap.xml) for Googlebot-Image
// Indexes EVERY brand image, product icon, product screenshot, gallery screenshot, feedback capture, and builder avatar!

import { createClient } from '@supabase/supabase-js';

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

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${siteBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default async function handler(req, res) {
  let products = [];
  let builders = [];
  let feedbacks = [];

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const [pRes, bRes, fRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('builders').select('*'),
      supabase.from('feedbacks').select('*'),
    ]);
    if (Array.isArray(pRes?.data)) products = pRes.data;
    if (Array.isArray(bRes?.data)) builders = bRes.data;
    if (Array.isArray(fRes?.data)) feedbacks = fRes.data;
  } catch (err) {
    console.warn('image-sitemap supabase fetch warning:', err?.message);
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- demonst 공식 브랜드 및 아이콘 이미지 -->
  <url>
    <loc>${siteBaseUrl}/</loc>
    <image:image>
      <image:loc>${siteBaseUrl}/demon-mascot.png</image:loc>
      <image:title>demonst 공식 마스코트</image:title>
      <image:caption>인디 메이커 앱 테스트 &amp; 10초 런치패드 demonst 마스코트</image:caption>
    </image:image>
    <image:image>
      <image:loc>${siteBaseUrl}/logo.png</image:loc>
      <image:title>demonst 공식 로고</image:title>
      <image:caption>사이드 프로젝트 런칭 및 베타 테스터 커뮤니티 demonst 로고</image:caption>
    </image:image>
    <image:image>
      <image:loc>${siteBaseUrl}/logo-cropped.png</image:loc>
      <image:title>demonst 크롭 브랜드 로고</image:title>
    </image:image>
    <image:image>
      <image:loc>${siteBaseUrl}/icon-512.png</image:loc>
      <image:title>demonst 앱 아이콘 512px</image:title>
    </image:image>
  </url>
`;

  // 모든 제품별 아이콘 + 대표 스크린샷 + 갤러리 전체 + 피드백 캡처 이미지
  products.forEach((p) => {
    const pUrl = `${siteBaseUrl}/?product=${encodeURIComponent(p.id)}`;
    const seen = new Set();
    const imgEntries = [];

    const addImg = (rawUrl, title, caption) => {
      const u = normalizeImageUrl(rawUrl);
      if (!u || seen.has(u)) return;
      seen.add(u);
      imgEntries.push({ url: u, title, caption });
    };

    addImg(p.screenshot, `${p.title} 대표 스크린샷`, p.tagline || p.title);
    addImg(p.icon, `${p.title} 앱 아이콘 로고`, `${p.title} (${p.category || '웹앱'}) 공식 로고`);

    if (Array.isArray(p.gallery)) {
      p.gallery.forEach((gUrl, idx) => {
        addImg(gUrl, `${p.title} 서비스 화면 갤러리 #${idx + 1}`, `${p.title} - ${p.tagline || '미리보기 스크린샷'}`);
      });
    }

    // Include feedback screenshots attached to this product
    feedbacks
      .filter((fb) => fb.product_id === p.id || fb.product_id === p.slug)
      .forEach((fb, idx) => {
        if (fb.screenshot) {
          addImg(fb.screenshot, `${p.title} 테스터 ${fb.author || '유저'} 리뷰 캡처 #${idx + 1}`, fb.content?.slice(0, 120) || p.title);
        }
      });

    if (imgEntries.length > 0) {
      xml += `  <url>
    <loc>${escapeXml(pUrl)}</loc>
`;
      imgEntries.forEach((img) => {
        xml += `    <image:image>
      <image:loc>${escapeXml(img.url)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
      <image:caption>${escapeXml(img.caption)}</image:caption>
    </image:image>
`;
      });
      xml += `  </url>
`;
    }
  });

  // 모든 빌더 프로필 아바타 이미지
  builders.forEach((b) => {
    const avatarUrl = normalizeImageUrl(b.avatar);
    if (!avatarUrl) return;
    const bUrl = `${siteBaseUrl}/?builder=${encodeURIComponent(b.id)}`;
    xml += `  <url>
    <loc>${escapeXml(bUrl)}</loc>
    <image:image>
      <image:loc>${escapeXml(avatarUrl)}</image:loc>
      <image:title>${escapeXml(b.name)} 빌더 프로필 사진</image:title>
      <image:caption>${escapeXml(b.name)} (${escapeXml(b.role || '인디 메이커')}) - ${escapeXml(b.bio || 'demonst 메이커')}</image:caption>
    </image:image>
  </url>
`;
  });

  xml += `</urlset>
`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'index, follow');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
  res.status(200).send(xml);
}
