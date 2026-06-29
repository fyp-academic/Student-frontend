import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Loader2, Play, CheckCircle, Send, Clock } from 'lucide-react';
import { practicalApi, proctoringApi } from '../../services/api';
import { SafeHtml } from '../SafeHtml';
import CodeWorkspace, { CodeFiles, EMPTY_FILES } from '../CodeWorkspace';
import { useCountdown, deadlineFromRemaining } from '../../hooks/useCountdown';
import { CountdownBadge } from '../CountdownBadge';

interface Props {
  activityId: string;
  onSubmitted?: () => void;
  /** When proctored, the active proctoring session id (for AI submission analysis). */
  proctorSessionId?: string | null;
  /** Lets the proctoring monitor force-submit the current code on the violation threshold. */
  forceSubmitRef?: MutableRefObject<(() => void) | null>;
}

function buildSrcDoc({ html, css, js }: CodeFiles): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${css || ''}</style></head><body>${html || ''}<script>${js || ''}<\/script></body></html>`;
}

/**
 * Student workspace for a Practical Problem:
 *  (a) student editor  — handled by CodeWorkspace (left)
 *  (b) student live preview, rendered ABOVE the editor (left)
 *  (c) instructor sample preview + instructions (right)
 * Student code autosaves as a draft and can be submitted for grading.
 */
export function PracticalPanel({ activityId, onSubmitted, proctorSessionId, forceSubmitRef }: Props) {
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any>(null);
  const [files, setFiles] = useState<CodeFiles>(EMPTY_FILES);
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [deadlineTs, setDeadlineTs] = useState<number | null>(null);
  const [timeLimitMin, setTimeLimitMin] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const firstLoad = useRef(true);
  const filesRef = useRef<CodeFiles>(EMPTY_FILES);
  const statusRef = useRef<'draft' | 'submitted'>('draft');
  const startingRef = useRef(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      practicalApi.template(activityId).then(r => r.data).catch(() => null),
      practicalApi.mySubmission(activityId).then(r => r.data).catch(() => null),
    ]).then(([tpl, mine]) => {
      if (!alive) return;
      const sub = mine?.data;
      setTemplate(tpl);
      const limit = Number(mine?.time_limit_minutes ?? 0) || 0;
      setTimeLimitMin(limit > 0 ? limit : null);
      const hasStarted = !!sub?.started_at;
      setStarted(hasStarted);
      if (sub?.files && (sub.files.html || sub.files.css || sub.files.js)) {
        setFiles({ ...EMPTY_FILES, ...sub.files });
        setStatus(sub.status === 'submitted' ? 'submitted' : 'draft');
      } else if (tpl?.starter) {
        setFiles({ ...EMPTY_FILES, ...tpl.starter });
      }
      // Arm the countdown ONLY for an already-started, not-yet-submitted attempt.
      // A passive open never arms it (so it can never auto-submit on view).
      if (sub?.status !== 'submitted' && hasStarted) {
        setDeadlineTs(deadlineFromRemaining(mine?.time_limit_seconds));
      }
    }).finally(() => { if (alive) { setLoading(false); firstLoad.current = false; } });
    return () => { alive = false; };
  }, [activityId]);

  // Explicit, idempotent start — anchors the server clock and arms the countdown.
  const beginAttempt = async () => {
    if (startingRef.current || statusRef.current === 'submitted') return;
    startingRef.current = true;
    setStarting(true);
    try {
      const { data } = await practicalApi.start(activityId);
      setStarted(true);
      if ((Number(data?.time_limit_minutes ?? 0) || 0) > 0) {
        setDeadlineTs(deadlineFromRemaining(data?.time_limit_seconds));
      }
    } catch {
      startingRef.current = false; // allow retry on failure
    } finally {
      setStarting(false);
    }
  };

  // Proctored: the student already clicked "Start Proctored Task" in the lesson, so
  // begin the timed attempt automatically — no second gate.
  useEffect(() => {
    if (loading || !proctorSessionId) return;
    if (timeLimitMin && !started && statusRef.current !== 'submitted') {
      void beginAttempt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, proctorSessionId, timeLimitMin, started]);

  // Keep refs current so the timer's auto-submit always sees the latest work.
  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { statusRef.current = status; }, [status]);

  // Let the proctoring monitor force-submit the latest code on the violation threshold.
  useEffect(() => {
    if (!forceSubmitRef) return;
    forceSubmitRef.current = () => { void submitFiles(filesRef.current); };
    return () => { forceSubmitRef.current = null; };
  }, [forceSubmitRef]);

  const remainingSec = useCountdown(deadlineTs, () => {
    if (statusRef.current !== 'submitted') void submitFiles(filesRef.current);
  });

  // Debounced autosave of the draft.
  const handleChange = (next: CodeFiles) => {
    setFiles(next);
    setSaveState('saving');
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await practicalApi.save(activityId, { files: next, status: status === 'submitted' ? 'submitted' : 'draft' });
        setSaveState('saved');
      } catch { setSaveState('idle'); }
    }, 900);
  };

  const submitFiles = async (toSubmit: CodeFiles) => {
    if (statusRef.current === 'submitted') return;
    setSubmitting(true);
    setDeadlineTs(null); // stop the countdown
    try {
      // Proctored: run the AI-content check on the code (non-blocking), like assignments.
      if (proctorSessionId) {
        try {
          const afd = new FormData();
          afd.append('session_id', proctorSessionId);
          afd.append('text', `HTML:\n${toSubmit.html}\n\nCSS:\n${toSubmit.css}\n\nJS:\n${toSubmit.js}`);
          await proctoringApi.analyzeSubmission(afd);
        } catch { /* non-blocking */ }
      }
      await practicalApi.save(activityId, { files: toSubmit, status: 'submitted' });
      setStatus('submitted');
      setSaveState('saved');
      onSubmitted?.();
    } catch { /* surfaced by saveState */ }
    finally { setSubmitting(false); }
  };
  const submit = () => submitFiles(files);

  const sampleDoc = useMemo(
    () => template?.sample ? buildSrcDoc({ ...EMPTY_FILES, ...template.sample }) : '',
    [template]
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin text-blue-600" /></div>;

  // Timed practical that hasn't been started yet (and isn't proctored, which auto-starts):
  // show an explicit Start gate so merely opening the activity never starts the clock.
  const needsStartGate = !!timeLimitMin && !started && status !== 'submitted' && !proctorSessionId;
  if (needsStartGate) {
    return (
      <div className="max-w-xl mx-auto text-center rounded-2xl border border-gray-200 bg-white p-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-4">
          <Clock size={26} className="text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Timed practical</h3>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          You have <span className="font-semibold text-gray-700">{timeLimitMin} minute{timeLimitMin === 1 ? '' : 's'}</span> once you begin.
          The timer starts only when you click start, and your work auto-submits when it reaches zero.
        </p>
        <button onClick={beginAttempt} disabled={starting}
          className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          <Play size={16} /> {starting ? 'Starting…' : 'Start timed task'}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* (a)+(b) Student editor with live preview above it (left) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600">Your solution</span>
          <div className="flex items-center gap-2">
            {status !== 'submitted' && <CountdownBadge remainingSec={remainingSec} />}
            <span className="text-xs text-gray-400">
              {status === 'submitted' ? <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle size={13} /> Submitted</span>
                : saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Draft saved' : ''}
            </span>
          </div>
        </div>
        <CodeWorkspace files={files} onChange={handleChange} previewAbove previewHeight={260} editorHeight={260} />
        <div className="flex justify-end">
          <button onClick={submit} disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Send size={15} /> {submitting ? 'Submitting…' : status === 'submitted' ? 'Resubmit' : 'Submit'}
          </button>
        </div>
      </div>

      {/* (c) Instructor task: sample preview + instructions (right) */}
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
            <Play size={13} /> Target — what to build
          </div>
          {sampleDoc
            ? <iframe title="sample" sandbox="allow-scripts" srcDoc={sampleDoc} style={{ width: '100%', height: 300, border: 'none', background: '#fff' }} />
            : <div className="p-6 text-sm text-gray-400">No sample provided.</div>}
        </div>
        {template?.instructions && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-semibold text-gray-600 mb-2">Instructions</div>
            <SafeHtml html={String(template.instructions)} className="prose prose-sm max-w-none text-gray-700" />
          </div>
        )}
      </div>
    </div>
  );
}
