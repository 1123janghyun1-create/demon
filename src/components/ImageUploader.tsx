import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { uploadToCloudinary, isCloudinaryConfigured } from '../lib/cloudinary';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: 'square' | 'video';
  hint?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  aspectRatio = 'square',
  hint = 'PNG, JPG, WebP 지원 (최대 5MB)'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (err: any) {
      alert(err.message || '업로드 실패');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-fg">{label}</label>
        {isCloudinaryConfigured && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Cloudinary 연동됨
          </span>
        )}
      </div>

      {value ? (
        <div className="relative rounded-card border border-border bg-surface-2 p-2 flex items-center gap-3">
          <div
            className={`overflow-hidden rounded-icon bg-surface border border-border flex items-center justify-center shrink-0 ${
              aspectRatio === 'square' ? 'w-16 h-16' : 'w-28 h-16'
            }`}
          >
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-fg truncate">{value}</p>
            <p className="text-[10px] text-fg-muted mt-0.5">이미지가 정상적으로 등록되었습니다.</p>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-btn p-1.5 text-fg-muted hover:bg-surface hover:text-fg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-card p-4 cursor-pointer transition-colors ${
            dragActive
              ? 'border-accent bg-brand-subtle/40'
              : 'border-border hover:border-accent hover:bg-surface-2'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            accept="image/*"
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center py-2">
              <Loader2 className="w-6 h-6 animate-spin text-accent mb-2" />
              <span className="text-xs font-semibold text-fg">Cloudinary에 업로드 중...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center py-1 text-center">
              <UploadCloud className="w-6 h-6 text-fg-muted mb-1.5" />
              <span className="text-xs font-bold text-fg">클릭하거나 파일을 여기로 드래그하세요</span>
              <span className="text-[10px] text-fg-muted mt-0.5">{hint}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
