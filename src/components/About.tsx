import React from 'react';
import { useApp } from '../AppContext';
import {
  Sparkles,
  Zap,
  MessageSquare,
  Trophy,
  Users,
  Globe,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Heart
} from 'lucide-react';

export const About: React.FC = () => {
  const { setCurrentTab, setIsLoginModalOpen, user } = useApp();

  const handleStartSubmit = () => {
    if (!user.isLoggedIn) {
      setIsLoginModalOpen(true);
    } else {
      setCurrentTab('submit');
    }
  };

  return (
    <div className="max-w-[840px] mx-auto space-y-12 pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface-2 via-surface to-surface p-6 sm:p-10 text-center shadow-xs">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] h-[180px] bg-accent/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold mb-5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Indie Maker Launchpad & App Testing</span>
          </div>

          {/* Logo Mascot */}
          <div className="relative mb-4">
            <div className="absolute -inset-2 bg-gradient-to-r from-rose-500/20 to-accent/20 rounded-full blur-md" />
            <img
              src="/demon-mascot.png"
              alt="demonst mascot"
              className="relative w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md transition-transform hover:scale-105 duration-300"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-fg leading-tight">
            사이드 프로젝트를 위한 가장 빠른 런치패드, <br />
            <span className="bg-gradient-to-r from-accent to-rose-500 bg-clip-text text-transparent">
              demonst
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 max-w-xl text-sm sm:text-base text-fg-secondary leading-relaxed font-normal">
            배포 URL만 입력하면 10초 만에 런치 완료! <br className="hidden sm:inline" />
            혼자 만들고 조용히 사라지는 사이드 프로젝트는 이제 그만. <br className="hidden sm:inline" />
            동료 빌더들의 솔직한 피드백과 버그 리포트를 통해 내 서비스를 검증하고 성장시키세요.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleStartSubmit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-accent text-white text-sm font-bold shadow-md hover:bg-accent-hover transition-all active:scale-[0.98]"
            >
              <span>지금 무료로 내 앱 등록하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentTab('test')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-surface-2 border border-border text-fg text-sm font-semibold hover:bg-surface-3 transition-colors"
            >
              <span>등록된 앱 둘러보기</span>
            </button>

            <button
              onClick={() => setCurrentTab('builders')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-surface-2 border border-border text-fg-secondary text-sm font-semibold hover:bg-surface-3 hover:text-fg transition-colors"
            >
              <Users className="w-4 h-4 text-accent" />
              <span>빌더 네트워크</span>
            </button>
          </div>
        </div>
      </div>

      {/* Why demonst? Comparison Section */}
      <section className="space-y-4">
        <div className="text-center sm:text-left">
          <h2 className="text-lg sm:text-xl font-bold text-fg">
            왜 demonst가 필요할까요?
          </h2>
          <p className="text-xs sm:text-sm text-fg-muted mt-1">
            혼자 개발하는 인디 메이커의 가장 큰 고통은 '사용자 피드백의 부재'입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pain point */}
          <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/[0.03] space-y-3">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>기존 사이드 프로젝트의 현실</span>
            </div>
            <ul className="text-xs text-fg-secondary space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Product Hunt에 올리기엔 아직 초기 MVP/프로토타입이라 부담스러움</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>개발자 커뮤니티에 올리면 '홍보 글'로 오해받아 글이 비공개 처리되거나 차단됨</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>지인들에게 보여줘도 "좋네"라는 형식적 칭찬만 받고 실질적인 버그나 개선점은 알 수 없음</span>
              </li>
            </ul>
          </div>

          {/* Solution */}
          <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>demonst가 제공하는 해결책</span>
            </div>
            <ul className="text-xs text-fg-secondary space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>배포 링크(URL)만 입력하면 AI가 메타태그와 스크린샷을 자동 수집해 10초 만에 등록</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>같은 고민을 겪는 동료 인디 메이커들이 브라우저/기기 환경을 포함해 솔직한 실전 피드백 제공</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Supabase 인증 빌더 간 1:1 DM 및 팔로우로 초기 테스터이자 동료 메이커 네트워크 형성</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5 Core Features Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-fg">핵심 기능 안내</h2>
          <p className="text-xs sm:text-sm text-fg-muted mt-1">
            빌더와 테스터 모두를 위해 준비된 강력한 도구들입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Card 1 */}
          <div className="p-4 rounded-xl border border-border bg-surface-2 hover:border-accent/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-3">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-fg mb-1">10초 원클릭 AI 앱 런치</h3>
            <p className="text-xs text-fg-secondary leading-relaxed">
              웹사이트 URL 하나만 붙여넣으면 OpenGraph 메타데이터와 웹 화면 스크린샷을 AI가 자동으로 추출해 완성합니다.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl border border-border bg-surface-2 hover:border-accent/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-fg mb-1">실전 디바이스 피드백</h3>
            <p className="text-xs text-fg-secondary leading-relaxed">
              테스터의 브라우저(Chrome/Safari), 기기 OS(Windows/iOS), 평점, 스크린샷 캡처가 포함된 상세 버그 리포트를 받습니다.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl border border-border bg-surface-2 hover:border-accent/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-fg mb-1">기여 기반 빌더 리더보드</h3>
            <p className="text-xs text-fg-secondary leading-relaxed">
              남의 앱을 많이 테스트해주고 양질의 피드백을 남긴 메이커에게 활동 랭킹과 마스터 테스터 뱃지를 부여합니다.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-4 rounded-xl border border-border bg-surface-2 hover:border-accent/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-fg mb-1">빌더 디렉토리 & 1:1 DM</h3>
            <p className="text-xs text-fg-secondary leading-relaxed">
              Google 인증을 거친 실제 개발자들의 프로필을 확인하고, 마음에 드는 빌더를 팔로우하거나 1:1 메시지로 협업을 제안하세요.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-4 rounded-xl border border-border bg-surface-2 hover:border-accent/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-3">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-fg mb-1">글로벌 Google 번역 탑재</h3>
            <p className="text-xs text-fg-secondary leading-relaxed">
              상단 Google 번역 위젯을 통해 사이트 전체를 영어, 일본어, 스페인어 등 전 세계 언어로 즉시 번역하여 글로벌 런칭도 가능합니다.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-4 rounded-xl border border-border bg-surface-2 hover:border-accent/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-fg mb-1">클라우드 & Supabase 동기화</h3>
            <p className="text-xs text-fg-secondary leading-relaxed">
              Supabase 클라우드 데이터베이스와 Cloudinary 고속 CDN을 결합하여 데이터의 영속성과 이미지 로딩 속도를 보장합니다.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works 4-Steps */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-fg">이용 방법 4단계</h2>
          <p className="text-xs sm:text-sm text-fg-muted mt-1">
            복잡한 승인 절차 없이 1분 만에 테스트를 시작할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-accent bg-accent/10 px-2 py-0.5 rounded">
                STEP 01
              </span>
              <h4 className="text-sm font-bold text-fg mt-2.5 mb-1">Google 로그인</h4>
              <p className="text-xs text-fg-secondary leading-relaxed">
                구글 계정으로 1초 만에 간편 가입하고 내 빌더 프로필을 활성화합니다.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-accent bg-accent/10 px-2 py-0.5 rounded">
                STEP 02
              </span>
              <h4 className="text-sm font-bold text-fg mt-2.5 mb-1">앱 배포 URL 등록</h4>
              <p className="text-xs text-fg-secondary leading-relaxed">
                Vercel, Netlify, 도메인 주소를 입력하면 AI가 메타태그와 스크린샷을 자동 수집합니다.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-accent bg-accent/10 px-2 py-0.5 rounded">
                STEP 03
              </span>
              <h4 className="text-sm font-bold text-fg mt-2.5 mb-1">피드백 교환</h4>
              <p className="text-xs text-fg-secondary leading-relaxed">
                동료 빌더의 앱을 직접 사용해보고 별점과 개선 아이디어를 남깁니다.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-accent bg-accent/10 px-2 py-0.5 rounded">
                STEP 04
              </span>
              <h4 className="text-sm font-bold text-fg mt-2.5 mb-1">프로덕트 스케일업</h4>
              <p className="text-xs text-fg-secondary leading-relaxed">
                모인 실전 피드백을 바탕으로 버그를 고치고 당당하게 세상에 정식 런칭하세요!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Culture & Guidelines */}
      <section className="p-6 rounded-xl border border-border bg-surface-2 space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
          <h2 className="text-base sm:text-lg font-bold text-fg">demonst의 건강한 피드백 문화</h2>
        </div>
        <p className="text-xs sm:text-sm text-fg-secondary leading-relaxed">
          demonst는 사이드 프로젝트를 만드는 모든 인디 메이커의 열정을 존중합니다. 다음 3가지 약속을 함께 지켜주세요:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-surface border border-border">
            <span className="text-xs font-bold text-fg block mb-1">1. 건설적인 비판</span>
            <span className="text-[11px] text-fg-muted">
              단순 비난이 아닌 "이 부분을 이렇게 고치면 더 편리할 것 같아요"와 같은 구체적 제안을 남겨주세요.
            </span>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-border">
            <span className="text-xs font-bold text-fg block mb-1">2. 사용 환경 공유</span>
            <span className="text-[11px] text-fg-muted">
              버그 발견 시 발생한 화면 캡처나 재현 경로를 알려주시면 빌더에게 큰 도움이 됩니다.
            </span>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-border">
            <span className="text-xs font-bold text-fg block mb-1">3. 따뜻한 응원</span>
            <span className="text-[11px] text-fg-muted">
              작은 아이디어라도 직접 코딩해 세상에 내놓은 동료 메이커에게 따뜻한 격려를 보내주세요.
            </span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-accent" />
          <h2 className="text-lg sm:text-xl font-bold text-fg">자주 묻는 질문 (FAQ)</h2>
        </div>

        <div className="space-y-2.5">
          <div className="p-4 rounded-xl border border-border bg-surface">
            <h4 className="text-xs sm:text-sm font-bold text-fg mb-1">
              Q. demonst 서비스 이용은 무료인가요?
            </h4>
            <p className="text-xs text-fg-secondary leading-relaxed">
              네! demonst의 모든 기능(앱 등록, 피드백 주고받기, 빌더 1:1 DM, 리더보드)은 인디 메이커 커뮤니티의 성장을 위해 100% 무료로 운영됩니다.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface">
            <h4 className="text-xs sm:text-sm font-bold text-fg mb-1">
              Q. 어떤 형태의 프로젝트를 등록할 수 있나요?
            </h4>
            <p className="text-xs text-fg-secondary leading-relaxed">
              웹 서비스, AI 래퍼(Wrapper), SaaS 도구, 크롬 확장 프로그램, 오픈소스 라이브러리, 모바일 앱 소개 랜딩페이지 등 웹 링크로 접속할 수 있는 모든 사이드 프로젝트를 환영합니다.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface">
            <h4 className="text-xs sm:text-sm font-bold text-fg mb-1">
              Q. 해외 사용자나 글로벌 테스터도 이용할 수 있나요?
            </h4>
            <p className="text-xs text-fg-secondary leading-relaxed">
              네, 화면 상단 헤더에 통합된 <strong>Google 번역 위젯</strong>을 통해 영어, 일본어 등 원하는 언어를 선택하면 사이트의 모든 텍스트가 실시간으로 자동 번역됩니다.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface">
            <h4 className="text-xs sm:text-sm font-bold text-fg mb-1">
              Q. 피드백을 많이 받으려면 어떻게 해야 하나요?
            </h4>
            <p className="text-xs text-fg-secondary leading-relaxed">
              '테스트' 탭에서 다른 동료 빌더들의 신작을 먼저 테스트하고 정성스러운 리뷰를 남겨보세요. 적극적인 피드백 활동은 리더보드 점수를 높이고 동료들의 상호 리뷰로 이어집니다!
            </p>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <div className="p-8 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-purple-500/10 to-rose-500/10 text-center space-y-4">
        <h3 className="text-xl sm:text-2xl font-black text-fg">
          지금 당신의 사이드 프로젝트를 선보이세요!
        </h3>
        <p className="text-xs sm:text-sm text-fg-secondary max-w-md mx-auto">
          완벽하지 않아도 괜찮습니다. 세상과 마주할 때 프로덕트는 진정으로 성장합니다.
        </p>
        <div>
          <button
            onClick={handleStartSubmit}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-btn bg-accent text-white text-sm font-bold shadow-lg hover:bg-accent-hover transition-all active:scale-[0.98]"
          >
            <span>무료로 내 앱 등록하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
