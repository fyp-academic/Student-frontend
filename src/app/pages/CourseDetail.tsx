import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { BookOpen, GraduationCap, Clock, ChevronLeft, Loader2, Users, CheckCircle, PlayCircle } from "lucide-react";
import { coursesApi } from "../services/api";
import { useToast } from "../hooks/use-toast";
import { useAiWidgetContext } from "../context/AiWidgetContext";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setContext } = useAiWidgetContext();
  const [course, setCourse] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!id) return;
    coursesApi
      .get(id)
      .then((r) => {
        const data = r.data.data ?? r.data ?? null;
        setCourse(data);
        if (data) {
          setContext({
            currentPage: `/courses/${id}`,
            courseId:     id,
            courseName:  String(data.name ?? data.short_name ?? ''),
            mode:        'study',
          });
        }
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load course details.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [id, toast]);

  const handleEnroll = async () => {
    if (!id || !course) return;
    setEnrolling(true);
    try {
      const isEnrolled = Boolean(course.is_enrolled ?? course.enrolled);
      if (isEnrolled) {
        await coursesApi.leave(id);
        toast({ title: "Left course", description: "You have left this course." });
      } else {
        await coursesApi.selfEnroll(id);
        toast({ title: "Enrolled", description: "You have successfully enrolled in this course." });
      }
      setCourse((prev) =>
        prev ? { ...prev, is_enrolled: !isEnrolled, enrolled: !isEnrolled } : prev
      );
    } catch {
      toast({
        title: "Error",
        description: "Failed to update enrollment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "#2563eb" }} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <BookOpen size={40} className="mx-auto mb-3" style={{ color: "#cbd5e1" }} />
        <p style={{ fontSize: "15px", fontWeight: 600, color: "#64748b" }}>Course not found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 rounded-xl text-white transition-all"
          style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#2563eb" }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const title = String(course.name ?? course.title ?? "Unnamed Course");
  const code = String(course.short_name ?? course.shortName ?? course.code ?? "");
  const instructor = String(course.instructor ?? course.instructor_name ?? "");
  const description = String(course.description ?? course.summary ?? "");
  const image = String(course.image ?? course.image_url ?? "");
  const duration = String(course.duration ?? "");
  const students = Number(course.enrolled_students ?? course.students ?? 0);
  const sections: Record<string, unknown>[] = Array.isArray(course.sections)
    ? (course.sections as Record<string, unknown>[])
    : [];
  const isEnrolled = Boolean(course.is_enrolled ?? course.enrolled);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-slate-100"
        style={{ color: "#475569", fontSize: "14px" }}
      >
        <ChevronLeft size={18} />
        Back
      </button>

      {/* Course Header */}
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
      >
        <div className="relative h-48 overflow-hidden">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
            >
              <BookOpen size={48} color="rgba(255,255,255,0.6)" />
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))" }}
          />
          <div className="absolute bottom-4 left-4">
            <span
              className="text-white"
              style={{
                fontSize: "11px",
                fontWeight: 700,
                backgroundColor: "#2563eb",
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              {code || "COURSE"}
            </span>
            <h1 className="text-white mt-1" style={{ fontSize: "22px", fontWeight: 700 }}>
              {title}
            </h1>
            <p className="text-white/80" style={{ fontSize: "13px" }}>
              {instructor}
            </p>
          </div>
        </div>

        <div className="p-6">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {duration && (
              <div className="flex items-center gap-1" style={{ fontSize: "13px", color: "#64748b" }}>
                <Clock size={14} color="#2563eb" />
                <span>{duration}</span>
              </div>
            )}
            {students > 0 && (
              <div className="flex items-center gap-1" style={{ fontSize: "13px", color: "#64748b" }}>
                <Users size={14} color="#2563eb" />
                <span>{students.toLocaleString()} students</span>
              </div>
            )}
            {isEnrolled && (
              <div className="flex items-center gap-1" style={{ fontSize: "13px", color: "#16a34a" }}>
                <CheckCircle size={14} />
                <span>Enrolled</span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>{description}</p>
          )}

          {/* Enroll Button */}
          <button
            disabled={enrolling}
            onClick={handleEnroll}
            className="mt-5 w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: isEnrolled ? "#f0fdf4" : "#2563eb",
              color: isEnrolled ? "#16a34a" : "#fff",
              border: isEnrolled ? "1px solid #bbf7d0" : "none",
            }}
          >
            {enrolling ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isEnrolled ? (
              <>
                <CheckCircle size={16} />
                Enrolled
              </>
            ) : (
              <>
                <PlayCircle size={16} />
                Enroll Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sections */}
      {sections.length > 0 && (
        <div
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
        >
          <h2
            className="flex items-center gap-2 mb-4"
            style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}
          >
            <GraduationCap size={20} color="#2563eb" />
            Course Content
          </h2>
          <div className="space-y-3">
            {sections.map((section, idx) => (
              <div
                key={String(section.id ?? idx)}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#eff6ff" }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb" }}>
                    {idx + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                    {String(section.title ?? section.name ?? `Section ${idx + 1}`)}
                  </p>
                  {(section as { description?: string }).description && (
                    <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      {String((section as { description?: string }).description).slice(0, 100)}
                      {String((section as { description?: string }).description).length > 100 ? "…" : ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
