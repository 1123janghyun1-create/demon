import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Search,
  UserPlus,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Circle,
  Plus,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Builder, DirectMessage } from '../types';

interface DmInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DmInboxModal: React.FC<DmInboxModalProps> = ({ isOpen, onClose }) => {
  const {
    builders,
    activeDmBuilder,
    setActiveDmBuilder,
    dmMessages,
    sendDirectMessage,
    user,
    markDmThreadAsRead,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [isSelectingNewBuilder, setIsSelectingNewBuilder] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick reply prompt chips
  const quickReplies = [
    '👋 안녕하세요! 프로젝트 잘 봤습니다.',
    '🚀 사용해보니 정말 인상적이네요!',
    '💬 피드백 관련해서 이야기 나눌 수 있을까요?',
    '🤝 동료 메이커로서 커피챗 환영합니다!',
  ];

  // List of builders with whom we have conversation history
  const activeThreads = useMemo(() => {
    return builders.filter((b) => {
      // Don't show myself in thread list
      if (b.id === user.id || (user.email && b.email === user.email)) return false;
      const msgs = dmMessages[b.id];
      return msgs && msgs.length > 0;
    });
  }, [builders, dmMessages, user]);

  // If activeDmBuilder is not set but we have active threads, auto-select the first one
  useEffect(() => {
    if (isOpen && !activeDmBuilder) {
      if (activeThreads.length > 0) {
        setActiveDmBuilder(activeThreads[0]);
      } else if (builders.length > 0) {
        // Find first other builder
        const other = builders.find((b) => b.id !== user.id && b.email !== user.email);
        if (other) setActiveDmBuilder(other);
      }
    }
  }, [isOpen, activeDmBuilder, activeThreads, builders, user, setActiveDmBuilder]);

  // Mark thread as read when activeDmBuilder changes
  useEffect(() => {
    if (isOpen && activeDmBuilder) {
      markDmThreadAsRead(activeDmBuilder.id);
    }
  }, [isOpen, activeDmBuilder, markDmThreadAsRead]);

  // Auto-scroll messages to bottom
  const currentMessages = activeDmBuilder ? dmMessages[activeDmBuilder.id] || [] : [];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeDmBuilder) return;

