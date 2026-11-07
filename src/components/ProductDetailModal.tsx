import React, { useState } from 'react';
import { X, ExternalLink, Star, CheckCircle, Smartphone, Monitor, Send, MessageSquare, Image as ImageIcon, LogIn } from 'lucide-react';
import { useApp } from '../AppContext';
import { Product } from '../types';
import { ImageUploader } from './ImageUploader';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { feedbacks, addFeedback, user, requireAuth, setIsLoginModalOpen } = useApp();
  const productFeedbacks = feedbacks[product.id] || feedbacks[product.slug] || [];

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('Windows Chrome');
  const [feedbackScreenshot, setFeedbackScreenshot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    requireAuth(() => {
      setIsSubmitting(true);
      setTimeout(() => {
        addFeedback(product.id, {
          productId: product.id,
          author: user.name || '데몬테스터',
          avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          rating,
          content: content.trim(),
          deviceInfo,
          screenshot: feedbackScreenshot || undefined,
        });
        setContent('');
        setFeedbackScreenshot('');
        setIsSubmitting(false);
      }, 400);
    }, '피드백을 작성하려면 Google 로그인이 필요합니다.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-[760px] max-h-[92vh] overflow-y-auto rounded-card border border-border bg-surface shadow-elevated transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/90 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-pill bg-brand-subtle text-accent">
              앱 테스트
            </span>
            <span className="text-xs text-fg-muted">demonst verified</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-btn p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product Info Banner */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-[15px] bg-surface-2 ring-1 ring-inset ring-border">
                <img
                  src={product.icon}
                  alt={product.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-fg tracking-tight">
                  {product.title}
                </h1>
                <p className="mt-1 text-sm text-fg-muted">
                  {product.tagline}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-fg-muted">
                  <span className="font-medium text-fg-secondary">제작: {product.author}</span>
                  <span>·</span>
                  <span>{product.category}</span>
                </div>
              </div>
            </div>

            {/* Open App Link */}
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-btn bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-accent-hover transition-colors"
            >
              <span>앱 열기</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Screenshot Preview if available */}
          {product.screenshot && (
            <div className="mt-6">
              <div className="text-xs font-bold text-fg mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-accent" />
                <span>AI 캡처 웹사이트 프리뷰</span>
              </div>
              <div className="overflow-hidden rounded-card border border-border bg-surface-2 max-h-[320px]">
                <img
                  src={product.screenshot}
                  alt="Website screenshot"
                  className="w-full h-auto object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Test Instructions Section */}
          <div className="mt-6 rounded-card border border-border bg-surface-2 p-5">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <span>📋 테스트 지시사항</span>
              <span className="text-[11px] font-normal text-fg-muted">메이커의 중점 요청 사항</span>
            </h3>
            <div className="mt-3 text-xs leading-relaxed text-fg-secondary whitespace-pre-line font-normal">
              {product.instructions}
            </div>
          </div>

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
                  <span>Google 로그인하고 피드백 남기기</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-fg-muted">
                  <div className="flex items-center gap-2">
                    <img src={user.avatar} alt="user" className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-semibold text-fg">{user.name}</span>
                    <span>({user.email || 'Google 연동'})</span>
                  </div>
                  <select
                    value={deviceInfo}
                    onChange={(e) => setDeviceInfo(e.target.value)}
                    className="rounded-btn border border-border bg-surface-2 px-3 py-1 text-xs text-fg focus:border-accent focus:outline-none"
                  >
                    <option value="Windows Chrome">Windows · Chrome 브라우저</option>
                    <option value="MacOS Safari">macOS · Safari 브라우저</option>
                    <option value="iOS Safari">iPhone · Safari 모바일</option>
                    <option value="Android Chrome">Android · Chrome 모바일</option>
                  </select>
                </div>

                <textarea
                  rows={4}
                  required
                  placeholder="직접 사용해보신 경험을 솔직하게 적어주세요. (예: UI 사용성, 로딩 속도, 이해하기 쉬웠던 점, 아쉬웠던 점 등)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full rounded-btn border border-border bg-surface-2 p-3 text-xs text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none leading-relaxed"
                />

                {/* Cloudinary Screenshot Attachment */}
                <ImageUploader
                  label="스크린샷 첨부 (선택 - Cloudinary 업로드)"
                  value={feedbackScreenshot}
                  onChange={(url) => setFeedbackScreenshot(url)}
                  aspectRatio="video"
                  hint="버그 화면이나 UI 캡처 이미지 첨부"
                />

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? '제출 중...' : '피드백 전달하기'}</span>
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
      </div>
    </div>
  );
};
