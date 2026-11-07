import React, { useState, useRef } from 'react';
import { Bot, Sparkles, Check, ArrowRight, Info, Loader2, LogIn, Globe, UploadCloud, FileText } from 'lucide-react';
import { useApp } from '../AppContext';
import { fetchWebsiteMetadata } from '../lib/metadataFetcher';
import { uploadToCloudinary } from '../lib/cloudinary';
import { ImageUploader } from './ImageUploader';

export const SubmitApp: React.FC = () => {
  const { addProduct, setCurrentTab, user, requireAuth, setIsLoginModalOpen, showToast } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitMode, setSubmitMode] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('생산성 / SaaS');
  const [instructions, setInstructions] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState('');

  // File upload state
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Bot Auto Crawler with Real Screenshot & Logo fetching
  const handleAutoFill = async () => {
    if (!url.trim()) return;

    requireAuth(async () => {
      setIsCrawling(true);
      setCrawlStatus('🤖 웹사이트 분석 및 로고·캡처 이미지 검색 중...');

      try {
        const meta = await fetchWebsiteMetadata(url);

        setTitle(meta.title);
        setTagline(meta.tagline);
        setIconUrl(meta.logoUrl);
        setScreenshotUrl(meta.screenshotUrl);
        setCategory(meta.category);
        setInstructions(meta.instructions);

        setCrawlStatus('✨ 로고와 스크린샷 이미지를 성공적으로 찾았습니다!');
        setTimeout(() => {
          setIsCrawling(false);
          setStep(2);
        }, 600);
      } catch (err) {
        console.error('Crawler failed', err);
        setIsCrawling(false);
        setStep(2);
      }
    }, '앱을 등록하려면 먼저 Google 로그인이 필요합니다.');
  };

  // Direct File Upload handler (images, demo files, zip, html)
  const handleFileUpload = async (file: File) => {
    requireAuth(async () => {
      try {
        setIsUploadingFile(true);
        setUploadFileName(file.name);

        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        setTitle(cleanName);
        setTagline(`${cleanName} — 인디 메이커의 신작 프로젝트입니다.`);
        setInstructions('업로드된 프로젝트 파일과 스크린샷을 검토하고 피드백을 남겨주세요.');

        // Upload to Cloudinary
        const uploadedUrl = await uploadToCloudinary(file);

        if (file.type.startsWith('image/')) {
          setIconUrl(uploadedUrl);
          setScreenshotUrl(uploadedUrl);
          setUrl(uploadedUrl);
        } else {
          setUrl(uploadedUrl);
          setIconUrl('/demon-mascot.png');
        }

        showToast('파일이 성공적으로 업로드되었습니다!');
        setIsUploadingFile(false);
        setStep(2);
      } catch (err: any) {
        console.error('File upload error:', err);
        setIsUploadingFile(false);
        showToast(err.message || '파일 업로드에 실패했습니다.');
      }
    }, '파일을 업로드하여 앱을 등록하려면 먼저 Google 로그인이 필요합니다.');
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    requireAuth(() => {
      addProduct({
        title: title.trim(),
        tagline: tagline.trim() || '테스터를 모집 중인 새로운 프로젝트',
        category,
        icon: iconUrl.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        screenshot: screenshotUrl.trim(),
        url: url.startsWith('http') ? url : 'https://' + url,
        author: user.name || '데몬빌더',
        instructions: instructions || '서비스 전반을 자유롭게 둘러보시고 피드백을 남겨주세요.'
      });

      setStep(3);
    }, '제품을 정식 제출하려면 로그인이 필요합니다.');
  };

  return (
    <div className="mx-auto w-full max-w-[760px]">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg flex items-center gap-2">
          <span>제품 제출하기</span>
          <span className="text-xl">🚀</span>
        </h1>
        <p className="mt-2 text-sm text-fg-muted leading-relaxed">
          URL만 붙여넣으면 AI 봇이 제품 이름, 설명, 실제 로고와 화면 캡처 이미지를 자동으로 찾아드려요 🤩
        </p>
      </div>

      {/* Login Requirement Banner */}
      {!user.isLoggedIn && (
        <div className="mb-6 rounded-card border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-900 dark:text-amber-200">
              <strong className="font-bold">로그인이 필요합니다:</strong> 제품 등록을 진행하려면 먼저 Google 로그인을 해주세요.
            </p>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="shrink-0 flex items-center gap-1.5 rounded-btn bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>로그인하기</span>
          </button>
        </div>
      )}

      {/* Step Indicators */}
      <div className="mb-8 flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-sm">
        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-accent' : 'text-fg-muted'}`}>
          <span className={`flex size-6 items-center justify-center rounded-full text-xs ${step >= 1 ? 'bg-accent text-white' : 'bg-surface-2 border border-border'}`}>
            1
          </span>
          <span>정보 입력</span>
        </div>
        <div className="h-[1px] flex-1 bg-border mx-3" />
        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-accent' : 'text-fg-muted'}`}>
          <span className={`flex size-6 items-center justify-center rounded-full text-xs ${step >= 2 ? 'bg-accent text-white' : 'bg-surface-2 border border-border'}`}>
            2
          </span>
          <span>AI 봇 결과 확인·수정</span>
        </div>
        <div className="h-[1px] flex-1 bg-border mx-3" />
        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 3 ? 'text-accent' : 'text-fg-muted'}`}>
          <span className={`flex size-6 items-center justify-center rounded-full text-xs ${step >= 3 ? 'bg-accent text-white' : 'bg-surface-2 border border-border'}`}>
            3
          </span>
          <span>제출 완료</span>
        </div>
      </div>

      {/* Step 1: Choose URL or File Upload */}
      {step === 1 && (
        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-btn bg-surface-2 p-1 border border-border mb-6">
            <button
              type="button"
              onClick={() => setSubmitMode('url')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-btn text-xs font-bold transition-all ${
                submitMode === 'url' ? 'bg-surface text-fg shadow-2xs' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>웹사이트 URL로 등록</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmitMode('file')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-btn text-xs font-bold transition-all ${
                submitMode === 'file' ? 'bg-surface text-fg shadow-2xs' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>파일 직접 업로드로 등록</span>
            </button>
          </div>

          {submitMode === 'url' ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-full bg-brand-subtle flex items-center justify-center text-accent">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-fg">제품 주소를 알려주세요</h2>
                  <p className="text-xs text-fg-muted">웹사이트, App Store, Google Play 링크를 모두 지원합니다.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-fg mb-1.5">제품 주소 (URL) *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://toss.im 또는 https://careerflow.co.kr 등"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg mb-1.5">제품 이름 (선택 - 비워두면 AI 봇이 자동 추출)</label>
                  <input
                    type="text"
                    placeholder="직접 입력하지 않아도 AI가 사이트에서 자동으로 찾아옵니다"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
                  />
                </div>

                {isCrawling && (
                  <div className="rounded-btn border border-accent/20 bg-brand-subtle p-3.5 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-accent animate-spin shrink-0" />
                    <span className="text-xs font-bold text-accent">{crawlStatus}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    disabled={!url.trim() || isCrawling}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-btn bg-accent py-3 text-sm font-bold text-white shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isCrawling ? 'AI 봇이 로고와 스크린샷을 찾는 중...' : 'AI 봇으로 로고·스크린샷 자동 가져오기'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* File Upload Mode */
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-full bg-brand-subtle flex items-center justify-center text-accent">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-fg">프로젝트 파일을 업로드하세요</h2>
                  <p className="text-xs text-fg-muted">
                    스크린샷 이미지(PNG, JPG), 데모 HTML, ZIP 또는 앱 빌드 파일을 직접 업로드할 수 있습니다.
                  </p>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileInputChange}
                accept="image/*,.zip,.html,.pdf,.apk"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="border-2 border-dashed border-border hover:border-accent rounded-2xl p-8 text-center cursor-pointer bg-surface-2 hover:bg-surface-3 transition-colors flex flex-col items-center justify-center gap-3 group"
              >
                {isUploadingFile ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    <span className="text-xs font-bold text-fg">
                      '{uploadFileName}' Cloudinary로 안전하게 업로드 중...
                    </span>
                    <span className="text-[11px] text-fg-muted">잠시만 기다려주세요</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-bold text-fg">
                        파일을 여기에 드래그하거나 클릭하여 선택
                      </span>
                      <span className="text-xs text-fg-muted">
                        지원 형식: 이미지 (PNG, JPG, WebP), 데모 HTML, ZIP 압축 파일 등
                      </span>
                    </div>
                    <span className="mt-2 text-[11px] font-semibold text-accent px-3 py-1 rounded-full bg-accent/10">
                      Cloudinary CDN 자동 최적화 저장
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Confirm & Edit with Cloudinary Uploaders */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="rounded-card border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-fg">AI 봇이 찾은 정보를 확인해주세요</h2>
              <p className="text-xs text-fg-muted">원하는 경우 Cloudinary를 통해 직접 이미지를 교체할 수도 있습니다.</p>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-pill bg-emerald-500/10 text-emerald-600 font-bold">
              AI 파싱 완료
            </span>
          </div>

          <div className="flex flex-col gap-5">
            {/* Found Media Preview: Logo & Screenshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-btn border border-border bg-surface-2">
              <ImageUploader
                label="앱 로고 (AI 자동 탐색 / Cloudinary)"
                value={iconUrl}
                onChange={(newUrl) => setIconUrl(newUrl)}
                aspectRatio="square"
                hint="AI가 찾은 로고 또는 직접 업로드"
              />

              <ImageUploader
                label="웹사이트 캡처 스크린샷 (AI 캡처 / Cloudinary)"
                value={screenshotUrl}
                onChange={(newUrl) => setScreenshotUrl(newUrl)}
                aspectRatio="video"
                hint="AI가 캡처한 화면 또는 직접 업로드"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1.5">제품 이름 *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-sm text-fg focus:border-accent focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1.5">한 줄 소개 *</label>
              <input
                type="text"
                required
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-sm text-fg focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">카테고리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                >
                  <option value="생산성 / SaaS">생산성 / SaaS</option>
                  <option value="AI / 머신러닝">AI / 머신러닝</option>
                  <option value="라이프스타일 / 건강">라이프스타일 / 건강</option>
                  <option value="개발자 도구">개발자 도구</option>
                  <option value="게임 / 엔터">게임 / 엔터</option>
                  <option value="커뮤니티 / 소셜">커뮤니티 / 소셜</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">웹사이트 URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1.5">테스트 지시사항 (AI가 맞춤 생성한 질문 가이드)</label>
              <textarea
                rows={5}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface-2 p-3 text-xs text-fg focus:border-accent focus:outline-none leading-relaxed font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-btn border border-border px-4 py-2 text-xs font-bold text-fg hover:bg-surface-2"
              >
                이전으로
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-accent-hover transition-colors"
              >
                <span>demonst에 정식 등록하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Step 3: Success Screen */}
      {step === 3 && (
        <div className="rounded-card border border-border bg-surface p-8 shadow-card text-center">
          <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-fg">등록이 완료되었습니다!</h2>
          <p className="mt-2 text-sm text-fg-muted max-w-[420px] mx-auto">
            {title} 제품이 demonst 런치패드에 성공적으로 등록되었습니다. 초기 테스터들이 방문하여 양질의 피드백을 전달할 예정입니다.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setCurrentTab('test')}
              className="rounded-btn bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-accent-hover"
            >
              앱 피드에서 내 제품 확인하기
            </button>
            <button
              onClick={() => {
                setUrl('');
                setTitle('');
                setStep(1);
              }}
              className="rounded-btn border border-border bg-surface px-4 py-2.5 text-sm font-bold text-fg hover:bg-surface-2"
            >
              다른 제품 추가 등록
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
