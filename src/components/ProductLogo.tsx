import React, { useState, useEffect, useMemo } from 'react';

interface ProductLogoProps {
  src?: string;
  title: string;
  url?: string;
  className?: string;
  sizeClass?: string;
}

// Consistent vibrant brand gradients based on string hash
const BRAND_GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-700',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-violet-600 to-fuchsia-600',
  'from-sky-500 to-cyan-600',
];

function getGradientForTitle(title: string): string {
  if (!title) return BRAND_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % BRAND_GRADIENTS.length;
  return BRAND_GRADIENTS[idx];
}

export const ProductLogo: React.FC<ProductLogoProps> = ({
  src,
  title,
  url,
  className = '',
  sizeClass = 'size-12 sm:size-14',
}) => {
  // Extract domain for automatic multi-tier fallback favicons
  const domain = useMemo(() => {
    if (!url) return '';
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      return u.hostname;
    } catch {
      return '';
    }
  }, [url]);

  // Build candidate URL queue: primary -> DuckDuckGo -> Google S2 -> origin favicon
  const candidates = useMemo(() => {
    const list: string[] = [];
    if (src && typeof src === 'string' && src.trim() && !src.startsWith('data:')) {
      list.push(src.trim());
    }
    if (domain) {
      // 1. DuckDuckGo Favicon API (extremely reliable across subdomains & modern web)
      list.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
      // 2. Google S2 Favicon API
      if (!src || !src.includes('google.com/s2/favicons')) {
        list.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      }
      // 3. Domain root favicon
      try {
        const origin = new URL(url?.startsWith('http') ? url : `https://${url}`).origin;
        list.push(`${origin}/favicon.ico`);
      } catch {}
    }
    // Deduplicate
    return Array.from(new Set(list.filter(Boolean)));
  }, [src, domain, url]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasAllFailed, setHasAllFailed] = useState(false);

  // Reset state when src or url changes
  useEffect(() => {
    setCandidateIndex(0);
    setHasAllFailed(candidates.length === 0);
  }, [src, url, candidates.length]);

  const handleError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasAllFailed(true);
    }
  };

  const initialLetter = (title || 'D').trim().slice(0, 1).toUpperCase();
  const gradient = getGradientForTitle(title || 'D');

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-[13px] sm:rounded-[15px] ring-1 ring-inset ring-border/60 bg-surface-2 flex items-center justify-center select-none ${sizeClass} ${className}`}
    >
      {!hasAllFailed && candidates[candidateIndex] ? (
        <img
          key={candidates[candidateIndex]}
          src={candidates[candidateIndex]}
          alt={`${title} 로고`}
          loading="lazy"
          onError={handleError}
          className="h-full w-full object-cover"
        />
      ) : (
        /* Ultimate Fallback: High-contrast styled initial badge with brand gradient */
        <div
          className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white font-black text-base sm:text-lg tracking-tight shadow-inner`}
        >
          {initialLetter}
        </div>
      )}
    </div>
  );
};
