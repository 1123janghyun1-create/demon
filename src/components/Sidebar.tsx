import React from 'react';
import { LayoutGrid, Users, Trophy, PlusCircle, MessageSquare, Sparkles, Sun, Moon, LogIn, LogOut, Edit3 } from 'lucide-react';
import { useApp } from '../AppContext';
import { NavTab } from '../types';
import { GoogleTranslate } from './GoogleTranslate';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    currentTab,
    setCurrentTab,
    darkMode,
    toggleDarkMode,
    user,
    logout,
    setIsLoginModalOpen,
    setIsProfileEditOpen,
    setIsDmInboxOpen,
    unreadDmCount,
  } = useApp();

  const navItems: { tab: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      tab: 'test',
      label: '앱 & 도구',
      icon: <LayoutGrid className="w-[18px] h-[18px]" />
    },
    {
      tab: 'builders',
      label: '빌더 (Builders)',
      icon: <Users className="w-[18px] h-[18px]" />
    },
    {
      tab: 'leaderboard',
      label: '리더보드',
      icon: <Trophy className="w-[18px] h-[18px]" />
    },
    {
      tab: 'submit',
      label: '앱 등록',
      icon: <PlusCircle className="w-[18px] h-[18px]" />
    },
    {
      tab: 'community',
      label: '커뮤니티',
      icon: <MessageSquare className="w-[18px] h-[18px]" />
    },
    {
      tab: 'about',
      label: 'demonst 소개',
      icon: <Sparkles className="w-[18px] h-[18px]" />
    }
  ];

  const handleNavClick = (tab: NavTab) => {
    setCurrentTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-border bg-surface transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="주 메뉴"
      >
        <div className="flex h-full flex-col overflow-y-auto p-4 justify-between">
          <div>
            {/* Demon Brand Logo */}
            <div className="mb-6 flex shrink-0 items-center px-1">
              <button
                onClick={() => handleNavClick('test')}
                className="inline-flex items-center gap-2.5 text-left group focus-visible:outline-none"
              >
                <div className="relative flex items-center">
                  <img
                    src="/demon-mascot.png"
                    alt="demon mascot"
                    className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-110"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-[20px] font-extrabold tracking-tight text-fg font-sans leading-none">
                      demonst
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      v1.0
                    </span>
                  </div>
                  <span className="text-[10px] text-fg-muted font-medium mt-0.5">
                    Maker Launchpad
                  </span>
                </div>
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1" aria-label="주 메뉴">
              {navItems.map((item) => {
                const isActive = currentTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => handleNavClick(item.tab)}
                    className={`flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-semibold transition-[color,background-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left ${
                      isActive
                        ? 'bg-brand-subtle text-accent'
                        : 'text-fg-secondary hover:bg-surface-2 hover:text-fg'
                    }`}
                  >
                    <span className="relative grid h-[18px] w-[18px] shrink-0 place-items-center">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom user profile & info */}
          <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-border">
            {/* User Profile / Login status */}
            {user.isLoggedIn ? (
              <div className="flex flex-col gap-2 p-2.5 rounded-btn bg-surface-2 border border-border">
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => setIsProfileEditOpen(true)}
                    className="flex items-center gap-2 min-w-0 cursor-pointer group"
                    title="클릭하여 프로필 & 사진 수정"
                  >
                    <div className="relative">
                      <img src={user.avatar} alt="user" className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-border group-hover:ring-accent transition-all" />
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Edit3 className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-fg truncate group-hover:text-accent transition-colors">{user.name}</span>
                      <span className="text-[10px] text-accent font-medium truncate">{user.role || '인디 메이커'}</span>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    title="로그아웃"
                    className="p-1 text-fg-muted hover:text-fg rounded transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* DM Inbox Shortcut */}
                <button
                  type="button"
                  onClick={() => setIsDmInboxOpen(true)}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-btn bg-surface border border-border text-[11px] font-bold text-fg hover:bg-surface-3 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-accent" />
                    <span>내 1:1 DM함</span>
                  </div>
                  {unreadDmCount > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                      {unreadDmCount}
                    </span>
                  )}
                </button>

                {/* Edit profile shortcut */}
                <button
                  onClick={() => setIsProfileEditOpen(true)}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-btn bg-surface border border-border text-[11px] font-bold text-fg hover:bg-surface-3 transition-colors shadow-2xs"
                >
                  <Edit3 className="w-3 h-3 text-accent" />
                  <span>내 프로필 수정</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center justify-center gap-2 w-full p-2.5 rounded-btn bg-accent text-white text-xs font-bold shadow-sm hover:bg-accent-hover transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Google 로그인</span>
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-between px-3 py-2 rounded-btn text-xs font-medium text-fg-secondary hover:bg-surface-2 transition-colors"
            >
              <span className="flex items-center gap-2">
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                {darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
              </span>
              <span className="text-[11px] text-fg-muted">{darkMode ? 'Dark' : 'Light'}</span>
            </button>

            {/* Language Selector (Mobile) */}
            <div className="pt-2 border-t border-border/60 flex justify-center lg:hidden">
              <GoogleTranslate />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
