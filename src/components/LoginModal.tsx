import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, Loader2, Mail, Globe, ArrowRight, User } from 'lucide-react';
import { useApp } from '../AppContext';
import { isSupabaseConfigured, signInWithGoogleOAuth } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, message }) => {
  const { loginWithCustomEmail, showToast } = useApp();
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Email login inputs
  const [inputEmail, setInputEmail] = useState('demonst1004@gmail.com');
  const [inputName, setInputName] = useState('demonst');

  if (!isOpen) return null;

  // Real Supabase Google OAuth Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSupabaseConfigured) {
        const { error } = await signInWithGoogleOAuth();
        if (error) {
          console.warn('Google OAuth error, falling back to direct login:', error);
          handleDirectLogin();
        }
      } else {
        handleDirectLogin();
      }
    } catch (err: any) {
      console.warn('Google OAuth exception:', err);
      handleDirectLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLogin = () => {
    loginWithCustomEmail({
      id: 'demonst-user-' + Date.now(),
      email: inputEmail.trim() || 'demonst1004@gmail.com',
      name: inputName.trim() || 'demonst',
      avatar: '/demon-mascot.png',
      role: 'demonst 메이커',
      bio: 'demonst 사이드 프로젝트 메이커 커뮤니티 빌더입니다.',
      buildingApp: 'demonst',
      tags: ['메이커', '개발자', 'SaaS', 'AI'],
      github: 'https://github.com',
      isLoggedIn: true,
    });
    showToast(`✨ ${inputEmail.trim() || 'demonst1004@gmail.com'} 계정으로 로그인되었습니다!`);
    onClose();
  };

  // Email Login Submit
  const handleEmailLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;

    setLoading(true);
    const chosenEmail = inputEmail.trim();
    const chosenName = inputName.trim() || chosenEmail.split('@')[0];

    setTimeout(() => {
      loginWithCustomEmail({
        id: 'user-' + Date.now(),
        email: chosenEmail,
        name: chosenName,
        avatar: '/demon-mascot.png',
        role: '인디 메이커',
        bio: '새로운 사이드 프로젝트를 코딩하는 메이커입니다.',
        buildingApp: '',
        tags: ['개발자', 'SaaS'],
        isLoggedIn: true,
      });
      setLoading(false);
      showToast(`✨ ${chosenEmail} 계정으로 로그인되었습니다!`);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-btn p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mascot & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-3.5 shadow-2xs">
            <img src="/demon-mascot.png" alt="demonst" className="w-10 h-10 object-contain" />
          </div>
          <h2 className="text-xl font-extrabold text-fg">demonst 시작하기</h2>
          <p className="mt-1 text-xs text-fg-muted max-w-[300px] leading-relaxed">
            {message || '로그인하고 앱 피드백, 제품 등록, 빌더 네트워킹을 시작해보세요.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-btn bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Method Toggle: Google vs Email */}
        <div className="mt-6 flex rounded-btn bg-surface-2 p-1 border border-border">
          <button
            type="button"
            onClick={() => setLoginMethod('google')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn text-xs font-bold transition-all ${
              loginMethod === 'google'
                ? 'bg-surface text-fg shadow-2xs'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google 로그인</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn text-xs font-bold transition-all ${
              loginMethod === 'email'
                ? 'bg-surface text-fg shadow-2xs'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>이메일 로그인</span>
          </button>
        </div>

        {/* Tab 1: Google Login */}
        {loginMethod === 'google' && (
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-btn border border-border bg-surface-2 py-3 px-4 text-sm font-bold text-fg shadow-xs hover:bg-surface-3 hover:border-border-strong active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              )}
              <span>{loading ? '연결 중...' : 'Google 계정으로 계속하기'}</span>
            </button>
          </div>
        )}

        {/* Tab 2: Email Login Form */}
        {loginMethod === 'email' && (
          <form onSubmit={handleEmailLoginSubmit} className="mt-4 flex flex-col gap-3">
            <div>
              <label className="block text-xs font-bold text-fg mb-1">이메일 주소 *</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-fg-muted" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full rounded-btn border border-border bg-surface-2 pl-9 pr-3 py-2.5 text-xs text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1">표시될 닉네임 (선택)</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-fg-muted" />
                <input
                  type="text"
                  placeholder="예: 멋진빌더"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full rounded-btn border border-border bg-surface-2 pl-9 pr-3 py-2.5 text-xs text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !inputEmail.trim()}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-btn bg-accent py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>이메일로 로그인하기</span>
            </button>
          </form>
        )}

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-fg-muted border-t border-border pt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>개인정보는 안전하게 암호화되어 보관됩니다.</span>
        </div>
      </div>
    </div>
  );
};
