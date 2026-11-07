import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { useApp } from '../AppContext';
import { fetchWebsiteMetadata, ExtractedMetadata } from '../lib/metadataFetcher';
import { uploadToCloudinary } from '../lib/cloudinary';
import { ImageUploader } from './ImageUploader';

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
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // AI Crawler: Crawls only what exists, leaves unknown blank!
  // ==========================================
  const handleAutoFill = async () => {
    if (!url.trim()) return;

    requireAuth(async () => {
      setIsCrawling(true);
      setCrawlStatus('🤖 웹사이트 분석 및 정보 크롤링 중...');

      try {
        const meta: ExtractedMetadata = await fetchWebsiteMetadata(url);

        // 1. 기본 정보 (모르는 내용은 빈칸)
        setTitle(meta.title || '');
        setTagline(meta.tagline || '');

        // 2. 설명
        setDescription(meta.description || '');

        // 3. 미디어
        setIconUrl(meta.logoUrl || '');
        setGallery(meta.gallery || (meta.screenshotUrl ? [meta.screenshotUrl] : []));
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

        setCrawlStatus('✨ 웹사이트 분석이 완료되었습니다!');
        setTimeout(() => {
          setIsCrawling(false);
          setStep(2);
        }, 500);
      } catch (err) {
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

  // Gallery file upload handler
  const handleGalleryFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    showToast('갤러리 이미지를 업로드 중입니다...');
    const uploadedList: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const u = await uploadToCloudinary(files[i]);
        if (u) uploadedList.push(u);
      } catch {}
    }
    if (uploadedList.length > 0) {
      setGallery((prev) => [...prev, ...uploadedList]);
      showToast(`${uploadedList.length}장의 이미지가 갤러리에 추가되었습니다.`);
    }
  };

  // Add Gallery by URL
  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    setGallery((prev) => [...prev, newGalleryUrl.trim()]);
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

    if (newText.length > 500) {
      showToast('설명은 최대 500자까지 작성할 수 있습니다.');
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
                  <span>{isCrawling ? 'AI가 정보를 크롤링하는 중...' : 'AI로 제품 정보 자동 크롤링하기'}</span>
                </button>
              </div>
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
          {/* CARD 2: 설명 (Description with Markdown Toolbar)             */}
          {/* ------------------------------------------------------------ */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="mb-4">
              <h2 className="text-base font-bold text-fg">설명</h2>
              <p className="text-xs text-fg-muted mt-0.5">
                기존 제품과 무엇이 새롭거나 다른가요? 어떤 기능이 돋보이나요?
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-fg">제품 설명</label>
                <span className="text-[11px] text-fg-muted">{description.length}/500</span>
              </div>

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
                rows={5}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="제품을 한두 문단으로 소개해 주세요. 굵게·목록·링크 같은 마크다운을 쓸 수 있어요."
                className="w-full rounded-b-btn border border-border bg-surface-2 p-3 text-xs text-fg focus:border-accent focus:outline-none leading-relaxed"
              />
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
                <h3 className="text-xs font-bold text-fg mb-0.5">갤러리</h3>
                <p className="text-[11px] text-fg-muted mb-3">
                  제품을 소개하는 이미지예요. 올린 순서대로 보여지며, 드래그해 순서를 바꿀 수 있어요. 3장 이상을 권장해요.
                </p>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={galleryFileInputRef}
                  onChange={(e) => handleGalleryFiles(e.target.files)}
                  className="hidden"
                />

                {/* Upload Area */}
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
                </div>

                {/* Image URL Input Bar */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="url"
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="또는 이미지 URL 붙여넣기 후 추가"
                    className="flex-1 rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrl}
                    className="rounded-btn bg-surface-2 border border-border px-3.5 py-2 text-xs font-bold text-fg hover:bg-surface-3 transition-colors"
                  >
                    추가
                  </button>
                </div>

                {/* Gallery Previews Grid */}
                {gallery.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {gallery.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-video rounded-btn overflow-hidden border border-border bg-surface-2"
                      >
                        <img
                          src={imgUrl}
                          alt={`갤러리 이미지 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setGallery(gallery.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
