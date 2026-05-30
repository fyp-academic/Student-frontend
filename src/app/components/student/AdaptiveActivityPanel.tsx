import React, { useEffect, useState } from 'react';
import { adaptiveContentApi } from '@/app/services/api';
import { AdaptiveContentBlock } from './AdaptiveContentBlock';
import { Loader2, Info } from 'lucide-react';
import type { PresentationConfig } from '@/app/types/personalization';

interface AdaptiveActivityPanelProps {
  activityId: string;
  courseId: string;
  title: string;
  presentationOverride?: PresentationConfig | null;
}

export const AdaptiveActivityPanel: React.FC<AdaptiveActivityPanelProps> = ({
  activityId,
  courseId,
  title,
  presentationOverride,
}) => {
  const [chunks, setChunks] = useState<Array<{ id: string; chunk_index: number }>>([]);
  const [status, setStatus] = useState<string>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await adaptiveContentApi.prepareActivity(activityId);
        const res = await adaptiveContentApi.activityChunks(activityId);
        if (cancelled) return;
        const data = res.data;
        setChunks(data.chunks ?? []);
        setStatus(data.status ?? 'none');
        setProcessingError(data.material?.processing_error ?? null);
        setMessage(data.material?.processing_status === 'processing' ? 'Processing document for personalization…' : null);
      } catch {
        if (!cancelled) {
          setChunks([]);
          setStatus('error');
          setProcessingError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [activityId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground border-b bg-slate-50">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking personalized content…
      </div>
    );
  }

  if (chunks.length === 0) {
    if (status === 'processing' || status === 'pending') {
      return (
        <div className="flex items-start gap-2 px-4 py-3 text-sm text-blue-800 border-b bg-blue-50">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Original resource preserved. Text extraction is in progress — personalized summary will appear when ready.</span>
        </div>
      );
    }
    if (status === 'transcript_unavailable' || status === 'no_extractable_text') {
      const detail = stripReasonPrefix(processingError)
        ?? 'Original video remains available. We could not generate a reliable transcript for safe personalization.';

      return (
        <div className="flex items-start gap-2 px-4 py-3 text-xs text-slate-600 border-b bg-slate-50">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>{detail}</span>
        </div>
      );
    }
    if (status === 'content_mismatch') {
      const detail = stripReasonPrefix(processingError)
        ?? 'Original video remains available. Personalization is paused because the extracted content does not appear aligned with this course activity.';

      return (
        <div className="flex items-start gap-2 px-4 py-3 text-xs text-amber-800 border-b bg-amber-50">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>{detail}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="px-4 py-4 border-b bg-gradient-to-b from-slate-50 to-white space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Personalized reading guide · original {title} unchanged below
      </p>
      {message && <p className="text-xs text-blue-700">{message}</p>}
      {chunks.map((chunk) => (
        <AdaptiveContentBlock
          key={chunk.id}
          chunkId={chunk.id}
          courseId={courseId}
          topicTitle={title}
          presentationOverride={presentationOverride}
        />
      ))}
    </div>
  );
};

const stripReasonPrefix = (value: string | null): string | null => {
  if (!value) return null;
  return value.replace(/^[a-z_]+:\s*/i, '').trim();
};
