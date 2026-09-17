import PragatiFrame from "@/components/PragatiFrame";
import { trpc } from "@/lib/trpc";
import { progressData } from "@shared/pragati";
import { Activity, ArrowDownRight, ArrowUpRight, Award, BarChart3, Check, ChevronDown, Clock3, GraduationCap, HeartPulse, Sparkles, Target, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const chartTooltip = { contentStyle: { borderRadius: 12, border: "1px solid #e2e8f2", boxShadow: "0 12px 30px rgba(31,49,102,.08)", fontSize: 11 }, labelStyle: { color: "#52617d", fontWeight: 700 }, itemStyle: { color: "var(--primary)" } };

export default function Progress() {
  const query = trpc.student.progress.useQuery();
  const [skill, setSkill] = useState("DSA");
  const data = query.data ?? progressData;
  const skillData = useMemo(() => data?.skills.find(item => item.label === skill) ?? data?.skills[0], [data, skill]);
  const skillSeries = (skillData?.values ?? []).map((value, index) => ({ date: skillData.dates[index], score: value }));

  return (
    <PragatiFrame title="My Progress" activePath="/progress">
      <main className="dashboard-grid min-h-[calc(100vh-70px)] px-4 pb-12 pt-7 sm:px-7 xl:px-10">
        <div className="mx-auto max-w-[1420px]">
          {/* Progress Page Header */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-[#71809a]">
              <span>Learner Workspace</span>
              <span className="text-[#d0d8e6]">/</span>
              <span className="text-primary font-bold">My Progress</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-start gap-4 sm:items-end">
              <div>
                <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#182643] sm:text-[34px]">
                  My Progress
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-[#6c7890] leading-relaxed">
                  See how your academic, skill, and evidence milestones are building toward career readiness.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/90 px-4 py-2.5 text-xs font-bold text-blue-800 shadow-2xs">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Consistent upward trend
                </span>
              </div>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
            {[
              ["Current CGPA", "8.42", "+0.18", "bg-primary/10 text-primary"],
              ["Latest SGPA", "8.82", "+0.20", "bg-[#e5f7f2] text-[#13876f]"],
              ["Backlogs", "0", "-2 this year", "bg-[#f0ebff] text-[#7358c9]"],
              ["Verified achievements", "09", "+3 this term", "bg-[#fff1dc] text-[#bd7a27]"],
            ].map(([label, value, delta, tone]) => (
              <div key={label} className="premium-card motion-enter p-4 sm:p-5">
                <div className="mb-4 grid grid-cols-[auto_auto] items-start justify-between">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
                    {label === "Backlogs" ? <HeartPulse className="h-4 w-4" /> : label === "Verified achievements" ? <Target className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#97a2b3]">Trend</span>
                </div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#8490a5]">{label}</div>
                <div className="mt-1 grid grid-flow-col auto-cols-max items-end gap-2">
                  <span className="kpi-value text-[26px] font-extrabold tracking-[-0.04em] text-[#1b2946] sm:text-[28px]">{value}</span>
                  <span className="mb-1 text-[11px] font-bold text-[#16a889]">{delta}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="premium-card p-5 sm:p-6">
              <div className="mb-5 grid grid-cols-[1fr_auto] items-start gap-4">
                <div>
                  <div className="eyebrow mb-2">Academic trajectory</div>
                  <h2 className="text-lg font-bold tracking-tight text-[#1c2a47]">CGPA and SGPA history</h2>
                  <p className="mt-1 text-xs text-[#8995aa]">Semester-by-semester academic movement</p>
                </div>
                <span className="rounded-lg bg-[#f4f6fa] px-2.5 py-2 text-[10px] font-semibold text-[#71809a]">6 semesters</span>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.academic} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#edf0f5" vertical={false} />
                    <XAxis dataKey="semester" tick={{ fill: "#8995aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[7, 9.2]} tick={{ fill: "#8995aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip {...chartTooltip} />
                    <Line type="monotone" dataKey="cgpa" name="CGPA" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="sgpa" name="SGPA" stroke="#8c7fe0" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: "#8c7fe0" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-[auto_auto_1fr] items-center gap-5 text-[10px] font-semibold text-[#71809a]">
                <span className="grid grid-cols-[auto_1fr] items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" /> CGPA
                </span>
                <span className="grid grid-cols-[auto_1fr] items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#8c7fe0]" /> SGPA
                </span>
                <span className="grid grid-cols-[auto_1fr] items-center justify-self-end gap-1 text-[#16a889]">
                  <ArrowUpRight className="h-3.5 w-3.5" /> Consistent upward trend
                </span>
              </div>
            </section>

            <section className="premium-card p-5 sm:p-6">
              <div className="mb-5 grid grid-cols-[1fr_auto] items-start gap-4">
                <div>
                  <div className="eyebrow mb-2">Skill progression</div>
                  <h2 className="text-lg font-bold tracking-tight text-[#1c2a47]">Assessment trend</h2>
                </div>
                <label className="relative">
                  <span className="sr-only">Select skill</span>
                  <select value={skill} onChange={event => setSkill(event.target.value)} className="appearance-none rounded-lg border border-[#dfe5ef] bg-white py-2 pl-3 pr-8 text-[11px] font-semibold text-[#52617d] outline-none focus:ring-2 focus:ring-[#cbd3f6]">
                    {data.skills.map(item => (
                      <option key={item.label}>{item.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-[#8995aa]" />
                </label>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={skillSeries} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#edf0f5" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#8995aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[40, 100]} tick={{ fill: "#8995aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip {...chartTooltip} />
                    <Line type="monotone" dataKey="score" name={skillData.label} stroke="#5268cb" strokeWidth={3} dot={{ r: 5, fill: "#5268cb", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={`mt-4 grid grid-cols-[auto_1fr] items-center gap-2 text-xs font-semibold ${skillSeries.at(-1)!.score >= skillSeries[0].score ? "text-[#13876f]" : "text-[#bd4c64]"}`}>
                {skillSeries.at(-1)!.score >= skillSeries[0].score ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{skillData.label} is at {skillSeries.at(-1)!.score}% in the latest assessment</span>
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="premium-card p-5 sm:p-6">
              <div className="mb-5">
                <div className="eyebrow mb-2">Assessment performance</div>
                <h2 className="text-lg font-bold tracking-tight text-[#1c2a47]">Recent assessment scores</h2>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.assessments} layout="vertical" margin={{ top: 0, right: 10, left: 12, bottom: 0 }}>
                    <CartesianGrid stroke="#edf0f5" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="label" width={110} tick={{ fill: "#71809a", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip {...chartTooltip} />
                    <Bar dataKey="score" name="Score" fill="#586cc8" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="premium-card p-5 sm:p-6">
              <div className="mb-5 grid grid-cols-[1fr_auto] items-start gap-4">
                <div>
                  <div className="eyebrow mb-2">Intervention history</div>
                  <h2 className="text-lg font-bold tracking-tight text-[#1c2a47]">From finding to outcome</h2>
                </div>
                <span className="grid grid-cols-[auto_1fr] items-center gap-1.5 rounded-full bg-[#edf0ff] px-2.5 py-1.5 text-[10px] font-semibold text-[#5268cb]">
                  <Activity className="h-3.5 w-3.5" /> Timeline
                </span>
              </div>
              <div className="space-y-0">
                {data.interventions.map((event, index) => (
                  <div key={event.title} className="grid grid-cols-[40px_1fr] gap-4">
                    <div className="grid w-10 justify-items-center">
                      <span className={`grid h-7 w-7 place-items-center rounded-full ${event.state === "completed" ? "bg-[#e5f7f2] text-[#13876f]" : "bg-[#fff1dc] text-[#bd7a27]"}`}>
                        {event.state === "completed" ? <Check className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                      </span>
                      {index < data.interventions.length - 1 && <span className="h-full min-h-9 w-px bg-[#e5eaf1]" />}
                    </div>
                    <div className="pb-5">
                      <div className="text-[10px] font-semibold text-[#8995aa]">{event.date}</div>
                      <div className="mt-1 text-xs font-bold text-[#52617d]">{event.title}</div>
                      <div className="mt-1 text-[11px] leading-relaxed text-[#8995aa]">{event.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="premium-card p-5 sm:p-6">
              <div className="mb-5 grid grid-cols-[1fr_auto] items-start gap-4">
                <div>
                  <div className="eyebrow mb-2">Backlog history</div>
                  <h2 className="text-lg font-bold tracking-tight text-[#1c2a47]">Academic load over time</h2>
                </div>
                <HeartPulse className="h-4 w-4 text-[#7358c9]" />
              </div>
              <div className="space-y-3">
                {data.academic.map(item => (
                  <div key={item.semester} className="grid grid-cols-[32px_1fr_28px] items-center gap-3">
                    <span className="text-[10px] font-semibold text-[#8995aa]">{item.semester}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-[#edf0f5]">
                      <div className="h-full rounded-full bg-[#8c7fe0] transition-all" style={{ width: `${Math.max(item.backlogs, 0) * 33.33}%` }} />
                    </div>
                    <span className={`text-right text-xs font-bold ${item.backlogs === 0 ? "text-[#13876f]" : "text-[#bd7a27]"}`}>{item.backlogs}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-[11px] text-[#8995aa]">Backlogs reduced from 2 in S1 to 0 in the latest semester.</div>
            </section>

            <section className="premium-card p-5 sm:p-6">
              <div className="mb-5 grid grid-cols-[1fr_auto] items-start gap-4">
                <div>
                  <div className="eyebrow mb-2">Achievement growth</div>
                  <h2 className="text-lg font-bold tracking-tight text-[#1c2a47]">Evidence across categories</h2>
                </div>
                <Award className="h-4 w-4 text-[#bd7a27]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {data.achievements.map(item => (
                  <div key={item.label} className="rounded-xl bg-[#f8f9fc] p-3">
                    <div className="grid grid-cols-[1fr_auto] items-center text-xs font-semibold text-[#52617d]">
                      <span>{item.label}</span>
                      <span className="font-bold text-primary">{item.count}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e9edf4]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#5268cb] to-[#9daaff]" style={{ width: `${Math.min(item.count * 18, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="premium-card mt-5 overflow-hidden p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <div className="mb-2 grid grid-cols-[auto_1fr] items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#e5f7f2] text-[#13876f]">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <span className="eyebrow text-[#35766a]">Intervention impact</span>
                </div>
                <h2 className="text-lg font-bold tracking-tight text-[#1c2a47]">Observed progress before and after support</h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-[#8995aa]">The comparison below is observed progress in the record. It should not be interpreted as causal proof.</p>
              </div>
              <div className="rounded-xl bg-[#f1faf7] px-3 py-2 text-xs font-bold text-[#13876f]">{data.interventionImpact.intervention}</div>
            </div>
            <div className="mt-6 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
              <div className="rounded-2xl border border-[#f1d7a7] bg-[#fffaf1] p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#a58a65]">Before intervention</div>
                <div className="mt-2 grid grid-flow-col auto-cols-max items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-[-0.04em] text-[#a96d1c]">{data.interventionImpact.skill} {data.interventionImpact.before}%</span>
                </div>
              </div>
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#e5f7f2] text-[#16a889]">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div className="rounded-2xl border border-[#cfe9df] bg-[#f1faf7] p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b948b]">After intervention</div>
                <div className="mt-2 grid grid-flow-col auto-cols-max items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-[-0.04em] text-[#13876f]">{data.interventionImpact.skill} {data.interventionImpact.after}%</span>
                  <span className="text-xs font-bold text-[#16a889]">+{data.interventionImpact.after - data.interventionImpact.before} points</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-[11px] text-[#5f817a]">{data.interventionImpact.note}</div>
          </section>

          <footer className="mt-10 grid grid-cols-1 gap-2 border-t border-[#e0e6f0] pt-5 text-[11px] text-[#8290a7] sm:grid-cols-[1fr_auto]">
            <span>PRAGATI · Progress is measured across academic and verified evidence signals</span>
            <span className="grid grid-cols-[auto_1fr] items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-[#5268cb]" />
              <span>Interactive trends · seeded API contract</span>
            </span>
          </footer>
        </div>
      </main>
    </PragatiFrame>
  );
}

function ProgressSkeleton() { return <div className="min-h-screen bg-[#f5f7fb] p-6"><div className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-16 rounded-2xl bg-white" /><div className="h-32 rounded-2xl bg-[#dfe5f4]" /><div className="grid grid-cols-4 gap-4"><div className="col-span-4 h-24 rounded-2xl bg-white" /></div><div className="h-80 rounded-2xl bg-white" /></div></div>; }

