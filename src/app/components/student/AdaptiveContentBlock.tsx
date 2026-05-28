import React, { useEffect, useRef, useState, useCallback } from 'react';
import { adaptiveContentApi } from '@/app/services/api';
import { SafeMarkdown } from './SafeMarkdown';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { cn } from '@/app/components/ui/utils';
import { FileText, BarChart3, Lightbulb, ThumbsUp, ThumbsDown, Info } from 'lucide-react';

interface AdaptiveContentBlockProps {
  chunkId: string;
  topicTitle: string;
  courseId: string;
}

type Modality = 'text' | 'visual' | 'example-based';

export const AdaptiveContentBlock: React.FC<AdaptiveContentBlockProps> = ({ chunkId, topicTitle }) => {
  const [adaptedContent, setAdaptedContent] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [adaptationId, setAdaptationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [currentModality, setCurrentModality] = useState<Modality>('text');
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackTimerStarted, setFeedbackTimerStarted] = useState(false);
  const [feedbackReady, setFeedbackReady] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchContent = useCallback(async (modality?: Modality) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adaptiveContentApi.get(chunkId, modality);
      const data = res.data;
      setAdaptedContent(data.adapted_text ?? null);
      setOriginalContent(data.original_text ?? null);
      setAdaptationId(data.adaptation_id ?? null);
      setIsPersonalized(data.is_personalized === true);
      if (modality) setCurrentModality(modality);
    } catch (err: any) {
      setError('Could not load content. Please try again.');
    } finally {
      setIsLoading(false);
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
            timerRef.current = setTimeout(() => {
              setFeedbackReady(true);
            }, 30000);
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
      // Silently fail on feedback
    }
  };

  const showFeedbackStrip = feedbackReady && !feedbackGiven && !isLoading && adaptedContent;

  return (
    <div ref={containerRef} className="w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground">{topicTitle}</h3>
        {isPersonalized && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Info className="h-3 w-3" />
            Personalized for your learning style
          </span>
        )}
      </div>

      {/* Modality switcher */}
      {!isLoading && (
        <div className="flex items-center gap-2 mb-4">
          {([
            { key: 'text', label: 'Text', icon: FileText },
            { key: 'visual', label: 'Visual', icon: BarChart3 },
            { key: 'example-based', label: 'Example', icon: Lightbulb },
          ] as { key: Modality; label: string; icon: any }[]).map((m) => (
            <button
              key={m.key}
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

      {/* Skeleton loader */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[95%]" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-4 w-full" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Content area */}
      {!isLoading && adaptedContent && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <SafeMarkdown content={adaptedContent} />
        </div>
      )}

      {/* Original version toggle */}
      {!isLoading && originalContent && (
        <div className="mt-3">
          <button
            onClick={() => setShowOriginal((v) => !v)}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {showOriginal ? 'Hide Original Instructor Version' : 'View Original Instructor Version'}
          </button>
          {showOriginal && (
            <div className="mt-2 rounded-lg border bg-muted/50 p-4">
              <SafeMarkdown content={originalContent} />
            </div>
          )}
        </div>
      )}

      {/* Feedback strip */}
      {showFeedbackStrip && (
        <div className="mt-4 rounded-lg border bg-accent/40 p-3">
          <p className="text-sm font-medium text-foreground">Was this explanation helpful?</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => submitFeedback('positive')} className="gap-1">
              <ThumbsUp className="h-3.5 w-3.5" /> Yes
            </Button>
            <Button variant="outline" size="sm" onClick={() => submitFeedback('negative')} className="gap-1">
              <ThumbsDown className="h-3.5 w-3.5" /> No
            </Button>
            <div className="mx-1 h-5 w-px bg-border" />
            <Button variant="ghost" size="sm" onClick={() => submitFeedback(undefined, 'too_simple')}>
              Too Simple
            </Button>
            <Button variant="ghost" size="sm" onClick={() => submitFeedback(undefined, 'just_right')}>
              Just Right
            </Button>
            <Button variant="ghost" size="sm" onClick={() => submitFeedback(undefined, 'too_complex')}>
              Too Complex
            </Button>
          </div>
        </div>
      )}

      {feedbackGiven && (
        <p className="mt-3 text-sm text-muted-foreground">Thanks — we&apos;ll keep adjusting.</p>
      )}
    </div>
  );
};
