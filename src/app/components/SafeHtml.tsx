import { useMemo } from 'react';
import { resolveAssetUrl } from './ui/utils';

/**
 * Renders instructor-authored rich HTML (course descriptions, lesson pages, etc.)
 * safely. Removes dangerous elements and strips event handlers, data-* attributes
 * (e.g. the data-start/data-end junk left by pasted ChatGPT content), and
 * javascript: URLs — while preserving real formatting (headings, lists, bold) and
 * media (images/videos). Relative asset URLs are resolved to the API origin so
 * uploaded images/videos load from the SPA's different origin.
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

  // Resolve relative asset URLs (images, videos, <source>) to absolute URLs.
  doc.body.querySelectorAll('img,video,source,audio').forEach(el => {
    const src = el.getAttribute('src');
    if (src) el.setAttribute('src', resolveAssetUrl(src));
  });

  return doc.body.innerHTML;
}

export function SafeHtml({ html, className }: { html?: string | null; className?: string }) {
  const clean = useMemo(() => sanitizeHtml(String(html ?? '')), [html]);
  if (!clean) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}

export default SafeHtml;
