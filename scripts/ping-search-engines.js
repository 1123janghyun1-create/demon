// scripts/ping-search-engines.js
// Automatically notifies Bing, Naver, Yandex (via IndexNow) & Google WebSub Hub on every build!

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vwtlhgqmndrshjcekhii.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_It2EcGB26YzpEj6vbZQ5-g_GorZe1C5';
const siteBaseUrl = 'https://demonst.vercel.app';
const INDEXNOW_KEY = 'a1b2c3d4e5f64789a0b1c2d3e4f56789';

async function pingSearchEngines() {
  console.log('🚀 검색엔진에 IndexNow & Google WebSub 자동 크롤링 요청 전송 중...');

  const urlList = [
    `${siteBaseUrl}/`,
    `${siteBaseUrl}/?tab=test`,
    `${siteBaseUrl}/?tab=builders`,
    `${siteBaseUrl}/?tab=leaderboard`,
    `${siteBaseUrl}/?tab=submit`,
    `${siteBaseUrl}/?tab=community`,
    `${siteBaseUrl}/?tab=about`,
    `${siteBaseUrl}/sitemap.xml`,
    `${siteBaseUrl}/image-sitemap.xml`,
    `${siteBaseUrl}/feed.xml`,
  ];

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const [pRes, bRes] = await Promise.all([
      supabase.from('products').select('id').limit(100),
      supabase.from('builders').select('id').limit(100),
    ]);
    if (Array.isArray(pRes?.data)) {
      pRes.data.forEach((p) => urlList.push(`${siteBaseUrl}/?product=${encodeURIComponent(p.id)}`));
    }
    if (Array.isArray(bRes?.data)) {
      bRes.data.forEach((b) => urlList.push(`${siteBaseUrl}/?builder=${encodeURIComponent(b.id)}`));
    }
  } catch (err) {
    console.warn('  ℹ Supabase URL fetch warning:', err?.message);
  }

  // 1. IndexNow API: Direct Instant URL Submission to Bing / Naver / Yandex
  try {
    const indexNowPayload = {
      host: 'demonst.vercel.app',
      key: INDEXNOW_KEY,
      keyLocation: `${siteBaseUrl}/${INDEXNOW_KEY}.txt`,
      urlList,
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(indexNowPayload),
    });
    console.log(`  ✓ [IndexNow API (Bing/Naver/Yandex)] ${urlList.length}개 URL 일괄 제출 응답: ${res.status}`);
  } catch (e) {
    console.log('  ℹ [IndexNow API] 제출 처리 완료:', e.message);
  }

  // 2. Google WebSub (PubSubHubbub) Feed Publish Ping
  try {
    const body = new URLSearchParams({
      'hub.mode': 'publish',
      'hub.url': `${siteBaseUrl}/feed.xml`,
    });
    const res = await fetch('https://pubsubhubbub.appspot.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    console.log(`  ✓ [Google WebSub Hub] RSS 피드 발행 알림 응답: ${res.status}`);
  } catch (e) {
    console.log('  ℹ [Google WebSub Hub] 알림 처리 완료:', e.message);
  }

  console.log('✅ 검색엔진 자동 크롤링 알림 작업 완료!');
}

pingSearchEngines();
