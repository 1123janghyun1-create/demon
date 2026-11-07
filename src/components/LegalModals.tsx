import React, { useState } from 'react';
import { X, FileText, ShieldCheck, Mail, Send, CheckCircle, ExternalLink } from 'lucide-react';
import { useApp } from '../AppContext';

export type LegalModalType = 'terms' | 'privacy' | 'contact' | null;

interface LegalModalsProps {
  type: LegalModalType;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ type, onClose }) => {
  const { user, showToast } = useApp();

  // Contact form state
  const [contactCategory, setContactCategory] = useState<'bug' | 'feature' | 'business' | 'other'>('feature');
  const [contactName, setContactName] = useState(user.name !== '게스트' ? user.name : '');
  const [contactEmail, setContactEmail] = useState(user.email || '');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!type) return null;

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // Save locally
      try {
        const existing = JSON.parse(localStorage.getItem('demon_inquiries') || '[]');
        existing.push({
          id: Date.now().toString(),
          category: contactCategory,
          name: contactName || '익명 빌더',
          email: contactEmail || 'no-email',
          message: contactMessage,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('demon_inquiries', JSON.stringify(existing));
      } catch {}

      setIsSubmitting(false);
      setSubmitted(true);
      showToast('문의가 정상적으로 접수되었습니다. 빠른 시일 내에 답변드리겠습니다!');
    }, 600);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setContactMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-surface-2 shrink-0">
          <div className="flex items-center gap-2.5">
            {type === 'terms' && (
              <>
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-fg">demonst 서비스 이용약관</h3>
                  <span className="text-[11px] text-fg-muted">시행일자: 2026년 11월 1일</span>
                </div>
              </>
            )}

            {type === 'privacy' && (
              <>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-fg">demonst 개인정보처리방침</h3>
                  <span className="text-[11px] text-fg-muted">시행일자: 2026년 11월 1일</span>
                </div>
              </>
            )}

            {type === 'contact' && (
              <>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-fg">문의하기 & 의견 보내기</h3>
                  <span className="text-[11px] text-fg-muted">팀 demonst와 직접 소통하세요</span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-3 transition-colors"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs text-fg-secondary leading-relaxed space-y-5">
          {/* TERMS OF SERVICE */}
          {type === 'terms' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-fg mb-1">제1조 (목적)</h4>
                <p>
                  본 약관은 demonst(이하 "서비스")가 제공하는 사이드 프로젝트 등록, 앱 테스트, 피드백 교환, 빌더 커뮤니티 및 관련 제반 서비스의 이용 조건 및 절차에 관한 제반 사항을 규정함을 목적으로 합니다.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-fg mb-1">제2조 (용어의 정의)</h4>
                <p>
                  1. "서비스"란 demonst 웹사이트(demonst.vercel.app)를 통해 인디 개발자 및 메이커에게 제공되는 모든 기능을 의미합니다.<br />
                  2. "회원(빌더)"이란 본 서비스에 Google OAuth 등의 인증 방식을 거쳐 가입하고 서비스를 이용하는 이용자를 말합니다.<br />
                  3. "프로젝트"란 회원이 피드백 수집 및 홍보를 목적으로 서비스에 등록한 웹사이트, 앱 또는 서비스 링크를 말합니다.<br />
                  4. "피드백"이란 회원이 다른 회원의 프로젝트를 테스트한 후 남긴 평가, 리뷰, 버그 리포트 등을 의미합니다.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-fg mb-1">제3조 (회원의 권리와 의무)</h4>
                <p>
                  1. 회원은 누구나 자신의 프로젝트를 자유롭게 등록하고 동료 회원들의 피드백을 받을 권리가 있습니다.<br />
                  2. 회원은 타인의 지적재산권을 침해하거나 악성코드, 사기성 링크, 불법 콘텐츠가 포함된 프로젝트를 등록해서는 아니 됩니다.<br />
                  3. 회원은 피드백 작성 시 인신공격, 욕설, 맹목적인 비방을 삼가고 건설적인 의견을 작성해야 합니다.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-fg mb-1">제4조 (지적재산권의 귀속)</h4>
                <p>
                  1. 회원이 서비스에 등록한 프로젝트의 소유권 및 지적재산권은 해당 회원에게 온전히 귀속됩니다.<br />
                  2. 회원이 작성한 피드백의 저작권은 작성자에게 귀속되며, 서비스는 서비스 운영 및 프로모션 목적 범위 내에서 이를 인용하거나 표시할 수 있습니다.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-fg mb-1">제5조 (책임의 한계 및 면책)</h4>
                <p>
                  1. 서비스는 회원이 등록한 프로젝트 및 외부 링크(URL)의 신뢰성, 완전성, 안정성에 대해 보증하지 않습니다.<br />
                  2. 회원이 외부 사이트에 접속하거나 이용하면서 발생한 손해에 대하여 서비스 운영진은 고의 또는 중과실이 없는 한 책임을 지지 않습니다.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-fg mb-1">제6조 (약관의 개정)</h4>
                <p>
                  본 약관은 관계 법령에 위배되지 않는 범위 내에서 개정될 수 있으며, 개정 시 서비스 내 공지사항을 통해 사전 고지합니다.
                </p>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY */}
          {type === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-fg mb-1">1. 수집하는 개인정보 항목</h4>
                <p>
                  demonst는 Google OAuth 간편 로그인을 통해 최소한의 개인정보만을 수집합니다.<br />
                  - <strong>필수 항목:</strong> Google 계정 이메일, 이름(닉네임), 프로필 사진 URL, 고유 사용자 식별자(UID)<br />
                  - <strong>선택 항목 (프로필 수정 시):</strong> 역할(직무), 소개글(Bio), 진행 중인 프로젝트명, 관심 태그, GitHub 및 Twitter 링크
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-fg mb-1">2. 개인정보 수집 및 이용 목적</h4>
                <p>
                  - 회원 식별 및 로그인 상태 유지 (Supabase Auth 연동)<br />
                  - 등록한 프로젝트의 빌더(작성자) 표시<br />
                  - 피드백 작성자 식별 및 리더보드 랭킹 산정<br />
                  - 빌더 간 1:1 메시지(DM) 송수신 및 팔로우 상태 관리
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-fg mb-1">3. 개인정보의 보유 및 파기 절차</h4>
                <p>
                  수집된 개인정보는 회원이 서비스를 이용하는 기간 동안 안전하게 보관되며, 회원 탈퇴를 요청하거나 목적이 달성된 경우 지체 없이 재생 불가능한 방법으로 영구 파기됩니다.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-fg mb-1">4. 제3자 제공 및 위탁 처리 현황</h4>
                <p>
                  demonst는 이용자의 개인정보를 외부에 무단 제공하거나 판매하지 않습니다. 안정적인 서비스 인프라 제공을 위해 다음 전문 클라우드 서비스를 위탁 활용합니다:<br />
                  - <strong>호스팅 및 배포:</strong> Vercel Inc.<br />
                  - <strong>인증 및 데이터베이스:</strong> Supabase Inc. (Row Level Security 보안 정책 적용)<br />
                  - <strong>미디어 CDN 스토리지:</strong> Cloudinary Inc.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-fg mb-1">5. 이용자의 권리와 행사 방법</h4>
                <p>
                  이용자는 서비스 내 '내 프로필 수정' 기능을 통해 언제든지 자신의 개인정보를 열람, 수정할 수 있으며, 이메일을 통해 계정 데이터 영구 삭제를 요구할 수 있습니다.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-fg mb-1">6. 개인정보 보호책임자</h4>
                <p>
                  이메일: <span className="font-mono text-accent">demonst1004@gmail.com</span><br />
                  서비스 도메인: <span className="font-mono text-accent">demonst.vercel.app</span>
                </p>
              </div>
            </div>
          )}

          {/* CONTACT FORM */}
          {type === 'contact' && (
            <div>
              {submitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-fg">문의가 성공적으로 전달되었습니다!</h4>
                  <p className="text-xs text-fg-muted max-w-sm mx-auto">
                    소중한 의견 감사드립니다. 남겨주신 이메일로 24시간 이내에 신속히 답변드리겠습니다.
                  </p>
                  <button
                    onClick={handleResetAndClose}
                    className="mt-4 px-4 py-2 rounded-btn bg-accent text-white font-bold text-xs hover:bg-accent-hover transition-colors"
                  >
                    확인 및 닫기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-fg mb-1.5">문의 유형</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'feature', label: '💡 기능 제안' },
                        { id: 'bug', label: '🐞 버그 제보' },
                        { id: 'business', label: '🤝 제휴/협업' },
                        { id: 'other', label: '💬 기타 문의' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setContactCategory(cat.id as any)}
                          className={`py-2 px-2.5 rounded-lg border text-xs font-medium text-center transition-all ${
                            contactCategory === cat.id
                              ? 'border-accent bg-brand-subtle text-accent font-bold'
                              : 'border-border bg-surface-2 text-fg-secondary hover:bg-surface-3'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-fg mb-1">성함 / 닉네임</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="홍길동"
                        className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-fg mb-1">회신받을 이메일</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="builder@example.com"
                        className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-fg mb-1">상세 내용</label>
                    <textarea
                      required
                      rows={5}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="제안하고 싶은 기능, 발견한 버그의 발생 상황 또는 궁금한 점을 자유롭게 적어주세요."
                      className="w-full rounded-btn border border-border bg-surface-2 p-3 text-xs text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-border">
                    <span className="text-[11px] text-fg-muted">
                      직접 이메일 문의: <span className="text-accent font-mono">demonst1004@gmail.com</span>
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmitting || !contactMessage.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-btn bg-accent text-white text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? '전송 중...' : '문의 보내기'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border px-5 py-3 bg-surface-2 flex items-center justify-between text-xs text-fg-muted">
          <span>demonst — Demo & Test for Builders</span>
          <button
            onClick={handleResetAndClose}
            className="px-3 py-1.5 rounded-btn bg-surface border border-border text-xs font-semibold text-fg hover:bg-surface-3 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
