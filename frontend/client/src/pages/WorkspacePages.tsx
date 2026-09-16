import PragatiFrame from "@/components/PragatiFrame";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Award, BookOpenCheck, BriefcaseBusiness, Check, Clock3, FileCheck2, GraduationCap, Route, ShieldCheck, Sparkles, Target, UsersRound } from "lucide-react";

const pageCopy: Record<string, { eyebrow: string; title: string; description: string }> = {
  progress: { eyebrow: "Student trajectory", title: "My Progress", description: "See how your academic, skill, and evidence milestones are building toward career readiness." },
  skills: { eyebrow: "Capability map", title: "Skills & Assessments", description: "Track verified skill scores, assessment history, and the interventions that can move your profile forward." },
  internship: { eyebrow: "Evidence trail", title: "Internship Evidence", description: "Collect, organize, and follow the verification state of every internship milestone." },
  passport: { eyebrow: "Shareable profile", title: "Career Passport", description: "A trusted, evidence-aware profile that brings academics, skills, achievements, and opportunities together." },
  mentoring: { eyebrow: "Human support", title: "Mentoring", description: "Turn rule-generated findings into focused conversations, sessions, and measurable outcomes." },
};

export function WorkspacePage({ kind }: { kind: keyof typeof pageCopy }) {
  const copy = pageCopy[kind];
  return <PragatiFrame title={copy.title} activePath={kind === "passport" ? "/career-passport" : `/${kind}`}><main className="dashboard-grid min-h-[calc(100vh-70px)] px-4 pb-12 pt-7 sm:px-7 xl:px-10"><div className="mx-auto max-w-[1240px]"><header className="mb-7"><div className="mb-2 eyebrow">{copy.eyebrow}</div><h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-[#182643] sm:text-[34px]">{copy.title}</h1><p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6c7890]">{copy.description}</p></header>{kind === "progress" && <ProgressPage />}{kind === "skills" && <SkillsPage />}{kind === "internship" && <InternshipPage />}{kind === "passport" && <PassportPage />}{kind === "mentoring" && <MentoringPage />}</div></main></PragatiFrame>;
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
          <div className="text-2xl font-extrabold tracking-[-0.04em] text-[#3048a8]">78%</div>
        </div>
        <div className="mt-8 grid grid-cols-4 h-44 items-end gap-3 border-b border-l border-[#e6ebf3] px-4 pb-0">
          {[54, 62, 71, 78].map((value, index) => (
            <div key={value} className="grid justify-items-center gap-2">
              <div className="w-full rounded-t-xl bg-gradient-to-t from-[#5268cb] to-[#9daaff] transition hover:from-[#3048a8]" style={{ height: `${value * 1.6}px` }} />
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
                <span className="font-bold text-[#3048a8]">{skill.score}%</span>
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
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="premium-card p-6">
        <div className="grid grid-cols-[auto_1fr] items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e9edfb] text-[#3048a8]">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#263653]">Atlas Labs</div>
            <div className="text-xs text-[#8995aa]">Product Engineering Intern</div>
          </div>
        </div>
        <div className="mt-7 h-2 overflow-hidden rounded-full bg-[#edf0f6]">
          <div className="progress-fill h-full w-[68%] rounded-full bg-gradient-to-r from-[#5268cb] to-[#8c7fe0]" />
        </div>
        <div className="mt-2 grid grid-cols-2 text-[10px] text-[#8995aa]">
          <span>68% evidence collected</span>
          <span className="text-right">In progress</span>
        </div>
      </section>
      <section className="premium-card p-6">
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
      </section>
    </div>
  );
}

function PassportPage() {
  return (
    <section className="overflow-hidden rounded-[24px] bg-[#172446] p-6 text-white shadow-[0_20px_45px_rgba(39,62,151,0.17)] sm:p-8">
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
          <button className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#3048a8]">Export Passport</button>
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
          <span className="rounded-full bg-[#eef2fd] px-3 py-1 text-xs font-bold text-[#3048a8]">
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
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9edfb] text-xs font-bold text-[#3048a8]">
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
