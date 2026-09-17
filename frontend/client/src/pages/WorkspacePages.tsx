import PragatiFrame from "@/components/PragatiFrame";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, BookOpenCheck, BriefcaseBusiness, CalendarDays, Check, Clock3, Download, Eye, FileCheck2, FileText, MessageSquareText, Route, ShieldCheck, Sparkles, Target, UsersRound } from "lucide-react";

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
  const dashboardQuery = trpc.student.dashboard.useQuery();
  const internship = dashboardQuery.data?.internship ?? {
    company: "Atlas Labs",
    role: "Product Engineering Intern",
    progress: 68,
    status: "In progress",
    nextMilestone: "Internship report",
    verification: "Institution review pending",
    evidence: [
      { label: "Offer letter", state: "verified" as const },
      { label: "Check-in 1", state: "verified" as const },
      { label: "Check-in 2", state: "verified" as const },
      { label: "Internship report", state: "pending" as const },
      { label: "Completion certificate", state: "not_started" as const },
    ],
  };

  const verifiedCount = internship.evidence.filter(item => item.state === "verified").length;
  const totalCount = internship.evidence.length;
  const studentMetrics = [
    { label: "Current company", value: internship.company, detail: internship.status, tone: "bg-[#eef1ff] text-primary" },
    { label: "Evidence progress", value: `${internship.progress}%`, detail: `${verifiedCount}/${totalCount} verified`, tone: "bg-[#e5f7f2] text-[#13876f]" },
    { label: "Next milestone", value: internship.nextMilestone, detail: "Due soon", tone: "bg-[#fff1dc] text-[#bd7a27]" },
    { label: "Verification", value: "Pending", detail: "Faculty review", tone: "bg-[#f2f4f8] text-[#62718c]" },
  ];

  const uploadTasks = [
    { title: "Upload internship report", detail: "PDF up to 10 MB with company guide comments", tag: "Required", tone: "bg-[#fff1dc] text-[#bd7a27]" },
    { title: "Add mentor feedback", detail: "Attach guide review or weekly progress summary", tag: "Recommended", tone: "bg-[#eef1ff] text-primary" },
    { title: "Completion certificate", detail: "Submit when internship end date is reached", tag: "Upcoming", tone: "bg-[#f2f4f8] text-[#62718c]" },
  ];

  const history = [
    ["Sep 12", "Check-in 2 verified by institution"],
    ["Aug 28", "Check-in 1 accepted"],
    ["Aug 14", "Offer letter hash matched"],
    ["Aug 01", "Internship registered for Atlas Labs"],
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {studentMetrics.map(metric => (
          <div key={metric.label} className="metric-card p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8995aa]">{metric.label}</div>
            <div className="mt-2 min-h-8 text-xl font-extrabold leading-tight tracking-[-0.035em] text-[#182643]">{metric.value}</div>
            <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${metric.tone}`}>{metric.detail}</span>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="premium-card p-6">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <BriefcaseBusiness className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-base font-extrabold text-[#263653]">{internship.company}</div>
                  <div className="text-xs font-semibold text-[#8995aa]">{internship.role}</div>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-xs leading-5 text-[#647089]">
                Keep your internship record complete by uploading each milestone document. PRAGATI verifies document integrity and sends it for faculty review.
              </p>
            </div>
            <button className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90">
              Upload Evidence
            </button>
          </div>

          <div className="mt-7 h-2.5 overflow-hidden rounded-full bg-[#edf0f6]">
            <div className="progress-fill h-full rounded-full bg-gradient-to-r from-primary to-[#16a889]" style={{ width: `${internship.progress}%` }} />
          </div>
          <div className="mt-2 grid grid-cols-2 text-[10px] font-semibold text-[#8995aa]">
            <span>{internship.progress}% evidence collected</span>
            <span className="text-right">{internship.verification}</span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {uploadTasks.map(task => (
              <div key={task.title} className="rounded-xl border border-[#e4eaf2] bg-[#fbfcfe] p-4">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${task.tone}`}>{task.tag}</span>
                <div className="mt-3 text-xs font-extrabold text-[#263653]">{task.title}</div>
                <p className="mt-1 text-[11px] leading-4 text-[#71809a]">{task.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-card p-5">
          <div className="mb-5 text-sm font-bold text-[#263653]">My verification checklist</div>
          <div className="space-y-4">
            {internship.evidence.map(item => {
              const isVerified = item.state === "verified";
              const isPending = item.state === "pending";
              return (
                <div key={item.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <span className={`grid h-8 w-8 place-items-center rounded-full ${isVerified ? "bg-[#e5f7f2] text-[#13876f]" : isPending ? "bg-[#fff1dc] text-[#bd7a27]" : "bg-[#eef1f6] text-[#9aa5b6]"}`}>
                    {isVerified ? <Check className="h-3.5 w-3.5" /> : <FileCheck2 className="h-3.5 w-3.5" />}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[#52617d]">{item.label}</div>
                    <div className="text-[10px] text-[#8995aa]">{isVerified ? "Institution verified" : isPending ? "Awaiting upload or review" : "Not started"}</div>
                  </div>
                  {isPending && <span className="rounded-full bg-[#fff1dc] px-2 py-0.5 text-[9.5px] font-bold text-[#bd7a27]">Next</span>}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="premium-card p-5">
          <div className="mb-4 text-sm font-bold text-[#263653]">Upcoming actions</div>
          <div className="space-y-3">
            {uploadTasks.map(task => (
              <div key={task.title} className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-xl border border-[#e4eaf2] p-4">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-extrabold text-[#263653]">{task.title}</div>
                  <div className="mt-1 text-[11px] leading-4 text-[#71809a]">{task.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-card p-5">
          <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <div className="text-sm font-bold text-[#263653]">Evidence activity</div>
              <div className="mt-1 text-xs text-[#8995aa]">Your latest internship milestones</div>
            </div>
            <ShieldCheck className="h-5 w-5 text-[#13876f]" />
          </div>
          <div className="space-y-3">
            {history.map(([time, note]) => (
              <div key={`${time}-${note}`} className="grid grid-cols-[72px_auto_1fr] items-start gap-3">
                <span className="pt-1 text-[10px] font-bold text-[#8995aa]">{time}</span>
                <span className="mt-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />
                <span className="text-xs font-semibold leading-5 text-[#52617d]">{note}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function FacultyInternshipPage() {
  const metrics = [
    { label: "Pending review", value: "12", detail: "4 due today", tone: "bg-[#fff1dc] text-[#bd7a27]" },
    { label: "Verified this week", value: "28", detail: "Across 3 sections", tone: "bg-[#e5f7f2] text-[#13876f]" },
    { label: "Integrity checks", value: "96%", detail: "SHA-256 matched", tone: "bg-[#eef1ff] text-[#5268cb]" },
    { label: "At-risk wards", value: "5", detail: "Missing milestones", tone: "bg-[#fff0f3] text-[#c24152]" },
  ];

  const evidenceRows = [
    { student: "Rahul Sharma", company: "Atlas Labs", role: "Product Engineering Intern", progress: 68, status: "Report due", due: "Sep 24", hash: "Matched", tone: "amber" },
    { student: "Aditi Nair", company: "Northwind AI", role: "Data Science Intern", progress: 92, status: "Ready for faculty review", due: "Sep 18", hash: "Matched", tone: "green" },
    { student: "Kabir Mehta", company: "FinEdge Systems", role: "Backend Intern", progress: 48, status: "Check-in missing", due: "Overdue", hash: "Pending", tone: "red" },
  ];

  const reviewQueue = [
    { title: "Completion certificate", student: "Aditi Nair", meta: "Northwind AI - uploaded 2h ago", status: "Needs signature" },
    { title: "Midterm report", student: "Rahul Sharma", meta: "Atlas Labs - mentor comments attached", status: "Review file" },
    { title: "Check-in 3", student: "Kabir Mehta", meta: "FinEdge Systems - student note only", status: "Request proof" },
  ];

  const activity = [
    ["09:40 AM", "Offer letter verified for Rahul Sharma"],
    ["Yesterday", "Aditi Nair certificate hash matched stored digest"],
    ["Sep 14", "Reminder sent for Kabir Mehta's missing check-in"],
    ["Sep 12", "Atlas Labs internship moved to in-progress"],
  ];

  return (
    <div className="space-y-5">
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

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="premium-card overflow-hidden">
          <div className="grid gap-4 border-b border-[#e7ecf4] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-2 text-sm font-bold text-[#263653]">
                <BriefcaseBusiness className="h-4 w-4 text-primary" />
                <span>Ward internship evidence</span>
              </div>
              <p className="mt-1 text-xs text-[#8995aa]">Track each student's mandatory documents, check-ins, and verification readiness.</p>
            </div>
            <div className="grid grid-flow-col auto-cols-max gap-2">
              <button className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe5ef] bg-white text-[#647089] hover:border-primary hover:text-primary" aria-label="View evidence filters">
                <Eye className="h-4 w-4" />
              </button>
              <button className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white shadow-sm hover:opacity-90" aria-label="Download evidence report">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#edf1f6]">
            {evidenceRows.map(row => (
              <div key={row.student} className="grid gap-4 p-5 lg:grid-cols-[1fr_170px_120px] lg:items-center">
                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-xs font-extrabold text-primary">
                    {row.student.split(" ").map(part => part[0]).join("")}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-[#263653]">{row.student}</div>
                    <div className="mt-0.5 text-xs font-semibold text-[#647089]">{row.company} - {row.role}</div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf0f6]">
                      <div className={`progress-fill h-full rounded-full ${row.progress > 80 ? "bg-[#16a889]" : row.progress < 55 ? "bg-[#d75f76]" : "bg-gradient-to-r from-[#5268cb] to-[#8c7fe0]"}`} style={{ width: `${row.progress}%` }} />
                    </div>
                    <div className="mt-1 grid grid-cols-2 text-[10px] text-[#8995aa]">
                      <span>{row.progress}% evidence collected</span>
                      <span className="text-right">{row.hash} integrity</span>
                    </div>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${row.tone === "green" ? "bg-[#e5f7f2] text-[#13876f]" : row.tone === "red" ? "bg-[#fff0f3] text-[#c24152]" : "bg-[#fff1dc] text-[#bd7a27]"}`}>
                    {row.status}
                  </span>
                  <div className="mt-2 grid grid-cols-[auto_1fr] items-center gap-1.5 text-[11px] font-semibold text-[#8995aa]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{row.due}</span>
                  </div>
                </div>
                <button className="rounded-lg border border-[#dfe5ef] bg-white px-3 py-2 text-xs font-bold text-[#52617d] transition hover:border-primary hover:text-primary">Open Review</button>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-card p-5">
          <div className="mb-5 text-sm font-bold text-[#263653]">Verification journey</div>
          <div className="space-y-4">
            {["Offer letter", "Check-ins 1 and 2", "Internship report", "Completion certificate", "Faculty review"].map((item, index) => (
              <div key={item} className="grid grid-cols-[auto_1fr] items-center gap-3">
                <span className={`grid h-7 w-7 place-items-center rounded-full ${index < 2 ? "bg-[#e5f7f2] text-[#13876f]" : index === 2 ? "bg-[#fff1dc] text-[#bd7a27]" : "bg-[#eef1f6] text-[#9aa5b6]"}`}>
                  {index < 2 ? <Check className="h-3.5 w-3.5" /> : <FileCheck2 className="h-3.5 w-3.5" />}
                </span>
                <div>
                  <div className="text-xs font-bold text-[#52617d]">{item}</div>
                  <div className="text-[10px] text-[#8995aa]">{index < 2 ? "Institution verified" : index === 2 ? "Ready for upload" : "Not started"}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-[#f0d4a1] bg-[#fffaf1] p-4">
            <div className="grid grid-cols-[auto_1fr] gap-2 text-xs font-bold text-[#8f5d1b]">
              <AlertTriangle className="h-4 w-4" />
              <span>Faculty attention</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#7f6a4b]">Five wards have not uploaded a check-in within the configured two-week window. Send reminders before approving completion.</p>
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="premium-card p-5">
          <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <div className="text-sm font-bold text-[#263653]">Review queue</div>
              <div className="mt-1 text-xs text-[#8995aa]">Documents awaiting mentor action</div>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">3 active</span>
          </div>
          <div className="space-y-3">
            {reviewQueue.map(item => (
              <div key={`${item.student}-${item.title}`} className="rounded-xl border border-[#e4eaf2] p-4">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef1ff] text-[#5268cb]">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-extrabold text-[#263653]">{item.title}</div>
                    <div className="mt-0.5 text-[11px] font-semibold text-[#647089]">{item.student}</div>
                    <div className="mt-1 text-[10px] text-[#8995aa]">{item.meta}</div>
                  </div>
                  <button className="rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white shadow-sm hover:opacity-90">{item.status}</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-card p-5">
          <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <div className="text-sm font-bold text-[#263653]">Audit activity</div>
              <div className="mt-1 text-xs text-[#8995aa]">Recent evidence and verification events</div>
            </div>
            <ShieldCheck className="h-5 w-5 text-[#13876f]" />
          </div>
          <div className="space-y-3">
            {activity.map(([time, note]) => (
              <div key={`${time}-${note}`} className="grid grid-cols-[86px_auto_1fr] items-start gap-3">
                <span className="pt-1 text-[10px] font-bold text-[#8995aa]">{time}</span>
                <span className="mt-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />
                <span className="text-xs font-semibold leading-5 text-[#52617d]">{note}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 rounded-xl border border-[#d8efe8] bg-[#f7fcf9] p-4 sm:grid-cols-[auto_1fr]">
            <MessageSquareText className="h-4 w-4 text-[#13876f]" />
            <div>
              <div className="text-xs font-bold text-[#246b5c]">Suggested mentor note</div>
              <p className="mt-1 text-xs leading-5 text-[#5f776f]">Ask Rahul to attach the signed project report and company guide feedback before the next faculty review cycle.</p>
            </div>
          </div>
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
  const interventionsQuery = trpc.student.getInterventions.useQuery();
  const interventions = interventionsQuery.data ?? [];

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

