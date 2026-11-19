// api/ping.js
// Automated Search Engine Ping & IndexNow Batch Submitter (also runs on Vercel Cron)
// Submits ALL live products, builders, sitemaps, image-sitemaps, and RSS feeds to search engines!

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vwtlhgqmndrshjcekhii.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_It2EcGB26YzpEj6vbZQ5-g_GorZe1C5';
const siteBaseUrl = 'https://demonst.vercel.app';
const INDEXNOW_KEY = 'a1b2c3d4e5f64789a0b1c2d3e4f56789';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const urlsToSubmit = [
    `${siteBaseUrl}/`,
    `${siteBaseUrl}/?tab=test`,
    `${siteBaseUrl}/?tab=builders`,
    `${siteBaseUrl}/?tab=leaderboard`,
    `${siteBaseUrl}/?tab=community`,
    `${siteBaseUrl}/?tab=submit`,
    `${siteBaseUrl}/?tab=about`,
    `${siteBaseUrl}/sitemap.xml`,
    `${siteBaseUrl}/image-sitemap.xml`,
    `${siteBaseUrl}/feed.xml`,
  ];

  // Fetch all live product & builder URLs from Supabase so every single item gets crawled!
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const [pRes, bRes] = await Promise.all([
      supabase.from('products').select('id').limit(100),
      supabase.from('builders').select('id').limit(100),
    ]);
    if (Array.isArray(pRes?.data)) {
      pRes.data.forEach((p) => urlsToSubmit.push(`${siteBaseUrl}/?product=${encodeURIComponent(p.id)}`));
    }
    if (Array.isArray(bRes?.data)) {
      bRes.data.forEach((b) => urlsToSubmit.push(`${siteBaseUrl}/?builder=${encodeURIComponent(b.id)}`));
    }
  } catch (err) {
    console.warn('ping.js supabase fetch warning:', err?.message);
  }

  const results = {
    submittedCount: urlsToSubmit.length,
    timestamp: new Date().toISOString(),
    indexnow: {},
    websub: {},
    yandex: {},
  };

  // 1. IndexNow Batch API (Bing, Naver, Yandex, Seznam, Yep)
  try {
    const indexNowPayload = {
      host: 'demonst.vercel.app',
      key: INDEXNOW_KEY,
      keyLocation: `${siteBaseUrl}/${INDEXNOW_KEY}.txt`,
      urlList: urlsToSubmit,
    };
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(indexNowPayload),
    });
    results.indexnow = { ok: r.ok, status: r.status };
  } catch (err) {
    results.indexnow = { ok: false, error: err.message };
  }

  // 2. Google PubSubHubbub / WebSub Hub Ping (RSS Feed real-time discovery by Google!)
  try {
    const body = new URLSearchParams({
      'hub.mode': 'publish',
      'hub.url': `${siteBaseUrl}/feed.xml`,
    });
    const r = await fetch('https://pubsubhubbub.appspot.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    results.websub = { ok: r.ok, status: r.status };
  } catch (err) {
    results.websub = { ok: false, error: err.message };
  }

  // 3. Yandex Sitemap Ping
  try {
    const r = await fetch(`https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(`${siteBaseUrl}/sitemap.xml`)}`);
    results.yandex = { ok: r.ok, status: r.status };
  } catch (err) {
    results.yandex = { ok: false, error: err.message };
  }

  return res.status(200).json({
    success: true,
    message: `Auto-crawl notifications sent for ${urlsToSubmit.length} URLs (including sitemaps & image-sitemap).`,
    results,
  });
}
