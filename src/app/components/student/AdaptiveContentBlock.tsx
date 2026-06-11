import React, { useEffect, useRef, useState, useCallback } from 'react';
import { adaptiveContentApi } from '@/app/services/api';
import { SafeMarkdown } from './SafeMarkdown';
import { GuidedStepsPlayer } from './players/GuidedStepsPlayer';
import { VisualDiscoveryPlayer } from './players/VisualDiscoveryPlayer';
import { DeepFocusPlayer } from './players/DeepFocusPlayer';
import { NarrativeExamplePlayer } from './players/NarrativeExamplePlayer';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { cn } from '@/app/components/ui/utils';
import type { PresentationConfig, PresentationMode, ModeConfig } from '@/app/types/personalization';
import { cardVariantClass, presentationStyles } from '@/app/types/personalization';
import {
  FileText, BarChart3, Lightbulb, ThumbsUp, ThumbsDown,
  ShieldCheck, AlertCircle,
} from 'lucide-react';

function resolvePlayer(mode?: PresentationMode) {
  switch (mode) {
    case 'guided_steps': return GuidedStepsPlayer;
    case 'visual_discovery': return VisualDiscoveryPlayer;
    case 'deep_focus': return DeepFocusPlayer;
    case 'narrative_example': return NarrativeExamplePlayer;
    default: return null;
  }
}

interface AdaptiveContentBlockProps {
  chunkId: string;
  courseId: string;
  presentationOverride?: PresentationConfig | null;
}

type Modality = 'text' | 'visual' | 'example-based';

export const AdaptiveContentBlock: React.FC<AdaptiveContentBlockProps> = ({
  chunkId,
  presentationOverride,
}) => {
  const [adaptedContent, setAdaptedContent] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [adaptationId, setAdaptationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [currentModality, setCurrentModality] = useState<Modality>('text');
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackTimerStarted, setFeedbackTimerStarted] = useState(false);
  const [feedbackReady, setFeedbackReady] = useState(false);
  const [contentAdapted, setContentAdapted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsApplied, setSettingsApplied] = useState<Record<string, unknown> | null>(null);
  const [presentation, setPresentation] = useState<PresentationConfig | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchContent = useCallback(async (modality?: Modality, retryAttempt = 0) => {
    if (retryAttempt === 0) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const res = await adaptiveContentApi.get(chunkId, modality);
      const data = res.data;
      setAdaptedContent(data.adapted_text ?? null);
      setOriginalContent(data.original_text ?? null);
      setAdaptationId(data.adaptation_id ?? null);
      setContentAdapted(data.content_adapted === true);
      setPresentation(data.presentation ?? null);
      setSettingsApplied(data.settings_applied ?? null);
      if (modality) setCurrentModality(modality);
      setRetryCount(0);
      setIsRetrying(false);
    } catch (err: any) {
      const status = err?.response?.status;
      const isNetworkError = !status || status >= 500 || status === 408 || status === 429;
      const shouldRetry = retryAttempt < 2 && isNetworkError;

      console.warn(`[AdaptiveContent] Load failed (attempt ${retryAttempt + 1})`, {
        error: err?.message,
        status,
        shouldRetry,
      });

      if (shouldRetry) {
        // Exponential backoff: 1s, 2s
        const delay = (retryAttempt + 1) * 1000;
        setIsRetrying(true);
        setRetryCount(retryAttempt + 1);
        setTimeout(() => {
          fetchContent(modality, retryAttempt + 1);
        }, delay);
      } else {
        setError('Could not load content. Please refresh the page or contact support.');
        setIsRetrying(false);
      }
    } finally {
      if (retryAttempt === 0 || !shouldRetry) {
        setIsLoading(false);
      }
    }
  }, [chunkId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!containerRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !feedbackTimerStarted) {
            setFeedbackTimerStarted(true);
            timerRef.current = setTimeout(() => setFeedbackReady(true), 30000);
          }
        });
      },
      { threshold: 0.5 }
    );
    observerRef.current.observe(containerRef.current);
    return () => {
      observerRef.current?.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [feedbackTimerStarted]);

  const handleModalitySwitch = (modality: Modality) => {
    if (modality === currentModality) return;
    fetchContent(modality);
  };

  const submitFeedback = async (rating?: string, complexity?: string) => {
    if (!adaptationId) return;
    try {
      await adaptiveContentApi.feedback(adaptationId, { rating, complexity });
      setFeedbackGiven(true);
    } catch {
      /* silent */
    }
  };

  const showFeedbackStrip = feedbackReady && !feedbackGiven && !isLoading && contentAdapted && adaptationId;

  const activePresentation = presentationOverride ?? presentation;
  const contentStyle = presentationStyles(activePresentation);
  const layoutClass = cn(
    activePresentation?.typography_class,
    activePresentation?.layout_mode === 'visual' && 'personalization-visual',
    activePresentation?.layout_mode === 'focus' && 'personalization-focus',
    activePresentation?.color_scheme === 'calm' && 'personalization-calm',
    cardVariantClass(activePresentation?.card_variant),
  );

  return (
    <div ref={containerRef} className="w-full">
      {!isLoading && contentAdapted && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">Delivery format:</span>
          {([
            { key: 'text', label: 'Text', icon: FileText },
            { key: 'visual', label: 'Visual', icon: BarChart3 },
            { key: 'example-based', label: 'Example', icon: Lightbulb },
          ] as { key: Modality; label: string; icon: React.ComponentType<{ className?: string }> }[]).map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => handleModalitySwitch(m.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                currentModality === m.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[95%]" />
          <Skeleton className="h-4 w-[90%]" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
              <div className="text-sm text-destructive">{error}</div>
            </div>
            {!isRetrying && (
              <button
                onClick={() => fetchContent(currentModality)}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors whitespace-nowrap"
              >
                Retry
              </button>
            )}
            {isRetrying && (
              <div className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-destructive/60 whitespace-nowrap">
                Retrying... ({retryCount}/2)
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && adaptedContent && (() => {
        const PlayerComponent = resolvePlayer(activePresentation?.mode as PresentationMode | undefined);
        const modeConfig = activePresentation?.mode_config as ModeConfig | undefined;
        if (PlayerComponent) {
          return <PlayerComponent content={adaptedContent} config={modeConfig} className="shadow-sm" />;
        }
        return (
          <div className={cn('rounded-lg border bg-card p-4 shadow-sm transition-all duration-300', layoutClass)} style={contentStyle}>
            <SafeMarkdown content={adaptedContent} />
          </div>
        );
      })()}

      {!isLoading && originalContent && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowOriginal((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {showOriginal ? 'Hide immutable instructor source' : 'View immutable instructor source'}
          </button>
          {showOriginal && (
            <div className="mt-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Instructor authoritative version (stored unchanged)
              </p>
              <SafeMarkdown content={originalContent} />
            </div>
          )}
        </div>
      )}

      {showFeedbackStrip && (
        <div className="mt-4 rounded-lg border bg-accent/40 p-3">
          <p className="text-sm font-medium text-foreground">Was this adapted delivery helpful?</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => submitFeedback('positive')} className="gap-1">
              <ThumbsUp className="h-3.5 w-3.5" /> Yes
            </Button>
            <Button variant="outline" size="sm" onClick={() => submitFeedback('negative')} className="gap-1">
              <ThumbsDown className="h-3.5 w-3.5" /> No
            </Button>
          </div>
        </div>
      )}

      {feedbackGiven && (
        <p className="mt-3 text-sm text-muted-foreground">Thank you for your feedback.</p>
      )}
    </div>
  );
};
