import { Product, Feedback, Builder, CommunityPost, UserProfile, LeaderboardUser } from '../types';

// Curated active community makers as initial benchmark cohort
const BENCHMARK_MAKERS = [
  {
    name: '데몬마스터',
    avatar: '/demon-mascot.png',
    role: 'AI 리서처 & 1인 빌더',
    feedbackCount: 14,
    testedAppsCount: 8,
    launchedAppsCount: 2,
    upvotesReceived: 42,
    badge: '👑 수석 프로덕트 테스터',
    aiCommentary: '모바일·데스크톱 교차 검증 및 심층 UI 버그 제보로 메이커 제품 품질 개선에 결정적 기여',
  },
  {
    name: '테크메이커 민우',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=minwoo',
    role: '풀스택 SaaS 엔지니어',
    feedbackCount: 10,
    testedAppsCount: 6,
    launchedAppsCount: 2,
    upvotesReceived: 28,
    badge: '🚀 슈퍼 런치 메이커',
    aiCommentary: '실시간 번역 도구를 런칭하고 주간 최다 업보트를 기록하며 플랫폼 생태계 견인',
  },
  {
    name: '지우',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=jiwoo',
    role: 'AI 프로덕트 디자이너',
    feedbackCount: 8,
    testedAppsCount: 5,
    launchedAppsCount: 1,
    upvotesReceived: 19,
    badge: '💎 심층 피드백 장인',
    aiCommentary: '초기 런칭 서비스들에 상세한 사용성 분석 및 전환율 개선 아이디어를 구조화하여 제안',
  },
  {
    name: '알렉스',
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=alex',
    role: 'iOS / 모바일 빌더',
    feedbackCount: 7,
    testedAppsCount: 4,
    launchedAppsCount: 1,
    upvotesReceived: 15,
    badge: '🤖 버그 헌터 & QA',
    aiCommentary: '다양한 모바일 해상도에서 레이아웃 깨짐과 폼 유효성 검사 오류를 면밀히 분석 제보',
  },
  {
    name: '사이드코더 한솔',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=hansol',
    role: '인디 메이커',
    feedbackCount: 5,
    testedAppsCount: 4,
    launchedAppsCount: 0,
    upvotesReceived: 11,
    badge: '🔥 주간 라이징 스타',
    aiCommentary: '신규 등록 앱을 가장 신속하게 테스트하고 따뜻한 응원과 핵심 피드백을 전달',
  },
  {
    name: '디자인스튜디오 린',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lyn',
    role: 'UI/UX 디자이너',
    feedbackCount: 4,
    testedAppsCount: 3,
    launchedAppsCount: 0,
    upvotesReceived: 9,
    badge: '🎨 UX 감별사',
    aiCommentary: '디자인 시스템 일관성 및 타이포그래피 개선 제안으로 사용자 경험 고도화에 기여',
  },
];

// Helper to determine AI badge based on dynamic metrics
function determineAiBadge(fbCount: number, launchedCount: number, upvotes: number): string {
  if (fbCount >= 10) return '👑 수석 프로덕트 테스터';
  if (launchedCount >= 2 && upvotes >= 20) return '🚀 슈퍼 런치 메이커';
  if (fbCount >= 6) return '💎 심층 피드백 장인';
  if (launchedCount >= 1 && upvotes >= 5) return '🔥 프로덕트 챌린저';
  if (fbCount >= 3) return '🤖 정밀 버그 헌터';
  if (fbCount >= 1 && launchedCount >= 1) return '⚡ 올라운드 인디 메이커';
  if (fbCount >= 1) return '🧪 열정의 초기 테스터';
  if (launchedCount >= 1) return '💡 신규 서비스 런처';
  return '🌱 성장하는 뉴비 빌더';
}

// Helper to generate AI real-time commentary
function generateAiCommentary(name: string, fbCount: number, launchedCount: number, upvotes: number): string {
  const parts: string[] = [];
  if (fbCount > 0) {
    parts.push(`실전 테스트 피드백 ${fbCount}건을 작성하여 동료 메이커의 개선을 지원`);
  }
  if (launchedCount > 0) {
    parts.push(`직접 개발한 앱 ${launchedCount}개를 런칭`);
  }
  if (upvotes > 0) {
    parts.push(`커뮤니티 추천 ${upvotes}개를 획득하여 높은 호응을 얻음`);
  }
  if (parts.length === 0) {
    return '새롭게 demonst에 합류하여 활동을 시작한 유망 메이커';
  }
  return parts.join(' 및 ') + '함.';
}

