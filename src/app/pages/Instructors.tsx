import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Users, Mail, Phone, Clock, MapPin, BookOpen, GraduationCap, Loader2, ChevronLeft, User } from "lucide-react";
import { profileApi } from "../services/api";

interface Course {
  id: string;
  title: string;
  code: string | null;
}

interface Instructor {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  profile_image_url: string | null;
  courses: Course[];
  phone_number: string | null;
  office_hours: string | null;
  office_location: string | null;
  academic_rank: string | null;
  bio: string | null;
}

export default function Instructors() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    profileApi.myInstructors()
      .then((r) => {
        const data = r.data.data ?? [];
        setInstructors(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#2563eb" }} />
        </div>
      </div>
    );
  }

  // Instructor Detail View
  if (selectedInstructor) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => setSelectedInstructor(null)}
          className="flex items-center gap-2 mb-4 px-4 py-2 rounded-lg transition-colors hover:bg-slate-100"
          style={{ color: "#475569", fontSize: "14px" }}
        >
          <ChevronLeft size={18} />
          Back to Instructors
        </button>

        {/* Profile Card */}
        <div
          className="bg-white rounded-2xl p-6 mb-4"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
        >
          <div className="flex items-start gap-5">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {selectedInstructor.profile_image_url ? (
                <img
                  src={selectedInstructor.profile_image_url}
                  alt={selectedInstructor.name}
                  className="w-24 h-24 rounded-2xl object-cover"
                  style={{ border: "2px solid #e2e8f0" }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "#eff6ff", border: "2px solid #e2e8f0" }}
                >
                  <User size={40} color="#2563eb" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1
                className="mb-1"
                style={{ fontSize: "22px", fontWeight: 700, color: "#1e293b" }}
              >
                {selectedInstructor.name}
              </h1>
              {selectedInstructor.academic_rank && (
                <p className="mb-3" style={{ fontSize: "14px", color: "#64748b" }}>
                  {selectedInstructor.academic_rank}
                </p>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 mt-4">
                {selectedInstructor.email && (
                  <div className="flex items-center gap-2" style={{ fontSize: "13px", color: "#475569" }}>
                    <Mail size={16} color="#2563eb" />
                    <a href={`mailto:${selectedInstructor.email}`} className="hover:underline" style={{ color: "#2563eb" }}>
                      {selectedInstructor.email}
                    </a>
                  </div>
                )}
                {selectedInstructor.phone_number && (
                  <div className="flex items-center gap-2" style={{ fontSize: "13px", color: "#475569" }}>
                    <Phone size={16} color="#2563eb" />
                    <span>{selectedInstructor.phone_number}</span>
                  </div>
                )}
              </div>

              {/* Office Info */}
              <div className="flex flex-wrap gap-4 mt-3">
                {selectedInstructor.office_location && (
                  <div className="flex items-center gap-2" style={{ fontSize: "13px", color: "#475569" }}>
                    <MapPin size={16} color="#64748b" />
                    <span>{selectedInstructor.office_location}</span>
                  </div>
                )}
                {selectedInstructor.office_hours && (
                  <div className="flex items-center gap-2" style={{ fontSize: "13px", color: "#475569" }}>
                    <Clock size={16} color="#64748b" />
                    <span>{selectedInstructor.office_hours}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {selectedInstructor.bio && (
            <div className="mt-5 pt-5" style={{ borderTop: "1px solid #e2e8f0" }}>
              <h3
                style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}
              >
                About
              </h3>
              <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                {selectedInstructor.bio}
              </p>
            </div>
          )}
        </div>

        {/* Courses Taught */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
        >
          <h2
            className="flex items-center gap-2 mb-4"
            style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}
          >
            <BookOpen size={20} color="#2563eb" />
            Courses Teaching
          </h2>

          {selectedInstructor.courses.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#64748b" }}>No courses assigned.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedInstructor.courses.map((course) => (
                <div
                  key={course.id}
                  className="p-4 rounded-xl transition-all hover:shadow-md cursor-pointer"
                  style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#eff6ff" }}
                    >
                      <GraduationCap size={20} color="#2563eb" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4
                        className="truncate"
                        style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}
                      >
                        {course.title}
                      </h4>
                      {course.code && (
                        <p style={{ fontSize: "12px", color: "#64748b" }}>{course.code}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Instructors List View
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b" }}>
          My Instructors
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
          Instructors assigned to your degree programme
        </p>
      </div>

      {instructors.length === 0 ? (
        <div
          className="bg-white rounded-2xl p-8 text-center"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
        >
          <Users size={48} color="#cbd5e1" className="mx-auto mb-3" />
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#64748b" }}>
            No instructors found
          </p>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
            Instructors will appear here once they are assigned to your degree programme.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instructors.map((instructor) => (
            <div
              key={instructor.id}
              onClick={() => setSelectedInstructor(instructor)}
              className="bg-white rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              <div className="flex items-start gap-4">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  {instructor.profile_image_url ? (
                    <img
                      src={instructor.profile_image_url}
                      alt={instructor.name}
                      className="w-14 h-14 rounded-xl object-cover"
                      style={{ border: "2px solid #e2e8f0" }}
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "#eff6ff", border: "2px solid #e2e8f0" }}
                    >
                      <User size={24} color="#2563eb" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="truncate"
                    style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}
                  >
                    {instructor.name}
                  </h3>
                  {instructor.academic_rank && (
                    <p style={{ fontSize: "13px", color: "#64748b" }}>{instructor.academic_rank}</p>
                  )}

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {instructor.courses.length > 0 && (
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-full"
                        style={{ backgroundColor: "#eff6ff", fontSize: "12px", color: "#2563eb" }}
                      >
                        <BookOpen size={12} />
                        {instructor.courses.length} course{instructor.courses.length !== 1 ? "s" : ""}
                      </div>
                    )}
                    {instructor.office_location && (
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-full"
                        style={{ backgroundColor: "#f8fafc", fontSize: "12px", color: "#64748b" }}
                      >
                        <MapPin size={12} />
                        <span className="truncate max-w-[120px]">{instructor.office_location}</span>
                      </div>
                    )}
                  </div>

                  {/* Email Preview */}
                  {instructor.email && (
                    <div className="flex items-center gap-2 mt-3" style={{ fontSize: "12px", color: "#64748b" }}>
                      <Mail size={12} />
                      <span className="truncate">{instructor.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
