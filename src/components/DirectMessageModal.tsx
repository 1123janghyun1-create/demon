import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, UserCheck } from 'lucide-react';
import { useApp } from '../AppContext';
import { Builder } from '../types';

interface DirectMessageModalProps {
  builder: Builder;
  onClose: () => void;
}

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({ builder, onClose }) => {
  const { dmMessages, sendDirectMessage, user } = useApp();
  const [inputText, setInputText] = useState('');
  const messages = dmMessages[builder.id] || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendDirectMessage(builder.id, inputText.trim());
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-[500px] h-[580px] flex flex-col rounded-card border border-border bg-surface shadow-elevated overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={builder.avatar}
                alt={builder.name}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-border"
              />
              {builder.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-fg">{builder.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-pill bg-brand-subtle text-accent font-semibold">
                  {builder.role}
                </span>
              </div>
              <span className="text-[11px] text-fg-muted">
                {builder.buildingApp ? `🔨 ${builder.buildingApp} 빌딩 중` : '인디 메이커'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-btn p-1.5 text-fg-muted hover:bg-surface hover:text-fg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-surface">
          <div className="text-center my-2">
            <span className="text-[10px] text-fg-muted bg-surface-2 px-3 py-1 rounded-pill border border-border">
              {builder.name}님과의 1:1 대화가 시작되었습니다
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[80%] ${
                msg.isMine ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`rounded-card px-3.5 py-2.5 text-xs leading-relaxed ${
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

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-border bg-surface-2 flex items-center gap-2">
          <input
            type="text"
            required
            placeholder={`${builder.name}님에게 보낼 메시지...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-pill border border-border bg-surface px-4 py-2.5 text-xs text-fg focus:border-accent focus:outline-none placeholder:text-fg-muted"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="rounded-full bg-accent p-2.5 text-white shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