export function computeAiLeaderboard(
  feedbacksRecord: Record<string, Feedback[]>,
  products: Product[],
  builders: Builder[],
  communityPosts: CommunityPost[],
  currentUser: UserProfile
): LeaderboardUser[] {
  // Aggregate feedback by author
  const feedbackStats: Record<string, { count: number; apps: Set<string>; avatar: string }> = {};

  Object.entries(feedbacksRecord).forEach(([productId, fbs]) => {
    (fbs || []).forEach((fb) => {
      const author = fb.author || '익명 테스터';
      if (!feedbackStats[author]) {
        feedbackStats[author] = { count: 0, apps: new Set(), avatar: fb.avatar || '/demon-mascot.png' };
      }
      feedbackStats[author].count += 1;
      feedbackStats[author].apps.add(productId);
      if (fb.avatar && fb.avatar !== '/demon-mascot.png') {
        feedbackStats[author].avatar = fb.avatar;
      }
    });
  });

  // Aggregate product launches and upvotes by author
  const productStats: Record<string, { count: number; upvotes: number; views: number }> = {};
  products.forEach((p) => {
    const author = p.author || '익명 메이커';
    if (!productStats[author]) {
      productStats[author] = { count: 0, upvotes: 0, views: 0 };
    }
    productStats[author].count += 1;
    productStats[author].upvotes += p.upvotes || 0;
    productStats[author].views += p.views || 0;
  });

  // Aggregate community posts by author
  const communityStats: Record<string, number> = {};
  communityPosts.forEach((cp) => {
    const author = cp.author || '';
    if (author) {
      communityStats[author] = (communityStats[author] || 0) + 1;
    }
  });

  // Map of all tracked users
  const makerMap = new Map<string, LeaderboardUser>();

  // 1. Seed benchmark cohort first
  BENCHMARK_MAKERS.forEach((bm) => {
    const aiScore =
      bm.feedbackCount * 120 +
      bm.testedAppsCount * 50 +
      bm.launchedAppsCount * 220 +
      bm.upvotesReceived * 45;

    makerMap.set(bm.name, {
      rank: 0,
      name: bm.name,
      avatar: bm.avatar,
      role: bm.role,
      feedbackCount: bm.feedbackCount,
      testedAppsCount: bm.testedAppsCount,
      launchedAppsCount: bm.launchedAppsCount,
      upvotesReceived: bm.upvotesReceived,
      badge: bm.badge,
      aiScore,
      aiCommentary: bm.aiCommentary,
    });
  });

  // 2. Overlay / insert registered builders
  builders.forEach((b) => {
    const fbInfo = feedbackStats[b.name] || { count: 0, apps: new Set(), avatar: b.avatar };
    const pInfo = productStats[b.name] || { count: 0, upvotes: 0, views: 0 };
    const cCount = communityStats[b.name] || 0;

    const fbCount = fbInfo.count;
    const testedCount = fbInfo.apps.size;
    const launchedCount = pInfo.count;
    const upvotes = pInfo.upvotes;

    const aiScore = fbCount * 120 + testedCount * 50 + launchedCount * 220 + upvotes * 45 + cCount * 30;

    // Only add if has activity or is an existing benchmark
    if (aiScore > 0 || makerMap.has(b.name)) {
      makerMap.set(b.name, {
        rank: 0,
        name: b.name,
        avatar: b.avatar || fbInfo.avatar || '/demon-mascot.png',
        role: b.role || '인디 메이커',
        feedbackCount: fbCount,
        testedAppsCount: testedCount,
        launchedAppsCount: launchedCount,
        upvotesReceived: upvotes,
        badge: determineAiBadge(fbCount, launchedCount, upvotes),
        aiScore: Math.max(aiScore, makerMap.get(b.name)?.aiScore || 0),
        aiCommentary: generateAiCommentary(b.name, fbCount, launchedCount, upvotes),
        builderId: b.id,
      });
    }
  });

  // 3. Overlay any feedback authors not in builders
  Object.entries(feedbackStats).forEach(([author, fbInfo]) => {
    if (!makerMap.has(author)) {
      const pInfo = productStats[author] || { count: 0, upvotes: 0, views: 0 };
      const cCount = communityStats[author] || 0;
      const fbCount = fbInfo.count;
      const testedCount = fbInfo.apps.size;
      const launchedCount = pInfo.count;
      const upvotes = pInfo.upvotes;

      const aiScore = fbCount * 120 + testedCount * 50 + launchedCount * 220 + upvotes * 45 + cCount * 30;

      makerMap.set(author, {
        rank: 0,
        name: author,
        avatar: fbInfo.avatar || '/demon-mascot.png',
        role: '앱 테스터',
        feedbackCount: fbCount,
        testedAppsCount: testedCount,
        launchedAppsCount: launchedCount,
        upvotesReceived: upvotes,
        badge: determineAiBadge(fbCount, launchedCount, upvotes),
        aiScore,
        aiCommentary: generateAiCommentary(author, fbCount, launchedCount, upvotes),
      });
    }
  });

  // 4. Ensure current user is included if logged in
  if (currentUser && currentUser.isLoggedIn && currentUser.name) {
    const existing = makerMap.get(currentUser.name);
    const fbInfo = feedbackStats[currentUser.name] || { count: 0, apps: new Set(), avatar: currentUser.avatar };
    const pInfo = productStats[currentUser.name] || { count: 0, upvotes: 0, views: 0 };
    const cCount = communityStats[currentUser.name] || 0;

    const fbCount = Math.max(existing?.feedbackCount || 0, fbInfo.count);
    const testedCount = Math.max(existing?.testedAppsCount || 0, fbInfo.apps.size);
    const launchedCount = Math.max(existing?.launchedAppsCount || 0, pInfo.count);
    const upvotes = Math.max(existing?.upvotesReceived || 0, pInfo.upvotes);

    const aiScore = Math.max(
      existing?.aiScore || 0,
      fbCount * 120 + testedCount * 50 + launchedCount * 220 + upvotes * 45 + cCount * 30
    );

    makerMap.set(currentUser.name, {
      rank: 0,
      name: currentUser.name,
      avatar: currentUser.avatar || '/demon-mascot.png',
      role: currentUser.role || '인디 메이커',
      feedbackCount: fbCount,
      testedAppsCount: testedCount,
      launchedAppsCount: launchedCount,
      upvotesReceived: upvotes,
      badge: determineAiBadge(fbCount, launchedCount, upvotes),
      aiScore,
      aiCommentary: generateAiCommentary(currentUser.name, fbCount, launchedCount, upvotes),
      builderId: currentUser.id,
    });
  }

  // Convert to array and sort by AI Score descending
  const list = Array.from(makerMap.values());
  list.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));

  // Assign ranks
  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
