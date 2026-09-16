import PragatiFrame from "@/components/PragatiFrame";
import { trpc } from "@/lib/trpc";
import type { SkillDetail } from "@shared/pragati";
import { ArrowDownRight, ArrowUpRight, BookOpenCheck, CheckCircle2, ChevronRight, Clock3, FileCheck2, PlusCircle, Search, ShieldCheck, Sparkles, Target, X } from "lucide-react";
import { useMemo, useState } from "react";

export default function Skills() {
  const query = trpc.student.skills.useQuery();
  const assessmentsQuery = trpc.student.getAssessments.useQuery();
  const [selected, setSelected] = useState<SkillDetail | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const skills = useMemo(() => (query.data?.skills ?? []).filter(item => item.label.toLowerCase().includes(search.toLowerCase())), [query.data, search]);
  if (query.isLoading) return <SkillsSkeleton />;
  if (query.isError || !query.data) return <div className="grid min-h-screen place-items-center bg-[#f5f7fb] text-sm text-[#64718a]">We couldn&apos;t load Skills &amp; Assessments.</div>;
  return (
    <PragatiFrame title="Skills & Assessments" activePath="/skills">
      <main className="dashboard-grid min-h-[calc(100vh-70px)] px-4 pb-12 pt-7 sm:px-7 xl:px-10">
        <div className="mx-auto max-w-[1240px]">
          <header className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-2 eyebrow">Capability map</div>
              <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-[#182643] sm:text-[34px]">Skills &amp; Assessments</h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6c7890]">Explore verified capability scores, assessment history, related gaps, and the interventions that move a skill forward.</p>
            </div>
            <div className="grid grid-flow-col auto-cols-max items-center gap-3">
              <div className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs font-medium text-[#6e7b93] shadow-sm">
                <ShieldCheck className="h-4 w-4 text-[#16a889]" />
                <span>{skills.length} skills tracked</span>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="grid grid-flow-col auto-cols-max items-center gap-2 rounded-xl bg-[#3048a8] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#263a8a] active:scale-95"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Take Assessment</span>
              </button>
            </div>
          </header>

          <div className="mb-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {[
              ["Skills tracked", `0${skills.length}`, "all core areas"],
              ["Institution verified", `0${skills.filter(s => s.history.length > 0).length}`, "latest cycle"],
              ["Assessments", `${assessmentsQuery.data?.length ?? 3}`, "available"],
              ["Open skill gaps", `0${skills.filter(s => s.trend === "down").length}`, "needs attention"],
            ].map(([label, value, helper], index) => (
              <div key={label} className="premium-card p-4 sm:p-5">
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-[#edf0ff] text-[#5268cb]">
                  {index === 0 ? <Target className="h-4 w-4" /> : index === 1 ? <ShieldCheck className="h-4 w-4" /> : index === 2 ? <BookOpenCheck className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8490a5]">{label}</div>
                <div className="mt-1 grid grid-flow-col auto-cols-max items-baseline gap-2">
                  <span className="kpi-value text-2xl font-extrabold tracking-[-0.04em] text-[#1b2946]">{value}</span>
                  <span className="text-[10.5px] font-medium text-[#8995aa]">{helper}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-[#e2e8f2] bg-white/75 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2 text-xs font-semibold text-[#52617d]">
              <BookOpenCheck className="h-4 w-4 text-[#5268cb]" />
              <span>Skill overview</span>
              <span className="font-normal text-[#9aa5b6]">· click any card for assessment detail</span>
            </div>
            <label className="grid h-10 grid-cols-[auto_1fr] items-center gap-2 rounded-xl border border-[#dfe5ef] bg-white px-3 text-[#8994a8] sm:w-[250px]">
              <Search className="h-4 w-4" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a skill" className="w-full bg-transparent text-xs text-[#304063] outline-none placeholder:text-[#a4afbf]" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill, index) => (
              <SkillCard key={skill.label} skill={skill} index={index} onOpen={() => setSelected(skill)} />
            ))}
          </div>

          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="premium-card p-5 sm:p-6">
              <div className="mb-4 grid grid-cols-[auto_1fr] items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#bd7a27]" />
                <div>
                  <div className="eyebrow">Strengths</div>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-[#1c2a47]">Where your profile is strongest</h2>
                </div>
              </div>
              <div className="grid grid-flow-col auto-cols-max gap-2 flex-wrap">
                {["Python · 84%", "OOP · 81%", "DSA · 78%"].map(item => (
                  <span key={item} className="rounded-xl bg-[#e5f7f2] px-3 py-2 text-xs font-semibold text-[#13876f]">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="premium-card p-5 sm:p-6">
              <div className="mb-4 grid grid-cols-[auto_1fr] items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#bd7a27]" />
                <div>
                  <div className="eyebrow">Upcoming assessments</div>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-[#1c2a47]">Next verification windows</h2>
                </div>
              </div>
              <div className="space-y-3">
                {["Operating Systems · 20 Sep", "Computer Networks · 24 Sep"].map(item => (
                  <div key={item} className="grid grid-cols-[1fr_auto] items-center rounded-xl bg-[#f8f9fc] px-3 py-3 text-xs font-semibold text-[#52617d]">
                    <span>{item}</span>
                    <span className="rounded-full bg-[#fff1dc] px-2 py-1 text-[9px] font-semibold text-[#bd7a27]">Scheduled</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="mt-10 border-t border-[#e0e6f0] pt-5 text-[11px] text-[#8290a7]">PRAGATI · Skill scores are backed by assessment records and verification states.</footer>
        </div>
      </main>
      {selected && <SkillDrawer skill={selected} onClose={() => setSelected(null)} />}
      {isModalOpen && (
        <TakeAssessmentModal
          assessments={assessmentsQuery.data ?? []}
          onClose={() => setIsModalOpen(false)}
          onSubmitted={() => query.refetch()}
        />
      )}
    </PragatiFrame>
  );
}

function SkillCard({ skill, index, onOpen }: { skill: SkillDetail; index: number; onOpen: () => void }) {
  const latest = skill.history.at(-1)!;
  const up = skill.trend === "up";
  return (
    <button onClick={onOpen} className={`premium-card motion-enter motion-delay-${Math.min(index + 1, 4)} group w-full p-5 text-left transition hover:-translate-y-0.5 hover:border-[#cbd5ef] hover:shadow-[0_18px_45px_rgba(48,72,168,0.1)]`}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
        <div>
          <div className="text-sm font-bold text-[#263653]">{skill.label}</div>
          <div className="mt-1 text-[10.5px] text-[#8995aa]">Latest · {latest.date}</div>
        </div>
        <span className={`grid grid-cols-[auto_1fr] items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${up ? "bg-[#e5f7f2] text-[#13876f]" : "bg-[#fff1dc] text-[#bd7a27]"}`}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{up ? "Improving" : "Needs attention"}</span>
        </span>
      </div>
      <div className="mt-6 grid grid-cols-[1fr_auto] items-end">
        <div className="grid grid-flow-col auto-cols-max items-baseline">
          <span className="text-3xl font-extrabold tracking-[-0.04em] text-[#1b2946]">{skill.current}%</span>
          <span className="ml-2 text-[10.5px] font-medium text-[#8995aa]">current</span>
        </div>
        <ChevronRight className="h-5 w-5 text-[#a4afc0] transition group-hover:translate-x-1 group-hover:text-[#5268cb]" />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf0f5]">
        <div className={`progress-fill h-full rounded-full ${up ? "bg-[#586cc8]" : "bg-[#e39a44]"}`} style={{ width: `${skill.current}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] items-center text-[10.5px] text-[#8995aa]">
        <span>{skill.history.length} assessments</span>
        <span>{latest.verification}</span>
      </div>
    </button>
  );
}

function SkillDrawer({ skill, onClose }: { skill: SkillDetail; onClose: () => void }) {
  const before = skill.history[0]?.score ?? skill.current;
  const delta = skill.current - before;
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close skill detail" onClick={onClose} className="absolute inset-0 bg-[#07112d]/45 backdrop-blur-sm" />
      <aside className="motion-enter absolute right-0 top-0 grid h-full w-full max-w-[520px] grid-rows-[auto_1fr] overflow-y-auto bg-[#f8f9fc] shadow-2xl">
        <div className="sticky top-0 z-10 grid grid-cols-[1fr_auto] items-center border-b border-[#e1e7f0] bg-[#f8f9fc]/95 px-5 py-4 backdrop-blur-xl">
          <div className="eyebrow">Skill detail</div>
          <button aria-label="Close skill detail" onClick={onClose} className="rounded-lg p-2 text-[#74819a] hover:bg-white grid place-items-center">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 sm:p-7">
          <div className="grid grid-cols-[1fr_auto] items-start gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-[-0.035em] text-[#1c2a47]">{skill.label}</h2>
              <div className="mt-1 text-xs text-[#8995aa]">Current score · latest verified assessment</div>
            </div>
            <div className="text-3xl font-extrabold tracking-[-0.04em] text-[#3048a8]">{skill.current}%</div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#e1e7f0] bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8995aa]">Trend</div>
              <div className={`mt-1 text-sm font-bold ${delta >= 0 ? "text-[#13876f]" : "text-[#bd4c64]"}`}>
                {delta >= 0 ? "+" : ""}{delta} points
              </div>
            </div>
            <div className="rounded-xl border border-[#e1e7f0] bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8995aa]">Verification</div>
              <div className="mt-1 text-sm font-bold text-[#5268cb]">{skill.history.at(-1)?.verification}</div>
            </div>
          </div>
          <section className="mt-7">
            <div className="eyebrow mb-3">Assessment history</div>
            <div className="space-y-2.5">
              {skill.history.map(item => (
                <div key={`${item.date}-${item.assessment}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-[#e1e7f0] bg-white p-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf0ff] text-[#5268cb]">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#52617d]">{item.assessment}</div>
                    <div className="mt-1 text-[10px] text-[#8995aa]">{item.date} · {item.verification}</div>
                  </div>
                  <div className="text-sm font-bold text-[#3048a8]">{item.score}%</div>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-7 rounded-2xl border border-[#dfe5ef] bg-white p-4 sm:p-5">
            <div className="mb-3 grid grid-cols-[auto_1fr] items-center gap-2">
              <Target className="h-4 w-4 text-[#5268cb]" />
              <div className="text-sm font-bold text-[#34415d]">Related skill gaps</div>
            </div>
            {skill.relatedGaps.length ? (
              <ul className="space-y-2 text-xs text-[#bd4c64]">
                {skill.relatedGaps.map(gap => (
                  <li key={gap} className="grid grid-cols-[auto_1fr] items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d75f76]" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid grid-cols-[auto_1fr] items-center gap-2 text-xs text-[#13876f]">
                <CheckCircle2 className="h-4 w-4" />
                <span>No open gaps linked to this skill.</span>
              </div>
            )}
          </section>
          <section className="mt-7">
            <div className="eyebrow mb-3">Related interventions</div>
            <div className="space-y-2">
              {skill.interventions.map(item => (
                <div key={item} className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-xl bg-[#eef1ff] px-3 py-2.5 text-xs font-semibold text-[#5268cb]">
                  <BookOpenCheck className="h-3.5 w-3.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
          {skill.improvement && (
            <section className="mt-7 rounded-2xl border border-[#cfe9df] bg-[#f1faf7] p-4 sm:p-5">
              <div className="mb-1 text-sm font-bold text-[#216f61]">Observed improvement after intervention</div>
              <p className="text-[11px] leading-5 text-[#5f817a]">{skill.improvement.note}</p>
              <div className="mt-4 grid grid-cols-[auto_auto_auto] items-center gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b948b]">Before</div>
                  <div className="text-2xl font-extrabold tracking-[-0.04em] text-[#35766a]">{skill.improvement.before}%</div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-[#16a889]" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b948b]">After</div>
                  <div className="text-2xl font-extrabold tracking-[-0.04em] text-[#13876f]">{skill.improvement.after}%</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-[#35766a]">Intervention · {skill.improvement.intervention}</div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

function SkillsSkeleton() { return <div className="min-h-screen bg-[#f5f7fb] p-6"><div className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-16 rounded-2xl bg-white" /><div className="h-32 rounded-2xl bg-[#dfe5f4]" /><div className="h-80 rounded-2xl bg-white" /></div></div>; }

function TakeAssessmentModal({
  assessments,
  onClose,
  onSubmitted,
}: {
  assessments: any[];
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [selectedId, setSelectedId] = useState(assessments[0]?.id || "");
  const [score, setScore] = useState(85);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const submitMutation = trpc.student.submitAssessment.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    setIsSubmitting(true);
    try {
      const res = await submitMutation.mutateAsync({
        assessmentId: selectedId,
        score,
        answers: { simulated: true },
      });
      setSuccessMsg(`Submitted successfully! Score: ${res.score}% recorded.`);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Failed to submit assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#07112d]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5eaf2] pb-4">
          <div className="eyebrow">Continuous Assessment</div>
          <button onClick={onClose} className="rounded-lg p-1 text-[#64748b] hover:bg-[#f1f5f9]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1.5">Select Assessment</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-xl border border-[#cbd5e1] p-2.5 text-xs font-semibold text-[#1e293b] outline-none focus:ring-2 focus:ring-[#3048a8]"
            >
              {assessments.length === 0 && <option value="">No published assessments available</option>}
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.durationMinutes || 60} mins)
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-[#1e293b]">Simulated Assessment Score</label>
              <span className="font-mono text-sm font-bold text-[#3048a8]">{score}%</span>
            </div>
            <input
              type="range"
              min={40}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full accent-[#3048a8]"
            />
            <div className="flex justify-between text-[10px] text-[#94a3b8] mt-1">
              <span>40% (Needs Work)</span>
              <span>75% (Target)</span>
              <span>100% (Exemplary)</span>
            </div>
          </div>
          {successMsg && (
            <div className="rounded-xl bg-[#ecfdf5] p-3 text-xs font-bold text-[#059669] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {successMsg}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedId}
              className="rounded-xl bg-[#3048a8] px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#253782] disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Attempt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

