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

function decodeHtmlEntities(str: string): string {
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

function parseTitleAndSubtitle(rawTitle: string): { title: string; subtitle: string } {
  if (!rawTitle) return { title: '', subtitle: '' };
  const decoded = decodeHtmlEntities(rawTitle).trim();

  const delimiters = [' | ', ' - ', ' – ', ' — ', ' : '];
  for (const delim of delimiters) {
    if (decoded.includes(delim)) {
      const parts = decoded.split(delim).map(p => p.trim()).filter(Boolean);
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

function cleanTagline(subtitle: string, rawDesc: string): string {
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

function extractDynamicFeatures(title: string, rawDesc: string, category: string): string[] {
  const candidates: string[] = [];
  const navBlacklist = /^(로그인|회원가입|홈|메뉴|공지|푸터|이용약관|개인정보|문의하기|login|sign in|home|menu|footer|terms|privacy)$/i;

  if (rawDesc) {
    const parts = rawDesc
      .split(/[,·\n\r•|/]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 4 && s.length <= 70 && !navBlacklist.test(s));
    candidates.push(...parts);
  }

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    const norm = c.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    if (norm.length >= 3 && !seen.has(norm)) {
      seen.add(norm);
      unique.push(c);
      if (unique.length >= 6) break;
    }
  }

  return unique;
}

function generateDetailedMarkdown(
  title: string,
  tagline: string,
  rawDesc: string,
  category: string,
  domain: string
): string {
  const cleanTitle = title || domain;
  const cleanDesc = decodeHtmlEntities(rawDesc).trim();
  const cleanTaglineText = decodeHtmlEntities(tagline).trim();
  const dynamicFeatures = extractDynamicFeatures(cleanTitle, cleanDesc, category);

  let md = '';

  md += `### 💡 서비스 핵심 개요\n`;
  if (cleanDesc) {
    md += `**${cleanTitle}**은(는) ${cleanDesc}\n\n`;
  } else if (cleanTaglineText) {
    md += `**${cleanTitle}**은(는) "${cleanTaglineText}"를 모토로 혁신적인 가치를 제공하는 독창적인 웹 프로덕트입니다.\n\n`;
  } else {
    md += `**${cleanTitle}**은(는) ${domain} 도메인을 기반으로 사용자에게 직관적이고 실용적인 경험을 제공하는 웹 애플리케이션입니다.\n\n`;
  }

  md += `복잡한 절차와 정보 파편화를 줄이고 웹 브라우저에서 누구나 빠르고 쾌적하게 핵심 목적을 실현할 수 있도록 정밀하게 개발되었습니다.\n\n`;

  md += `### ✨ 사이트 분석 기반 주요 핵심 기능 & 시스템\n`;
  if (dynamicFeatures.length > 0) {
    dynamicFeatures.forEach((feat, idx) => {
      let desc = '실시간 인터랙티브 데이터 처리와 최적화된 워크플로우를 통해 사용자가 원하는 핵심 가치를 지체 없이 실현합니다.';
      if (/코인|선물|투자|차트|펀딩|거래소|셀퍼럴|페이백|크립토/i.test(feat + ' ' + cleanDesc)) {
        desc = '실시간 시장 동향과 펀딩 비율 등 핵심 데이터를 면밀히 집계하여 최적의 의사결정과 혜택을 지원합니다.';
      } else if (/ai|gpt|프롬프트|생성형|llm/i.test(feat + ' ' + cleanDesc)) {
        desc = '인공지능 모델을 활용하여 번거로운 수작업 단계를 줄이고 고품질 결과물을 실시간으로 생성합니다.';
      }
      md += `${idx + 1}. **${feat}**: ${desc}\n`;
    });
  } else {
    md += `1. **${cleanTitle} 핵심 인터페이스**: 직관적이고 모던한 UI를 통해 처음 방문한 사용자도 매뉴얼 없이 즉시 핵심 기능을 파악하고 이용할 수 있습니다.\n`;
    md += `2. **실시간 데이터 동기화 & 고속 처리**: 최신 웹 기술을 적용하여 모든 인터랙션과 작업 상태가 실시간으로 부드럽게 갱신됩니다.\n`;
    md += `3. **멀티 디바이스 반응형 최적화**: 모바일, 태블릿, 데스크톱 등 다양한 해상도에서 화면 깨짐 없는 완벽한 레이아웃을 보장합니다.\n`;
  }
  md += `\n`;

  md += `### 🚀 실전 워크플로우 & 주요 활용 시나리오\n`;
  md += `- **1단계: 진입 및 온보딩**: ${domain}에 접속하여 서비스가 제공하는 핵심 기능과 사용자 혜택을 한눈에 파악합니다.\n`;
  md += `- **2단계: 작업 실행 및 탐색**: 직관적인 메뉴 구성을 따라 필요한 정보 조회 및 작업을 지체 없이 진행합니다.\n`;
  md += `- **3단계: 피드백 및 확장**: 도출된 인사이트나 결과물을 동료들과 공유하고 지속적인 사용 루틴을 정착합니다.\n\n`;

  md += `### 🎯 최적 타겟 고객군 & 추천 대상\n`;
  if (/코인|선물|투자|crypto|trade/i.test(cleanDesc + ' ' + cleanTitle)) {
    md += `- 실시간 시장 시황과 펀딩비, 매매일지를 편리하게 관리하고 싶은 가상자산/선물 트레이더\n`;
    md += `- 거래소 수수료 부담을 낮추고 페이백 혜택을 확인하고자 하는 스마트한 투자자\n\n`;
  } else if (/ai|gpt|프롬프트/i.test(cleanDesc + ' ' + cleanTitle)) {
    md += `- 최신 AI 툴을 실무에 즉시 도입하여 작업 생산성을 극대화하고 싶은 메이커 및 얼리어답터\n`;
    md += `- 복잡한 설정 없이도 뛰어난 AI 분석 결과를 간편하게 얻고자 하는 사용자\n\n`;
  } else {
    md += `- 군더더기 없는 심플한 웹 도구와 빠른 반응 속도를 선호하는 사용자\n`;
    md += `- 일상이나 업무 프로세스를 한층 더 스마트하게 개선하고 싶은 생산성 지향 메이커\n\n`;
  }

  md += `### 🔍 테스터를 위한 집중 피드백 요청 포인트\n`;
  md += `- **[첫인상 및 직관성]**: 랜딩 페이지 진입 시 서비스의 핵심 가치와 사용 방법이 명확하게 이해되는지\n`;
  md += `- **[UI/UX 사용 편의성]**: 모바일 및 데스크톱 환경에서의 버튼 반응성, 폰트 가독성, 메뉴 탐색의 쾌적함\n`;
  md += `- **[기능 완성도 및 안정성]**: 실제 조작 과정에서 버그나 로딩 지연 현상이 발생하지 않는지\n`;
  md += `- **[개선 아이디어]**: 실사용자 관점에서 추가되었으면 하는 기능이나 개선 제안`;

  return md.trim();
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
  if (/dev|code|github|api|sdk|코딩|개발자|terminal|database|sql|editor/.test(t)) {
    return '개발자 도구';
  }
  if (/saas|생산성|업무|협업|프로젝트|notion|slack|crm|task|productivity/.test(t)) {
    return '생산성';
  }
  if (/pay|crypto|stock|coin|money|주식|코인|선물|투자|가계부|금융|셀퍼럴|페이백/.test(t)) {
    return '금융 / 핀테크';
  }
  if (/game|play|게임|퀴즈|엔터|music|음악|웹툰/.test(t)) {
    return '게임 / 엔터';
  }
  if (/community|social|chat|커뮤니티|소통|친구|모임|feed|meet/.test(t)) {
    return '커뮤니티 / 소셜';
  }
  if (/health|fit|diet|건강|운동|식단|습관|루틴|lifestyle/.test(t)) {
    return '라이프스타일 / 건강';
  }
  return '생산성';
}

export async function fetchWebsiteMetadata(targetUrl: string): Promise<ExtractedMetadata> {
  let cleanUrl = targetUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  // 1. Primary: Serverless crawler endpoint (Vite dev middleware & Vercel API)
  try {
    const res = await fetch(`/api/crawl?url=${encodeURIComponent(cleanUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.title || data.description || data.logoUrl || data.screenshotUrl)) {
        return {
          title: decodeHtmlEntities(data.title || ''),
          tagline: decodeHtmlEntities(data.tagline || ''),
          description: data.description || '',
          logoUrl: data.logoUrl || '',
          screenshotUrl: data.screenshotUrl || '',
          gallery: Array.isArray(data.gallery) ? data.gallery.slice(0, 5) : [],
          demoVideo: data.demoVideo || '',
          socialLinks: {
            twitter: data.socialLinks?.twitter || '',
            github: data.socialLinks?.github || '',
            linkedin: data.socialLinks?.linkedin || '',
            instagram: data.socialLinks?.instagram || '',
            threads: data.socialLinks?.threads || '',
            youtube: data.socialLinks?.youtube || '',
          },
          additionalLinks: data.additionalLinks || [],
          category: data.category || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          instructions: data.instructions || data.description || '',
        };
      }
    }
  } catch (err) {
    console.warn('Backend crawler fetch failed, activating enhanced client scraper:', err);
  }

  // 2. Client-side fallback using thum.io high-res screenshot
  let domain = '';
  try {
    domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
  } catch {
    domain = cleanUrl.replace(/^https?:\/\//, '').split('/')[0];
  }

  const desktopScreenshot = `https://image.thum.io/get/width/1280/crop/800/noanimate/${cleanUrl}`;
  const mobileScreenshot = `https://image.thum.io/get/width/480/crop/854/noanimate/${cleanUrl}`;

  // Try Microlink metadata
  try {
    const mRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}`);
    if (mRes.ok) {
      const mJson = await mRes.json();
      const mData = mJson?.data;
      if (mData) {
        const { title: pTitle, subtitle: pSub } = parseTitleAndSubtitle(mData.title || '');
        const finalTitle = pTitle || mData.publisher || domain;
        const finalTagline = cleanTagline(pSub, mData.description || '');
        const cat = inferCategoryStrict(`${cleanUrl} ${finalTitle} ${mData.description || ''}`);
        const desc = generateDetailedMarkdown(finalTitle, finalTagline, mData.description || '', cat, domain);

        const gallery = [desktopScreenshot, mobileScreenshot];
        if (mData.image?.url && !mData.image.url.includes('favicon')) {
          gallery.unshift(mData.image.url);
        }

        return {
          title: finalTitle,
          tagline: finalTagline,
          description: desc,
          logoUrl: mData.logo?.url || `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
          screenshotUrl: desktopScreenshot,
          gallery: gallery.slice(0, 5),
          demoVideo: '',
          socialLinks: { twitter: '', github: '', linkedin: '', instagram: '', threads: '', youtube: '' },
          additionalLinks: [],
          category: cat,
          tags: [cat, '인디메이커', 'SaaS'],
          instructions: desc,
        };
      }
    }
  } catch {}

  // Basic fallback
  const basicDesc = generateDetailedMarkdown(domain, '', '', '생산성', domain);
  return {
    title: domain,
    tagline: '',
    description: basicDesc,
    logoUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    screenshotUrl: desktopScreenshot,
    gallery: [desktopScreenshot, mobileScreenshot],
    demoVideo: '',
    socialLinks: { twitter: '', github: '', linkedin: '', instagram: '', threads: '', youtube: '' },
    additionalLinks: [],
    category: '생산성',
    tags: ['생산성', '웹서비스'],
    instructions: basicDesc,
  };
}
