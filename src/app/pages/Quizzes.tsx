import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router";
import { HelpCircle, Clock, CheckCircle, PlayCircle, Lock, Trophy, X, ChevronRight, Loader2, Eye } from "lucide-react";
import { quizApi, dashboardApi } from "../services/api";
import { useProctoringMonitor } from '../hooks/useProctoringMonitor';
import ViolationWarningModal from '../components/ViolationWarningModal';
import { useRealtime } from "../context/RealtimeContext";
import { useAiWidgetContext } from "../context/AiWidgetContext";

type Quiz    = Record<string, unknown>;
type QItem   = Record<string, unknown>;
type AItem   = Record<string, unknown>;

const COLORS = ["#2563eb","#7c3aed","#0891b2","#059669","#dc2626","#f59e0b"];

// Categorize question types for rendering
const getQType = (q: QItem): string => String(q.type ?? '').toLowerCase();
const isChoiceQ = (q: QItem) => ['multiple_choice', 'true_false', 'calculated_multichoice'].includes(getQType(q));
const isTextQ   = (q: QItem) => ['short_answer', 'numerical', 'calculated', 'calculated_simple'].includes(getQType(q));
const isEssayQ  = (q: QItem) => getQType(q) === 'essay';
const isMatchQ  = (q: QItem) => ['matching', 'drag_drop', 'drag_drop_text', 'drag_drop_markers'].includes(getQType(q));

// Convert index to lowercase Roman numeral (i, ii, iii, iv, v...)
const toLowerRoman = (n: number): string => {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['m','cm','d','cd','c','xc','l','xl','x','ix','v','iv','i'];
  let r = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { r += syms[i]; n -= vals[i]; }
  }
  return r;
};

// Convert index to uppercase Roman numeral (I, II, III, IV, V...)
const toUpperRoman = (n: number): string => {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let r = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { r += syms[i]; n -= vals[i]; }
  }
  return r;
};

const getChoiceLabel = (format: string | null | undefined, index: number): string => {
  if (!format || format === 'none') return '';
  const i = index + 1;
  switch (format) {
    case 'a': case 'a,b,c...': return String.fromCharCode(96 + i) + '.';
    case 'A': case 'A,B,C...': return String.fromCharCode(64 + i) + '.';
    case 'i': case 'i,ii,iii...': return toLowerRoman(i) + '.';
    case 'I': case 'I,II,III...': return toUpperRoman(i) + '.';
    case '1': case '1,2,3...': return `${i}.`;
    default: return '';
  }
};

const getScoreColor = (score: number) => score >= 90 ? "#16a34a" : score >= 80 ? "#2563eb" : score >= 70 ? "#f59e0b" : "#dc2626";
const getScoreLabel = (score: number) => score >= 90 ? "Excellent" : score >= 80 ? "Good" : score >= 70 ? "Fair" : "Needs Improvement";

