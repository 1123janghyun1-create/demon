export interface ExtractedMetadata {
  title: string;
  tagline: string;
  logoUrl: string;
  screenshotUrl: string;
  author: string;
  category: string;
  instructions: string;
}

export async function fetchWebsiteMetadata(targetUrl: string): Promise<ExtractedMetadata> {
  let cleanUrl = targetUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  let domain = '';
  try {
    const parsed = new URL(cleanUrl);
    domain = parsed.hostname.replace(/^www\./, '');
  } catch {
    domain = cleanUrl.replace(/^https?:\/\//, '').split('/')[0];
  }

  // High-res Google Favicon & WP mShots full-page screenshot
  const highResFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const wpScreenshot = `https://s0.wp.com/mshots/v1/${encodeURIComponent(cleanUrl)}?w=1200&h=800`;

  let extractedTitle = '';
  let extractedDescription = '';
  let extractedLogo = highResFavicon;
  let extractedScreenshot = wpScreenshot;

  try {
    // Call Microlink API with 6 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=true`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const d = json.data;
        if (d.title) extractedTitle = d.title.trim();
        if (d.description) extractedDescription = d.description.trim();

        // Logo candidates
        if (d.logo && d.logo.url) {
          extractedLogo = d.logo.url;
        }

        // Screenshot or OG:Image candidates
        if (d.screenshot && d.screenshot.url) {
          extractedScreenshot = d.screenshot.url;
        } else if (d.image && d.image.url) {
          extractedScreenshot = d.image.url;
        }
      }
    }
  } catch (err) {
    console.warn('Microlink fetch error, falling back to smart CDN:', err);
  }

  // Fallbacks if Microlink missed
  if (!extractedTitle) {
    const rawName = domain.split('.')[0];
    extractedTitle = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  }

  if (!extractedDescription) {
    extractedDescription = `${domain} — 인디 메이커가 만든 최신 서비스입니다.`;
  }

  // Category inference
  let category = '생산성 / SaaS';
  const lower = (cleanUrl + ' ' + extractedTitle + ' ' + extractedDescription).toLowerCase();
  if (lower.includes('ai') || lower.includes('gpt') || lower.includes('bot') || lower.includes('llm')) {
    category = 'AI / 머신러닝';
  } else if (lower.includes('game') || lower.includes('play')) {
    category = '게임 / 엔터';
  } else if (lower.includes('health') || lower.includes('fit') || lower.includes('diet') || lower.includes('habit')) {
    category = '라이프스타일 / 건강';
  } else if (lower.includes('dev') || lower.includes('code') || lower.includes('github') || lower.includes('tool')) {
    category = '개발자 도구';
  } else if (lower.includes('community') || lower.includes('social') || lower.includes('chat')) {
    category = '커뮤니티 / 소셜';
  }

  const instructions = `1. ${extractedTitle} (${cleanUrl}) 에 접속합니다.
2. 첫 화면(랜딩 페이지)에서 서비스의 핵심 가치가 5초 안에 이해되는지 확인해주세요.
3. 주요 기능(회원가입, 핵심 도구 사용)을 직접 체험해보세요.
4. PC 및 모바일 브라우저 환경에서 레이아웃 깨짐이나 버그가 없는지 체크해주세요.
5. 유료 결제 의향 또는 다른 사용자에게 추천하고 싶은지 솔직한 의견을 남겨주세요.`;

  return {
    title: extractedTitle,
    tagline: extractedDescription,
    logoUrl: extractedLogo,
    screenshotUrl: extractedScreenshot,
    author: domain.split('.')[0] || '인디메이커',
    category,
    instructions,
  };
}
