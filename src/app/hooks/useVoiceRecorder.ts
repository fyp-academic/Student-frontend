import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Records a short voice note via the browser MediaRecorder API and hands back an
 * audio File (webm/opus where supported). Mirrors the capture/cleanup pattern in
 * hooks/useJitsiRoom.ts. Always stops the mic track on stop/cancel/unmount.
 */
export interface VoiceRecorder {
  recording: boolean;
  seconds: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<File | null>;
  cancel: () => void;
}

function pickMime(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  if (typeof MediaRecorder === 'undefined') return '';
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

export function useVoiceRecorder(): VoiceRecorder {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const mimeRef = useRef<string>('audio/webm');

  const cleanup = useCallback(() => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setSeconds(0);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const mime = pickMime();
      mimeRef.current = mime || 'audio/webm';
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      streamRef.current = stream;
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      setError('Microphone permission denied or unavailable.');
      cleanup();
    }
  }, [cleanup]);

  const stop = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      const rec = recorderRef.current;
      if (!rec || rec.state === 'inactive') { cleanup(); resolve(null); return; }
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
      rec.onstop = () => {
        const type = (mimeRef.current.split(';')[0]) || 'audio/webm';
        const ext = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm';
        const file = chunksRef.current.length
          ? new File([new Blob(chunksRef.current, { type })], `voice-note-${Date.now()}.${ext}`, { type })
          : null;
        cleanup();
        resolve(file);
      };
      rec.stop();
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') { rec.onstop = null; try { rec.stop(); } catch { /* noop */ } }
    cleanup();
  }, [cleanup]);

  return { recording, seconds, error, start, stop, cancel };
}