export function Quizzes() {
  const location = useLocation();
  const startQuizId = (location.state as { startQuizId?: string } | null)?.startQuizId;
  const { setContext } = useAiWidgetContext();
  const { refreshTrigger } = useRealtime();

  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Available", "Completed", "Locked"];

  const [quizzes, setQuizzes]     = useState<Quiz[]>([]);
  const [loading, setLoading]     = useState(true);

  // Quiz runner state
  const [activeQuiz, setActiveQuiz]         = useState<Quiz | null>(null);
  const [questions, setQuestions]           = useState<QItem[]>([]);
  const [answers, setAnswers]               = useState<Record<string, unknown[]>>({});
  const [selected, setSelected]             = useState<Record<string, unknown>>({});
  const [currentQ, setCurrentQ]             = useState(0);
  const [attemptId, setAttemptId]           = useState<string | null>(null);
  const [quizLoading, setQuizLoading]       = useState(false);
  const [submitted, setSubmitted]           = useState(false);
  const [result, setResult]                 = useState<Record<string, unknown> | null>(null);
  const [quizError, setQuizError] = useState<{ quiz: Quiz; message: string } | null>(null);

  // Review mode state
  const [reviewMode, setReviewMode]         = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<QItem[]>([]);
  const [reviewAnswers, setReviewAnswers]     = useState<Record<string, unknown[]>>({});
  const [reviewResponses, setReviewResponses] = useState<Record<string, string>>({});

  // Proctoring: active when attemptId is set and quiz not yet submitted
  const procSessionKey = activeQuiz && attemptId && !submitted ? attemptId : null;
  const procForceSubmit = useCallback(() => {
    setSubmitted(true);
    setResult(null);
  }, []);

  const { webcamRef: procWebcamRef, canvasRef: procCanvasRef, warningCount: procWarningCount, lastViolation, dismissViolation } =
    useProctoringMonitor({
      sessionKey:    procSessionKey,
      activityId:    String(activeQuiz?.activity_id ?? activeQuiz?.id ?? ''),
      contextType:   'quiz',
      quizAttemptId: attemptId ?? undefined,
      onForceSubmit: procForceSubmit,
    });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      quizApi.myAttempts().then(r => r.data.data ?? r.data ?? []).catch(() => []),
      dashboardApi.studentHub().then(r => {
        const enrolled = (r.data.enrolled_courses ?? []) as Record<string, unknown>[];
        const quizActivities: Quiz[] = [];
        for (const enrollment of enrolled) {
          const course = (enrollment.course ?? enrollment) as Record<string, unknown>;
          const sections = (course.sections ?? []) as Record<string, unknown>[];
          for (const sec of sections) {
            const acts = (sec.activities ?? []) as Record<string, unknown>[];
            for (const act of acts) {
              const t = String(act.type ?? act.activity_type ?? '').toLowerCase();
              if (t === 'quiz') {
                quizActivities.push({
                  ...act,
                  id: String(act.id ?? ''),
                  activity_id: String(act.id ?? ''),
                  title: String(act.name ?? act.title ?? 'Quiz'),
                  status: 'available',
                  score: null,
                  questions_count: 0,
                  time_limit: Number(act.time_limit ?? act.grade_max ?? 0),
                  max_attempts: 2,
                  attempts: 0,
                });
              }
            }
          }
        }
        return quizActivities;
      }).catch(() => []),
    ]).then(([attempts, available]) => {
      if (cancelled) return;

      // Build attempt lookup by activity_id
      const attemptMap = new Map<string, Quiz>();
      for (const a of attempts as Quiz[]) {
        const aid = String(a.activity_id ?? (a.activity as Record<string, unknown>)?.id ?? a.id ?? '');
        if (aid) attemptMap.set(aid, a);
      }

      // Merge: keep all display fields from available quiz, overlay attempt completion data
      const merged: Quiz[] = (available as Quiz[]).map(q => {
        const qid = String(q.activity_id ?? q.id ?? '');
        const att = attemptMap.get(qid);
        if (!att) return q;
        return {
          ...q,
          status: att.status,
          score: att.score,
          max_score: att.max_score,
          attempt_id: att.id,
          attempt_number: att.attempt_number,
          submitted_at: att.submitted_at,
          attempts: Number(att.attempt_number ?? 1),
        };
      });

      // Add attempts that have no matching available quiz (e.g. deleted activity)
      for (const [aid, att] of attemptMap) {
        if (!merged.some(m => String(m.activity_id ?? m.id ?? '') === aid)) {
          const activity = (att.activity as Record<string, unknown>) ?? {};
          merged.push({
            ...att,
            id: aid,
            activity_id: aid,
            attempt_id: att.id,
            title: String(activity.name ?? activity.title ?? att.title ?? 'Quiz'),
            status: att.status,
            score: att.score,
            questions_count: 0,
            time_limit: Number(activity.time_limit ?? activity.grade_max ?? 0),
            max_attempts: 2,
            attempts: Number(att.attempt_number ?? 1),
          });
        }
      }

      setQuizzes(merged);
      // Auto-start quiz if navigated from Lessons with a specific quiz ID
      if (startQuizId) {
        const target = merged.find(m => String(m.id ?? m.activity_id ?? '') === startQuizId);
        if (target) {
          setTimeout(() => handleStartQuiz(target), 0);
        }
      }
    }).finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  const scored = quizzes.filter(q => q.score !== null && q.score !== undefined);
  const avgScore = scored.length
    ? Math.round(scored.reduce((s, q) => s + Number(q.score ?? q.grade ?? 0), 0) / scored.length)
    : 0;

  const filtered = activeFilter === "All"
    ? quizzes
    : activeFilter === "Completed"
    ? quizzes.filter(q => ['submitted', 'graded', 'completed', 'pending_review'].includes(String(q.status ?? '').toLowerCase()))
    : quizzes.filter(q => String(q.status ?? '').toLowerCase() === activeFilter.toLowerCase());

  const handleStartQuiz = async (quiz: Quiz) => {
    const actId = String(quiz.activity_id ?? quiz.id ?? '');
    setActiveQuiz(quiz);
    setQuizLoading(true);
    setSubmitted(false);
    setResult(null);
    setSelected({});
    setCurrentQ(0);
    setAttemptId(null);
    setReviewMode(false);
    // Push restricted mode to AI widget
    setContext({
      currentPage:   '/quizzes',
      topicId:       actId,
      topicName:     String(quiz.title ?? quiz.name ?? 'Quiz'),
      mode:          'restricted',
      activityType:  'quiz',
      quizAttemptId: undefined,
    });
    try {
      const [startRes, qRes] = await Promise.all([
        quizApi.start(actId),
        quizApi.questions(actId),
      ]);
      const attemptData = startRes.data.data ?? startRes.data ?? {};
      const newAttemptId = String((attemptData as Record<string,unknown>).id ?? '');
      setAttemptId(newAttemptId);

      // Debug logging to trace empty questions
      console.log('[Quiz] activity_id:', actId);
      console.log('[Quiz] questions response:', qRes.data);

      const qs: QItem[] = qRes.data.data ?? qRes.data ?? [];
      console.log('[Quiz] parsed questions:', qs.length, qs);
      setQuestions(qs);

      // Load answer options — backend already eager-loads answers with questions
      const ansMap: Record<string, unknown[]> = {};
      await Promise.all(qs.map(async (q) => {
        const qid = String(q.id ?? '');
        if (!qid) return;
        const existing = (q.answers ?? q.answers_list ?? []) as unknown[];
        if (existing.length > 0) {
          ansMap[qid] = existing;
          return;
        }
        // Fallback: fetch answers separately if not included in questions response
        const ar = await quizApi.answers(qid);
        ansMap[qid] = ar.data.data ?? ar.data ?? [];
      }));
      setAnswers(ansMap);
    } catch (err: any) {
      console.error('Failed to start quiz:', err);
       
      // If quiz is already submitted, show modal that redirects to review
      const errorCode = err?.response?.data?.error ?? '';
      const errorMessage = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      const attemptId = err?.response?.data?.attempt_id;
      
      if ((errorCode === 'quiz_already_submitted' || errorMessage.includes('already been submitted')) && attemptId) {
        setActiveQuiz(null);
        setQuizzes(prev => prev.map(q =>
          String(q.activity_id ?? q.id ?? '') === actId
            ? { ...q, status: 'submitted', attempt_id: attemptId }
            : q
        ));
        setQuizError({
          quiz: { ...quiz, attempt_id: attemptId },
          message: errorMessage
        });
        setQuizLoading(false);
        return;
      }
       
      // For other errors, show generic error alert
      alert('Failed to start quiz: ' + errorMessage);
      setQuizLoading(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleReviewQuiz = async (quiz: Quiz) => {
    // After merge fix: quiz.id = activity_id, quiz.attempt_id = attempt UUID
    const reviewAttemptId = String(quiz.attempt_id ?? quiz.id ?? '');
    const actId = String(quiz.activity_id ?? quiz.id ?? '');
    if (!reviewAttemptId || !actId) return;

    setActiveQuiz(quiz);
    setQuizLoading(true);
    setReviewMode(true);
    setSubmitted(false);
    setResult(null);
    setReviewQuestions([]);
    setReviewAnswers({});
    setReviewResponses({});
    setSelected({});

    try {
      // Fetch questions and attempt in parallel
      const [qRes, attemptRes] = await Promise.all([
        quizApi.questions(actId),
        quizApi.get(reviewAttemptId),
      ]);

      console.log('[Review] activity_id:', actId, 'attempt_id:', reviewAttemptId);
      console.log('[Review] questions response:', qRes.data);
      console.log('[Review] attempt response:', attemptRes.data);

      const qs: QItem[] = qRes.data.data ?? qRes.data ?? [];
      setReviewQuestions(qs);

      // Build answer map from questions (includes correct answers with grade_fraction)
      const ansMap: Record<string, unknown[]> = {};
      await Promise.all(qs.map(async (q) => {
        const qid = String(q.id ?? '');
        if (!qid) return;
        const existing = (q.answers ?? q.answers_list ?? []) as unknown[];
        if (existing.length > 0) { ansMap[qid] = existing; return; }
        const ar = await quizApi.answers(qid);
        ansMap[qid] = ar.data.data ?? ar.data ?? [];
      }));
      setReviewAnswers(ansMap);

      // Build student response map from attempt data
      const responseMap: Record<string, string> = {};
      const textResponseMap: Record<string, string> = {};
      const attemptData = attemptRes.data.data ?? attemptRes.data ?? {};
      const responses = (attemptData.responses ?? []) as Record<string, unknown>[];
      for (const r of responses) {
        const qid = String(r.question_id ?? (r as any).question?.id ?? '');
        const aid = String(r.answer_id ?? (r as any).answer?.id ?? '');
        const rt = String(r.response_text ?? '');
        if (qid && aid) responseMap[qid] = aid;
        if (qid && rt) textResponseMap[qid] = rt;
      }
      setReviewResponses(responseMap);
      // Also store text responses in the same selected map for review display
      setSelected(prev => ({ ...prev, ...textResponseMap }));
    } catch (err: any) {
      console.error('Failed to load review:', err);
      alert('Failed to load review: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
      setActiveQuiz(null);
      setReviewMode(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!attemptId) return;

    // Guard: require at least one answer
    const answeredCount = Object.keys(selected).length;
    if (answeredCount === 0) {
      alert('Please select at least one answer before submitting.');
      return;
    }

    // Guard: confirm if not all questions answered
    if (answeredCount < questions.length) {
      const ok = window.confirm(`You have answered ${answeredCount} of ${questions.length} questions. Submit anyway?`);
      if (!ok) return;
    }

    setQuizLoading(true);
    try {
      const responses = questions.map((q) => {
        const qid = String(q.id ?? '');
        const studentAnswer = selected[qid];
        if (isTextQ(q) || isEssayQ(q)) {
          return { question_id: qid, response_text: String(studentAnswer ?? '') };
        }
        return { question_id: qid, answer_id: String(studentAnswer ?? '') };
      }).filter(r => r.question_id);
      const r = await quizApi.submit(attemptId, { responses });
      setResult(r.data.data ?? r.data ?? {});
      setSubmitted(true);
      setContext({ mode: 'remediation', quizAttemptId: attemptId ?? undefined });
    } catch (err: any) {
      console.error('Failed to submit quiz:', err);
      const data = err?.response?.data ?? {};
      const errors = data.errors ?? {};
      const errorMessages = Object.values(errors).flat().filter(Boolean);
      const mainMessage = data.message || err?.message || 'Unknown error';
      const displayMsg = errorMessages.length > 0
        ? `${mainMessage}\n\n${errorMessages.join('\n')}`
        : mainMessage;
      alert('Failed to submit quiz: ' + displayMsg);

      // If already submitted, show the result and close
      if (data.data?.status === 'submitted') {
        setResult(data.data);
        setSubmitted(true);
      }
    } finally {
      setQuizLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#2563eb" }} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* ── Proctoring hidden elements ── */}
      <video ref={procWebcamRef} autoPlay muted playsInline style={{ display: 'none' }} />
      <canvas ref={procCanvasRef} style={{ display: 'none' }} />
      <ViolationWarningModal violation={lastViolation} warningCount={procWarningCount} onAcknowledge={dismissViolation} />
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Quizzes</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>Test your knowledge with course quizzes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available", value: quizzes.filter(q => !['submitted', 'graded', 'completed'].includes(String(q.status ?? '').toLowerCase())).length, color: "#2563eb", bg: "#eff6ff", icon: HelpCircle },
          { label: "Completed", value: quizzes.filter(q => ['submitted', 'graded', 'completed'].includes(String(q.status ?? '').toLowerCase())).length, color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle },
          { label: "Avg. Score", value: scored.length ? `${avgScore}%` : "—", color: "#7c3aed", bg: "#fdf4ff", icon: Trophy },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>{s.value}</p>
              <p style={{ fontSize: "11px", color: "#94a3b8" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="px-4 py-2 rounded-xl border transition-all"
            style={{
              fontSize: "12px",
              fontWeight: activeFilter === f ? 600 : 400,
              backgroundColor: activeFilter === f ? "#2563eb" : "white",
              color: activeFilter === f ? "white" : "#475569",
              borderColor: activeFilter === f ? "#2563eb" : "#e2e8f0",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Quiz Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <HelpCircle size={32} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>No quizzes found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((quiz, idx) => {
            const qid        = String(quiz.id ?? idx);
            const code       = String(quiz.course_code ?? quiz.code ?? '');
            const topic      = String(quiz.topic ?? quiz.module ?? '');
            const title      = String(quiz.title ?? quiz.name ?? '');
            const rawStatus  = String(quiz.status ?? 'available').toLowerCase();
            // Treat submitted/graded as completed
            const status     = ['submitted', 'graded'].includes(rawStatus) ? 'completed' : rawStatus;
            const score      = quiz.score !== null && quiz.score !== undefined ? Number(quiz.score ?? quiz.grade ?? 0) : null;
            const questions  = Number(quiz.questions_count ?? quiz.questions ?? 0);
            const timeLimit  = Number(quiz.time_limit ?? quiz.timeLimit ?? 0);
            const attempts   = Number(quiz.attempts ?? quiz.attempts_count ?? 0);
            const maxAttempts = Number(quiz.max_attempts ?? quiz.maxAttempts ?? 2);
            const dueDate    = String(quiz.due_date ?? quiz.dueDate ?? '');
            const color      = COLORS[idx % COLORS.length];
            const isLocked   = status === 'locked';
            const isCompleted = ['completed', 'submitted', 'graded', 'pending_review'].includes(status);

            return (
              <div
                key={qid}
                className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)", opacity: isLocked ? 0.6 : 1 }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {code && <span className="px-2 py-0.5 rounded-md text-white" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: color }}>{code}</span>}
                      {topic && <span style={{ fontSize: "11px", color: "#94a3b8" }}>{topic}</span>}
                    </div>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{title}</h3>
                  </div>
                  {isLocked ? (
                    <Lock size={18} color="#94a3b8" />
                  ) : score !== null ? (
                    <div className="text-center">
                      <p style={{ fontSize: "22px", fontWeight: 700, color: getScoreColor(score) }}>{score}%</p>
                      <p style={{ fontSize: "10px", color: getScoreColor(score), fontWeight: 600 }}>{getScoreLabel(score)}</p>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-4 mb-4" style={{ fontSize: "11px", color: "#94a3b8" }}>
                  {questions > 0 && <div className="flex items-center gap-1"><HelpCircle size={11} />{questions} questions</div>}
                  {timeLimit > 0 && <div className="flex items-center gap-1"><Clock size={11} />{timeLimit} min</div>}
                  <div className="flex items-center gap-1"><CheckCircle size={11} />{attempts}/{maxAttempts} attempts</div>
                </div>

                {score !== null && (
                  <div className="mb-3">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                      <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: getScoreColor(score) }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "11px", color: isCompleted ? "#16a34a" : status === "available" ? "#f59e0b" : "#94a3b8", fontWeight: isCompleted || status === "available" ? 600 : 400 }}>
                    {isCompleted ? `✓ Complete` : status === "available" ? `⚡ Due: ${dueDate}` : isLocked ? "🔒 Complete prev. module" : `Due: ${dueDate}`}
                  </span>
                  {!isCompleted && !isLocked && (
                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white transition-all"
                      style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "#2563eb" }}
                    >
                      <PlayCircle size={13} /> Start Quiz
                    </button>
                  )}
                  {isCompleted && (
                    <button
                      onClick={() => handleReviewQuiz(quiz)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all hover:bg-emerald-50"
                      style={{ fontSize: "12px", color: "#16a34a", borderColor: "#bbf7d0" }}
                    >
                      <Eye size={13} /> Review Quiz
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quiz Runner Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8" role="dialog" aria-modal="true" aria-label="Quiz">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => { if (!quizLoading) { setActiveQuiz(null); setReviewMode(false); } }} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh", boxShadow: "0 30px 70px rgba(15,23,42,0.3)" }}>
            {/* Header */}
            <div className="border-b border-gray-100">
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-bold text-gray-900" style={{ fontSize: "15px" }}>{String(activeQuiz.title ?? activeQuiz.name ?? 'Quiz')}</p>
                  {reviewMode ? (
                    <p style={{ fontSize: "12px", color: "#16a34a" }} className="font-semibold">Review Mode</p>
                  ) : !submitted && questions.length > 0 && (
                    <p style={{ fontSize: "12px", color: "#94a3b8" }}>Question {currentQ + 1} of {questions.length}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {!submitted && procSessionKey && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${procWarningCount >= 3 ? 'bg-red-100 text-red-600' : procWarningCount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-600'}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${procWarningCount >= 3 ? 'bg-red-500' : procWarningCount > 0 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      {procWarningCount === 0 ? 'Proctored' : `${procWarningCount} Warning${procWarningCount !== 1 ? 's' : ''}`}
                    </div>
                  )}
                  <button onClick={() => setActiveQuiz(null)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Close quiz">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {quizLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: "#2563eb" }} /></div>
              ) : submitted ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#f0fdf4" }}>
                    <CheckCircle size={40} color="#16a34a" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Submitted!</h2>
                  {result && (
                    <>
                      {(result as Record<string,unknown>).needs_grading ? (
                        <div className="mt-4">
                          <p className="text-lg font-semibold text-amber-600">Waiting for instructor grade</p>
                          <p className="text-sm text-gray-500 mt-1">Your quiz has been submitted. Results will be available after grading.</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-4xl font-bold mt-4 mb-1" style={{ color: getScoreColor(Number((result as Record<string,unknown>).score_percentage ?? 0)) }}>
                            {Math.round(Number((result as Record<string,unknown>).score_percentage ?? 0))}%
                          </p>
                          <p className="text-sm text-gray-500">{getScoreLabel(Number((result as Record<string,unknown>).score_percentage ?? 0))}</p>
                        </>
                      )}
                    </>
                  )}
                  <button onClick={() => setActiveQuiz(null)} className="mt-6 px-6 py-2.5 rounded-xl text-white font-semibold" style={{ backgroundColor: "#2563eb" }}>Close</button>
                </div>
              ) : reviewMode ? (
                <div className="space-y-6">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle size={16} color="#16a34a" />
                    <span className="text-sm font-medium text-emerald-700">Showing correct answers in green</span>
                  </div>
                  {reviewQuestions.length === 0 ? (
                    <p className="text-center text-gray-400 py-12">No questions to review.</p>
                  ) : (
                    reviewQuestions.map((q, qi) => {
                      const qid = String(q.id ?? qi);
                      const qAnswers = (reviewAnswers[qid] ?? []) as AItem[];
                      const studentAnswerId = reviewResponses[qid];
                      const studentText = selected[qid];
                      const qType = getQType(q);
                      return (
                        <div key={qid} className="space-y-3">
                          <div className="bg-gray-50 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{qType.replace(/_/g, ' ')}</span>
                              <span className="text-xs text-gray-400 font-medium">Question {qi + 1}</span>
                            </div>
                            <p className="font-semibold text-gray-900" style={{ fontSize: "14px", lineHeight: "1.5" }}>
                              {String(q.question_text ?? q.text ?? q.question ?? '')}
                            </p>
                          </div>

                          {/* Choice question review */}
                          {isChoiceQ(q) && (
                            <div className="space-y-2">
                              {qAnswers.map((ans, ai) => {
                                const aid = String((ans as Record<string,unknown>).id ?? ai);
                                const text = String((ans as Record<string,unknown>).answer_text ?? (ans as Record<string,unknown>).text ?? `Option ${ai + 1}`);
                                const isCorrect = Number((ans as Record<string,unknown>).grade_fraction ?? 0) > 0;
                                const isStudentPick = studentAnswerId === aid;
                                const label = getChoiceLabel(String(q.choice_numbering ?? q.choiceNumbering ?? ''), ai);
                                return (
                                  <div
                                    key={aid}
                                    className="w-full text-left px-4 py-3 rounded-xl border flex items-center gap-2"
                                    style={{
                                      borderColor: isCorrect ? "#86efac" : isStudentPick ? "#bfdbfe" : "#e2e8f0",
                                      backgroundColor: isCorrect ? "#f0fdf4" : isStudentPick ? "#eff6ff" : "white",
                                      color: isCorrect ? "#166534" : isStudentPick ? "#1d4ed8" : "#374151",
                                      fontWeight: isCorrect ? 700 : isStudentPick ? 600 : 400,
                                      fontSize: "13px",
                                    }}
                                  >
                                    <span className="inline-flex w-5 h-5 rounded-full border-2 items-center justify-center flex-shrink-0 text-[10px]"
                                      style={{
                                        borderColor: isCorrect ? "#22c55e" : isStudentPick ? "#2563eb" : "#d1d5db",
                                        backgroundColor: isCorrect ? "#22c55e" : isStudentPick ? "#2563eb" : "transparent",
                                        color: isCorrect || isStudentPick ? "white" : "#6b7280",
                                      }}>
                                      {isCorrect ? '✓' : isStudentPick ? '●' : ''}
                                    </span>
                                    {label && (
                                      <span className="font-semibold flex-shrink-0 min-w-[1.5rem] text-right" style={{ color: isCorrect ? '#166534' : isStudentPick ? '#1d4ed8' : '#6b7280' }}>{label}</span>
                                    )}
                                    <span>{text}</span>
                                    {isCorrect && <span className="ml-auto text-[10px] font-bold text-emerald-600">Correct</span>}
                                    {isStudentPick && !isCorrect && <span className="ml-auto text-[10px] font-bold text-blue-500">Your answer</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Text / Essay review */}
                          {(isTextQ(q) || isEssayQ(q)) && (
                            <div className="space-y-2">
                              <div className="bg-white border border-gray-200 rounded-xl p-3">
                                <p className="text-xs font-medium text-gray-500 mb-1">Your answer</p>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{String(studentText ?? '(No answer provided)')}</p>
                              </div>
                              {(() => {
                                const correct = String((q as Record<string, unknown>).correct_answer ?? (q as Record<string, unknown>).correctAnswer ?? '');
                                return correct ? (
                                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                    <p className="text-xs font-medium text-emerald-600 mb-1">Correct answer</p>
                                    <p className="text-sm text-emerald-800 font-medium whitespace-pre-wrap">{correct}</p>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          )}

                          {/* Matching / drag-drop review */}
                          {isMatchQ(q) && (
                            <div className="space-y-2">
                              {((q.matching_pairs ?? q.matchingPairs ?? []) as any[]).map((pair: any, pi: number) => (
                                <div key={pi} className="flex items-center gap-2 bg-white border border-emerald-100 rounded-xl p-3">
                                  <span className="text-xs font-bold text-gray-400 w-5">{pi + 1}</span>
                                  <span className="flex-1 text-sm text-gray-700">{String(pair.question ?? pair.q ?? '')}</span>
                                  <span className="text-gray-300">→</span>
                                  <span className="flex-1 text-sm font-semibold text-emerald-700">{String(pair.answer ?? pair.a ?? pair.correct ?? '')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : questions.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No questions available for this quiz.</p>
              ) : (() => {
                const q = questions[currentQ] as Record<string, unknown>;
                const qid = String(q.id ?? currentQ);
                const qAnswers = (answers[qid] ?? []) as AItem[];
                const qType = getQType(q);
                return (
                  <div className="space-y-5">
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%`, backgroundColor: "#2563eb" }} />
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{qType.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-gray-500">{String(q.default_mark ?? q.defaultMark ?? 1)} pt{Number(q.default_mark ?? q.defaultMark ?? 1) !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="font-semibold text-gray-900" style={{ fontSize: "15px", lineHeight: "1.5" }}>
                        {String(q.question_text ?? q.text ?? q.question ?? '')}
                      </p>
                    </div>

                    {/* Choice questions: multiple_choice, true_false, calculated_multichoice */}
                    {isChoiceQ(q) && (
                      <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
                        {qAnswers.map((ans, ai) => {
                          const aid  = String((ans as Record<string,unknown>).id ?? ai);
                          const text = String((ans as Record<string,unknown>).answer_text ?? (ans as Record<string,unknown>).text ?? `Option ${ai + 1}`);
                          const isSel = selected[qid] === aid;
                          const label = getChoiceLabel(String(q.choice_numbering ?? q.choiceNumbering ?? ''), ai);
                          return (
                            <button
                              key={aid}
                              role="radio"
                              aria-checked={isSel}
                              onClick={() => setSelected(prev => ({ ...prev, [qid]: aid }))}
                              className="w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-2"
                              style={{
                                borderColor: isSel ? "#2563eb" : "#e2e8f0",
                                backgroundColor: isSel ? "#eff6ff" : "white",
                                color: isSel ? "#1d4ed8" : "#374151",
                                fontWeight: isSel ? 600 : 400,
                                fontSize: "13px",
                              }}
                            >
                              <span className="inline-flex w-5 h-5 rounded-full border-2 items-center justify-center flex-shrink-0"
                                style={{ borderColor: isSel ? "#2563eb" : "#d1d5db", backgroundColor: isSel ? "#2563eb" : "transparent" }}>
                                {isSel && <span className="w-2 h-2 rounded-full bg-white" />}
                              </span>
                              {label && (
                                <span className="font-semibold text-gray-500 flex-shrink-0 min-w-[1.5rem] text-right">{label}</span>
                              )}
                              <span>{text}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Text questions: short_answer, numerical, calculated, calculated_simple */}
                    {(isTextQ(q) || isEssayQ(q)) && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-600">Your answer</label>
                        {isEssayQ(q) ? (
                          <textarea
                            value={String(selected[qid] ?? '')}
                            onChange={(e) => setSelected(prev => ({ ...prev, [qid]: e.target.value }))}
                            placeholder="Type your answer here..."
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                          />
                        ) : (
                          <input
                            type={qType === 'numerical' ? 'number' : 'text'}
                            value={String(selected[qid] ?? '')}
                            onChange={(e) => setSelected(prev => ({ ...prev, [qid]: e.target.value }))}
                            placeholder={qType === 'numerical' ? 'Enter a number...' : 'Type your answer here...'}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}
                      </div>
                    )}

                    {/* Matching / drag-drop questions */}
                    {isMatchQ(q) && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500">Match each item with its correct pair.</p>
                        {((q.matching_pairs ?? q.matchingPairs ?? []) as any[]).map((pair: any, pi: number) => (
                          <div key={pi} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            <span className="text-xs font-bold text-gray-400 w-6">{pi + 1}</span>
                            <span className="flex-1 text-sm text-gray-700">{String(pair.question ?? pair.q ?? '')}</span>
                            <span className="text-gray-300">→</span>
                            <select
                              value={String((selected[qid] as any)?.[pi] ?? '')}
                              onChange={(e) => {
                                const current = (selected[qid] as Record<string, string> | undefined) ?? {};
                                setSelected(prev => ({ ...prev, [qid]: { ...current, [pi]: e.target.value } }));
                              }}
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                            >
                              <option value="">Select answer...</option>
                              {((q.matching_pairs ?? q.matchingPairs ?? []) as any[]).map((p2: any, pi2: number) => (
                                <option key={pi2} value={String(p2.answer ?? p2.a ?? p2.correct ?? '')}>
                                  {String(p2.answer ?? p2.a ?? p2.correct ?? '')}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer nav */}
            {!submitted && !quizLoading && !reviewMode && questions.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  disabled={currentQ === 0}
                  onClick={() => setCurrentQ(q => q - 1)}
                  className="px-4 py-2 rounded-xl border text-gray-600 disabled:opacity-40"
                  style={{ fontSize: "13px", borderColor: "#e2e8f0" }}
                >
                  Previous
                </button>
                {currentQ < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQ(q => q + 1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white"
                    style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#2563eb" }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={quizLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white disabled:opacity-60"
                    style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#16a34a" }}
                  >
                    {quizLoading ? <Loader2 size={13} className="animate-spin" /> : null} Submit Quiz
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quiz Already Submitted Error Modal */}
      {quizError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60" />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">Quiz Already Submitted</h3>
                <p className="text-sm text-slate-600 mt-1">{quizError.message}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setQuizError(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setQuizError(null);
                  handleReviewQuiz(quizError.quiz);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Eye size={14} /> Review Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
