// api/crawl.js
// Ultra-Deep Multi-Page & Multi-Site AI Web Crawler + Structured Markdown Synthesizer
// Crawls:
//   1. Main page via JS-rendering Jina Reader (full SPA DOM!) + Direct HTML + Sitemap
//   2. Up to 4 high-value internal subpages (/about, /features, /pricing, /docs, /guide, /faq, etc.)
//   3. External linked sites (GitHub Repo & README, Notion/Docs/Blog/Disquiet/ProductHunt)
//   4. External web references (cross-site search mentions & reviews)
// Produces rich, concrete, multi-section Korean Markdown reports with ZERO generic boilerplate!

function decodeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
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
    return '';
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return resp;
  } catch (err) {
    clearTimeout(timer);
    throw err;
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
        const t = parts[0].replace(/\s*(Home|Main|Welcome|공식\s*웹사이트|홈페이지|메인).*$/i, '').trim();
        const sub = parts[1].replace(/\s*(Home|Main|Welcome|공식\s*웹사이트|홈페이지|메인).*$/i, '').trim();
        return { title: t, subtitle: sub };
      }
    }
  }
  return {
    title: decoded.replace(/\s*[-–—|:]\s*(Home|Main|Welcome|공식\s*웹사이트|홈페이지|메인).*$/i, '').trim(),
    subtitle: '',
  };
}

function cleanTagline(subtitle, rawDesc) {
  if (subtitle && subtitle.length >= 4 && subtitle.length <= 65) {
    return decodeHtmlEntities(subtitle).trim();
  }
  if (rawDesc) {
    const decoded = decodeHtmlEntities(rawDesc).replace(/\s+/g, ' ').trim();
    const firstMatch = decoded.match(/^([^.!?\n\r]+[.!?]?)/);
    const first = firstMatch ? firstMatch[1].trim() : decoded;
    if (first.length >= 5 && first.length <= 65) return first;
    if (decoded.length > 62) {
      const cut = decoded.slice(0, 60);
      const sp = cut.lastIndexOf(' ');
      return (sp > 20 ? cut.slice(0, sp) : cut) + '...';
    }
    return decoded;
  }
  return '';
}

function stripMarkdownNoise(line) {
  if (!line) return '';
  return decodeHtmlEntities(line)
    // Remove markdown images ![alt](url)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    // Replace markdown links [text](url) with just text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove raw URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove excess markdown symbols
    .replace(/[`*_~>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NOISE_LINE_REGEX = /^(로그인|회원가입|로그아웃|시작하기|무료로 시작|홈|메뉴|닫기|검색|더보기|전체보기|공유|복사|이전|다음|이용약관|개인정보|개인정보처리방침|쿠키|저작권|copyright|all rights reserved|login|log in|sign in|sign up|get started|home|menu|close|search|more|share|copy|prev|next|terms|privacy|cookie|skip to content|toggle navigation|loading\.*|404|not found)$/i;

function isUsefulText(text, minLen = 8) {
  if (!text) return false;
  const t = text.trim();
  if (t.length < minLen) return false;
  if (NOISE_LINE_REGEX.test(t)) return false;
  if (/^[\d\s.,:%/+-]+$/.test(t)) return false;
  if (/^(blob:|data:|javascript:|mailto:)/i.test(t)) return false;
  if (/(cloudflare|just a moment|enable javascript|checking your browser|captcha)/i.test(t)) return false;
  return true;
}

/**
 * Fetch JS-rendered Markdown of any URL (SPA-friendly!) using Jina Reader API
 */
async function fetchJinaMarkdown(url, timeoutMs = 8000) {
  try {
    const resp = await fetchWithTimeout(
      `https://r.jina.ai/${url}`,
      {
        headers: {
          Accept: 'text/plain',
          'X-Return-Format': 'markdown',
          'X-Timeout': '7',
        },
      },
      timeoutMs
    );
    if (!resp.ok) return null;
    const text = await resp.text();
    if (!text || text.length < 80) return null;

    // Parse Jina header metadata
    const titleMatch = text.match(/^Title:\s*(.+)$/m);
    const finalUrlMatch = text.match(/^Final URL:\s*(.+)$/m);
    const contentIdx = text.indexOf('Markdown Content:');
    const body = contentIdx >= 0 ? text.slice(contentIdx + 'Markdown Content:'.length).trim() : text.trim();

    return {
      title: titleMatch ? titleMatch[1].trim() : '',
      finalUrl: finalUrlMatch ? finalUrlMatch[1].trim() : url,
      markdown: body,
    };
  } catch {
    return null;
  }
}

/**
 * Parse rendered Markdown into structured sections, headings, bullets, links, images, pricing, FAQs
 */
