import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vwtlhgqmndrshjcekhii.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_It2EcGB26YzpEj6vbZQ5-g_GorZe1C5';
const siteBaseUrl = 'https://demonst.vercel.app';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeImageUrl(url, baseUrl) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function generate() {
  console.log('🤖 Googlebot & Googlebot-Image 자동 크롤링용 sitemap.xml & image-sitemap.xml 생성 중...');

  let products = [];
  let builders = [];
  let feedbacks = [];

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const [pRes, bRes, fRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('builders').select('*'),
      supabase.from('feedbacks').select('*'),
    ]);
    if (Array.isArray(pRes?.data)) products = pRes.data;
    if (Array.isArray(bRes?.data)) builders = bRes.data;
    if (Array.isArray(fRes?.data)) feedbacks = fRes.data;
  } catch (err) {
    console.warn('Supabase fetch failed during sitemap generation, using local cache:', err?.message);
  }

  if (products.length === 0) {
    try {
      const localP = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/products.json'), 'utf8'));
      if (Array.isArray(localP)) products = localP;
    } catch {}
  }
  if (builders.length === 0) {
    try {
      const localB = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/builders_data.json'), 'utf8'));
      if (Array.isArray(localB)) builders = localB;
    } catch {}
  }

  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- 1. demonst 메인 홈 -->
  <url>
    <loc>${siteBaseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${siteBaseUrl}/demon-mascot.png</image:loc>
      <image:title>demonst - 10초 런치패드 &amp; 앱 테스팅 플랫폼</image:title>
      <image:caption>인디 메이커와 1인 개발자를 위한 사이드 프로젝트 피드백 &amp; 테스트 플랫폼</image:caption>
    </image:image>
    <image:image>
      <image:loc>${siteBaseUrl}/logo.png</image:loc>
      <image:title>demonst 공식 브랜드 로고</image:title>
    </image:image>
  </url>

  <!-- 2. 주요 탭 페이지 -->
  <url><loc>${siteBaseUrl}/?tab=test</loc><lastmod>${today}</lastmod><changefreq>hourly</changefreq><priority>0.95</priority></url>
  <url><loc>${siteBaseUrl}/?tab=builders</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${siteBaseUrl}/?tab=leaderboard</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.85</priority></url>
  <url><loc>${siteBaseUrl}/?tab=community</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.85</priority></url>
  <url><loc>${siteBaseUrl}/?tab=submit</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>
  <url><loc>${siteBaseUrl}/?tab=about</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
`;

  let imgXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${siteBaseUrl}/</loc>
    <image:image><image:loc>${siteBaseUrl}/demon-mascot.png</image:loc><image:title>demonst 공식 마스코트</image:title></image:image>
    <image:image><image:loc>${siteBaseUrl}/logo.png</image:loc><image:title>demonst 공식 로고</image:title></image:image>
    <image:image><image:loc>${siteBaseUrl}/logo-cropped.png</image:loc><image:title>demonst 크롭 로고</image:title></image:image>
    <image:image><image:loc>${siteBaseUrl}/icon-512.png</image:loc><image:title>demonst 아이콘 512px</image:title></image:image>
  </url>
`;

  let totalImages = 4;

  // 3. 등록된 프로젝트 + 아이콘 + 대표 스크린샷 + 전체 갤러리 + 피드백 캡처 이미지
  products.forEach((p) => {
    const pUrl = `${siteBaseUrl}/?product=${encodeURIComponent(p.id)}`;
    const seen = new Set();
    let imgBlock = '';

    const addImg = (rawUrl, title, caption) => {
      const u = normalizeImageUrl(rawUrl, siteBaseUrl);
      if (!u || seen.has(u)) return;
      seen.add(u);
      totalImages++;
      imgBlock += `    <image:image>
      <image:loc>${escapeXml(u)}</image:loc>
      <image:title>${escapeXml(title)}</image:title>${caption ? `\n      <image:caption>${escapeXml(caption)}</image:caption>` : ''}
    </image:image>
`;
    };

    addImg(p.screenshot, `${p.title} 대표 스크린샷`, p.tagline || p.title);
    addImg(p.icon, `${p.title} 로고 아이콘`, `${p.title} 로고`);
    if (Array.isArray(p.gallery)) {
      p.gallery.forEach((g, idx) => addImg(g, `${p.title} 갤러리 스크린샷 #${idx + 1}`, p.tagline || p.title));
    }
    feedbacks
      .filter((fb) => fb.product_id === p.id || fb.product_id === p.slug)
      .forEach((fb, idx) => {
        if (fb.screenshot) addImg(fb.screenshot, `${p.title} 테스터 피드백 캡처 #${idx + 1}`, fb.content?.slice(0, 100));
      });

    xml += `  <url>
    <loc>${escapeXml(pUrl)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.95</priority>
${imgBlock}  </url>
`;

    if (imgBlock) {
      imgXml += `  <url>
    <loc>${escapeXml(pUrl)}</loc>
${imgBlock}  </url>
`;
    }
  });

  // 4. 등록된 빌더 프로필 및 아바타 이미지
  builders.forEach((b) => {
    const bUrl = `${siteBaseUrl}/?builder=${encodeURIComponent(b.id)}`;
    const avatarUrl = normalizeImageUrl(b.avatar, siteBaseUrl);
    let imgBlock = '';
    if (avatarUrl) {
      totalImages++;
      imgBlock = `    <image:image>
      <image:loc>${escapeXml(avatarUrl)}</image:loc>
      <image:title>${escapeXml(b.name)} 빌더 프로필</image:title>
      <image:caption>${escapeXml(b.role || '인디 메이커')}</image:caption>
    </image:image>
`;
    }
    xml += `  <url>
    <loc>${escapeXml(bUrl)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
${imgBlock}  </url>
`;
    if (imgBlock) {
      imgXml += `  <url>
    <loc>${escapeXml(bUrl)}</loc>
${imgBlock}  </url>
`;
    }
  });

  // 5. 고트래픽 주요 검색어 랜딩 페이지 (60개 핵심 검색어)
  const popularKeywords = [
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
    '사이드프로젝트추천', '사이드프로젝트아이디어', '사이드프로젝트홍보', '베타테스터모집', '앱피드백',
    '무료홍보사이트', '스타트업홍보', '초기유저', '그로스해킹', 'AI에이전트',
  ];

  popularKeywords.forEach((kw) => {
    const kwUrl = `${siteBaseUrl}/?q=${encodeURIComponent(kw)}`;
    xml += `  <url>
    <loc>${escapeXml(kwUrl)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>
`;
  });

  xml += `</urlset>\n`;
  imgXml += `</urlset>\n`;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  const imgOutputPath = path.join(__dirname, '../public/image-sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  fs.writeFileSync(imgOutputPath, imgXml, 'utf8');
  console.log(`✅ sitemap.xml & image-sitemap.xml 생성 완료! (프로젝트: ${products.length}개, 빌더: ${builders.length}명, 이미지: ${totalImages}개)`);
}

generate().catch((err) => {
  console.error('Sitemap generation error:', err);
});
