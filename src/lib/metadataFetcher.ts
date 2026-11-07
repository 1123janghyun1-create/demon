export interface ExtractedMetadata {
  title: string;
  tagline: string;
  description: string;
  logoUrl: string;
  screenshotUrl: string;
  gallery: string[];
  demoVideo: string;
  socialLinks: {
    twitter: string;
    github: string;
    linkedin: string;
    instagram: string;
    threads: string;
    youtube: string;
  };
  additionalLinks: Array<{ id: string; label: string; url: string }>;
  category: string;
  tags: string[];
  instructions: string;
}

function cleanTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  let title = rawTitle.trim();
  title = title.replace(/\s*[-–—|:]\s*(Home|Main|Welcome|Base44|Vercel|공식\s*웹사이트|홈페이지|메인).*$/i, '');
  return title.trim();
}

function resolveUrl(relativeOrAbsolute: string | undefined, baseUrl: string): string {
  if (!relativeOrAbsolute) return '';
  try {
    return new URL(relativeOrAbsolute, baseUrl).href;
  } catch {
    return relativeOrAbsolute;
  }
}

function inferCategoryStrict(text: string): string {
  const t = text.toLowerCase();
  if (/학교|학생|급식|시간표|공부|수능|학습|school|student|class|learn|study|edu/.test(t)) {
    return '교육 / 학습';
  }
  if (/\bai\b|gpt|llm|prompt|챗봇|인공지능|머신러닝|생성형/.test(t)) {
    return 'AI';
  }
  if (/dev|code|github|api|sdk|코딩|개발자|terminal|database|sql/.test(t)) {
    return '개발자 도구';
  }
  if (/saas|생산성|업무|협업|프로젝트|notion|slack|crm|task|productivity/.test(t)) {
    return '생산성';
  }
  if (/pay|crypto|stock|coin|money|주식|코인|가계부|금융|투자|결제/.test(t)) {
    return '금융 / 핀테크';
  }
  if (/game|play|게임|퀴즈|엔터|music|음악|웹툰/.test(t)) {
    return '게임 / 엔터';
  }
  if (/community|social|chat|커뮤니티|소통|친구|모임|feed/.test(t)) {
    return '커뮤니티 / 소셜';
  }
  if (/health|fit|diet|건강|운동|식단|습관|루틴|lifestyle/.test(t)) {
    return '라이프스타일 / 건강';
  }
  if (/tool|utility|계산기|변환|확장|converter/.test(t)) {
    return '유틸리티 / 도구';
  }
  return ''; // 모르면 빈칸!
}

export async function fetchWebsiteMetadata(targetUrl: string): Promise<ExtractedMetadata> {
  let cleanUrl = targetUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  // 1. First attempt: call our own /api/crawl serverless scraper (full DOM scraping without CORS)
  try {
    const res = await fetch(`/api/crawl?url=${encodeURIComponent(cleanUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.title || data.description || data.logoUrl || data.screenshotUrl)) {
        return {
          title: data.title || '',
          tagline: data.tagline || (data.description ? data.description.slice(0, 60) : ''),
          description: data.description || '',
          logoUrl: data.logoUrl || '',
          screenshotUrl: data.screenshotUrl || '',
          gallery: Array.isArray(data.gallery) ? data.gallery : [],
          demoVideo: data.demoVideo || '',
          socialLinks: {
            twitter: data.socialLinks?.twitter || '',
            github: data.socialLinks?.github || '',
            linkedin: data.socialLinks?.linkedin || '',
            instagram: data.socialLinks?.instagram || '',
            threads: data.socialLinks?.threads || '',
            youtube: data.socialLinks?.youtube || '',
          },
          additionalLinks: Array.isArray(data.additionalLinks) ? data.additionalLinks : [],
          category: data.category || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          instructions: data.instructions || '',
        };
      }
    }
  } catch {
    // Fall back to client-side Microlink resolver
  }

  // 2. Client-side fallback via Microlink API
  let domain = '';
  try {
    domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
  } catch {
    domain = cleanUrl.replace(/^https?:\/\//, '').split('/')[0];
  }

  const result: ExtractedMetadata = {
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
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=true`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const d = json.data;

        // Title
        if (d.title) {
          result.title = cleanTitle(d.title);
        }

        // Description / Tagline
        if (d.description) {
          result.description = d.description.trim().slice(0, 500);
          result.tagline = d.description.trim().slice(0, 60);
        }

        // Logo
        if (d.logo && d.logo.url) {
          result.logoUrl = resolveUrl(d.logo.url, cleanUrl);
        } else if (d.icon && d.icon.url) {
          result.logoUrl = resolveUrl(d.icon.url, cleanUrl);
        } else if (domain) {
          result.logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
        }

        // Screenshot
        if (d.image && d.image.url) {
          result.screenshotUrl = resolveUrl(d.image.url, cleanUrl);
        } else if (d.screenshot && d.screenshot.url) {
          result.screenshotUrl = d.screenshot.url;
        }

        if (result.screenshotUrl) {
          result.gallery.push(result.screenshotUrl);
        }

        // Video
        if (d.video && d.video.url) {
          result.demoVideo = d.video.url;
        }

        // Category inference
        const categoryMatch = inferCategoryStrict(`${cleanUrl} ${result.title} ${result.description}`);
        result.category = categoryMatch;
      }
    }
  } catch (err) {
    console.warn('Microlink fetch error:', err);
  }

  // Final check: AI strictly leaves unknown fields empty!
  return result;
}