function parseStructuredMarkdown(markdown, pageUrl, pageTitle = '') {
  const lines = (markdown || '').split(/\r?\n/);
  const headings = [];
  const paragraphs = [];
  const bullets = [];
  const links = [];
  const images = [];
  const sections = [];
  const pricingLines = [];
  const faqItems = [];

  let currentSection = { heading: pageTitle || '주요 내용', lines: [], bullets: [] };

  const pushCurrentSection = () => {
    if (currentSection.lines.length > 0 || currentSection.bullets.length > 0) {
      sections.push(currentSection);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    // Extract images ![alt](url)
    const imgMatches = [...raw.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)];
    for (const im of imgMatches) {
      const imgUrl = im[2];
      if (!/(favicon|\.ico|\.svg|badge|shields\.io|pixel|analytics|avatar|emoji|1x1)/i.test(imgUrl)) {
        images.push({ alt: im[1] || '', url: imgUrl });
      }
    }

    // Extract links [label](url)
    const linkMatches = [...raw.matchAll(/(?<!!)\[([^\]]{2,60})\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g)];
    for (const lm of linkMatches) {
      const resolved = resolveUrl(lm[2], pageUrl);
      if (resolved) links.push({ text: lm[1].trim(), url: resolved });
    }

    // Check Markdown heading
    const hMatch = raw.match(/^(#{1,4})\s+(.+)$/);
    if (hMatch) {
      const cleanH = stripMarkdownNoise(hMatch[2]);
      if (isUsefulText(cleanH, 3) && cleanH.length <= 80) {
        pushCurrentSection();
        currentSection = { heading: cleanH, lines: [], bullets: [] };
        if (!headings.includes(cleanH)) headings.push(cleanH);
      }
      continue;
    }

    // Check setext heading (next line === or ---)
    if (i + 1 < lines.length && /^(=+|-+)$/.test(lines[i + 1].trim()) && lines[i + 1].trim().length >= 3) {
      const cleanH = stripMarkdownNoise(raw);
      if (isUsefulText(cleanH, 3) && cleanH.length <= 80) {
        pushCurrentSection();
        currentSection = { heading: cleanH, lines: [], bullets: [] };
        if (!headings.includes(cleanH)) headings.push(cleanH);
        i++;
        continue;
      }
    }

    // Check bullet point
    const bMatch = raw.match(/^[-*+•]\s+(.+)$/) || raw.match(/^\d+\.\s+(.+)$/);
    if (bMatch) {
      const cleanB = stripMarkdownNoise(bMatch[1]);
      if (isUsefulText(cleanB, 6) && cleanB.length <= 220) {
        bullets.push(cleanB);
        if (currentSection.bullets.length < 8) currentSection.bullets.push(cleanB);
        if (/(무료|유료|요금|가격|월\s*\d|원\/월|\$\d|free|pro|plan|pricing|구독)/i.test(cleanB)) {
          pricingLines.push(cleanB);
        }
      }
      continue;
    }

    // Regular paragraph line
    const cleanP = stripMarkdownNoise(raw);
    if (isUsefulText(cleanP, 12) && cleanP.length <= 360) {
      paragraphs.push(cleanP);
      if (currentSection.lines.length < 5) currentSection.lines.push(cleanP);
      if (/(무료|유료|요금|가격|월\s*\d|원\/월|\$\d|free|pro|plan|pricing|구독)/i.test(cleanP)) {
        pricingLines.push(cleanP);
      }
      if (/^(Q[\.\s:]|질문[\.\s:])/i.test(cleanP) || /\?$/.test(cleanP)) {
        const nextClean = i + 1 < lines.length ? stripMarkdownNoise(lines[i + 1]) : '';
        if (isUsefulText(nextClean, 10) && !/\?$/.test(nextClean)) {
          faqItems.push({ q: cleanP, a: nextClean });
        }
      }
    }
  }
  pushCurrentSection();

  return {
    url: pageUrl,
    title: pageTitle,
    headings: headings.slice(0, 30),
    paragraphs: paragraphs.slice(0, 45),
    bullets: bullets.slice(0, 50),
    sections: sections.slice(0, 24),
    links,
    images,
    pricingLines: Array.from(new Set(pricingLines)).slice(0, 8),
    faqItems: faqItems.slice(0, 8),
  };
}

/**
 * Discover target site's sitemap URLs to find real subpages
 */
async function fetchTargetSitemapUrls(origin) {
  try {
    const resp = await fetchWithTimeout(`${origin}/sitemap.xml`, { headers: { 'User-Agent': 'demonst-AI-Crawler/2.0' } }, 3500);
    if (!resp.ok) return [];
    const xml = await resp.text();
    const matches = [...xml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/gi)];
    return matches.map((m) => m[1].trim()).slice(0, 40);
  } catch {
    return [];
  }
}

/**
 * Score & pick top internal subpages for multi-page crawling
 */
function selectTopSubpages(candidateLinks, baseUrl, maxPages = 5) {
  let baseObj;
  try {
    baseObj = new URL(baseUrl);
  } catch {
    return [];
  }

  const origin = baseObj.origin;
  const basePath = baseObj.pathname.replace(/\/$/, '') || '/';
  const excludeRegex = /(\.(png|jpg|jpeg|gif|webp|svg|ico|pdf|zip|css|js|xml|json|mp4|mp3)$|\/(login|signin|sign-in|signup|sign-up|logout|auth|oauth|privacy|terms|legal|policy|cookie|admin|cart|checkout|reset-password|404))/i;
  const junkUrlRegex = /(\$\{|%7b|%7d|\{|\}|<|>|undefined|null|javascript:|mailto:|tel:)/i;

  const scored = new Map();

  for (const item of candidateLinks) {
    const urlStr = typeof item === 'string' ? item : item.url;
    const label = typeof item === 'string' ? '' : (item.text || '');
    if (!urlStr || junkUrlRegex.test(urlStr)) continue;

    let u;
    try {
      u = new URL(urlStr, origin);
    } catch {
      continue;
    }

    if (u.origin !== origin) continue;
    const cleanPath = u.pathname.replace(/\/$/, '') || '/';
    if (cleanPath === basePath && !u.search) continue;
    if (excludeRegex.test(cleanPath) || junkUrlRegex.test(cleanPath)) continue;

    const normalized = `${u.origin}${cleanPath}${u.search}`;
    if (scored.has(normalized)) continue;

    let score = 1;
    const combined = `${cleanPath} ${label}`.toLowerCase();
    if (/landing|intro|about|소개|story|mission|company|팀/.test(combined)) score += 12;
    if (/feature|기능|product|service|서비스|solution|솔루션|how-it-works|how/.test(combined)) score += 11;
    if (/pricing|price|plan|요금|가격|구독/.test(combined)) score += 10;
    if (/docs|doc|guide|가이드|manual|tutorial|사용법|도움말|help/.test(combined)) score += 9;
    if (/faq|질문|qna/.test(combined)) score += 8;
    if (/blog|changelog|release|update|news|소식|업데이트/.test(combined)) score += 6;
    const depth = cleanPath.split('/').filter(Boolean).length;
    if (depth === 1) score += 3;
    if (depth > 3) score -= 4;

    scored.set(normalized, { url: normalized, label: label || cleanPath, score });
  }

  return Array.from(scored.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPages);
}

/**
 * Crawl linked GitHub repository (API metadata + README.md) for deep technical details
 */
async function crawlGitHubRepo(githubUrl) {
  const m = githubUrl.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i);
  if (!m) return null;
  const owner = m[1];
  const repo = m[2].replace(/\.git$/, '');
  if (['sponsors', 'orgs', 'topics', 'features', 'pricing', 'login'].includes(owner.toLowerCase())) return null;

  try {
    const [metaRes, readmeRes] = await Promise.all([
      fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`, { headers: { 'User-Agent': 'demonst-AI-Crawler/2.0' } }, 4500).catch(() => null),
      fetchWithTimeout(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`, { headers: { 'User-Agent': 'demonst-AI-Crawler/2.0' } }, 4500).catch(() => null),
    ]);

    let meta = null;
    if (metaRes && metaRes.ok) meta = await metaRes.json();

    let readme = '';
    if (readmeRes && readmeRes.ok) readme = await readmeRes.text();

    if (!meta && !readme) return null;

    const parsedReadme = readme ? parseStructuredMarkdown(readme.slice(0, 12000), githubUrl, `GitHub README (${owner}/${repo})`) : null;
    return {
      url: `https://github.com/${owner}/${repo}`,
      repoName: `${owner}/${repo}`,
      description: meta?.description || '',
      language: meta?.language || '',
      stars: meta?.stargazers_count || 0,
      topics: Array.isArray(meta?.topics) ? meta.topics : [],
      parsedReadme,
    };
  } catch {
    return null;
  }
}

