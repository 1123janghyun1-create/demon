import React, { useState } from 'react';
import { X, Check, User, Sparkles } from 'lucide-react';
import { useApp } from '../AppContext';
import { ImageUploader } from './ImageUploader';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile, showToast } = useApp();

  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || '/demon-mascot.png');
  const [role, setRole] = useState(user.role || '인디 메이커');
  const [bio, setBio] = useState(user.bio || '새로운 가치를 코드로 만드는 메이커입니다.');
  const [buildingApp, setBuildingApp] = useState(user.buildingApp || '');
  const [tagsInput, setTagsInput] = useState((user.tags || ['개발자', 'SaaS', 'AI']).join(', '));
  const [website, setWebsite] = useState(user.website || '');
  const [github, setGithub] = useState(user.github || '');
  const [twitter, setTwitter] = useState(user.twitter || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
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
        className="relative w-full max-w-[520px] max-h-[92vh] overflow-y-auto rounded-card border border-border bg-surface p-6 shadow-elevated transition-all"
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
            <p className="text-xs text-fg-muted">수정된 정보는 빌더 페이지와 커뮤니티에 실시간 반영됩니다.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Avatar Upload with Cloudinary */}
          <ImageUploader
            label="프로필 사진 (Cloudinary 업로드 지원)"
            value={avatar}
            onChange={(newUrl) => setAvatar(newUrl || '/demon-mascot.png')}
            aspectRatio="square"
            hint="사진을 드래그하거나 클릭하여 교체"
          />

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
