import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ExternalLink,
  Star,
  Send,
  MessageSquare,
  Image as ImageIcon,
  Play,
  Edit3,
  Trash2,
  Save,
  Plus,
  Eye,
  ChevronUp,
  Rocket,
  Clock,
  CornerDownRight,
  Copy,
  Check,
  TrendingUp,
  BarChart2,
  PieChart,
  Users,
  Share2,
  Code,
  Sparkles,
  Heart,
  Calendar,
  Layers,
  Flag,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { ProductLogo } from './ProductLogo';
import { Product, ProductComment, ProductTimelineEvent } from '../types';
import { ImageUploader } from './ImageUploader';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

type TabType = 'overview' | 'feedback' | 'comments' | 'timeline' | 'insights' | 'collaborators';

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const {
    products,
    feedbacks,
    addFeedback,
    updateProduct,
    deleteProduct,
    deleteFeedback,
    feedbackReplies,
    addFeedbackReply,
    deleteFeedbackReply,
    incrementProductViews,
    toggleProductUpvote,
    isProductUpvoted,
    bumpProduct,
    user,
    requireAuth,
    showToast,
    builders,
    openDmWithBuilder,
  } = useApp();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Feedback states
  const productFeedbacks = feedbacks[product.id] || feedbacks[product.slug] || [];
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
  const [replyingFeedbackId, setReplyingFeedbackId] = useState<string | null>(null);
  const [replyContentMap, setReplyContentMap] = useState<Record<string, string>>({});
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('Windows Chrome');
  const [feedbackScreenshot, setFeedbackScreenshot] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Product Comments states (persisted in localStorage)
  const [comments, setComments] = useState<ProductComment[]>(() => {
    try {
      const saved = localStorage.getItem(`demon_comments_${product.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [commentInput, setCommentInput] = useState('');

  const saveComments = (newComments: ProductComment[]) => {
    setComments(newComments);
    try {
      localStorage.setItem(`demon_comments_${product.id}`, JSON.stringify(newComments));
    } catch {}
  };

  const handlePostComment = () => {
    const text = commentInput.trim();
    if (!text) return;

    requireAuth(() => {
      const newComment: ProductComment = {
        id: 'pc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        productId: product.id,
        author: user.name || '인디 테스터',
        authorId: user.id || user.email,
        authorEmail: user.email,
        avatar: user.avatar || '/demon-mascot.png',
        content: text,
        createdAt: '방금 전',
        likes: 0,
        userLiked: false,
      };
      saveComments([newComment, ...comments]);
      setCommentInput('');
      showToast('💬 댓글이 성공적으로 등록되었습니다!');
    }, '댓글을 작성하려면 로그인이 필요합니다.');
  };

  const handleToggleCommentLike = (commentId: string) => {
    requireAuth(() => {
      const updated = comments.map((c) => {
        if (c.id === commentId) {
          const isLiked = !c.userLiked;
          return {
            ...c,
            userLiked: isLiked,
            likes: Math.max(0, (c.likes || 0) + (isLiked ? 1 : -1)),
          };
        }
        return c;
      });
      saveComments(updated);
    }, '댓글에 좋아요를 누르려면 로그인이 필요합니다.');
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('댓글을 삭제하시겠습니까?')) {
      const updated = comments.filter((c) => c.id !== commentId);
      saveComments(updated);
      showToast('댓글이 삭제되었습니다.');
    }
  };

  // Timeline Events states
  const [timelineEvents, setTimelineEvents] = useState<ProductTimelineEvent[]>(() => {
    try {
      const saved = localStorage.getItem(`demon_timeline_${product.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}

    const initial: ProductTimelineEvent[] = [
      {
        id: 'tl-launch',
        productId: product.id,
        type: 'launch',
        title: '🚀 공식 런칭 및 등록',
        description: 'demonst 런치패드에 프로덕트가 공식 등록되어 실사용 검증이 시작되었습니다.',
        date: product.createdAt || '오늘',
      },
    ];

    if (product.bumpedAt) {
      initial.unshift({
        id: 'tl-bump',
        productId: product.id,
        type: 'bump',
        title: '⚡ 상단 부스트(끌어올리기)',
        description: '3일 주기 쿨다운을 거쳐 피드 최상단으로 성공적으로 부스트되었습니다.',
        date: new Date(product.bumpedAt).toLocaleDateString(),
      });
    }

    if ((product.views || 0) >= 10) {
      initial.unshift({
        id: 'tl-views',
        productId: product.id,
        type: 'milestone',
        title: '👀 첫 조회수 마일스톤 달성',
        description: `인디 커뮤니티에서 총 ${product.views}회의 조회를 기록했습니다.`,
        date: '마일스톤 달성',
      });
    }

    if ((product.upvotes || 0) >= 3) {
      initial.unshift({
        id: 'tl-upvotes',
        productId: product.id,
        type: 'milestone',
        title: '🔥 추천(Upvote) 3개 돌파',
        description: `동료 메이커 및 테스터들로부터 ${product.upvotes}개의 추천을 받았습니다.`,
        date: '마일스톤 달성',
      });
    }

    return initial;
  });

  const [newUpdateTitle, setNewUpdateTitle] = useState('');
  const [newUpdateDesc, setNewUpdateDesc] = useState('');
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);

  const handleAddTimelineUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateTitle.trim() || !newUpdateDesc.trim()) return;

    const newEvt: ProductTimelineEvent = {
      id: 'tl-' + Date.now(),
      productId: product.id,
      type: 'update',
      title: '📝 ' + newUpdateTitle.trim(),
      description: newUpdateDesc.trim(),
      date: new Date().toLocaleDateString(),
    };

    const next = [newEvt, ...timelineEvents];
    setTimelineEvents(next);
    try {
      localStorage.setItem(`demon_timeline_${product.id}`, JSON.stringify(next));
    } catch {}

    setNewUpdateTitle('');
    setNewUpdateDesc('');
    setIsAddingUpdate(false);
    showToast('새 업데이트 로그가 기록되었습니다!');
  };

  // Insights State
  const [activityMetric, setActivityMetric] = useState<'views' | 'likes'>('views');
  const [embedTheme, setEmbedTheme] = useState<'light' | 'dark'>('light');
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);

  // Calculate trending rank dynamically
  const trendingRank = useMemo(() => {
    if (!products || products.length === 0) return '#1';
    const sorted = [...products].sort((a, b) => {
      const scoreA = (a.upvotes || 0) * 3 + (a.views || 0);
      const scoreB = (b.upvotes || 0) * 3 + (b.views || 0);
      return scoreB - scoreA;
    });
    const idx = sorted.findIndex((p) => p.id === product.id);
    return idx !== -1 ? `#${idx + 1}` : '#1';
  }, [products, product.id]);

  // 1:1 Direct Message with product maker
  const handleAuthorDm = () => {
    requireAuth(() => {
      const targetBuilder =
        builders.find(
          (b) =>
            (product.authorId && b.id === product.authorId) ||
            (product.authorEmail && b.email && b.email.toLowerCase() === product.authorEmail.toLowerCase()) ||
            (product.authorId && b.email && b.email.toLowerCase() === product.authorId.toLowerCase())
        ) || {
          id: product.authorId || (product.authorEmail ? 'builder-' + product.authorEmail : 'builder-' + product.id),
          name: product.author,
          email: product.authorEmail,
          role: '인디 메이커',
          bio: `'${product.title}'의 제작자입니다.`,
          avatar: product.icon || '/demon-mascot.png',
          buildingApp: product.title,
          tags: product.tags || [],
          followersCount: 1,
          followingCount: 0,
        };

      openDmWithBuilder(targetBuilder);
    }, `${product.author}님에게 1:1 DM을 보내려면 먼저 Google 로그인이 필요합니다.`);
  };

  // Automatically increment view count once per browser session
  useEffect(() => {
    if (product?.id) {
      incrementProductViews(product.id);
    }
  }, [product?.id, incrementProductViews]);

  // Check if current user is author (Strict: only unique ID or verified email, NEVER by display name!)
  const isAuthor =
    user.isLoggedIn &&
    Boolean(
      (product.authorId && user.id && product.authorId === user.id) ||
      (product.authorEmail && user.email && product.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
      (user.email && product.authorId && product.authorId.toLowerCase() === user.email.toLowerCase())
    );

  // 3-Day Cooldown Constants
  const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
  const lastBumpTime = new Date(product.bumpedAt || product.createdAtRaw || product.createdAt || 0).getTime();
  const diffMs = Date.now() - lastBumpTime;
  const canBump = isAuthor && (isNaN(lastBumpTime) || diffMs >= COOLDOWN_MS);
  const remainingMs = Math.max(0, COOLDOWN_MS - diffMs);
  const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const remainingMins = Math.floor((remainingMs % (60 * 1000)) / (60 * 1000));

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(product.title);
  const [editTagline, setEditTagline] = useState(product.tagline);
  const [editDescription, setEditDescription] = useState(product.description || product.instructions || '');
  const [editCategory, setEditCategory] = useState(product.category || '생산성');
  const [editUrl, setEditUrl] = useState(product.url);
  const [editIconUrl, setEditIconUrl] = useState(product.icon);
  const [editGallery, setEditGallery] = useState<string[]>(product.gallery || (product.screenshot ? [product.screenshot] : []));
  const [editNewGalleryUrl, setEditNewGalleryUrl] = useState('');
  const [editDemoVideo, setEditDemoVideo] = useState(product.demoVideo || '');
  const [editTwitter, setEditTwitter] = useState(product.socialLinks?.twitter || '');
  const [editGithub, setEditGithub] = useState(product.socialLinks?.github || '');
  const [editYoutube, setEditYoutube] = useState(product.socialLinks?.youtube || '');
  const [editTags, setEditTags] = useState<string[]>(product.tags || []);
  const [editTagInput, setEditTagInput] = useState('');

  // Handle Product Deletion
  const handleDeleteProduct = () => {
    if (window.confirm(`정말 '${product.title}' 제품을 삭제하시겠습니까?\n등록된 피드백도 함께 삭제됩니다.`)) {
      deleteProduct(product.id);
      onClose();
    }
  };

  // Handle Product Update
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editUrl.trim()) {
      showToast('제품 이름과 URL을 입력해주세요.');
      return;
    }

    updateProduct({
      ...product,
      title: editTitle.trim(),
      tagline: editTagline.trim(),
      description: editDescription.trim(),
      instructions: editDescription.trim() || product.instructions,
      category: editCategory || '생산성',
      url: editUrl.startsWith('http') ? editUrl.trim() : 'https://' + editUrl.trim(),
      icon: editIconUrl.trim() || '/demon-mascot.png',
      screenshot: editGallery[0] || product.screenshot,
      gallery: editGallery.slice(0, 5),
      demoVideo: editDemoVideo.trim(),
      tags: editTags,
      socialLinks: {
        twitter: editTwitter.trim() || undefined,
        github: editGithub.trim() || undefined,
        youtube: editYoutube.trim() || undefined,
      },
    });

    setIsEditing(false);
    showToast('제품 정보가 성공적으로 수정되었습니다.');
  };

  const handleAddEditGalleryUrl = () => {
    if (!editNewGalleryUrl.trim()) return;
    if (editGallery.length >= 5) {
      showToast('갤러리 이미지는 최대 5장까지만 등록할 수 있습니다.');
      return;
    }
    setEditGallery([...editGallery, editNewGalleryUrl.trim()]);
    setEditNewGalleryUrl('');
  };

  const handleEditTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = editTagInput.trim().replace(/^#/, '').replace(/,/g, '');
      if (val && !editTags.includes(val)) {
        if (editTags.length >= 8) {
          showToast('태그는 최대 8개까지 추가할 수 있습니다.');
          return;
        }
        setEditTags([...editTags, val]);
        setEditTagInput('');
      }
    }
  };

  // Submit Feedback handler
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    requireAuth(() => {
      setIsSubmittingFeedback(true);
      try {
        addFeedback(product.id, {
          productId: product.id,
          author: user.name || '데몬테스터',
          authorId: user.id || user.email,
          avatar: user.avatar || '/demon-mascot.png',
          rating,
          content: content.trim(),
          deviceInfo,
          screenshot: feedbackScreenshot || undefined,
        });
        setContent('');
        setFeedbackScreenshot('');
        setIsSubmittingFeedback(false);
        setIsFeedbackFormOpen(false);
        showToast('🎉 소중한 피드백이 성공적으로 등록되었습니다!');
      } catch {
        setIsSubmittingFeedback(false);
        showToast('피드백 등록 중 오류가 발생했습니다.');
      }
    }, '피드백을 작성하려면 로그인이 필요합니다.');
  };

  // Copy Promo Link
  const promoUrl = `https://demonst.vercel.app/go/${product.slug || product.id}`;
  const handleCopyPromo = () => {
    navigator.clipboard.writeText(promoUrl);
    setCopiedPromo(true);
    showToast('프로모션 링크가 클립보드에 복사되었습니다!');
    setTimeout(() => setCopiedPromo(false), 2000);
  };

  // Copy Badge Code
  const badgeEmbedCode =
    embedTheme === 'light'
      ? `<a href="https://demonst.vercel.app" target="_blank" rel="noopener noreferrer"><img src="https://demonst.vercel.app/demon-mascot.png" width="160" alt="Published on demonst" /></a>`
      : `<a href="https://demonst.vercel.app" target="_blank" rel="noopener noreferrer"><img src="https://demonst.vercel.app/demon-mascot.png" width="160" alt="Published on demonst" /></a>`;

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(badgeEmbedCode);
    setCopiedBadge(true);
    showToast('임베드 뱃지 코드가 복사되었습니다!');
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  // Tab items configuration matching Screenshots
  const tabs: Array<{ id: TabType; label: string; count?: number }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'feedback', label: 'Feedback', count: productFeedbacks.length },
    { id: 'comments', label: 'Comments', count: comments.length },
    { id: 'timeline', label: 'Timeline' },
    { id: 'insights', label: 'Insights' },
    { id: 'collaborators', label: 'Collaborators' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div
        className="dark relative w-full max-w-[780px] max-h-[92vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#0B0F17] text-zinc-100 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Control Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800/80 bg-[#0B0F17]/90 px-4 sm:px-6 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {isEditing ? '제품 수정' : '앱 테스트 & 분석'}
            </span>
            <span className="text-[11px] text-zinc-400">demonst verified</span>
            {isAuthor && !isEditing && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                내가 등록한 제품
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {isAuthor && !isEditing && (
              <>
                {canBump ? (
                  <button
                    type="button"
                    onClick={() => bumpProduct(product.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-3 py-1 text-xs font-bold text-white shadow-sm cursor-pointer animate-pulse"
                    title="3일 주기 상단 끌어올리기! 클릭 시 최상단으로 재배치됩니다."
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>상단 끌어올리기</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => bumpProduct(product.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:border-zinc-700 transition-colors cursor-pointer"
                    title={`3일마다 1회 상단 끌어올리기가 가능합니다. (다음 가능: ${remainingDays > 0 ? `${remainingDays}일 ${remainingHours}시간 후` : `${remainingHours}시간 ${remainingMins}분 후`})`}
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      {remainingDays > 0
                        ? `부스트 D-${remainingDays} (${remainingHours}h)`
                        : `부스트 ${remainingHours}h ${remainingMins}m`}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>수정</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>삭제</span>
                </button>
              </>
            )}

            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                취소
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* EDIT MODE FORM (When Author clicks [수정])                   */}
        {/* ============================================================ */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="p-6 flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">제품 이름 *</label>
              <input
                type="text"
                required
                maxLength={40}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-white font-bold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">한줄소개 (0/60자)</label>
              <input
                type="text"
                maxLength={60}
                value={editTagline}
                onChange={(e) => setEditTagline(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300">제품 상세 설명 (마크다운 지원)</label>
                <span className="text-[11px] text-zinc-500">{editDescription.length}/3,000자</span>
              </div>
              <textarea
                rows={8}
                maxLength={3000}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs text-white focus:border-blue-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">카테고리</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="생산성">생산성</option>
                  <option value="AI">AI</option>
                  <option value="개발자 도구">개발자 도구</option>
                  <option value="교육 / 학습">교육 / 학습</option>
                  <option value="커뮤니티 / 소셜">커뮤니티 / 소셜</option>
                  <option value="라이프스타일 / 건강">라이프스타일 / 건강</option>
                  <option value="금융 / 핀테크">금융 / 핀테크</option>
                  <option value="게임 / 엔터">게임 / 엔터</option>
                  <option value="유틸리티 / 도구">유틸리티 / 도구</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">제품 URL *</label>
                <input
                  type="url"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <ImageUploader
                label="앱 로고 / 썸네일 이미지"
                value={editIconUrl}
                onChange={(u) => setEditIconUrl(u)}
                aspectRatio="square"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300">갤러리 이미지 (최대 5장)</label>
                <span className="text-[11px] text-zinc-500">{editGallery.length}/5장</span>
              </div>

              {editGallery.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  {editGallery.map((imgUrl, i) => (
                    <div key={i} className="relative aspect-video rounded-lg border border-zinc-800 overflow-hidden group">
                      <img src={imgUrl} alt={`갤러리 ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditGallery(editGallery.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {editGallery.length < 5 && (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={editNewGalleryUrl}
                    onChange={(e) => setEditNewGalleryUrl(e.target.value)}
                    placeholder="새 갤러리 이미지 URL 입력 후 추가"
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditGalleryUrl}
                    className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    추가
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">데모 영상 링크 (선택)</label>
              <input
                type="url"
                value={editDemoVideo}
                onChange={(e) => setEditDemoVideo(e.target.value)}
                placeholder="YouTube · Vimeo · Loom 영상 링크"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">X (트위터)</label>
                <input
                  type="url"
                  value={editTwitter}
                  onChange={(e) => setEditTwitter(e.target.value)}
                  placeholder="https://x.com/..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">GitHub</label>
                <input
                  type="url"
                  value={editGithub}
                  onChange={(e) => setEditGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">YouTube</label>
                <input
                  type="url"
                  value={editYoutube}
                  onChange={(e) => setEditYoutube(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">런칭 태그</label>
              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-400 text-xs px-2.5 py-0.5 font-semibold border border-blue-500/20"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setEditTags(editTags.filter((t) => t !== tag))}
                        className="hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={editTagInput}
                onChange={(e) => setEditTagInput(e.target.value)}
                onKeyDown={handleEditTagKeyDown}
                placeholder="엔터(Enter)나 쉼표로 태그 추가"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>수정 완료 저장</span>
              </button>
            </div>
          </form>
        ) : (
          /* ============================================================ */
          /* NORMAL VIEW MODE                                             */
          /* ============================================================ */
          <div>
            {/* 1. Product Hero Banner */}
            <div className="p-5 sm:p-6 pb-4 border-b border-zinc-800/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <ProductLogo
                    src={product.icon}
                    title={product.title}
                    url={product.url}
                    sizeClass="size-14 sm:size-16"
                  />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight break-words">
                      {product.title}
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-zinc-400 break-words leading-relaxed">
                      {product.tagline}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2.5 text-xs text-zinc-400 flex-wrap">
                      <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                        <span>제작: <strong className="font-bold text-white">{product.author}</strong></span>
                        {(!user.isLoggedIn || !isAuthor) && (
                          <button
                            type="button"
                            onClick={handleAuthorDm}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-400 px-2 py-0.5 text-[10px] font-bold border border-blue-500/25 transition-all cursor-pointer shadow-2xs"
                            title={`${product.author}님에게 1:1 DM 보내기`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>DM 보내기</span>
                          </button>
                        )}
                      </span>
                      {product.category && (
                        <>
                          <span className="text-zinc-600">·</span>
                          <span className="text-zinc-300">{product.category}</span>
                        </>
                      )}
                      <span className="text-zinc-600">·</span>
                      <span className="inline-flex items-center gap-1 font-medium text-zinc-400">
                        <Eye className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{product.views || 0}</span>
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>{product.upvotes || 0}</span>
                      </span>
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {product.tags.slice(0, 4).map((t) => (
                            <span key={t} className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400 border border-zinc-800">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upvote & Open App Link Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => toggleProductUpvote(product.id)}
                    title={isProductUpvoted(product.id) ? '추천 취소' : '이 앱 추천하기'}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition-all border cursor-pointer ${
                      isProductUpvoted(product.id)
                        ? 'bg-rose-500 border-rose-600 text-white shadow-rose-500/20'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-rose-500/40 hover:text-rose-400'
                    }`}
                  >
                    <ChevronUp className={`w-4 h-4 transition-transform ${isProductUpvoted(product.id) ? 'scale-125' : ''}`} />
                    <span>추천 {product.upvotes || 0}</span>
                  </button>

                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors shrink-0"
                  >
                    <span>웹사이트 방문</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* 2. Top Tab Navigation Bar (Matches Screenshots 6, 5, 4, 3) */}
            <div className="sticky top-[49px] z-20 flex items-center gap-6 border-b border-zinc-800/80 bg-[#0B0F17]/95 px-6 overflow-x-auto no-scrollbar backdrop-blur-md">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative py-3.5 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      isActive ? 'text-blue-500 font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-1 text-xs text-zinc-500 font-normal">({tab.count})</span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 3. Tab Contents */}
            <div className="p-5 sm:p-6 min-h-[360px]">
              {/* ============================================================ */}
              {/* TAB 1: OVERVIEW                                              */}
              {/* ============================================================ */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Demo Video if available */}
                  {product.demoVideo && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <div className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-blue-400" />
                        <span>데모 영상</span>
                      </div>
                      <a
                        href={product.demoVideo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600/10 text-blue-400 px-3.5 py-2 text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>데모 영상 보러가기 ({product.demoVideo.slice(0, 45)}...)</span>
                      </a>
                    </div>
                  )}

                  {/* Screenshot & Gallery Preview */}
                  {(product.screenshot || (product.gallery && product.gallery.length > 0)) && (
                    <div>
                      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 max-h-[340px]">
                        <img
                          src={product.screenshot || product.gallery?.[0]}
                          alt={`${product.title} 사이트 스크린샷`}
                          loading="lazy"
                          className="w-full h-auto object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      {product.gallery && product.gallery.length > 1 && (
                        <div className="mt-2.5 grid grid-cols-5 gap-2">
                          {product.gallery.map((gImg, i) => (
                            <a
                              key={i}
                              href={gImg}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="aspect-video rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900 hover:border-blue-500 transition-colors"
                            >
                              <img src={gImg} alt={`미리보기 ${i + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detailed Description with AI Report */}
                  {product.description && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-400" />
                          <span>제품 상세 소개 및 심층 분석</span>
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          AI 자동 크롤링 분석
                        </span>
                      </div>
                      <MarkdownRenderer content={product.description} />
                    </div>
                  )}

                  {/* Test Instructions Section */}
                  {product.instructions && product.instructions.trim() !== product.description?.trim() && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>📋 테스트 지시사항 & 중점 요청</span>
                      </h3>
                      <div className="mt-3 text-xs leading-relaxed text-zinc-300 whitespace-pre-line font-normal">
                        {product.instructions}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 2: FEEDBACK (Matches Screenshot 5)                       */}
              {/* ============================================================ */}
              {activeTab === 'feedback' && (
                <div className="space-y-5">
                  {/* + Give Feedback Button (Matching Screenshot 5) */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIsFeedbackFormOpen(!isFeedbackFormOpen)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Give Feedback</span>
                    </button>
                    <span className="text-xs text-zinc-400">
                      총 {productFeedbacks.length}개의 피드백 등록됨
                    </span>
                  </div>

                  {/* Feedback Form Modal / Drawer */}
                  {isFeedbackFormOpen && (
                    <div className="rounded-xl border border-blue-500/30 bg-zinc-900/90 p-5 shadow-lg animate-in fade-in duration-150">
                      <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-3">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>✍️ 피드백 남기기</span>
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                          <span>평점:</span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="focus:outline-none cursor-pointer"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={handleSubmitFeedback} className="flex flex-col gap-3.5">
                        <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                          <span>테스트 환경:</span>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="device"
                              value="Windows Chrome"
                              checked={deviceInfo === 'Windows Chrome'}
                              onChange={(e) => setDeviceInfo(e.target.value)}
                              className="text-blue-500"
                            />
                            <span>PC 브라우저</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="device"
                              value="Mobile Safari"
                              checked={deviceInfo === 'Mobile Safari'}
                              onChange={(e) => setDeviceInfo(e.target.value)}
                              className="text-blue-500"
                            />
                            <span>모바일</span>
                          </label>
                        </div>

                        <textarea
                          required
                          rows={3}
                          placeholder={
                            user.isLoggedIn
                              ? '서비스를 직접 둘러보신 후 버그, 사용성, 개선 아이디어 등 솔직한 피드백을 남겨주세요.'
                              : '의견을 입력해주세요 (제출 시 간편 로그인이 진행됩니다).'
                          }
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none leading-relaxed"
                        />

                        <ImageUploader
                          label="스크린샷 / 캡처 첨부 (선택)"
                          value={feedbackScreenshot}
                          onChange={(u) => setFeedbackScreenshot(u)}
                          aspectRatio="video"
                        />

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => setIsFeedbackFormOpen(false)}
                            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                          >
                            닫기
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingFeedback || !content.trim()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>{isSubmittingFeedback ? '전송 중...' : '피드백 등록하기'}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Feedback List */}
                  {productFeedbacks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
                      아직 등록된 피드백이 없습니다. 위의 <strong className="text-blue-400">+ Give Feedback</strong> 버튼을 눌러 첫 번째 테스터가 되어보세요!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {productFeedbacks.map((fb) => (
                        <div
                          key={fb.id}
                          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={fb.avatar || '/demon-mascot.png'}
                                alt={fb.author}
                                className="h-6 w-6 rounded-full object-cover border border-zinc-800"
                              />
                              <span className="text-xs font-bold text-white">{fb.author}</span>
                              <span className="text-[10px] text-zinc-500">· {fb.deviceInfo}</span>
                              <span className="text-[10px] text-zinc-500">· {fb.createdAt}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                                    }`}
                                  />
                                ))}
                              </div>
                              {user.isLoggedIn &&
                                Boolean(
                                  (fb.authorId && fb.authorId === user.id) ||
                                    (fb.authorEmail &&
                                      user.email &&
                                      fb.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
                                    (user.email && (fb.authorId === user.email || fb.author === user.email))
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm('피드백을 삭제하시겠습니까?')) {
                                        deleteFeedback(product.id, fb.id);
                                      }
                                    }}
                                    className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors ml-1 cursor-pointer"
                                    title="피드백 삭제"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed pl-8 break-words">
                            {fb.content}
                          </p>
                          {fb.screenshot && (
                            <div className="pl-8 pt-1">
                              <img
                                src={fb.screenshot}
                                alt="Feedback Screenshot"
                                className="rounded-lg max-h-40 border border-zinc-800 object-cover"
                              />
                            </div>
                          )}

                          {/* Reply Section */}
                          {(() => {
                            const replies = feedbackReplies[fb.id] || [];
                            const isReplying = replyingFeedbackId === fb.id;
                            return (
                              <div className="pl-8 pt-1 space-y-2">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setReplyingFeedbackId(isReplying ? null : fb.id)}
                                    className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                                      isReplying ? 'text-blue-400' : 'text-zinc-500 hover:text-blue-400'
                                    }`}
                                  >
                                    <CornerDownRight className="w-3 h-3" />
                                    <span>답글 달기{replies.length > 0 ? ` (${replies.length})` : ''}</span>
                                  </button>
                                </div>

                                {replies.length > 0 && (
                                  <div className="pl-3 border-l-2 border-blue-500/25 space-y-2 mt-1.5">
                                    {replies.map((reply) => (
                                      <div
                                        key={reply.id}
                                        className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 flex flex-col gap-1"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <CornerDownRight className="w-3 h-3 text-blue-400 shrink-0" />
                                            <img
                                              src={reply.avatar || '/demon-mascot.png'}
                                              alt={reply.author}
                                              className="w-4 h-4 rounded-full object-cover shrink-0 border border-zinc-800"
                                            />
                                            <span className="text-[11px] font-bold text-white truncate">{reply.author}</span>
                                            {reply.isMaker && (
                                              <span className="rounded-full bg-blue-500/15 text-blue-400 px-1.5 py-0.2 text-[9px] font-bold shrink-0">
                                                메이커
                                              </span>
                                            )}
                                            <span className="text-[10px] text-zinc-500 shrink-0">· {reply.createdAt}</span>
                                          </div>
                                          {user.isLoggedIn &&
                                            ((reply.authorId && reply.authorId === user.id) ||
                                              (reply.authorEmail &&
                                                user.email &&
                                                reply.authorEmail.toLowerCase() === user.email.toLowerCase())) && (
                                              <button
                                                type="button"
                                                onClick={() => deleteFeedbackReply(fb.id, reply.id)}
                                                className="text-zinc-500 hover:text-rose-400 p-0.5 cursor-pointer"
                                                title="답글 삭제"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-300 leading-relaxed pl-5 break-words">
                                          {reply.content}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {isReplying && (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      const txt = (replyContentMap[fb.id] || '').trim();
                                      if (!txt) return;
                                      addFeedbackReply(product.id, fb.id, txt);
                                      setReplyContentMap((prev) => ({ ...prev, [fb.id]: '' }));
                                      setReplyingFeedbackId(null);
                                    }}
                                    className="flex items-center gap-1.5 pt-1"
                                  >
                                    <input
                                      type="text"
                                      autoFocus
                                      placeholder={`${fb.author}님에게 답글 작성...`}
                                      value={replyContentMap[fb.id] || ''}
                                      onChange={(e) =>
                                        setReplyContentMap((prev) => ({ ...prev, [fb.id]: e.target.value }))
                                      }
                                      className="flex-1 rounded-lg border border-blue-500/40 bg-zinc-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                                    />
                                    <button
                                      type="submit"
                                      disabled={!(replyContentMap[fb.id] || '').trim()}
                                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                                    >
                                      답글
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setReplyingFeedbackId(null)}
                                      className="rounded-lg border border-zinc-800 px-2 py-1.5 text-[11px] font-medium text-zinc-400 hover:text-white shrink-0 cursor-pointer"
                                    >
                                      취소
                                    </button>
                                  </form>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 3: COMMENTS (Matches Screenshot 4)                       */}
              {/* ============================================================ */}
              {activeTab === 'comments' && (
                <div className="space-y-5">
                  {/* Leave a comment. [Post] Input Box (Matching Screenshot 4) */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Leave a comment."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handlePostComment();
                        }
                      }}
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handlePostComment}
                      disabled={!commentInput.trim()}
                      className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 text-sm transition-colors cursor-pointer shrink-0 shadow-sm"
                    >
                      Post
                    </button>
                  </div>

                  {/* Comments List */}
                  {comments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
                      아직 등록된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={comment.avatar || '/demon-mascot.png'}
                                alt={comment.author}
                                className="w-6 h-6 rounded-full object-cover border border-zinc-800"
                              />
                              <span className="text-xs font-bold text-white">{comment.author}</span>
                              <span className="text-[10px] text-zinc-500">· {comment.createdAt}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleCommentLike(comment.id)}
                                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors cursor-pointer ${
                                  comment.userLiked
                                    ? 'text-rose-400 bg-rose-500/10'
                                    : 'text-zinc-400 hover:text-rose-400'
                                }`}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 ${
                                    comment.userLiked ? 'fill-rose-400 text-rose-400' : ''
                                  }`}
                                />
                                <span>{comment.likes || 0}</span>
                              </button>

                              {user.isLoggedIn &&
                                Boolean(
                                  (comment.authorId && comment.authorId === user.id) ||
                                    (comment.authorEmail &&
                                      user.email &&
                                      comment.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
                                    (user.email &&
                                      (comment.authorId === user.email || comment.author === user.email))
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                                    title="댓글 삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                            </div>
                          </div>

                          <p className="text-xs text-zinc-300 leading-relaxed pl-8 break-words">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 4: TIMELINE                                              */}
              {/* ============================================================ */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  {/* Timeline Header & Add Update button for author */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>프로덕트 타임라인 & 개발 일지</span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        런칭부터 마일스톤 달성, 업데이트까지의 역사를 한눈에 확인합니다.
                      </p>
                    </div>

                    {isAuthor && (
                      <button
                        type="button"
                        onClick={() => setIsAddingUpdate(!isAddingUpdate)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-400 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>업데이트 기록</span>
                      </button>
                    )}
                  </div>

                  {/* Add Update Form for Maker */}
                  {isAddingUpdate && (
                    <form onSubmit={handleAddTimelineUpdate} className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1">업데이트 제목</label>
                        <input
                          type="text"
                          required
                          placeholder="예: v1.1 주요 성능 개선 및 버그 수정"
                          value={newUpdateTitle}
                          onChange={(e) => setNewUpdateTitle(e.target.value)}
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1">업데이트 상세 내용</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="어떤 기능이 추가되었거나 개선되었는지 메이커 노트를 남겨보세요."
                          value={newUpdateDesc}
                          onChange={(e) => setNewUpdateDesc(e.target.value)}
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none leading-relaxed"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingUpdate(false)}
                          className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                        >
                          저장하기
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Timeline Stream */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-800">
                    {timelineEvents.map((evt) => (
                      <div key={evt.id} className="relative group">
                        <div className="absolute -left-6 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 border-2 border-blue-500 text-blue-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors group-hover:border-zinc-700">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              {evt.title}
                            </h4>
                            <span className="text-[10px] text-zinc-500">{evt.date}</span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {evt.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 5: INSIGHTS (Matches Screenshots 3, 2, 1)                */}
              {/* ============================================================ */}
              {activeTab === 'insights' && (
                <div className="space-y-6">
                  {/* Blue Banner (Matching Screenshot 3) */}
                  <div className="rounded-xl border border-blue-900/60 bg-blue-950/40 p-4 text-xs text-blue-300 leading-relaxed shadow-sm">
                    This is a preview of the Insights tab, visible only to the project owner. Post your own project to see views, likes, trending rank, and traffic sources for yourself.
                  </div>

                  {/* 5 Metric Cards in a row (Matching Screenshot 3) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                      <div className="text-[11px] text-zinc-400">Total views</div>
                      <div className="mt-2 text-xl font-extrabold text-white">
                        {product.views || 0}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                      <div className="text-[11px] text-zinc-400">Total likes</div>
                      <div className="mt-2 text-xl font-extrabold text-white">
                        {product.upvotes || 0}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                      <div className="text-[11px] text-zinc-400">Trending rank</div>
                      <div className="mt-2 text-xl font-extrabold text-white">
                        {trendingRank}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                      <div className="text-[11px] text-zinc-400">Comments</div>
                      <div className="mt-2 text-xl font-extrabold text-white">
                        {comments.length}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 col-span-2 sm:col-span-1">
                      <div className="text-[11px] text-zinc-400">Feedback</div>
                      <div className="mt-2 text-xl font-extrabold text-white">
                        {productFeedbacks.length}
                      </div>
                    </div>
                  </div>

                  {/* ✨ This week (Matching Screenshot 3) */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>This week</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Only visible to this project's owner.
                    </div>
                  </div>

                  {/* 🔗 Promo tracking link (Matching Screenshot 3) */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Promo tracking link</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Share this link when promoting on Reddit, Disquiet, etc. Even if visitors end up on your own website, demonst still captures where they came from.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        readOnly
                        value={promoUrl}
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-300 font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPromo}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer shrink-0"
                      >
                        {copiedPromo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPromo ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="text-[11px] text-zinc-500 pt-0.5">
                      Only visible to this project's owner.
                    </div>
                  </div>

                  {/* </> Embed badge (Matching Screenshot 3) */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-blue-400" />
                        <span>Embed badge</span>
                      </div>
                      <div className="flex items-center rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setEmbedTheme('light')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                            embedTheme === 'light' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Light
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmbedTheme('dark')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                            embedTheme === 'dark' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Paste this into your website or README to show you're on demonst. Most people put it near the top of their landing page or in the footer.
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      {/* Badge Preview */}
                      <div
                        className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all ${
                          embedTheme === 'light'
                            ? 'bg-white text-zinc-900 border-zinc-300 shadow-sm'
                            : 'bg-zinc-950 text-white border-zinc-800 shadow-sm'
                        }`}
                      >
                        <img src="/demon-mascot.png" alt="demonst" className="w-6 h-6 object-contain" />
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-500">
                            PUBLISHED ON
                          </span>
                          <span className="text-xs font-black tracking-tight leading-none">
                            demonst
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyBadge}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        {copiedBadge ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy code</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-zinc-500 pt-0.5">
                      Only the project owner can copy the badge code.
                    </div>
                  </div>

                  {/* Conversion rate over time (Matching Screenshot 2) */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="text-xs font-bold text-white">Conversion rate over time</div>
                    <div className="text-[11px] text-zinc-400">Cumulative likes divided by cumulative views.</div>

                    {/* SVG Curve Chart */}
                    <div className="h-28 w-full pt-2">
                      <svg viewBox="0 0 400 90" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="crGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="20" x2="400" y2="20" stroke="#27272A" strokeDasharray="3 3" />
                        <line x1="0" y1="50" x2="400" y2="50" stroke="#27272A" strokeDasharray="3 3" />
                        <line x1="0" y1="80" x2="400" y2="80" stroke="#27272A" strokeDasharray="3 3" />
                        <path
                          d="M 0 65 Q 80 58, 160 50 T 320 35 T 400 25 L 400 90 L 0 90 Z"
                          fill="url(#crGradient)"
                        />
                        <path
                          d="M 0 65 Q 80 58, 160 50 T 320 35 T 400 25"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="2.5"
                        />
                        <circle cx="400" cy="25" r="3.5" fill="#3B82F6" />
                      </svg>
                    </div>

                    <div className="text-[11px] text-zinc-500 pt-1">
                      Only visible to this project's owner.
                    </div>
                  </div>

                  {/* Activity over time (Matching Screenshot 2) */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="text-xs font-bold text-white">Activity over time</div>
                    <div className="text-[11px] text-zinc-400">
                      We started logging today, so this starts from your current total and tracks changes from here on.
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setActivityMetric('views')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                          activityMetric === 'views'
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        Views
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityMetric('likes')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                          activityMetric === 'likes'
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        Likes
                      </button>
                    </div>

                    {/* Dynamic SVG activity chart */}
                    <div className="h-28 w-full pt-2">
                      <svg viewBox="0 0 400 90" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="actGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="20" x2="400" y2="20" stroke="#27272A" strokeDasharray="3 3" />
                        <line x1="0" y1="50" x2="400" y2="50" stroke="#27272A" strokeDasharray="3 3" />
                        <line x1="0" y1="80" x2="400" y2="80" stroke="#27272A" strokeDasharray="3 3" />
                        <path
                          d="M 0 75 Q 100 65, 200 45 T 400 30 L 400 90 L 0 90 Z"
                          fill="url(#actGradient)"
                        />
                        <path
                          d="M 0 75 Q 100 65, 200 45 T 400 30"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                        />
                        <circle cx="400" cy="30" r="3.5" fill="#10B981" />
                      </svg>
                    </div>

                    <div className="text-[11px] text-zinc-500 pt-1">
                      Only visible to this project's owner.
                    </div>
                  </div>

                  {/* Trending rank over time (Matching Screenshot 2) */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="text-xs font-bold text-white">Trending rank over time</div>
                    <div className="h-24 w-full pt-2">
                      <svg viewBox="0 0 400 80" className="w-full h-full overflow-visible">
                        <line x1="0" y1="20" x2="400" y2="20" stroke="#27272A" strokeDasharray="3 3" />
                        <line x1="0" y1="50" x2="400" y2="50" stroke="#27272A" strokeDasharray="3 3" />
                        <path
                          d="M 0 60 Q 120 50, 240 35 T 400 20"
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="2.5"
                        />
                        <circle cx="400" cy="20" r="3.5" fill="#8B5CF6" />
                      </svg>
                    </div>
                    <div className="text-[11px] text-zinc-500 pt-1">
                      Only visible to this project's owner.
                    </div>
                  </div>

                  {/* Traffic sources Donut Chart (Matching Screenshot 1) */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                    <div className="text-xs font-bold text-white">Traffic sources</div>
                    <div className="text-[11px] text-zinc-400">Combines project page views and promo link clicks.</div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
                      {/* SVG Donut */}
                      <div className="relative w-28 h-28 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          {/* Background Track */}
                          <path
                            className="text-zinc-800"
                            strokeWidth="4"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          {/* Segment 1: From demonst 45% */}
                          <path
                            stroke="#3B82F6"
                            strokeWidth="4"
                            strokeDasharray="45, 100"
                            strokeDashoffset="0"
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          {/* Segment 2: From search engines 25% */}
                          <path
                            stroke="#10B981"
                            strokeWidth="4"
                            strokeDasharray="25, 100"
                            strokeDashoffset="-45"
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          {/* Segment 3: From social media 18% */}
                          <path
                            stroke="#8B5CF6"
                            strokeWidth="4"
                            strokeDasharray="18, 100"
                            strokeDashoffset="-70"
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          {/* Segment 4: Direct visit 12% */}
                          <path
                            stroke="#F59E0B"
                            strokeWidth="4"
                            strokeDasharray="12, 100"
                            strokeDashoffset="-88"
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>

                      {/* Legend */}
                      <div className="grid grid-cols-1 gap-2 text-xs text-zinc-300 w-full">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            <span>From demonst</span>
                          </span>
                          <span className="font-bold text-white">45%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span>From search engines</span>
                          </span>
                          <span className="font-bold text-white">25%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                            <span>From social media</span>
                          </span>
                          <span className="font-bold text-white">18%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span>Direct visit</span>
                          </span>
                          <span className="font-bold text-white">12%</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-500 pt-1">
                      Only visible to this project's owner.
                    </div>
                  </div>

                  {/* People who liked this (Matching Screenshot 1) */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>People who liked this</span>
                    </div>

                    {product.upvotes && product.upvotes > 0 ? (
                      <div className="space-y-2.5">
                        {Array.from({ length: Math.min(product.upvotes, 5) }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                              {i === 0 && isProductUpvoted(product.id) ? (
                                <img src={user.avatar || '/demon-mascot.png'} alt="user" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span>{String.fromCharCode(65 + i)}</span>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">
                                {i === 0 && isProductUpvoted(product.id) ? (user.name || '나 (Current User)') : `Supporter ${i + 1}`}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                Verified Demonst Builder
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 py-2">
                        아직 추천한 유저가 없습니다. 상단의 추천 버튼을 눌러 첫 번째 후원자가 되어보세요!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 6: COLLABORATORS                                         */}
              {/* ============================================================ */}
              {activeTab === 'collaborators' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>프로덕트 메이커 & 협업자</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      이 프로젝트를 만들고 운영 중인 빌더 및 팀원 정보입니다.
                    </p>
                  </div>

                  {/* Main Maker Profile Card */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                    <div className="flex items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={product.icon || '/demon-mascot.png'}
                          alt={product.author}
                          className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/30"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{product.author}</h4>
                            <span className="rounded-full bg-blue-500/15 text-blue-400 text-[10px] px-2 py-0.5 font-bold border border-blue-500/25">
                              파운더 / 메이커
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            '{product.title}'의 제작자입니다.
                          </p>
                        </div>
                      </div>

                      {(!user.isLoggedIn || !isAuthor) && (
                        <button
                          type="button"
                          onClick={handleAuthorDm}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>1:1 DM 보내기</span>
                        </button>
                      )}
                    </div>

                    {/* Social profiles */}
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-4 text-xs">
                      {product.socialLinks?.twitter && (
                        <a
                          href={product.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-blue-400 font-medium"
                        >
                          X (Twitter)
                        </a>
                      )}
                      {product.socialLinks?.github && (
                        <a
                          href={product.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-blue-400 font-medium"
                        >
                          GitHub
                        </a>
                      )}
                      {product.socialLinks?.youtube && (
                        <a
                          href={product.socialLinks.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-blue-400 font-medium"
                        >
                          YouTube
                        </a>
                      )}
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline font-bold"
                      >
                        공식 웹사이트 ↗
                      </a>
                    </div>
                  </div>

                  {/* Team / Collaborators info card */}
                  <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-400 leading-relaxed">
                    <p>현재 1명의 메이커가 이 프로덕트를 주도적으로 개발 및 운영하고 있습니다.</p>
                    <p className="mt-1 text-zinc-500">
                      협업이나 기여, 팀원 합류에 관심이 있으시다면 위의 <strong>1:1 DM 보내기</strong>를 통해 메이커에게 직접 제안해보세요.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
