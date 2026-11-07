import React from 'react';
import { Menu, Search, Quote as QuoteIcon, LogIn, LogOut, Edit3, Bell, MessageSquare } from 'lucide-react';
import { useApp } from '../AppContext';
import { GoogleTranslate } from './GoogleTranslate';
import { NotificationDropdown } from './NotificationDropdown';

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
    setIsProfileEditOpen,
    logout,
    requireAuth,
    isNotificationOpen,
    setIsNotificationOpen,
    unreadNotificationCount,
    setIsDmInboxOpen,
    unreadDmCount,
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

        {/* 1:1 Direct Message (DM) Inbox Button */}
        <button
          type="button"
          onClick={() => {
            requireAuth(() => {
              setIsDmInboxOpen(true);
            }, '1:1 DM을 이용하려면 먼저 Google 로그인이 필요합니다.');
          }}
          className="relative rounded-full p-2 text-fg-secondary hover:bg-surface-2 hover:text-fg transition-colors cursor-pointer"
          title="1:1 다이렉트 메시지 (DM)"
          aria-label="DM 메시지함 열기"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadDmCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-surface">
              {unreadDmCount > 9 ? '9+' : unreadDmCount}
            </span>
          )}
        </button>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative rounded-full p-2 text-fg-secondary hover:bg-surface-2 hover:text-fg transition-colors cursor-pointer"
            title="알림"
            aria-label="알림 목록 열기"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-surface animate-pulse">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>

        {/* User Auth Button */}
        {user.isLoggedIn ? (
          <button
            type="button"
            onClick={() => setIsProfileEditOpen(true)}
            className="group flex items-center gap-2 pl-1 rounded-full p-0.5 hover:ring-2 hover:ring-accent transition-all cursor-pointer"
            title={`${user.name} (클릭하여 프로필 & 사진 수정)`}
          >
            <div className="relative size-8">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full rounded-full object-cover ring-1 ring-border group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Edit3 className="w-3 h-3" />
              </div>
            </div>
            <span className="hidden sm:inline text-xs font-bold text-fg max-w-[100px] truncate group-hover:text-accent transition-colors">
              {user.name}
            </span>
          </button>
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
