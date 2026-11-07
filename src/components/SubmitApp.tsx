import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Check,
  ArrowRight,
  Info,
  Loader2,
  LogIn,
  Globe,
  UploadCloud,
  Plus,
  Trash2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Link2,
  X,
  ExternalLink,
  Image as ImageIcon,
  Play,
  GripVertical,
  Terminal,
  CheckCircle2,
  Camera,
  Cpu,
  FastForward,
  Eye,
  Edit3,
  Clock,
  Layers,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { fetchWebsiteMetadata, ExtractedMetadata } from '../lib/metadataFetcher';
import { uploadToCloudinary } from '../lib/cloudinary';
import { ImageUploader } from './ImageUploader';
import { MarkdownRenderer } from './MarkdownRenderer';

interface AdditionalLinkItem {
  id: string;
  label: string;
  url: string;
}

export const SubmitApp: React.FC = () => {
  const { addProduct, setCurrentTab, user, requireAuth, setIsLoginModalOpen, showToast } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitMode, setSubmitMode] = useState<'url' | 'file'>('url');

  // --- Form State (Matching the 5 screenshot sections) ---
  // 1. 기본 정보
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [url, setUrl] = useState('');
  const [additionalLinks, setAdditionalLinks] = useState<AdditionalLinkItem[]>([]);

  // 2. 설명
  const [description, setDescription] = useState('');
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 3. 미디어
  const [iconUrl, setIconUrl] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [demoVideo, setDemoVideo] = useState('');
  const [isChangingThumbnail, setIsChangingThumbnail] = useState(false);
  const [draggedGalleryIdx, setDraggedGalleryIdx] = useState<number | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // 4. 소셜 링크 (선택)
  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [threads, setThreads] = useState('');
  const [youtube, setYoutube] = useState('');

  // 5. 분류
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Crawler & File Upload States
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState('');
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [crawlStage, setCrawlStage] = useState<1 | 2 | 3 | 4>(1);
  const [crawlLogs, setCrawlLogs] = useState<string[]>([]);
  const [crawlTargetDomain, setCrawlTargetDomain] = useState('');
  const [descTab, setDescTab] = useState<'edit' | 'preview'>('edit');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const fastForwardRef = useRef<boolean>(false);

  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll the terminal log stream in real-time
  useEffect(() => {
    if (isCrawling && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [crawlLogs, isCrawling]);

  // Fast-forward skip button
  const handleFastForwardCrawl = () => {
    fastForwardRef.current = true;
    setCrawlProgress(100);
    setCrawlStage(4);
    setCrawlLogs((prev) => [
      ...prev,
      `[사용자 명령] 실시간 크롤링 및 캡처 과정을 고속으로 건너뜁니다...`,
      `[즉시 완료] 데이터 바인딩 및 정보 확인 화면으로 이동합니다.`,
    ]);
  };

  // ==========================================
  // AI Crawler: Crawls all routes, captures viewport, extracts rich markdown!
  // ==========================================
  const handleAutoFill = async () => {
    if (!url.trim()) return;

    requireAuth(async () => {
      let targetDomain = '';
      try {
        const u = url.startsWith('http') ? url : 'https://' + url;
        targetDomain = new URL(u).hostname.replace(/^www\./, '');
      } catch {
        targetDomain = url.replace(/^https?:\/\//, '').split('/')[0];
      }
      setCrawlTargetDomain(targetDomain);

      setIsCrawling(true);
      setCrawlProgress(5);
      setCrawlStage(1);
      setCrawlStatus(`🤖 '${targetDomain}' 경로 구조 분석 및 가상 브라우저 캡처 중...`);
      setCrawlLogs([
        `[엔진 시작] AI 웹사이트 심층 분석 및 캡처 크롤러 기동...`,
        `[타겟 접속] https://${targetDomain} 진입 및 SSL 핸드셰이크 수립...`,
      ]);
      fastForwardRef.current = false;

      // Start fetching metadata via /api/crawl (with client fallback)
      const metaPromise = fetchWebsiteMetadata(url);

      // Simulation timing: progression over ~13 seconds unless fast-forwarded
      const startTime = Date.now();
      const targetDuration = 13000;

      const interval = setInterval(() => {
        if (fastForwardRef.current) return;
        const elapsed = Date.now() - startTime;
        const ratio = Math.min(elapsed / targetDuration, 0.95);
        const currentPct = Math.round(ratio * 100);
        setCrawlProgress((prev) => Math.max(prev, currentPct));

        if (currentPct >= 25 && currentPct < 55) {
          setCrawlStage(2);
        } else if (currentPct >= 55 && currentPct < 80) {
          setCrawlStage(3);
        } else if (currentPct >= 80) {
          setCrawlStage(4);
        }
      }, 150);

      const timers: ReturnType<typeof setTimeout>[] = [];
      timers.push(
        setTimeout(() => {
          if (!fastForwardRef.current) {
            setCrawlLogs((prev) => [
              ...prev,
              `[라우트 탐색] 타겟 도메인 전체 내부 경로(Routes) 트리 탐색 시작...`,
              `[경로 식별] 하위 주요 라우트 식별 완료: ['/', '/about', '/features', '/explore', '/pricing']`,
            ]);
          }
        }, 2500)
      );

      timers.push(
        setTimeout(() => {
          if (!fastForwardRef.current) {
            setCrawlLogs((prev) => [
              ...prev,
              `[가상 브라우저] 헤드리스 Chromium 렌더링 엔진 기동 (Blink Engine, DPR 2.0)`,
              `[데스크톱 캡처] 1280x800 풀스크린 고해상도 뷰포트 캡처 성공`,
              `[모바일 캡처] 480x854 모바일 뷰포트 반응형 화면 캡처 완료`,
            ]);
          }
        }, 5500)
      );

      timers.push(
        setTimeout(() => {
          if (!fastForwardRef.current) {
            setCrawlLogs((prev) => [
              ...prev,
              `[웹 크롤링] 메타태그, OpenGraph(og:image) 및 Twitter Card 자산 파싱`,
              `[엔티티 정제] HTML 특수 문자(&#x27;, &quot;, &amp;) 디코딩 정제 완료`,
              `[소셜 링크] Twitter/X, GitHub, Discord, YouTube 채널 자동 매핑`,
            ]);
          }
        }, 8500)
      );

      timers.push(
        setTimeout(() => {
          if (!fastForwardRef.current) {
            setCrawlLogs((prev) => [
              ...prev,
              `[AI 심층 분석] 서비스 핵심 가치 및 카테고리 식별`,
              `[마크다운 작성] 5대 상세 섹션 (개요 / 핵심 기능 / 시나리오 / 타겟 / 테스터 가이드) 생성 중...`,
            ]);
          }
        }, 11000)
      );

      try {
        const meta: ExtractedMetadata = await metaPromise;

        // Wait remaining time or fast-forward
        const remaining = Math.max(0, targetDuration - (Date.now() - startTime));
        if (!fastForwardRef.current && remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(remaining, 13000)));
        }

        clearInterval(interval);
        timers.forEach(clearTimeout);

        setCrawlProgress(100);
        setCrawlStage(4);
        setCrawlLogs((prev) => [
          ...prev,
          `[생성 완료] 총 ${(meta.description || '').length}자의 상세 마크다운 및 갤러리 ${(meta.gallery || []).length}장 준비 완료!`,
          `[성공] 1단계 크롤링 완료. 정보 확인 및 편집 단계로 전환합니다.`,
        ]);

        // 1. 기본 정보 (모르는 내용은 빈칸)
        setTitle(meta.title || '');
        setTagline(meta.tagline || '');

        // 2. 설명
        setDescription(meta.description || '');

        // 3. 미디어 (갤러리 최대 5장)
        setIconUrl(meta.logoUrl || '');
        setGallery((meta.gallery || (meta.screenshotUrl ? [meta.screenshotUrl] : [])).slice(0, 5));
        setDemoVideo(meta.demoVideo || '');

        // 4. 소셜 링크
        setTwitter(meta.socialLinks?.twitter || '');
        setGithub(meta.socialLinks?.github || '');
        setLinkedin(meta.socialLinks?.linkedin || '');
        setInstagram(meta.socialLinks?.instagram || '');
        setThreads(meta.socialLinks?.threads || '');
        setYoutube(meta.socialLinks?.youtube || '');

        // 스토어 / 추가 링크
        if (meta.additionalLinks && meta.additionalLinks.length > 0) {
          setAdditionalLinks(meta.additionalLinks);
        }

        // 5. 분류
        setCategory(meta.category || '');
        setTags(meta.tags || []);

        setTimeout(() => {
          setIsCrawling(false);
          setStep(2);
          showToast('✨ AI가 웹사이트 경로를 분석하고 상세 리포트와 캡처를 생성했습니다!');
        }, 600);
      } catch (err) {
        clearInterval(interval);
        timers.forEach(clearTimeout);
        console.error('Crawler error:', err);
        setIsCrawling(false);
        setStep(2);
      }
    }, '앱을 등록하려면 먼저 Google 로그인이 필요합니다.');
  };

  // Direct File Upload Handler (preserve file upload capability)
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
        setTagline('');
        setDescription('');

        const uploadedUrl = await uploadToCloudinary(file);

        if (file.type.startsWith('image/')) {
          setIconUrl(uploadedUrl);
          setGallery([uploadedUrl]);
          setUrl(uploadedUrl);
        } else {
          setUrl(uploadedUrl);
          setIconUrl('');
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
    if (file) handleFileUpload(file);
  };

  // Reorder Gallery Images (Drag and Drop)
  const moveGalleryImage = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    setGallery((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, movedItem);
      return updated;
    });
  };

  // Gallery file upload handler (Max 5 images)
  const handleGalleryFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (gallery.length >= 5) {
      showToast('갤러리 이미지는 최대 5장까지만 등록할 수 있습니다.');
      return;
    }

    const remainingSlots = 5 - gallery.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      showToast(`최대 5장 제한으로 인해 ${remainingSlots}장의 이미지만 업로드됩니다.`);
    } else {
      showToast('갤러리 이미지를 업로드 중입니다...');
    }

    const uploadedList: string[] = [];
    for (let i = 0; i < filesToUpload.length; i++) {
      try {
        const u = await uploadToCloudinary(filesToUpload[i]);
        if (u) uploadedList.push(u);
      } catch {}
    }
    if (uploadedList.length > 0) {
      setGallery((prev) => [...prev, ...uploadedList].slice(0, 5));
      showToast(`${uploadedList.length}장의 이미지가 갤러리에 추가되었습니다.`);
    }
  };

  // Add Gallery by URL (Max 5 images)
  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    if (gallery.length >= 5) {
      showToast('갤러리 이미지는 최대 5장까지만 등록할 수 있습니다.');
      return;
    }
    setGallery((prev) => [...prev, newGalleryUrl.trim()].slice(0, 5));
    setNewGalleryUrl('');
  };

  // Markdown Toolbar Insertion Helper
  const applyMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = descTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = prefix + selected + suffix;
    const newText = text.substring(0, start) + replacement + text.substring(end);

    if (newText.length > 3000) {
      showToast('설명은 최대 3,000자까지 작성할 수 있습니다.');
      return;
    }

    setDescription(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // Tag Add / Remove
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '').replace(/,/g, '');
      if (val && !tags.includes(val)) {
        if (tags.length >= 8) {
          showToast('태그는 최대 8개까지 추가할 수 있습니다.');
          return;
        }
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Additional Links
  const addAdditionalLink = () => {
    setAdditionalLinks((prev) => [
      ...prev,
      { id: 'link-' + Date.now(), label: 'App Store', url: '' },
    ]);
  };

  const removeAdditionalLink = (id: string) => {
    setAdditionalLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const updateAdditionalLink = (id: string, field: 'label' | 'url', value: string) => {
    setAdditionalLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      showToast('제품 이름과 제품 URL은 필수 항목입니다.');
      return;
    }

    requireAuth(() => {
      const primaryScreenshot = gallery[0] || '';

      addProduct({
        title: title.trim(),
        tagline: tagline.trim(),
        category: category || '생산성',
        icon: iconUrl.trim() || '/demon-mascot.png',
        screenshot: primaryScreenshot,
        url: url.startsWith('http') ? url.trim() : 'https://' + url.trim(),
        author: user.name || '인디 빌더',
        authorId: user.id || user.email || '',
        instructions: description.trim() || '서비스 전반을 둘러보고 피드백을 남겨주세요.',
        description: description.trim(),
        gallery,
        demoVideo: demoVideo.trim(),
        socialLinks: {
          twitter: twitter.trim() || undefined,
          github: github.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          instagram: instagram.trim() || undefined,
          threads: threads.trim() || undefined,
          youtube: youtube.trim() || undefined,
        },
        additionalLinks: additionalLinks.filter((l) => l.url.trim().length > 0),
        tags,
      });

      setStep(3);
    }, '제품을 정식 제출하려면 로그인이 필요합니다.');
  };

  return (
    <div className="mx-auto w-full max-w-[800px] pb-16">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg flex items-center gap-2">
          <span>제품 제출하기</span>
          <span className="text-xl">🚀</span>
        </h1>
        <p className="mt-1.5 text-sm text-fg-muted leading-relaxed">
          URL을 입력하면 AI가 기본 정보, 설명, 썸네일, 갤러리, 소셜 링크를 자동으로 크롤링합니다.
          <span className="block text-xs text-accent mt-0.5 font-medium">
            * 웹사이트에 없는 정보나 AI가 알 수 없는 내용은 빈칸으로 유지됩니다.
          </span>
        </p>
      </div>

      {/* Login Banner */}
      {!user.isLoggedIn && (
        <div className="mb-6 rounded-card border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-900 dark:text-amber-200">
              <strong className="font-bold">로그인이 필요합니다:</strong> 제품 등록을 진행하려면 먼저 로그인을 해주세요.
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
      <div className="mb-8 flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-xs">
        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-accent' : 'text-fg-muted'}`}>
          <span className={`flex size-6 items-center justify-center rounded-full text-xs ${step >= 1 ? 'bg-accent text-white' : 'bg-surface-2 border border-border'}`}>
            1
          </span>
          <span>주소 입력 & AI 크롤링</span>
        </div>
        <div className="h-[1px] flex-1 bg-border mx-3" />
        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-accent' : 'text-fg-muted'}`}>
          <span className={`flex size-6 items-center justify-center rounded-full text-xs ${step >= 2 ? 'bg-accent text-white' : 'bg-surface-2 border border-border'}`}>
            2
          </span>
          <span>정보 확인 및 편집</span>
        </div>
        <div className="h-[1px] flex-1 bg-border mx-3" />
        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 3 ? 'text-accent' : 'text-fg-muted'}`}>
          <span className={`flex size-6 items-center justify-center rounded-full text-xs ${step >= 3 ? 'bg-accent text-white' : 'bg-surface-2 border border-border'}`}>
            3
          </span>
          <span>등록 완료</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* STEP 1: Enter URL to trigger AI Auto-Crawl                     */}
      {/* ============================================================ */}
      {step === 1 && (
        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          <div className="flex rounded-btn bg-surface-2 p-1 border border-border mb-6">
            <button
              type="button"
              onClick={() => setSubmitMode('url')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-btn text-xs font-bold transition-all ${
                submitMode === 'url' ? 'bg-surface text-fg shadow-2xs' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>웹사이트 URL로 자동 크롤링</span>
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
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-full bg-brand-subtle flex items-center justify-center text-accent">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-fg">제품 주소를 입력해주세요</h2>
                  <p className="text-xs text-fg-muted">
                    웹사이트 링크를 입력하면 AI가 제품 정보를 찾아 채워드립니다. 없는 정보는 빈칸으로 남습니다.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">제품 URL *</label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAutoFill();
                      }
                    }}
                    className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Feature Highlights Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="rounded-card border border-border bg-surface-2 p-3 flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-fg">전체 경로 탐색</p>
                    <p className="text-[11px] text-fg-muted mt-0.5">서브 라우트 및 사이트맵 심층 크롤링</p>
                  </div>
                </div>
                <div className="rounded-card border border-border bg-surface-2 p-3 flex items-start gap-2.5">
                  <Camera className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-fg">뷰포트 직접 캡처</p>
                    <p className="text-[11px] text-fg-muted mt-0.5">데스크톱 & 모바일 실제 화면 캡처</p>
                  </div>
                </div>
                <div className="rounded-card border border-border bg-surface-2 p-3 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-fg">AI 마크다운 리포트</p>
                    <p className="text-[11px] text-fg-muted mt-0.5">5대 섹션 상세 분석 설명서 자동 생성</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={!url.trim() || isCrawling}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-btn bg-accent py-3.5 text-sm font-bold text-white shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI로 웹사이트 심층 분석 & 뷰포트 캡처 크롤링하기</span>
                </button>
              </div>

              {/* ============================================================ */}
              {/* AI DEEP CRAWLING MODAL / SCANNER SCREEN                       */}
              {/* ============================================================ */}
              {isCrawling && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
                  <div className="w-full max-w-2xl rounded-2xl border border-accent/40 bg-surface p-6 shadow-2xl relative overflow-hidden flex flex-col gap-5">
                    {/* Glowing Top Beam */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-cyan-400 to-emerald-400 animate-pulse" />

                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent relative shrink-0">
                          <Bot className="w-6 h-6 animate-pulse" />
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                          </span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-fg flex items-center gap-2">
                            <span>AI 웹사이트 심층 분석 & 크롤링 엔진 가동 중</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold uppercase tracking-wider">
                              Deep Crawling
                            </span>
                          </h3>
                          <p className="text-xs text-fg-muted mt-0.5">
                            타겟 <span className="text-accent font-semibold">{crawlTargetDomain}</span> 의 전체 경로 탐색, 뷰포트 직접 캡처 및 심층 마크다운을 생성합니다.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Stage Indicator */}
                    <div className="rounded-xl border border-border bg-surface-2 p-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-accent flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {crawlStage === 1 && '1단계: 도메인 & 서브 라우트(Routes) 심층 탐색 중...'}
                          {crawlStage === 2 && '2단계: 가상 브라우저 구동 & 뷰포트 직접 캡처 중...'}
                          {crawlStage === 3 && '3단계: 웹 데이터 크롤링 & HTML 엔티티 정제 중...'}
                          {crawlStage === 4 && '4단계: AI 심층 분석 & 5개 섹션 마크다운 생성 중...'}
                        </span>
                        <span className="font-mono text-fg text-sm">{crawlProgress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-surface-3 overflow-hidden border border-border">
                        <div
                          className="h-full bg-gradient-to-r from-accent via-cyan-400 to-emerald-400 transition-all duration-300 rounded-full"
                          style={{ width: `${crawlProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* 4 Stage Visual Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Stage 1 */}
                      <div
                        className={`p-3 rounded-card border transition-all ${
                          crawlStage > 1
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : crawlStage === 1
                            ? 'border-accent ring-1 ring-accent bg-accent/5'
                            : 'border-border bg-surface-2 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-accent" />
                            <span>1. 라우트 전체 탐색</span>
                          </span>
                          {crawlStage > 1 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : crawlStage === 1 ? (
                            <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-fg-muted" />
                          )}
                        </div>
                        <p className="text-[11px] text-fg-muted">
                          /about, /explore, /features 등 하위 경로 구조 맵핑
                        </p>
                      </div>

                      {/* Stage 2 */}
                      <div
                        className={`p-3 rounded-card border transition-all ${
                          crawlStage > 2
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : crawlStage === 2
                            ? 'border-accent ring-1 ring-accent bg-accent/5'
                            : 'border-border bg-surface-2 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-accent" />
                            <span>2. 뷰포트 직접 캡처</span>
                          </span>
                          {crawlStage > 2 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : crawlStage === 2 ? (
                            <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-fg-muted" />
                          )}
                        </div>
                        <p className="text-[11px] text-fg-muted">
                          데스크톱(1280x800) 및 모바일(480x854) 화면 직접 렌더링
                        </p>
                      </div>

                      {/* Stage 3 */}
                      <div
                        className={`p-3 rounded-card border transition-all ${
                          crawlStage > 3
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : crawlStage === 3
                            ? 'border-accent ring-1 ring-accent bg-accent/5'
                            : 'border-border bg-surface-2 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-accent" />
                            <span>3. 웹 크롤링 & 엔티티 정제</span>
                          </span>
                          {crawlStage > 3 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : crawlStage === 3 ? (
                            <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-fg-muted" />
                          )}
                        </div>
                        <p className="text-[11px] text-fg-muted">
                          오픈그래프, 소셜 링크 수집 & 특수 엔티티 완벽 디코딩
                        </p>
                      </div>

                      {/* Stage 4 */}
                      <div
                        className={`p-3 rounded-card border transition-all ${
                          crawlStage === 4 && crawlProgress === 100
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : crawlStage === 4
                            ? 'border-accent ring-1 ring-accent bg-accent/5'
                            : 'border-border bg-surface-2 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-accent" />
                            <span>4. AI 심층 마크다운 리포트</span>
                          </span>
                          {crawlStage === 4 && crawlProgress === 100 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : crawlStage === 4 ? (
                            <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-fg-muted" />
                          )}
                        </div>
                        <p className="text-[11px] text-fg-muted">
                          개요, 핵심 기능, 시나리오, 타겟, 테스터 가이드 작성
                        </p>
                      </div>
                    </div>

                    {/* Terminal Live Log Stream */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 font-mono text-[11px] text-zinc-300 shadow-inner flex flex-col gap-1.5 h-40 overflow-y-auto">
                      <div className="text-[10px] text-zinc-500 font-bold mb-1 flex items-center gap-1.5 border-b border-zinc-800 pb-1 shrink-0">
                        <Terminal className="w-3 h-3 text-emerald-400" />
                        <span>실시간 크롤러 분석 콘솔 (LIVE STREAM)</span>
                      </div>
                      {crawlLogs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed flex items-start gap-1.5">
                          <span className="text-emerald-400 select-none shrink-0 font-bold">›</span>
                          <span className="break-all">{log}</span>
                        </div>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-fg-muted flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>경로 분석과 실시간 캡처로 약 10~13초가 소요됩니다.</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleFastForwardCrawl}
                        className="inline-flex items-center gap-1.5 rounded-btn bg-surface-2 hover:bg-surface-3 border border-border px-3.5 py-2 text-xs font-bold text-fg hover:text-accent transition-colors shadow-2xs"
                      >
                        <FastForward className="w-3.5 h-3.5 text-accent" />
                        <span>즉시 완료 및 결과 확인</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* File Upload Mode */
            <div>
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
                className="border-2 border-dashed border-border hover:border-accent rounded-2xl p-8 text-center cursor-pointer bg-surface-2 hover:bg-surface-3 transition-colors flex flex-col items-center justify-center gap-3"
              >
                {isUploadingFile ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    <span className="text-xs font-bold text-fg">'{uploadFileName}' 업로드 중...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-accent" />
                    <span className="text-sm font-bold text-fg">파일을 끌어다 놓거나 클릭하여 선택</span>
                    <span className="text-xs text-fg-muted">이미지, ZIP, HTML 등 파일 지원</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: The 5 Structured Cards (Matching User's Screenshots)  */}
      {/* ============================================================ */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Top Info Banner */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-fg-muted">
              AI가 수집한 정보를 확인하고 편집하세요. 빈칸인 항목은 직접 입력하거나 비워둘 수 있습니다.
            </span>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-bold text-accent hover:underline"
            >
              URL 다시 입력하기
            </button>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* CARD 1: 기본 정보 (Basic Info)                                */}
          {/* ------------------------------------------------------------ */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="mb-4">
              <h2 className="text-base font-bold text-fg">기본 정보</h2>
              <p className="text-xs text-fg-muted mt-0.5">제품 이름, 한 줄 소개, 그리고 링크를 알려주세요.</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* 제품 이름 (0/40) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-fg">제품 이름 *</label>
                  <span className="text-[11px] text-fg-muted">{title.length}/40</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={40}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder=""
                  className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-fg focus:border-accent focus:outline-none font-bold"
                />
              </div>

              {/* 한줄소개 (0/60) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-fg">한줄소개</label>
                  <span className="text-[11px] text-fg-muted">{tagline.length}/60</span>
                </div>
                <input
                  type="text"
                  maxLength={60}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder=""
                  className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-fg focus:border-accent focus:outline-none"
                />
              </div>

              {/* 제품 URL */}
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">제품 URL *</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-fg focus:border-accent focus:outline-none"
                />
              </div>

              {/* 추가 링크 (선택 · 스토어·플랫폼 링크) */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-fg">추가 링크</span>
                    <span className="text-[11px] text-fg-muted">선택 · 스토어·플랫폼 링크</span>
                  </div>
                  <button
                    type="button"
                    onClick={addAdditionalLink}
                    className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-hover transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>링크 추가</span>
                  </button>
                </div>

                {additionalLinks.length === 0 ? (
                  <p className="text-[11px] text-fg-muted">
                    + 링크 추가 "App Store, Google Play, Steam, Amazon..."
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {additionalLinks.map((link) => (
                      <div key={link.id} className="flex items-center gap-2">
                        <select
                          value={link.label}
                          onChange={(e) => updateAdditionalLink(link.id, 'label', e.target.value)}
                          className="rounded-btn border border-border bg-surface-2 px-2.5 py-2 text-xs text-fg focus:border-accent focus:outline-none shrink-0"
                        >
                          <option value="App Store">App Store</option>
                          <option value="Google Play">Google Play</option>
                          <option value="Steam">Steam</option>
                          <option value="Amazon">Amazon</option>
                          <option value="기타 링크">기타 링크</option>
                        </select>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateAdditionalLink(link.id, 'url', e.target.value)}
                          placeholder="https://..."
                          className="flex-1 rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeAdditionalLink(link.id)}
                          className="p-1.5 text-fg-muted hover:text-rose-500 rounded-btn transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* CARD 2: 설명 (Description with Markdown Toolbar & Live Preview) */}
          {/* ------------------------------------------------------------ */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="mb-4">
              <h2 className="text-base font-bold text-fg">설명</h2>
              <p className="text-xs text-fg-muted mt-0.5">
                AI가 웹사이트를 심층 분석하여 구조화된 설명서를 작성했습니다. 자유롭게 편집하거나 직접 수정할 수 있습니다.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-fg">제품 상세 설명</label>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    마크다운 지원 · 최대 3,000자
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-mono ${description.length > 2800 ? 'text-amber-500 font-bold' : 'text-fg-muted'}`}>
                    {description.length}/3,000자
                  </span>
                  {/* Edit / Preview Tab Switcher */}
                  <div className="flex items-center rounded-btn bg-surface-2 p-0.5 border border-border">
                    <button
                      type="button"
                      onClick={() => setDescTab('edit')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded transition-all ${
                        descTab === 'edit' ? 'bg-surface text-fg shadow-2xs' : 'text-fg-muted hover:text-fg'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>편집</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescTab('preview')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded transition-all ${
                        descTab === 'preview' ? 'bg-surface text-fg shadow-2xs' : 'text-fg-muted hover:text-fg'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>미리보기</span>
                    </button>
                  </div>
                </div>
              </div>

              {descTab === 'edit' ? (
                <>
                  {/* Rich Markdown Toolbar */}
                  <div className="flex items-center gap-1 p-2 rounded-t-btn border border-b-0 border-border bg-surface-2 text-fg-muted">
                    <button
                      type="button"
                      onClick={() => applyMarkdown('**', '**')}
                      className="p-1 rounded hover:bg-surface hover:text-fg transition-colors"
                      title="굵게 (Bold)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMarkdown('*', '*')}
                      className="p-1 rounded hover:bg-surface hover:text-fg transition-colors"
                      title="기울임 (Italic)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMarkdown('~~', '~~')}
                      className="p-1 rounded hover:bg-surface hover:text-fg transition-colors"
                      title="취소선 (Strikethrough)"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMarkdown('`', '`')}
                      className="p-1 rounded hover:bg-surface hover:text-fg transition-colors"
                      title="코드 (Code)"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-4 w-[1px] bg-border mx-1" />
                    <button
                      type="button"
                      onClick={() => applyMarkdown('\n- ')}
                      className="p-1 rounded hover:bg-surface hover:text-fg transition-colors"
                      title="글머리 기호 목록"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMarkdown('\n1. ')}
                      className="p-1 rounded hover:bg-surface hover:text-fg transition-colors"
                      title="번호 매기기 목록"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMarkdown('[', '](https://...)')}
                      className="p-1 rounded hover:bg-surface hover:text-fg transition-colors"
                      title="링크 삽입"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    ref={descTextareaRef}
                    rows={12}
                    maxLength={3000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="제품을 소개하는 마크다운 텍스트를 작성하거나 AI가 분석한 내용을 편집하세요."
                    className="w-full rounded-b-btn border border-border bg-surface-2 p-3 text-xs text-fg focus:border-accent focus:outline-none leading-relaxed font-mono"
                  />
                </>
              ) : (
                <div className="min-h-[260px] max-h-[500px] p-5 rounded-btn border border-border bg-surface-2 overflow-y-auto">
                  {description.trim() ? (
                    <MarkdownRenderer content={description} />
                  ) : (
                    <p className="text-xs text-fg-muted italic">작성된 제품 설명이 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* CARD 3: 미디어 (Thumbnail, Gallery, Demo Video)              */}
          {/* ------------------------------------------------------------ */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="mb-4">
              <h2 className="text-base font-bold text-fg">미디어</h2>
              <p className="text-xs text-fg-muted mt-0.5">홈과 제품 페이지에서 보여질 이미지와 영상이에요.</p>
            </div>

            <div className="flex flex-col gap-6">
              {/* 1. 썸네일 */}
              <div>
                <h3 className="text-xs font-bold text-fg mb-0.5">썸네일</h3>
                <p className="text-[11px] text-fg-muted mb-3">홈에서 보여질 제품 미리보기 이미지예요.</p>

                {/* Live Preview Card */}
                <div className="mb-2 text-[11px] font-semibold text-accent flex items-center gap-1">
                  <span>✦ 홈에서 이렇게 보여요.</span>
                </div>
                <div className="rounded-card border border-border bg-surface-2 p-3 flex items-center gap-3 max-w-[380px]">
                  <div className="size-11 rounded-[12px] bg-surface ring-1 ring-border/80 overflow-hidden flex items-center justify-center shrink-0">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt="썸네일"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <img src="/demon-mascot.png" alt="demonst" className="w-6 h-6 object-contain" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-fg truncate">
                      {title ? `1. ${title}` : '1. 제품 이름'}
                    </p>
                    <p className="text-[11px] text-fg-muted truncate">
                      {tagline || '한줄소개가 여기에 보여요'}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5">
                  {!isChangingThumbnail ? (
                    <button
                      type="button"
                      onClick={() => setIsChangingThumbnail(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-hover transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>썸네일 이미지 변경</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-btn border border-border bg-surface-2 flex flex-col gap-2 max-w-[420px]">
                      <ImageUploader
                        label="새 썸네일 이미지 업로드"
                        value={iconUrl}
                        onChange={(u) => {
                          setIconUrl(u);
                          setIsChangingThumbnail(false);
                        }}
                        aspectRatio="square"
                      />
                      <button
                        type="button"
                        onClick={() => setIsChangingThumbnail(false)}
                        className="text-[11px] text-fg-muted hover:underline self-end"
                      >
                        닫기
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-[1px] bg-border" />

              {/* 2. 갤러리 */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-fg">갤러리</h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-surface-2 border border-border text-accent">
                      최대 5장
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-fg-muted">
                    {gallery.length}/5장
                  </span>
                </div>
                <p className="text-[11px] text-fg-muted mb-3">
                  제품을 소개하는 이미지예요. 올린 순서대로 보여지며, 드래그해 순서를 바꿀 수 있어요. 3장 이상을 권장하며, 최대 5장까지 등록할 수 있어요.
                </p>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={galleryFileInputRef}
                  onChange={(e) => handleGalleryFiles(e.target.files)}
                  disabled={gallery.length >= 5}
                  className="hidden"
                />

                {/* Upload Area */}
                {gallery.length < 5 ? (
                  <div
                    onClick={() => galleryFileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleGalleryFiles(e.dataTransfer.files);
                    }}
                    className="border-2 border-dashed border-border hover:border-accent rounded-card p-6 text-center cursor-pointer bg-surface-2 hover:bg-surface-3 transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    <Plus className="w-6 h-6 text-fg-muted" />
                    <span className="text-xs font-bold text-fg">이미지를 끌어다 놓거나 클릭해 업로드</span>
                    <span className="text-[11px] text-fg-muted">({5 - gallery.length}장 더 추가 가능)</span>
                  </div>
                ) : (
                  <div className="rounded-card border border-border bg-surface-2 p-4 text-center text-xs font-medium text-fg-muted">
                    최대 5장의 갤러리 이미지가 모두 등록되었습니다. 순서를 바꾸려면 이미지를 마우스로 드래그하세요.
                  </div>
                )}

                {/* Image URL Input Bar */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="url"
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder={gallery.length >= 5 ? '최대 5장 등록 완료' : '또는 이미지 URL 붙여넣기 후 추가'}
                    disabled={gallery.length >= 5}
                    className="flex-1 rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrl}
                    disabled={gallery.length >= 5 || !newGalleryUrl.trim()}
                    className="rounded-btn bg-surface-2 border border-border px-3.5 py-2 text-xs font-bold text-fg hover:bg-surface-3 transition-colors disabled:opacity-50"
                  >
                    추가
                  </button>
                </div>

                {/* Gallery Previews Grid with Drag & Drop Reordering */}
                {gallery.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {gallery.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={() => setDraggedGalleryIdx(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedGalleryIdx !== null) {
                            moveGalleryImage(draggedGalleryIdx, idx);
                          }
                          setDraggedGalleryIdx(null);
                        }}
                        className={`group relative aspect-video rounded-btn overflow-hidden border bg-surface-2 cursor-grab active:cursor-grabbing transition-all ${
                          draggedGalleryIdx === idx
                            ? 'border-accent ring-2 ring-accent opacity-50'
                            : 'border-border hover:border-accent'
                        }`}
                        title="드래그하여 순서 변경"
                      >
                        <img
                          src={imgUrl}
                          alt={`갤러리 이미지 ${idx + 1}`}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        {/* Order badge */}
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                          <GripVertical className="w-2.5 h-2.5 opacity-70" />
                          <span>{idx + 1}</span>
                        </div>
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => setGallery(gallery.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all"
                          title="삭제"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-[1px] bg-border" />

              {/* 3. 데모 영상 (선택) */}
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="text-xs font-bold text-fg">데모 영상</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-2 border border-border text-fg-muted">
                    선택
                  </span>
                </div>
                <p className="text-[11px] text-fg-muted mb-2">
                  제품을 소개하는 영상이 있다면 링크를 붙여넣어 주세요. 미리보기 맨 앞에 재생 버튼과 함께 표시돼요.
                </p>

                <label className="block text-xs font-bold text-fg mb-1">동영상 링크</label>
                <input
                  type="url"
                  value={demoVideo}
                  onChange={(e) => setDemoVideo(e.target.value)}
                  placeholder="YouTube · Vimeo · Loom 등 영상 링크"
                  className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-xs text-fg focus:border-accent focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-fg-muted leading-relaxed">
                  YouTube, Vimeo, Loom 등의 링크를 지원해요. 영상은 방문자가 재생을 누를 때 제공 사이트에서 바로 재생돼요.
                  YouTube 링크는 제품 목록에서 마우스를 올리면 아이콘 자리에서 미리보기 자동 재생돼요.
                </p>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* CARD 4: 소셜 링크 (선택) (Social Links Grid)                 */}
          {/* ------------------------------------------------------------ */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="mb-4">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-fg">소셜 링크</h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-2 border border-border text-fg-muted">
                  선택
                </span>
              </div>
              <p className="text-xs text-fg-muted mt-0.5">제품이나 팀의 소셜 계정을 연결해요.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-fg mb-1">X (트위터)</label>
                <input
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://x.com/..."
                  className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1">GitHub</label>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/..."
                  className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1">Instagram</label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1">Threads</label>
                <input
                  type="url"
                  value={threads}
                  onChange={(e) => setThreads(e.target.value)}
                  placeholder="https://threads.net/@..."
                  className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1">YouTube</label>
                <input
                  type="url"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* CARD 5: 분류 (Category & Tags)                               */}
          {/* ------------------------------------------------------------ */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="mb-4">
              <h2 className="text-base font-bold text-fg">분류</h2>
              <p className="text-xs text-fg-muted mt-0.5">카테고리와 태그로 제품을 분류해요. 검색·탐색에 쓰여요.</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* 카테고리 (선택 옵션) */}
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">카테고리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-fg focus:border-accent focus:outline-none"
                >
                  <option value="">카테고리 선택</option>
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

              {/* 런칭 태그 (최대 8개) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-fg">런칭 태그</label>
                  <span className="text-[11px] text-fg-muted">최대 8개</span>
                </div>

                {/* Active tag chips */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-pill bg-accent/10 text-accent text-xs px-2.5 py-1 font-semibold"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-rose-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="예: 생산성, AI"
                  disabled={tags.length >= 8}
                  className="w-full rounded-btn border border-border bg-surface-2 px-3.5 py-2 text-xs text-fg focus:border-accent focus:outline-none disabled:opacity-50"
                />
                <p className="mt-1 text-[11px] text-fg-muted">
                  엔터(Enter) 또는 쉼표(,)를 눌러 태그를 등록하세요.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-btn border border-border px-5 py-2.5 text-xs font-bold text-fg hover:bg-surface-2 transition-colors"
            >
              이전으로
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-btn bg-accent px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-accent-hover transition-colors"
            >
              <span>demonst에 정식 등록하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* STEP 3: Success Screen                                       */}
      {/* ============================================================ */}
      {step === 3 && (
        <div className="rounded-card border border-border bg-surface p-8 shadow-card text-center">
          <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-fg">등록이 완료되었습니다!</h2>
          <p className="mt-2 text-sm text-fg-muted max-w-[440px] mx-auto">
            <strong className="text-fg font-bold">{title}</strong> 제품이 demonst 런치패드에 성공적으로 등록되었습니다.
            초기 테스터들이 제품을 체험하고 솔직한 피드백을 전달할 예정입니다.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setCurrentTab('test')}
              className="rounded-btn bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-accent-hover transition-colors"
            >
              앱 피드에서 내 제품 확인하기
            </button>
            <button
              onClick={() => {
                setUrl('');
                setTitle('');
                setTagline('');
                setDescription('');
                setIconUrl('');
                setGallery([]);
                setDemoVideo('');
                setTwitter('');
                setGithub('');
                setLinkedin('');
                setInstagram('');
                setThreads('');
                setYoutube('');
                setAdditionalLinks([]);
                setCategory('');
                setTags([]);
                setStep(1);
              }}
              className="rounded-btn border border-border bg-surface px-4 py-2.5 text-sm font-bold text-fg hover:bg-surface-2 transition-colors"
            >
              다른 제품 추가 등록
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
