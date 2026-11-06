import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, HelpCircle, ExternalLink, ArrowRight } from 'lucide-react';
import { useApp } from '../AppContext';
import { isSupabaseConfigured, signInWithGoogleOAuth } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, message }) => {
  const { loginAsDemoUser, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);

    if (isSupabaseConfigured) {
      const { error } = await signInWithGoogleOAuth();
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        loginAsDemoUser();
        showToast('✨ Google 계정으로 로그인되었습니다! (데모 모드)');
        setLoading(false);
        onClose();
      }, 500);
    }
  };

  const handleInstantDemoLogin = () => {
    loginAsDemoUser();
    showToast('✨ Google 메이커 계정으로 로그인되었습니다!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-[440px] rounded-card border border-border bg-surface p-6 shadow-elevated transition-all"
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
          <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
            <img src="/demon-mascot.png" alt="demon" className="w-10 h-10 object-contain" />
          </div>
          <h2 className="text-xl font-extrabold text-fg">demon 시작하기</h2>
          <p className="mt-1.5 text-xs text-fg-muted max-w-[300px]">
            {message || '로그인하고 앱 피드백, 제품 등록, 빌더 네트워킹을 시작해보세요.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-btn bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Button: Google OAuth */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-btn border border-border bg-surface-2 px-4 py-3 text-sm font-bold text-fg hover:bg-surface-3 transition-colors shadow-sm disabled:opacity-50"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>{loading ? 'Google 로그인 연결 중...' : 'Google 계정으로 계속하기'}</span>
          </button>

          {/* Instant Test Mode for immediate exploration */}
          <button
            type="button"
            onClick={handleInstantDemoLogin}
            className="flex w-full items-center justify-center gap-1.5 rounded-btn bg-surface border border-dashed border-border px-4 py-2 text-xs font-semibold text-fg-muted hover:text-fg hover:border-accent transition-colors"
          >
            <span>Google 콘솔 설정 전 바로 체험하기 (테스트 로그인)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Redirect URI mismatch helper banner */}
        <div className="mt-4 rounded-btn border border-amber-500/30 bg-amber-500/10 p-3 text-left">
          <div
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center justify-between cursor-pointer text-xs font-bold text-amber-900 dark:text-amber-200"
          >
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>'redirect_uri_mismatch' 오류가 뜨나요?</span>
            </div>
            <span className="text-[10px] underline">{showGuide ? '접기' : '해결법 보기'}</span>
          </div>

          {showGuide && (
            <div className="mt-2 text-[11px] text-amber-950 dark:text-amber-100 leading-relaxed space-y-1.5 pt-2 border-t border-amber-500/20">
              <p>Google Cloud Console의 승인된 리디렉션 URI에 아래 주소를 추가해주세요:</p>
              <div className="p-1.5 rounded bg-surface border border-amber-500/40 text-[10px] font-mono break-all select-all">
                https://vwtlhgqmndrshjcekhii.supabase.co/auth/v1/callback
              </div>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-fg-muted border-t border-border pt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Supabase Auth로 안전하게 암호화되어 관리됩니다.</span>
        </div>
      </div>
    </div>
  );
};
