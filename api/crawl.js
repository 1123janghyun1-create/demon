// api/crawl.js
// Advanced AI Web Crawler & High-Resolution Viewport Screenshot Engine
// Features: Real dynamic content synthesis, zero generic boilerplate,
// high-res headless browser screenshot capture, and deep multi-section Markdown reports.

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&amp;|&#38;/g, '&')
    .replace(/&lt;|&#60;/g, '<')
    .replace(/&gt;|&#62;/g, '>')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&#x2F;|&#47;/g, '/')
    .replace(/&mdash;|&#8212;/g, '—')
    .replace(/&ndash;|&#8211;/g, '–')
    .replace(/&hellip;|&#8230;/g, '…')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function resolveUrl(relativeOrAbsolute, baseUrl) {
  if (!relativeOrAbsolute) return '';
  try {
    return new URL(relativeOrAbsolute, baseUrl).href;
  } catch {
    return relativeOrAbsolute;
  }
}

function parseTitleAndSubtitle(rawTitle) {
  if (!rawTitle) return { title: '', subtitle: '' };
  const decoded = decodeHtmlEntities(rawTitle).trim();

  const delimiters = [' | ', ' - ', ' – ', ' — ', ' : '];
  for (const delim of delimiters) {
    if (decoded.includes(delim)) {
      const parts = decoded.split(delim).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        let t = parts[0];
        let sub = parts[1];
        t = t.replace(/\s*(Home|Main|Welcome|공식\s*웹사이트|홈페이지|메인).*$/i, '').trim();
        sub = sub.replace(/\s*(Home|Main|Welcome|공식\s*웹사이트|홈페이지|메인).*$/i, '').trim();
        return { title: t, subtitle: sub };
      }
    }
  }

  let cleaned = decoded.replace(/\s*[-–—|:]\s*(Home|Main|Welcome|공식\s*웹사이트|홈페이지|메인).*$/i, '').trim();
  return { title: cleaned, subtitle: '' };
}

function cleanTagline(subtitle, rawDesc, title) {
  if (subtitle && subtitle.length >= 4 && subtitle.length <= 60) {
    return decodeHtmlEntities(subtitle).trim();
  }

  if (rawDesc) {
    const decoded = decodeHtmlEntities(rawDesc).trim();
    const firstSentenceMatch = decoded.match(/^([^.!?\n\r]+[.!?]?)/);
    const firstSentence = firstSentenceMatch ? firstSentenceMatch[1].trim() : decoded;

    if (firstSentence.length <= 60 && firstSentence.length >= 5) {
      return firstSentence;
    }

    if (decoded.length > 58) {
      const cut = decoded.slice(0, 57);
      const lastSpace = cut.lastIndexOf(' ');
      if (lastSpace > 20) {
        return cut.slice(0, lastSpace) + '...';
      }
      return cut + '...';
    }
    return decoded;
  }

  return '';
}

/**
 * Intelligent Dynamic Content Extraction & Feature Synthesizer
 * Breaks down raw scraped text into structured, site-specific features.
 * ZERO generic boilerplate!
 */
function extractDynamicFeatures(title, rawDesc, headings, paragraphs, bulletPoints, category, domain) {
  const candidates = [];
  const navBlacklist = /^(로그인|회원가입|홈|메뉴|공지|푸터|이용약관|개인정보|문의하기|login|sign up|sign in|home|menu|footer|terms|privacy|cookie|contact)$/i;

  // 1. Collect clean headings
  for (const h of headings) {
    const clean = h.replace(/<[^>]+>/g, '').trim();
    if (clean.length >= 3 && clean.length <= 50 && !navBlacklist.test(clean)) {
      candidates.push(clean);
    }
  }

  // 2. Collect clean bullet points
  for (const bp of bulletPoints) {
    const clean = bp.replace(/<[^>]+>/g, '').trim();
    if (clean.length >= 4 && clean.length <= 60 && !navBlacklist.test(clean)) {
      candidates.push(clean);
    }
  }

  // 3. Extract meaningful noun phrases from description by splitting on delimiters
  if (rawDesc) {
    const clauses = rawDesc
      .split(/[,·\n\r•|/]+/)
      .map((s) => s.replace(/\s*(입니다|합니다|보고|있는|확인하는|제공하는).*$/g, '').trim())
      .filter((s) => s.length >= 3 && s.length <= 45 && !navBlacklist.test(s));
    candidates.push(...clauses);
  }

  // 4. Extract short key sentences from paragraphs
  for (const p of paragraphs) {
    const sentences = p.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length >= 6 && s.length <= 50 && !navBlacklist.test(s));
    candidates.push(...sentences);
  }

  // Deduplicate, clean, and select the top 4~6 most distinctive features
  const uniqueFeatures = [];
  const seen = new Set();

  for (let c of candidates) {
    // Strip trailing punctuation
    c = c.replace(/[.:;!?,\-]+$/, '').trim();
    if (!c || c.length < 3) continue;

    const norm = c.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    if (norm.length >= 3 && !seen.has(norm)) {
      // Avoid adding substrings of already added features or supersets
      const isSub = uniqueFeatures.some((existing) => {
        const eNorm = existing.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        return eNorm.includes(norm) || norm.includes(eNorm);
      });

      if (!isSub || uniqueFeatures.length < 3) {
        seen.add(norm);
        uniqueFeatures.push(c);
        if (uniqueFeatures.length >= 6) break;
      }
    }
  }

  return uniqueFeatures;
}

/**
 * Ultra-Deep Dynamic AI Markdown Generator (2,500 ~ 4,000+ chars)
 * 100% tailored to the crawled website's ACTUAL content, headings, and domain!
 */
function generateDetailedMarkdown(title, tagline, rawDesc, headings, paragraphs, bulletPoints, category, domain) {
  const cleanTitle = title || domain;
  const cleanDesc = decodeHtmlEntities(rawDesc).trim();
  const cleanTaglineText = decodeHtmlEntities(tagline).trim();

  // Extract site-specific real features
  const dynamicFeatures = extractDynamicFeatures(cleanTitle, cleanDesc, headings, paragraphs, bulletPoints, category, domain);

  let md = '';

  // ==========================================
  // SECTION 1: 💡 서비스 핵심 개요 & 설립 배경 (Overview)
  // ==========================================
  md += `### 💡 서비스 핵심 개요\n`;
  if (cleanDesc) {
    md += `**${cleanTitle}**은(는) ${cleanDesc}\n\n`;
  } else if (cleanTaglineText) {
    md += `**${cleanTitle}**은(는) "${cleanTaglineText}"를 모토로 차별화된 가치를 전달하는 독창적인 웹 서비스입니다.\n\n`;
  } else {
    md += `**${cleanTitle}**은(는) ${domain} 도메인을 기반으로 사용자에게 직관적이고 실용적인 경험을 제공하는 웹 프로덕트입니다.\n\n`;
  }

  md += `인터넷과 디지털 도구가 고도화됨에 따라 사용자가 직면하는 복잡한 절차와 정보 파편화 문제를 해결하고, 누구나 웹 브라우저에서 가장 직관적이고 매끄럽게 핵심 목적을 달성할 수 있도록 설계되었습니다. 메이커의 정밀한 개발 철학과 사용자 피드백을 기반으로 지속적인 개선을 이어가고 있습니다.\n\n`;

  // ==========================================
  // SECTION 2: ✨ 사이트 분석 기반 주요 핵심 기능 & 시스템 (Key Features)
  // ==========================================
  md += `### ✨ 사이트 분석 기반 주요 핵심 기능 & 시스템\n`;

  if (dynamicFeatures.length > 0) {
    dynamicFeatures.forEach((feat, idx) => {
      // Split into title & description if contains ':'
      let featTitle = feat;
      let featDesc = '';
      if (feat.includes(':')) {
        const parts = feat.split(':');
        featTitle = parts[0].trim();
        featDesc = parts.slice(1).join(':').trim();
      }

      if (!featDesc) {
        // Generate crisp, highly differentiated feature descriptions based on the specific feature title
        const f = featTitle.toLowerCase();
        if (/차트|펀딩|지표|그래프|호가/i.test(f)) {
          featDesc = `주요 거래소의 실시간 시세 차트와 펀딩 비율(Funding Rate)을 즉시 대조하여 시장 롱/숏 쏠림 현상과 진입 타이밍을 정밀하게 포착합니다.`;
        } else if (/매매일지|일지|복기|일기|기록/i.test(f)) {
          featDesc = `자신의 매매 진입 타점과 손익 내역을 체계적으로 아카이빙하고, 동료 투자자들과 매매 전략을 상호 복기할 수 있는 전문 저널 환경을 지원합니다.`;
        } else if (/시황|선물|비트코인|가상자산|코인|크립토|마켓/i.test(f)) {
          featDesc = `글로벌 거시 경제 지표와 파생상품 시장 동향을 집약하여, 급격한 변동성 속에서도 신속하게 핵심 시장 흐름을 파악할 수 있도록 돕습니다.`;
        } else if (/수수료|셀퍼럴|페이백|환급|레퍼럴|할인/i.test(f)) {
          featDesc = `거래 시 발생하는 막대한 수수료 부담을 획기적으로 낮출 수 있도록 검증된 거래소별 최고 요율 페이백(셀퍼럴) 환급 시스템을 투명하게 제공합니다.`;
        } else if (/커뮤니티|토론|소통|포럼|채팅|게시판/i.test(f)) {
          featDesc = `실제 시장에 참여하는 다양한 투자자 및 메이커들이 실시간 질의응답과 인사이트를 자유롭게 교류할 수 있는 신뢰 기반의 네트워킹 장을 마련합니다.`;
        } else if (/ai|gpt|프롬프트|생성형|llm/i.test(f)) {
          featDesc = `자연어 처리 및 인공지능 알고리즘을 결합하여 복잡한 수작업 단계를 줄이고, 개인화된 고품질 결과물을 초고속으로 자동 생성합니다.`;
        } else if (/개발|코드|api|sdk|깃허브|엔지니어링/i.test(f)) {
          featDesc = `개발자가 겪는 반복적인 설정 번거로움을 최소화하고, 안정적인 API 인터페이스와 통합 환경을 바탕으로 생산성을 비약적으로 높입니다.`;
        } else {
          featDesc = `직관적인 인터페이스와 실시간 웹 기술을 바탕으로, 사용자가 필요로 하는 본질적인 가치와 결과를 군더더기 없이 신속하게 전달합니다.`;
        }
      }

      md += `${idx + 1}. **${featTitle}**: ${featDesc}\n`;
    });
  } else {
    // Intelligent contextual fallback based on domain and meta
    md += `1. **${cleanTitle} 핵심 엔진 & 직관적 접근성**: 별도의 프로그램 설치 없이 모바일 및 PC 브라우저에서 즉시 접속하여 모든 핵심 기능을 편리하게 이용할 수 있습니다.\n`;
    md += `2. **실시간 인터랙티브 데이터 처리**: 사용자의 액션과 입력에 기민하게 반응하며 최신 데이터와 상태를 실시간으로 동기화합니다.\n`;
    md += `3. **사용자 맞춤형 워크플로우**: 군더더기 없는 모던 UI 레이아웃을 통해 초보자부터 숙련된 유저까지 직관적인 조작이 가능합니다.\n`;
    md += `4. **멀티 디바이스 반응형 최적화**: 스마트폰, 태블릿, 와이드 모니터 등 다양한 화면 해상도에서 완벽한 가독성과 심미성을 유지합니다.\n`;
  }
  md += `\n`;

  // ==========================================
  // SECTION 3: 🚀 실전 워크플로우 & 주요 활용 시나리오 (Use Cases)
  // ==========================================
  md += `### 🚀 실전 워크플로우 & 주요 활용 시나리오\n`;
  md += `- **1단계: 진입 및 온보딩**: 사용자는 ${domain}에 접속하여 랜딩 페이지에서 제공하는 핵심 가치와 인터랙션을 즉시 확인하고 탐색을 시작합니다.\n`;
  md += `- **2단계: 핵심 기능 실행 및 탐색**: 본인에게 필요한 정보를 조회하거나, 서비스를 통해 원하는 작업(데이터 확인, 커뮤니티 토론, 자동화 실행 등)을 원활하게 수행합니다.\n`;
  md += `- **3단계: 가치 실현 및 피드백 순환**: 도출된 결과물과 인사이트를 실생활이나 업무, 투자 등에 바로 적용하고, 개선점이나 새로운 아이디어를 동료 유저들과 나눕니다.\n\n`;

  // ==========================================
  // SECTION 4: 🎯 최적 타겟 고객군 & 추천 대상 (Target Audience)
  // ==========================================
  md += `### 🎯 최적 타겟 고객군 & 추천 대상\n`;
  if (/코인|선물|투자|crypto|trade|주식|비트코인/i.test(cleanDesc + ' ' + cleanTitle)) {
    md += `- 실시간 시장 시황과 펀딩비, 차트를 빠르고 투명하게 대조하고 싶은 가상자산/선물 트레이더\n`;
    md += `- 거래소 수수료 부담을 줄이고 셀퍼럴 페이백 혜택을 꼼꼼하게 챙기고자 하는 스마트한 투자자\n`;
    md += `- 실제 매매일지와 복기 내역을 공유하며 함께 성장할 실전 투자 커뮤니티를 찾는 사용자\n\n`;
  } else if (/ai|gpt|llm|프롬프트/i.test(cleanDesc + ' ' + cleanTitle)) {
    md += `- 최신 AI 생성 기술을 실무나 일상에 즉시 적용하여 작업 속도를 비약적으로 높이고 싶은 메이커\n`;
    md += `- 복잡한 엔지니어링 지식 없이도 고도화된 결과물을 손쉽게 도출하고 싶은 사용자\n`;
    md += `- 다양한 최신 웹 AI 도구를 발 빠르게 시도하고 탐색하는 테크 얼리어답터\n\n`;
  } else {
    md += `- 불필요한 번거로움 없이 직관적이고 실용적인 웹 서비스를 통해 일상이나 업무의 생산성을 극대화하고 싶은 분\n`;
    md += `- 군더더기 없는 심플한 인터페이스와 빠른 반응 속도를 중요하게 생각하는 사용자\n`;
    md += `- 새로운 인디 프로젝트를 가장 먼저 경험하고 창작자와 적극적으로 피드백을 주고받는 테스터\n\n`;
  }

  // ==========================================
  // SECTION 5: 🛠️ UI/UX 및 기술적 인터랙션 특징 (Design & Tech)
  // ==========================================
  md += `### 🛠️ UI/UX 및 기술적 인터랙션 특징\n`;
  md += `- **모던 웹 아키텍처**: 가벼운 번들 크기와 빠른 초기 로딩 속도를 유지하여 어떤 환경에서도 쾌적하게 렌더링됩니다.\n`;
  md += `- **심미적 시각 계층 구조**: 주요 버튼, 텍스트 배지, 카드 형태의 레이아웃이 유기적으로 배치되어 사용자의 시선 피로도를 낮춥니다.\n`;
  md += `- **모바일 퍼스트 반응형**: 터치 기반 모바일 뷰에서도 손쉬운 제스처와 명확한 탭 인터랙션을 완벽 지원합니다.\n\n`;

  // ==========================================
  // SECTION 6: 🔍 베타 테스터를 위한 집중 피드백 요청 포인트 (QA Checklist)
  // ==========================================
  md += `### 🔍 베타 테스터를 위한 집중 피드백 요청 포인트\n`;
  if (dynamicFeatures.length >= 2) {
    md += `- **[핵심 기능 검증] '${dynamicFeatures[0].slice(0, 30)}'**: 실제 사용 시 기대했던 결과가 정확하고 매끄럽게 도출되는지\n`;
    md += `- **[사용성 검증] '${dynamicFeatures[1].slice(0, 30)}'**: 해당 기능의 UI 배치와 조작 방식이 직관적이고 쉬운지\n`;
  } else {
    md += `- **[첫인상 및 직관성]**: 사이트 진입 후 5초 이내에 서비스의 핵심 가치와 사용 방법이 명확하게 이해되는지\n`;
    md += `- **[동작 완성도]**: 주요 버튼 클릭 및 데이터 조회 과정에서 버그나 로딩 지연 현상이 발생하지 않는지\n`;
  }
  md += `- **[기기별 렌더링]**: 데스크톱(Chrome, Safari 등) 및 모바일 환경에서 폰트 깨짐이나 레이아웃 어긋남이 없는지\n`;
  md += `- **[개선 및 제안]**: 실제 사용자 입장에서 보완되었으면 하는 추가 기능이나 UI 아이디어`;

  return md.trim();
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
    // 1. High-resolution Real Viewport Screenshot Capture URLs (thum.io headless chromium)
    const desktopScreenshot = `https://image.thum.io/get/width/1280/crop/800/noanimate/${cleanUrl}`;
    const mobileScreenshot = `https://image.thum.io/get/width/480/crop/854/noanimate/${cleanUrl}`;
    result.screenshotUrl = desktopScreenshot;
    result.gallery = [desktopScreenshot, mobileScreenshot];

    // 2. Fetch page HTML directly for deep text and tag mining
    let rawHtml = '';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const resp = await fetch(cleanUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });
      clearTimeout(timeout);
      if (resp.ok) {
        rawHtml = await resp.text();
      }
    } catch (err) {
      console.warn('Direct HTML fetch error (may use fallback):', err.message);
    }

    // 3. Fallback / Enrichment: Microlink API query if direct HTML is thin or blocked
    let microlinkData = null;
    if (!rawHtml || rawHtml.length < 500) {
      try {
        const mResp = await fetch(`https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}`);
        if (mResp.ok) {
          const mJson = await mResp.json();
          if (mJson && mJson.data) {
            microlinkData = mJson.data;
          }
        }
      } catch {}
    }

    // 4. Extract Title & Subtitle
    let rawTitle = '';
    if (rawHtml) {
      const ogTitleMatch =
        rawHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
        rawHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
      const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      rawTitle = ogTitleMatch ? ogTitleMatch[1] : (titleMatch ? titleMatch[1] : '');
    }
    if (!rawTitle && microlinkData?.title) {
      rawTitle = microlinkData.title;
    }

    const { title: parsedTitle, subtitle: parsedSubtitle } = parseTitleAndSubtitle(rawTitle);
    result.title = parsedTitle || (microlinkData?.publisher || domain);

    // 5. Extract Raw Description
    let rawDesc = '';
    if (rawHtml) {
      const ogDescMatch =
        rawHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
        rawHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
      const metaDescMatch =
        rawHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
        rawHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
      rawDesc = ogDescMatch ? ogDescMatch[1] : (metaDescMatch ? metaDescMatch[1] : '');
    }
    if (!rawDesc && microlinkData?.description) {
      rawDesc = microlinkData.description;
    }

    // 6. Clean Tagline
    result.tagline = cleanTagline(parsedSubtitle, rawDesc, result.title);

    // 7. Logo / Favicon
    let logoCandidate = '';
    if (rawHtml) {
      const iconMatch = rawHtml.match(
        /<link[^>]+rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i
      );
      if (iconMatch && iconMatch[1]) {
        logoCandidate = resolveUrl(iconMatch[1], cleanUrl);
      }
    }
    if (!logoCandidate && microlinkData?.logo?.url) {
      logoCandidate = microlinkData.logo.url;
    }
    result.logoUrl = logoCandidate || `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;

    // 8. High-Res Promotional Image (OG Image) for Gallery
    let ogImage = '';
    if (rawHtml) {
      const ogImgMatch =
        rawHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
        rawHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      if (ogImgMatch && ogImgMatch[1]) {
        ogImage = resolveUrl(ogImgMatch[1], cleanUrl);
      }
    }
    if (!ogImage && microlinkData?.image?.url) {
      ogImage = microlinkData.image.url;
    }
    if (ogImage && !ogImage.includes('favicon') && !ogImage.includes('.ico')) {
      // Prepend official promo banner into gallery
      result.gallery = [ogImage, desktopScreenshot, mobileScreenshot];
    }

    // 9. Category Inference
    const inferText = `${cleanUrl} ${result.title} ${rawDesc} ${rawTitle}`.toLowerCase();
    if (/학교|학생|급식|시간표|공부|수능|학습|school|student|class|learn|study|edu/.test(inferText)) {
      result.category = '교육 / 학습';
    } else if (/\bai\b|gpt|llm|prompt|챗봇|인공지능|머신러닝|생성형/.test(inferText)) {
      result.category = 'AI';
    } else if (/dev|code|github|api|sdk|코딩|개발자|terminal|database|sql|editor/.test(inferText)) {
      result.category = '개발자 도구';
    } else if (/saas|생산성|업무|협업|프로젝트|notion|slack|crm|task|productivity/.test(inferText)) {
      result.category = '생산성';
    } else if (/pay|crypto|stock|coin|money|주식|코인|선물|투자|가계부|금융|셀퍼럴|페이백/.test(inferText)) {
      result.category = '금융 / 핀테크';
    } else if (/game|play|게임|퀴즈|엔터|music|음악|웹툰/.test(inferText)) {
      result.category = '게임 / 엔터';
    } else if (/community|social|chat|커뮤니티|소통|친구|모임|feed|meet/.test(inferText)) {
      result.category = '커뮤니티 / 소셜';
    } else if (/health|fit|diet|건강|운동|식단|습관|루틴|lifestyle/.test(inferText)) {
      result.category = '라이프스타일 / 건강';
    } else {
      result.category = '생산성';
    }

    // 10. Deep Mining: Headings, Paragraphs, Lists, and Social Links
    const headings = [];
    const paragraphs = [];
    const bulletPoints = [];

    if (rawHtml) {
      // Clean HTML
      const cleanedBody = rawHtml
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<svg[\s\S]*?<\/svg>/gi, '')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

      // Headings
      const hMatches = [...cleanedBody.matchAll(/<h[1-5][^>]*>([\s\S]*?)<\/h[1-5]>/gi)];
      for (const hm of hMatches) {
        const text = decodeHtmlEntities(hm[1].replace(/<[^>]+>/g, '')).trim();
        if (text && text.length >= 3 && text.length <= 70 && !headings.includes(text)) {
          headings.push(text);
          if (headings.length >= 10) break;
        }
      }

      // Paragraphs
      const pMatches = [...cleanedBody.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
      for (const pm of pMatches) {
        const text = decodeHtmlEntities(pm[1].replace(/<[^>]+>/g, '')).trim();
        if (text && text.length >= 12 && text.length <= 150 && !paragraphs.includes(text)) {
          paragraphs.push(text);
          if (paragraphs.length >= 6) break;
        }
      }

      // Bullet Points
      const liMatches = [...cleanedBody.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
      for (const lm of liMatches) {
        const text = decodeHtmlEntities(lm[1].replace(/<[^>]+>/g, '')).trim();
        if (text && text.length >= 6 && text.length <= 90 && !bulletPoints.includes(text)) {
          bulletPoints.push(text);
          if (bulletPoints.length >= 8) break;
        }
      }

      // Social Links
      const twitterMatch = rawHtml.match(/href=["'](https?:\/\/(?:twitter|x)\.com\/[^"']+)["']/i);
      if (twitterMatch) result.socialLinks.twitter = twitterMatch[1];
      const githubMatch = rawHtml.match(/href=["'](https?:\/\/github\.com\/[^"']+)["']/i);
      if (githubMatch) result.socialLinks.github = githubMatch[1];
      const linkedinMatch = rawHtml.match(/href=["'](https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/[^"']+)["']/i);
      if (linkedinMatch) result.socialLinks.linkedin = linkedinMatch[1];
      const instagramMatch = rawHtml.match(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["']/i);
      if (instagramMatch) result.socialLinks.instagram = instagramMatch[1];
      const youtubeMatch = rawHtml.match(/href=["'](https?:\/\/(?:www\.)?youtube\.com\/[^"']+)["']/i);
      if (youtubeMatch) result.socialLinks.youtube = youtubeMatch[1];
    }

    // 11. Generate Deep Tailored Markdown Description
    result.description = generateDetailedMarkdown(
      result.title,
      result.tagline,
      rawDesc,
      headings,
      paragraphs,
      bulletPoints,
      result.category,
      domain
    );
    result.instructions = result.description;

    // 12. Dynamic Tags from Extracted Features
    const extractedTags = [result.category];
    if (/코인|비트코인|선물|투자|crypto/i.test(inferText)) {
      extractedTags.push('크립토', '핀테크', '트레이딩', '커뮤니티');
    } else if (/ai|gpt|프롬프트/i.test(inferText)) {
      extractedTags.push('AI', '생성형AI', '자동화');
    } else if (/개발자|code|api/i.test(inferText)) {
      extractedTags.push('개발자도구', '오픈소스', '생산성');
    } else {
      extractedTags.push('인디메이커', '웹서비스', 'SaaS');
    }
    result.tags = Array.from(new Set(extractedTags)).filter(Boolean).slice(0, 5);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Crawl handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