/**
 * External Cross-Site Web Reference Search (DuckDuckGo HTML)
 * Visits external web search snippets to discover reviews, blog posts, and outside context about the site!
 */
async function fetchExternalWebMentions(domain, title) {
  try {
    const query = title && title.toLowerCase() !== domain.toLowerCase()
      ? `"${domain}" OR "${title}"`
      : `"${domain}"`;
    const resp = await fetchWithTimeout(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
        },
      },
      4500
    );
    if (!resp.ok) return [];
    const html = await resp.text();
    const mentions = [];
    const blockRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = blockRegex.exec(html)) !== null && mentions.length < 4) {
      const href = decodeHtmlEntities(m[1]);
      const rTitle = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, '')).trim();
      const snippet = decodeHtmlEntities(m[3].replace(/<[^>]+>/g, '')).trim();
      if (isUsefulText(snippet, 20)) {
        mentions.push({ title: rTitle, snippet, url: href });
      }
    }
    return mentions;
  } catch {
    return [];
  }
}

/**
 * Detect real technology stack from raw HTML, headers & GitHub data
 */
function detectTechStack(rawHtml, responseHeaders, githubInfo) {
  const stack = new Set();
  const h = (rawHtml || '').toLowerCase();

  if (h.includes('__next_data__') || h.includes('/_next/')) stack.add('Next.js');
  if (h.includes('data-reactroot') || h.includes('react') || h.includes('/@vite/')) stack.add('React');
  if (h.includes('__nuxt') || h.includes('nuxt')) stack.add('Nuxt / Vue');
  if (h.includes('svelte')) stack.add('Svelte');
  if (h.includes('tailwind')) stack.add('Tailwind CSS');
  if (h.includes('supabase')) stack.add('Supabase');
  if (h.includes('firebase')) stack.add('Firebase');
  if (h.includes('cloudinary')) stack.add('Cloudinary');
  if (h.includes('stripe.com')) stack.add('Stripe');
  if (h.includes('tosspayments')) stack.add('토스페이먼츠');
  if (h.includes('gtag') || h.includes('googletagmanager')) stack.add('Google Analytics');
  if (h.includes('manifest.json') || h.includes('serviceworker')) stack.add('PWA (프로그레시브 웹 앱)');

  const serverHeader = (responseHeaders?.get?.('server') || '').toLowerCase();
  const poweredBy = (responseHeaders?.get?.('x-powered-by') || '').toLowerCase();
  if (serverHeader.includes('vercel') || responseHeaders?.get?.('x-vercel-id')) stack.add('Vercel');
  if (serverHeader.includes('cloudflare')) stack.add('Cloudflare');
  if (serverHeader.includes('netlify')) stack.add('Netlify');
  if (poweredBy.includes('next.js')) stack.add('Next.js');

  if (githubInfo?.language) stack.add(githubInfo.language);
  if (Array.isArray(githubInfo?.topics)) {
    githubInfo.topics.slice(0, 4).forEach((t) => stack.add(t));
  }

  return Array.from(stack).slice(0, 8);
}

