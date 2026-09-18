import EvidenceUploadModal from "@/components/EvidenceUploadModal";
import InternshipCheckinModal from "@/components/InternshipCheckinModal";
import RegisterInternshipModal from "@/components/RegisterInternshipModal";
import PragatiFrame from "@/components/PragatiFrame";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  MessageSquareText,
  Plus,
  RefreshCw,
  Route,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";


const pageCopy: Record<string, { eyebrow: string; title: string; description: string }> = {
  progress: { eyebrow: "Student trajectory", title: "My Progress", description: "See how your academic, skill, and evidence milestones are building toward career readiness." },
  skills: { eyebrow: "Capability map", title: "Skills & Assessments", description: "Track verified skill scores, assessment history, and the interventions that can move your profile forward." },
  internship: { eyebrow: "Evidence trail", title: "Internship evidence", description: "Collect, organize, and follow the verification state of every internship milestone." },
  passport: { eyebrow: "Shareable profile", title: "Career Passport", description: "A trusted, evidence-aware profile that brings academics, skills, achievements, and opportunities together." },
  mentoring: { eyebrow: "Human support", title: "Mentoring", description: "Turn rule-generated findings into focused conversations, sessions, and measurable outcomes." },
};

export function WorkspacePage({ kind }: { kind: keyof typeof pageCopy }) {
  const copy = pageCopy[kind];
  const { role } = useAuth();
  const isFaculty = role === "FACULTY";

  return (
    <PragatiFrame title={copy.title} activePath={kind === "passport" ? "/career-passport" : `/${kind}`}>
      <main className="dashboard-grid min-h-[calc(100vh-70px)] px-4 pb-12 pt-7 sm:px-7 xl:px-10">
        <div className="mx-auto max-w-[1240px]">
          {/* Universal Clean Page Header (Gradient UI) */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-[#71809a]">
              <span>
                {isFaculty
                  ? (kind === "internship" ? "Academic Review" : "Faculty Desk")
                  : "Learner Workspace"}
              </span>
              <span className="text-[#d0d8e6]">/</span>
              <span className="text-primary font-bold">
                {isFaculty
                  ? (kind === "internship" ? "Internship Approvals" : kind === "mentoring" ? "Mentoring Logs" : copy.title)
                  : copy.title}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-start gap-4 sm:items-end">
              <div>
                <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#182643] sm:text-[34px]">
                  {isFaculty
                    ? (kind === "internship" ? "Internship Approvals" : kind === "mentoring" ? "Mentoring Logs" : copy.title)
                    : copy.title}
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-[#6c7890] leading-relaxed">
                  {copy.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-2xs ${
                  isFaculty
                    ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-800"
                    : "border-blue-200/80 bg-blue-50/90 text-blue-800"
                }`}>
                  {kind === "internship" ? (
                    <BriefcaseBusiness className={`h-4 w-4 ${isFaculty ? "text-emerald-600" : "text-blue-600"}`} />
                  ) : (
                    <Route className={`h-4 w-4 ${isFaculty ? "text-emerald-600" : "text-blue-600"}`} />
                  )}
                  <span>{isFaculty ? (kind === "internship" ? "Evidence Review" : "Active Logs") : "Verified Track"}</span>
                </span>
              </div>
            </div>
          </div>
          {kind === "progress" && <ProgressPage />}
          {kind === "skills" && <SkillsPage />}
          {kind === "internship" && <InternshipPage />}
          {kind === "passport" && <PassportPage />}
          {kind === "mentoring" && <MentoringPage />}
        </div>
      </main>
    </PragatiFrame>
  );
}

function ProgressPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="premium-card p-6">
        <div className="grid grid-cols-[1fr_auto] items-center">
          <div>
            <div className="text-sm font-bold text-[#263653]">Readiness movement</div>
            <div className="mt-1 text-xs text-[#8995aa]">Last 3 assessment cycles</div>
          </div>
          <div className="text-2xl font-extrabold tracking-[-0.04em] text-primary">78%</div>
        </div>
        <div className="mt-8 grid grid-cols-4 h-44 items-end gap-3 border-b border-l border-[#e6ebf3] px-4 pb-0">
          {[54, 62, 71, 78].map((value, index) => (
            <div key={value} className="grid justify-items-center gap-2">
              <div className="w-full rounded-t-xl bg-gradient-to-t from-[#5268cb] to-[#9daaff] transition hover:from-primary" style={{ height: `${value * 1.6}px` }} />
              <span className="text-[10px] font-semibold text-[#8995aa]">{index === 3 ? "Now" : `Q${index + 1}`}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="premium-card p-6">
        <div className="mb-5 grid grid-cols-[auto_1fr] items-center gap-2">
          <Target className="h-4 w-4 text-[#5268cb]" />
          <div className="text-sm font-bold text-[#263653]">Milestones this term</div>
        </div>
        <div className="space-y-4">
          {["Verify internship report", "Complete OS mentoring", "Reach 80% skill coverage"].map((item, index) => (
            <div key={item} className="grid grid-cols-[auto_1fr] items-center gap-3">
              <span className={`grid h-7 w-7 place-items-center rounded-full ${index === 0 ? "bg-[#fff1dc] text-[#bd7a27]" : "bg-[#e5f7f2] text-[#13876f]"}`}>
                {index === 0 ? <Clock3 className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="text-xs font-semibold text-[#52617d]">{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SkillsPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="premium-card p-6">
        <div className="mb-5 grid grid-cols-[1fr_auto] items-center">
          <div>
            <div className="text-sm font-bold text-[#263653]">Verified capability scores</div>
            <div className="mt-1 text-xs text-[#8995aa]">Assessment history across 6 skills</div>
          </div>
          <span className="rounded-full bg-[#e5f7f2] px-2.5 py-1 text-[10px] font-semibold text-[#13876f]">7 verified</span>
        </div>
        <div className="space-y-4">
          {[
            { label: "Python", score: 84 },
            { label: "DSA", score: 78 },
            { label: "OOP", score: 81 },
            { label: "DBMS", score: 72 },
            { label: "CN", score: 69 },
            { label: "Operating Systems", score: 61 },
          ].map(skill => (
            <div key={skill.label}>
              <div className="mb-1.5 grid grid-cols-[1fr_auto] text-xs font-semibold text-[#52617d]">
                <span>{skill.label}</span>
                <span className="font-bold text-primary">{skill.score}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#edf0f5]">
                <div className={`progress-fill h-full rounded-full ${skill.score < 65 ? "bg-[#e39a44]" : "bg-[#586cc8]"}`} style={{ width: `${skill.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="premium-card p-6">
        <div className="mb-5 grid grid-cols-[auto_1fr] items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-[#5268cb]" />
          <div className="text-sm font-bold text-[#263653]">Assessment history</div>
        </div>
        <div className="space-y-3">
          {["Technical assessment · Sep 12", "Problem-solving review · Aug 28", "Foundation check · Jul 18"].map((item, index) => (
            <div key={item} className="rounded-xl border border-[#e4eaf2] p-3">
              <div className="text-xs font-bold text-[#52617d]">{item}</div>
              <div className="mt-1 text-[11px] text-[#8995aa]">{index === 0 ? "6 skills assessed · score improved" : "Results verified by institution"}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InternshipPage() {
  const { role } = useAuth();
  return role === "STUDENT" ? <StudentInternshipPage /> : <FacultyInternshipPage />;
}

function StudentInternshipPage() {
  const internshipQuery = trpc.internship.getMyInternship.useQuery();
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const data = internshipQuery.data;

  const internship = {
    id: data?.id || "internship-01",
    company: data?.companyName || "Atlas Labs",
    role: data?.role || "Product Engineering Intern",
    startDate: data?.startDate || "2026-06-01",
    endDate: data?.endDate || "2026-11-30",
    stipend: data?.stipend ? `₹${Number(data.stipend).toLocaleString("en-IN")}/mo` : "₹45,000/mo",
    status: data?.status || "IN_PROGRESS",
    verificationStatus: data?.verificationStatus || "PENDING",
    completeness: data?.completeness ?? 50,
    supervisorName: data?.supervisorName || "Sarah Jenkins",
    supervisorEmail: data?.supervisorEmail || "s.jenkins@atlaslabs.io",
    milestones: data?.milestones ?? {
      hasOfferLetter: true,
      hasCheckin: true,
      hasReport: false,
      hasCertificate: false,
    },
    evidence: data?.evidence || [],
    checkins: data?.checkins || [],
  };

  const checklistItems = [
    {
      key: "offer_letter",
      label: "Offer Letter (25%)",
      completed: internship.milestones.hasOfferLetter,
      detail: internship.milestones.hasOfferLetter ? "Document cryptographic hash attached" : "Required for formal onboarding",
    },
    {
      key: "checkin",
      label: "Progress Check-ins (25%)",
      completed: internship.milestones.hasCheckin,
      detail: `${internship.checkins.length} check-in(s) logged on portal`,
    },
    {
      key: "report",
      label: "Internship Report (25%)",
      completed: internship.milestones.hasReport,
      detail: internship.milestones.hasReport ? "Report uploaded and pending sign-off" : "Submit before concluding internship",
    },
    {
      key: "certificate",
      label: "Completion Certificate (25%)",
      completed: internship.milestones.hasCertificate,
      detail: internship.milestones.hasCertificate ? "Verified by institutional faculty" : "Submit once internship period finishes",
    },
  ];

  const studentMetrics = [
    {
      label: "Current Company",
      value: internship.company,
      detail: internship.role,
      tone: "bg-[#eef1ff] text-primary",
    },
    {
      label: "Evidence Completeness",
      value: `${internship.completeness}%`,
      detail: `${checklistItems.filter(i => i.completed).length}/4 milestones`,
      tone: internship.completeness === 100 ? "bg-[#e5f7f2] text-[#13876f]" : "bg-[#fff1dc] text-[#bd7a27]",
    },
    {
      label: "Verification Status",
      value: internship.verificationStatus === "INSTITUTION_VERIFIED" ? "Verified" : internship.verificationStatus === "REJECTED" ? "Needs Revision" : "Pending",
      detail: internship.verificationStatus === "INSTITUTION_VERIFIED" ? "Faculty Signed Off" : "Faculty Review Desk",
      tone: internship.verificationStatus === "INSTITUTION_VERIFIED" ? "bg-[#e5f7f2] text-[#13876f]" : internship.verificationStatus === "REJECTED" ? "bg-[#fff0f3] text-[#c24152]" : "bg-[#fff1dc] text-[#bd7a27]",
    },
    {
      label: "Stipend & Duration",
      value: internship.stipend,
      detail: `${internship.startDate} to ${internship.endDate}`,
      tone: "bg-[#f2f4f8] text-[#62718c]",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Metric Cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {studentMetrics.map(metric => (
          <div key={metric.label} className="metric-card p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8995aa]">{metric.label}</div>
            <div className="mt-2 min-h-8 text-xl font-extrabold leading-tight tracking-[-0.035em] text-[#182643]">{metric.value}</div>
            <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${metric.tone}`}>{metric.detail}</span>
          </div>
        ))}
      </section>

      {/* Main Internship Overview & Progress */}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="premium-card p-6">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <BriefcaseBusiness className="h-6 w-6" />
                </span>
                <div>
                  <div className="text-lg font-extrabold text-[#263653]">{internship.company}</div>
                  <div className="text-xs font-semibold text-[#8995aa]">
                    {internship.role} · Supervisor: {internship.supervisorName} ({internship.supervisorEmail})
                  </div>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-xs leading-5 text-[#647089]">
                Milestone tracking verifies your internship lifecycle. Complete all four milestones (Offer Letter, Bi-weekly Check-ins, Report, and Certificate) to achieve 100% evidence completeness and submit for faculty institutional sign-off.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowRegisterModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>Register Internship</span>
              </button>
              <button
                onClick={() => setShowCheckinModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/10"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Log Check-in</span>
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Upload Evidence</span>
              </button>
            </div>
          </div>

          {/* Real-time Evidence Progress Bar */}
          <div className="mt-7">
            <div className="flex items-center justify-between text-xs font-bold text-[#263653] mb-2">
              <span>Evidence Completeness</span>
              <span className="font-extrabold text-primary">{internship.completeness}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#edf0f6]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#16a889] transition-all duration-500"
                style={{ width: `${internship.completeness}%` }}
              />
            </div>
            <div className="mt-2 grid grid-cols-2 text-[10px] font-semibold text-[#8995aa]">
              <span>Formula: (Completed Milestones / 4) × 100%</span>
              <span className="text-right">
                Status: <strong className="text-[#263653]">{internship.status}</strong> ({internship.verificationStatus})
              </span>
            </div>
          </div>

          {/* Evidence Milestones Cards */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {checklistItems.map(item => (
              <div
                key={item.key}
                className={`rounded-2xl border p-4 transition ${
                  item.completed
                    ? "border-[#13876f]/20 bg-[#f0faf7]"
                    : "border-[#e4eaf2] bg-[#fbfcfe]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${
                      item.completed
                        ? "bg-[#e5f7f2] text-[#13876f]"
                        : "bg-[#fff1dc] text-[#bd7a27]"
                    }`}
                  >
                    {item.completed ? <Check className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                    {item.completed ? "Achieved (+25%)" : "Pending (0%)"}
                  </span>
                </div>
                <div className="mt-3 text-xs font-extrabold text-[#263653]">{item.label}</div>
                <p className="mt-1 text-[10.5px] leading-4 text-[#71809a]">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Verification Checklist */}
        <section className="premium-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-[#263653]">Milestone Verification</div>
              <div className="text-xs text-[#8995aa]">Institutional audit requirements</div>
            </div>
            <ShieldCheck className="h-5 w-5 text-[#13876f]" />
          </div>

          <div className="space-y-3.5">
            {checklistItems.map(item => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl border border-[#edf1f6] bg-[#fcfdfe] p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-xl ${
                      item.completed ? "bg-[#e5f7f2] text-[#13876f]" : "bg-[#f2f4f8] text-[#8995aa]"
                    }`}
                  >
                    {item.completed ? <Check className="h-4 w-4" /> : <FileCheck2 className="h-4 w-4" />}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[#32415d]">{item.label}</div>
                    <div className="text-[10.5px] text-[#8995aa]">{item.detail}</div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    item.completed ? "bg-[#e5f7f2] text-[#13876f]" : "bg-[#f2f4f8] text-[#62718c]"
                  }`}
                >
                  {item.completed ? "Complete" : "Pending"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-[#dfe5ef] bg-[#f8fafd] p-4">
            <div className="text-xs font-bold text-[#182643]">Cryptographic Tamper Protection</div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#64748b]">
              All uploaded internship evidence is cryptographically hashed with SHA-256 upon selection and immutably stored in the institutional repository.
            </p>
          </div>
        </section>
      </div>

      {/* Check-ins & Evidence Logs */}
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        {/* Student Check-ins List */}
        <section className="premium-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-[#263653]">Bi-Weekly Check-in Logs</div>
              <div className="text-xs text-[#8995aa]">Logged progress updates during internship</div>
            </div>
            <button
              onClick={() => setShowCheckinModal(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add Log
            </button>
          </div>

          {internship.checkins.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d8e0ec] p-6 text-center">
              <Clock className="mx-auto h-8 w-8 text-[#8995aa]" />
              <div className="mt-2 text-xs font-bold text-[#263653]">No check-ins submitted yet</div>
              <p className="mt-1 text-[11px] text-[#71809a]">Submit your first check-in to unlock the 25% check-in progress milestone.</p>
              <button
                onClick={() => setShowCheckinModal(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm"
              >
                <Plus className="h-3 w-3" /> Log First Check-in
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {internship.checkins.map((chk: any) => (
                <div key={chk.id} className="rounded-xl border border-[#e8edf5] bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#182643]">
                      Check-in · {new Date(chk.checkInDate || chk.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="rounded-full bg-[#eef2fd] px-2 py-0.5 text-[9.5px] font-bold text-[#3048a8]">
                      {chk.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#52617d] whitespace-pre-line">{chk.summary}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Linked Cryptographic Documents */}
        <section className="premium-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-[#263653]">Cryptographic Evidence Documents</div>
              <div className="text-xs text-[#8995aa]">SHA-256 verified milestone attachments</div>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Upload File
            </button>
          </div>

          {internship.evidence.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d8e0ec] p-6 text-center">
              <FileCheck2 className="mx-auto h-8 w-8 text-[#8995aa]" />
              <div className="mt-2 text-xs font-bold text-[#263653]">No documents linked yet</div>
              <p className="mt-1 text-[11px] text-[#71809a]">Upload your Offer Letter or Internship Report to link cryptographic proof.</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm"
              >
                <UploadCloud className="h-3 w-3" /> Upload Evidence
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {internship.evidence.map((doc: any) => (
                <div key={doc.id} className="rounded-xl border border-[#e8edf5] bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#3048a8]" />
                      <span className="text-xs font-extrabold text-[#182643]">{doc.filename}</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                        doc.status === "INSTITUTION_VERIFIED"
                          ? "bg-[#e5f7f2] text-[#13876f]"
                          : "bg-[#fff1dc] text-[#bd7a27]"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-[#64748b] truncate">
                    SHA-256: {doc.sha256Hash}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-[#8995aa]">
                    <span>Type: {doc.evidenceType}</span>
                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                      >
                        Download <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {showCheckinModal && (
        <InternshipCheckinModal
          internshipId={internship.id}
          companyName={internship.company}
          onClose={() => setShowCheckinModal(false)}
          onSuccess={() => {
            internshipQuery.refetch();
          }}
        />
      )}

      {showUploadModal && (
        <EvidenceUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            internshipQuery.refetch();
          }}
          defaultTitle={`${internship.company} Milestone`}
        />
      )}

      {showRegisterModal && (
        <RegisterInternshipModal
          open={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            internshipQuery.refetch();
          }}
        />
      )}
    </div>
  );
}

function FacultyInternshipPage() {
  const queueQuery = trpc.internship.getReviewQueue.useQuery();
  const verifyMutation = trpc.internship.verifyInternship.useMutation();

  const [selectedInternship, setSelectedInternship] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const queue = queueQuery.data || [];

  const handleVerify = async (internshipId: string, status: "INSTITUTION_VERIFIED" | "REJECTED") => {
    setIsProcessing(true);
    try {
      await verifyMutation.mutateAsync({
        internshipId,
        status,
        notes: reviewNotes || (status === "INSTITUTION_VERIFIED" ? "Approved with full institutional compliance." : "Revision requested by faculty mentor."),
      });

      toast.success(
        status === "INSTITUTION_VERIFIED"
          ? "Internship approved and marked completed! Audit record created."
          : "Internship rejected/revision requested. Student notified."
      );
      setSelectedInternship(null);
      setReviewNotes("");
      queueQuery.refetch();
    } catch (err: any) {
      toast.error(err.message || "Action failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = queue.filter(q => q.verificationStatus === "PENDING").length;
  const verifiedCount = queue.filter(q => q.verificationStatus === "INSTITUTION_VERIFIED").length;
  const totalWards = queue.length;
  const avgCompleteness = totalWards > 0 ? Math.round(queue.reduce((acc, q) => acc + q.completeness, 0) / totalWards) : 0;

  const metrics = [
    { label: "Review Queue", value: pendingCount.toString(), detail: "Awaiting faculty sign-off", tone: "bg-[#fff1dc] text-[#bd7a27]" },
    { label: "Verified Internships", value: verifiedCount.toString(), detail: "Institutional sign-off granted", tone: "bg-[#e5f7f2] text-[#13876f]" },
    { label: "Average Evidence Completeness", value: `${avgCompleteness}%`, detail: "Across assigned wards", tone: "bg-[#eef1ff] text-primary" },
    { label: "Total Active Wards", value: totalWards.toString(), detail: "Department of CSE", tone: "bg-[#f2f4f8] text-[#62718c]" },
  ];

  return (
    <div className="space-y-5">
      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(metric => (
          <div key={metric.label} className="metric-card p-4">
            <div className="grid grid-cols-[1fr_auto] items-start gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8995aa]">{metric.label}</div>
                <div className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#182643]">{metric.value}</div>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${metric.tone}`}>{metric.detail}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Main Review Desk & Details */}
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="premium-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e7ecf4] p-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#263653]">
                <BriefcaseBusiness className="h-4 w-4 text-primary" />
                <span>Faculty Review Desk — Mentee Internships</span>
              </div>
              <p className="mt-1 text-xs text-[#8995aa]">
                Evaluate milestone completeness, cryptographic hashes, and bi-weekly check-in updates.
              </p>
            </div>
            <button
              onClick={() => queueQuery.refetch()}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe5ef] bg-white text-[#647089] hover:text-primary transition"
              title="Refresh queue"
            >
              <RefreshCw className={`h-4 w-4 ${queueQuery.isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>

          {queue.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8995aa]">
              No internships pending review for your assigned mentees.
            </div>
          ) : (
            <div className="divide-y divide-[#edf1f6]">
              {queue.map(item => {
                const isSelected = selectedInternship?.id === item.id;
                const isVerified = item.verificationStatus === "INSTITUTION_VERIFIED";
                const isRejected = item.verificationStatus === "REJECTED";

                return (
                  <div
                    key={item.id}
                    className={`p-5 transition hover:bg-[#fafcff] ${isSelected ? "bg-[#f4f7fe]" : ""}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-xs font-black text-primary">
                          {item.studentName?.split(" ").map((n: string) => n[0]).join("") || "ST"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-[#182643]">{item.studentName}</span>
                            <span className="rounded-md bg-[#edf2f7] px-2 py-0.5 text-[10px] font-bold text-[#64748b]">
                              {item.enrollmentNumber}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs font-semibold text-[#52617d]">
                            {item.role} @ <strong className="text-[#182643]">{item.companyName}</strong>
                          </div>
                          <div className="mt-1 text-[11px] text-[#8995aa]">
                            {item.startDate} to {item.endDate || "Present"} · {item.evidenceCount} evidence doc(s) · {item.checkinCount} check-in(s)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-xs font-extrabold text-[#182643]">{item.completeness}% Complete</div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              isVerified
                                ? "bg-[#e5f7f2] text-[#13876f]"
                                : isRejected
                                ? "bg-[#fff0f3] text-[#c24152]"
                                : "bg-[#fff1dc] text-[#bd7a27]"
                            }`}
                          >
                            {item.verificationStatus}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedInternship(isSelected ? null : item)}
                          className="rounded-xl border border-[#dfe5ef] bg-white px-3.5 py-2 text-xs font-bold text-[#52617d] transition hover:border-primary hover:text-primary shadow-xs"
                        >
                          {isSelected ? "Close" : "Review"}
                        </button>
                      </div>
                    </div>

                    {/* Completeness Bar */}
                    <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-[#edf0f6]">
                      <div
                        className={`h-full rounded-full ${
                          item.completeness === 100
                            ? "bg-[#16a889]"
                            : item.completeness >= 50
                            ? "bg-[#5268cb]"
                            : "bg-[#d75f76]"
                        }`}
                        style={{ width: `${item.completeness}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Review Action Drawer / Panel */}
        <section className="premium-card p-5">
          {selectedInternship ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#edf1f6] pb-3">
                <div>
                  <div className="text-sm font-extrabold text-[#182643]">Audit & Sign-Off</div>
                  <div className="text-xs text-[#8995aa]">{selectedInternship.studentName} ({selectedInternship.companyName})</div>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                  {selectedInternship.completeness}% Ready
                </span>
              </div>

              {/* Evidence Documents List */}
              <div>
                <div className="text-xs font-bold text-[#263653] mb-2 flex items-center justify-between">
                  <span>Cryptographic Documents ({selectedInternship.evidence?.length || 0})</span>
                  <ShieldCheck className="h-4 w-4 text-[#13876f]" />
                </div>
                {selectedInternship.evidence?.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#e2e8f0] p-3 text-center text-xs text-[#8995aa]">
                    No documents uploaded yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedInternship.evidence.map((doc: any) => (
                      <div key={doc.id} className="rounded-xl border border-[#edf1f6] bg-[#fbfcfe] p-2.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-[#182643]">
                          <span>{doc.filename}</span>
                          <span className="text-[10px] text-[#13876f] font-mono">SHA-256 Verified</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#64748b] truncate mt-0.5">
                          {doc.sha256Hash}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Check-ins Summary */}
              <div>
                <div className="text-xs font-bold text-[#263653] mb-2">
                  Student Check-ins ({selectedInternship.checkins?.length || 0})
                </div>
                {selectedInternship.checkins?.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#e2e8f0] p-3 text-center text-xs text-[#8995aa]">
                    No check-ins logged yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedInternship.checkins.map((chk: any) => (
                      <div key={chk.id} className="rounded-xl border border-[#edf1f6] bg-[#fbfcfe] p-2.5 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#32415d]">
                          <span>{chk.checkInDate || "Date"}</span>
                          <span className="text-[#3048a8]">{chk.status}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#64748b] line-clamp-2">{chk.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sign-Off Notes */}
              <div>
                <label className="block text-xs font-bold text-[#263653] mb-1.5">
                  Faculty Review Notes / Revision Feedback
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Provide institutional verification remarks or revision details for student..."
                  rows={3}
                  className="w-full rounded-xl border border-[#cbd5e1] p-2.5 text-xs text-[#182643] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              {/* Verification Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleVerify(selectedInternship.id, "INSTITUTION_VERIFIED")}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl bg-[#13876f] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0f6c58] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approve & Verify</span>
                </button>
                <button
                  onClick={() => handleVerify(selectedInternship.id, "REJECTED")}
                  disabled={isProcessing}
                  className="rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs font-bold text-[#c24152] hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Request Revision</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#8995aa]">
              <FileCheck2 className="mx-auto h-10 w-10 text-[#a0aec0] mb-2" />
              <div className="font-bold text-[#263653]">Select an internship from the queue</div>
              <p className="mt-1 text-[11px] text-[#71809a]">
                Click "Review" on any mentee to inspect submitted evidence, check-in milestones, and grant institutional verification sign-off.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


function PassportPage() {
  return (
    <section className="overflow-hidden rounded-[24px] bg-[#1E1145] p-6 text-white shadow-[0_20px_45px_rgba(39,62,151,0.17)] sm:p-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="mb-3 grid grid-cols-[auto_1fr] items-center gap-2 text-[11px] font-bold uppercase tracking-[0.09em] text-[#bec8ff]">
            <Route className="h-4 w-4" />
            <span>Career Passport</span>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.035em]">Rahul Sharma</h2>
          <p className="mt-2 text-sm text-[#b5c0e3]">B.Tech Computer Science · Northstar Institute of Technology · Class of 2027</p>
        </div>
        <div className="grid grid-flow-col auto-cols-max gap-2">
          <button className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-primary">Export Passport</button>
          <button className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white">Share Passport</button>
        </div>
      </div>
      <div className="mt-10 grid gap-3 sm:grid-cols-4">
        {[
          ["Academics", "8.42 CGPA"],
          ["Skills", "7 verified"],
          ["Achievements", "9 verified"],
          ["Internship", "68% evidence"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#a8b5db]">{label}</div>
            <div className="mt-2 text-sm font-bold text-white">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MentoringPage() {
  const { role } = useAuth();
  const isFaculty = role === "FACULTY" || role === "HOD";

  const studentInterventionsQuery = trpc.student.getInterventions.useQuery(undefined, {
    enabled: !isFaculty,
  });
  const facultyWardsQuery = trpc.faculty.getWards.useQuery(undefined, {
    enabled: isFaculty,
  });

  const interventions = useMemo(() => {
    if (isFaculty) {
      const wards = facultyWardsQuery.data ?? [];
      const list: any[] = [];
      for (const ward of wards) {
        if (ward.activeGaps) {
          for (const gap of ward.activeGaps) {
            list.push({
              id: gap.id,
              skillGap: { skillName: gap.skillName },
              type: "REMEDIAL_MENTORING",
              status: "SCHEDULED",
              description: `Remedial intervention planned for ${ward.name} (${ward.enrollmentNumber}) in ${gap.skillName}.`,
              assignedFacultyName: "You (Teacher Guardian)",
              startDate: (gap as any).detectedAt || new Date().toISOString(),
            });
          }
        }
      }
      return list;
    }
    return studentInterventionsQuery.data ?? [];
  }, [isFaculty, facultyWardsQuery.data, studentInterventionsQuery.data]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <section className="premium-card p-6">
        <div className="mb-5 grid grid-cols-[1fr_auto] items-center">
          <div>
            <div className="text-sm font-bold text-[#263653]">Assigned Interventions</div>
            <div className="mt-1 text-xs text-[#8995aa]">Faculty-directed actions and closed-loop mentorship</div>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {interventions.length} tracked
          </span>
        </div>

        {interventions.length === 0 ? (
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-6 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-[#94a3b8]" />
            <div className="mt-2 text-xs font-bold text-[#475569]">No active interventions</div>
            <p className="mt-1 text-xs text-[#64748b]">
              You currently have no pending faculty interventions. Maintain your strong performance!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {interventions.map((item: any) => {
              const isCompleted = item.status === "COMPLETED";
              const isScheduled = item.status === "SCHEDULED";
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 transition ${
                    isCompleted
                      ? "border-[#d8efe8] bg-[#f7fcf9]"
                      : isScheduled
                      ? "border-[#f1d7a7] bg-[#fffaf1]"
                      : "border-[#e2e8f0] bg-white"
                  }`}
                >
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <div className="grid grid-cols-[auto_1fr] items-center gap-2 text-xs font-semibold text-[#182643]">
                      <Sparkles className={`h-4 w-4 ${isCompleted ? "text-[#13876f]" : "text-[#a96d1c]"}`} />
                      <span>{item.skillGap?.skillName ? `${item.skillGap.skillName} · ` : ""}{item.type}</span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${
                        isCompleted
                          ? "bg-[#e5f7f2] text-[#13876f]"
                          : isScheduled
                          ? "bg-[#fff1dc] text-[#bd7a27]"
                          : "bg-[#eef1f6] text-[#6c7890]"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[#52617d]">
                    {item.description}
                  </p>

                  {item.outcome && (
                    <div className="mt-3 rounded-xl border border-[#d8efe8] bg-white p-2.5 text-xs text-[#13876f]">
                      <span className="font-bold">Faculty Session Notes: </span>
                      {item.outcome}
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-1 gap-1 border-t border-[#e8ecf4] pt-2 text-[11px] text-[#8995aa] sm:grid-cols-[1fr_auto]">
                    <span>Assigned by: <strong className="font-semibold text-[#3a4968]">{item.assignedFacultyName || "Dr. Anand Verma"}</strong></span>
                    {item.startDate && (
                      <span>Date: {new Date(item.startDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="premium-card p-6">
        <div className="mb-5 grid grid-cols-[auto_1fr] items-center gap-2">
          <UsersRound className="h-4 w-4 text-[#5268cb]" />
          <div className="text-sm font-bold text-[#263653]">Your support network</div>
        </div>
        <div className="space-y-4">
          {[
            ["Dr. Anand Verma", "Assigned Faculty Mentor", "Available Monday & Thursday"],
            ["Prof. Sunita Rao", "Head of Department (CSE)", "Office Hours: Wed 2-4 PM"],
            ["Arjun Menon", "Peer learning partner", "2 sessions completed"],
          ].map(([name, role, note]) => (
            <div key={name} className="grid grid-cols-[auto_1fr] items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                {name.split(" ").map((part) => part[0]).join("")}
              </span>
              <div>
                <div className="text-xs font-bold text-[#52617d]">{name}</div>
                <div className="text-[10px] font-medium text-[#8995aa]">{role} · {note}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

