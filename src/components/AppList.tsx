import React, { useMemo } from 'react';
import { MessageSquare, ExternalLink, Sparkles, PlusCircle, Eye, ChevronUp, Rocket, Clock } from 'lucide-react';
import { useApp } from '../AppContext';
import { Product } from '../types';
import { ProductLogo } from './ProductLogo';

export const AppList: React.FC = () => {
  const {
    products,
    setSelectedProduct,
    searchQuery,
    setCurrentTab,
    incrementProductViews,
    toggleProductUpvote,
    isProductUpvoted,
    bumpProduct,
    user,
  } = useApp();

  // Always sorted by latest bumped / created date (최신순)
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.tagline || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.author || '').toLowerCase().includes(q)
      );
    }

    // Always sort by latest registered / bumped time (최신순 우선)
    list.sort((a, b) => {
      const timeA = new Date(a.bumpedAt || a.createdAtRaw || a.createdAt || 0).getTime() || 0;
      const timeB = new Date(b.bumpedAt || b.createdAtRaw || b.createdAt || 0).getTime() || 0;
      return timeB - timeA;
    });

    return list;
  }, [products, searchQuery]);

  // 3-Day Cooldown Constants (3 days = 259,200,000 ms)
  const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

  return (
    <div className="mx-auto w-full max-w-[840px]">
      {/* Hero Title Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg flex items-center gap-2">
          <span>테스터를 기다리는 앱</span>
          <span className="text-xs px-2 py-0.5 rounded-pill bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold">
            {filteredProducts.length}개
          </span>
        </h1>
        <p className="mt-2 text-sm text-fg-muted leading-relaxed">
          앱을 직접 사용해보고 메이커에게 소중한 피드백을 전달해주세요.
        </p>
      </div>

      {/* Filter / Sort Bar: 최신순 단일화 & 3일 주기 끌어올리기 안내 */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-fg text-surface px-3 py-1.5 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>최신순 (방금 올라왔어요)</span>
          </span>
          <span className="text-xs text-fg-muted flex items-center gap-1">
            <span>· 3일마다 내 웹사이트를 최상단으로 끌어올릴 수 있습니다</span>
          </span>
        </div>

        <button
          onClick={() => setCurrentTab('submit')}
          className="inline-flex items-center gap-1.5 rounded-pill bg-accent px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-accent-hover transition-colors cursor-pointer shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>내 앱 등록하기</span>
        </button>
      </div>

      {/* Product Cards List or Empty State */}
      <div className="flex flex-col gap-3">
        {filteredProducts.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface p-12 text-center flex flex-col items-center">
            <div className="size-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
              <img src="/demon-mascot.png" alt="demon" className="w-12 h-12 object-contain" />
            </div>
            <h2 className="text-lg font-extrabold text-fg">아직 등록된 앱이 없습니다.</h2>
            <p className="mt-2 text-xs text-fg-muted max-w-[360px] leading-relaxed">
              지금 당신의 사이드 프로젝트나 서비스를 등록하고 초기 테스터들의 진솔한 피드백을 가장 먼저 받아보세요!
            </p>
            <button
              onClick={() => setCurrentTab('submit')}
              className="mt-6 inline-flex items-center gap-2 rounded-btn bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-accent-hover transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>첫 번째 앱 등록하기</span>
            </button>
          </div>
        ) : (
          filteredProducts.map((product) => {
            // Strictly check if current logged-in user is the author/owner
            const isAuthor = Boolean(
              user.isLoggedIn && (
                (product.authorId && product.authorId === user.id) ||
                (product.authorEmail && user.email && product.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
                (user.email && (product.authorId === user.email || product.author === user.email)) ||
                (product.author && user.name && product.author === user.name)
              )
            );

            // Compute 3-day cooldown for bumping to top
            const lastBumpTime = new Date(product.bumpedAt || product.createdAtRaw || product.createdAt || 0).getTime();
            const diffMs = Date.now() - lastBumpTime;
            const canBump = isAuthor && (isNaN(lastBumpTime) || diffMs >= COOLDOWN_MS);
            const remainingMs = Math.max(0, COOLDOWN_MS - diffMs);
            const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
            const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const remainingMins = Math.floor((remainingMs % (60 * 1000)) / (60 * 1000));

            const isBumpedRecently = Boolean(product.bumpedAt && product.bumpedAt !== product.createdAtRaw);

            return (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  incrementProductViews(product.id);
                }}
                className={`group relative flex flex-col sm:flex-row cursor-pointer sm:items-center justify-between gap-3.5 sm:gap-4 rounded-card border bg-surface p-3.5 sm:p-4 shadow-card transition-all duration-150 hover:border-border-strong hover:shadow-card-hover text-fg ${
                  isAuthor ? 'border-accent/40 ring-1 ring-accent/15' : 'border-border'
                }`}
              >
                {/* Top / Left: Icon + Info */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <ProductLogo
                      src={product.icon}
                      title={product.title}
                      url={product.url}
                      sizeClass="size-12 sm:size-14"
                    />
                    {isBumpedRecently && (
                      <span
                        className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-accent text-[9px] text-white flex items-center justify-center shadow-xs z-10"
                        title="최근 상단으로 끌어올려진 앱"
                      >
                        🚀
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-bold text-fg tracking-tight group-hover:text-accent transition-colors truncate">
                        <a
                          href={`/?product=${product.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedProduct(product);
                            incrementProductViews(product.id);
                          }}
                          className="hover:underline"
                        >
                          {product.title}
                        </a>
                      </h2>
                      {product.isNew && (
                        <span className="shrink-0 rounded-pill bg-rose-500/10 px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[9px] sm:text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          NEW
                        </span>
                      )}
                      <span className="shrink-0 text-[10px] sm:text-[11px] text-fg-muted">
                        {product.category}
                      </span>
                      {isAuthor && (
                        <span className="shrink-0 rounded-pill bg-accent/10 px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[9px] sm:text-[10px] font-bold text-accent border border-accent/20">
                          내 제품
                        </span>
                      )}
                      {isBumpedRecently && (
                        <span className="shrink-0 text-[10px] text-accent font-semibold flex items-center gap-0.5">
                          🚀 끌어올림
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-fg-muted line-clamp-2 sm:truncate leading-snug">
                      {product.tagline}
                    </p>
                  </div>
                </div>

                {/* Bottom (Mobile) / Right (Desktop): Stats + Actions */}
                <div className="flex shrink-0 items-center justify-between sm:justify-end gap-2 sm:gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  {/* Views & Feedback Count */}
                  <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-fg-muted">
                    <div
                      className="flex items-center gap-1 text-[11px] sm:text-xs text-fg-muted"
                      title="조회수"
                    >
                      <Eye className="h-3.5 w-3.5 text-fg-muted" />
                      <span>{product.views || 0}</span>
                    </div>

                    <div
                      className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-fg-muted"
                      title="등록된 피드백 수"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-accent" />
                      <span className="hidden sm:inline">피드백</span>
                      <span>{product.feedbackCount}건</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* 끌어올리기 (Bump to Top) Button: Only for the Author */}
                    {isAuthor && (
                      canBump ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            bumpProduct(product.id);
                          }}
                          className="inline-flex items-center gap-1 sm:gap-1.5 rounded-btn bg-gradient-to-r from-accent to-rose-500 hover:from-accent-hover hover:to-rose-600 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0 animate-pulse"
                          title="3일 주기 끌어올리기 가능! 클릭하면 내 앱이 목록 맨 위로 올라갑니다."
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          <span>상단 끌어올리기</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            bumpProduct(product.id);
                          }}
                          className="inline-flex items-center gap-1 sm:gap-1.5 rounded-btn bg-surface-2 border border-border px-2 sm:px-2.5 py-1.5 text-[11px] font-semibold text-fg-muted hover:border-accent/40 transition-colors shrink-0 cursor-pointer"
                          title={`자신의 웹사이트는 3일마다 1회 최상단으로 끌어올릴 수 있습니다. (다음 가능: ${remainingDays > 0 ? `${remainingDays}일 ${remainingHours}시간 후` : `${remainingHours}시간 ${remainingMins}분 후`})`}
                        >
                          <Clock className="w-3.5 h-3.5 text-accent" />
                          <span>
                            {remainingDays > 0
                              ? `끌어올리기 D-${remainingDays} (${remainingHours}h)`
                              : `끌어올리기 ${remainingHours}h ${remainingMins}m`}
                          </span>
                        </button>
                      )
                    )}

                    {/* Upvote Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleProductUpvote(product.id);
                      }}
                      title={isProductUpvoted(product.id) ? '추천 취소' : '추천(업보트)'}
                      className={`group/vote flex items-center gap-1 sm:gap-1.5 rounded-btn px-2.5 py-1.5 text-xs font-bold transition-all border shrink-0 ${
                        isProductUpvoted(product.id)
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-sm'
                          : 'bg-surface-2 border-border text-fg hover:border-rose-500/40 hover:text-rose-500'
                      }`}
                    >
                      <ChevronUp
                        className={`w-3.5 h-3.5 transition-transform ${
                          isProductUpvoted(product.id)
                            ? 'text-rose-500 scale-125'
                            : 'text-fg-muted group-hover/vote:text-rose-500 group-hover/vote:-translate-y-0.5'
                        }`}
                      />
                      <span>{product.upvotes || 0}</span>
                    </button>

                    {/* Direct External Project URL */}
                    {product.url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(product.url.startsWith('http') ? product.url : `https://${product.url}`, '_blank', 'noopener,noreferrer');
                        }}
                        title={`${product.title} 외부 웹사이트 방문`}
                        className="inline-flex items-center gap-1 rounded-btn border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-fg hover:bg-surface-3 hover:text-accent transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-fg-muted" />
                        <span className="hidden md:inline">방문</span>
                      </button>
                    )}

                    <span
                      className="hidden sm:inline-flex items-center gap-1 rounded-btn border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-fg group-hover:bg-accent group-hover:text-white transition-colors"
                    >
                      상세 보기
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
