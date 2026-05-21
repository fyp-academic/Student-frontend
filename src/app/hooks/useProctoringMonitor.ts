import { useEffect, useRef, useCallback, useState } from 'react';
import { proctoringApi } from '../services/api';

const WEBCAM_CHECK_INTERVAL_MS    = 60_000;  // Gemini frame analysis every 60 s
const MOVEMENT_CHECK_INTERVAL_MS  = 12_000;  // local frame-diff every 12 s
const AUDIO_CHECK_INTERVAL_MS     =  3_000;  // audio level poll every 3 s
const AUDIO_VIOLATION_COOLDOWN_MS = 60_000;  // re-flag audio at most once per minute
const MOVE_VIOLATION_COOLDOWN_MS  = 30_000;  // re-flag movement at most once per 30 s
const BLUR_VIOLATION_COOLDOWN_MS  = 20_000;  // on mobile, re-flag blur at most once per 20 s
const AUDIO_LEVEL_THRESHOLD       = 32;      // 0-255 average frequency bin threshold
const AUDIO_SUSTAINED_TICKS       = 3;       // must be above threshold for 3 consecutive checks
const MOVEMENT_PIXEL_THRESHOLD    = 30;      // average per-pixel diff (0-255) to flag movement

/** True on any touchscreen mobile device (Android or iOS). */
const IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export const AUTO_SUBMIT_THRESHOLD = 5;

export type ViolationType =
  | 'tab_switch' | 'fullscreen_exit' | 'copy_attempt' | 'paste_attempt'
  | 'right_click' | 'keyboard_shortcut' | 'no_face_detected' | 'multiple_faces'
  | 'looking_away' | 'phone_detected' | 'browser_blur' | 'ai_content_detected'
  | 'background_person' | 'background_voice' | 'suspicious_movement';

export type ViolationAction = 'warn' | 'final_warning' | 'force_submit' | 'ended';

export interface ActiveViolation {
  type: ViolationType;
  timestamp: Date;
}

interface UseProctoringOptions {
  sessionKey:       string | null | undefined;
  activityId:       string;
  courseId?:        string;
  contextType?:     'quiz' | 'assignment';
  quizAttemptId?:   string;
  onForceSubmit:    () => void;
  onViolation?:     (type: ViolationType) => void;
}

