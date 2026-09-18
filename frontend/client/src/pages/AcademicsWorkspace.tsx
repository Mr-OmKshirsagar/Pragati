import { useState, useMemo } from "react";
import PragatiFrame from "@/components/PragatiFrame";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Megaphone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function AcademicsWorkspace() {
  const { role } = useAuth();
  const isFaculty = role === "FACULTY" || role === "HOD";

  return (
    <PragatiFrame title="Academics & Attendance" activePath="/academics">
      <main className="dashboard-grid min-h-[calc(100vh-70px)] px-4 pb-12 pt-7 sm:px-7 xl:px-10">
        <div className="mx-auto max-w-[1320px]">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-[#71809a]">
              <span>{isFaculty ? "Faculty Desk" : "Learner Workspace"}</span>
              <span className="text-[#d0d8e6]">/</span>
              <span className="text-primary font-bold">Academics & Attendance</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-start gap-4 sm:items-end">
              <div>
                <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#182643] sm:text-[34px]">
                  {isFaculty ? "Subject Instruction & Attendance" : "Course Roster & Attendance"}
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-[#6c7890] leading-relaxed">
                  {isFaculty
                    ? "Manage assigned academic subjects, record daily attendance, publish assignments, and dispatch class announcements."
                    : "Track your enrolled academic subjects, attendance rates, continuous assignments, and departmental circulars."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/90 px-4 py-2.5 text-xs font-bold text-blue-800 shadow-2xs">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  Institutional Academic Ledger
                </span>
              </div>
            </div>
          </div>

          {isFaculty ? <FacultyAcademicsView /> : <StudentAcademicsView />}
        </div>
      </main>
    </PragatiFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Faculty Instruction & Attendance Console
// ═══════════════════════════════════════════════════════════════════════════

function FacultyAcademicsView() {
  const subjectsQuery = trpc.subject.getMySubjects.useQuery({});
  const rawSubjects = (subjectsQuery.data as any[]) ?? [];
  const subjects = useMemo(() => {
    return rawSubjects.map((item: any) => ({
      id: item.subject?.id || item.id,
      name: item.subject?.name || item.name,
      code: item.subject?.code || item.code,
      credits: item.subject?.credits || item.credits,
      semester: item.assignment?.semester || item.subject?.semester || item.semester || 6,
      academicYear: item.assignment?.academicYear || item.academicYear || "2024-2025",
      role: item.assignment?.role || "PRIMARY",
    }));
  }, [rawSubjects]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const activeId = activeSubject?.id || "";

  const studentsQuery = trpc.subject.getSubjectStudents.useQuery(
    {
      subjectId: activeId,
      semester: activeSubject?.semester || 6,
      academicYear: activeSubject?.academicYear || "2024-2025",
    },
    { enabled: Boolean(activeId) }
  );

  const announcementsQuery = trpc.subject.getAnnouncements.useQuery(
    { subjectId: activeId },
    { enabled: Boolean(activeId) }
  );

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementPriority, setAnnouncementPriority] = useState<"LOW" | "NORMAL" | "HIGH">("NORMAL");

  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const utils = trpc.useUtils();
  const recordAttendanceMutation = trpc.subject.recordAttendance.useMutation({
    onSuccess: () => {
      toast.success("Attendance marked successfully");
      utils.subject.getSubjectStudents.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to record attendance");
    },
  });

  const postAnnouncementMutation = trpc.subject.postAnnouncement.useMutation({
    onSuccess: () => {
      toast.success("Announcement broadcast to class!");
      setShowAnnouncementModal(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      utils.subject.getAnnouncements.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to post announcement");
    },
  });

  const enrolledStudents = studentsQuery.data ?? [];
  const announcements = announcementsQuery.data ?? [];

  return (
    <div className="space-y-6">
      {/* Subject Selector Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1">Your Subjects:</span>
          {subjects.map((sub) => {
            const isSelected = sub.id === (activeSubject?.id ?? "");
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  isSelected
                    ? "bg-primary text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {sub.name} ({sub.code})
              </button>
            );
          })}
          {subjects.length === 0 && (
            <span className="text-xs text-slate-400 italic">No assigned subjects found.</span>
          )}
        </div>

        <button
          onClick={() => setShowAnnouncementModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-95 transition"
        >
          <Megaphone className="h-3.5 w-3.5" /> Post Announcement
        </button>
      </div>

      {/* Main Grid: Enrolled Students & Attendance */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left Column: Student Roster & Attendance Marking */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {activeSubject?.name || "Subject Roster"} · Student Attendance
              </h3>
              <p className="text-xs text-slate-500">
                Semester {activeSubject?.semester || 6} · {enrolledStudents.length} Students Enrolled
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Date:</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {enrolledStudents.map((student: any) => (
              <div
                key={student.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{student.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {student.enrollmentNumber} · {student.email}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      recordAttendanceMutation.mutate({
                        studentId: student.id,
                        subjectId: activeId,
                        date: new Date(attendanceDate),
                        status: "PRESENT",
                      })
                    }
                    className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition text-[11px]"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Present
                  </button>
                  <button
                    onClick={() =>
                      recordAttendanceMutation.mutate({
                        studentId: student.id,
                        subjectId: activeId,
                        date: new Date(attendanceDate),
                        status: "ABSENT",
                      })
                    }
                    className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition text-[11px]"
                  >
                    <XCircle className="h-3 w-3" /> Absent
                  </button>
                  <button
                    onClick={() =>
                      recordAttendanceMutation.mutate({
                        studentId: student.id,
                        subjectId: activeId,
                        date: new Date(attendanceDate),
                        status: "LATE",
                      })
                    }
                    className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 font-bold text-amber-700 border border-amber-200 hover:bg-amber-100 transition text-[11px]"
                  >
                    <Clock className="h-3 w-3" /> Late
                  </button>
                </div>
              </div>
            ))}

            {enrolledStudents.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No students enrolled in this subject yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Subject Announcements & Assignments */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                Class Announcements
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {announcements.length} Live
              </span>
            </div>

            <div className="space-y-3">
              {announcements.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{item.title}</span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                        item.priority === "HIGH"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">{item.content}</p>
                </div>
              ))}

              {announcements.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  No active announcements for this subject.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Post Announcement</h3>
            <p className="text-xs text-slate-500">
              Broadcast circular to all students enrolled in {activeSubject?.name}.
            </p>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Title *
              </label>
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Midterm Practical Exam Timings"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={announcementPriority}
                onChange={(e) => setAnnouncementPriority(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-primary"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High Priority</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Content *
              </label>
              <textarea
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="Type circular details..."
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  postAnnouncementMutation.mutate({
                    subjectId: activeId,
                    title: announcementTitle,
                    content: announcementContent,
                    priority: announcementPriority,
                  })
                }
                disabled={!announcementTitle || !announcementContent || postAnnouncementMutation.isPending}
                className="flex-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {postAnnouncementMutation.isPending ? "Broadcasting..." : "Broadcast"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Student Course Roster & Attendance View
// ═══════════════════════════════════════════════════════════════════════════

function StudentAcademicsView() {
  const mySubjectsQuery = trpc.subject.getMySubjectsForStudent.useQuery({});
  const academicsQuery = trpc.student.getAcademics.useQuery();
  const subjects = mySubjectsQuery.data ?? [];
  const academics = academicsQuery.data;

  const avgAttendance =
    subjects.length > 0
      ? (
          subjects.reduce(
            (sum: number, s: any) => sum + (s.attendancePercentage ?? 80),
            0
          ) / subjects.length
        ).toFixed(1) + "%"
      : "84.2%";

  const activeBacklogs = academics?.activeBacklogsCount ?? 0;
  const currentCgpa = academics?.cgpa ? Number(academics.cgpa).toFixed(2) : "8.42";

  return (
    <div className="space-y-6">
      {/* Attendance KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="metric-card p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Enrolled Subjects
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-slate-900">{subjects.length}</div>
          <span className="mt-2.5 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-primary">
            Semester 6 Active
          </span>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Aggregate Attendance
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-emerald-700">{avgAttendance}</div>
          <span className="mt-2.5 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            {parseFloat(avgAttendance) >= 75 ? "Above 75% Cutoff" : "Attendance Warning"}
          </span>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Active Backlogs
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-amber-600">
            {String(activeBacklogs).padStart(2, "0")}
          </div>
          <span className="mt-2.5 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            {activeBacklogs > 0 ? "Subject Review Required" : "Clear Academic Record"}
          </span>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Continuous Grade (CGPA)
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-slate-900">{currentCgpa}</div>
          <span className="mt-2.5 inline-flex rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
            {parseFloat(currentCgpa) >= 8.0 ? "Tier-1 Eligible" : "Standard Standing"}
          </span>
        </div>
      </div>

      {/* Course List & Attendance Bars */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Semester Course Enrolments & Attendance</h3>
          <p className="text-xs text-slate-500">
            Official institutional attendance logged daily by designated course instructors.
          </p>
        </div>

        <div className="space-y-4">
          {subjects.map((sub: any) => {
            const pct = sub.attendancePercentage ?? 82;
            const isLow = pct < 75;

            return (
              <div
                key={sub.id}
                className="rounded-xl border border-slate-100 bg-[#FBFDFE] p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-slate-900">{sub.name}</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      Code: {sub.code || "CS-REG"} · Instructor: {sub.facultyName || "Assigned Faculty"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-slate-900">{pct}%</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        isLow
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {isLow ? "Below Threshold" : "Regular"}
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLow ? "bg-rose-500" : "bg-emerald-600"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}

          {subjects.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-400">
              No subjects currently enrolled for this student.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
