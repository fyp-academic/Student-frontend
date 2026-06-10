import React, { useState, useCallback } from 'react';
import { adaptiveContentApi } from '@/app/services/api';
import { SafeMarkdown } from './SafeMarkdown';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Skeleton } from '@/app/components/ui/skeleton';
import { cn } from '@/app/components/ui/utils';
import type { PresentationConfig } from '@/app/types/personalization';
import {
  ChevronDown, ChevronUp, Copy, Check,
  BookOpen, FileText, Lightbulb, HelpCircle, AlertTriangle
} from 'lucide-react';

interface VideoNotes {
  key_points: string[];
  definitions: { term: string; definition: string }[];
  study_questions: string[];
  further_review: string[];
}

interface VideoLearningData {
  activity_id: string;
  has_transcript: boolean;
  transcript: string;
  summary: string;
  notes: VideoNotes;
  profile_applied: { knowledge_level: string; modality: string };
}

interface VideoLearningPanelProps {
  activityId: string;
  courseId: string;
  presentationConfig?: PresentationConfig | null;
}

export const VideoLearningPanel: React.FC<VideoLearningPanelProps> = ({
  activityId,
  courseId,
  presentationConfig,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<VideoLearningData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (data || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adaptiveContentApi.videoLearningSupport(activityId);
      setData(res.data);
    } catch {
      setError('Could not load learning tools for this video.');
    } finally {
      setLoading(false);
    }
  }, [activityId, data, loading]);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) load();
  };

  const copyTranscript = async () => {
    if (!data?.transcript) return;
    await navigator.clipboard.writeText(data.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-t bg-card">
      {/* Toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>Learning tools</span>
          {data?.profile_applied && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
              Personalised
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3">
          {loading && (
            <div className="space-y-2 py-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          )}

          {error && (
            <p className="py-3 text-sm text-destructive">{error}</p>
          )}

          {!loading && data && !data.has_transcript && (
            <p className="py-3 text-sm text-muted-foreground">
              No transcript available for this video. Learning tools require a transcript.
            </p>
          )}

          {!loading && data && data.has_transcript && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="mb-3 w-full grid grid-cols-4 h-9">
                <TabsTrigger value="summary" className="text-xs gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs gap-1">
                  <FileText className="h-3 w-3" />
                  My Notes
                </TabsTrigger>
                <TabsTrigger value="questions" className="text-xs gap-1">
                  <HelpCircle className="h-3 w-3" />
                  Questions
                </TabsTrigger>
                <TabsTrigger value="transcript" className="text-xs gap-1">
                  <BookOpen className="h-3 w-3" />
                  Transcript
                </TabsTrigger>
              </TabsList>

              {/* Summary tab */}
              <TabsContent value="summary">
                {data.summary ? (
                  <div>
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary">
                        Personalised for {data.profile_applied.knowledge_level} · {data.profile_applied.modality}
                      </span>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                      <SafeMarkdown content={data.summary} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Summary not available.</p>
                )}
              </TabsContent>

              {/* Notes tab */}
              <TabsContent value="notes">
                <div className="space-y-4">
                  {data.notes.key_points.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key points</p>
                      <ul className="space-y-1.5">
                        {data.notes.key_points.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary/15 text-center text-[10px] font-bold leading-4 text-primary">
                              {i + 1}
                            </span>
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.notes.definitions.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Definitions</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {data.notes.definitions.map((d, i) => (
                          <div key={i} className="rounded-lg border bg-background p-2.5">
                            <p className="text-xs font-semibold text-foreground">{d.term}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{d.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.notes.further_review.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        <p className="text-xs font-semibold text-amber-800">Topics to review further</p>
                      </div>
                      <ul className="space-y-1">
                        {data.notes.further_review.map((t, i) => (
                          <li key={i} className="text-xs text-amber-900">• {t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Study questions tab */}
              <TabsContent value="questions">
                {data.notes.study_questions.length > 0 ? (
                  <div className="space-y-2">
                    {data.notes.study_questions.map((q, i) => (
                      <details key={i} className="group rounded-lg border bg-background">
                        <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-medium list-none">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                            {i + 1}
                          </span>
                          {q}
                        </summary>
                        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                          Try to answer this yourself first — revisit the relevant section if needed.
                        </div>
                      </details>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No study questions available.</p>
                )}
              </TabsContent>

              {/* Transcript tab */}
              <TabsContent value="transcript">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">AI-extracted transcript</p>
                  <button
                    onClick={copyTranscript}
                    className={cn(
                      'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                      copied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <ScrollArea className="h-48 rounded-lg border bg-muted/20 p-3">
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                    {data.transcript}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
};
