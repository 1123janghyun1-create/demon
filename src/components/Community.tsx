import React, { useState } from 'react';
import { MessageSquare, Share2, Send, Tag, Sparkles, LogIn, Trash2, ChevronUp, CornerDownRight } from 'lucide-react';
import { useApp } from '../AppContext';
import { CommunityPost } from '../types';

export const Community: React.FC = () => {
  const {
    communityPosts,
    addCommunityPost,
    deleteCommunityPost,
    toggleCommunityPostUpvote,
    isCommunityPostUpvoted,
    communityComments,
    addCommunityComment,
    deleteCommunityComment,
    showToast,
    user,
    requireAuth,
    setIsLoginModalOpen,
  } = useApp();

  const [filter, setFilter] = useState<'latest' | 'popular'>('latest');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<'런치' | '질문' | '팁' | '잡담'>('런치');
  const [showEditor, setShowEditor] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentTextMap, setCommentTextMap] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<{ postId: string; parentId: string; replyToAuthor: string } | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    requireAuth(() => {
      addCommunityPost({
        author: user.name || '데몬메이커',
        avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        tag,
        title: title.trim(),
        content: content.trim(),
      });

      setTitle('');
      setContent('');
      setShowEditor(false);
    }, '커뮤니티에 글을 게시하려면 로그인이 필요합니다.');
  };

  const sortedPosts = [...communityPosts].sort((a, b) => {
    if (filter === 'popular') {
      return (b.likes || 0) - (a.likes || 0);
    }
    return 0;
  });

  const handleShare = (postTitle: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('🔗 게시글 링크가 클립보드에 복사되었습니다.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[820px]">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg flex items-center gap-2">
          <span>커뮤니티</span>
          <span className="text-xl">💬</span>
        </h1>
        <p className="mt-2 text-sm text-fg-muted leading-relaxed">
          만들고 있는 것, 막힌 것, 배운 것을 조용히 나눠요.
        </p>
      </div>

      {/* Write Post Box */}
      <div className="mb-6 rounded-card border border-border bg-surface p-4 shadow-card">
        {!showEditor ? (
          <div
            onClick={() => {
              requireAuth(() => setShowEditor(true), '새 글을 작성하려면 Google 로그인이 필요합니다.');
            }}
            className="flex items-center gap-3 cursor-pointer rounded-pill border border-border bg-surface-2 px-4 py-2.5 text-sm text-fg-muted hover:border-accent transition-colors"
          >
            <div className="size-6 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-xs">
              <img src={user.avatar} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
            </div>
            <span>{user.isLoggedIn ? `${user.name}님, 새로운 소식이 있나요?` : '로그인하고 새로운 소식을 공유해보세요...'}</span>
            <button className="ml-auto rounded-pill bg-accent px-3 py-1 text-xs font-bold text-white">
              게시하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fg">새 게시글 작성 ({user.name})</span>
              <div className="flex items-center gap-1">
                {(['런치', '질문', '팁', '잡담'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${
                      tag === t
                        ? 'bg-accent text-white'
                        : 'border border-border text-fg-muted hover:bg-surface-2'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              required
              placeholder="제목을 입력하세요 (예: 멋진 사이드 프로젝트 런칭했어요 🚀)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-sm text-fg focus:border-accent focus:outline-none font-medium"
            />

            <textarea
              rows={3}
              required
              placeholder="제품 소개, 개발 비하인드, 궁금한 점을 자유롭게 적어주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="rounded-btn border border-border bg-surface-2 p-3 text-xs text-fg focus:border-accent focus:outline-none leading-relaxed"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="rounded-btn px-3 py-1.5 text-xs font-semibold text-fg-muted hover:text-fg"
              >
                취소
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-accent-hover"
              >
                <Send className="w-3.5 h-3.5" />
                <span>게시</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sort Tab & Counts */}
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('latest')}
            className={`rounded-pill px-3 py-1 text-xs font-semibold transition-all ${
              filter === 'latest'
                ? 'bg-fg text-surface'
                : 'text-fg-secondary hover:bg-surface-2'
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => setFilter('popular')}
            className={`rounded-pill px-3 py-1 text-xs font-semibold transition-all ${
              filter === 'popular'
                ? 'bg-fg text-surface'
                : 'text-fg-secondary hover:bg-surface-2'
            }`}
          >
            추천순 (인기)
          </button>
        </div>
        <span className="text-xs text-fg-muted">{communityPosts.length}개의 글</span>
      </div>

      {/* Post List */}
      <div className="flex flex-col gap-3.5">
        {sortedPosts.length === 0 ? (
          <div className="rounded-card border border-border bg-surface p-10 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-fg-muted" />
            </div>
            <h3 className="text-sm font-bold text-fg mb-1">아직 등록된 게시글이 없습니다</h3>
            <p className="text-xs text-fg-muted mb-4 max-w-xs">
              만들고 있는 사이드 프로젝트, 질문, 팁을 자유롭게 나눠보세요!
            </p>
            <button
              onClick={() => {
                requireAuth(() => setShowEditor(true), '글을 작성하려면 로그인이 필요합니다.');
              }}
              className="px-4 py-2 rounded-btn bg-accent text-white text-xs font-bold hover:bg-accent-hover transition-colors cursor-pointer"
            >
              첫 번째 글 작성하기
            </button>
          </div>
        ) : (
          sortedPosts.map((post) => (
          <div
            key={post.id}
            className="rounded-card border border-border bg-surface p-5 shadow-card transition-colors hover:border-border-strong"
          >
            {/* Author info */}
            <div className="flex items-center gap-2 mb-2">
              <img
                src={post.avatar}
                alt={post.author}
                className="size-7 rounded-full object-cover"
              />
              <span className="text-xs font-bold text-fg">{post.author}</span>
              <span className="text-[11px] text-fg-muted">· {post.timeAgo}</span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="rounded-pill bg-brand-subtle px-2 py-0.5 text-[10px] font-bold text-accent">
                  {post.tag}
                </span>
                {user.isLoggedIn && Boolean(
                  (post.authorId && post.authorId === user.id) ||
                  (post.authorEmail && user.email && post.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
                  (user.email && (post.authorId === user.email || post.author === user.email))
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('작성하신 게시글을 삭제하시겠습니까?')) {
                        deleteCommunityPost(post.id);
                      }
                    }}
                    className="p-1 text-fg-muted hover:text-rose-500 rounded transition-colors"
                    title="게시글 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Post Title & Content */}
            <h2 className="text-base font-bold text-fg tracking-tight mb-1.5">
              {post.title}
            </h2>
            <p className="text-xs text-fg-secondary leading-relaxed whitespace-pre-line mb-3">
              {post.content}
            </p>

            {/* Linked App Card if present */}
            {post.linkedApp && (
              <div className="mb-3.5 flex items-center gap-3 rounded-btn border border-border bg-surface-2 p-3">
                <img
                  src={post.linkedApp.icon}
                  alt={post.linkedApp.title}
                  className="size-10 rounded-icon object-cover ring-1 ring-border"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-fg">{post.linkedApp.title}</div>
                  <div className="text-[11px] text-fg-muted truncate">{post.linkedApp.tagline}</div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-2.5 border-t border-border/60 text-xs text-fg-muted">
              {/* Upvote Button (Demonst Style ChevronUp Upvote) */}
              <button
                type="button"
                onClick={() => toggleCommunityPostUpvote(post.id)}
                title={isCommunityPostUpvoted(post.id) ? '추천 취소' : '이 글 추천(업보트)'}
                className={`group/vote inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                  isCommunityPostUpvoted(post.id)
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-2xs'
                    : 'bg-surface-2 border-border text-fg-secondary hover:border-rose-500/40 hover:text-rose-500'
                }`}
              >
                <ChevronUp
                  className={`w-3.5 h-3.5 transition-transform ${
                    isCommunityPostUpvoted(post.id)
                      ? 'text-rose-500 scale-125'
                      : 'text-fg-muted group-hover/vote:text-rose-500 group-hover/vote:-translate-y-0.5'
                  }`}
                />
                <span>추천 {post.likes || 0}</span>
              </button>

              <button
                type="button"
                onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                className={`inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer rounded-pill px-2.5 py-1 text-xs border ${
                  expandedPostId === post.id
                    ? 'border-accent/40 bg-accent/10 text-accent font-bold'
                    : 'border-transparent text-fg-muted hover:text-fg hover:border-border'
                }`}
                title="댓글 보기 및 작성"
              >
                <MessageSquare className="size-3.5 text-accent" />
                <span>댓글 {post.comments || (communityComments[post.id]?.length || 0)}</span>
              </button>

              <button
                type="button"
                onClick={() => handleShare(post.title)}
                className="ml-auto inline-flex items-center gap-1.5 font-medium hover:text-fg transition-colors"
              >
                <Share2 className="size-3.5" />
                <span>공유</span>
              </button>
            </div>

            {/* Expandable Comment & Reply Thread */}
            {expandedPostId === post.id && (() => {
              const allComments = communityComments[post.id] || [];
              const topLevelComments = allComments.filter((c) => !c.parentId);
              const getReplies = (parentId: string) => allComments.filter((c) => c.parentId === parentId);

              return (
                <div className="mt-3 pt-3 border-t border-border space-y-3">
                  {/* Comments List */}
                  <div className="space-y-2.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                    {topLevelComments.length === 0 ? (
                      <p className="text-xs text-fg-muted py-2 text-center">
                        아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                      </p>
                    ) : (
                      topLevelComments.map((c) => {
                        const childReplies = getReplies(c.id);
                        const isReplyingHere = replyTarget?.postId === post.id && replyTarget?.parentId === c.id;
                        return (
                          <div key={c.id} className="space-y-1.5">
                            {/* Parent Comment */}
                            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-2 text-xs">
                              <img
                                src={c.avatar || '/demon-mascot.png'}
                                alt={c.author}
                                className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5 border border-border"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-fg">{c.author}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-fg-muted">{c.createdAt}</span>
                                    {user.isLoggedIn && (user.id === c.authorId || (user.email && user.email === c.authorEmail)) && (
                                      <button
                                        type="button"
                                        onClick={() => deleteCommunityComment(post.id, c.id)}
                                        className="text-fg-muted hover:text-rose-500 cursor-pointer"
                                        title="댓글 삭제"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="mt-1 text-fg-secondary leading-relaxed break-words">{c.content}</p>
                                <div className="mt-1.5 flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isReplyingHere) {
                                        setReplyTarget(null);
                                        setReplyText('');
                                      } else {
                                        setReplyTarget({ postId: post.id, parentId: c.id, replyToAuthor: c.author });
                                        setReplyText('');
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-fg-muted hover:text-accent transition-colors cursor-pointer"
                                  >
                                    <CornerDownRight className="w-3 h-3" />
                                    <span>답글 달기{childReplies.length > 0 ? ` (${childReplies.length})` : ''}</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Nested Replies */}
                            {childReplies.length > 0 && (
                              <div className="ml-5 pl-3 border-l-2 border-accent/25 space-y-1.5">
                                {childReplies.map((r) => (
                                  <div key={r.id} className="flex items-start gap-2 p-2 rounded-lg bg-surface-2/60 border border-border/60 text-xs">
                                    <CornerDownRight className="w-3 h-3 text-accent/70 shrink-0 mt-1" />
                                    <img
                                      src={r.avatar || '/demon-mascot.png'}
                                      alt={r.author}
                                      className="w-4 h-4 rounded-full object-cover shrink-0 mt-0.5 border border-border"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-fg text-[11px]">{r.author}</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] text-fg-muted">{r.createdAt}</span>
                                          {user.isLoggedIn && (user.id === r.authorId || (user.email && user.email === r.authorEmail)) && (
                                            <button
                                              type="button"
                                              onClick={() => deleteCommunityComment(post.id, r.id)}
                                              className="text-fg-muted hover:text-rose-500 cursor-pointer"
                                              title="답글 삭제"
                                            >
                                              <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <p className="mt-0.5 text-fg-secondary leading-relaxed break-words">
                                        {r.replyToAuthor && (
                                          <span className="text-accent font-semibold mr-1">@{r.replyToAuthor}</span>
                                        )}
                                        {r.content}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReplyTarget({ postId: post.id, parentId: c.id, replyToAuthor: r.author });
                                          setReplyText('');
                                        }}
                                        className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-fg-muted hover:text-accent transition-colors cursor-pointer"
                                      >
                                        <CornerDownRight className="w-2.5 h-2.5" />
                                        <span>답글</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Inline Reply Input Form */}
                            {isReplyingHere && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const trimmed = replyText.trim();
                                  if (!trimmed) return;
                                  addCommunityComment(post.id, trimmed, c.id, replyTarget.replyToAuthor);
                                  setReplyText('');
                                  setReplyTarget(null);
                                }}
                                className="ml-5 pl-3 border-l-2 border-accent/50 flex items-center gap-1.5 pt-0.5"
                              >
                                <input
                                  type="text"
                                  autoFocus
                                  placeholder={`@${replyTarget.replyToAuthor}님에게 답글 남기기...`}
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  className="flex-1 rounded-btn border border-accent/40 bg-surface-2 px-2.5 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
                                />
                                <button
                                  type="submit"
                                  disabled={!replyText.trim()}
                                  className="rounded-btn bg-accent px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-accent-hover disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                                >
                                  답글 등록
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyTarget(null);
                                    setReplyText('');
                                  }}
                                  className="rounded-btn border border-border px-2 py-1.5 text-[11px] font-medium text-fg-muted hover:text-fg shrink-0 cursor-pointer"
                                >
                                  취소
                                </button>
                              </form>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Top-level Comment Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const text = (commentTextMap[post.id] || '').trim();
                      if (!text) return;
                      addCommunityComment(post.id, text);
                      setCommentTextMap((prev) => ({ ...prev, [post.id]: '' }));
                    }}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      placeholder={user.isLoggedIn ? "따뜻한 댓글을 남겨보세요..." : "댓글을 입력하세요 (로그인 필요)..."}
                      value={commentTextMap[post.id] || ''}
                      onChange={(e) => setCommentTextMap((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      className="flex-1 rounded-btn border border-border bg-surface-2 px-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!(commentTextMap[post.id] || '').trim()}
                      className="rounded-btn bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-hover disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                    >
                      등록
                    </button>
                  </form>
                </div>
              );
            })()}
          </div>
        ))
        )}
      </div>
    </div>
  );
};
