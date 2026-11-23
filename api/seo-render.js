// api/seo-render.js
// Server-Side Dynamic HTML Renderer for Search Engine Bots (Googlebot, Googlebot-Image, Bingbot, Yeti, Daumoa, Social Crawlers)
// Ensures 100% of live Supabase products, builders, feedbacks, community posts, 500 SEO topics,
// and EVERY SINGLE IMAGE (icons, screenshots, gallery, avatars, brand assets) are directly crawlable in raw HTML!

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vwtlhgqmndrshjcekhii.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_It2EcGB26YzpEj6vbZQ5-g_GorZe1C5';
const SITE_URL = 'https://demonst.vercel.app';

const CORE_TOPICS = [
  '사이드프로젝트', '인디메이커', '앱테스트', '베타테스터', '유저피드백',
  '서비스런칭', '1인개발자', 'SaaS', 'AI서비스', '무료앱홍보',
  '프로덕트헌트', '디스콰이엇', '스타트업MVP', '아이디어검증', '생산성도구',
  '마이크로SaaS', '웹앱배포', 'Nextjs', 'Supabase', 'React',
  '초기유저모으기', '사이드프로젝트모임', '런칭패드', '앱리뷰', '사용성테스트',
  '버그리포트', '1인창업', '부트스트래핑', '빌딩인퍼블릭', '개발자부업',
  '웹사이트홍보', '오픈베타', '랜딩페이지', 'ChatGPT앱', 'LLM',
  '토스페이먼츠', '개발자포트폴리오', 'PWA', '크로스플랫폼', 'demonst',
  '앱끌어올리기', '사이트끌어올리기', '무료홍보게시판', '인디해커', '린스타트업',
  'MVP검증', '베타테스트플랫폼', '웹서비스런칭', '솔로프러너', 'AI자동화',
];

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function mdToHtml(md) {
  if (!md) return '';
  return esc(md)
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

export default async function handler(req, res) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  let products = [];
  let builders = [];
  let feedbacks = [];
  let communityPosts = [];

  try {
    const [pRes, bRes, fRes, cRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('builders').select('*').order('updated_at', { ascending: false }),
      supabase.from('feedbacks').select('*').order('created_at', { ascending: false }),
      supabase.from('community_posts').select('*').order('created_at', { ascending: false }).then(r => r, () => ({ data: [] })),
    ]);

    if (Array.isArray(pRes?.data)) products = pRes.data;
    if (Array.isArray(bRes?.data)) builders = bRes.data;
    if (Array.isArray(fRes?.data)) feedbacks = fRes.data;
    if (Array.isArray(cRes?.data)) communityPosts = cRes.data;
  } catch (err) {
    console.warn('seo-render supabase warning:', err?.message);
  }

  const query = req.query || {};
  const productParam = query.product ? String(query.product) : '';
  const builderParam = query.builder ? String(query.builder) : '';
  const tabParam = query.tab ? String(query.tab) : '';
  const qParam = query.q ? String(query.q) : '';

  // Collect all unique images across the platform for Googlebot-Image
  const allImageObjects = [
    {
      url: `${SITE_URL}/demon-mascot.png`,
      name: 'demonst 공식 마스코트 로고',
      caption: '인디 메이커 앱 테스트 및 런치패드 demonst 공식 대표 이미지',
    },
    {
      url: `${SITE_URL}/logo.png`,
      name: 'demonst 브랜드 로고',
      caption: 'demonst 인디 메이커 런치패드 로고',
    },
  ];

  // Determine page-specific SEO metadata & main content
  let pageTitle = 'demonst — 인디 메이커 앱 테스트 & 10초 런치패드 | 사이드 프로젝트 피드백 플랫폼';
  let pageDesc = `링크 하나만 넣으면 10초 만에 사이드 프로젝트를 런칭하고, 실제 테스터와 인디 메이커에게 실시간 피드백과 업보트를 받는 무료 런치패드 demonst. 현재 ${products.length}개 프로젝트와 ${builders.length}명의 빌더가 활동 중입니다.`;
  let canonicalUrl = `${SITE_URL}/`;
  let ogImage = `${SITE_URL}/demon-mascot.png`;
  let ogType = 'website';
  let mainHtml = '';
  const structuredDataList = [];

  // 1. Specific Product Page (/?product=...)
  const targetProduct = productParam
    ? products.find((p) => p.id === productParam || p.slug === productParam)
    : null;

  if (targetProduct) {
    const pIcon = normalizeImageUrl(targetProduct.icon) || `${SITE_URL}/demon-mascot.png`;
    const pShot = normalizeImageUrl(targetProduct.screenshot);
    const pGallery = Array.isArray(targetProduct.gallery)
      ? targetProduct.gallery.map(normalizeImageUrl).filter(Boolean)
      : [];
    const pFeedbacks = feedbacks.filter((f) => f.product_id === targetProduct.id || f.product_id === targetProduct.slug);
    const uniqueImgs = Array.from(new Set([pShot, ...pGallery, pIcon].filter(Boolean)));

    pageTitle = `${targetProduct.title} — ${targetProduct.tagline || '사이드 프로젝트 앱 테스트'} | demonst`;
    pageDesc = `${targetProduct.title}: ${targetProduct.tagline || ''} (${targetProduct.category || '웹 서비스'}). 메이커 ${targetProduct.author || '인디 메이커'} 제작. demonst에서 실시간 앱 테스트, 스크린샷, 리뷰(${pFeedbacks.length}건) 및 피드백을 확인하세요.`;
    canonicalUrl = `${SITE_URL}/?product=${encodeURIComponent(targetProduct.id)}`;
    ogImage = pShot || pGallery[0] || pIcon;
    ogType = 'article';

    structuredDataList.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: targetProduct.title,
      description: targetProduct.tagline || targetProduct.description?.slice(0, 300),
      url: canonicalUrl,
      sameAs: targetProduct.url || undefined,
      applicationCategory: targetProduct.category || 'WebApplication',
      operatingSystem: 'Web, iOS, Android',
      image: uniqueImgs,
      author: {
        '@type': 'Person',
        name: targetProduct.author || '인디 메이커',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
      },
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: targetProduct.upvotes || 0,
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/ViewAction',
          userInteractionCount: targetProduct.views || 0,
        },
      ],
      review: pFeedbacks.map((fb) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: fb.author || '테스터' },
        reviewRating: { '@type': 'Rating', ratingValue: fb.rating || 5, bestRating: 5 },
        reviewBody: fb.content,
      })),
    });

    const galleryHtml = uniqueImgs
      .map(
        (imgUrl, i) => `
        <figure>
          <img src="${esc(imgUrl)}" alt="${esc(targetProduct.title)} 화면 스크린샷 및 미리보기 #${i + 1}" title="${esc(targetProduct.title)} - ${esc(targetProduct.tagline)}" loading="eager" />
          <figcaption>${esc(targetProduct.title)} 실제 서비스 이미지 #${i + 1}</figcaption>
        </figure>`
      )
      .join('');

    const fbHtml = pFeedbacks
      .map((fb) => {
        const fbImg = normalizeImageUrl(fb.screenshot);
        return `
          <article>
            <h4>${esc(fb.author)} (평점 ${fb.rating || 5}/5 · ${esc(fb.device_info || 'Web')})</h4>
            <p>${esc(fb.content)}</p>
            ${fbImg ? `<figure><img src="${esc(fbImg)}" alt="${esc(targetProduct.title)} 테스터 ${esc(fb.author)} 리뷰 스크린샷" loading="eager" /></figure>` : ''}
          </article>`;
      })
      .join('');

    mainHtml = `
      <article itemscope itemtype="https://schema.org/SoftwareApplication">
        <header>
          <img src="${esc(pIcon)}" alt="${esc(targetProduct.title)} 앱 로고 아이콘" width="80" height="80" />
          <h1 itemprop="name">${esc(targetProduct.title)}</h1>
          <p itemprop="description">${esc(targetProduct.tagline)}</p>
          <p>카테고리: ${esc(targetProduct.category || '생산성')} | 메이커: ${esc(targetProduct.author || '인디 메이커')} | 업보트: ${targetProduct.upvotes || 0} | 조회수: ${targetProduct.views || 0}</p>
          ${targetProduct.url ? `<p><a href="${esc(targetProduct.url)}" rel="noopener noreferrer">공식 웹사이트 방문하기 (${esc(targetProduct.url)})</a></p>` : ''}
        </header>
        <section>
          <h2>서비스 스크린샷 및 갤러리 이미지</h2>
          ${galleryHtml}
        </section>
        <section>
          <h2>상세 소개 및 테스트 가이드</h2>
          <div><p>${mdToHtml(targetProduct.description || targetProduct.instructions || '')}</p></div>
        </section>
        <section>
          <h2>테스터 피드백 및 리뷰 (${pFeedbacks.length}건)</h2>
          ${fbHtml || '<p>아직 등록된 피드백이 없습니다. 첫 번째 테스터가 되어주세요!</p>'}
        </section>
      </article>
    `;
  } else if (builderParam) {
    // 2. Specific Builder Page (/?builder=...)
    const targetBuilder = builders.find((b) => b.id === builderParam);
    if (targetBuilder) {
      const bAvatar = normalizeImageUrl(targetBuilder.avatar) || `${SITE_URL}/demon-mascot.png`;
      const bProducts = products.filter((p) => p.author_id === targetBuilder.id || p.author === targetBuilder.name);

      pageTitle = `${targetBuilder.name} (${targetBuilder.role || '인디 메이커'}) 빌더 프로필 | demonst`;
      pageDesc = `${targetBuilder.name}: ${targetBuilder.bio || 'demonst에서 활동 중인 인디 메이커입니다.'} 제작 중인 프로젝트와 활동 내역을 확인하고 1:1 DM으로 소통해보세요.`;
      canonicalUrl = `${SITE_URL}/?builder=${encodeURIComponent(targetBuilder.id)}`;
      ogImage = bAvatar;
      ogType = 'profile';

      structuredDataList.push({
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
          '@type': 'Person',
          name: targetBuilder.name,
          jobTitle: targetBuilder.role || '인디 메이커',
          description: targetBuilder.bio || '',
          image: bAvatar,
          url: canonicalUrl,
          sameAs: [targetBuilder.website, targetBuilder.github, targetBuilder.twitter].filter(Boolean),
        },
      });

      mainHtml = `
        <article itemscope itemtype="https://schema.org/Person">
          <figure>
            <img src="${esc(bAvatar)}" alt="${esc(targetBuilder.name)} 빌더 프로필 사진" width="120" height="120" />
            <figcaption>${esc(targetBuilder.name)} (${esc(targetBuilder.role || '인디 메이커')})</figcaption>
          </figure>
          <h1 itemprop="name">${esc(targetBuilder.name)}</h1>
          <p itemprop="jobTitle">${esc(targetBuilder.role || '인디 메이커')}</p>
          <p itemprop="description">${esc(targetBuilder.bio || '')}</p>
          ${Array.isArray(targetBuilder.tags) ? `<p>전문 태그: ${targetBuilder.tags.map(esc).join(', ')}</p>` : ''}
          <section>
            <h2>${esc(targetBuilder.name)} 님이 만든 사이드 프로젝트 (${bProducts.length}개)</h2>
            <ul>
              ${bProducts.map((p) => `<li><a href="${SITE_URL}/?product=${encodeURIComponent(p.id)}">${esc(p.title)} - ${esc(p.tagline)}</a></li>`).join('')}
            </ul>
          </section>
        </article>
      `;
    }
  } else if (qParam) {
    // 3. SEO Topic Search Landing Page (/?q=...)
    const ql = qParam.toLowerCase();
    const matched = products.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(ql) ||
        (p.tagline || '').toLowerCase().includes(ql) ||
        (p.category || '').toLowerCase().includes(ql) ||
        (p.description || '').toLowerCase().includes(ql) ||
        (Array.isArray(p.tags) && p.tags.some((t) => String(t).toLowerCase().includes(ql)))
    );
    const displayList = matched.length > 0 ? matched : products;

    pageTitle = `"${qParam}" 관련 사이드 프로젝트 · 앱 테스트 · 인디 메이커 | demonst`;
    pageDesc = `demonst에서 "${qParam}" 키워드와 관련된 최신 사이드 프로젝트, 베타 앱 테스트, 인디 메이커 런치패드 서비스를 무료로 탐색하고 피드백을 주고받으세요.`;
    canonicalUrl = `${SITE_URL}/?q=${encodeURIComponent(qParam)}`;

    mainHtml = `
      <section>
        <h1>#${esc(qParam)} — 사이드 프로젝트 &amp; 인디 메이커 탐색</h1>
        <p>${esc(pageDesc)}</p>
        <h2>추천 사이드 프로젝트 목록 (${displayList.length}개)</h2>
        ${displayList
          .map((p) => {
            const shot = normalizeImageUrl(p.screenshot) || normalizeImageUrl(p.icon);
            return `
              <article>
                <h3><a href="${SITE_URL}/?product=${encodeURIComponent(p.id)}">${esc(p.title)}</a></h3>
                <p>${esc(p.tagline)} (${esc(p.category || '웹 서비스')})</p>
                ${shot ? `<img src="${esc(shot)}" alt="${esc(p.title)} - ${esc(qParam)} 관련 서비스 스크린샷" />` : ''}
              </article>`;
          })
          .join('')}
      </section>
    `;
  }

  // Default / Full Site Directory HTML (always includes ALL live products, images, builders, community posts & topics!)
  const allProductsHtml = products
    .map((p) => {
      const pIcon = normalizeImageUrl(p.icon) || `${SITE_URL}/demon-mascot.png`;
      const pShot = normalizeImageUrl(p.screenshot);
      const pGallery = Array.isArray(p.gallery) ? p.gallery.map(normalizeImageUrl).filter(Boolean) : [];
      const imgs = Array.from(new Set([pShot, ...pGallery, pIcon].filter(Boolean)));
      imgs.forEach((u, idx) => {
        allImageObjects.push({
          url: u,
          name: `${p.title} 이미지 ${idx + 1}`,
          caption: p.tagline || p.title,
        });
      });

      const pFeedbacks = feedbacks.filter((f) => f.product_id === p.id || f.product_id === p.slug);
      pFeedbacks.forEach((fb) => {
        const fbImg = normalizeImageUrl(fb.screenshot);
        if (fbImg) {
          allImageObjects.push({
            url: fbImg,
            name: `${p.title} 테스터 ${fb.author} 리뷰 스크린샷`,
            caption: fb.content?.slice(0, 120) || p.title,
          });
        }
      });

      return `
        <article itemscope itemtype="https://schema.org/SoftwareApplication">
          <h3><a href="${SITE_URL}/?product=${encodeURIComponent(p.id)}" itemprop="url"><span itemprop="name">${esc(p.title)}</span></a></h3>
          <p itemprop="description">${esc(p.tagline)} — 카테고리: ${esc(p.category || '생산성')} · 메이커: ${esc(p.author || '인디 메이커')} · 업보트: ${p.upvotes || 0} · 피드백: ${pFeedbacks.length}건</p>
          <div>
            ${imgs.map((imgUrl, i) => `<img src="${esc(imgUrl)}" alt="${esc(p.title)} 스크린샷 ${i + 1} - ${esc(p.tagline)}" loading="eager" />`).join('')}
          </div>
          <p>${esc((p.description || p.instructions || '').slice(0, 450))}</p>
        </article>`;
    })
    .join('');

  const allBuildersHtml = builders
    .map((b) => {
      const bAvatar = normalizeImageUrl(b.avatar) || `${SITE_URL}/demon-mascot.png`;
      allImageObjects.push({
        url: bAvatar,
        name: `${b.name} 빌더 프로필 아바타`,
        caption: `${b.name} - ${b.role || '인디 메이커'}`,
      });
      return `
        <li>
          <a href="${SITE_URL}/?builder=${encodeURIComponent(b.id)}">
            <img src="${esc(bAvatar)}" alt="${esc(b.name)} 인디 메이커 프로필" width="48" height="48" />
            <strong>${esc(b.name)}</strong> (${esc(b.role || '인디 메이커')}) — ${esc(b.bio || '')}
          </a>
        </li>`;
    })
    .join('');

  const allCommunityHtml = communityPosts
    .map(
      (c) => `
      <article>
        <h3>[${esc(c.tag || '잡담')}] ${esc(c.title)}</h3>
        <p>작성자: ${esc(c.author || '메이커')} · 추천 ${c.likes || 0}</p>
        <p>${esc(c.content || '')}</p>
      </article>`
    )
    .join('');

  // Tab-specific titles
  if (!mainHtml && tabParam) {
    canonicalUrl = `${SITE_URL}/?tab=${encodeURIComponent(tabParam)}`;
    if (tabParam === 'builders') {
      pageTitle = `인디 메이커 & 빌더 디렉토리 (${builders.length}명) | demonst`;
      pageDesc = `demonst에서 활동 중인 ${builders.length}명의 인디 메이커, 1인 개발자, 스타트업 빌더 프로필을 만나보고 1:1 DM으로 네트워킹하세요.`;
    } else if (tabParam === 'leaderboard') {
      pageTitle = '인디 메이커 & 베타 테스터 리더보드 랭킹 | demonst';
      pageDesc = '가장 활발하게 사이드 프로젝트를 런칭하고 양질의 테스트 피드백을 남긴 Top 빌더와 테스터 랭킹을 확인하세요.';
    } else if (tabParam === 'community') {
      pageTitle = '인디 메이커 & 사이드 프로젝트 커뮤니티 | demonst';
      pageDesc = '사이드 프로젝트 런칭 소식, 개발 팁, MVP 검증 노하우, 질문을 인디 메이커들과 자유롭게 공유하는 커뮤니티입니다.';
    } else if (tabParam === 'submit') {
      pageTitle = '10초 만에 내 앱 무료 등록하기 — AI 자동 분석 런치패드 | demonst';
      pageDesc = '웹사이트 링크만 입력하면 AI가 여러 페이지를 자동 탐색해 스크린샷, 로고, 상세 마크다운 소개를 자동 생성하고 무료로 런칭해드립니다.';
    } else if (tabParam === 'about') {
      pageTitle = 'demonst 서비스 소개 & 500개 인기 탐색 토픽 | 인디 메이커 런치패드';
      pageDesc = 'demonst는 인디 메이커와 1인 개발자가 사이드 프로젝트를 10초 만에 등록하고 실제 테스터 피드백을 받는 100% 무료 플랫폼입니다.';
    }
  }

  // Deduplicate image objects
  const seenImgUrls = new Set();
  const dedupedImages = allImageObjects.filter((img) => {
    if (!img.url || seenImgUrls.has(img.url)) return false;
    seenImgUrls.add(img.url);
    return true;
  });

  // Always include WebSite + Organization + ImageGallery JSON-LD
  structuredDataList.push(
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'demonst',
      alternateName: ['데몬스트', 'demonst 런치패드', 'demonst 앱 테스트'],
      url: SITE_URL,
      description: pageDesc,
      inLanguage: 'ko-KR',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'demonst',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/demon-mascot.png`,
        width: 512,
        height: 512,
      },
      email: 'demonst1004@gmail.com',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'demonst 실시간 등록 사이드 프로젝트 목록',
      numberOfItems: products.length,
      itemListElement: products.map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE_URL}/?product=${encodeURIComponent(p.id)}`,
        name: p.title,
        image: normalizeImageUrl(p.screenshot) || normalizeImageUrl(p.icon) || `${SITE_URL}/demon-mascot.png`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ImageGallery',
      name: 'demonst 앱 스크린샷 및 인디 메이커 이미지 갤러리',
      associatedMedia: dedupedImages.slice(0, 60).map((img) => ({
        '@type': 'ImageObject',
        contentUrl: img.url,
        url: img.url,
        name: img.name,
        caption: img.caption,
      })),
    }
  );

  const jsonLdScript = structuredDataList
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join('\n  ');

  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(pageDesc)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="google-site-verification" content="iZ6VZNowD0Vd0tA5xgO_Djd5W5j0domZLYzSkZ4ZN84" />
  <link rel="canonical" href="${esc(canonicalUrl)}" />
  <link rel="alternate" type="application/rss+xml" title="demonst 최신 사이드 프로젝트 피드" href="${SITE_URL}/feed.xml" />
  <link rel="sitemap" type="application/xml" title="Sitemap" href="${SITE_URL}/sitemap.xml" />

  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="demonst" />
  <meta property="og:title" content="${esc(pageTitle)}" />
  <meta property="og:description" content="${esc(pageDesc)}" />
  <meta property="og:url" content="${esc(canonicalUrl)}" />
  <meta property="og:image" content="${esc(ogImage)}" />
  <meta property="og:locale" content="ko_KR" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(pageTitle)}" />
  <meta name="twitter:description" content="${esc(pageDesc)}" />
  <meta name="twitter:image" content="${esc(ogImage)}" />

  ${jsonLdScript}
