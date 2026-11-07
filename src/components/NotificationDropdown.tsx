import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  MessageSquare,
  ChevronUp,
  Star,
  Sparkles,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { AppNotification } from '../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    products,
    setSelectedProduct,
    builders,
    setActiveDmBuilder,
    setIsDmInboxOpen,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);

    if (notif.type === 'dm' && notif.builderId) {
      const targetBuilder = builders.find((b) => b.id === notif.builderId) || {
        id: notif.builderId,
        name: notif.senderName || '빌더',
        role: '인디 메이커',
        bio: '',
        avatar: notif.senderAvatar || '/demon-mascot.png',
        tags: [],
        followersCount: 0,
        followingCount: 0,
      };
      setActiveDmBuilder(targetBuilder);
      setIsDmInboxOpen(true);
      onClose();
      return;
    }

    if ((notif.type === 'upvote' || notif.type === 'feedback') && notif.productId) {
      const prod = products.find((p) => p.id === notif.productId || p.slug === notif.productId);
      if (prod) {
        setSelectedProduct(prod);
      }
      onClose();
      return;
    }

    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'dm':
        return (
          <div className="size-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case 'upvote':
        return (
          <div className="size-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20">
            <Flame className="w-4 h-4" />
          </div>
        );
      case 'feedback':
        return (
          <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Star className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="size-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 border border-accent/20">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2.5 w-[360px] sm:w-[410px] rounded-2xl border border-border bg-surface shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-border bg-surface-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-fg">알림</span>
          </div>
          {unreadNotificationCount > 0 && (
            <span className="rounded-full bg-rose-500 px-2 py-0.2 text-[10px] font-bold text-white">
              {unreadNotificationCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadNotificationCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="inline-flex items-center gap-1 rounded-btn px-2 py-1 text-[11px] font-semibold text-accent hover:bg-surface transition-colors"
              title="모두 읽음으로 표시"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>모두 읽음</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAllNotifications}
              className="p-1 rounded-btn text-fg-muted hover:text-rose-500 hover:bg-surface transition-colors"
              title="모든 알림 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-btn text-fg-muted hover:text-fg hover:bg-surface transition-colors"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center border-b border-border bg-surface px-3 py-1.5 gap-2 text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-btn font-bold transition-colors ${
            filter === 'all'
              ? 'bg-surface-2 text-fg border border-border'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          전체 ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-2.5 py-1 rounded-btn font-bold transition-colors ${
            filter === 'unread'
              ? 'bg-surface-2 text-accent border border-border'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          읽지 않음 ({unreadNotificationCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50 bg-surface">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
            <div className="size-12 rounded-full bg-surface-2 flex items-center justify-center text-fg-muted mb-2.5 border border-border">
              <Bell className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-xs font-bold text-fg">새로운 알림이 없습니다</p>
            <p className="text-[11px] text-fg-muted mt-1 max-w-[240px] leading-relaxed">
              누군가가 회원님에게 DM을 보내거나 내 프로젝트에 업보트, 댓글을 남기면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`group relative p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                notif.read ? 'bg-surface hover:bg-surface-2/60' : 'bg-brand-subtle/40 hover:bg-brand-subtle'
              }`}
            >
              {/* Type Badge or Avatar */}
              {notif.senderAvatar ? (
                <div className="relative shrink-0">
                  <img
                    src={notif.senderAvatar}
                    alt={notif.senderName || '알림'}
                    className="size-9 rounded-full object-cover ring-1 ring-border"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    {notif.type === 'dm' && (
                      <span className="size-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] ring-1 ring-surface">
                        💬
                      </span>
                    )}
                    {notif.type === 'upvote' && (
                      <span className="size-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] ring-1 ring-surface">
                        🔥
                      </span>
                    )}
                    {notif.type === 'feedback' && (
                      <span className="size-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] ring-1 ring-surface">
                        ⭐
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                getNotificationIcon(notif.type)
              )}

              {/* Text Body */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="text-xs font-bold text-fg truncate">{notif.title}</h4>
                  {!notif.read && (
                    <span className="size-1.5 rounded-full bg-accent shrink-0 animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-fg-secondary leading-snug line-clamp-2">
                  {notif.message}
                </p>
                <span className="text-[10px] text-fg-muted mt-1 block font-medium">
                  {notif.createdAt}
                </span>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notif.id);
                }}
                className="absolute top-2.5 right-2.5 p-1 rounded-btn text-fg-muted opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-surface-2 transition-all"
                title="삭제"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="p-2.5 border-t border-border bg-surface-2 text-center text-[11px] text-fg-muted flex items-center justify-center gap-1">
        <span>💡 알림을 클릭하면 해당 DM이나 프로젝트로 바로 이동합니다.</span>
      </div>
    </div>
  );
};
