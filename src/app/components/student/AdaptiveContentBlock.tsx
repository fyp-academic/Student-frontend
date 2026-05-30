import React, { useEffect, useRef, useState, useCallback } from 'react';
import { adaptiveContentApi } from '@/app/services/api';
import { SafeMarkdown } from './SafeMarkdown';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { cn } from '@/app/components/ui/utils';
import type { DeliveryStatus, PresentationConfig } from '@/app/types/personalization';
import { cardVariantClass, presentationStyles } from '@/app/types/personalization';
import {
  FileText, BarChart3, Lightbulb, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronUp, User, Gauge, Turtle, Zap, ShieldCheck, Layout, Type, AlertCircle,
} from 'lucide-react';

interface AdaptiveContentBlockProps {
  chunkId: string;
  topicTitle: string;
  courseId: string;
  presentationOverride?: PresentationConfig | null;
}

type Modality = 'text' | 'visual' | 'example-based';

const STATUS_LABELS: Record<DeliveryStatus, { label: string; className: string }> = {
  adapted: { label: 'AI delivery adapted', className: 'bg-primary/10 text-primary' },
  presentation_only: { label: 'Layout personalized', className: 'bg-violet-100 text-violet-800' },
  original_only: { label: 'Instructor original', className: 'bg-slate-100 text-slate-700' },
  fallback: { label: 'Instructor original', className: 'bg-amber-50 text-amber-800' },
  flagged: { label: 'Instructor original (reviewed)', className: 'bg-amber-50 text-amber-900' },
};

export const AdaptiveContentBlock: React.FC<AdaptiveContentBlockProps> = ({
  chunkId,
  topicTitle,
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
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('original_only');
  const [contentAdapted, setContentAdapted] = useState(false);
  const [presentationActive, setPresentationActive] = useState(false);
  const [transparencyMessage, setTransparencyMessage] = useState<string | null>(null);
  const [similarityPercent, setSimilarityPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [settingsApplied, setSettingsApplied] = useState<Record<string, unknown> | null>(null);
  const [presentation, setPresentation] = useState<PresentationConfig | null>(null);
  const [showDetails, setShowDetails] = useState(false);
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
      setDeliveryStatus((data.delivery_status as DeliveryStatus) ?? 'original_only');
      setContentAdapted(data.content_adapted === true);
      setPresentationActive(data.presentation_active === true || data.presentation?.is_active === true);
      setTransparencyMessage(data.transparency?.message ?? null);
      setSimilarityPercent(
        data.similarity_to_original_percent ?? data.integrity?.similarity_to_original_percent ?? null
      );
      setProfile(data.profile ?? null);
      setPresentation(data.presentation ?? null);
      setSettingsApplied(data.settings_applied ?? null);
      if (modality) setCurrentModality(modality);
    } catch {
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

  const getContentBadges = () => {
    if (!contentAdapted || !profile) return [];
    const badges: { label: string; color: string }[] = [];
    const p = profile as Record<string, unknown>;
    if (typeof p.quiz_average === 'number' && p.quiz_average < 60) {
      badges.push({ label: 'Simplified delivery', color: 'bg-amber-100 text-amber-700' });
    }
    if (p.knowledge_level === 'novice') {
      badges.push({ label: 'Scaffolded delivery', color: 'bg-sky-100 text-sky-700' });
    } else if (p.knowledge_level === 'advanced') {
      badges.push({ label: 'Condensed delivery', color: 'bg-indigo-100 text-indigo-700' });
    }
    if (Array.isArray(p.weak_topics) && p.weak_topics.length > 0) {
      badges.push({ label: `Focus: ${String(p.weak_topics[0])}`, color: 'bg-orange-100 text-orange-700' });
    }
    return badges;
  };

  const activePresentation = presentationOverride ?? presentation;
  const contentStyle = presentationStyles(activePresentation);
  const statusMeta = STATUS_LABELS[deliveryStatus] ?? STATUS_LABELS.original_only;
  const layoutClass = cn(
    activePresentation?.typography_class,
    activePresentation?.layout_mode === 'visual' && 'personalization-visual',
    activePresentation?.layout_mode === 'focus' && 'personalization-focus',
    activePresentation?.color_scheme === 'calm' && 'personalization-calm',
    cardVariantClass(activePresentation?.card_variant),
  );

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-base font-semibold text-foreground">{topicTitle}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium', statusMeta.className)}>
            <ShieldCheck className="h-3 w-3" />
            {statusMeta.label}
          </span>
          {presentationActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-medium text-violet-800">
              <Layout className="h-3 w-3" />
              Reading layout
            </span>
          )}
        </div>
      </div>

      {transparencyMessage && (
        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 leading-relaxed">
          {transparencyMessage}
          {similarityPercent != null && contentAdapted && (
            <span className="block mt-1 text-slate-500">
              Delivery differs ~{Math.round(100 - similarityPercent)}% from instructor wording (same learning objective).
            </span>
          )}
        </div>
      )}

      {contentAdapted && getContentBadges().length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {getContentBadges().map((b, i) => (
            <span key={i} className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium', b.color)}>
              {b.label}
            </span>
          ))}
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Why this view?
          </button>
        </div>
      )}

      {showDetails && profile && (
        <div className="mb-3 rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
          <p className="font-semibold text-foreground">Personalization layers</p>
          <div className="flex flex-wrap gap-2">
            <span className={cn('rounded px-2 py-0.5 border', contentAdapted ? 'bg-primary/10 border-primary/20' : 'bg-muted')}>
              Content delivery: {contentAdapted ? 'adapted' : 'original'}
            </span>
            <span className={cn('rounded px-2 py-0.5 border', presentationActive ? 'bg-violet-100 border-violet-200' : 'bg-muted')}>
              Presentation: {presentationActive ? 'active' : 'default'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Pace:</span>
              <span className="font-medium capitalize">{String(profile.pace ?? 'medium')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Quiz avg:</span>
              <span className="font-medium">{String(profile.quiz_average ?? 0)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Type className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Modality:</span>
              <span className="font-medium capitalize">{String(profile.preferred_modality ?? 'text')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Completion:</span>
              <span className="font-medium">{String(profile.completion_rate ?? 0)}%</span>
            </div>
          </div>
        </div>
      )}

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
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isLoading && adaptedContent && (
        <div className={cn('rounded-lg border bg-card p-4 shadow-sm transition-all duration-300', layoutClass)} style={contentStyle}>
          {activePresentation?.show_step_numbers && (
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Turtle className="h-3.5 w-3.5" />
              Step-by-step reading mode
            </p>
          )}
          {activePresentation?.visual_emphasis && (
            <p className="mb-2 text-xs text-blue-700/80">Visual reading layout — tables and lists use instructor content only.</p>
          )}
          <SafeMarkdown content={adaptedContent} />
        </div>
      )}

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
        <p className="mt-3 text-sm text-muted-foreground">Thank you — your feedback improves future delivery.</p>
      )}

      {!contentAdapted && !isLoading && presentationActive && (
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          Wording matches the instructor original; only reading layout is personalized.
        </p>
      )}
    </div>
  );
};
