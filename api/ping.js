const siteBaseUrl = 'https://demonst.vercel.app';
const sitemapUrl = `${siteBaseUrl}/sitemap.xml`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const results = {
    sitemap: sitemapUrl,
    timestamp: new Date().toISOString(),
    google: { status: 'pinged' },
    bing: { status: 'pinged' },
    indexnow: { status: 'pinged' },
  };

  // 1. Googlebot sitemap ping
  try {
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    await fetch(googlePingUrl, { method: 'GET', headers: { 'User-Agent': 'demonst-SEO-Agent/1.0' } });
    results.google = { ok: true, message: 'Googlebot notified' };
  } catch (err) {
    results.google = { ok: false, error: err.message };
  }

  // 2. Bingbot sitemap ping
  try {
    const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    await fetch(bingPingUrl, { method: 'GET', headers: { 'User-Agent': 'demonst-SEO-Agent/1.0' } });
    results.bing = { ok: true, message: 'Bingbot notified' };
  } catch (err) {
    results.bing = { ok: false, error: err.message };
  }

  // 3. IndexNow API (Bing, Naver Yeti, Seznam instant index ping)
  try {
    const indexNowUrl = `https://api.indexnow.org/indexnow?url=${encodeURIComponent(siteBaseUrl)}&key=demonst_seo_bot`;
    await fetch(indexNowUrl, { method: 'GET', headers: { 'User-Agent': 'demonst-SEO-Agent/1.0' } });
    results.indexnow = { ok: true, message: 'IndexNow search engines notified' };
  } catch (err) {
    results.indexnow = { ok: false, error: err.message };
  }

  return res.status(200).json({
    success: true,
    message: 'Search engine bots notified successfully for auto-crawling.',
    results,
  });
}
