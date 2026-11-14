import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Star,
  CheckCircle,
  Smartphone,
  Monitor,
  Send,
  MessageSquare,
  Image as ImageIcon,
  LogIn,
  Play,
  Globe,
  Edit3,
  Trash2,
  Save,
  Plus,
  Eye,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Product } from '../types';
import { ImageUploader } from './ImageUploader';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const {
    feedbacks,
    addFeedback,
    updateProduct,
    deleteProduct,
    deleteFeedback,
    incrementProductViews,
    toggleProductUpvote,
    isProductUpvoted,
    user,
    requireAuth,
    setIsLoginModalOpen,
    showToast,
    builders,
    openDmWithBuilder,
  } = useApp();
  const productFeedbacks = feedbacks[product.id] || feedbacks[product.slug] || [];

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

  // Check if current user is the owner/author of this product (strictly by ID or Email)
  const isAuthor =
    user.isLoggedIn &&
    Boolean(
      (product.authorId && product.authorId === user.id) ||
      (product.authorEmail && user.email && product.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
      (user.email && (product.authorId === user.email || product.author === user.email))
    );

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

  // Feedback form states
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('Windows Chrome');
  const [feedbackScreenshot, setFeedbackScreenshot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    requireAuth(() => {
      setIsSubmitting(true);
      setTimeout(() => {
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
        setIsSubmitting(false);
      }, 400);
    }, '피드백을 작성하려면 로그인이 필요합니다.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-[760px] max-h-[92vh] overflow-y-auto rounded-card border border-border bg-surface shadow-elevated transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/90 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-pill bg-brand-subtle text-accent">
              {isEditing ? '제품 수정' : '앱 테스트'}
            </span>
            <span className="text-xs text-fg-muted">demonst verified</span>
            {isAuthor && !isEditing && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                내가 등록한 제품
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Author Action Buttons (Edit / Delete) */}
            {isAuthor && !isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 rounded-btn border border-border bg-surface-2 px-2.5 py-1 text-xs font-bold text-fg hover:bg-surface-3 transition-colors"
                  title="제품 정보 수정"
                >
                  <Edit3 className="w-3.5 h-3.5 text-accent" />
                  <span>수정</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="inline-flex items-center gap-1 rounded-btn border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                  title="제품 삭제"
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
                className="rounded-btn border border-border px-2.5 py-1 text-xs font-bold text-fg hover:bg-surface-2 transition-colors"
              >
                취소
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-btn p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
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
              <label className="block text-xs font-bold text-fg mb-1.5">제품 이름 *</label>
              <input
                type="text"
                required
                maxLength={40}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-sm text-fg font-bold focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1.5">한줄소개 (0/60자)</label>
              <input
                type="text"
                maxLength={60}
                value={editTagline}
                onChange={(e) => setEditTagline(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-sm text-fg focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-fg">제품 상세 설명 (마크다운 지원)</label>
                <span className="text-[11px] text-fg-muted">{editDescription.length}/3,000자</span>
              </div>
              <textarea
                rows={8}
                maxLength={3000}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface-2 p-3 text-xs text-fg focus:border-accent focus:outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">카테고리</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-sm text-fg focus:border-accent focus:outline-none"
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
                <label className="block text-xs font-bold text-fg mb-1.5">제품 URL *</label>
                <input
                  type="url"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Thumbnail Image */}
            <div>
              <ImageUploader
                label="앱 로고 / 썸네일 이미지"
                value={editIconUrl}
                onChange={(u) => setEditIconUrl(u)}
                aspectRatio="square"
              />
            </div>

            {/* Gallery (Max 5) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-fg">갤러리 이미지 (최대 5장)</label>
                <span className="text-[11px] text-fg-muted">{editGallery.length}/5장</span>
              </div>

              {editGallery.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  {editGallery.map((imgUrl, i) => (
                    <div key={i} className="relative aspect-video rounded border border-border overflow-hidden group">
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
                    className="flex-1 rounded-btn border border-border bg-surface-2 px-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditGalleryUrl}
                    className="rounded-btn bg-surface-2 border border-border px-3 py-1.5 text-xs font-bold text-fg hover:bg-surface-3 transition-colors"
                  >
                    추가
                  </button>
                </div>
              )}
            </div>

            {/* Demo Video */}
            <div>
              <label className="block text-xs font-bold text-fg mb-1">데모 영상 링크 (선택)</label>
              <input
                type="url"
                value={editDemoVideo}
                onChange={(e) => setEditDemoVideo(e.target.value)}
                placeholder="YouTube · Vimeo · Loom 영상 링크"
                className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-fg mb-1">X (트위터)</label>
                <input
                  type="url"
                  value={editTwitter}
                  onChange={(e) => setEditTwitter(e.target.value)}
                  placeholder="https://x.com/..."
                  className="w-full rounded-btn border border-border bg-surface-2 px-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-fg mb-1">GitHub</label>
                <input
                  type="url"
                  value={editGithub}
                  onChange={(e) => setEditGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full rounded-btn border border-border bg-surface-2 px-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-fg mb-1">YouTube</label>
                <input
                  type="url"
                  value={editYoutube}
                  onChange={(e) => setEditYoutube(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full rounded-btn border border-border bg-surface-2 px-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-fg mb-1">런칭 태그</label>
              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-pill bg-accent/10 text-accent text-xs px-2.5 py-0.5 font-semibold"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setEditTags(editTags.filter((t) => t !== tag))}
                        className="hover:text-rose-500"
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
                className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>

            {/* Submit Edit Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-btn border border-border px-4 py-2 text-xs font-bold text-fg hover:bg-surface-2 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-accent-hover transition-colors"
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
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
              <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="size-14 sm:size-16 shrink-0 overflow-hidden rounded-[14px] sm:rounded-[15px] bg-surface-2 ring-1 ring-inset ring-border">
                  <img
                    src={product.icon}
                    alt={`${product.title} 로고`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-extrabold text-fg tracking-tight break-words">
                    {product.title}
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-fg-muted break-words">
                    {product.tagline}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-fg-muted flex-wrap">
                    <span className="font-medium text-fg-secondary flex items-center gap-1.5 flex-wrap">
                      <span>제작: <strong className="font-bold text-fg">{product.author}</strong></span>
                      {(!user.isLoggedIn || !isAuthor) && (
                        <button
                          type="button"
                          onClick={handleAuthorDm}
                          className="inline-flex items-center gap-1 rounded-pill bg-accent/10 hover:bg-accent hover:text-white text-accent px-2 py-0.5 text-[10px] font-bold border border-accent/20 transition-all cursor-pointer shadow-2xs"
                          title={`${product.author}님에게 1:1 DM 보내기`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>DM 보내기</span>
                        </button>
                      )}
                    </span>
                    {product.category && (
                      <>
                        <span>·</span>
                        <span>{product.category}</span>
                      </>
                    )}
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-medium text-fg-muted" title="조회수">
                      <Eye className="w-3.5 h-3.5" />
                      <span>조회 {product.views || 0}회</span>
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-500" title="추천 수">
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>추천 {product.upvotes || 0}개</span>
                    </span>
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {product.tags.map((t) => (
                          <span key={t} className="rounded-pill bg-surface-2 px-1.5 py-0.2 text-[10px] text-fg-muted border border-border">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Social & Store Links */}
                  {(product.socialLinks || (product.additionalLinks && product.additionalLinks.length > 0)) && (
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs">
                      {product.socialLinks?.twitter && (
                        <a href={product.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-accent font-medium">
                          X(Twitter)
                        </a>
                      )}
                      {product.socialLinks?.github && (
                        <a href={product.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-accent font-medium">
                          GitHub
                        </a>
                      )}
                      {product.socialLinks?.youtube && (
                        <a href={product.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-accent font-medium">
                          YouTube
                        </a>
                      )}
                      {product.additionalLinks?.map((l) => (
                        <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-bold text-[11px]">
                          [{l.label}]
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Upvote & Open App Link Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => toggleProductUpvote(product.id)}
                  title={isProductUpvoted(product.id) ? '추천 취소' : '이 앱 추천하기'}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-btn px-4 py-2.5 text-sm font-bold shadow-sm transition-all border ${
                    isProductUpvoted(product.id)
                      ? 'bg-rose-500 border-rose-600 text-white shadow-rose-500/20'
                      : 'bg-surface-2 border-border text-fg hover:border-rose-500/40 hover:text-rose-500'
                  }`}
                >
                  <ChevronUp className={`w-4 h-4 transition-transform ${isProductUpvoted(product.id) ? 'scale-125' : ''}`} />
                  <span>추천 {product.upvotes || 0}</span>
                </button>

                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-btn bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-accent-hover transition-colors shrink-0"
                >
                  <span>앱 열기</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Demo Video if available */}
            {product.demoVideo && (
              <div className="mt-6 rounded-card border border-border bg-surface-2 p-4">
                <div className="text-xs font-bold text-fg mb-2 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-accent" />
                  <span>데모 영상</span>
                </div>
                <a
                  href={product.demoVideo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-btn bg-accent/10 text-accent px-3.5 py-2 text-xs font-bold hover:bg-accent hover:text-white transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>데모 영상 보러가기 ({product.demoVideo.slice(0, 45)}...)</span>
                </a>
              </div>
            )}

            {/* Screenshot / Gallery Preview */}
            {(product.screenshot || (product.gallery && product.gallery.length > 0)) && (
              <div className="mt-6">
                <div className="text-xs font-bold text-fg mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-accent" />
                  <span>미디어 프리뷰</span>
                </div>
                <div className="overflow-hidden rounded-card border border-border bg-surface-2 max-h-[320px]">
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

                {/* Gallery thumbnails */}
                {product.gallery && product.gallery.length > 1 && (
                  <div className="mt-2.5 grid grid-cols-5 gap-2">
                    {product.gallery.map((gImg, i) => (
                      <a key={i} href={gImg} target="_blank" rel="noopener noreferrer" className="aspect-video rounded border border-border overflow-hidden bg-surface-2 hover:border-accent transition-colors">
                        <img src={gImg} alt={`미리보기 ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Detailed Description if available (rendered with Markdown) */}
            {product.description && (
              <div className="mt-6 rounded-card border border-border bg-surface-2 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
                  <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                    <span>📖 제품 상세 소개</span>
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    AI 심층 분석
                  </span>
                </div>
                <MarkdownRenderer content={product.description} />
              </div>
            )}

            {/* Test Instructions Section (Shown if distinct from full description) */}
            {product.instructions && product.instructions.trim() !== product.description?.trim() && (
              <div className="mt-6 rounded-card border border-border bg-surface-2 p-5">
                <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                  <span>📋 테스트 지시사항</span>
                  <span className="text-[11px] font-normal text-fg-muted">메이커의 중점 요청 사항</span>
                </h3>
                <div className="mt-3 text-xs leading-relaxed text-fg-secondary whitespace-pre-line font-normal">
                  {product.instructions}
                </div>
              </div>
            )}

            {/* Feedback Form */}
            <div className="mt-6 rounded-card border border-border bg-surface p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                  <span>✍️ 테스트 피드백 작성</span>
                </h3>
                <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                  <span>평점:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-1 text-xs text-fg-muted">
                테스터님의 피드백은 메이커가 서비스를 개선하는 데 가장 큰 힘이 됩니다.
              </p>

              {!user.isLoggedIn ? (
                <div className="mt-4 rounded-btn border border-dashed border-border p-6 text-center">
                  <p className="text-xs text-fg-muted mb-3">
                    피드백을 작성하려면 먼저 로그인이 필요합니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-btn bg-accent px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-accent-hover"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>로그인하고 피드백 남기기</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="mt-4 flex flex-col gap-3.5">
                  <div className="flex items-center gap-4 text-xs font-medium text-fg-muted">
                    <span>테스트 환경:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="device"
                        value="Windows Chrome"
                        checked={deviceInfo === 'Windows Chrome'}
                        onChange={(e) => setDeviceInfo(e.target.value)}
                        className="text-accent"
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
                        className="text-accent"
                      />
                      <span>모바일</span>
                    </label>
                  </div>

                  <textarea
                    required
                    rows={3}
                    placeholder="서비스를 직접 둘러보신 후 버그, 사용성, 개선 아이디어를 솔직하게 남겨주세요."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-btn border border-border bg-surface-2 p-3 text-xs text-fg focus:border-accent focus:outline-none leading-relaxed"
                  />

                  {/* Feedback Screenshot Upload via Cloudinary */}
                  <div>
                    <ImageUploader
                      label="버그 또는 화면 캡처 첨부 (선택)"
                      value={feedbackScreenshot}
                      onChange={(u) => setFeedbackScreenshot(u)}
                      aspectRatio="video"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting || !content.trim()}
                      className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isSubmitting ? '전송 중...' : '피드백 제출하기'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Past Feedbacks */}
            <div className="mt-8">
              <h3 className="text-sm font-bold text-fg flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4" />
                <span>등록된 피드백 ({productFeedbacks.length}건)</span>
              </h3>

              {productFeedbacks.length === 0 ? (
                <div className="rounded-btn border border-dashed border-border p-6 text-center text-xs text-fg-muted">
                  아직 등록된 피드백이 없습니다. 첫 번째 테스터가 되어 의견을 남겨보세요!
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {productFeedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="rounded-btn border border-border bg-surface-2 p-3.5 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={fb.avatar}
                            alt={fb.author}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-fg">{fb.author}</span>
                          <span className="text-[10px] text-fg-muted">· {fb.deviceInfo}</span>
                          <span className="text-[10px] text-fg-muted">· {fb.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < fb.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300 dark:text-zinc-600'
                                }`}
                              />
                            ))}
                          </div>
                          {user.isLoggedIn && Boolean(
                            (fb.authorId && fb.authorId === user.id) ||
                            (fb.authorEmail && user.email && fb.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
                            (user.email && (fb.authorId === user.email || fb.author === user.email))
                          ) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('작성하신 피드백을 삭제하시겠습니까?')) {
                                  deleteFeedback(product.id, fb.id);
                                }
                              }}
                              className="p-1 text-fg-muted hover:text-rose-500 rounded transition-colors ml-1"
                              title="피드백 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-fg-secondary leading-relaxed pl-8">
                        {fb.content}
                      </p>
                      {fb.screenshot && (
                        <div className="pl-8 pt-1">
                          <img
                            src={fb.screenshot}
                            alt="Feedback Screenshot"
                            className="rounded-icon max-h-40 border border-border object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