</head>
<body>
  <header>
    <a href="${SITE_URL}/">
      <img src="${SITE_URL}/demon-mascot.png" alt="demonst 인디 메이커 런치패드 마스코트 로고" width="64" height="64" />
      <strong>demonst</strong>
    </a>
    <nav aria-label="주 메뉴">
      <a href="${SITE_URL}/">테스터를 기다리는 앱</a> |
      <a href="${SITE_URL}/?tab=builders">빌더 디렉토리 (${builders.length}명)</a> |
      <a href="${SITE_URL}/?tab=leaderboard">리더보드</a> |
      <a href="${SITE_URL}/?tab=community">커뮤니티</a> |
      <a href="${SITE_URL}/?tab=submit">내 앱 10초 등록하기</a> |
      <a href="${SITE_URL}/?tab=about">demonst 소개</a> |
      <a href="${SITE_URL}/sitemap.xml">사이트맵</a> |
      <a href="${SITE_URL}/image-sitemap.xml">이미지 사이트맵</a> |
      <a href="${SITE_URL}/feed.xml">RSS 피드</a>
    </nav>
  </header>

  <main>
    ${mainHtml || `<h1>demonst — 인디 메이커 앱 테스트 &amp; 10초 런치패드</h1><p>${esc(pageDesc)}</p>`}

    <section id="live-products">
      <h2>🔥 실시간 등록된 사이드 프로젝트 &amp; 베타 앱 (${products.length}개)</h2>
      ${allProductsHtml}
    </section>

    <section id="live-builders">
      <h2>👨‍💻 활동 중인 인디 메이커 &amp; 빌더 (${builders.length}명)</h2>
      <ul>${allBuildersHtml}</ul>
    </section>

    ${
      communityPosts.length > 0
        ? `<section id="live-community"><h2>💬 최신 인디 메이커 커뮤니티 게시글</h2>${allCommunityHtml}</section>`
        : ''
    }

    <section id="seo-topics">
      <h2>🔍 인기 탐색 토픽</h2>
      <p>
        ${CORE_TOPICS.map((kw) => `<a href="${SITE_URL}/?q=${encodeURIComponent(kw)}">#${esc(kw)}</a>`).join(' · ')}
      </p>
    </section>
  </main>

  <footer>
    <p>© 2026 demonst — 인디 메이커 앱 테스트 &amp; 10초 런치패드 (문의: demonst1004@gmail.com)</p>
  </footer>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  return res.status(200).send(html);
}
