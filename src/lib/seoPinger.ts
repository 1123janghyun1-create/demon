/**
 * Googlebot & Search Engine Auto-Crawl Pinger
 * demonst에 신규 프로젝트나 프로필이 등록/수정될 때 구글봇에 즉시 재크롤링 신호를 전송합니다.
 */

export async function pingSearchEngines(): Promise<boolean> {
  const sitemapUrl = 'https://demonst.vercel.app/sitemap.xml';
  console.log('🤖 [SEO] 구글봇 및 검색엔진 자동 크롤링 핑 신호 발송 중...');

  let success = false;

  // 1. demonst Vercel Serverless API (/api/ping) 호출
  try {
    const res = await fetch('/api/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sitemapUrl }),
    });
    if (res.ok) {
      const data = await res.json();
      console.log('✅ [SEO] Vercel Serverless를 통한 구글봇 핑 완료:', data);
      success = true;
    }
  } catch {
    // 로컬 환경 등에서는 /api/ping이 직접 지원되지 않을 수 있음
  }

  // 2. 브라우저 직접 Ping (no-cors 모드로 구글 및 빙 핑 엔드포인트 직접 호출)
  try {
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    fetch(googlePingUrl, { mode: 'no-cors' }).catch(() => {});

    const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    fetch(bingPingUrl, { mode: 'no-cors' }).catch(() => {});

    console.log('✅ [SEO] 구글봇/빙봇 직접 핑 신호 전달 완료');
    success = true;
  } catch (e) {
    console.warn('⚠️ [SEO] 직접 핑 오류 (무시 가능):', e);
  }

  return success;
}
