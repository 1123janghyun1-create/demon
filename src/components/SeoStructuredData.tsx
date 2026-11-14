import React, { useEffect } from 'react';
import { useApp } from '../AppContext';

export const SeoStructuredData: React.FC = () => {
  const { products, builders, selectedProduct, currentTab } = useApp();

  useEffect(() => {
    // Helper to safely set meta tag content
    const setMetaTag = (selector: string, attr: 'content' | 'href', value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        if (selector.startsWith('meta[')) {
          el = document.createElement('meta');
          const matchProp = selector.match(/property="([^"]+)"/);
          const matchName = selector.match(/name="([^"]+)"/);
          if (matchProp) el.setAttribute('property', matchProp[1]);
          if (matchName) el.setAttribute('name', matchName[1]);
          document.head.appendChild(el);
        } else if (selector.startsWith('link[')) {
          el = document.createElement('link');
          const matchRel = selector.match(/rel="([^"]+)"/);
          if (matchRel) el.setAttribute('rel', matchRel[1]);
          document.head.appendChild(el);
        }
      }
      if (el) {
        el.setAttribute(attr, value);
      }
    };

    let title = 'demonst — 인디 메이커 앱 테스트 & 런치패드';
    let description = '사이드 프로젝트와 인디 메이커를 위한 앱 테스트 & 10초 런치패드 플랫폼. 지금 서비스를 등록하고 실제 테스터들의 피드백을 모으세요.';
    let ogImage = 'https://demonst.vercel.app/demon-mascot.png';
    let canonicalUrl = 'https://demonst.vercel.app/';

    if (selectedProduct) {
      title = `${selectedProduct.title} — ${selectedProduct.tagline} | demonst`;
      description = `${selectedProduct.title}: ${selectedProduct.tagline}. ${
        selectedProduct.description ? selectedProduct.description.slice(0, 140) : 'demonst에서 실제 사용자 피드백을 확인하고 앱을 직접 테스트해보세요.'
      }`;
      ogImage = selectedProduct.screenshot || selectedProduct.icon || ogImage;
      canonicalUrl = `https://demonst.vercel.app/?product=${selectedProduct.id}`;
    } else {
      switch (currentTab) {
        case 'builders':
          title = '빌더 (Builders) — demonst 인디 메이커 & 개발자 커뮤니티';
          description = 'demonst에서 활동 중인 실제 인디 메이커, 1인 개발자, 디자이너들을 만나고 1:1 실시간 대화와 네트워킹을 나눠보세요.';
          canonicalUrl = 'https://demonst.vercel.app/?tab=builders';
          break;
        case 'leaderboard':
          title = '리더보드 (Leaderboard) — demonst AI 선정 탑 메이커 & 우수 테스터 랭킹';
          description = '실제 피드백 기여도와 런칭 활동을 AI가 실시간 분석하여 선정한 demonst 인디 메이커 종합 명예의 전당입니다.';
          canonicalUrl = 'https://demonst.vercel.app/?tab=leaderboard';
          break;
        case 'submit':
          title = '앱 등록 & 런치패드 — AI 웹사이트 심층 분석 & 초기 테스터 모집 | demonst';
          description = '링크만 넣으면 AI가 사이트맵과 뷰포트를 자동 캡처하고 분석합니다. 10초 만에 사이드 프로젝트를 런칭하고 테스터를 모집하세요.';
          canonicalUrl = 'https://demonst.vercel.app/?tab=submit';
          break;
        case 'community':
          title = '커뮤니티 (Community) — 인디 메이커 런치 & 피드백 토론장 | demonst';
          description = '사이드 프로젝트 빌딩 스토리, 런칭 소식, 개발 팁과 질문을 나누는 인디 메이커 공식 커뮤니티입니다.';
          canonicalUrl = 'https://demonst.vercel.app/?tab=community';
          break;
        case 'about':
          title = 'demonst 소개 — 사이드 프로젝트를 위한 가장 빠른 10초 런치패드';
          description = '왜 demonst인가? 인디 메이커와 1인 개발자가 초기 사용자를 만나고 진솔한 피드백을 얻을 수 있는 무료 런치패드입니다.';
          canonicalUrl = 'https://demonst.vercel.app/?tab=about';
          break;
        default:
          title = 'demonst — 인디 메이커 앱 테스트 & 런치패드';
          canonicalUrl = 'https://demonst.vercel.app/';
          break;
      }
    }

    // Apply Dynamic Meta Tags
    document.title = title;
    setMetaTag('meta[name="description"]', 'content', description);
    setMetaTag('meta[property="og:title"]', 'content', title);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[property="og:image"]', 'content', ogImage);
    setMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    setMetaTag('meta[name="twitter:title"]', 'content', title);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
    setMetaTag('meta[name="twitter:image"]', 'content', ogImage);
    setMetaTag('link[rel="canonical"]', 'href', canonicalUrl);
  }, [selectedProduct, currentTab]);

  // Construct High-Impact Googlebot Schema.org Structured Data
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      // 1. WebSite Schema
      {
        '@type': 'WebSite',
        '@id': 'https://demonst.vercel.app/#website',
        'url': 'https://demonst.vercel.app/',
        'name': 'demonst',
        'alternateName': ['데몬스트', 'Demonst', 'demonst.vercel.app'],
        'description': '사이드 프로젝트와 인디 메이커를 위한 앱 테스트 & 런치패드 플랫폼',
        'inLanguage': 'ko-KR',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://demonst.vercel.app/?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      // 2. Organization Schema
      {
        '@type': 'Organization',
        '@id': 'https://demonst.vercel.app/#organization',
        'name': 'demonst',
        'url': 'https://demonst.vercel.app/',
        'logo': 'https://demonst.vercel.app/demon-mascot.png',
        'email': 'demonst1004@gmail.com',
        'sameAs': [
          'https://twitter.com',
          'https://github.com',
        ],
      },
      // 3. Site Navigation Element
      {
        '@type': 'SiteNavigationElement',
        '@id': 'https://demonst.vercel.app/#navigation',
        'name': [
          '앱 & 도구',
          '빌더',
          '리더보드',
          '앱 등록',
          '커뮤니티',
          'demonst 소개',
        ],
        'url': [
          'https://demonst.vercel.app/?tab=test',
          'https://demonst.vercel.app/?tab=builders',
          'https://demonst.vercel.app/?tab=leaderboard',
          'https://demonst.vercel.app/?tab=submit',
          'https://demonst.vercel.app/?tab=community',
          'https://demonst.vercel.app/?tab=about',
        ],
      },
      // 4. BreadcrumbList Schema
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://demonst.vercel.app/#breadcrumb',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': '홈',
            'item': 'https://demonst.vercel.app/',
          },
          ...(selectedProduct
            ? [
                {
                  '@type': 'ListItem',
                  'position': 2,
                  'name': selectedProduct.category || '앱 & 도구',
                  'item': `https://demonst.vercel.app/?tab=test`,
                },
                {
                  '@type': 'ListItem',
                  'position': 3,
                  'name': selectedProduct.title,
                  'item': `https://demonst.vercel.app/?product=${selectedProduct.id}`,
                },
              ]
            : [
                {
                  '@type': 'ListItem',
                  'position': 2,
                  'name': currentTab === 'builders' ? '빌더' : currentTab === 'leaderboard' ? '리더보드' : currentTab === 'submit' ? '앱 등록' : currentTab === 'community' ? '커뮤니티' : '앱 & 도구',
                  'item': `https://demonst.vercel.app/?tab=${currentTab}`,
                },
              ]),
        ],
      },
      // 5. Frequently Asked Questions (FAQPage) Schema — Boosts Google Search SERP Rich Snippets!
      {
        '@type': 'FAQPage',
        '@id': 'https://demonst.vercel.app/#faq',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'demonst는 어떤 플랫폼인가요?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'demonst는 사이드 프로젝트와 인디 메이커를 위한 앱 테스트 & 10초 런치패드 플랫폼입니다. 누구나 무료로 웹앱을 등록하고 초기 테스터들로부터 진솔한 피드백을 수집할 수 있습니다.',
            },
          },
          {
            '@type': 'Question',
            'name': '사이드 프로젝트 등록 비용은 얼마인가요?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'demonst에서 프로젝트 등록, AI 웹사이트 분석 및 뷰포트 캡처, 테스터 모집은 100% 무료로 평생 지원됩니다.',
            },
          },
          {
            '@type': 'Question',
            'name': '테스터 피드백을 남기면 어떤 혜택이 있나요?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': '피드백을 작성하면 AI 리더보드에 기여도가 자동 반영되어 우수 테스터 명예의 전당에 등재되며, 제작자와의 1:1 실시간 DM 네트워킹을 나눌 수 있습니다.',
            },
          },
        ],
      },
      // 6. Registered Projects (SoftwareApplication ItemList with Rich AggregateRating)
      {
        '@type': 'ItemList',
        '@id': 'https://demonst.vercel.app/#products',
        'name': 'demonst에 등록된 사이드 프로젝트 및 앱 목록',
        'numberOfItems': products.length,
        'itemListElement': products.map((product, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'item': {
            '@type': 'SoftwareApplication',
            '@id': `https://demonst.vercel.app/?product=${product.id}#software`,
            'name': product.title,
            'headline': product.tagline,
            'description': product.description || product.instructions || product.tagline,
            'applicationCategory': product.category || 'Productivity',
            'operatingSystem': 'Web, iOS, Android, Windows, macOS',
            'url': product.url,
            'image': [
              product.icon,
              product.screenshot,
            ].filter(Boolean),
            'author': {
              '@type': 'Person',
              'name': product.author || '인디 메이커',
            },
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'KRW',
            },
            'aggregateRating': {
              '@type': 'AggregateRating',
              'ratingValue': '5.0',
              'reviewCount': Math.max(1, product.feedbackCount || 1),
              'bestRating': '5',
              'worstRating': '1',
            },
            'interactionStatistic': [
              {
                '@type': 'InteractionCounter',
                'interactionType': 'https://schema.org/CommentAction',
                'userInteractionCount': product.feedbackCount || 0,
              },
              {
                '@type': 'InteractionCounter',
                'interactionType': 'https://schema.org/LikeAction',
                'userInteractionCount': product.upvotes || 0,
              },
            ],
          },
        })),
      },
      // 7. Registered Builders (Person ItemList)
      {
        '@type': 'ItemList',
        '@id': 'https://demonst.vercel.app/#builders',
        'name': 'demonst 인디 빌더 & 메이커 프로필',
        'numberOfItems': builders.length,
        'itemListElement': builders.map((builder, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'item': {
            '@type': 'Person',
            '@id': `https://demonst.vercel.app/?builder=${builder.id}#builder`,
            'name': builder.name,
            'jobTitle': builder.role || '인디 메이커',
            'description': builder.bio,
            'image': builder.avatar || 'https://demonst.vercel.app/demon-mascot.png',
            'url': builder.website || `https://demonst.vercel.app/?builder=${builder.id}`,
            'sameAs': [
              builder.website,
              builder.github,
              builder.twitter,
            ].filter(Boolean),
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};
