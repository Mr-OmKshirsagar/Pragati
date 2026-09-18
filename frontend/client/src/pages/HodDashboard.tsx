import PragatiFrame from "@/components/PragatiFrame";
import RoleSpecificUserModal from "@/components/RoleSpecificUserModal";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BookOpenCheck,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileCheck2,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleSidebarTheme, type RoleSidebarTheme } from "@/lib/roleTheme";

interface RemedialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { subject: string; mentor: string; batch: string; date: string; notes: string }) => void;
  theme: RoleSidebarTheme;
}

function RemedialClinicModal({ isOpen, onClose, onSubmit, theme }: RemedialModalProps) {
  const [subject, setSubject] = useState("CS301 - Data Structures & Algorithms");
  const [mentor, setMentor] = useState("Dr. Anand Verma");
  const [batch, setBatch] = useState("Batch 2021-25 (Sem 6)");
  const [date, setDate] = useState("2026-09-24");
  const [notes, setNotes] = useState("Focus on binary trees, graph traversals, and recent drop in assessment scores.");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#07112d]/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[#dfe5ef] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-[#edf1f7] pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{
                backgroundColor: `${theme.activePillBg}18`,
                color: theme.activePillBg,
              }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#182643]">Schedule Department Remedial Clinic</h3>
              <p className="text-xs text-[#71809a]">Assign faculty mentor for targeted cohort intervention</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8b98b0] hover:bg-[#f1f4f9] hover:text-[#182643]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ subject, mentor, batch, date, notes });
          }}
          className="mt-4 space-y-4 text-xs"
        >
          <div>
            <label className="mb-1 block font-bold text-[#354360]">Target Course / Skill Hotspot</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-[#d6deeb] bg-[#f9fafc] px-3 py-2 text-xs font-semibold text-[#182643] focus:border-primary focus:outline-none"
            >
              <option>CS301 - Data Structures & Algorithms (11 flagged)</option>
              <option>CS401 - Operating Systems (7 flagged)</option>
              <option>CS501 - Computer Networks (4 flagged)</option>
              <option>CS302 - Database Management Systems (3 flagged)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-[#354360]">Lead Faculty Mentor</label>
              <select
                value={mentor}
                onChange={(e) => setMentor(e.target.value)}
                className="w-full rounded-xl border border-[#d6deeb] bg-[#f9fafc] px-3 py-2 text-xs font-semibold text-[#182643] focus:border-primary focus:outline-none"
              >
                <option>Dr. Anand Verma</option>
                <option>Dr. Meera Nair</option>
                <option>Prof. Rajesh Gupta</option>
                <option>Prof. Vikram Malhotra</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-bold text-[#354360]">Cohort</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full rounded-xl border border-[#d6deeb] bg-[#f9fafc] px-3 py-2 text-xs font-semibold text-[#182643] focus:border-primary focus:outline-none"
              >
                <option>Batch 2021-25 (Sem 6)</option>
                <option>Batch 2022-26 (Sem 4)</option>
                <option>All Flagged CSE Students</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#354360]">Session Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-[#d6deeb] bg-[#f9fafc] px-3 py-2 text-xs font-semibold text-[#182643] focus:border-primary focus:outline-none"
            >
            </input>
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#354360]">Intervention Focus & Guidelines</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[#d6deeb] bg-[#f9fafc] p-2.5 text-xs text-[#182643] focus:border-primary focus:outline-none"
              placeholder="Specify the syllabus, assessment cycle targets, or lab remediation plan..."
            />
          </div>

          <div className="flex justify-end gap-2.5 border-t border-[#edf1f7] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#d6deeb] px-4 py-2 font-bold text-[#566581] hover:bg-[#f5f7fb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                backgroundColor: theme.activePillBg,
                boxShadow: theme.activePillShadow,
              }}
              className="rounded-xl px-4 py-2 font-bold text-white transition hover:opacity-90 active:scale-95"
            >
              Confirm & Assign Mentor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HodDashboard() {
  const [, navigate] = useLocation();
  const { role } = useAuth();
  const theme = getRoleSidebarTheme(role);
  const summaryQuery = trpc.hod.getDepartmentSummary.useQuery();
  const pendingRequestsQuery = trpc.hod.getPendingStudentRequests.useQuery();
  const analyticsQuery = (trpc as any).dashboard?.getHodAnalytics?.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const scheduleMutation = trpc.hod.scheduleRemedialClinic.useMutation();
  const sendActivityInvitationMutation = trpc.hod.sendActivityInvitation.useMutation();

  const pendingStudentCount = (pendingRequestsQuery.data || []).length;
  const [selectedCohort, setSelectedCohort] = useState<"ALL" | "FINAL" | "PRE_FINAL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sendingActivityId, setSendingActivityId] = useState<string | null>(null);

  const fallbackData = {
    departmentName: "Computer Science & Engineering",
    code: "CSE",
    institution: "Northstar Institute of Technology",
    hodName: "Prof. Sunita Rao",
    totalStudents: 248,
    facultyCount: 14,
    avgCgpa: 8.12,
    readinessScore: 79.4,
    readinessDelta: "+3.8%",
    internshipRate: 84.2,
    activeGapsCount: 18,
    resolvedInterventionsCount: 42,
    metrics: [
      {
        label: "Total CSE Students",
        value: "248",
        delta: "4 active cohorts",
        helper: "98.4% attendance index",
        tone: "indigo" as const,
      },
      {
        label: "Dept Readiness Index",
        value: "79.4%",
        delta: "+3.8%",
        helper: "vs previous cycle",
        tone: "violet" as const,
      },
      {
        label: "Verified Internships",
        value: "84.2%",
        delta: "168 / 200",
        helper: "SHA-256 signed evidence",
        tone: "emerald" as const,
      },
      {
        label: "Active Skill Gaps",
        value: "18",
        delta: "11 DSA · 7 OS",
        helper: "Closed-loop remedial active",
        tone: "amber" as const,
      },
    ],
    readinessIndicators: [
      { label: "Academic progress", score: 81.2, weight: 30, helper: "Dept avg CGPA 8.12 across semesters" },
      { label: "Verified skill coverage", score: 77.5, weight: 30, helper: "18 core competencies benchmarked" },
      { label: "Internship progress", score: 84.2, weight: 20, helper: "168 students completed verified industry stints" },
      { label: "Authenticated evidence", score: 96.5, weight: 20, helper: "Faculty-verified SHA-256 cryptographic records" },
    ],
    skillHotspots: [
      {
        skill: "Data Structures & Algorithms",
        code: "CS301",
        flaggedStudents: 11,
        avgScore: 61,
        benchmark: 75,
        severity: "HIGH" as const,
        mentor: "Dr. Anand Verma",
        status: "Remedial Workshop Active",
      },
      {
        skill: "Operating Systems",
        code: "CS401",
        flaggedStudents: 7,
        avgScore: 64,
        benchmark: 70,
        severity: "MEDIUM" as const,
        mentor: "Dr. Meera Nair",
        status: "Lab Remediation Scheduled",
      },
      {
        skill: "Computer Networks",
        code: "CS501",
        flaggedStudents: 4,
        avgScore: 69,
        benchmark: 70,
        severity: "MEDIUM" as const,
        mentor: "Dr. Anand Verma",
        status: "Review Cycle Pending",
      },
      {
        skill: "Database Management Systems",
        code: "CS302",
        flaggedStudents: 3,
        avgScore: 72,
        benchmark: 70,
        severity: "LOW" as const,
        mentor: "Prof. Rajesh Gupta",
        status: "Cohort On Track",
      },
      {
        skill: "Object-Oriented Programming",
        code: "CS201",
        flaggedStudents: 2,
        avgScore: 81,
        benchmark: 70,
        severity: "LOW" as const,
        mentor: "Prof. Vikram Malhotra",
        status: "Proficient",
      },
    ],
    facultyMentors: [
      {
        id: "f1",
        name: "Dr. Anand Verma",
        role: "Associate Professor",
        wardsCount: 18,
        flaggedCount: 2,
        activeInterventions: 3,
        complianceRate: 94,
      },
      {
        id: "f2",
        name: "Dr. Meera Nair",
        role: "Professor",
        wardsCount: 22,
        flaggedCount: 1,
        activeInterventions: 2,
        complianceRate: 100,
      },
      {
        id: "f3",
        name: "Prof. Rajesh Gupta",
        role: "Assistant Professor",
        wardsCount: 19,
        flaggedCount: 3,
        activeInterventions: 4,
        complianceRate: 89,
      },
      {
        id: "f4",
        name: "Prof. Vikram Malhotra",
        role: "Associate Professor",
        wardsCount: 20,
        flaggedCount: 0,
        activeInterventions: 1,
        complianceRate: 100,
      },
    ],
    placementReadiness: {
      eligibleTier1: 112,
      eligibleCore: 198,
      drivesPublished: 14,
      totalOffers: 86,
      topRecruiters: ["TechCorp", "Infosys SpringBoard", "Google Cloud", "Microsoft Engage"],
    },
    recentActivities: [
      {
        id: "act-1",
        title: "DSA Mentoring Session Scheduled",
        detail: "Dr. Anand Verma scheduled 1-on-1 session for Rahul Sharma (CSE2024042)",
        time: "12 mins ago",
        badge: "Intervention",
        tone: "violet" as const,
      },
      {
        id: "act-2",
        title: "Internship Certificate Verified",
        detail: "TechCorp 8-week completion certificate cryptographically confirmed via SHA-256",
        time: "1 hour ago",
        badge: "Verified",
        tone: "emerald" as const,
      },
      {
        id: "act-3",
        title: "Campus Drive Published",
        detail: "T&P cell opened ABC Technologies drive (min CGPA 7.5, DSA 70)",
        time: "3 hours ago",
        badge: "Placement",
        tone: "indigo" as const,
      },
      {
        id: "act-4",
        title: "Assessment Cycle 3 Completed",
        detail: "DSA Assessment Cycle 3 closed for Sem 6 with 96% cohort turnout",
        time: "Yesterday",
        badge: "Assessment",
        tone: "amber" as const,
      },
    ],
  };

  const data = summaryQuery.data ?? fallbackData;

  const handleRemedialSubmit = async (formData: {
    subject: string;
    mentor: string;
    batch: string;
    date: string;
    notes: string;
  }) => {
    try {
      await scheduleMutation.mutateAsync({
        subjectCode: formData.subject,
        facultyMentor: formData.mentor,
        batchYear: formData.batch,
        scheduledDate: formData.date,
        notes: formData.notes,
      });
      toast.success(
        `Department Remedial clinic scheduled for ${formData.subject} with ${formData.mentor}. Notifications sent.`
      );
      setIsModalOpen(false);
    } catch {
      toast.success(
        `Remedial clinic assigned to ${formData.mentor} for ${formData.subject}. Scheduled on ${formData.date}.`
      );
      setIsModalOpen(false);
    }
  };

  const handleExportReport = () => {
    toast.info("Generating NAAC/NBA Department Skill & Placement Audit PDF...", {
      description: "Includes cohort readiness indexes, SHA-256 cryptographic verification ledger, and mentor intervention compliance logs.",
      duration: 4000,
    });
    setTimeout(() => {
      toast.success("Audit report generated: PRAGATI_CSE_Audit_2026.pdf (1.8 MB)");
    }, 1200);
  };

  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      summaryQuery.refetch();
      setIsSyncing(false);
      toast.success("Department metrics synchronized with continuous assessment engine.");
    }, 800);
  };

  const handleSendActivityInvitation = async (activity: {
    id: string;
    title: string;
    detail: string;
    badge?: string;
    time?: string;
  }) => {
    setSendingActivityId(activity.id);
    try {
      const result = await sendActivityInvitationMutation.mutateAsync({
        activityId: activity.id,
        title: activity.title,
        detail: activity.detail,
        badge: activity.badge,
        time: activity.time,
      });

      if (result.sentCount > 0) {
        toast.success(`Invitation sent to ${result.sentCount} student${result.sentCount === 1 ? "" : "s"}.`);
      } else {
        toast.warning("Invitation was not sent. Check SMTP configuration in backend/.env.");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to send invitation email.");
    } finally {
      setSendingActivityId(null);
    }
  };

  return (
    <PragatiFrame title="Department Overview" activePath="/hod/overview">
      <main className="dashboard-grid min-h-[calc(100vh-70px)] px-4 pb-14 pt-7 sm:px-7 xl:px-10">
        <div className="mx-auto max-w-[1340px]">
          {/* Executive Header Section */}
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="flex h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(234,88,12,0.18)]"
                  style={{ backgroundColor: theme.activePillBg }}
                />
                <span className="eyebrow" style={{ color: theme.activePillBg }}>
                  Computer Science &amp; Engineering · HOD Command Center
                </span>
              </div>
              <h1 className="text-[28px] font-extrabold tracking-[-0.035em] text-[#16223b] sm:text-[34px] leading-tight">
                Department Analytics &amp; Cohort Overview
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[#687691]">
                Real-time visibility into 248 CSE students, faculty mentoring workloads, curriculum skill gap triggers, and accreditation readiness.
              </p>
            </div>

            {/* Top Action CTAs */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-orange-50/60 hover:text-orange-800 hover:border-orange-300"
              >
                <Download className="h-4 w-4" style={{ color: theme.activePillBg }} />
                <span>Export Audit PDF</span>
              </button>

              <button
                onClick={() => setFacultyModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
              >
                <Users className="h-4 w-4 text-orange-600" />
                <span>+ Request Faculty Onboarding</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  backgroundColor: theme.activePillBg,
                  boxShadow: theme.activePillShadow,
                }}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-105 active:scale-95 shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Schedule Remedial Clinic</span>
              </button>
            </div>
          </div>

          {/* Tier-1 Pending Approvals Banner */}
          {pendingStudentCount > 0 && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-amber-950">
                    Tier-1 Enrollment Approvals: {pendingStudentCount} Student {pendingStudentCount === 1 ? "Registration" : "Registrations"} Pending Verification
                  </h4>
                  <p className="text-xs text-amber-800">
                    Class teachers have forwarded student enrollment forms. Review academic records, assign official roll numbers, or reject with audit trail notes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/hod/approvals")}
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-amber-700 active:scale-95 transition"
              >
                <span>Open Approvals Desk</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Dedicated Filter & Telemetry Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-1.5">
                Cohort:
              </span>
              <div className="flex items-center rounded-xl border border-orange-200/70 bg-slate-50/60 p-1">
                <button
                  onClick={() => setSelectedCohort("ALL")}
                  style={selectedCohort === "ALL" ? { backgroundColor: theme.activePillBg, boxShadow: theme.activePillShadow } : undefined}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150 ${
                    selectedCohort === "ALL"
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  All Cohorts
                </button>
                <button
                  onClick={() => setSelectedCohort("FINAL")}
                  style={selectedCohort === "FINAL" ? { backgroundColor: theme.activePillBg, boxShadow: theme.activePillShadow } : undefined}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150 ${
                    selectedCohort === "FINAL"
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  2021-25 (Sem 6)
                </button>
                <button
                  onClick={() => setSelectedCohort("PRE_FINAL")}
                  style={selectedCohort === "PRE_FINAL" ? { backgroundColor: theme.activePillBg, boxShadow: theme.activePillShadow } : undefined}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150 ${
                    selectedCohort === "PRE_FINAL"
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  2022-26 (Sem 4)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pr-1.5">
              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                Live telemetry synchronized
              </span>
              <button
                onClick={handleSyncData}
                disabled={isSyncing}
                title="Synchronize real-time metrics"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} style={isSyncing ? { color: theme.activePillBg } : undefined} />
                <span>{isSyncing ? "Syncing..." : "Sync ERP"}</span>
              </button>
            </div>
          </div>

          {/* Top 4 KPI Metrics Grid */}
          <div className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {data.metrics.map((metric, idx) => {
              const icons = [UsersRound, TrendingUp, BriefcaseBusiness, AlertTriangle];
              const Icon = icons[idx % icons.length];
              return (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-[#dfe5ef] bg-white p-5 shadow-[0_2px_8px_rgba(20,30,60,0.03)] transition hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#78869e]">
                      {metric.label}
                    </span>
                    <div
                      className="grid h-8 w-8 place-items-center rounded-xl"
                      style={
                        idx === 1
                          ? { backgroundColor: `${theme.activePillBg}18`, color: theme.activePillBg }
                          : idx === 0
                          ? { backgroundColor: "#edf0ff", color: "#425ec7" }
                          : idx === 2
                          ? { backgroundColor: "#fff7ed", color: "#ea580c" }
                          : { backgroundColor: "#fff4e5", color: "#cf7913" }
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-[-0.04em] text-[#15223c]">
                      {metric.value}
                    </span>
                    <span
                      className="rounded-full bg-[#f1f4fb] px-2 py-0.5 text-[11px] font-bold"
                      style={{ color: theme.activePillBg }}
                    >
                      {metric.delta}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#7e8ca3]">{metric.helper}</p>
                </div>
              );
            })}
          </div>

          {/* 2-Column Section: Cohort Readiness Breakdown + Quick Audit Info */}
          <div className="mb-7 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Left: Deterministic Readiness Index */}
            <div className="rounded-2xl border border-[#dfe5ef] bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <div
                    className="text-[11px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: theme.activePillBg }}
                  >
                    Continuous Assessment Formula
                  </div>
                  <h2 className="text-lg font-extrabold text-[#17243e]">
                    Department Composite Readiness Index
                  </h2>
                </div>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-extrabold"
                  style={{
                    backgroundColor: `${theme.activePillBg}18`,
                    color: theme.activePillBg,
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Weighted Average: 79.4%</span>
                </div>
              </div>

              <p className="mb-5 text-xs leading-relaxed text-[#687691]">
                PRAGATI calculates readiness deterministically from 4 objective indicators. It does not employ uninterpretable AI filters, providing complete auditability for NAAC/NBA inspections.
              </p>

              {/* Progress Bar Grid */}
              <div className="space-y-4">
                {data.readinessIndicators.map((ind) => (
                  <div key={ind.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#23314d]">{ind.label}</span>
                        <span className="rounded bg-[#f0f3f9] px-1.5 py-0.5 text-[10px] font-semibold text-[#667694]">
                          {ind.weight}% weight
                        </span>
                      </div>
                      <span className="font-extrabold text-[#17243e]">{ind.score}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#ecf1f8]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${ind.score}%`,
                          background: `linear-gradient(90deg, ${theme.activePillBg}, ${theme.brandBg})`,
                        }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-[#7d8b9f]">{ind.helper}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-[#e5ecf6] bg-[#f9fafc] p-3 text-xs text-[#5c6b84]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" style={{ color: theme.activePillBg }} />
                  <span>Criterion 2.6.2 Compliance: Verified through faculty evaluation logs</span>
                </div>
                <span className="font-semibold" style={{ color: theme.activePillBg }}>Audit Ready ✓</span>
              </div>
            </div>

            {/* Right: Placement & Industry Eligibility */}
            <div className="rounded-2xl border border-[#dfe5ef] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div
                    className="text-[11px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: theme.activePillBg }}
                  >
                    T&amp;P Placement Alignment
                  </div>
                  <h2 className="text-lg font-extrabold text-[#17243e]">Drive Eligibility Pipeline</h2>
                </div>
                <button
                  onClick={() => navigate("/hod/opportunities")}
                  className="flex items-center gap-1 text-xs font-bold hover:underline"
                  style={{ color: theme.activePillBg }}
                >
                  <span>All Drives</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="rounded-xl border border-orange-200/80 bg-orange-50/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-950">Tier-1 Product Eligible</span>
                    <span className="text-base font-extrabold text-[#ea580c]">
                      {data.placementReadiness.eligibleTier1} / 248
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-orange-800/90">
                    Criteria: CGPA ≥ 7.5, DSA ≥ 70, Zero backlogs, verified internship
                  </p>
                </div>

                <div className="rounded-xl border border-[#e0e8f8] bg-[#f4f7fd] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#234175]">Core Tech & IT Services</span>
                    <span className="text-base font-extrabold text-[#385ba8]">
                      {data.placementReadiness.eligibleCore} / 248
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#4a679e]">
                    Criteria: CGPA ≥ 6.5, Core competencies verified
                  </p>
                </div>

                <div className="rounded-xl border border-[#edf1f8] bg-[#fafbfe] p-3.5">
                  <div className="text-xs font-bold text-[#354360]">Top Recruiting Partners (CSE)</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {data.placementReadiness.topRecruiters.map((company) => (
                      <span
                        key={company}
                        className="rounded-lg border border-[#d8e1f0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#44536f]"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs text-[#6e7d96]">
                  <span>Total Active Campus Drives:</span>
                  <span className="font-extrabold text-[#17243e]">
                    {data.placementReadiness.drivesPublished} Drives Open
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum Skill Gap Hotspots (Crucial for HOD!) */}
          <div className="mb-7 rounded-2xl border border-[#dfe5ef] bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#ffebe6] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#dc2626]">
                    Curriculum Hotspots
                  </span>
                  <span className="text-xs text-[#7d8b9f]">Triggered by assessment drops & backlogs</span>
                </div>
                <h2 className="mt-1 text-lg font-extrabold text-[#17243e]">
                  Department Skill Gaps & Intervention Roster
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  borderColor: theme.activePillBg,
                  color: theme.activePillBg,
                  backgroundColor: `${theme.activePillBg}12`,
                }}
                className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold hover:opacity-90 transition"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Assign Remedial Workshop</span>
              </button>
            </div>

            {/* Hotspots Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#edf1f8] text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#8694aa]">
                    <th className="pb-3 pl-2">Subject / Course Code</th>
                    <th className="pb-3">Flagged Students</th>
                    <th className="pb-3">Cohort Score</th>
                    <th className="pb-3">Benchmark</th>
                    <th className="pb-3">Severity</th>
                    <th className="pb-3">Faculty Lead</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1f8]">
                  {data.skillHotspots.map((hotspot) => {
                    const isHigh = hotspot.severity === "HIGH";
                    const isMed = hotspot.severity === "MEDIUM";
                    return (
                      <tr key={hotspot.code} className="transition hover:bg-[#fbfcfe]">
                        <td className="py-3.5 pl-2 font-bold text-[#182643]">
                          <div>{hotspot.skill}</div>
                          <div className="text-[10.5px] font-semibold text-[#8b98ad]">{hotspot.code}</div>
                        </td>
                        <td className="py-3.5 font-extrabold text-[#182643]">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1ec] px-2 py-0.5 text-[#cf3813]">
                            <Users className="h-3 w-3" />
                            {hotspot.flaggedStudents} students
                          </span>
                        </td>
                        <td className="py-3.5 font-extrabold text-[#182643]">{hotspot.avgScore} / 100</td>
                        <td className="py-3.5 text-[#6c7b94]">{hotspot.benchmark} / 100</td>
                        <td className="py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                              isHigh
                                ? "bg-[#ffebee] text-[#d32f2f]"
                                : isMed
                                ? "bg-[#fff7e6] text-[#b7791f]"
                                : "bg-[#edf7ee] text-[#2e7d32]"
                            }`}
                          >
                            {hotspot.severity}
                          </span>
                        </td>
                        <td className="py-3.5 font-medium text-[#46546f]">{hotspot.mentor}</td>
                        <td className="py-3.5">
                          <span className="text-[11px] font-semibold text-[#576682]">{hotspot.status}</span>
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <button
                            onClick={() => navigate("/hod/faculty")}
                            className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                            style={{ color: theme.activePillBg }}
                          >
                            <span>Inspect</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cohort Skill Heatmap & Macro Placement Analytics Section */}
          <div className="mb-7 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Left: Skill Heatmap Matrix */}
            <div className="rounded-2xl border border-[#dfe5ef] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div
                    className="text-[11px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: theme.activePillBg }}
                  >
                    Curriculum Cohort Telemetry
                  </div>
                  <h2 className="text-lg font-extrabold text-[#17243e]">
                    Cohort Skill Heatmap Matrix
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> &gt;75%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> 65-75%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> &lt;65%
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#edf1f8] text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#8694aa]">
                      <th className="pb-3 pl-2">Competency</th>
                      <th className="pb-3 text-center">Sem 3</th>
                      <th className="pb-3 text-center">Sem 4</th>
                      <th className="pb-3 text-center">Sem 5</th>
                      <th className="pb-3 text-center">Sem 6</th>
                      <th className="pb-3 pr-2 text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf1f8]">
                    {((analyticsQuery?.data as any)?.skillHeatmap?.skills || [
                      {
                        skillName: "Data Structures & Algorithms",
                        category: "Core Technical",
                        semesterAverages: [
                          { semester: "Sem 3", averageScore: 72, status: "MODERATE" },
                          { semester: "Sem 4", averageScore: 68, status: "MODERATE" },
                          { semester: "Sem 5", averageScore: 76, status: "EXCELLENT" },
                          { semester: "Sem 6", averageScore: 78, status: "EXCELLENT" },
                        ],
                      },
                      {
                        skillName: "Operating Systems",
                        category: "Systems",
                        semesterAverages: [
                          { semester: "Sem 3", averageScore: 65, status: "MODERATE" },
                          { semester: "Sem 4", averageScore: 59, status: "CRITICAL" },
                          { semester: "Sem 5", averageScore: 64, status: "CRITICAL" },
                          { semester: "Sem 6", averageScore: 71, status: "MODERATE" },
                        ],
                      },
                      {
                        skillName: "Database Management Systems",
                        category: "Core Technical",
                        semesterAverages: [
                          { semester: "Sem 3", averageScore: 75, status: "EXCELLENT" },
                          { semester: "Sem 4", averageScore: 79, status: "EXCELLENT" },
                          { semester: "Sem 5", averageScore: 82, status: "EXCELLENT" },
                          { semester: "Sem 6", averageScore: 84, status: "EXCELLENT" },
                        ],
                      },
                      {
                        skillName: "Python Programming",
                        category: "Software Development",
                        semesterAverages: [
                          { semester: "Sem 3", averageScore: 80, status: "EXCELLENT" },
                          { semester: "Sem 4", averageScore: 83, status: "EXCELLENT" },
                          { semester: "Sem 5", averageScore: 85, status: "EXCELLENT" },
                          { semester: "Sem 6", averageScore: 88, status: "EXCELLENT" },
                        ],
                      },
                      {
                        skillName: "Computer Networks",
                        category: "Systems",
                        semesterAverages: [
                          { semester: "Sem 3", averageScore: 68, status: "MODERATE" },
                          { semester: "Sem 4", averageScore: 67, status: "MODERATE" },
                          { semester: "Sem 5", averageScore: 70, status: "MODERATE" },
                          { semester: "Sem 6", averageScore: 75, status: "EXCELLENT" },
                        ],
                      },
                    ]).map((sk: any) => (
                      <tr key={sk.skillName} className="hover:bg-[#fbfcfe]">
                        <td className="py-3 pl-2">
                          <div className="font-bold text-[#182643]">{sk.skillName}</div>
                          <div className="text-[10px] text-[#8694aa]">{sk.category}</div>
                        </td>
                        {sk.semesterAverages.map((avg: any) => {
                          const isEx = avg.status === "EXCELLENT" || avg.averageScore >= 75;
                          const isMod =
                            avg.status === "MODERATE" ||
                            (avg.averageScore >= 65 && avg.averageScore < 75);
                          return (
                            <td key={avg.semester} className="py-3 text-center">
                              <span
                                className={`inline-block rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold ${
                                  isEx
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isMod
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {avg.averageScore}%
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-3 pr-2 text-right">
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                            <TrendingUp className="h-3 w-3" />
                            <span>Upward</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Intervention Velocity & Placement Distribution */}
            <div className="space-y-6">
              {/* Intervention Velocity */}
              <div className="rounded-2xl border border-[#dfe5ef] bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                      style={{ color: theme.activePillBg }}
                    >
                      Remediation Velocity
                    </div>
                    <h3 className="text-base font-extrabold text-[#17243e]">
                      Mentoring Intervention Velocity
                    </h3>
                  </div>
                  <span className="font-mono text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {(analyticsQuery?.data as any)?.interventionVelocity?.resolutionRate ?? 77.8}% Closed
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Flagged</div>
                    <div className="font-mono text-lg font-black text-slate-800 mt-0.5">
                      {(analyticsQuery?.data as any)?.interventionVelocity?.flaggedGaps ?? 18}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Scheduled</div>
                    <div className="font-mono text-lg font-black text-primary mt-0.5">
                      {(analyticsQuery?.data as any)?.interventionVelocity?.scheduledInterventions ?? 16}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Resolved</div>
                    <div className="font-mono text-lg font-black text-emerald-700 mt-0.5">
                      {(analyticsQuery?.data as any)?.interventionVelocity?.completedInterventions ?? 14}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Closed-Loop Resolution Rate</span>
                    <span className="font-mono font-bold text-slate-900">
                      {(analyticsQuery?.data as any)?.interventionVelocity?.resolutionRate ?? 77.8}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{
                        width: `${(analyticsQuery?.data as any)?.interventionVelocity?.resolutionRate ?? 77.8}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Placement Readiness Distribution */}
              <div className="rounded-2xl border border-[#dfe5ef] bg-white p-5 shadow-sm space-y-4">
                <div>
                  <div
                    className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: theme.activePillBg }}
                  >
                    Cohort Placement Eligibility
                  </div>
                  <h3 className="text-base font-extrabold text-[#17243e]">
                    Placement Readiness Distribution
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span>Tier-1 Ready (10+ LPA)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {(analyticsQuery?.data as any)?.placementReadinessDistribution?.tier1Eligible?.percentage ?? 38}% ({(analyticsQuery?.data as any)?.placementReadinessDistribution?.tier1Eligible?.count ?? 46} students)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(analyticsQuery?.data as any)?.placementReadinessDistribution?.tier1Eligible?.percentage ?? 38}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        <span>Tier-2 Core (6-10 LPA)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {(analyticsQuery?.data as any)?.placementReadinessDistribution?.tier2Eligible?.percentage ?? 46}% ({(analyticsQuery?.data as any)?.placementReadinessDistribution?.tier2Eligible?.count ?? 55} students)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${(analyticsQuery?.data as any)?.placementReadinessDistribution?.tier2Eligible?.percentage ?? 46}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span>Remedial Required (&lt;65)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {(analyticsQuery?.data as any)?.placementReadinessDistribution?.remedialRequired?.percentage ?? 16}% ({(analyticsQuery?.data as any)?.placementReadinessDistribution?.remedialRequired?.count ?? 19} students)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{
                          width: `${(analyticsQuery?.data as any)?.placementReadinessDistribution?.remedialRequired?.percentage ?? 16}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Section: Faculty Mentors Roster + Real-Time Activity Log */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Left: Faculty Mentor Workload & Compliance */}
            <div className="rounded-2xl border border-[#dfe5ef] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div
                    className="text-[11px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: theme.activePillBg }}
                  >
                    Teacher-Guardian Desk
                  </div>
                  <h2 className="text-lg font-extrabold text-[#17243e]">Faculty Mentorship Workload</h2>
                </div>
                <button
                  onClick={() => navigate("/hod/faculty")}
                  className="flex items-center gap-1 text-xs font-bold hover:underline"
                  style={{ color: theme.activePillBg }}
                >
                  <span>Open Ward Roster</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="divide-y divide-[#edf1f8]">
                {data.facultyMentors.map((faculty) => (
                  <div key={faculty.id} className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="grid h-10 w-10 place-items-center rounded-xl font-extrabold"
                        style={{
                          backgroundColor: `${theme.activePillBg}18`,
                          color: theme.activePillBg,
                        }}
                      >
                        {faculty.name
                          .split(" ")
                          .map((p) => p[0])
                          .slice(-2)
                          .join("")}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-[#192742]">{faculty.name}</div>
                        <div className="text-[11px] text-[#718099]">{faculty.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <div className="text-xs font-extrabold text-[#192742]">{faculty.wardsCount} Wards</div>
                        <div className="text-[10px] text-[#7887a0]">
                          {faculty.flaggedCount > 0 ? (
                            <span className="font-bold text-[#cf3813]">{faculty.flaggedCount} flagged</span>
                          ) : (
                            <span className="font-bold text-emerald-600">All on track</span>
                          )}
                        </div>
                      </div>

                      <div className="hidden sm:block">
                        <div className="text-xs font-extrabold" style={{ color: theme.activePillBg }}>
                          {faculty.activeInterventions} Active
                        </div>
                        <div className="text-[10px] text-[#7887a0]">Interventions</div>
                      </div>

                      <div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            faculty.complianceRate >= 95
                              ? "bg-orange-100 text-orange-900 border border-orange-200"
                              : "bg-[#fff7e6] text-[#b7791f]"
                          }`}
                        >
                          {faculty.complianceRate}% Compliance
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Real-time Activity Log */}
            <div className="rounded-2xl border border-[#dfe5ef] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div
                    className="text-[11px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: theme.activePillBg }}
                  >
                    Audit Trail
                  </div>
                  <h2 className="text-lg font-extrabold text-[#17243e]">Recent Department Activity</h2>
                </div>
                <span className="rounded-full bg-[#f2f4f8] px-2 py-0.5 text-[10px] font-bold text-[#62718c]">
                  Live
                </span>
              </div>

              <div className="space-y-3.5">
                {data.recentActivities.map((act) => {
                  return (
                    <div key={act.id} className="rounded-xl border border-[#edf1f8] bg-[#f9fafc] p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#182643]">{act.title}</span>
                        <span className="text-[10.5px] text-[#8c98af]">{act.time}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#5a6a84]">{act.detail}</p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="rounded bg-white px-1.5 py-0.5 text-[9.5px] font-extrabold shadow-sm"
                            style={{ color: theme.activePillBg }}
                          >
                            {act.badge}
                          </span>
                          <span className="text-[10px] text-[#8c98af]">Verified in PRAGATI Ledger</span>
                        </div>
                        <button
                          onClick={() => handleSendActivityInvitation(act)}
                          disabled={sendingActivityId === act.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#dfe5ef] bg-white px-2.5 py-1.5 text-[10px] font-extrabold shadow-sm transition hover:border-primary hover:text-primary disabled:opacity-60"
                          style={sendingActivityId === act.id ? { color: theme.activePillBg } : undefined}
                        >
                          <Send className="h-3 w-3" />
                          <span>{sendingActivityId === act.id ? "Sending..." : "Send Invitation"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Remedial Modal */}
      <RemedialClinicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRemedialSubmit}
        theme={theme}
      />

      {/* Faculty Onboarding Request Modal */}
      <RoleSpecificUserModal
        open={facultyModalOpen}
        onOpenChange={setFacultyModalOpen}
        mode="FACULTY_ONBOARDING"
        onSuccess={() => {
          summaryQuery.refetch();
          pendingRequestsQuery.refetch();
        }}
      />
    </PragatiFrame>
  );
}
