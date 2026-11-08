import { Product, Feedback, Builder, CommunityPost, UserProfile, LeaderboardUser } from '../types';

// Helper to determine AI badge based on real platform metrics
function determineAiBadge(fbCount: number, launchedCount: number, upvotes: number, communityCount: number): string {
  if (launchedCount >= 2 && upvotes >= 30) return '🚀 슈퍼 런치 메이커';
  if (launchedCount >= 1 && upvotes >= 20) return '🔥 인기 프로덕트 런처';
  if (fbCount >= 5) return '💎 심층 피드백 장인';
  if (fbCount >= 3) return '🤖 정밀 버그 헌터';
  if (launchedCount >= 1 && fbCount >= 1) return '⚡ 올라운드 인디 메이커';
  if (launchedCount >= 1) return '💡 신규 프로덕트 런처';
  if (fbCount >= 1) return '🧪 열정의 초기 테스터';
  if (communityCount >= 1) return '💬 커뮤니티 활동가';
  return '🌱 demonst 공식 빌더';
}

// Helper to generate AI real-time commentary based on actual activity
function generateAiCommentary(
  name: string,
  fbCount: number,
  launchedCount: number,
  upvotes: number,
  launchedAppTitles: string[]
): string {
  const parts: string[] = [];

  if (launchedCount > 0) {
    const titlesStr = launchedAppTitles.slice(0, 2).map((t) => `'${t}'`).join(', ');
    const extraCount = launchedAppTitles.length > 2 ? ` 외 ${launchedAppTitles.length - 2}개` : '';
    if (upvotes > 0) {
      parts.push(`직접 개발한 ${titlesStr}${extraCount} 앱을 런칭하고 커뮤니티 추천 ${upvotes}개를 획득함`);
    } else {
      parts.push(`직접 개발한 ${titlesStr}${extraCount} 프로젝트를 성공적으로 런칭함`);
    }
  }

  if (fbCount > 0) {
    parts.push(`동료 메이커의 프로덕트에 실전 테스트 피드백 ${fbCount}건을 기여함`);
  }

  if (parts.length === 0) {
    return 'demonst에 정식 가입하여 첫 프로젝트 런칭 및 테스트 활동을 준비 중인 인디 메이커.';
  }

  return parts.join(' 및 ') + '.';
}

/**
 * Compute AI Leaderboard in real-time
 * STRICT RULE: Only actual registered demonst members (demonst builders & logged in members) are included.
 * Zero fake benchmark or placeholder accounts!
 */
