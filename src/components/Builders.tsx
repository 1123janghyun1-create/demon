import React, { useState, useMemo } from 'react';
import { Users, UserPlus, UserCheck, MessageSquare, Search, Hammer, Edit3, LogIn, Sparkles, ExternalLink, Globe } from 'lucide-react';
import { useApp } from '../AppContext';
import { Builder } from '../types';

export const Builders: React.FC = () => {
  const { builders, toggleFollowBuilder, setActiveDmBuilder, requireAuth, user, setIsProfileEditOpen, setIsLoginModalOpen } = useApp();
  const [filterRole, setFilterRole] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredBuilders = useMemo(() => {
    return builders.filter(b => {
      // Role filter
      if (filterRole !== 'all' && !b.tags.includes(filterRole) && !b.role.includes(filterRole)) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.role.toLowerCase().includes(q) ||
          b.bio.toLowerCase().includes(q) ||
          (b.buildingApp && b.buildingApp.toLowerCase().includes(q)) ||
          b.tags.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [builders, filterRole, search]);

  const handleOpenDm = (builder: Builder) => {
    requireAuth(() => {
      setActiveDmBuilder(builder);
    }, `${builder.name}님에게 DM을 보내려면 먼저 Google 로그인이 필요합니다.`);
  };

  return (
    <div className="mx-auto w-full max-w-[840px]">
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg flex items-center gap-2">
            <span>빌더 (Builders)</span>
            <span className="text-xs px-2 py-0.5 rounded-pill bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold">
              {builders.length}명
            </span>
          </h1>
          <p className="mt-1 text-sm text-fg-muted leading-relaxed">
            demonst에 로그인한 인디 메이커와 개발자들을 만나고 서로 팔로우 및 1:1 대화를 나눠보세요.
          </p>
        </div>

        {user.isLoggedIn ? (
          <button
            onClick={() => setIsProfileEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-accent-hover transition-colors shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>내 프로필 수정</span>
          </button>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-accent-hover transition-colors shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Google 로그인하고 빌더 등록</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-4">
        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {['all', '개발자', '디자이너', 'AI', 'SaaS', '메이커'].map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`rounded-pill px-3.5 py-1 text-xs font-semibold transition-all ${
                filterRole === role
                  ? 'bg-fg text-surface shadow-sm'
                  : 'text-fg-secondary hover:bg-surface-2'
              }`}
            >
              {role === 'all' ? '전체' : role}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-fg-muted" />
          <input
            type="search"
            placeholder="빌더, 기술, 프로젝트 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-pill border border-border bg-surface-2 pl-8 pr-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none placeholder:text-fg-muted"
          />
        </div>
      </div>

      {/* Builders Grid or Empty State */}
      {filteredBuilders.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-12 text-center flex flex-col items-center">
          <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-3">
            <Users className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-base font-bold text-fg">아직 등록된 빌더가 없습니다.</h2>
          <p className="mt-1 text-xs text-fg-muted max-w-[360px] leading-relaxed">
            Google로 로그인하시면 자동으로 빌더 목록에 등재되어 다른 메이커들과 팔로우하고 1:1 대화를 나눌 수 있습니다!
          </p>
          {!user.isLoggedIn && (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-btn bg-accent px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-accent-hover transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Google 로그인하고 첫 번째 빌더 되기</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBuilders.map(builder => {
            const isMe = user.isLoggedIn && (builder.id === user.id || (user.email && builder.email === user.email));

            return (
              <div
                key={builder.id}
                className={`rounded-card border bg-surface p-5 shadow-card transition-all flex flex-col justify-between ${
                  isMe ? 'border-accent/40 ring-1 ring-accent/20' : 'border-border hover:border-border-strong hover:shadow-card-hover'
                }`}
              >
                <div>
                  {/* Header: Avatar, Name, Role, Online, Follow/Edit Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={builder.avatar}
                          alt={`${builder.name} 빌더 프로필`}
                          loading="lazy"
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
                        />
                        {builder.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-surface" title="온라인" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-fg tracking-tight truncate">
                            {builder.name}
                          </h3>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-accent text-white font-bold">
                              나
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-accent block">
                          {builder.role}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {builder.website && (
                            <a
                              href={builder.website.startsWith('http') ? builder.website : `https://${builder.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-fg-muted hover:text-accent font-medium transition-colors"
                              title={`개인 웹사이트: ${builder.website}`}
                            >
                              <Globe className="w-3 h-3 text-accent shrink-0" />
                              <span className="truncate max-w-[110px]">{builder.website.replace(/^https?:\/\//, '')}</span>
                            </a>
                          )}
                          {builder.github && (
                            <a
                              href={builder.github.startsWith('http') ? builder.github : `https://${builder.github}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] text-fg-muted hover:text-accent font-medium transition-colors"
                              title="GitHub 프로필"
                            >
                              <span>GH</span>
                            </a>
                          )}
                          {builder.twitter && (
                            <a
                              href={builder.twitter.startsWith('http') ? builder.twitter : `https://${builder.twitter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] text-fg-muted hover:text-accent font-medium transition-colors"
                              title="X/Twitter 프로필"
                            >
                              <span>X</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action: Edit Profile (if me) or Follow Button */}
                    {isMe ? (
                      <button
                        type="button"
                        onClick={() => setIsProfileEditOpen(true)}
                        className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface-2 px-3 py-1 text-xs font-bold text-fg hover:bg-surface-3 transition-colors shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>수정</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleFollowBuilder(builder.id)}
                        className={`inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-bold transition-all shrink-0 ${
                          builder.isFollowing
                            ? 'border border-border bg-surface text-fg-muted hover:border-rose-500 hover:text-rose-500'
                            : 'bg-accent text-white shadow-sm hover:bg-accent-hover'
                        }`}
                      >
                        {builder.isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>팔로잉</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>팔로우</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="mt-3 text-xs text-fg-secondary leading-relaxed line-clamp-2">
                    {builder.bio || '새로운 가치를 코드로 만드는 멋진 인디 메이커입니다.'}
                  </p>

                  {/* Building App Badge */}
                  {builder.buildingApp && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-fg font-medium rounded-btn bg-surface-2 p-2 border border-border">
                      <Hammer className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="text-fg-muted text-[11px]">빌딩 중:</span>
                      <span className="font-bold text-xs truncate">{builder.buildingApp}</span>
                    </div>
                  )}

                  {/* Skill Tags */}
                  {builder.tags && builder.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {builder.tags.map(tag => (
                        <span
                          key={tag}
                          className="rounded-pill bg-surface-2 px-2 py-0.5 text-[10px] text-fg-muted border border-border/60"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom: Follow stats & DM Button */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-fg-muted">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span>팔로워 <strong className="text-fg font-bold">{builder.followersCount}</strong></span>
                    <span>·</span>
                    <span>팔로잉 <strong className="text-fg font-bold">{builder.followingCount}</strong></span>
                  </div>

                  {!isMe ? (
                    <button
                      type="button"
                      onClick={() => handleOpenDm(builder)}
                      className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-surface-2 px-3 py-1.5 text-xs font-bold text-fg hover:bg-surface-3 transition-colors shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-accent" />
                      <span>DM 보내기</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      온라인 활성 상태
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
