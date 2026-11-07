import React from 'react';
import { Menu, Search, Quote as QuoteIcon, LogIn, LogOut } from 'lucide-react';
import { useApp } from '../AppContext';
import { GoogleTranslate } from './GoogleTranslate';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    searchQuery,
    setSearchQuery,
    currentQuote,
    nextQuote,
    user,
    setIsLoginModalOpen,
    logout,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      {/* Left: mobile hamburger button & search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          aria-label="메뉴 열기"
          onClick={onOpenMobileMenu}
          className="-ml-1 rounded-btn p-2 text-fg-secondary hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search Input */}
        <div className="w-full max-w-[340px]">
          <div className="relative flex items-center text-sm rounded-pill border border-border bg-surface-2 px-3 py-1.5 focus-within:border-accent transition-colors">
            <Search className="h-4 w-4 shrink-0 text-fg-muted mr-2" />
            <input
              type="search"
              placeholder="제품, 태그, 키워드 검색"
              aria-label="제품 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-muted focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-fg-muted hover:text-fg px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Daily Quote Widget & User Login */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quote box */}
        <div
          onClick={nextQuote}
          title="클릭하여 다른 명언 보기"
          className="hidden md:flex items-center gap-2 max-w-[340px] cursor-pointer rounded-pill border border-border bg-surface-2 px-3.5 py-1.5 text-xs text-fg-secondary hover:bg-surface-3 transition-colors"
        >
          <QuoteIcon className="h-3.5 w-3.5 text-accent shrink-0 rotate-180" />
          <p className="truncate text-xs">
            <span className="font-semibold text-fg">“{currentQuote.text}”</span>
            <span className="text-fg-muted ml-1.5">— {currentQuote.author}</span>
          </p>
        </div>

        {/* User Auth Button */}
        {user.isLoggedIn ? (
          <div className="flex items-center gap-2 pl-1">
            <img
              src={user.avatar}
              alt={user.name}
              title={`${user.name} (${user.email || 'Google 연동'})`}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-border"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-1.5 rounded-btn bg-accent px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-accent-hover transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google 로그인</span>
            <span className="sm:hidden">로그인</span>
          </button>
        )}

        {/* Google Translate Language Selector */}
        <div className="flex items-center">
          <GoogleTranslate />
        </div>
      </div>
    </header>
  );
};
