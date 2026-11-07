import React, { useState, useEffect, useRef } from 'react';
import { X, Check, User, Camera, UploadCloud, RotateCcw, Loader2, Link2, Sparkles } from 'lucide-react';
import { useApp } from '../AppContext';
import { uploadToCloudinary } from '../lib/cloudinary';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  { name: 'demonst 마스코트', url: '/demon-mascot.png' },
  { name: 'AI 빌더 봇', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=demonst' },
  { name: '픽셀 메이커', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=maker' },
  { name: '인디 모험가', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=indie' },
  { name: '고양이 개발자', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=kitty' },
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile, showToast } = useApp();

  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || '/demon-mascot.png');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [role, setRole] = useState(user.role || '인디 메이커');
  const [bio, setBio] = useState(user.bio || '새로운 가치를 코드로 만드는 메이커입니다.');
  const [buildingApp, setBuildingApp] = useState(user.buildingApp || '');
  const [tagsInput, setTagsInput] = useState((user.tags || ['개발자', 'SaaS', 'AI']).join(', '));
  const [website, setWebsite] = useState(user.website || '');
  const [github, setGithub] = useState(user.github || '');
  const [twitter, setTwitter] = useState(user.twitter || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or user updates
  useEffect(() => {
    if (isOpen) {
      setName(user.name || '');
      setAvatar(user.avatar || '/demon-mascot.png');
      setAvatarUrlInput('');
      setRole(user.role || '인디 메이커');
      setBio(user.bio || '새로운 가치를 코드로 만드는 메이커입니다.');
      setBuildingApp(user.buildingApp || '');
      setTagsInput((user.tags || ['개발자', 'SaaS', 'AI']).join(', '));
      setWebsite(user.website || '');
      setGithub(user.github || '');
      setTwitter(user.twitter || '');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // File Upload Handler (Cloudinary + Local FileReader DataURL fallback)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG, WebP, GIF 등)만 선택할 수 있습니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadToCloudinary(file);
      setAvatar(uploadedUrl);
      showToast('📸 프로필 사진이 성공적으로 업로드되었습니다!');
    } catch (err) {
      console.warn('Cloudinary upload warning, falling back to local reader:', err);
      // Fallback: Read as Base64 DataURL
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
          showToast('📸 프로필 사진이 적용되었습니다!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    const trimmed = avatarUrlInput.trim();
    if (!trimmed) return;
    setAvatar(trimmed);
    setAvatarUrlInput('');
    showToast('📸 프로필 사진 URL이 적용되었습니다!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    updateUserProfile({
      name: name.trim(),
      avatar: avatar.trim() || '/demon-mascot.png',
      role: role.trim() || '인디 메이커',
      bio: bio.trim(),
      buildingApp: buildingApp.trim(),
      tags: parsedTags.length > 0 ? parsedTags : ['메이커'],
      website: website.trim(),
      github: github.trim(),
      twitter: twitter.trim(),
    });

    setIsSaving(false);
    showToast('✨ 프로필이 성공적으로 업데이트되었습니다!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-[540px] max-h-[92vh] overflow-y-auto rounded-card border border-border bg-surface p-6 shadow-elevated transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-btn p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-5">
          <div className="size-8 rounded-full bg-brand-subtle flex items-center justify-center text-accent">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-fg">내 빌더 프로필 수정</h2>
            <p className="text-xs text-fg-muted">프로필 사진과 소개 정보는 demonst 전체에 실시간 반영됩니다.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ============================================================ */}
          {/* 1. Profile Picture Editor (Upload, URL, Presets)             */}
          {/* ============================================================ */}
          <div className="rounded-card border border-border bg-surface-2 p-4">
            <label className="block text-xs font-bold text-fg mb-3">프로필 사진 수정</label>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Circular Avatar Preview with Camera Overlay */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group size-20 shrink-0 rounded-full ring-4 ring-border overflow-hidden bg-surface cursor-pointer shadow-sm"
                title="클릭하여 내 사진 업로드"
              >
                <img
                  src={avatar || '/demon-mascot.png'}
                  alt="프로필 미리보기"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/demon-mascot.png';
                  }}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-[10px] font-bold gap-1">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>변경</span>
                    </>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div className="flex-1 w-full flex flex-col gap-2.5">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {/* Upload & Reset Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-btn bg-surface border border-border px-3 py-1.5 text-xs font-bold text-fg hover:bg-surface-3 transition-colors shadow-2xs"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5 text-accent" />
                    )}
                    <span>{isUploading ? '업로드 중...' : '내 사진 올리기'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvatar('/demon-mascot.png')}
                    className="inline-flex items-center gap-1 rounded-btn px-2.5 py-1.5 text-xs font-semibold text-fg-muted hover:text-fg hover:bg-surface transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>기본 마스코트로 리셋</span>
                  </button>
                </div>

                {/* Direct Image URL Input */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="또는 이미지 웹 링크(URL) 직접 입력"
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyUrl();
                        }
                      }}
                      className="w-full rounded-btn border border-border bg-surface px-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none placeholder:text-fg-muted"
                    />
                  </div>
                  {avatarUrlInput.trim() && (
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="rounded-btn bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-hover transition-colors"
                    >
                      적용
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                  <span className="text-[10px] font-semibold text-fg-muted shrink-0">추천 캐릭터:</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatar(preset.url);
                          showToast(`'${preset.name}' 캐릭터가 선택되었습니다.`);
                        }}
                        title={preset.name}
                        className={`size-6 rounded-full overflow-hidden border transition-all shrink-0 ${
                          avatar === preset.url
                            ? 'ring-2 ring-accent border-accent scale-110'
                            : 'border-border hover:scale-105'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. Builder Profile Info                                      */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-fg mb-1">이름 / 닉네임 *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1">직군 / 역할 *</label>
              <input
                type="text"
                required
                placeholder="예: 1인 풀스택 메이커, AI 엔지니어"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-fg mb-1">한 줄 소개 (Bio)</label>
            <textarea
              rows={2}
              placeholder="자신을 표현하는 소개글을 적어주세요."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-btn border border-border bg-surface-2 p-2.5 text-xs text-fg focus:border-accent focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-fg mb-1">현재 빌딩 중인 프로젝트</label>
            <input
              type="text"
              placeholder="예: CareerFlow, 반짝포지, demonst"
              value={buildingApp}
              onChange={(e) => setBuildingApp(e.target.value)}
              className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-fg mb-1">기술 스택 / 관심 태그 (쉼표로 구분)</label>
            <input
              type="text"
              placeholder="React, Next.js, Python, Figma, AI"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-fg mb-1">개인 웹사이트 / 블로그 / 포트폴리오 URL (선택)</label>
            <input
              type="url"
              placeholder="https://my-domain.com 또는 https://velog.io/@..."
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-fg mb-1">GitHub 프로필 URL (선택)</label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1">Twitter / X URL (선택)</label>
              <input
                type="url"
                placeholder="https://x.com/..."
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-btn px-4 py-2 text-xs font-semibold text-fg-muted hover:text-fg"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? '저장 중...' : '프로필 저장하기'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
