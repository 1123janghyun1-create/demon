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

function cleanTagline(subtitle: string, rawDesc: string, title: string): string {
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

function generateDetailedMarkdown(
  title: string,
  tagline: string,
  rawDesc: string,
  category: string
): string {
  const cleanDesc = decodeHtmlEntities(rawDesc).trim();
  const cleanTaglineText = decodeHtmlEntities(tagline).trim();

  let md = '';

  // 1. 서비스 개요
  md += `### 💡 서비스 개요\n`;
  if (cleanDesc) {
    md += `**${title}**은(는) ${cleanDesc}\n\n`;
  } else if (cleanTaglineText) {
    md += `**${title}**은(는) "${cleanTaglineText}"를 모토로 혁신적인 가치를 제공하는 웹 서비스입니다.\n\n`;
  } else {
    md += `**${title}**은(는) 사용자 중심의 인터페이스와 직관적인 경험을 제공하는 웹 애플리케이션입니다.\n\n`;
  }

  // 2. 주요 핵심 기능 및 특징
  md += `### ✨ 주요 핵심 기능 및 특징\n`;
  const featuresList: string[] = [];
  const descLower = cleanDesc.toLowerCase();

  if (descLower.includes('launch') || descLower.includes('meet') || descLower.includes('grow') || category === '커뮤니티 / 소셜') {
    featuresList.push(`1. **프로젝트 간편 등록 & 쇼케이스**: 새로운 아이디어와 신규 서비스를 손쉽게 런칭하고 초기 인지도를 확보할 수 있습니다.`);
    featuresList.push(`2. **초기 사용자 확보 & 실전 피드백**: 실제 타겟 유저와 테스터들의 생생한 리뷰를 통해 제품을 빠르게 검증하고 개선할 수 있습니다.`);
    featuresList.push(`3. **동료 메이커 네트워킹 & 커뮤니티**: 함께 프로젝트를 빌딩하고 성장할 동료 창업가 및 개발자들과 교류할 수 있습니다.`);
    featuresList.push(`4. **카테고리별 실시간 랭킹 & 탐색**: 최신 트렌드의 다양한 서비스들을 카테고리별로 둘러보고 새로운 영감을 얻을 수 있습니다.`);
  } else if (category === 'AI' || descLower.includes('ai') || descLower.includes('gpt')) {
    featuresList.push(`1. **AI 기반 지능형 자동화**: 복잡한 작업 흐름을 인공지능이 신속하게 분석하고 처리하여 작업 시간을 대폭 단축합니다.`);
    featuresList.push(`2. **실시간 인터랙티브 경험**: 사용자의 입력과 요구사항에 즉각적으로 반응하여 최적화된 결과물을 도출합니다.`);
    featuresList.push(`3. **스마트한 인사이트 도출**: 데이터와 컨텍스트를 종합적으로 이해하고 맞춤형 권장 사항을 제공합니다.`);
    featuresList.push(`4. **높은 작업 생산성**: 반복적인 수작업을 자동화하여 핵심 가치 창출에 집중할 수 있도록 돕습니다.`);
  } else if (category === '개발자 도구' || descLower.includes('developer') || descLower.includes('code')) {
    featuresList.push(`1. **개발 생산성 가속화**: 개발자가 겪는 반복적인 설정과 빌드 번거로움을 덜어주고 개발 흐름을 최적화합니다.`);
    featuresList.push(`2. **직관적인 UI 및 CLI 지원**: 군더더기 없는 인터페이스와 유연한 연동으로 개발 집중도를 높입니다.`);
    featuresList.push(`3. **원활한 외부 생태계 통합**: 다양한 최신 라이브러리 및 배포 환경과의 호환성을 갖추고 있습니다.`);
    featuresList.push(`4. **실시간 모니터링 & 디버깅**: 작업 상태와 에러를 한눈에 파악할 수 있는 직관적인 피드백을 제공합니다.`);
  } else {
    featuresList.push(`1. **웹 기반 즉시 접근성**: 별도의 복잡한 설치 없이 브라우저에서 바로 사용할 수 있는 쾌적한 사용 환경을 제공합니다.`);
    featuresList.push(`2. **직관적이고 모던한 UI/UX**: 처음 사용하는 유저도 매뉴얼 없이 손쉽게 기능을 파악하고 이용할 수 있도록 설계되었습니다.`);
    featuresList.push(`3. **핵심 기능 집중 전달**: 사용자가 필요로 하는 본질적인 가치를 가장 빠르고 안정적인 속도로 전달합니다.`);
    featuresList.push(`4. **멀티 디바이스 반응형 최적화**: 모바일, 태블릿, 데스크톱 등 다양한 해상도에서 깨짐 없는 완벽한 레이아웃을 보장합니다.`);
  }

  md += featuresList.join('\n') + `\n\n`;

  // 3. 주요 활용 시나리오
  md += `### 🚀 주요 활용 시나리오\n`;
  if (category === '커뮤니티 / 소셜') {
    md += `- **신규 제품 런칭 시**: 서비스 소개 글과 스크린샷을 등록하여 첫 번째 얼리어답터 사용자들을 모집하고 초기 반응을 확인합니다.\n`;
    md += `- **제품 개선 단계**: 실제 사용자들의 업보트와 피드백 댓글을 취합하여 기능 로드맵을 수립하고 서비스를 고도화합니다.\n`;
    md += `- **트렌드 리서치**: 다른 인디 메이커들이 어떤 기술 스택과 비즈니스 모델로 제품을 만들고 있는지 벤치마킹합니다.\n\n`;
  } else if (category === 'AI') {
    md += `- **업무 자동화**: 일상적인 문서 작성이나 아이디어 구상 단계에서 AI의 도움을 받아 초기 초안을 빠르게 작성합니다.\n`;
    md += `- **아이디어 브레인스토밍**: 새로운 프로젝트 기획 시 다각도의 관점과 솔루션을 실시간으로 탐색합니다.\n\n`;
  } else {
    md += `- **일상 및 업무 생산성 향상**: 불필요한 단계를 줄이고 효율적인 작업 루틴을 구축합니다.\n`;
    md += `- **실시간 협업 및 공유**: 링크 하나로 작업 내용을 동료나 팀원들과 손쉽게 공유하고 피드백을 나눕니다.\n\n`;
  }

  // 4. 타겟 사용자 및 가치 제안
  md += `### 🎯 타겟 사용자 및 추천 대상\n`;
  if (category === 'AI') {
    md += `- 최신 생성형 AI 기술을 활용해 업무 및 창작 생산성을 비약적으로 높이고 싶은 메이커\n`;
    md += `- 복잡한 프롬프트 엔지니어링 없이 직관적으로 스마트한 AI 결과를 얻고자 하는 사용자\n`;
    md += `- 새로운 AI 툴을 빠르게 도입하고 실무에 적용해보는 테크 얼리어답터\n\n`;
  } else if (category === '커뮤니티 / 소셜') {
    md += `- 사이드 프로젝트나 신규 서비스를 출시하고 초기 유저 피드백이 절실한 인디 개발자\n`;
    md += `- 함께 프로젝트를 빌딩할 팀원이나 동료 메이커를 찾고 있는 창업가 및 디자이너\n`;
    md += `- 세상에 막 나온 흥미진진한 신작 서비스들을 가장 먼저 써보고 피드백을 나누는 얼리어답터\n\n`;
  } else if (category === '개발자 도구') {
    md += `- 코딩 및 배포 프로세스를 더 스마트하고 빠르게 개선하고 싶은 프론트/백엔드 엔지니어\n`;
    md += `- 효율적인 개발 환경 구축과 도구 최적화에 관심이 많은 1인 개발자 및 스타트업 팀\n\n`;
  } else {
    md += `- 직관적이고 실용적인 웹 서비스를 통해 일상이나 업무의 효율을 높이고 싶은 사용자\n`;
    md += `- 군더더기 없는 심플한 도구와 편리한 사용성을 선호하는 사용자\n\n`;
  }

  // 5. 테스터 피드백 요청 포인트
  md += `### 🔍 테스터를 위한 피드백 요청 포인트\n`;
  md += `- **온보딩 및 직관성**: 랜딩 페이지 접속 시 서비스의 핵심 가치와 사용 방법이 명확하게 이해되는지\n`;
  md += `- **UI/UX 편의성**: PC 웹 브라우저 및 모바일 화면에서의 버튼 클릭 반응성, 폰트 가독성, 레이아웃의 완성도\n`;
  md += `- **기능 안정성 & 성능**: 페이지 로딩 속도나 인터랙션 동작 시 버그 또는 어색한 동작이 없는지\n`;
  md += `- **기능 개선 제안**: 실제 사용 시 불편했던 점이나 향후 추가되었으면 하는 기능에 대한 솔직한 의견`;

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
  if (/pay|crypto|stock|coin|money|주식|코인|가계부|금융|투자|결제/.test(t)) {
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
  if (/tool|utility|계산기|변환|확장|converter/.test(t)) {
    return '유틸리티 / 도구';
  }
  return '';
}

export async function fetchWebsiteMetadata(targetUrl: string): Promise<ExtractedMetadata> {
  let cleanUrl = targetUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  // 1. First attempt: call our /api/crawl scraper (Serverless function / Vite middleware)
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
          additionalLinks: Array.isArray(data.additionalLinks) ? data.additionalLinks : [],
          category: data.category || '',
          tags: Array.isArray(data.tags) ? data.tags.map((t: string) => decodeHtmlEntities(t)) : [],
          instructions: data.description || '',
        };
      }
    }
  } catch (err) {
    console.warn('api/crawl failed or offline, using fallback:', err);
  }

  // 2. Client-side fallback via Microlink + Real Screenshots
  let domain = '';
  try {
    domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
  } catch {
    domain = cleanUrl.replace(/^https?:\/\//, '').split('/')[0];
  }

  const desktopScreenshot = `https://s0.wp.com/mshots/v1/${encodeURIComponent(cleanUrl)}?w=1280&h=800`;
  const mobileScreenshot = `https://s0.wp.com/mshots/v1/${encodeURIComponent(cleanUrl)}?w=480&h=854`;

  const result: ExtractedMetadata = {
    title: domain,
    tagline: '',
    description: '',
    logoUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    screenshotUrl: desktopScreenshot,
    gallery: [desktopScreenshot, mobileScreenshot],
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
    tags: ['웹서비스'],
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

        const { title: parsedTitle, subtitle: parsedSubtitle } = parseTitleAndSubtitle(d.title || '');
        if (parsedTitle) result.title = parsedTitle;

        const rawDesc = decodeHtmlEntities(d.description || '');
        result.tagline = cleanTagline(parsedSubtitle, rawDesc, result.title);

        if (d.logo && d.logo.url) {
          result.logoUrl = resolveUrl(d.logo.url, cleanUrl);
        } else if (d.icon && d.icon.url) {
          result.logoUrl = resolveUrl(d.icon.url, cleanUrl);
        }

        if (d.image && d.image.url && !d.image.url.includes('favicon')) {
          const ogImg = resolveUrl(d.image.url, cleanUrl);
          if (!result.gallery.includes(ogImg)) {
            result.gallery.push(ogImg);
          }
        }

        result.category = inferCategoryStrict(`${cleanUrl} ${result.title} ${rawDesc}`);

        result.description = generateDetailedMarkdown(result.title, result.tagline, rawDesc, result.category);
        result.instructions = result.description;

        if (d.video && d.video.url) {
          result.demoVideo = d.video.url;
        }
      }
    }
  } catch (err) {
    console.warn('Microlink fallback error:', err);
  }

  return result;
}
