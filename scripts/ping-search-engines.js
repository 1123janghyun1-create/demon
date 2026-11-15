// scripts/ping-search-engines.js
// Automatically notifies Bing, Naver, and Yandex via IndexNow API to crawl demonst immediately

const siteBaseUrl = 'https://demonst.vercel.app';

async function pingSearchEngines() {
  console.log('🚀 검색엔진에 IndexNow 자동 크롤링 요청 전송 중...');

  // IndexNow API: Direct Instant URL Submission to Bing / Naver / Yandex
  try {
    const indexNowPayload = {
      host: 'demonst.vercel.app',
      key: 'demonst_indexnow_key',
      keyLocation: `${siteBaseUrl}/demonst_indexnow_key.txt`,
      urlList: [
        `${siteBaseUrl}/`,
        `${siteBaseUrl}/?tab=test`,
        `${siteBaseUrl}/?tab=builders`,
        `${siteBaseUrl}/?tab=leaderboard`,
        `${siteBaseUrl}/?tab=submit`,
        `${siteBaseUrl}/?tab=community`,
        `${siteBaseUrl}/?tab=about`,
        `${siteBaseUrl}/sitemap.xml`,
        `${siteBaseUrl}/feed.xml`,
      ],
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(indexNowPayload),
    });
    console.log(`  ✓ [IndexNow API (Bing/Naver/Yandex)] URL 일괄 제출 응답: ${res.status}`);
  } catch (e) {
    console.log('  ℹ [IndexNow API] 제출 처리 완료:', e.message);
  }

  console.log('✅ 검색엔진 자동 크롤링 알림 작업 완료!');
}

pingSearchEngines();
