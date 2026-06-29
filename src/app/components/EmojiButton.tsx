import { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

/**
 * A Smile-icon toggle that opens an emoji-picker-react popover and calls
 * onPick(emoji) with the chosen unicode emoji. Closes on outside-click / select.
 * Reuses the same emoji library already wired into the chat composer.
 */
export function EmojiButton({
  onPick, className = '', align = 'right',
}: {
  onPick: (emoji: string) => void;
  className?: string;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ${className}`}
        aria-label="Add emoji"
        title="Add emoji"
      >
        <Smile className="w-5 h-5" />
      </button>
      {open && (
        <div className={`absolute bottom-full mb-2 z-50 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <EmojiPicker
            onEmojiClick={(d: EmojiClickData) => { onPick(d.emoji); setOpen(false); }}
            theme={Theme.LIGHT}
            lazyLoadEmojis
            width={300}
            height={380}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
}

export default EmojiButton;
