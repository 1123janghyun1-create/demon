import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Helper to parse inline markdown (bold, italic, code, link)
  const renderInline = (text: string): React.ReactNode => {
    // Split by markdown link pattern [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(...parseInlineStyles(text.substring(lastIndex, match.index)));
      }
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline hover:text-accent-hover font-semibold break-all"
        >
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(...parseInlineStyles(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : text;
  };

  // Helper to parse bold, italic, inline code
  const parseInlineStyles = (str: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    // Tokenize by `code`, **bold**, *italic*
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIdx = 0;
    let m: RegExpExecArray | null;

    while ((m = tokenRegex.exec(str)) !== null) {
      if (m.index > lastIdx) {
        nodes.push(str.substring(lastIdx, m.index));
      }
      const token = m[1];
      if (token.startsWith('`') && token.endsWith('`')) {
        nodes.push(
          <code
            key={`code-${m.index}`}
            className="rounded bg-surface-3 px-1.5 py-0.5 text-[11px] font-mono text-accent font-medium border border-border/60"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        nodes.push(
          <strong key={`bold-${m.index}`} className="font-bold text-fg">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        nodes.push(
          <em key={`italic-${m.index}`} className="italic text-fg">
            {token.slice(1, -1)}
          </em>
        );
      }
      lastIdx = tokenRegex.lastIndex;
    }

    if (lastIdx < str.length) {
      nodes.push(str.substring(lastIdx));
    }

    return nodes.length > 0 ? nodes : [str];
  };

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        renderedElements.push(
          <ul key={`ul-${renderedElements.length}`} className="my-2 space-y-1.5 pl-4 list-disc text-xs text-fg-secondary">
            {currentList.items.map((it, idx) => (
              <li key={idx} className="leading-relaxed">
                {it}
              </li>
            ))}
          </ul>
        );
      } else {
        renderedElements.push(
          <ol key={`ol-${renderedElements.length}`} className="my-2 space-y-1.5 pl-4 list-decimal text-xs text-fg-secondary">
            {currentList.items.map((it, idx) => (
              <li key={idx} className="leading-relaxed">
                {it}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Header 3: ###
    if (trimmed.startsWith('### ')) {
      flushList();
      const headerText = trimmed.substring(4);
      renderedElements.push(
        <h4
          key={`h3-${index}`}
          className="text-sm font-bold text-fg mt-4 mb-2 flex items-center gap-1.5 border-b border-border/50 pb-1"
        >
          {renderInline(headerText)}
        </h4>
      );
      return;
    }

    // Header 2: ##
    if (trimmed.startsWith('## ')) {
      flushList();
      const headerText = trimmed.substring(3);
      renderedElements.push(
        <h3
          key={`h2-${index}`}
          className="text-base font-bold text-fg mt-5 mb-2.5 pb-1 border-b border-border"
        >
          {renderInline(headerText)}
        </h3>
      );
      return;
    }

    // Header 1: #
    if (trimmed.startsWith('# ')) {
      flushList();
      const headerText = trimmed.substring(2);
      renderedElements.push(
        <h2
          key={`h1-${index}`}
          className="text-lg font-bold text-fg mt-6 mb-3"
        >
          {renderInline(headerText)}
        </h2>
      );
      return;
    }

    // Bullet List: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.substring(2);
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(renderInline(itemText));
      return;
    }

    // Numbered List: 1. 2. etc
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const itemText = numMatch[2];
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(renderInline(itemText));
      return;
    }

    // Regular paragraph
    flushList();
    renderedElements.push(
      <p key={`p-${index}`} className="my-1.5 text-xs text-fg-secondary leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className={`markdown-body space-y-1 ${className}`}>{renderedElements}</div>;
};
