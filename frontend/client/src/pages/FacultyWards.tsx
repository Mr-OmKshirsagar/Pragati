import PragatiFrame from "@/components/PragatiFrame";
import InterventionModal from "@/components/InterventionModal";
import RoleSpecificUserModal from "@/components/RoleSpecificUserModal";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  PlusCircle,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleSidebarTheme } from "@/lib/roleTheme";

export default function FacultyWards() {
  const wardsQuery = trpc.faculty.getWards.useQuery();
  const { role } = useAuth();
  const theme = getRoleSidebarTheme(role);
  const [search, setSearch] = useState("");
  const [selectedWardForIntervention, setSelectedWardForIntervention] =
    useState<any | null>(null);
  const [selectedWardForScorecard, setSelectedWardForScorecard] =
    useState<any | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const wards = wardsQuery.data ?? [];

  const filteredWards = useMemo(() => {
    return wards.filter(
      (w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.enrollmentNumber.toLowerCase().includes(search.toLowerCase())
    );
  }, [wards, search]);

  const needsAttentionCount = wards.filter(
    (w) => w.status === "NEEDS_ATTENTION"
  ).length;
  const onTrackCount = wards.filter((w) => w.status === "ON_TRACK").length;
  const activeInterventionsTotal = wards.reduce(
    (sum, w) => sum + w.activeInterventionsCount,
    0
  );

  return (
    <PragatiFrame title="Faculty Ward Roster" activePath="/faculty/wards">
      <main className="dashboard-grid min-h-[calc(100vh-70px)] px-4 pb-12 pt-7 sm:px-7 xl:px-10">
        <div className="mx-auto max-w-[1320px]">
          {/* Faculty Desk Page Header */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-[#71809a]">
              <span>Faculty Desk</span>
              <span className="text-[#d0d8e6]">/</span>
              <span className="text-primary font-bold">Assigned Wards</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-start gap-4 sm:items-end">
              <div>
                <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#182643] sm:text-[34px]">
                  Assigned Student Wards
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-[#6c7890] leading-relaxed">
                  Monitor continuous progress across your assigned mentees, review algorithmically flagged skill gaps, and schedule closed-loop interventions.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-2xs">
                  <Users className="h-4 w-4 text-emerald-600" />
                  {wards.length} Mentees Assigned
                </span>
                <button
                  onClick={() => setShowEnrollModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-emerald-700 hover:to-teal-800 active:scale-95 transition"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Enroll New Student</span>
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {[
              {
                label: "Assigned Wards",
                value: `0${wards.length}`,
                helper: "Teacher-guardian roster",
                icon: UsersRound,
                isPrimary: true,
              },
              {
                label: "Needs Attention",
                value: `0${needsAttentionCount}`,
                helper: "Active skill gaps detected",
                icon: AlertTriangle,
                isPrimary: false,
              },
              {
                label: "Active Interventions",
                value: `0${activeInterventionsTotal}`,
                helper: "Scheduled or in progress",
                icon: Calendar,
                isPrimary: false,
              },
              {
                label: "On Track",
                value: `0${onTrackCount}`,
                helper: "Steady skill progression",
                icon: CheckCircle2,
                isPrimary: false,
              },
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="premium-card p-4 sm:p-5">
                  <div
                    className="mb-3 grid h-9 w-9 place-items-center rounded-xl"
                    style={
                      kpi.isPrimary
                        ? { backgroundColor: `${theme.activePillBg}18`, color: theme.activePillBg }
                        : idx === 1
                        ? { backgroundColor: "#fff1dc", color: "#bd7a27" }
                        : idx === 2
                        ? { backgroundColor: "#f0ebff", color: "#7358c9" }
                        : { backgroundColor: "#e5f7f2", color: "#13876f" }
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8490a5]">
                    {kpi.label}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold tracking-[-0.05em] text-[#1b2946]">
                      {kpi.value}
                    </span>
                    <span className="text-[10px] text-[#8995aa]">
                      {kpi.helper}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#e2e8f2] bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-bold text-[#52617d]">
              Mentees Roster{" "}
              <span className="font-normal text-[#9aa5b6]">
                · Click &apos;Intervene&apos; to schedule structured remediation
              </span>
            </div>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-[#dfe5ef] bg-white px-3 text-[#8994a8] sm:w-[260px]">
              <Search className="h-4 w-4" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find ward by name or roll no"
                className="w-full bg-transparent text-xs text-[#304063] outline-none placeholder:text-[#a4afbf]"
              />
            </label>
          </div>

          {/* Wards List Table */}
          <div className="overflow-hidden rounded-2xl border border-[#e2e8f2] bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e2e8f2] bg-[#f8fafc] text-[10px] font-extrabold uppercase tracking-wider text-[#64748b]">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Program &amp; Sem</th>
                  <th className="px-5 py-3.5">Current CGPA</th>
                  <th className="px-5 py-3.5">Status &amp; Findings</th>
                  <th className="px-5 py-3.5 text-right">Faculty Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredWards.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-xs text-[#94a3b8]"
                    >
                      No assigned student wards found.
                    </td>
                  </tr>
                ) : (
                  filteredWards.map((ward) => (
                    <tr
                      key={ward.studentProfileId}
                      className="hover:bg-[#fbfcfe] transition"
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#1e293b]">
                          {ward.name}
                        </div>
                        <div className="text-[11px] font-mono text-[#64748b]">
                          {ward.enrollmentNumber}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#334155]">
                        <div>{ward.program}</div>
                        <div className="text-[10px] text-[#94a3b8]">
                          Semester {ward.currentSemester}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: theme.activePillBg }}
                        >
                          {ward.cgpa.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {ward.status === "NEEDS_ATTENTION" ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#fef2f2] px-2 py-0.5 text-[10px] font-extrabold text-[#b91c1c]">
                              <AlertTriangle className="h-3 w-3" /> Needs Attention
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ward.activeGaps.map((g: any) => (
                                <span
                                  key={g.id}
                                  className="rounded bg-[#ffedd5] px-1.5 py-0.5 text-[9px] font-bold text-[#c2410c]"
                                >
                                  {g.skillName} (Score: {g.reason?.score_history?.at(-1)}%)
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#f0fdf4] px-2 py-0.5 text-[10px] font-extrabold text-[#15803d]">
                            <CheckCircle2 className="h-3 w-3" /> On Track
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedWardForScorecard(ward)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe5ef] bg-white px-3.5 py-2 text-xs font-bold text-[#52617d] transition hover:bg-[#f8fafc] active:scale-95"
                          >
                            <BarChart3 className="h-3.5 w-3.5" /> Scorecard
                          </button>
                          <button
                            onClick={() => setSelectedWardForIntervention(ward)}
                            style={{
                              backgroundColor: theme.activePillBg,
                              boxShadow: theme.activePillShadow,
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90 active:scale-95"
                          >
                            <PlusCircle className="h-3.5 w-3.5" /> Intervene
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mentoring Methodology Info Banner */}
          <div className="mt-8 rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] p-5">
            <div className="flex items-center gap-2.5 text-xs font-bold text-[#1e293b]">
              <Sparkles className="h-4 w-4" style={{ color: theme.activePillBg }} />
              Closed-Loop Remediation Architecture
            </div>
            <p className="mt-1 text-xs leading-5 text-[#64748b]">
              When you schedule a mentoring session or assign remedial material,
              the student&apos;s skill gap transitions to{" "}
              <strong>In Review</strong>. Once the student completes their next
              continuous assessment and achieves a score of 75% or higher, the PRAGATI
              engine automatically closes the loop and resolves the skill gap with
              institution verification.
            </p>
          </div>
        </div>
      </main>

      {/* Intervention Scheduling Modal */}
      {selectedWardForIntervention && (
        <InterventionModal
          ward={selectedWardForIntervention}
          onClose={() => setSelectedWardForIntervention(null)}
          onSuccess={() => wardsQuery.refetch()}
          theme={theme}
        />
      )}
      {selectedWardForScorecard && (
        <StudentScorecardModal
          ward={selectedWardForScorecard}
          onClose={() => setSelectedWardForScorecard(null)}
          theme={theme}
          onIntervene={() => {
            setSelectedWardForIntervention(selectedWardForScorecard);
            setSelectedWardForScorecard(null);
          }}
        />
      )}
      <RoleSpecificUserModal
        open={showEnrollModal}
        onOpenChange={setShowEnrollModal}
        mode="STUDENT_ENROLLMENT"
        onSuccess={() => wardsQuery.refetch()}
      />
    </PragatiFrame>
  );
}

function StudentScorecardModal({
  ward,
  onClose,
  onIntervene,
  theme,
}: {
  ward: any;
  onClose: () => void;
  onIntervene: () => void;
  theme: ReturnType<typeof getRoleSidebarTheme>;
}) {
  const scorecard = ward.scorecard ?? {};
  const skillScores = scorecard.skillScores ?? [];
  const academicTrend = scorecard.academicTrend ?? [];
  const recentAssessments = scorecard.recentAssessments ?? [];

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close student scorecard"
        onClick={onClose}
        className="absolute inset-0 bg-[#07112d]/45 backdrop-blur-sm"
      />
      <aside className="motion-enter absolute right-0 top-0 flex h-full w-full max-w-[720px] flex-col overflow-y-auto bg-[#f8f9fc] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e1e7f0] bg-[#f8f9fc]/95 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div>
            <div className="eyebrow" style={{ color: theme.activePillBg }}>Student scorecard</div>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-[#1c2a47]">
              {ward.name}
            </h2>
            <div className="mt-0.5 text-xs font-semibold text-[#74819a]">
              {ward.enrollmentNumber} · Semester {ward.currentSemester}
            </div>
          </div>
          <button
            aria-label="Close scorecard"
            onClick={onClose}
            className="rounded-lg p-2 text-[#74819a] hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-4">
            <ScoreMetric label="CGPA" value={ward.cgpa?.toFixed?.(2) ?? ward.cgpa} helper="Current cumulative" tone="indigo" />
            <ScoreMetric label="Readiness" value={`${scorecard.readinessScore ?? 0}%`} helper="Composite index" tone="violet" />
            <ScoreMetric label="Attendance" value={`${scorecard.attendancePercent ?? 0}%`} helper="Current semester" tone="emerald" />
            <ScoreMetric label="Backlogs" value={String(ward.activeBacklogsCount ?? 0)} helper="Active records" tone="amber" />
          </div>

          <section className="rounded-2xl border border-[#e1e7f0] bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="eyebrow">Skill performance</div>
                <h3 className="text-sm font-extrabold text-[#1c2a47]">Verified capability scores</h3>
              </div>
              <span className="rounded-full bg-[#eef1f7] px-2.5 py-1 text-[10px] font-bold text-[#64718a]">
                Benchmark aware
              </span>
            </div>
            <div className="grid gap-3">
              {skillScores.map((item: any) => {
                const isBelow = item.score < item.benchmark;
                return (
                  <div key={item.skill} className="grid gap-2">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 font-bold text-[#34415d]">
                        {item.trend === "down" ? (
                          <TrendingDown className="h-4 w-4 text-[#d75f76]" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-[#16a889]" />
                        )}
                        {item.skill}
                      </div>
                      <div className={`font-extrabold ${isBelow ? "text-[#bd4c64]" : "text-[#13876f]"}`}>
                        {item.score}% <span className="font-medium text-[#9aa5b6]">/ {item.benchmark}%</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#eef2f7]">
                      <div
                        className={`h-full rounded-full ${isBelow ? "bg-[#d75f76]" : "bg-[#16a889]"}`}
                        style={{ width: `${Math.min(item.score, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-[#e1e7f0] bg-white p-4 sm:p-5">
              <div className="eyebrow mb-3">Academic trend</div>
              <div className="grid gap-2">
                {academicTrend.map((item: any) => (
                  <div key={item.label} className="grid grid-cols-[64px_1fr_44px] items-center gap-2 text-xs">
                    <span className="font-bold text-[#52617d]">{item.label}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-[#eef2f7]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(item.sgpa * 10, 100)}%`,
                          backgroundColor: theme.activePillBg,
                        }}
                      />
                    </div>
                    <span className="text-right font-mono font-bold text-[#34415d]">{item.sgpa}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e1e7f0] bg-white p-4 sm:p-5">
              <div className="eyebrow mb-3">Recent assessments</div>
              <div className="space-y-2.5">
                {recentAssessments.map((assessment: any) => (
                  <div key={assessment.name} className="rounded-xl bg-[#f8fafc] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-bold text-[#34415d]">{assessment.name}</div>
                      <div className="font-mono text-xs font-extrabold text-[#1c2a47]">{assessment.score}%</div>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-[10px] font-semibold text-[#8995aa]">
                      <span>{assessment.date}</span>
                      <span>{assessment.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#fed7aa] bg-[#fffaf0] p-4 sm:p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#7c2d12]">
              <AlertTriangle className="h-4 w-4 text-[#ea580c]" />
              Faculty attention points
            </div>
            <div className="grid gap-2">
              {(ward.activeGaps ?? []).map((gap: any) => (
                <div key={gap.id} className="rounded-xl bg-white/70 p-3 text-xs text-[#9a3412]">
                  <strong>{gap.skillName}:</strong> latest score {gap.reason?.score_history?.at(-1) ?? "N/A"}%, severity {gap.severity}.
                </div>
              ))}
              {(ward.activeGaps ?? []).length === 0 && (
                <div className="rounded-xl bg-white/70 p-3 text-xs text-[#64748b]">No active skill gaps for this student.</div>
              )}
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 mt-auto grid gap-3 border-t border-[#e1e7f0] bg-white/95 p-5 backdrop-blur-xl sm:grid-cols-[1fr_auto_auto] sm:items-center sm:p-7">
          <div className="text-xs font-semibold text-[#74819a]">
            {scorecard.internshipStatus ?? "No active internship recorded"} · {scorecard.verifiedEvidenceCount ?? 0} verified evidence items
          </div>
          <button onClick={onClose} className="rounded-xl border border-[#dfe5ef] px-4 py-2.5 text-xs font-bold text-[#64718a] hover:bg-[#f8fafc]">
            Close
          </button>
          <button
            onClick={onIntervene}
            style={{ backgroundColor: theme.activePillBg, boxShadow: theme.activePillShadow }}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
          >
            Schedule intervention
          </button>
        </div>
      </aside>
    </div>
  );
}

function ScoreMetric({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "indigo" | "violet" | "emerald" | "amber";
}) {
  const tones = {
    indigo: "bg-[#edf0ff] text-[#5268cb]",
    violet: "bg-[#f0ebff] text-[#7358c9]",
    emerald: "bg-[#e5f7f2] text-[#13876f]",
    amber: "bg-[#fff1dc] text-[#bd7a27]",
  };

  return (
    <div className={`rounded-2xl border border-white/80 p-4 ${tones[tone]}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] opacity-75">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-[-0.05em]">{value}</div>
      <div className="mt-1 text-[10px] font-semibold opacity-75">{helper}</div>
    </div>
  );
}

