import { useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html as htmlLang } from '@codemirror/lang-html';
import { css as cssLang } from '@codemirror/lang-css';
import { javascript as jsLang } from '@codemirror/lang-javascript';

export type CodeFiles = { html: string; css: string; js: string };

type Lang = keyof CodeFiles;

const TABS: { key: Lang; label: string }[] = [
  { key: 'html', label: 'HTML' },
  { key: 'css', label: 'CSS' },
  { key: 'js', label: 'JS' },
];

const langExt = (k: Lang) =>
  k === 'html' ? [htmlLang()] : k === 'css' ? [cssLang()] : [jsLang()];

export const EMPTY_FILES: CodeFiles = { html: '', css: '', js: '' };

function buildSrcDoc({ html, css, js }: CodeFiles): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>${css || ''}</style></head>
<body>${html || ''}
<script>${js || ''}<\/script></body></html>`;
}

interface Props {
  files: CodeFiles;
  onChange?: (files: CodeFiles) => void;   // omit / readOnly to view only
  readOnly?: boolean;
  previewHeight?: number;
  editorHeight?: number;
  /** Preview rendered above the editor (per spec). Set false to flip. */
  previewAbove?: boolean;
  title?: string;
}

/**
 * Multi-tab web code editor (HTML/CSS/JS) with a sandboxed live preview.
 * The preview is an <iframe srcDoc> with sandbox="allow-scripts" only — no
 * same-origin access, so student JS can never reach the app or its cookies.
 */
export default function CodeWorkspace({
  files,
  onChange,
  readOnly = false,
  previewHeight = 280,
  editorHeight = 260,
  previewAbove = true,
  title,
}: Props) {
  const [active, setActive] = useState<Lang>('html');
  const [doc, setDoc] = useState('');
  const debounceRef = useRef<number | null>(null);

  // Debounce preview re-render so typing stays smooth.
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDoc(buildSrcDoc(files)), 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [files]);

  const editable = !readOnly && !!onChange;

  const handleChange = (value: string) => {
    if (!onChange) return;
    onChange({ ...files, [active]: value });
  };

  const preview = useMemo(
    () => (
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
          Preview
        </div>
        <iframe
          title="code-preview"
          sandbox="allow-scripts"
          srcDoc={doc}
          style={{ height: previewHeight, width: '100%', border: 'none', background: '#fff' }}
        />
      </div>
    ),
    [doc, previewHeight]
  );

  const editor = (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-1 bg-gray-50 border-b border-gray-100 px-2 py-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              active === t.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
        {title && <span className="ml-auto text-xs text-gray-400 pr-1">{title}</span>}
      </div>
      <CodeMirror
        value={files[active] ?? ''}
        height={`${editorHeight}px`}
        extensions={langExt(active)}
        editable={editable}
        readOnly={!editable}
        onChange={handleChange}
        basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: editable }}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {previewAbove ? (
        <>
          {preview}
          {editor}
        </>
      ) : (
        <>
          {editor}
          {preview}
        </>
      )}
    </div>
  );
}
