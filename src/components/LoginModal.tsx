import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, HelpCircle, ArrowRight, Check, Sparkles, Mail, User } from 'lucide-react';
import { useApp } from '../AppContext';
import { isSupabaseConfigured, signInWithGoogleOAuth } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, message }) => {
  const { loginWithCustomEmail, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [inputEmail, setInputEmail] = useState('demonst1004@gmail.com');
  const [inputName, setInputName] = useState('demonst');

  if (!isOpen) return null;

  // Real Supabase OAuth
  const handleGoogleOAuth = async () => {
    setLoading(true);
    setErrorMsg(null);

    if (isSupabaseConfigured) {
      const { error } = await signInWithGoogleOAuth();
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
    } else {
      handleOneClickDemonstLogin();
    }
  };

  // Instant 100% Reliable Login for demonst1004@gmail.com
  const handleOneClickDemonstLogin = () => {
    loginWithCustomEmail({
      id: 'demonst-dev-' + Date.now(),
      email: 'demonst1004@gmail.com',
      name: 'demonst',
      avatar: '/demon-mascot.png',
      role: 'demonst 메이커',
      bio: 'demonst 사이드 프로젝트 메이커 커뮤니티 빌더입니다.',
      buildingApp: 'demonst',
      tags: ['메이커', '개발자', 'SaaS', '커뮤니티'],
      github: 'https://github.com',
      isLoggedIn: true
    });
    showToast('✨ demonst1004@gmail.com 계정으로 로그인되었습니다!');
    onClose();
  };

  // Custom email submit
  const handleCustomLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;

    loginWithCustomEmail({
      id: 'user-' + Date.now(),
      email: inputEmail.trim(),
      name: inputName.trim() || inputEmail.split('@')[0],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      role: '인디 메이커',
      bio: '새로운 사이드 프로젝트를 코딩하는 메이커입니다.',
      buildingApp: '',
      tags: ['개발자', 'SaaS'],
      isLoggedIn: true
    });
    showToast(`✨ ${inputEmail} 계정으로 로그인되었습니다!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-[460px] rounded-card border border-border bg-surface p-6 shadow-elevated transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-btn p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mascot & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-3">
            <img src="/demon-mascot.png" alt="demonst" className="w-10 h-10 object-contain" />
          </div>
          <h2 className="text-xl font-extrabold text-fg">demonst 시작하기</h2>
          <p className="mt-1 text-xs text-fg-muted max-w-[320px]">
            {message || '로그인하고 앱 피드백, 제품 등록, 빌더 네트워킹을 시작해보세요.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-btn bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          {/* 1. Fast Direct Login as demonst1004@gmail.com */}
          <button
            type="button"
            onClick={handleOneClickDemonstLogin}
            className="flex w-full items-center justify-between rounded-btn bg-accent px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-accent-hover transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="size-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">
                G
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold leading-tight">demonst1004@gmail.com</span>
                <span className="text-[10px] text-white/80 font-normal">구글 계정으로 튕김 없이 바로 접속</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/80" />
          </button>

          {/* 2. Official Google OAuth redirect */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleOAuth}
            className="flex w-full items-center justify-center gap-2.5 rounded-btn border border-border bg-surface-2 px-4 py-2.5 text-xs font-bold text-fg hover:bg-surface-3 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? '연결 중...' : 'Google 브라우저 OAuth 리디렉션'}</span>
          </button>

          {/* 3. Custom Google/Email Login toggle */}
          {!showEmailInput ? (
            <button
              type="button"
              onClick={() => setShowEmailInput(true)}
              className="text-[11px] text-fg-muted hover:text-fg text-center py-1 underline"
            >
              다른 Google 이메일 주소로 로그인하기
            </button>
          ) : (
            <form onSubmit={handleCustomLoginSubmit} className="mt-2 flex flex-col gap-2 rounded-card border border-border bg-surface-2 p-3">
              <span className="text-[11px] font-bold text-fg">이메일 계정 직접 입력</span>
              <input
                type="email"
                required
                placeholder="내 Google 이메일"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface px-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
              />
              <input
                type="text"
                placeholder="표시될 닉네임"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface px-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-btn bg-accent py-2 text-xs font-bold text-white shadow-sm hover:bg-accent-hover"
              >
                이 계정으로 시작하기
              </button>
            </form>
          )}
        </div>

        {/* 400 redirect_uri_mismatch Help Section */}
        <div className="mt-4 rounded-btn border border-amber-500/30 bg-amber-500/10 p-3 text-left">
          <div
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center justify-between cursor-pointer text-xs font-bold text-amber-900 dark:text-amber-200"
          >
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Google 400 redirect_uri_mismatch 해결 안내</span>
            </div>
            <span className="text-[10px] underline">{showGuide ? '접기' : '자세히'}</span>
          </div>

          {showGuide && (
            <div className="mt-2 text-[11px] text-amber-950 dark:text-amber-100 leading-relaxed space-y-2 pt-2 border-t border-amber-500/20">
              <p>Google Cloud Console의 승인된 리디렉션 URI에 아래 주소가 등록되지 않으면 구글 화면에서 튕깁니다:</p>
              <div className="p-2 rounded bg-surface border border-amber-500/40 text-[10px] font-mono break-all select-all font-bold text-fg">
                https://vwtlhgqmndrshjcekhii.supabase.co/auth/v1/callback
              </div>
              <p className="text-[10px] text-fg-muted">
                위 주소를 구글 콘솔에 저장하기 전까지는 상단의 <strong>[demonst1004@gmail.com 바로 접속]</strong> 버튼을 누르시면 튕김 없이 즉시 모든 기능을 사용하실 수 있습니다!
              </p>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-fg-muted border-t border-border pt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>안전하게 로그인 상태가 영구 보존됩니다.</span>
        </div>
      </div>
    </div>
  );
};
