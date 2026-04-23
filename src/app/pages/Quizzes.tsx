import { useState, useEffect } from "react";
import { HelpCircle, Clock, CheckCircle, PlayCircle, Lock, Trophy, X, ChevronRight, Loader2 } from "lucide-react";
import { quizApi, dashboardApi } from "../services/api";

type Quiz    = Record<string, unknown>;
type QItem   = Record<string, unknown>;
type AItem   = Record<string, unknown>;

const COLORS = ["#2563eb","#7c3aed","#0891b2","#059669","#dc2626","#f59e0b"];

const getScoreColor = (score: number) => score >= 90 ? "#16a34a" : score >= 80 ? "#2563eb" : score >= 70 ? "#f59e0b" : "#dc2626";
const getScoreLabel = (score: number) => score >= 90 ? "Excellent" : score >= 80 ? "Good" : score >= 70 ? "Fair" : "Needs Improvement";

export function Quizzes() {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Available", "Completed", "Locked"];

  const [quizzes, setQuizzes]     = useState<Quiz[]>([]);
  const [loading, setLoading]     = useState(true);

  // Quiz runner state
  const [activeQuiz, setActiveQuiz]         = useState<Quiz | null>(null);
  const [questions, setQuestions]           = useState<QItem[]>([]);
  const [answers, setAnswers]               = useState<Record<string, unknown[]>>({});
  const [selected, setSelected]             = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ]             = useState(0);
  const [attemptId, setAttemptId]           = useState<string | null>(null);
  const [quizLoading, setQuizLoading]       = useState(false);
  const [submitted, setSubmitted]           = useState(false);
  const [result, setResult]                 = useState<Record<string, unknown> | null>(null);

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
      const attemptMap = new Map<string, Quiz>();
      for (const a of attempts as Quiz[]) {
        const aid = String(a.activity_id ?? a.id ?? '');
        if (aid) attemptMap.set(aid, a);
      }
      const merged = (available as Quiz[]).map(q => {
        const qid = String(q.activity_id ?? q.id ?? '');
        return attemptMap.has(qid) ? attemptMap.get(qid)! : q;
      });
      for (const [aid, att] of attemptMap) {
        if (!merged.some(m => String(m.activity_id ?? m.id ?? '') === aid)) {
          merged.push(att);
        }
      }
      setQuizzes(merged);
    }).finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const scored = quizzes.filter(q => q.score !== null && q.score !== undefined);
  const avgScore = scored.length
    ? Math.round(scored.reduce((s, q) => s + Number(q.score ?? q.grade ?? 0), 0) / scored.length)
    : 0;

  const filtered = activeFilter === "All"
    ? quizzes
    : quizzes.filter(q => String(q.status ?? '').toLowerCase() === activeFilter.toLowerCase());

  const handleStartQuiz = async (quiz: Quiz) => {
    const actId = String(quiz.activity_id ?? quiz.id ?? '');
    setActiveQuiz(quiz);
    setQuizLoading(true);
    setSubmitted(false);
    setResult(null);
    setSelected({});
    setCurrentQ(0);
    try {
      const [startRes, qRes] = await Promise.all([
        quizApi.start(actId),
        quizApi.questions(actId),
      ]);
      const attemptData = startRes.data.data ?? startRes.data ?? {};
      setAttemptId(String((attemptData as Record<string,unknown>).id ?? ''));
      const qs: QItem[] = qRes.data.data ?? qRes.data ?? [];
      setQuestions(qs);
      // Load answer options for each question
      const ansMap: Record<string, unknown[]> = {};
      await Promise.all(qs.map(async (q) => {
        const qid = String(q.id ?? '');
        if (!qid) return;
        const ar = await quizApi.answers(qid);
        ansMap[qid] = ar.data.data ?? ar.data ?? [];
      }));
      setAnswers(ansMap);
    } catch { /* ignore */ } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!attemptId) return;
    setQuizLoading(true);
    try {
      const r = await quizApi.submit(attemptId, { responses: selected });
      setResult(r.data.data ?? r.data ?? {});
      setSubmitted(true);
    } catch { /* ignore */ } finally {
      setQuizLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#2563eb" }} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Quizzes</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>Test your knowledge with course quizzes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available", value: quizzes.filter(q => String(q.status ?? '').toLowerCase() === "available").length, color: "#2563eb", bg: "#eff6ff", icon: HelpCircle },
          { label: "Completed", value: quizzes.filter(q => String(q.status ?? '').toLowerCase() === "completed").length, color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle },
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
            const status     = String(quiz.status ?? 'available').toLowerCase();
            const score      = quiz.score !== null && quiz.score !== undefined ? Number(quiz.score ?? quiz.grade ?? 0) : null;
            const questions  = Number(quiz.questions_count ?? quiz.questions ?? 0);
            const timeLimit  = Number(quiz.time_limit ?? quiz.timeLimit ?? 0);
            const attempts   = Number(quiz.attempts ?? quiz.attempts_count ?? 0);
            const maxAttempts = Number(quiz.max_attempts ?? quiz.maxAttempts ?? 2);
            const dueDate    = String(quiz.due_date ?? quiz.dueDate ?? '');
            const color      = COLORS[idx % COLORS.length];
            const isLocked   = status === 'locked';
            const canRetake  = status === 'completed' && attempts < maxAttempts;

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
                  <span style={{ fontSize: "11px", color: status === "available" ? "#f59e0b" : "#94a3b8", fontWeight: status === "available" ? 600 : 400 }}>
                    {status === "available" ? `⚡ Due: ${dueDate}` : isLocked ? "🔒 Complete prev. module" : `✓ Completed · ${dueDate}`}
                  </span>
                  {status === "available" && (
                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white transition-all"
                      style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "#2563eb" }}
                    >
                      <PlayCircle size={13} /> Start Quiz
                    </button>
                  )}
                  {canRetake && (
                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all hover:bg-blue-50"
                      style={{ fontSize: "12px", color: "#2563eb", borderColor: "#bfdbfe" }}
                    >
                      Retake
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
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => !quizLoading && setActiveQuiz(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh", boxShadow: "0 30px 70px rgba(15,23,42,0.3)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900" style={{ fontSize: "15px" }}>{String(activeQuiz.title ?? activeQuiz.name ?? 'Quiz')}</p>
                {!submitted && questions.length > 0 && (
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>Question {currentQ + 1} of {questions.length}</p>
                )}
              </div>
              <button onClick={() => setActiveQuiz(null)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Close quiz">
                <X size={16} />
              </button>
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
                      <p className="text-4xl font-bold mt-4 mb-1" style={{ color: getScoreColor(Number((result as Record<string,unknown>).score ?? 0)) }}>
                        {Number((result as Record<string,unknown>).score ?? 0)}%
                      </p>
                      <p className="text-sm text-gray-500">{getScoreLabel(Number((result as Record<string,unknown>).score ?? 0))}</p>
                    </>
                  )}
                  <button onClick={() => setActiveQuiz(null)} className="mt-6 px-6 py-2.5 rounded-xl text-white font-semibold" style={{ backgroundColor: "#2563eb" }}>Close</button>
                </div>
              ) : questions.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No questions available for this quiz.</p>
              ) : (() => {
                const q = questions[currentQ] as Record<string, unknown>;
                const qid = String(q.id ?? currentQ);
                const qAnswers = (answers[qid] ?? []) as AItem[];
                return (
                  <div className="space-y-5">
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%`, backgroundColor: "#2563eb" }} />
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-5">
                      <p className="font-semibold text-gray-900" style={{ fontSize: "15px", lineHeight: "1.5" }}>
                        {String(q.question_text ?? q.text ?? q.question ?? '')}
                      </p>
                    </div>

                    <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
                      {qAnswers.map((ans, ai) => {
                        const aid  = String((ans as Record<string,unknown>).id ?? ai);
                        const text = String((ans as Record<string,unknown>).answer_text ?? (ans as Record<string,unknown>).text ?? `Option ${ai + 1}`);
                        const isSel = selected[qid] === aid;
                        return (
                          <button
                            key={aid}
                            role="radio"
                            aria-checked={isSel}
                            onClick={() => setSelected(prev => ({ ...prev, [qid]: aid }))}
                            className="w-full text-left px-4 py-3 rounded-xl border transition-all"
                            style={{
                              borderColor: isSel ? "#2563eb" : "#e2e8f0",
                              backgroundColor: isSel ? "#eff6ff" : "white",
                              color: isSel ? "#1d4ed8" : "#374151",
                              fontWeight: isSel ? 600 : 400,
                              fontSize: "13px",
                            }}
                          >
                            <span className="inline-flex w-5 h-5 rounded-full border-2 mr-3 items-center justify-center flex-shrink-0 align-middle"
                              style={{ borderColor: isSel ? "#2563eb" : "#d1d5db", backgroundColor: isSel ? "#2563eb" : "transparent" }}>
                              {isSel && <span className="w-2 h-2 rounded-full bg-white" />}
                            </span>
                            {text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer nav */}
            {!submitted && !quizLoading && questions.length > 0 && (
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
    </div>
  );
}
