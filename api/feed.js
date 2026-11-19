// api/feed.js
// Dynamic RSS 2.0 + Media RSS Feed (/feed.xml) with live Supabase products & images
// Helps Google Discover, Googlebot, Feedly, and search aggregators auto-crawl new apps and images immediately!

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

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const [pRes, bRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('builders').select('*').order('updated_at', { ascending: false }).limit(30),
    ]);
    if (Array.isArray(pRes?.data)) products = pRes.data;
    if (Array.isArray(bRes?.data)) builders = bRes.data;
  } catch (err) {
    console.warn('feed.js supabase warning:', err?.message);
  }

  const nowRfc = new Date().toUTCString();

  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>demonst — 인디 메이커 앱 테스트 &amp; 10초 런치패드</title>
    <link>${siteBaseUrl}/</link>
    <description>사이드 프로젝트와 인디 메이커를 위한 무료 앱 테스트, 베타 피드백, 10초 런치패드 실시간 피드</description>
    <language>ko-KR</language>
    <lastBuildDate>${nowRfc}</lastBuildDate>
    <atom:link href="${siteBaseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteBaseUrl}/demon-mascot.png</url>
      <title>demonst</title>
      <link>${siteBaseUrl}/</link>
    </image>
`;

  products.forEach((p) => {
    const link = `${siteBaseUrl}/?product=${encodeURIComponent(p.id)}`;
    const pubDate = p.bumped_at || p.created_at ? new Date(p.bumped_at || p.created_at).toUTCString() : nowRfc;
    const shot = normalizeImageUrl(p.screenshot) || normalizeImageUrl(p.icon) || `${siteBaseUrl}/demon-mascot.png`;
    const desc = `${p.tagline || ''} — ${(p.description || p.instructions || '').slice(0, 400)}`;

    rss += `    <item>
      <title>${escapeXml(`[신규 앱] ${p.title} — ${p.tagline || p.category || '사이드 프로젝트'}`)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(p.category || '사이드프로젝트')}</category>
      <description>${escapeXml(desc)}</description>
      <media:content url="${escapeXml(shot)}" medium="image" />
      <media:thumbnail url="${escapeXml(normalizeImageUrl(p.icon) || shot)}" />
    </item>
`;
  });

  builders.forEach((b) => {
    const link = `${siteBaseUrl}/?builder=${encodeURIComponent(b.id)}`;
    const pubDate = b.updated_at ? new Date(b.updated_at).toUTCString() : nowRfc;
    const avatar = normalizeImageUrl(b.avatar) || `${siteBaseUrl}/demon-mascot.png`;

    rss += `    <item>
      <title>${escapeXml(`[인디 메이커] ${b.name} (${b.role || '빌더'})`)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>인디메이커</category>
      <description>${escapeXml(b.bio || 'demonst에서 활동 중인 인디 메이커입니다.')}</description>
      <media:content url="${escapeXml(avatar)}" medium="image" />
    </item>
`;
  });

  rss += `  </channel>
</rss>
`;

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
  res.status(200).send(rss);
}
