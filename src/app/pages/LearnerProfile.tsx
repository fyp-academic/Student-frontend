import { useState } from "react";
import { User, Mail, Phone, MapPin, BookOpen, Award, Star, Edit3, Camera, GraduationCap, Calendar, Globe, Github, Linkedin, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

const skillData = [
  { subject: "React", value: 85 },
  { subject: "Laravel", value: 78 },
  { subject: "Mobile app", value: 62 },
  { subject: "Sql", value: 80 },
  { subject: "Web Dev", value: 90 },
  { subject: "Networking", value: 76 },
  { subject: "Design", value: 76 },
];

const achievements = [
  { id: 1, icon: "🔥", title: "14-Day Streak", desc: "Studied 14 days in a row", date: "Feb 24, 2026", color: "#f59e0b" },
  { id: 2, icon: "🏆", title: "Top Performer", desc: "Ranked top 10% in CS301", date: "Feb 10, 2026", color: "#2563eb" },
  { id: 3, icon: "⚡", title: "Quick Learner", desc: "Completed 5 lessons in one day", date: "Jan 28, 2026", color: "#7c3aed" },
  { id: 4, icon: "💯", title: "Perfect Score", desc: "100% on Python Fundamentals drill", date: "Jan 20, 2026", color: "#059669" },
  { id: 5, icon: "🎯", title: "Assignment Pro", desc: "10 assignments submitted on time", date: "Jan 15, 2026", color: "#0891b2" },
  { id: 6, icon: "📚", title: "Bookworm", desc: "Read 50+ learning materials", date: "Dec 12, 2025", color: "#dc2626" },
];

const enrolledCourses = [
  { code: "CS301", name: "Data Science Fundamentals", progress: 72, grade: "A-", color: "#2563eb" },
  { code: "MATH402", name: "Advanced Calculus", progress: 45, grade: "B+", color: "#7c3aed" },
  { code: "BIO301", name: "Molecular Biology", progress: 88, grade: "A", color: "#059669" },
  { code: "CS450", name: "AI & Machine Learning", progress: 23, grade: "B", color: "#0891b2" },
  { code: "CS201", name: "Web Development", progress: 100, grade: "A+", color: "#22c55e" },
];

export function LearnerProfile() {
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = ["overview", "courses", "achievements", "skills", "learning style"];
  const [selectedModes, setSelectedModes] = useState<string[]>(["video", "multimedia"]);
  const [pacePreference, setPacePreference] = useState("guided");
  const [supportNotes, setSupportNotes] = useState("Blend short videos with interactive case studies.");

  const learningModes = [
    { id: "video", label: "Video", detail: "Narrated walkthroughs & demos" },
    { id: "pdf", label: "PDF", detail: "Structured reading & summaries" },
    { id: "audio", label: "Audio", detail: "Podcasts & narrated notes" },
    { id: "multimedia", label: "Multimedia", detail: "Interactive labs & simulations" },
    { id: "live", label: "Live Sessions", detail: "Instructor-led or study groups" },
    { id: "classroom", label: "Class Session (lecture)", detail: "Face to Face Session (traditional class)" },
  ];

  const toggleMode = (modeId: string) => {
    setSelectedModes((prev) =>
      prev.includes(modeId) ? prev.filter((m) => m !== modeId) : [...prev, modeId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
      >
        {/* Cover */}
        <div
          className="h-32 relative"
          style={{ background: "linear-gradient(135deg, #0c1e4a 0%, #1e3a8a 50%, #2563eb 100%)" }}
        >
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        </div>

        {/* Profile Info */}
        <div className="bg-white px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-12 mb-4 gap-4">
            <div className="relative w-fit">
              <img
                src="https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=200&h=200&fit=crop&crop=face"
                alt="hamis kalira"
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white"
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
              />
              <button
                className="absolute bottom-1 right-1 w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center"
                style={{ boxShadow: "0 2px 6px rgba(37,99,235,0.4)" }}
              >
                <Camera size={13} />
              </button>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:bg-slate-50 self-start sm:self-auto"
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569", borderColor: "#e2e8f0" }}
            >
              <Edit3 size={14} />
              {editing ? "Save Profile" : "Edit Profile"}
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Hamis Kalira</h1>
              <p style={{ fontSize: "14px", color: "#2563eb", fontWeight: 500 }}>Instructional Design and Information Technology (IDIT)</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-slate-500" style={{ fontSize: "12px" }}>
                <div className="flex items-center gap-1"><GraduationCap size={13} />Year 3 · Semester 1</div>
                <div className="flex items-center gap-1"><BookOpen size={13} />Registration No: T23-03-09759</div>
                <div className="flex items-center gap-1"><MapPin size={13} />University of Dodoma, Cive</div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2" style={{ fontSize: "12px" }}>
                <div className="flex items-center gap-1 text-slate-500"><Mail size={12} />hamiskalira@gmail.com</div>
                <div className="flex items-center gap-1 text-slate-500"><Phone size={12} />+255 686 300 235</div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors"><Github size={16} /></a>
                <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors"><Linkedin size={16} /></a>
                <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors"><Globe size={16} /></a>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Courses", value: "7", icon: BookOpen, color: "#2563eb" },
                { label: "Badges", value: "24", icon: Award, color: "#7c3aed" },
              ].map((s) => (
                <div key={s.label} className="text-center p-3 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
                  <s.icon size={16} color={s.color} className="mx-auto mb-1" />
                  <p style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>{s.value}</p>
                  <p style={{ fontSize: "10px", color: "#94a3b8" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bio */}
          {!editing ? (
            <p className="mt-4 p-3 rounded-xl" style={{ fontSize: "13px", color: "#475569", backgroundColor: "#f8fafc", lineHeight: "1.6" }}>
              Passionate Instructional Designer student specializing in multimedia contents. I love creating vitual appear and exploring interactive learning. Currently working on FYP project.
            </p>
          ) : (
            <textarea
              className="mt-4 w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              style={{ fontSize: "13px", color: "#475569", borderColor: "#e2e8f0", lineHeight: "1.6", resize: "none" }}
              rows={3}
              defaultValue="Passionate Computer Science student specializing in Data Science and AI. I love building data-driven applications and exploring machine learning. Currently working on research in NLP."
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-xl border transition-all capitalize"
            style={{
              fontSize: "12px",
              fontWeight: activeTab === tab ? 600 : 400,
              backgroundColor: activeTab === tab ? "#2563eb" : "white",
              color: activeTab === tab ? "white" : "#475569",
              borderColor: activeTab === tab ? "#2563eb" : "#e2e8f0",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Academic Info */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Academic Information</h3>
            <div className="space-y-3">
              {[
                { label: "Program", value: "B.Sc. Instructional Design and Information Technology (IDIT)" },
                { label: "Faculty", value: "Faculty of Instructional Design" },
                { label: "Year/Semester", value: "Year 3, Semester 1" },
                { label: "Enrollment Date", value: "January 2025" },
                { label: "Expected Graduation", value: "July 2026" },
                { label: "Academic Advisor", value: "Sir. Iroko" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#f1f5f9" }}>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>{item.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Radar */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>Skill Overview</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={skillData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
                <Radar dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} strokeWidth={2} dot={{ fill: "#2563eb", r: 3 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "learning style" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Learning Style Preferences</p>
                <p style={{ fontSize: "11px", color: "#94a3b8" }}>Shared with AI companion + instructors</p>
              </div>
              <span className="px-3 py-1 rounded-full text-white" style={{ fontSize: "11px", backgroundColor: "#2563eb" }}>
                Adaptive Focus
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {learningModes.map((mode) => {
                const active = selectedModes.includes(mode.id);
                return (
                  <button
                    type="button"
                    key={mode.id}
                    onClick={() => toggleMode(mode.id)}
                    className="text-left p-3 rounded-2xl border transition-all"
                    style={{
                      borderColor: active ? "#2563eb" : "#e2e8f0",
                      backgroundColor: active ? "#eff6ff" : "white",
                      color: active ? "#1d4ed8" : "#475569",
                    }}
                  >
                    <p style={{ fontSize: "13px", fontWeight: 600 }}>{mode.label}</p>
                    <p style={{ fontSize: "11px", color: active ? "#1d4ed8" : "#94a3b8" }}>{mode.detail}</p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>Preferred pace</p>
              <div className="grid grid-cols-3 gap-2">
                {["self-directed", "guided", "accelerated"].map((pace) => (
                  <button
                    key={pace}
                    type="button"
                    onClick={() => setPacePreference(pace)}
                    className="py-2 rounded-xl border capitalize"
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor: pacePreference === pace ? "#2563eb" : "#f8fafc",
                      color: pacePreference === pace ? "white" : "#475569",
                      borderColor: pacePreference === pace ? "#2563eb" : "#e2e8f0",
                    }}
                  >
                    {pace}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>Context for support</p>
              <textarea
                value={supportNotes}
                onChange={(e) => setSupportNotes(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                style={{ fontSize: "12px", color: "#475569", borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
                placeholder="Share what helps you most when concepts feel tough..."
              />
            </div>

            <button
              type="button"
              className="w-full py-2.5 rounded-xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
            >
              Save preference snapshot
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>How this powers interventions</p>
            <div className="space-y-3" style={{ fontSize: "12px", color: "#475569" }}>
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
                <p style={{ fontWeight: 700, color: "#1d4ed8" }}>Adaptive content routing</p>
                <p>AI companion surfaces the best-fit format first and nudges instructors when a switch may reduce dropout risk.</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
                <p style={{ fontWeight: 700, color: "#0f172a" }}>At-risk monitoring</p>
                <p>When performance dips, the system compares your selected styles with actual usage to recommend tailored recovery paths.</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
                <p style={{ fontWeight: 700, color: "#0f172a" }}>Instructor visibility</p>
                <p>Faculty dashboards highlight which cohorts need video recaps vs. printable briefs during critical weeks.</p>
              </div>
            </div>
            <div className="rounded-2xl border p-3" style={{ borderColor: "#e2e8f0" }}>
              <p style={{ fontSize: "11px", color: "#475569" }}>
                Tip: Update these preferences anytime—changes sync instantly with the AI study planner and outreach workflows.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "courses" && (
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Enrolled Courses</h3>
          {enrolledCourses.map((course) => (
            <div key={course.code} className="flex items-center gap-4">
              <span className="w-14 text-center px-1 py-1 rounded-lg text-white flex-shrink-0" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: course.color }}>
                {course.code}
              </span>
              <div className="flex-1">
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{course.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                    <div className="h-full rounded-full" style={{ width: `${course.progress}%`, backgroundColor: course.color }} />
                  </div>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>{course.progress}%</span>
                </div>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 700, color: course.progress === 100 ? "#22c55e" : "#2563eb" }}>
                {course.grade}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="bg-white rounded-2xl p-4 flex items-start gap-3 transition-all hover:-translate-y-0.5"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${ach.color}12` }}
              >
                {ach.icon}
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{ach.title}</p>
                <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{ach.desc}</p>
                <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>{ach.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "skills" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Technical Skills</h3>
            {[
              { skill: "Python Programming", level: 85, color: "#2563eb" },
              { skill: "Data Analysis", level: 80, color: "#0891b2" },
              { skill: "Machine Learning", level: 62, color: "#7c3aed" },
              { skill: "Web Development", level: 90, color: "#22c55e" },
              { skill: "SQL / Databases", level: 70, color: "#f59e0b" },
              { skill: "Mathematics", level: 78, color: "#dc2626" },
            ].map((s) => (
              <div key={s.skill} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: "12px", color: "#475569" }}>{s.skill}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: s.color }}>{s.level}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${s.level}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Certifications & Extra</h3>
            {[
              { title: "Python for Data Science", issuer: "Coursera", date: "Jan 2026", status: "verified" },
              { title: "Machine Learning Basics", issuer: "edX", date: "Nov 2025", status: "verified" },
              { title: "SQL Fundamentals", issuer: "DataCamp", date: "Sep 2025", status: "verified" },
              { title: "Deep Learning Specialization", issuer: "Coursera", date: "In Progress", status: "pending" },
            ].map((cert) => (
              <div key={cert.title} className="flex items-start gap-3 py-3 border-b last:border-0" style={{ borderColor: "#f1f5f9" }}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cert.status === "verified" ? "#f0fdf4" : "#fffbeb" }}
                >
                  {cert.status === "verified" ? (
                    <CheckCircle size={15} color="#16a34a" />
                  ) : (
                    <Clock size={15} color="#f59e0b" />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>{cert.title}</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8" }}>{cert.issuer} · {cert.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
