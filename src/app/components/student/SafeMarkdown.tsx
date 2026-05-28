import React from 'react';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content, className = '' }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      <Tag key={`list-${key++}`} className={listType === 'ol' ? 'list-decimal' : 'list-disc'}>
        {listItems.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
        ))}
      </Tag>
    );
    listItems = [];
    listType = null;
  };

  const inlineFormat = (text: string): string => {
    let html = text
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>');
    return html;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(trimmed.slice(2));
      continue;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(trimmed.replace(/^\d+\.\s/, ''));
      continue;
    }
    if (listItems.length > 0) {
      flushList();
    }

    if (trimmed === '') {
      elements.push(<div key={`br-${key++}`} className="h-2" />);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={`h-${key++}`} className="text-lg font-semibold mt-3 mb-1" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.slice(4)) }} />);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={`h-${key++}`} className="text-xl font-semibold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.slice(3)) }} />);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={`h-${key++}`} className="text-2xl font-bold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.slice(2)) }} />);
    } else {
      elements.push(<p key={`p-${key++}`} className="mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }} />);
    }
  }

  flushList();

  return <div className={`prose prose-sm max-w-none ${className}`}>{elements}</div>;
};