export function computeAiLeaderboard(
  feedbacksRecord: Record<string, Feedback[]>,
  products: Product[],
  builders: Builder[],
  communityPosts: CommunityPost[],
  currentUser: UserProfile
): LeaderboardUser[] {
  // 1. Gather all actual registered demonst members into a unified map
  const registeredMakers = new Map<string, Builder>();

  // Add all existing builders from database/file
  (builders || []).forEach((b) => {
    if (b && b.name) {
      registeredMakers.set(b.id || b.name, b);
    }
  });

  // Ensure current logged-in user is included if registered
  if (currentUser && currentUser.isLoggedIn && currentUser.name) {
    const key = currentUser.id || currentUser.email || currentUser.name;
    const existing = registeredMakers.get(key) || Array.from(registeredMakers.values()).find((b) => b.name === currentUser.name || (currentUser.email && b.email === currentUser.email));

    if (existing) {
      registeredMakers.set(existing.id || existing.name, {
        ...existing,
        name: currentUser.name,
        avatar: currentUser.avatar || existing.avatar,
        role: currentUser.role || existing.role || '인디 메이커',
        email: currentUser.email || existing.email,
        buildingApp: currentUser.buildingApp || existing.buildingApp,
      });
    } else {
      registeredMakers.set(key, {
        id: currentUser.id || 'builder-' + Date.now(),
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role || '인디 메이커',
        bio: currentUser.bio || 'demonst 공식 가입 메이커입니다.',
        avatar: currentUser.avatar || '/demon-mascot.png',
        buildingApp: currentUser.buildingApp || '',
        tags: currentUser.tags || ['개발자'],
        followersCount: 0,
        followingCount: 0,
        online: true,
      });
    }
  }

  // 2. Pre-aggregate activity data across products, feedbacks, and community
  // Products by author
  const productStatsByAuthor: Record<string, { count: number; upvotes: number; views: number; titles: string[] }> = {};
  (products || []).forEach((p) => {
    const authorKey = p.authorId || p.author || '';
    const authorName = p.author || '';

    // Record by authorId
    if (p.authorId) {
      if (!productStatsByAuthor[p.authorId]) {
        productStatsByAuthor[p.authorId] = { count: 0, upvotes: 0, views: 0, titles: [] };
      }
      productStatsByAuthor[p.authorId].count += 1;
      productStatsByAuthor[p.authorId].upvotes += p.upvotes || 0;
      productStatsByAuthor[p.authorId].views += p.views || 0;
      if (p.title) productStatsByAuthor[p.authorId].titles.push(p.title);
    }

    // Record by author name
    if (authorName) {
      if (!productStatsByAuthor[authorName]) {
        productStatsByAuthor[authorName] = { count: 0, upvotes: 0, views: 0, titles: [] };
      }
      productStatsByAuthor[authorName].count += 1;
      productStatsByAuthor[authorName].upvotes += p.upvotes || 0;
      productStatsByAuthor[authorName].views += p.views || 0;
      if (p.title && !productStatsByAuthor[authorName].titles.includes(p.title)) {
        productStatsByAuthor[authorName].titles.push(p.title);
      }
    }
  });

  // Feedbacks by author
  const feedbackStatsByAuthor: Record<string, { count: number; apps: Set<string> }> = {};
  Object.entries(feedbacksRecord || {}).forEach(([productId, fbs]) => {
    (fbs || []).forEach((fb) => {
      const author = fb.author || '';
      const authorId = (fb as any).authorId || '';

      [author, authorId].forEach((key) => {
        if (key) {
          if (!feedbackStatsByAuthor[key]) {
            feedbackStatsByAuthor[key] = { count: 0, apps: new Set() };
          }
          feedbackStatsByAuthor[key].count += 1;
          feedbackStatsByAuthor[key].apps.add(productId);
        }
      });
    });
  });

  // Community posts by author
  const communityStatsByAuthor: Record<string, number> = {};
  (communityPosts || []).forEach((cp) => {
    const author = cp.author || '';
    const authorId = (cp as any).authorId || '';
    if (author) communityStatsByAuthor[author] = (communityStatsByAuthor[author] || 0) + 1;
    if (authorId) communityStatsByAuthor[authorId] = (communityStatsByAuthor[authorId] || 0) + 1;
  });

  // 3. Score ONLY the actual registered members of demonst
  const leaderboardList: LeaderboardUser[] = [];

  registeredMakers.forEach((builder) => {
    const idKey = builder.id || '';
    const nameKey = builder.name || '';
    const emailKey = builder.email || '';

    // Match product stats by ID, name, or email
    const pById = idKey ? productStatsByAuthor[idKey] : null;
    const pByName = nameKey ? productStatsByAuthor[nameKey] : null;
    const pByEmail = emailKey ? productStatsByAuthor[emailKey] : null;

    const launchedCount = Math.max(pById?.count || 0, pByName?.count || 0, pByEmail?.count || 0);
    const upvotes = Math.max(pById?.upvotes || 0, pByName?.upvotes || 0, pByEmail?.upvotes || 0);
    const views = Math.max(pById?.views || 0, pByName?.views || 0, pByEmail?.views || 0);
    const launchedTitles = Array.from(
      new Set([...(pById?.titles || []), ...(pByName?.titles || []), ...(pByEmail?.titles || [])])
    );

    // Match feedback stats
    const fbById = idKey ? feedbackStatsByAuthor[idKey] : null;
    const fbByName = nameKey ? feedbackStatsByAuthor[nameKey] : null;
    const fbByEmail = emailKey ? feedbackStatsByAuthor[emailKey] : null;

    const fbCount = Math.max(fbById?.count || 0, fbByName?.count || 0, fbByEmail?.count || 0);
    const testedCount = Math.max(
      fbById?.apps.size || 0,
      fbByName?.apps.size || 0,
      fbByEmail?.apps.size || 0
    );

    // Match community stats
    const cCount = Math.max(
      communityStatsByAuthor[idKey] || 0,
      communityStatsByAuthor[nameKey] || 0,
      communityStatsByAuthor[emailKey] || 0
    );

    // Baseline membership verification points
    const baseMemberScore = 150;

    // AI composite score calculation
    const aiScore =
      baseMemberScore +
      fbCount * 120 +
      testedCount * 60 +
      launchedCount * 260 +
      upvotes * 45 +
      cCount * 35 +
      (views > 0 ? Math.floor(views / 5) : 0);

    const badge = determineAiBadge(fbCount, launchedCount, upvotes, cCount);
    const aiCommentary = generateAiCommentary(nameKey, fbCount, launchedCount, upvotes, launchedTitles);

    leaderboardList.push({
      rank: 0,
      name: builder.name,
      avatar: builder.avatar || '/demon-mascot.png',
      role: builder.role || '인디 메이커',
      feedbackCount: fbCount,
      testedAppsCount: testedCount,
      launchedAppsCount: launchedCount,
      upvotesReceived: upvotes,
      badge,
      aiScore,
      aiCommentary,
      builderId: builder.id,
    });
  });

  // 4. Sort descending by AI Score, then by upvotes, then by launchedCount
  leaderboardList.sort((a, b) => {
    if ((b.aiScore || 0) !== (a.aiScore || 0)) {
      return (b.aiScore || 0) - (a.aiScore || 0);
    }
    if ((b.upvotesReceived || 0) !== (a.upvotesReceived || 0)) {
      return (b.upvotesReceived || 0) - (a.upvotesReceived || 0);
    }
    return (b.launchedAppsCount || 0) - (a.launchedAppsCount || 0);
  });

  // 5. Assign clean ranks
  return leaderboardList.map((maker, idx) => ({
    ...maker,
    rank: idx + 1,
  }));
}
