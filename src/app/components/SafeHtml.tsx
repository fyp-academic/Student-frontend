import { useMemo } from 'react';

/**
 * Renders instructor-authored rich HTML (course descriptions, etc.) safely.
 * Removes dangerous elements and strips event handlers, data-* attributes
 * (e.g. the data-start/data-end junk left by pasted ChatGPT content), and
 * javascript: URLs — while preserving real formatting (headings, lists, bold).
 */
function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined' || !html) return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');

  doc
    .querySelectorAll('script,style,iframe,object,embed,link,meta,form,input,button,textarea,select')
    .forEach(el => el.remove());

  doc.body.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || name.startsWith('data-')) {
        el.removeAttribute(attr.name);
        return;
      }
      if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

export function SafeHtml({ html, className }: { html?: string | null; className?: string }) {
  const clean = useMemo(() => sanitizeHtml(String(html ?? '')), [html]);
  if (!clean) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}

export default SafeHtml;
