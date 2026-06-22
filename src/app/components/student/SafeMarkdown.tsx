import React from 'react';
import { resolveAssetUrl, resolveHtmlAssetUrls } from '../ui/utils';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

// Markdown image syntax ![alt](url) → <img>, with the asset URL resolved to the API origin.
const formatImages = (text: string): string =>
  text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_m, alt, url) => `<img src="${resolveAssetUrl(url)}" alt="${alt}" class="max-w-full h-auto rounded-lg my-2" />`);

const inlineFormat = (text: string): string => {
  return formatImages(text)
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/==(.+?)==/g, '<mark>$1</mark>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>');
};

// Lines that are raw media HTML (images/videos) emitted by the instructor's rich-text editor.
const isMediaHtml = (line: string): boolean => /^<(img|video|source|audio|figure|picture)\b/i.test(line);

const isTableDelimiter = (line: string): boolean =>
  /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);

const splitCells = (row: string): string[] =>
  row.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Tables — a header row followed by a |---|---| delimiter
    if (trimmed.includes('|') && i + 1 < lines.length && isTableDelimiter(lines[i + 1])) {
      flushList();
      const header = splitCells(trimmed);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().includes('|') && lines[j].trim() !== '') {
        rows.push(splitCells(lines[j].trim()));
        j++;
      }
      elements.push(
        <table key={`tbl-${key++}`}>
          <thead>
            <tr>
              {header.map((h, hi) => (
                <th key={hi} dangerouslySetInnerHTML={{ __html: inlineFormat(h) }} />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <td key={ci} dangerouslySetInnerHTML={{ __html: inlineFormat(c) }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      i = j - 1;
      continue;
    }

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

    if (isMediaHtml(trimmed)) {
      elements.push(<div key={`media-${key++}`} className="my-2" dangerouslySetInnerHTML={{ __html: resolveHtmlAssetUrls(trimmed) }} />);
    } else if (trimmed.startsWith('> ')) {
      elements.push(<blockquote key={`bq-${key++}`} dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.slice(2)) }} />);
    } else if (trimmed.startsWith('#### ')) {
      elements.push(<h4 key={`h-${key++}`} className="text-base font-semibold mt-3 mb-1" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.slice(5)) }} />);
    } else if (trimmed.startsWith('### ')) {
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
