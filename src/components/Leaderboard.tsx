import React, { useState, useMemo } from 'react';
import {
  Trophy,
  MessageSquare,
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
  Award,
  Rocket,
  Flame,
  MessageCircle,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { computeAiLeaderboard } from '../lib/aiLeaderboard';
import { LeaderboardUser, Builder } from '../types';

type LeaderboardCategory = 'all' | 'tester' | 'maker' | 'rising';

export const Leaderboard: React.FC = () => {
  const {
    feedbacks,
    products,
    builders,
    communityPosts,
    user,
    setCurrentTab,
    setActiveDmBuilder,
    showToast,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState('방금 전');

  // Compute AI Leaderboard in real-time based on all live platform activity
  const rawLeaderboard = useMemo(() => {
    return computeAiLeaderboard(feedbacks, products, builders, communityPosts, user);
  }, [feedbacks, products, builders, communityPosts, user]);

  // Filter & sort based on category
  const rankedUsers = useMemo(() => {
    let list = [...rawLeaderboard];

    if (activeCategory === 'tester') {
      list.sort((a, b) => b.feedbackCount - a.feedbackCount || (b.aiScore || 0) - (a.aiScore || 0));
    } else if (activeCategory === 'maker') {
      list.sort(
        (a, b) =>
          (b.launchedAppsCount || 0) * 10 +
          (b.upvotesReceived || 0) -
          ((a.launchedAppsCount || 0) * 10 + (a.upvotesReceived || 0))
      );
    } else if (activeCategory === 'rising') {
      list.sort((a, b) => (b.upvotesReceived || 0) - (a.upvotesReceived || 0));
    } else {
      // Default: AI Total Score
      list.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    }

    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [rawLeaderboard, activeCategory]);

  // Manual AI Re-analyze Trigger
  const handleTriggerReanalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      const now = new Date();
      setLastAnalyzedTime(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
      showToast('🤖 AI가 플랫폼 내 모든 피드백과 런칭 활동을 실시간 재분석하여 리더보드를 갱신했습니다!');
    }, 600);
  };

  // Open Direct Message modal with this ranked builder
  const handleOpenDm = (rankedUser: LeaderboardUser) => {
    const existingBuilder = builders.find(
      (b) =>
        (rankedUser.builderId && b.id === rankedUser.builderId) ||
        (rankedUser.email && b.email && b.email.toLowerCase() === rankedUser.email.toLowerCase())
    );
    if (existingBuilder) {
      setActiveDmBuilder(existingBuilder);
    } else {
      const tempBuilder: Builder = {
        id: rankedUser.builderId || (rankedUser.email ? 'user-' + rankedUser.email : 'user-' + rankedUser.name),
        name: rankedUser.name,
        email: rankedUser.email,
        avatar: rankedUser.avatar,
        role: rankedUser.role || '인디 메이커',
        bio: rankedUser.aiCommentary || 'demonst 리더보드 상위 메이커입니다.',
        buildingApp: '',
        tags: ['리더보드', '메이커'],
        followersCount: 12,
        followingCount: 5,
        online: true,
      };
      setActiveDmBuilder(tempBuilder);
    }
  };

  const top3 = rankedUsers.slice(0, 3);
  const remainingRankings = rankedUsers.slice(3);

  return (
    <div className="mx-auto w-full max-w-[860px] pb-12">
      {/* Title & Description */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg flex items-center gap-2">
            <span>리더보드</span>
            <Trophy className="h-6 w-6 text-amber-500" />
            <span className="rounded-pill bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent border border-accent/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI 실시간 랭킹
            </span>
          </h1>
          <p className="mt-2 text-sm text-fg-muted leading-relaxed">
            AI 분석 엔진이 피드백 심층도, 기기별 테스트 기여, 신작 런칭 및 받은 추천을 종합 분석한 실시간 메이커 순위입니다.
          </p>
        </div>

        {/* AI Live Sync Status & Reanalyze Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTriggerReanalyze}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-surface px-3 py-1.5 text-xs font-bold text-fg hover:bg-surface-2 transition-all shadow-2xs"
            title="AI 실시간 재분석 실행"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'AI 분석 중...' : 'AI 실시간 재분석'}</span>
          </button>
        </div>
      </div>

      {/* AI Live Analysis Engine Banner */}
      <div className="mb-6 rounded-card border border-accent/20 bg-gradient-to-r from-accent/5 via-surface-2 to-amber-500/5 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-fg">demonst AI 실시간 기여도 평가 가동 중</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-pill">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE ({lastAnalyzedTime})
                </span>
              </div>
              <p className="text-[11px] text-fg-muted mt-0.5">
                피드백 작성(+120점), 앱 런칭(+220점), 추천 획득(+45점) 활동이 즉시 AI 점수에 실시간 반영됩니다.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentTab('test')}
            className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline shrink-0"
          >
            <span>테스트 참여하고 순위 올리기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-pill px-3.5 py-1.5 text-xs font-semibold transition-all inline-flex items-center gap-1 ${
            activeCategory === 'all'
              ? 'bg-fg text-surface shadow-sm'
              : 'text-fg-secondary hover:bg-surface-2'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>종합 AI 랭킹</span>
        </button>

        <button
          onClick={() => setActiveCategory('tester')}
          className={`rounded-pill px-3.5 py-1.5 text-xs font-semibold transition-all inline-flex items-center gap-1 ${
            activeCategory === 'tester'
              ? 'bg-fg text-surface shadow-sm'
              : 'text-fg-secondary hover:bg-surface-2'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
          <span>최고 테스터 랭킹</span>
        </button>

        <button
          onClick={() => setActiveCategory('maker')}
          className={`rounded-pill px-3.5 py-1.5 text-xs font-semibold transition-all inline-flex items-center gap-1 ${
            activeCategory === 'maker'
              ? 'bg-fg text-surface shadow-sm'
              : 'text-fg-secondary hover:bg-surface-2'
          }`}
        >
          <Rocket className="w-3.5 h-3.5 text-rose-500" />
          <span>슈퍼 런치 랭킹</span>
        </button>

        <button
          onClick={() => setActiveCategory('rising')}
          className={`rounded-pill px-3.5 py-1.5 text-xs font-semibold transition-all inline-flex items-center gap-1 ${
            activeCategory === 'rising'
              ? 'bg-fg text-surface shadow-sm'
              : 'text-fg-secondary hover:bg-surface-2'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>주간 라이징 스타</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* Top Podium Cards (Dynamic 1 ~ 3 registered members)          */}
      {/* ============================================================ */}
      {rankedUsers.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-12 text-center shadow-card mb-8">
          <Trophy className="mx-auto w-12 h-12 text-fg-muted/40 mb-3" />
          <h3 className="text-base font-bold text-fg">아직 활동 중인 demonst 정식 가입자가 없습니다</h3>
          <p className="text-xs text-fg-muted mt-1 max-w-md mx-auto">
            가입 후 첫 프로젝트를 런칭하거나 동료 메이커의 앱에 피드백을 남겨 리더보드 1위에 도전해보세요!
          </p>
        </div>
      ) : (
        <div className={`mb-8 grid grid-cols-1 ${
          top3.length === 1 ? 'sm:grid-cols-1 max-w-sm mx-auto' : top3.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'sm:grid-cols-3'
        } gap-3.5`}>
          {top3.map((maker, idx) => {
            const podiumMetaList = [
              {
                border: 'border-amber-400/50 bg-gradient-to-b from-amber-500/10 via-surface to-surface',
                badge: '🥇 AI 1위',
                badgeColor: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
                ring: 'ring-amber-400 ring-2',
              },
              {
                border: 'border-slate-300/60 bg-gradient-to-b from-slate-400/10 via-surface to-surface',
                badge: '🥈 AI 2위',
                badgeColor: 'text-slate-500 border-slate-400/30 bg-slate-400/10',
                ring: 'ring-slate-300 ring-2',
              },
              {
                border: 'border-amber-700/40 bg-gradient-to-b from-amber-700/10 via-surface to-surface',
                badge: '🥉 AI 3위',
                badgeColor: 'text-amber-700 border-amber-700/30 bg-amber-700/10',
                ring: 'ring-amber-700 ring-2',
              },
            ];
            const podiumMeta = podiumMetaList[idx] || {
              border: 'border-border bg-surface',
              badge: `AI ${idx + 1}위`,
              badgeColor: 'text-fg-muted border-border bg-surface-2',
              ring: 'ring-border ring-1',
            };

            const isMe =
              user.isLoggedIn &&
              Boolean(
                (user.id && maker.builderId === user.id) ||
                (user.email && maker.email && user.email.toLowerCase() === maker.email.toLowerCase())
              );

          return (
            <div
              key={maker.builderId || maker.email || `${maker.name}-${idx}`}
              className={`relative flex flex-col items-center justify-between p-5 rounded-card border ${podiumMeta.border} shadow-card text-center transition-all hover:shadow-card-hover`}
            >
              {/* Badge */}
              <div className="flex items-center gap-1.5 mb-3">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-pill border ${podiumMeta.badgeColor}`}>
                  {podiumMeta.badge}
                </span>
                {isMe && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-pill bg-accent text-white">
                    나
                  </span>
                )}
              </div>

              {/* Avatar with Ring */}
              <div className="relative mb-3">
                <img
                  src={maker.avatar}
                  alt={maker.name}
                  className={`size-16 rounded-full object-cover shadow-sm ${podiumMeta.ring}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/demon-mascot.png';
                  }}
                />
              </div>

              {/* Name & Role */}
              <h3 className="text-base font-extrabold text-fg tracking-tight">{maker.name}</h3>
              <p className="text-[11px] text-fg-muted mt-0.5">{maker.role || '인디 메이커'}</p>

              {/* AI Assigned Title Badge */}
              <div className="mt-2.5">
                <span className="inline-flex items-center gap-1 rounded-pill bg-surface-2 border border-border px-2.5 py-1 text-[11px] font-bold text-fg">
                  <Sparkles className="w-3 h-3 text-accent" />
                  <span>{maker.badge}</span>
                </span>
              </div>

              {/* AI Score */}
              <div className="mt-3 flex items-center gap-1 text-xs font-extrabold text-accent bg-accent/5 border border-accent/20 px-3 py-1 rounded-pill">
                <Zap className="w-3.5 h-3.5" />
                <span>AI 점수: {maker.aiScore?.toLocaleString()} pts</span>
              </div>

              {/* AI Commentary */}
              <p className="mt-2.5 text-[11px] text-fg-muted leading-relaxed line-clamp-2 px-1 italic">
                “{maker.aiCommentary}”
              </p>

              {/* Stats Chips */}
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-fg-muted pt-3 border-t border-border/60 w-full">
                <span title="작성한 피드백 수">피드백 <b>{maker.feedbackCount}</b></span>
                <span>·</span>
                <span title="런칭한 앱 수">런칭 <b>{maker.launchedAppsCount || 0}</b></span>
                <span>·</span>
                <span title="받은 추천 수">추천 <b>{maker.upvotesReceived || 0}</b></span>
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={() => handleOpenDm(maker)}
                className="mt-3 inline-flex items-center justify-center gap-1 w-full py-1.5 rounded-btn bg-surface-2 border border-border text-xs font-bold text-fg hover:bg-surface-3 transition-colors shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-accent" />
                <span>1:1 대화</span>
              </button>
            </div>
          );
        })}
      </div>
      )}

      {/* ============================================================ */}
      {/* Full Leaderboard Table                                        */}
      {/* ============================================================ */}
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
        {/* Table Header */}
        <div className="grid grid-cols-12 border-b border-border bg-surface-2 px-5 py-3 text-xs font-bold text-fg-muted">
          <div className="col-span-1 text-center">순위</div>
          <div className="col-span-6 sm:col-span-5">메이커 &amp; AI 한줄 평가</div>
          <div className="hidden sm:block col-span-3 text-center">기여 활동 통계</div>
          <div className="col-span-5 sm:col-span-3 text-right">종합 AI 점수</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {rankedUsers.map((maker, idx) => {
            const isMe =
              user.isLoggedIn &&
              Boolean(
                (user.id && maker.builderId === user.id) ||
                (user.email && maker.email && user.email.toLowerCase() === maker.email.toLowerCase())
              );

            return (
              <div
                key={maker.builderId || maker.email || `${maker.name}-${idx}`}
                className={`grid grid-cols-12 items-center px-5 py-4 text-sm transition-colors hover:bg-surface-2 ${
                  isMe ? 'bg-accent/5' : ''
                }`}
              >
                {/* Rank Number */}
                <div className="col-span-1 text-center font-bold text-fg">
                  {maker.rank === 1 && <span className="text-amber-500 font-extrabold text-base">🥇 1</span>}
                  {maker.rank === 2 && <span className="text-slate-400 font-extrabold text-base">🥈 2</span>}
                  {maker.rank === 3 && <span className="text-amber-700 font-extrabold text-base">🥉 3</span>}
                  {maker.rank > 3 && (
                    <span className="text-xs font-bold text-fg-muted bg-surface-2 size-6 rounded-full inline-flex items-center justify-center border border-border">
                      {maker.rank}
                    </span>
                  )}
                </div>

                {/* Maker Profile & AI Insights */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                  <img
                    src={maker.avatar}
                    alt={maker.name}
                    className="size-9 rounded-full object-cover ring-1 ring-border shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/demon-mascot.png';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-fg truncate text-sm">{maker.name}</span>
                      {isMe && (
                        <span className="rounded-pill bg-accent text-white text-[10px] font-bold px-1.5 py-0.2 shrink-0">
                          내 순위
                        </span>
                      )}
                      <span className="text-[10px] text-accent font-semibold bg-accent/10 px-1.5 py-0.2 rounded-pill shrink-0">
                        {maker.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-fg-muted truncate mt-0.5" title={maker.aiCommentary}>
                      {maker.aiCommentary}
                    </p>
                  </div>
                </div>

                {/* Stats (Desktop) */}
                <div className="hidden sm:flex col-span-3 items-center justify-center gap-2.5 text-xs text-fg-muted">
                  <div className="flex items-center gap-1" title="작성한 피드백 건수">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                    <span>{maker.feedbackCount}건</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1" title="런칭한 앱 수">
                    <Rocket className="w-3.5 h-3.5 text-rose-500" />
                    <span>{maker.launchedAppsCount || 0}개</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1" title="획득한 추천 수">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{maker.upvotesReceived || 0}</span>
                  </div>
                </div>

                {/* Score & Action Button */}
                <div className="col-span-5 sm:col-span-3 flex items-center justify-end gap-2 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-extrabold text-sm text-accent flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {maker.aiScore?.toLocaleString()} pts
                    </span>
                    <span className="text-[10px] text-fg-muted sm:hidden">
                      피드백 {maker.feedbackCount} · 추천 {maker.upvotesReceived || 0}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDm(maker)}
                    className="p-1.5 rounded-btn border border-border bg-surface text-fg-muted hover:text-accent hover:bg-surface-3 transition-colors shrink-0"
                    title={`${maker.name} 님과 1:1 대화`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
