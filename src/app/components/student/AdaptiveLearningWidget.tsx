import React, { useEffect, useState } from 'react';
import { adaptiveContentApi, profileApi } from '@/app/services/api';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { cn } from '@/app/components/ui/utils';
import { Gauge, Sparkles, AlertTriangle, BookOpen } from 'lucide-react';

interface WeakTopic {
  name: string;
  section_id?: string;
}

export const AdaptiveLearningWidget: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [personalizationCount, setPersonalizationCount] = useState(0);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [modality, setModality] = useState<string>('text');
  const [showModalityModal, setShowModalityModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await profileApi.get();
        const user = meRes.data?.data ?? meRes.data;
        const sid = user?.id;
        setStudentId(sid);
        if (!sid) return;

        const profRes = await adaptiveContentApi.recalculateProfile(sid);
        const prof = profRes.data?.profile;
        setProfile(prof);
        setModality(prof?.preferred_modality ?? 'text');
        setWeakTopics((prof?.weak_topics ?? []).map((t: string) => ({ name: t })));

        const weekRes = await adaptiveContentApi.myProfile();
        setPersonalizationCount(weekRes.data?.adaptation_count_this_week ?? 0);
      } catch {
        // Silently fail; show empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleModalityChange = async (newModality: string) => {
    if (!studentId) return;
    setModality(newModality);
    setShowModalityModal(false);
    try {
      await adaptiveContentApi.recalculateProfile(studentId, { manual_modality: newModality });
    } catch {
      // ignore
    }
  };

  const pacePosition = profile?.pace === 'slow' ? 0 : profile?.pace === 'fast' ? 2 : 1;
  const paceLabels = ['Slow', 'Medium', 'Fast'];

  const modalityLabel = (m: string) => {
    if (m === 'visual') return '📊 Visual explanations';
    if (m === 'example-based') return '💡 Example-based learning';
    return '📝 Text-based learning';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 rounded-xl border bg-card p-4">
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      {/* Pace Bar */}
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
          <Gauge className="h-4 w-4 text-primary" />
          Your Learning Pace
        </div>
        <div className="relative h-2 w-full rounded-full bg-muted">
          <div className="absolute inset-0 flex">
            {paceLabels.map((_, i) => (
              <div key={i} className="flex-1 border-r border-background last:border-r-0" />
            ))}
          </div>
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background transition-all"
            style={{ left: `${(pacePosition / 2) * 100}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          {paceLabels.map((label, i) => (
            <span key={i} className={cn(i === pacePosition && 'font-semibold text-primary')}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Personalization Count */}
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Sparkles className="h-4 w-4 text-amber-500" />
        Your content has been personalized{' '}
        <strong className="mx-0.5">{personalizationCount}</strong> times this week
      </div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Topics needing attention:
          </div>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((topic, i) => (
              <button
                key={i}
                className="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
                onClick={() => {
                  // Navigate to topic if section_id known; otherwise noop
                }}
              >
                {topic.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modality Preference */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          You learn best with: {modalityLabel(modality)}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowModalityModal(true)}>
          Change
        </Button>
      </div>

      {/* Modality override modal */}
      <Dialog open={showModalityModal} onOpenChange={setShowModalityModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Learning Preference</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {([
              { key: 'text', label: '📝 Text-based learning', desc: 'Clean prose and written explanations' },
              { key: 'visual', label: '📊 Visual explanations', desc: 'Diagrams, tables, and spatial layouts' },
              { key: 'example-based', label: '💡 Example-based learning', desc: 'Real-world examples and analogies first' },
            ] as { key: string; label: string; desc: string }[]).map((m) => (
              <button
                key={m.key}
                onClick={() => handleModalityChange(m.key)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent',
                  modality === m.key && 'border-primary bg-primary/5'
                )}
              >
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.desc}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
