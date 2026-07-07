import { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, MapPin, BookOpen, Award, Star, Edit3, Camera, GraduationCap, Calendar, Globe, Github, Linkedin, TrendingUp, CheckCircle, Clock, Loader2 } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { useAuth } from "../context/AuthContext";
import { profileApi, coursesApi } from "../services/api";
import { NotificationPreferences } from "../components/NotificationPreferences";
import { AdaptiveLearningWidget } from "../components/student/AdaptiveLearningWidget";

const COURSE_COLORS = ["#b5613d", "#8c4a2f", "#059669", "#0891b2", "#22c55e", "#f59e0b"];

export function LearnerProfile() {
  const { user } = useAuth();
  const u = user as Record<string, unknown> | null;
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = ["overview", "courses", "achievements", "skills", "learning style"];
  const [selectedModes, setSelectedModes] = useState<string[]>(["video", "multimedia"]);
  const [pacePreference, setPacePreference] = useState("guided");
  const [supportNotes, setSupportNotes] = useState("");
  const [varkStyle, setVarkStyle] = useState("");
  const [declaredInterests, setDeclaredInterests] = useState<string[]>([]);
  const [styleSaving, setStyleSaving] = useState(false);
  const [styleSaved, setStyleSaved] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Record<string, unknown>[]>([]);
  const [skillData, setSkillData] = useState<{ subject: string; value: number }[]>([]);
  const [achievements, setAchievements] = useState<Record<string, unknown>[]>([]);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = () => {
    profileApi.get().then(r => {
      const p: Record<string, unknown> = r.data.data ?? r.data;
      setProfile(p);
      setBio(String(p.bio ?? ''));
      if (p.preferred_modes)    setSelectedModes(p.preferred_modes as string[]);
      if (p.pace_preference)    setPacePreference(String(p.pace_preference));
      if (p.support_notes)      setSupportNotes(String(p.support_notes));
      if (p.vark_style)         setVarkStyle(String(p.vark_style));
      if (p.declared_interests) setDeclaredInterests(p.declared_interests as string[]);
      if (p.skills)           setSkillData(p.skills as { subject: string; value: number }[]);
      if (p.achievements)     setAchievements(p.achievements as Record<string, unknown>[]);
    }).catch(() => {});
  };

  useEffect(() => {
    loadProfile();
    coursesApi.myCourses().then(r => {
      setEnrolledCourses(r.data.data ?? r.data ?? []);
    }).catch(() => {});
  }, []);

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

  const handleSaveProfile = async () => {
    if (!editing) {
      setEditing(true);
      return;
    }
    setSaving(true);
    try {
      await profileApi.update({ bio });
      await loadProfile();
      setEditing(false);
    } catch (e) {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      await profileApi.uploadImage(formData);
      await loadProfile();
    } catch (e) {
      // Error handled silently
    } finally {
      setUploadingImage(false);
    }
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
          style={{ background: "linear-gradient(135deg, #8c4a2f 0%, #8c4a2f 50%, #b5613d 100%)" }}
        >
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        </div>

        {/* Profile Info */}
        <div className="bg-white px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-12 mb-4 gap-4">
            <div className="relative w-fit">
              <img
                src={String(profile?.profile_image_url ?? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(String(u?.name ?? profile?.name ?? 'Student')) + '&background=2563eb&color=fff&size=200')}
                alt={String(u?.name ?? profile?.name ?? 'Student')}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white"
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
              />
              {editing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-1 right-1 w-7 h-7 rounded-lg bg-clay text-white flex items-center justify-center disabled:opacity-50"
                    style={{ boxShadow: "0 2px 6px rgba(181,97,61,0.4)" }}
                  >
                    {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:bg-slate-50 self-start sm:self-auto disabled:opacity-50"
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569", borderColor: "#e2e8f0" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />}
              {editing ? "Save Profile" : "Edit Profile"}
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>{String(u?.name ?? profile?.name ?? 'Student')}</h1>
              <p style={{ fontSize: "14px", color: "#b5613d", fontWeight: 500 }}>{String(profile?.department ?? u?.department ?? '')}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-slate-500" style={{ fontSize: "12px" }}>
                {Boolean(profile?.year_level) && <div className="flex items-center gap-1"><GraduationCap size={13} />{String(profile?.year_level)}</div>}
                {Boolean(profile?.institution) && <div className="flex items-center gap-1"><MapPin size={13} />{String(profile?.institution)}</div>}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2" style={{ fontSize: "12px" }}>
                <div className="flex items-center gap-1 text-slate-500"><Mail size={12} />{String(u?.email ?? profile?.email ?? '')}</div>
                {Boolean(profile?.registration_no) && (
                  <div className="flex items-center gap-1 text-slate-500"><BookOpen size={12} />Reg No: {String(profile?.registration_no)}</div>
                )}
                {profile?.phone ? <div className="flex items-center gap-1 text-slate-500"><Phone size={12} />{String(profile.phone)}</div> : null}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <a href="#" className="text-slate-400 hover:text-clay-deep transition-colors"><Github size={16} /></a>
                <a href="#" className="text-slate-400 hover:text-clay-deep transition-colors"><Linkedin size={16} /></a>
                <a href="#" className="text-slate-400 hover:text-clay-deep transition-colors"><Globe size={16} /></a>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Courses",  value: String(enrolledCourses.length || 0), icon: BookOpen, color: "#b5613d" },
                { label: "Badges",   value: String(achievements.length || 0),   icon: Award,    color: "#8c4a2f" },
              ].map((s) => (
                <div key={s.label} className="text-center p-3 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
                  <s.icon size={16} color={s.color} className="mx-auto mb-1" />
                  <p style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>{s.value}</p>
                  <p style={{ fontSize: "10px", color: "#94a3b8" }}>{s.label}</p>
                </div>
              ))} 
            </div>
          </div>

          {/* Bio - Only editable field along with profile image */}
          {!editing ? (
            <p className="mt-4 p-3 rounded-xl" style={{ fontSize: "13px", color: "#475569", backgroundColor: "#f8fafc", lineHeight: "1.6" }}>
              {String(profile?.bio ?? u?.bio ?? '') || <span className="italic text-gray-400">No bio yet. Click Edit Profile to add one.</span>}
            </p>
          ) : (
            <textarea
              className="mt-4 w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-clay/30 transition-all"
              style={{ fontSize: "13px", color: "#475569", borderColor: "#e2e8f0", lineHeight: "1.6", resize: "none" }}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
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
              backgroundColor: activeTab === tab ? "#b5613d" : "white",
              color: activeTab === tab ? "white" : "#475569",
              borderColor: activeTab === tab ? "#b5613d" : "#e2e8f0",
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
                { label: "College",           value: String(profile?.college_code    ?? u?.college_code    ?? '—') },
                { label: "Program",           value: String(profile?.program_code    ?? u?.program_code    ?? '—') },
                { label: "Registration No.",  value: String(profile?.registration_no ?? u?.registration_no ?? '—') },
                { label: "Nationality",       value: String(profile?.nationality     ?? u?.nationality     ?? '—') },
                { label: "Phone Number",      value: String(profile?.phone           ?? u?.phone           ?? '—') },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#f1f5f9" }}>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>{item.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="md:col-span-2">
            <NotificationPreferences />
          </div>

          {/* Skill Radar */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>Skill Overview</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={skillData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
                <Radar dataKey="value" stroke="#b5613d" fill="#b5613d" fillOpacity={0.15} strokeWidth={2} dot={{ fill: "#b5613d", r: 3 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      {activeTab === "learning style" && (
        <div className="space-y-5">
          <AdaptiveLearningWidget />
          {(() => {
            const varkOptions = [
          { id: "visual",      label: "Visual",           icon: "👁️",  desc: "Charts, diagrams, mind maps, videos" },
          { id: "auditory",    label: "Auditory",         icon: "🎧",  desc: "Lectures, podcasts, verbal explanations" },
          { id: "reading",     label: "Reading / Writing", icon: "📖",  desc: "Notes, PDFs, written summaries" },
          { id: "kinesthetic", label: "Kinesthetic",      icon: "🛠️",  desc: "Labs, simulations, hands-on practice" },
        ];
        const interestOptions = [
          "Algorithms", "Data Structures", "Databases", "Networking", "Machine Learning",
          "Web Development", "Operating Systems", "Software Engineering", "Cybersecurity",
          "Mobile Development", "Cloud Computing", "Mathematics",
        ];
        const toggleInterest = (item: string) =>
          setDeclaredInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

        const handleSaveStyle = async () => {
          setStyleSaving(true);
          setStyleSaved(false);
          try {
            await profileApi.updateLearningStyle({
              vark_style:          varkStyle || null,
              preferred_modes:     selectedModes,
              pace_preference:     pacePreference,
              declared_interests:  declaredInterests,
              support_notes:       supportNotes,
            });
            setStyleSaved(true);
            setTimeout(() => setStyleSaved(false), 3000);
          } catch { /* silent */ } finally { setStyleSaving(false); }
        };

        return (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl p-5 space-y-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Learning Style Declaration</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8" }}>Used by AI advisor to personalise your nudges and resources</p>
                </div>
                {styleSaved && (
                  <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                    <CheckCircle size={13} /> Saved
                  </span>
                )}
              </div>

              {/* VARK style */}
              <div>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
                  Primary learning style <span style={{ color: "#94a3b8", fontWeight: 400 }}>(VARK model — pick one)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {varkOptions.map(v => (
                    <button key={v.id} type="button" onClick={() => setVarkStyle(varkStyle === v.id ? "" : v.id)}
                      className="text-left p-3 rounded-xl border transition-all"
                      style={{
                        borderColor: varkStyle === v.id ? "#b5613d" : "#e2e8f0",
                        backgroundColor: varkStyle === v.id ? "#f3ece6" : "#f8fafc",
                      }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: varkStyle === v.id ? "#a1542f" : "#1e293b" }}>
                        {v.icon} {v.label}
                      </p>
                      <p style={{ fontSize: "11px", color: varkStyle === v.id ? "#c07049" : "#94a3b8" }}>{v.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content modes */}
              <div>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
                  Preferred content formats <span style={{ color: "#94a3b8", fontWeight: 400 }}>(select all that apply)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {learningModes.map(mode => {
                    const active = selectedModes.includes(mode.id);
                    return (
                      <button type="button" key={mode.id} onClick={() => toggleMode(mode.id)}
                        className="text-left p-2.5 rounded-xl border transition-all"
                        style={{
                          borderColor: active ? "#b5613d" : "#e2e8f0",
                          backgroundColor: active ? "#f3ece6" : "white",
                        }}>
                        <p style={{ fontSize: "12px", fontWeight: 600, color: active ? "#a1542f" : "#475569" }}>{mode.label}</p>
                        <p style={{ fontSize: "10px", color: active ? "#c07049" : "#94a3b8" }}>{mode.detail}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pace */}
              <div>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>Preferred learning pace</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "self-directed", label: "Self-directed", desc: "Learn at your own speed" },
                    { id: "guided",        label: "Guided",        desc: "Follow course schedule" },
                    { id: "accelerated",   label: "Accelerated",   desc: "Push beyond the pace" },
                  ].map(p => (
                    <button key={p.id} type="button" onClick={() => setPacePreference(p.id)}
                      className="py-2 px-1 rounded-xl border text-center transition-all"
                      style={{
                        fontSize: "11px", fontWeight: 600,
                        backgroundColor: pacePreference === p.id ? "#b5613d" : "#f8fafc",
                        color: pacePreference === p.id ? "white" : "#475569",
                        borderColor: pacePreference === p.id ? "#b5613d" : "#e2e8f0",
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Declared interests */}
              <div>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
                  Declared subject interests <span style={{ color: "#94a3b8", fontWeight: 400 }}>(helps AI recommend relevant resources)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map(item => {
                    const active = declaredInterests.includes(item);
                    return (
                      <button key={item} type="button" onClick={() => toggleInterest(item)}
                        className="px-3 py-1 rounded-full border text-xs font-medium transition-all"
                        style={{
                          borderColor: active ? "#8c4a2f" : "#e2e8f0",
                          backgroundColor: active ? "#f4ece7" : "white",
                          color: active ? "#8c4a2f" : "#64748b",
                        }}>
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Support notes */}
              <div>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                  Note for AI advisor <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
                </p>
                <textarea value={supportNotes} onChange={e => setSupportNotes(e.target.value)} rows={3}
                  className="w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-clay/20"
                  style={{ fontSize: "12px", color: "#475569", borderColor: "#e2e8f0", backgroundColor: "#f8fafc", resize: "none" }}
                  placeholder="e.g. I struggle with abstract concepts — worked examples help me most." />
              </div>

              <button type="button" onClick={handleSaveStyle} disabled={styleSaving}
                className="w-full py-2.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #a1542f, #b5613d)" }}>
                {styleSaving ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                {styleSaving ? "Saving…" : "Save learning profile"}
              </button>
            </div>
          </div>
        );
      })()}
        </div>
      )}

      {activeTab === "courses" && (
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Enrolled Courses</h3>
          {enrolledCourses.length === 0 && (
            <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "16px 0" }}>No courses yet</p>
          )}
          {enrolledCourses.map((course, idx) => {
            const color    = COURSE_COLORS[idx % COURSE_COLORS.length];
            const progress = Number(course.completion_rate ?? 0);
            return (
              <div key={String(course.id ?? idx)} className="flex items-center gap-4">
                <span className="w-14 text-center px-1 py-1 rounded-lg text-white flex-shrink-0" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: color }}>
                  {String(course.short_name ?? course.shortName ?? '').slice(0, 6) || 'COURSE'}
                </span>
                <div className="flex-1">
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{String(course.name ?? '')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
                    </div>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{progress}%</span>
                  </div>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 700, color: progress >= 100 ? "#22c55e" : "#b5613d" }}>
                  {String(course.current_grade ?? '—')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.length === 0 && (
            <div className="col-span-3 bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <Award size={36} className="mx-auto mb-3 text-slate-200" />
              <p style={{ fontSize: "14px", color: "#94a3b8" }}>No achievements yet — keep learning!</p>
            </div>
          )}
          {achievements.map((ach, idx) => (
            <div
              key={String((ach as Record<string,unknown>).id ?? idx)}
              className="bg-white rounded-2xl p-4 flex items-start gap-3 transition-all hover:-translate-y-0.5"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${(ach as Record<string,unknown>).color ?? '#b5613d'}12` }}
              >
                {String((ach as Record<string,unknown>).icon ?? '🏆')}
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{String((ach as Record<string,unknown>).title ?? '')}</p>
                <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{String((ach as Record<string,unknown>).description ?? (ach as Record<string,unknown>).desc ?? '')}</p>
                <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>{String((ach as Record<string,unknown>).earned_at ?? (ach as Record<string,unknown>).date ?? '')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "skills" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Technical Skills</h3>
            {skillData.length === 0 && (
              <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>No skills data yet</p>
            )}
            {skillData.map((s, idx) => {
              const skillColors = ["#b5613d","#0891b2","#8c4a2f","#22c55e","#f59e0b","#dc2626"];
              const color = skillColors[idx % skillColors.length];
              return (
                <div key={s.subject} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: "12px", color: "#475569" }}>{s.subject}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color }}>{s.value}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.value}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
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
