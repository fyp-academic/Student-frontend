import { Mic, Square, X } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

/**
 * Mic control for recording a voice note. Idle → a mic button; while recording →
 * a live timer with Stop (keeps the clip) and Cancel (discards). On Stop it calls
 * onRecorded(file); the parent then previews it (audio player + discard) and sends
 * it through its normal send action. Playback/preview is intentionally left to the
 * parent so it can reuse its existing attachment-preview area.
 */
export function VoiceRecorderButton({
  onRecorded, disabled = false, accent = 'bg-blue-600 hover:bg-blue-700',
}: {
  onRecorded: (file: File) => void;
  disabled?: boolean;
  accent?: string;
}) {
  const rec = useVoiceRecorder();

  if (rec.recording) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-red-50 border border-red-100">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm tabular-nums text-gray-700 min-w-[34px]">{fmt(rec.seconds)}</span>
        <button
          type="button"
          onClick={async () => { const f = await rec.stop(); if (f) onRecorded(f); }}
          className={`p-1.5 rounded-full text-white ${accent}`}
          aria-label="Stop recording"
          title="Stop & attach"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => rec.cancel()}
          className="p-1.5 rounded-full text-gray-400 hover:bg-gray-200"
          aria-label="Cancel recording"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => rec.start()}
      disabled={disabled}
      className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
      aria-label="Record voice note"
      title={rec.error ?? 'Record voice note'}
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}

export default VoiceRecorderButton;
