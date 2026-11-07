import React, { useEffect } from 'react';
import { useApp } from '../AppContext';

export const SeoStructuredData: React.FC = () => {
  const { products, builders, selectedProduct } = useApp();

  useEffect(() => {
    // Dynamic document title update for SEO & Googlebot
    if (selectedProduct) {
      document.title = `${selectedProduct.title} — demonst 앱 테스트 & 런치패드`;
    } else {
      document.title = 'demonst — 인디 메이커 앱 테스트 & 런치패드';
    }
  }, [selectedProduct]);

  // Construct Googlebot Schema.org Structured Data
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      // 1. WebSite Schema
      {
        '@type': 'WebSite',
        '@id': 'https://demonst.vercel.app/#website',
        'url': 'https://demonst.vercel.app/',
        'name': 'demonst',
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
        'sameAs': [
          'https://twitter.com',
          'https://github.com',
        ],
      },
      // 3. Registered Projects (SoftwareApplication ItemList)
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
            'description': product.instructions || product.tagline,
            'applicationCategory': product.category || 'Productivity',
            'operatingSystem': 'Web, All',
            'url': product.url, // 프로젝트 실제 이동 URL (구글봇 크롤링 대상)
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
            'interactionStatistic': {
              '@type': 'InteractionCounter',
              'interactionType': 'https://schema.org/CommentAction',
              'userInteractionCount': product.feedbackCount || 0,
            },
          },
        })),
      },
      // 4. Registered Builders (Person ItemList)
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