/**
 * Ultra-Detailed Multi-Page & Multi-Site Markdown Synthesizer
 * ZERO generic boilerplate — 100% grounded in REAL scraped content from all visited pages & external sites!
 */
function synthesizeUltraDetailedReport({
  title,
  tagline,
  rawDesc,
  domain,
  cleanUrl,
  category,
  mainParsed,
  subpageResults,
  externalSiteResults,
  githubInfo,
  webMentions,
  techStack,
  socialLinks,
  jsonLdInfos,
}) {
  const cleanTitle = title || domain;
  const cleanDesc = decodeHtmlEntities(rawDesc || '').trim();
  const allPages = [mainParsed, ...subpageResults, ...externalSiteResults].filter(Boolean);

  // Deduplication helper
  const usedNorms = new Set();
  const takeUnique = (text) => {
    const norm = (text || '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    if (norm.length < 4 || usedNorms.has(norm)) return false;
    usedNorms.add(norm);
    return true;
  };

  let md = '';

  // =========================================================
  // SECTION 1: 💡 서비스 핵심 개요 및 해결하는 문제
  // =========================================================
  md += `### 💡 서비스 핵심 개요\n`;
  if (cleanDesc && cleanDesc.length >= 15) {
    md += `**${cleanTitle}**(${domain})은(는) ${cleanDesc}\n\n`;
    takeUnique(cleanDesc);
  } else if (tagline && tagline.length >= 5) {
    md += `**${cleanTitle}**(${domain})은(는) "${tagline}"을(를) 핵심 가치로 제공하는 ${category} 분야의 웹 서비스입니다.\n\n`;
    takeUnique(tagline);
  } else {
    md += `**${cleanTitle}**은(는) \`${domain}\`에서 웹 브라우저로 바로 이용할 수 있는 ${category} 서비스입니다.\n\n`;
  }

  // Pull top substantive intro paragraphs from landing/about subpages & main page
  const introParagraphs = [];
  const introOrderedPages = [...subpageResults, mainParsed, ...externalSiteResults].filter(Boolean);
  for (const page of introOrderedPages) {
    for (const p of page.paragraphs || []) {
      if (p.length >= 20 && !/바로가기\s*00\s*\/\s*0\d|HOME\s*설정/i.test(p) && takeUnique(p)) {
        introParagraphs.push(p);
        if (introParagraphs.length >= 5) break;
      }
    }
    if (introParagraphs.length >= 5) break;
  }
  if (introParagraphs.length > 0) {
    md += introParagraphs.map((p) => `${p}`).join('\n\n') + '\n\n';
  }
  if (githubInfo?.description && takeUnique(githubInfo.description)) {
    md += `> **GitHub 공식 소개**: ${githubInfo.description}${githubInfo.stars > 0 ? ` (⭐ ${githubInfo.stars} Stars)` : ''}\n\n`;
  }

  // =========================================================
  // SECTION 2: ✨ 실제 페이지 분석 기반 핵심 기능 및 상세 구성
  // =========================================================
  md += `### ✨ 실제 사이트 심층 분석 — 핵심 기능 및 상세 구성\n`;

  const richFeatures = [];
  const uiJunkRegex = /(바로가기\s*\d+\s*\/\s*\d+|HOME\s*설정|할일\s*목록\s*HOME|scroll\s*down|^\d+\s*\/\s*\d+$)/i;
  for (const page of introOrderedPages) {
    for (const sec of page.sections || []) {
      const h = (sec.heading || '').trim();
      if (!isUsefulText(h, 3) || h.toLowerCase() === cleanTitle.toLowerCase()) continue;
      if (h.includes(cleanTitle) && h.includes('—')) continue;
      if (!takeUnique(h)) continue;

      const bodyParts = [];
      for (const l of sec.lines || []) {
        if (!uiJunkRegex.test(l) && l.length >= 8 && takeUnique(l)) bodyParts.push(l);
        if (bodyParts.length >= 3) break;
      }
      for (const b of sec.bullets || []) {
        if (!uiJunkRegex.test(b) && b.length >= 6 && takeUnique(b)) bodyParts.push(b);
        if (bodyParts.length >= 5) break;
      }

      if (bodyParts.length > 0) {
        richFeatures.push({ heading: h, details: bodyParts, source: page.title || page.url });
      }
      if (richFeatures.length >= 12) break;
    }
    if (richFeatures.length >= 12) break;
  }

  if (richFeatures.length > 0) {
    richFeatures.forEach((feat, idx) => {
      const primary = feat.details[0];
      const extras = feat.details.slice(1);
      md += `${idx + 1}. **${feat.heading}**: ${primary}\n`;
      extras.forEach((ex) => {
        md += `   - ${ex}\n`;
      });
    });
    md += `\n`;
  } else {
    // Fallback to extracted bullets/headings across all crawled pages
    const allBullets = [];
    for (const page of allPages) {
      for (const b of [...(page.bullets || []), ...(page.headings || [])]) {
        if (isUsefulText(b, 6) && takeUnique(b)) {
          allBullets.push(b);
          if (allBullets.length >= 8) break;
        }
      }
      if (allBullets.length >= 8) break;
    }
    if (allBullets.length > 0) {
      allBullets.forEach((b, idx) => {
        md += `${idx + 1}. ${b}\n`;
      });
      md += `\n`;
    } else {
      md += `- 현재 \`${cleanUrl}\`에서 직접 접속해 핵심 기능을 체험할 수 있으며, 아래 멀티 페이지 탐색 결과와 스크린샷을 통해 실제 구성을 확인할 수 있습니다.\n\n`;
    }
  }

  // =========================================================
  // SECTION 3: 🗺️ 멀티 페이지 & 외부 사이트 탐색 리포트
  // =========================================================
  const visitedSummaries = [];
  for (const sub of subpageResults) {
    const pathLabel = (() => {
      try {
        return new URL(sub.url).pathname || '/';
      } catch {
        return sub.url;
      }
    })();
    const keyPoints = [...(sub.headings || []).slice(0, 3), ...(sub.paragraphs || []).slice(0, 1)]
      .filter((x) => isUsefulText(x, 4))
      .slice(0, 3);
    visitedSummaries.push({
      label: `${sub.title || pathLabel} (\`${pathLabel}\`)`,
      summary: keyPoints.length > 0 ? keyPoints.join(' · ') : '세부 콘텐츠 및 페이지 구성 확인 완료',
    });
  }

  if (githubInfo) {
    const readmeHighlights = (githubInfo.parsedReadme?.headings || []).slice(0, 4).join(', ');
    visitedSummaries.push({
      label: `GitHub 저장소 (${githubInfo.repoName})`,
      summary: `${githubInfo.description || '오픈소스 리포지토리'}${readmeHighlights ? ` — 주요 문서 항목: ${readmeHighlights}` : ''}`,
    });
  }

  for (const ext of externalSiteResults) {
    const extHost = (() => {
      try {
        return new URL(ext.url).hostname;
      } catch {
        return '외부 사이트';
      }
    })();
    const pts = [...(ext.headings || []).slice(0, 2), ...(ext.paragraphs || []).slice(0, 1)].filter(Boolean).slice(0, 2);
    visitedSummaries.push({
      label: `${ext.title || extHost} (${extHost})`,
      summary: pts.join(' · ') || '외부 연동 문서 분석 완료',
    });
  }

  for (const wm of webMentions) {
    if (takeUnique(wm.snippet)) {
      visitedSummaries.push({
        label: `외부 웹 레퍼런스 — ${wm.title}`,
        summary: wm.snippet,
      });
    }
  }

  if (visitedSummaries.length > 0) {
    md += `### 🗺️ 여러 페이지 및 외부 사이트 탐색 리포트\n`;
    visitedSummaries.slice(0, 8).forEach((item) => {
      md += `- **${item.label}**: ${item.summary}\n`;
    });
    md += `\n`;
  }

  // =========================================================
  // SECTION 4: 🚀 사이트 실제 메뉴 구조 & 활용 포인트
  // =========================================================
  const realBulletsExtra = [];
  for (const page of allPages) {
    for (const b of page.bullets || []) {
      if (b.length >= 10 && takeUnique(b)) {
        realBulletsExtra.push(b);
        if (realBulletsExtra.length >= 6) break;
      }
    }
    if (realBulletsExtra.length >= 6) break;
  }

  if (realBulletsExtra.length > 0) {
    md += `### 🚀 세부 기능 및 실전 활용 포인트\n`;
    realBulletsExtra.forEach((item) => {
      md += `- ${item}\n`;
    });
    md += `\n`;
  }

  // =========================================================
  // SECTION 5: 💰 요금제 · 기술 스택 · 외부 채널 정보
  // =========================================================
  const allPricing = Array.from(new Set(allPages.flatMap((p) => p.pricingLines || []))).slice(0, 4);
  const activeSocials = Object.entries(socialLinks || {}).filter(([, v]) => Boolean(v));

  if (allPricing.length > 0 || techStack.length > 0 || activeSocials.length > 0 || jsonLdInfos.length > 0) {
    md += `### 🛠️ 요금제 · 기술 환경 · 연동 정보\n`;
    if (allPricing.length > 0) {
      md += `- **요금 및 이용 안내**: ${allPricing.join(' / ')}\n`;
    }
    if (techStack.length > 0) {
      md += `- **감지된 기술 스택 & 인프라**: ${techStack.join(', ')}\n`;
    }
    if (jsonLdInfos.length > 0) {
      md += `- **구조화 메타데이터**: ${jsonLdInfos.slice(0, 3).join(' · ')}\n`;
    }
    if (activeSocials.length > 0) {
      md += `- **발견된 공식 채널**: ${activeSocials.map(([k, v]) => `${k.toUpperCase()} (${v})`).join(', ')}\n`;
    }
    md += `\n`;
  }

  // =========================================================
  // SECTION 6: ❓ 사이트 내 추출된 FAQ (실제 존재할 때만 출력)
  // =========================================================
  const allFaqs = allPages.flatMap((p) => p.faqItems || []).slice(0, 4);
  if (allFaqs.length > 0) {
    md += `### ❓ 사이트 내 주요 질문 & 안내 (FAQ)\n`;
    allFaqs.forEach((f) => {
      md += `- **${f.q}**\n  ${f.a}\n`;
    });
    md += `\n`;
  }

  // =========================================================
  // SECTION 7: 🔍 베타 테스터를 위한 맞춤형 집중 피드백 포인트
  // =========================================================
  md += `### 🔍 베타 테스터 집중 점검 포인트\n`;
  const qaTargets = richFeatures.slice(0, 3).map((f) => f.heading);
  if (qaTargets.length > 0) {
    qaTargets.forEach((featName) => {
      md += `- **['${featName.slice(0, 35)}' 기능 실사용 검증]**: 해당 기능이 안내된 내용대로 오류 없이 매끄럽게 동작하고 원하는 결과를 제공하는지\n`;
    });
  } else {
    md += `- **[핵심 온보딩 경험]**: \`${domain}\` 첫 접속 시 서비스 목적과 사용 방법이 별도 설명 없이 바로 이해되는지\n`;
  }
  if (subpageResults.length > 0) {
    const subPaths = subpageResults
      .map((s) => {
        try {
          return new URL(s.url).pathname;
        } catch {
          return '';
        }
      })
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
    if (subPaths) {
      md += `- **[서브페이지 동선 점검 (${subPaths})]**: 메인 화면에서 세부 페이지로 이동하는 흐름과 반응 속도가 자연스러운지\n`;
    }
  }
  md += `- **[PC·모바일 UI 및 개선 제안]**: 데스크톱과 모바일 브라우저 모두에서 레이아웃 깨짐이 없는지, 추가로 있었으면 하는 기능 아이디어`;

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

  let parsedBase;
  let domain = '';
  let origin = '';
  try {
    parsedBase = new URL(cleanUrl);
    domain = parsedBase.hostname.replace(/^www\./, '');
    origin = parsedBase.origin;
  } catch {
    domain = cleanUrl.replace(/^https?:\/\//, '').split('/')[0];
    origin = `https://${domain}`;
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
    crawledPages: [],
  };

  try {
    const desktopScreenshot = `https://image.thum.io/get/width/1280/crop/800/noanimate/${cleanUrl}`;
    const mobileScreenshot = `https://image.thum.io/get/width/480/crop/854/noanimate/${cleanUrl}`;
    result.screenshotUrl = desktopScreenshot;

    // =========================================================================
    // STAGE 1: Parallel Main Page Crawl (JS-Rendered Jina + Raw HTML + Sitemap)
    // =========================================================================
    const [jinaMain, rawHtmlRes, sitemapUrls] = await Promise.all([
      fetchJinaMarkdown(cleanUrl, 8500),
      fetchWithTimeout(
        cleanUrl,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          },
        },
        6000
      )
        .then(async (r) => (r.ok ? { html: await r.text(), headers: r.headers } : { html: '', headers: null }))
        .catch(() => ({ html: '', headers: null })),
      fetchTargetSitemapUrls(origin),
    ]);

    const rawHtml = rawHtmlRes.html || '';
    const responseHeaders = rawHtmlRes.headers || null;

    // Fallback Microlink only if both rawHtml & jinaMain failed
    let microlinkData = null;
    if (!jinaMain && (!rawHtml || rawHtml.length < 500)) {
      try {
        const mResp = await fetchWithTimeout(`https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}`, {}, 5000);
        if (mResp.ok) {
          const mJson = await mResp.json();
          if (mJson?.data) microlinkData = mJson.data;
        }
      } catch {}
    }

    // Extract Title & Description from HTML + Jina + Microlink
    let rawTitle = '';
    if (rawHtml) {
      const ogTitleMatch =
        rawHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
        rawHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
      const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      rawTitle = ogTitleMatch ? ogTitleMatch[1] : titleMatch ? titleMatch[1] : '';
    }
    if (!rawTitle && jinaMain?.title) rawTitle = jinaMain.title;
    if (!rawTitle && microlinkData?.title) rawTitle = microlinkData.title;

    const { title: parsedTitle, subtitle: parsedSubtitle } = parseTitleAndSubtitle(rawTitle);
    result.title = parsedTitle || microlinkData?.publisher || domain;

    let rawDesc = '';
    if (rawHtml) {
      const ogDescMatch =
        rawHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
        rawHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
      const metaDescMatch =
        rawHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
        rawHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
      rawDesc = ogDescMatch ? ogDescMatch[1] : metaDescMatch ? metaDescMatch[1] : '';
    }
    if (!rawDesc && microlinkData?.description) rawDesc = microlinkData.description;

    // Parse JSON-LD structured data if present in raw HTML
    const jsonLdInfos = [];
    if (rawHtml) {
      const ldMatches = [...rawHtml.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const ldm of ldMatches) {
        try {
          const obj = JSON.parse(ldm[1]);
          const items = Array.isArray(obj) ? obj : [obj];
          for (const it of items) {
            if (it?.applicationCategory) jsonLdInfos.push(`카테고리: ${it.applicationCategory}`);
            if (it?.operatingSystem) jsonLdInfos.push(`지원 OS: ${it.operatingSystem}`);
            if (it?.offers?.price !== undefined) {
              jsonLdInfos.push(Number(it.offers.price) === 0 ? '무료 제공' : `가격: ${it.offers.price} ${it.offers.priceCurrency || ''}`);
            }
            if (!rawDesc && it?.description) rawDesc = String(it.description);
          }
        } catch {}
      }
    }

    // Parse main page structured content (prefer Jina JS-rendered Markdown, augment with HTML!)
    let mainParsed = jinaMain?.markdown
      ? parseStructuredMarkdown(jinaMain.markdown, jinaMain.finalUrl || cleanUrl, result.title)
      : { url: cleanUrl, title: result.title, headings: [], paragraphs: [], bullets: [], sections: [], links: [], images: [], pricingLines: [], faqItems: [] };

    // Also mine raw HTML anchors, headings, social links, OG image & logo
    const htmlLinks = [];
    const discoveredImages = [];
    if (rawHtml) {
      const iconMatch = rawHtml.match(/<link[^>]+rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i);
      if (iconMatch?.[1]) result.logoUrl = resolveUrl(iconMatch[1], cleanUrl);

      const ogImgMatch =
        rawHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
        rawHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
        rawHtml.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
      if (ogImgMatch?.[1]) {
        const resolvedOg = resolveUrl(ogImgMatch[1], cleanUrl);
        if (resolvedOg && !resolvedOg.includes('favicon') && !resolvedOg.includes('.ico')) {
          discoveredImages.push(resolvedOg);
        }
      }

      // Extract all links from raw HTML (strip <script> blocks first so JS template literals like ${url} are never matched!)
      const htmlNoScripts = rawHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
      const aMatches = [...htmlNoScripts.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
      for (const am of aMatches) {
        const href = resolveUrl(am[1], cleanUrl);
        const txt = decodeHtmlEntities(am[2].replace(/<[^>]+>/g, '')).trim();
        if (href && !/(\$\{|%7b|%7d|\{|\})/i.test(href)) htmlLinks.push({ text: txt, url: href });
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

    // Also extract social links from Jina rendered links (for SPAs!)
    for (const lnk of mainParsed.links) {
      if (!result.socialLinks.github && /github\.com\/[^/]+\/[^/]+/i.test(lnk.url)) result.socialLinks.github = lnk.url;
      if (!result.socialLinks.twitter && /(twitter|x)\.com\//i.test(lnk.url)) result.socialLinks.twitter = lnk.url;
      if (!result.socialLinks.linkedin && /linkedin\.com\//i.test(lnk.url)) result.socialLinks.linkedin = lnk.url;
      if (!result.socialLinks.instagram && /instagram\.com\//i.test(lnk.url)) result.socialLinks.instagram = lnk.url;
      if (!result.socialLinks.youtube && /youtube\.com\//i.test(lnk.url)) result.socialLinks.youtube = lnk.url;
    }

    if (!result.logoUrl && microlinkData?.logo?.url) result.logoUrl = microlinkData.logo.url;
    if (!result.logoUrl) result.logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;

    result.crawledPages.push({ url: cleanUrl, title: result.title || '메인 페이지', type: 'main' });

    // =========================================================================
    // STAGE 2 & 3: Multi-Page Internal Subpage Crawling + External Site Crawling!
    // =========================================================================
    const allCandidateLinks = [...mainParsed.links, ...htmlLinks, ...sitemapUrls];
    let topSubpages = selectTopSubpages(allCandidateLinks, cleanUrl, 5);

    // Collect informative external linked sites (Docs, Notion, Blog, Disquiet, ProductHunt, Velog, Medium)
    const externalDocLinks = [];
    const seenExt = new Set();
    for (const lnk of [...mainParsed.links, ...htmlLinks]) {
      const u = lnk.url || '';
      if (!u || seenExt.has(u)) continue;
      if (/(notion\.site|gitbook\.io|velog\.io|medium\.com|brunch\.co\.kr|disquiet\.io|producthunt\.com|tistory\.com|docs\.)/i.test(u)) {
        seenExt.add(u);
        externalDocLinks.push(u);
        if (externalDocLinks.length >= 2) break;
      }
    }

    // Execute Stage 2 (subpages) + Stage 3 (GitHub + external docs + cross-site web search) IN PARALLEL!
    const [subpageCrawls, externalDocCrawls, githubInfo, webMentions] = await Promise.all([
      Promise.all(
        topSubpages.map(async (sp) => {
          const jinaSub = await fetchJinaMarkdown(sp.url, 6000);
          if (!jinaSub || !jinaSub.markdown || jinaSub.markdown.length < 120) return null;
          result.crawledPages.push({ url: sp.url, title: jinaSub.title || sp.label, type: 'subpage' });
          return parseStructuredMarkdown(jinaSub.markdown, sp.url, jinaSub.title || sp.label);
        })
      ),
      Promise.all(
        externalDocLinks.map(async (extUrl) => {
          const jinaExt = await fetchJinaMarkdown(extUrl, 5500);
          if (!jinaExt || !jinaExt.markdown || jinaExt.markdown.length < 120) return null;
          result.crawledPages.push({ url: extUrl, title: jinaExt.title || '외부 문서/블로그', type: 'external' });
          return parseStructuredMarkdown(jinaExt.markdown, extUrl, jinaExt.title || '외부 연동 사이트');
        })
      ),
      result.socialLinks.github ? crawlGitHubRepo(result.socialLinks.github) : Promise.resolve(null),
      fetchExternalWebMentions(domain, result.title),
    ]);

    const subpageResults = subpageCrawls.filter(Boolean);
    const externalSiteResults = externalDocCrawls.filter(Boolean);
    if (githubInfo) {
      result.crawledPages.push({ url: githubInfo.url, title: `GitHub: ${githubInfo.repoName}`, type: 'github' });
    }
    if (webMentions.length > 0) {
      result.crawledPages.push({ url: `search:${domain}`, title: `외부 웹 검색 레퍼런스 (${webMentions.length}건)`, type: 'web-search' });
    }

    // Refine tagline: prefer main subtitle -> landing subpage subtitle -> meta description -> first clean paragraph
    let landingSubTitle = '';
    for (const sr of subpageResults) {
      const parsedSr = parseTitleAndSubtitle(sr.title || '');
      if (parsedSr.subtitle && parsedSr.subtitle.length >= 6 && parsedSr.subtitle.length <= 65) {
        landingSubTitle = parsedSr.subtitle;
        break;
      }
    }
    result.tagline = cleanTagline(
      parsedSubtitle || landingSubTitle,
      rawDesc || subpageResults[0]?.paragraphs?.[0] || mainParsed.paragraphs[0] || githubInfo?.description || ''
    );

    // Build rich gallery (OG image + discovered real in-page images + Desktop/Mobile screenshots + Subpage capture)
    for (const page of [mainParsed, ...subpageResults]) {
      for (const im of page.images || []) {
        if (im.url && !discoveredImages.includes(im.url)) {
          discoveredImages.push(im.url);
          if (discoveredImages.length >= 3) break;
        }
      }
      if (discoveredImages.length >= 3) break;
    }

    const galleryPool = [
      ...discoveredImages.slice(0, 2),
      desktopScreenshot,
      mobileScreenshot,
    ];
    if (subpageResults[0]?.url) {
      galleryPool.push(`https://image.thum.io/get/width/1280/crop/800/noanimate/${subpageResults[0].url}`);
    }
    result.gallery = Array.from(new Set(galleryPool.filter(Boolean))).slice(0, 5);
    if (discoveredImages[0]) {
      result.screenshotUrl = discoveredImages[0];
    }

    // Infer Category using rich multi-page text (strip hosting TLDs like .pages.dev / .vercel.app!)
    const strippedHost = domain.replace(/\.(pages\.dev|vercel\.app|netlify\.app|web\.app|github\.io|fly\.dev|workers\.dev)$/i, '');
    const inferCorpus = [
      strippedHost,
      result.title,
      result.tagline,
      rawDesc,
      ...(mainParsed.headings || []).slice(0, 8),
      ...(mainParsed.paragraphs || []).slice(0, 4),
      ...subpageResults.flatMap((s) => (s.headings || []).slice(0, 4)),
      githubInfo?.description || '',
    ]
      .join(' ')
      .toLowerCase();

    if (/학교|학생|급식|시간표|공부|수능|학습|school|student|class|learn|study|edu/.test(inferCorpus)) {
      result.category = '교육 / 학습';
    } else if (/집안일|청소|가사|자취|루틴|습관|건강|운동|식단|다이어트|반려동물|health|fit|diet|lifestyle/.test(inferCorpus)) {
      result.category = '라이프스타일 / 건강';
    } else if (/\bai\b|gpt|llm|prompt|챗봇|인공지능|머신러닝|생성형|agent/.test(inferCorpus)) {
      result.category = 'AI';
    } else if (/\bdev\b|\bcode\b|github|\bapi\b|\bsdk\b|코딩|개발자|terminal|database|\bsql\b|editor|\bcli\b/.test(inferCorpus)) {
      result.category = '개발자 도구';
    } else if (/pay|crypto|stock|coin|money|주식|코인|선물|투자|가계부|금융|셀퍼럴|페이백/.test(inferCorpus)) {
      result.category = '금융 / 핀테크';
    } else if (/game|play|게임|퀴즈|엔터|music|음악|웹툰/.test(inferCorpus)) {
      result.category = '게임 / 엔터';
    } else if (/community|social|chat|커뮤니티|소통|친구|모임|feed|meet/.test(inferCorpus)) {
      result.category = '커뮤니티 / 소셜';
    } else {
      result.category = '생산성';
    }

    // Detect Tech Stack
    const techStack = detectTechStack(rawHtml, responseHeaders, githubInfo);

    // Generate Ultra-Detailed Multi-Page & Multi-Site Markdown Report!
    result.description = synthesizeUltraDetailedReport({
      title: result.title,
      tagline: result.tagline,
      rawDesc,
      domain,
      cleanUrl,
      category: result.category,
      mainParsed,
      subpageResults,
      externalSiteResults,
      githubInfo,
      webMentions,
      techStack,
      socialLinks: result.socialLinks,
      jsonLdInfos,
    });
    result.instructions = result.description;

    // Extract Relevant Tags
    const tagPool = [result.category];
    if (/코인|비트코인|선물|투자|crypto/i.test(inferCorpus)) tagPool.push('크립토', '핀테크', '트레이딩');
    if (/ai|gpt|llm|프롬프트|인공지능/i.test(inferCorpus)) tagPool.push('AI', '생성형AI', '자동화');
    if (/개발자|code|api|github|오픈소스/i.test(inferCorpus)) tagPool.push('개발자도구', '오픈소스');
    if (/집안일|루틴|습관|건강|생활/i.test(inferCorpus)) tagPool.push('라이프스타일', '루틴관리');
    if (/학교|학생|학습|교육/i.test(inferCorpus)) tagPool.push('에듀테크', '학습도구');
    techStack.slice(0, 2).forEach((t) => tagPool.push(t.replace(/\s*\(.*\)/, '')));
    tagPool.push('인디메이커', '웹서비스', 'SaaS');
    result.tags = Array.from(new Set(tagPool)).filter(Boolean).slice(0, 6);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Crawl handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