export function useProctoringMonitor({
  sessionKey,
  activityId,
  courseId,
  contextType = 'quiz',
  quizAttemptId,
  onForceSubmit,
  onViolation,
}: UseProctoringOptions) {
  const procSessionIdRef   = useRef<string | null>(null);
  const warningCountRef    = useRef(0);
  const webcamRef          = useRef<HTMLVideoElement | null>(null);
  const canvasRef          = useRef<HTMLCanvasElement | null>(null);
  const webcamIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const movementIntervalRef= useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCheckRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef          = useRef(false);

  // Frame differencing
  const prevFrameDataRef   = useRef<Uint8ClampedArray | null>(null);
  const moveViolCoolRef    = useRef(false);

  // Mobile: rate-limit browser_blur false positives
  const blurViolCoolRef    = useRef(false);
  const fullscreenActiveRef = useRef(false);
  const fullscreenGraceRef  = useRef(false);

  // Audio monitoring
  const audioContextRef    = useRef<AudioContext | null>(null);
  const analyserRef        = useRef<AnalyserNode | null>(null);
  const audioStreamRef     = useRef<MediaStream | null>(null);
  const audioViolCoolRef   = useRef(false);
  const audioHighTicksRef  = useRef(0);  // consecutive high-level ticks

  // Stable ref to the latest logViolation — prevents stale closures in intervals
  const logViolationRef    = useRef<((t: ViolationType, m?: Record<string, unknown>) => void) | null>(null);

  const [warningCount,  setWarningCount]  = useState(0);
  const [lastViolation, setLastViolation] = useState<ActiveViolation | null>(null);
  const [isForceSubmit, setIsForceSubmit] = useState(false);

  // ── Stop helpers ────────────────────────────────────────────────────────────

  const stopWebcam = useCallback(() => {
    if (webcamIntervalRef.current)  clearInterval(webcamIntervalRef.current);
    if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
    if (webcamRef.current?.srcObject) {
      (webcamRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      webcamRef.current.srcObject = null;
    }
    prevFrameDataRef.current = null;
  }, []);

  const stopAudio = useCallback(() => {
    if (audioCheckRef.current) clearInterval(audioCheckRef.current);
    audioStreamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current     = null;
    audioStreamRef.current  = null;
    audioHighTicksRef.current = 0;
  }, []);

  // ── Fullscreen ───────────────────────────────────────────────────────────────

  const requestFullscreen = useCallback(async () => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS) return;
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
    };
    fullscreenGraceRef.current = true;
    try {
      if (el.requestFullscreen)             await el.requestFullscreen();
      else if (el.webkitRequestFullscreen)  await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen)     await el.mozRequestFullScreen();
    } catch { /* fullscreen unavailable */ }
    // Grace period: ignore fullscreen_exit for 3s after requesting
    setTimeout(() => { fullscreenGraceRef.current = false; }, 3000);
  }, []);

  // ── Frame capture + movement detection ──────────────────────────────────────

  const captureFrame = useCallback((): string | null => {
    const video  = webcamRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width  = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, 320, 240);
    return canvas.toDataURL('image/jpeg', 0.6).split(',')[1] ?? null;
  }, []);

  const checkMovement = useCallback(() => {
    if (!activeRef.current || moveViolCoolRef.current) return;
    const video  = webcamRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 320, 240);
    const current = ctx.getImageData(0, 0, 320, 240).data;

    if (prevFrameDataRef.current) {
      const prev = prevFrameDataRef.current;
      let totalDiff = 0;
      let samples   = 0;
      // Sample every 16th byte (every 4th pixel's R channel)
      for (let i = 0; i < current.length; i += 16) {
        totalDiff += Math.abs(current[i] - prev[i]);
        samples++;
      }
      if (samples > 0 && (totalDiff / samples) > MOVEMENT_PIXEL_THRESHOLD) {
        moveViolCoolRef.current = true;
        logViolationRef.current?.('suspicious_movement', { avg_pixel_diff: Math.round(totalDiff / samples) });
        setTimeout(() => { moveViolCoolRef.current = false; }, MOVE_VIOLATION_COOLDOWN_MS);
      }
    }

    prevFrameDataRef.current = new Uint8ClampedArray(current);
  }, []);

  // ── Start webcam ─────────────────────────────────────────────────────────────

  const startWebcam = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });
      if (webcamRef.current) webcamRef.current.srcObject = stream;
      return stream;
    } catch {
      return null;
    }
  }, []);

  // ── Audio monitoring ─────────────────────────────────────────────────────────

  const startAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioStreamRef.current = stream;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx      = new AudioCtx() as AudioContext;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current     = analyser;

      // iOS Safari suspends AudioContext until a user gesture — resume on first touch
      if (ctx.state === 'suspended') {
        const unlock = () => {
          ctx.resume().catch(() => {});
          document.removeEventListener('touchstart', unlock);
          document.removeEventListener('click', unlock);
        };
        document.addEventListener('touchstart', unlock, { once: true });
        document.addEventListener('click',      unlock, { once: true });
      }

      const freqData = new Uint8Array(analyser.frequencyBinCount);

      audioCheckRef.current = setInterval(() => {
        if (!activeRef.current || audioViolCoolRef.current || ctx.state === 'suspended') {
          audioHighTicksRef.current = 0;
          return;
        }
        analyser.getByteFrequencyData(freqData);
        const avg = freqData.reduce((s, v) => s + v, 0) / freqData.length;
        if (avg > AUDIO_LEVEL_THRESHOLD) {
          audioHighTicksRef.current++;
          if (audioHighTicksRef.current >= AUDIO_SUSTAINED_TICKS) {
            audioViolCoolRef.current  = true;
            audioHighTicksRef.current = 0;
            logViolationRef.current?.('background_voice', { audio_level: Math.round(avg) });
            setTimeout(() => { audioViolCoolRef.current = false; }, AUDIO_VIOLATION_COOLDOWN_MS);
          }
        } else {
          audioHighTicksRef.current = 0;
        }
      }, AUDIO_CHECK_INTERVAL_MS);
    } catch {
      // Microphone unavailable — proctoring continues without audio
    }
  }, []);

  // ── Session start / end ──────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    try {
      const { data } = await proctoringApi.start({
        activity_id:     activityId,
        course_id:       courseId,
        context_type:    contextType,
        quiz_attempt_id: quizAttemptId,
      });
      procSessionIdRef.current = data.session_id as string;
    } catch { /* non-fatal */ }
  }, [activityId, courseId, contextType, quizAttemptId]);

  const endSession = useCallback(async () => {
    stopWebcam();
    stopAudio();
    if (!procSessionIdRef.current) return;
    try {
      await proctoringApi.end({ session_id: procSessionIdRef.current });
    } catch { /* silent */ }
    procSessionIdRef.current = null;
  }, [stopWebcam, stopAudio]);

  // ── Violation logging ────────────────────────────────────────────────────────

  const logViolation = useCallback(async (
    type: ViolationType,
    metadata: Record<string, unknown> = {},
  ): Promise<ViolationAction> => {
    if (!procSessionIdRef.current || isForceSubmit) return 'ended';
    setLastViolation({ type, timestamp: new Date() });
    onViolation?.(type);
    // Capture a snapshot of what the student is doing at the moment of violation
    const snapshot = captureFrame() ?? undefined;
    try {
      const { data } = await proctoringApi.violation({ session_id: procSessionIdRef.current, type, metadata, snapshot });
      const count  = data.warning_count as number;
      const action = data.action as ViolationAction;
      warningCountRef.current = count;
      setWarningCount(count);
      if (action === 'force_submit') {
        setIsForceSubmit(true);
        stopWebcam();
        stopAudio();
        onForceSubmit();
      }
      return action;
    } catch {
      return 'warn';
    }
  }, [isForceSubmit, onForceSubmit, onViolation, stopWebcam, stopAudio]);

  // Keep the ref current so audio/movement intervals always call the latest version
  useEffect(() => { logViolationRef.current = logViolation; }, [logViolation]);

  // ── Webcam periodic Gemini check ─────────────────────────────────────────────

  const performWebcamCheck = useCallback(async () => {
    if (!procSessionIdRef.current || isForceSubmit) return;
    const frame = captureFrame();
    if (!frame) return;
    try {
      const { data } = await proctoringApi.webcamCheck({ session_id: procSessionIdRef.current, image: frame });
      if (data.violation) {
        const count  = data.warning_count as number;
        const action = data.action as ViolationAction;
        setLastViolation({ type: data.violation as ViolationType, timestamp: new Date() });
        onViolation?.(data.violation as ViolationType);
        warningCountRef.current = count;
        setWarningCount(count);
        if (action === 'force_submit') {
          setIsForceSubmit(true);
          stopWebcam();
          stopAudio();
          onForceSubmit();
        }
      }
    } catch { /* never penalise for API errors */ }
  }, [captureFrame, isForceSubmit, onForceSubmit, onViolation, stopWebcam, stopAudio]);

  // ── Dismiss current violation warning ───────────────────────────────────────

  const dismissViolation = useCallback(() => setLastViolation(null), []);

  // ── Main effect: start when sessionKey becomes truthy ───────────────────────

  useEffect(() => {
    if (!sessionKey) {
      if (activeRef.current) {
        activeRef.current = false;
        endSession();
      }
      return;
    }

    activeRef.current = true;
    warningCountRef.current = 0;
    setWarningCount(0);
    setLastViolation(null);
    setIsForceSubmit(false);
    moveViolCoolRef.current   = false;
    audioViolCoolRef.current  = false;
    audioHighTicksRef.current = 0;
    blurViolCoolRef.current   = false;
    fullscreenActiveRef.current = false;
    fullscreenGraceRef.current  = false;

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    startSession().then(() => {
      requestFullscreen();

      // Webcam: start video + Gemini checks + local movement checks
      startWebcam().then(stream => {
        if (stream) {
          // First Gemini check after 10 s (camera warmup), then every 60 s
          setTimeout(performWebcamCheck, 10_000);
          webcamIntervalRef.current   = setInterval(performWebcamCheck, WEBCAM_CHECK_INTERVAL_MS);
          // Local movement check starts after 5 s, then every 12 s
          setTimeout(() => {
            checkMovement(); // capture initial frame as baseline
            movementIntervalRef.current = setInterval(checkMovement, MOVEMENT_CHECK_INTERVAL_MS);
          }, 5_000);
        }
      });

      // Audio monitoring starts independently
      startAudio();
    });

    // ── DOM event listeners ───────────────────────────────────────────────────
    const onVisibility = () => {
      if (document.hidden) logViolation('tab_switch', { timestamp: new Date().toISOString() });
    };

    // fullscreen listeners — skip entirely on iOS (API not supported)
    const onFullscreen = () => {
      if (fullscreenGraceRef.current) return;
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
      };
      const isFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement);
      if (isFullscreen) {
        fullscreenActiveRef.current = true;
      } else if (fullscreenActiveRef.current) {
        fullscreenActiveRef.current = false;
        logViolation('fullscreen_exit');
      }
    };

    // browser_blur — on mobile this fires for every notification/home button;
    // rate-limit to at most once per BLUR_VIOLATION_COOLDOWN_MS
    const onBlur = () => {
      if (IS_MOBILE) {
        if (blurViolCoolRef.current) return;
        blurViolCoolRef.current = true;
        setTimeout(() => { blurViolCoolRef.current = false; }, BLUR_VIOLATION_COOLDOWN_MS);
      }
      logViolation('browser_blur', { timestamp: new Date().toISOString() });
    };

    const onCopy    = (e: ClipboardEvent) => { e.preventDefault(); logViolation('copy_attempt'); };
    const onPaste   = (e: ClipboardEvent) => { e.preventDefault(); logViolation('paste_attempt'); };
    const onCut     = (e: ClipboardEvent) => { e.preventDefault(); logViolation('copy_attempt'); };
    const onContext = (e: MouseEvent)     => { e.preventDefault(); logViolation('right_click'); };

    // keyboard shortcut detection — skip on mobile (no physical keyboard)
    const onKeyDown = IS_MOBILE ? null : (e: KeyboardEvent) => {
      const forbidden = [
        e.ctrlKey && e.key === 'c', e.ctrlKey && e.key === 'v',
        e.ctrlKey && e.key === 'a', e.ctrlKey && e.key === 'u',
        e.ctrlKey && e.key === 's', e.ctrlKey && e.shiftKey && e.key === 'i',
        e.key === 'F12', e.key === 'PrintScreen', e.metaKey,
      ];
      if (forbidden.some(Boolean)) {
        e.preventDefault();
        logViolation('keyboard_shortcut', { key: e.key, ctrl: e.ctrlKey, shift: e.shiftKey });
      }
    };

    // Screen orientation change — reset movement baseline to prevent false positives
    // when the phone rotates (causes a near-100% pixel diff between frames)
    const onOrientationChange = () => {
      prevFrameDataRef.current = null;
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur',               onBlur);
    document.addEventListener('copy',             onCopy    as EventListener);
    document.addEventListener('paste',            onPaste   as EventListener);
    document.addEventListener('cut',              onCut     as EventListener);
    document.addEventListener('contextmenu',      onContext  as EventListener);
    if (onKeyDown) document.addEventListener('keydown', onKeyDown as EventListener);
    window.addEventListener('orientationchange',  onOrientationChange);

    // fullscreen events — only relevant on non-iOS (iOS never fires these)
    if (!isIOS) {
      document.addEventListener('fullscreenchange',       onFullscreen);
      document.addEventListener('webkitfullscreenchange', onFullscreen);
    }

    return () => {
      if (activeRef.current) {
        activeRef.current = false;
        endSession();
      }
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur',               onBlur);
      document.removeEventListener('copy',             onCopy    as EventListener);
      document.removeEventListener('paste',            onPaste   as EventListener);
      document.removeEventListener('cut',              onCut     as EventListener);
      document.removeEventListener('contextmenu',      onContext  as EventListener);
      if (onKeyDown) document.removeEventListener('keydown', onKeyDown as EventListener);
      window.removeEventListener('orientationchange',  onOrientationChange);
      if (!isIOS) {
        document.removeEventListener('fullscreenchange',       onFullscreen);
        document.removeEventListener('webkitfullscreenchange', onFullscreen);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  return {
    webcamRef,
    canvasRef,
    warningCount,
    lastViolation,
    isForceSubmit,
    logViolation,
    dismissViolation,
    endSession,
    get sessionId() { return procSessionIdRef.current; },
  };
}
