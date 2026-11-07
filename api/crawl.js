// Vercel Serverless Function: Web Content & Media Crawler
// Scrapes metadata, media, social links, and store links without CORS restrictions.
// RULE: If any field is not found or unknown, leave it empty ("" or []).

function resolveUrl(relativeOrAbsolute, baseUrl) {
  if (!relativeOrAbsolute) return '';
  try {
    return new URL(relativeOrAbsolute, baseUrl).href;
  } catch {
    return relativeOrAbsolute;
  }
}

function cleanTitle(rawTitle, domain) {
  if (!rawTitle) return '';
  let title = rawTitle.trim();
  title = title.replace(/\s*[-–—|:]\s*(Home|Main|Welcome|Base44|Vercel|공식\s*웹사이트|홈페이지|메인).*$/i, '');
  return title.trim();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = (req.method === 'POST' ? req.body?.url : req.query?.url) || '';
  if (!targetUrl) {
    return res.status(400).json({ error: 'url parameter required' });
  }

  let cleanUrl = targetUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  let domain = '';
  try {
    domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
  } catch {
    domain = cleanUrl.replace(/^https?:\/\//, '').split('/')[0];
  }

  const result = {
    title: '',
    tagline: '',
    description: '',
    logoUrl: '',
    screenshotUrl: '',
    gallery: [],
    demoVideo: '',
    socialLinks: {
      twitter: '',
      github: '',
      linkedin: '',
      instagram: '',
      threads: '',
      youtube: '',
    },
    additionalLinks: [],
    category: '',
    tags: [],
    instructions: '',
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const html = await response.text();

      // 1. Title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
      const rawTitle = ogTitleMatch ? ogTitleMatch[1] : (titleMatch ? titleMatch[1] : '');
      if (rawTitle) {
        result.title = cleanTitle(rawTitle, domain);
      }

      // 2. Description & Tagline
      const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
      const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
      const rawDesc = ogDescMatch ? ogDescMatch[1] : (metaDescMatch ? metaDescMatch[1] : '');
      if (rawDesc) {
        const cleanDesc = rawDesc.trim();
        result.description = cleanDesc.slice(0, 500);
        result.tagline = cleanDesc.slice(0, 60);
      }

      // 3. Logo / Favicon
      const appleTouchIcon = html.match(/<link[^>]+rel=["'](?:apple-touch-icon|icon)["'][^>]+href=["']([^"']+)["']/i);
      if (appleTouchIcon && appleTouchIcon[1]) {
        result.logoUrl = resolveUrl(appleTouchIcon[1], cleanUrl);
      } else {
        // Fallback to Google 256px favicon
        result.logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
      }

      // 4. Main Screenshot / OpenGraph Image
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
      if (ogImageMatch && ogImageMatch[1]) {
        result.screenshotUrl = resolveUrl(ogImageMatch[1], cleanUrl);
      } else if (twitterImageMatch && twitterImageMatch[1]) {
        result.screenshotUrl = resolveUrl(twitterImageMatch[1], cleanUrl);
      } else {
        // High quality full-page screenshot
        result.screenshotUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(cleanUrl)}?w=1280&h=800`;
      }

      // 5. Gallery Images (Extract og:image, twitter:image, and high-res images)
      const gallerySet = new Set();
      if (result.screenshotUrl) gallerySet.add(result.screenshotUrl);

      const allOgImages = [...html.matchAll(/<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/gi)];
      for (const m of allOgImages) {
        if (m[1]) gallerySet.add(resolveUrl(m[1], cleanUrl));
      }

      // Also look for large promotional/feature images in body
      const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+\.(?:png|jpg|jpeg|webp))["']/gi)];
      for (const m of imgMatches) {
        const src = m[1];
        if (!src.includes('avatar') && !src.includes('icon') && !src.includes('badge') && !src.includes('logo')) {
          gallerySet.add(resolveUrl(src, cleanUrl));
          if (gallerySet.size >= 6) break;
        }
      }
      result.gallery = Array.from(gallerySet).filter(Boolean);

      // 6. Social Links Extraction from <a> tags
      const linkMatches = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)];
      for (const m of linkMatches) {
        const href = m[1].trim();

        // X / Twitter
        if (!result.socialLinks.twitter && (href.includes('twitter.com/') || href.includes('x.com/'))) {
          if (!href.includes('/intent/') && !href.includes('/share')) {
            result.socialLinks.twitter = href;
          }
        }
        // GitHub
        if (!result.socialLinks.github && href.includes('github.com/')) {
          result.socialLinks.github = href;
        }
        // LinkedIn
        if (!result.socialLinks.linkedin && href.includes('linkedin.com/')) {
          result.socialLinks.linkedin = href;
        }
        // Instagram
        if (!result.socialLinks.instagram && href.includes('instagram.com/')) {
          result.socialLinks.instagram = href;
        }
        // Threads
        if (!result.socialLinks.threads && href.includes('threads.net/')) {
          result.socialLinks.threads = href;
        }
        // YouTube
        if (!result.socialLinks.youtube && (href.includes('youtube.com/') || href.includes('youtu.be/'))) {
          // If it's a channel or profile link
          if (href.includes('/@') || href.includes('/channel/') || href.includes('/c/')) {
            result.socialLinks.youtube = href;
          } else if (!result.demoVideo) {
            // Otherwise can be a demo video!
            result.demoVideo = href;
          }
        }

        // Additional Store Links
        if (href.includes('apps.apple.com') && !result.additionalLinks.some(l => l.url === href)) {
          result.additionalLinks.push({ id: 'appstore-' + Date.now(), label: 'App Store', url: href });
        }
        if (href.includes('play.google.com/store') && !result.additionalLinks.some(l => l.url === href)) {
          result.additionalLinks.push({ id: 'playstore-' + Date.now(), label: 'Google Play', url: href });
        }
        if (href.includes('store.steampowered.com') && !result.additionalLinks.some(l => l.url === href)) {
          result.additionalLinks.push({ id: 'steam-' + Date.now(), label: 'Steam', url: href });
        }
      }

      // 7. Demo Video (YouTube, Vimeo, Loom in iframes or video tags)
      if (!result.demoVideo) {
        const videoIframeMatch = html.match(/<iframe[^>]+src=["']([^"']*(?:youtube\.com|youtu\.be|vimeo\.com|loom\.com)[^"']*)["']/i);
        if (videoIframeMatch && videoIframeMatch[1]) {
          result.demoVideo = videoIframeMatch[1];
        }
      }

      // 8. Tags / Keywords
      const keywordsMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i);
      if (keywordsMatch && keywordsMatch[1]) {
        result.tags = keywordsMatch[1]
          .split(/[,;]/)
          .map(t => t.trim())
          .filter(t => t.length > 0 && t.length <= 20)
          .slice(0, 8);
      }

      // 9. Category Inference (ONLY if strong match, otherwise leave empty "")
      const fullText = `${cleanUrl} ${result.title} ${result.description} ${result.tags.join(' ')}`.toLowerCase();
      if (/학교|학생|급식|시간표|공부|수능|학습|school|student|class|learn|study|edu/.test(fullText)) {
        result.category = '교육 / 학습';
      } else if (/\bai\b|gpt|llm|prompt|챗봇|인공지능|머신러닝|생성형/.test(fullText)) {
        result.category = 'AI';
      } else if (/dev|code|github|api|sdk|코딩|개발자|terminal|database|sql/.test(fullText)) {
        result.category = '개발자 도구';
      } else if (/saas|생산성|업무|협업|프로젝트|notion|slack|crm|task|productivity/.test(fullText)) {
        result.category = '생산성';
      } else if (/pay|crypto|stock|coin|money|주식|코인|가계부|금융|투자|결제/.test(fullText)) {
        result.category = '금융 / 핀테크';
      } else if (/game|play|게임|퀴즈|엔터|music|음악|웹툰/.test(fullText)) {
        result.category = '게임 / 엔터';
      } else if (/community|social|chat|커뮤니티|소통|친구|모임|feed/.test(fullText)) {
        result.category = '커뮤니티 / 소셜';
      } else if (/health|fit|diet|건강|운동|식단|습관|루틴|lifestyle/.test(fullText)) {
        result.category = '라이프스타일 / 건강';
      } else if (/tool|utility|계산기|변환|확장|converter/.test(fullText)) {
        result.category = '유틸리티 / 도구';
      } else {
        result.category = ''; // 모르면 빈칸!
      }
    }
  } catch (err) {
    console.warn('Scraper error (handled gracefully):', err.message);
  }

  return res.status(200).json(result);
}
