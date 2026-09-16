import PragatiFrame from "@/components/PragatiFrame";
import InterventionModal from "@/components/InterventionModal";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowRight,
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
  Users,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function FacultyWards() {
  const wardsQuery = trpc.faculty.getWards.useQuery();
  const [search, setSearch] = useState("");
  const [selectedWardForIntervention, setSelectedWardForIntervention] =
    useState<any | null>(null);

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
          {/* Header */}
          <header className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3048a8] shadow-[0_0_0_4px_rgba(48,72,168,0.15)]" />
                <span className="eyebrow">Teacher-Guardian Workspace</span>
              </div>
              <h1 className="text-[30px] font-extrabold tracking-[-0.045em] text-[#182643] sm:text-[36px]">
                Assigned Student Wards
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[#6c7890]">
                Monitor continuous progress across your assigned mentees, review
                algorithmically flagged skill gaps, and schedule closed-loop
                interventions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-xl border border-[#dfe5ef] bg-white px-3.5 py-2.5 text-xs font-bold text-[#52617d] shadow-sm">
                <Users className="h-4 w-4 text-[#3048a8]" /> {wards.length} Mentees Assigned
              </span>
            </div>
          </header>

          {/* KPI Summary Cards */}
          <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {[
              {
                label: "Assigned Wards",
                value: `0${wards.length}`,
                helper: "Teacher-guardian roster",
                icon: UsersRound,
                color: "bg-[#edf0ff] text-[#3048a8]",
              },
              {
                label: "Needs Attention",
                value: `0${needsAttentionCount}`,
                helper: "Active skill gaps detected",
                icon: AlertTriangle,
                color: "bg-[#fff1dc] text-[#bd7a27]",
              },
              {
                label: "Active Interventions",
                value: `0${activeInterventionsTotal}`,
                helper: "Scheduled or in progress",
                icon: Calendar,
                color: "bg-[#f0ebff] text-[#7358c9]",
              },
              {
                label: "On Track",
                value: `0${onTrackCount}`,
                helper: "Steady skill progression",
                icon: CheckCircle2,
                color: "bg-[#e5f7f2] text-[#13876f]",
              },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="premium-card p-4 sm:p-5">
                  <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-[#edf0ff] text-[#5268cb]">
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
                  <th className="px-5 py-3.5 text-right">Mentoring Action</th>
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
                        <span className="font-mono text-sm font-bold text-[#3048a8]">
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
                        <button
                          onClick={() => setSelectedWardForIntervention(ward)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#3048a8] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#253782] active:scale-95"
                        >
                          <PlusCircle className="h-3.5 w-3.5" /> Intervene &amp; Schedule
                        </button>
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
              <Sparkles className="h-4 w-4 text-[#3048a8]" />
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
        />
      )}
    </PragatiFrame>
  );
}