    sendDirectMessage(activeDmBuilder.id, text);
    setInputText('');
  };

  const filteredBuildersForNewChat = builders.filter((b) => {
    if (b.id === user.id || (user.email && b.email === user.email)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.role.toLowerCase().includes(q) ||
      (b.buildingApp && b.buildingApp.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl h-[620px] flex rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================ */}
        {/* LEFT COLUMN: Conversation Threads List                       */}
        {/* ============================================================ */}
        <div
          className={`w-full sm:w-[300px] border-r border-border bg-surface-2 flex flex-col shrink-0 ${
            activeDmBuilder ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-fg">1:1 다이렉트 메시지</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsSelectingNewBuilder((prev) => !prev)}
              className="p-1 rounded-btn text-accent hover:bg-surface transition-colors"
              title="새 대화 시작하기"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-2.5 border-b border-border bg-surface">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-fg-muted" />
              <input
                type="search"
                placeholder="빌더 검색 또는 새 대화..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface-2 pl-8 pr-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none placeholder:text-fg-muted"
              />
            </div>
          </div>

          {/* Threads List or New Builder Picker */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {isSelectingNewBuilder ? (
              <div>
                <div className="p-2 bg-brand-subtle text-[11px] font-bold text-accent flex items-center justify-between">
                  <span>대화할 빌더 선택</span>
                  <button
                    onClick={() => setIsSelectingNewBuilder(false)}
                    className="text-fg-muted hover:text-fg text-[10px]"
                  >
                    취소
                  </button>
                </div>
                {filteredBuildersForNewChat.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setActiveDmBuilder(b);
                      setIsSelectingNewBuilder(false);
                    }}
                    className="p-3 flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors"
                  >
                    <div className="relative shrink-0">
                      <img src={b.avatar} alt={b.name} className="size-9 rounded-full object-cover ring-1 ring-border" />
                      {b.online && (
                        <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-1 ring-surface" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-fg truncate">{b.name}</p>
                      <p className="text-[10px] text-accent font-medium truncate">{b.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeThreads.length === 0 ? (
              <div className="p-6 text-center text-xs text-fg-muted flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 text-fg-muted opacity-40 mb-1" />
                <p className="font-bold text-fg">아직 나눈 대화가 없습니다</p>
                <p className="text-[11px] max-w-[200px]">
                  빌더 목록에서 마음에 드는 메이커를 선택해 첫 메시지를 보내보세요!
                </p>
                <button
                  type="button"
                  onClick={() => setIsSelectingNewBuilder(true)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-btn bg-accent px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-accent-hover transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 대화 시작</span>
                </button>
              </div>
            ) : (
              activeThreads.map((b) => {
                const msgs = dmMessages[b.id] || [];
                const lastMsg = msgs[msgs.length - 1];
                const hasUnread = msgs.some((m) => !m.isMine && !m.read);
                const isSelected = activeDmBuilder?.id === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setActiveDmBuilder(b);
                      markDmThreadAsRead(b.id);
                    }}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-surface border-l-2 border-accent shadow-xs' : 'hover:bg-surface/60'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={b.avatar}
                        alt={b.name}
                        className="size-10 rounded-full object-cover ring-1 ring-border"
                      />
                      {b.online && (
                        <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-1 ring-surface" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-fg truncate">{b.name}</span>
                        {lastMsg && (
                          <span className="text-[10px] text-fg-muted shrink-0 ml-1">
                            {lastMsg.timestamp}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-fg-muted truncate">
                        {lastMsg ? lastMsg.text : `${b.role} · 대화 시작하기`}
                      </p>
                    </div>

                    {hasUnread && (
                      <span className="size-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Active Chat Room                               */}
        {/* ============================================================ */}
        <div
          className={`flex-1 flex flex-col bg-surface min-w-0 ${
            !activeDmBuilder ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {activeDmBuilder ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-border bg-surface-2 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveDmBuilder(null)}
                    className="p-1.5 rounded-btn text-fg-muted hover:bg-surface hover:text-fg transition-colors sm:hidden"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="relative shrink-0">
                    <img
                      src={activeDmBuilder.avatar}
                      alt={activeDmBuilder.name}
                      className="size-10 rounded-full object-cover ring-1 ring-border"
                    />
                    {activeDmBuilder.online && (
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-fg truncate">
                        {activeDmBuilder.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-subtle text-accent font-semibold shrink-0">
                        {activeDmBuilder.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-fg-muted truncate">
                      {activeDmBuilder.buildingApp
                        ? `🔨 '${activeDmBuilder.buildingApp}' 프로덕트 빌딩 중`
                        : activeDmBuilder.bio || '인디 메이커'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-btn text-fg-muted hover:bg-surface hover:text-fg transition-colors shrink-0"
                  title="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-surface">
                {/* Intro bubble */}
                <div className="text-center my-1">
                  <span className="inline-block text-[11px] text-fg-muted bg-surface-2 px-3 py-1 rounded-full border border-border">
                    {activeDmBuilder.name}님과의 1:1 대화방입니다. 자유롭게 의견과 피드백을 나눠보세요.
                  </span>
                </div>

                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${
                      msg.isMine ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                        msg.isMine
                          ? 'bg-accent text-white rounded-br-xs'
                          : 'bg-surface-2 text-fg border border-border rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-fg-muted mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Suggestions */}
              {currentMessages.length === 0 && (
                <div className="px-4 py-2 bg-surface-2/60 border-t border-border flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[10px] text-fg-muted shrink-0 font-bold">추천 메시지:</span>
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(reply)}
                      className="shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-border bg-surface text-fg hover:border-accent hover:text-accent transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 border-t border-border bg-surface-2 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  required
                  placeholder={`${activeDmBuilder.name}님에게 보낼 메시지를 입력하세요...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 rounded-pill border border-border bg-surface px-4 py-2.5 text-xs text-fg focus:border-accent focus:outline-none placeholder:text-fg-muted"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="rounded-full bg-accent p-2.5 text-white shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-40 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="size-16 rounded-full bg-surface-2 border border-border flex items-center justify-center text-accent mb-3">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-fg">대화할 빌더를 선택하세요</h3>
              <p className="text-xs text-fg-muted mt-1 max-w-[280px] leading-relaxed">
                좌측 목록에서 대화를 선택하거나 상단의 '+' 버튼을 눌러 새로운 메이커와 대화를 시작해보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
