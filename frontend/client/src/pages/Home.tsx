import { trpc } from "@/lib/trpc";
import type { StudentDashboard } from "@shared/pragati";
import {
  Activity,
  AlertTriangle,
  Award,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Route,
  Search,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UploadCloud,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import UserNav from "@/components/UserNav";

type IconType = typeof LayoutDashboard;

const navigation: { label: string; icon: IconType }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My progress", icon: TrendingUp },
  { label: "Skills & assessments", icon: Activity },
  { label: "Achievements", icon: Award },
  { label: "Internship evidence", icon: BriefcaseBusiness },
  { label: "Opportunities", icon: Target },
  { label: "Career Passport", icon: Route },
];

const utilityNavigation: { label: string; icon: IconType }[] = [
  { label: "Mentoring", icon: UsersRound },
  { label: "Notifications", icon: Bell },
  { label: "Settings", icon: Settings2 },
];

const routeByLabel: Record<string, string> = {
  "My progress": "/progress",
  "Skills & assessments": "/skills",
  Achievements: "/achievements",
  "Internship evidence": "/internship",
  Opportunities: "/opportunities",
  "Career Passport": "/career-passport",
  Mentoring: "/mentoring",
};

const routeByActionTitle: Record<string, string> = {
  "Complete OS mentoring": "/mentoring",
  "Upload internship report": "/internship",
  "Explore eligible drives": "/opportunities",
};

function formatName(name: string) {
  return name.split(" ")[0] ?? name;
}

export default function Home() {
  const dashboardQuery = trpc.student.dashboard.useQuery();
  const [activeSection, setActiveSection] = useState("Overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navigate = (label: string) => {
    if (label !== "Overview") {
      const route = routeByLabel[label];
      if (route) window.location.assign(route);
      else toast.info(`${label} is next in the PRAGATI build sequence`);
      setMobileNavOpen(false);
      return;
    }
    setActiveSection("Overview");
    setMobileNavOpen(false);
  };

  if (dashboardQuery.isLoading) return <DashboardSkeleton />;
  if (dashboardQuery.isError || !dashboardQuery.data) {
    return <DashboardError onRetry={() => dashboardQuery.refetch()} />;
  }

  const data = dashboardQuery.data;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#15223b]">
      <div className="grid min-h-screen lg:grid-cols-[246px_1fr]">
        <aside className="sticky top-0 self-start hidden h-screen bg-[#172446] text-white lg:grid lg:grid-rows-[auto_1fr_auto] overflow-hidden z-40">
          <SidebarBrand />
          <div className="overflow-y-auto px-3 pb-6">
            <div className="mb-3 px-3 pt-2 text-[10.5px] font-bold uppercase tracking-[0.09em] text-[#8b99bd]">Workspace</div>
            <nav aria-label="Primary navigation" className="grid gap-1">
              {navigation.map(item => (
                <SidebarNavItem key={item.label} item={item} active={activeSection === item.label} onClick={() => navigate(item.label)} />
              ))}
            </nav>
            <div className="mb-3 mt-9 px-3 text-[10.5px] font-bold uppercase tracking-[0.09em] text-[#8b99bd]">Workspace tools</div>
            <nav aria-label="Utility navigation" className="grid gap-1">
              {utilityNavigation.map(item => (
                <SidebarNavItem key={item.label} item={item} active={activeSection === item.label} onClick={() => navigate(item.label)} />
              ))}
            </nav>
          </div>
          <div className="m-3 rounded-xl border border-white/10 bg-white/[0.055] p-3">
            <div className="mb-2 grid grid-cols-[auto_1fr] items-center gap-2 text-[#bfcaff]">
              <CircleHelp className="h-4 w-4" />
              <span className="text-xs font-semibold">Need a hand?</span>
            </div>
            <p className="mb-3 text-[11px] leading-4 text-[#98a7cc]">Your mentor can help you turn a skill gap into your next opportunity.</p>
            <button onClick={() => navigate("Mentoring")} className="grid grid-cols-[1fr_auto] items-center rounded-lg bg-[#3048a8] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#3e59bf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9daaff]">
              <span>Open mentoring</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>

        <div className="min-w-0 grid grid-rows-[auto_1fr]">
          <header className="sticky top-0 z-30 border-b border-[#e2e8f2]/90 bg-[#f5f7fb]/90 backdrop-blur-xl">
            <div className="grid h-[70px] grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-7 xl:px-10">
              <div className="grid grid-flow-col auto-cols-max items-center gap-3">
                <button aria-label="Open navigation" onClick={() => setMobileNavOpen(true)} className="rounded-lg p-2 text-[#52617d] hover:bg-white lg:hidden">
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <div className="hidden grid-flow-col auto-cols-max items-center gap-2 text-[11px] font-semibold text-[#71809a] sm:grid">
                    <span>Student workspace</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-[#3048a8]">{activeSection}</span>
                  </div>
                  <div className="truncate text-sm font-bold text-[#182643] sm:hidden">PRAGATI / {activeSection}</div>
                </div>
              </div>
              <div className="grid grid-flow-col auto-cols-max items-center gap-2 sm:gap-3">
                <div className="hidden h-10 w-[230px] grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-[#dfe5ef] bg-white px-3 text-[#8994a8] shadow-sm md:grid">
                  <Search className="h-4 w-4" />
                  <span className="text-xs">Search your progress</span>
                  <span className="rounded border border-[#e3e8f1] px-1.5 py-0.5 font-mono text-[10px] text-[#9ca7b9]">⌘ K</span>
                </div>
                <button aria-label="Help" className="hidden rounded-lg p-2 text-[#687691] hover:bg-white sm:grid place-items-center">
                  <CircleHelp className="h-[18px] w-[18px]" />
                </button>
                <button aria-label="Notifications" className="relative rounded-lg p-2 text-[#687691] hover:bg-white grid place-items-center">
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#e39a44] ring-2 ring-[#f5f7fb]" />
                </button>
                <div className="ml-1 hidden h-8 w-px bg-[#e2e8f2] sm:block" />
                <UserNav />
              </div>
            </div>
          </header>

          {mobileNavOpen && <MobileNav activeSection={activeSection} onClose={() => setMobileNavOpen(false)} onNavigate={navigate} />}

          <main className="dashboard-grid min-h-[calc(100vh-70px)] px-4 pb-12 pt-7 sm:px-7 xl:px-10">
            <div className="mx-auto max-w-[1420px]">
              <div className="mb-7 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <div className="mb-2 grid grid-flow-col auto-cols-max items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#16a889] shadow-[0_0_0_4px_rgba(22,168,137,0.12)]" />
                    <span className="eyebrow">Live student profile</span>
                  </div>
                  <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#182643] sm:text-[34px]">Good morning, {formatName(data.student.name)}.</h1>
                  <p className="mt-1 text-sm text-[#6c7890]">Here&apos;s the clearest view of your progress toward career readiness.</p>
                </div>
                <div className="grid grid-flow-col auto-cols-max items-center gap-2">
                  <button className="grid grid-flow-col auto-cols-max items-center gap-2 rounded-xl border border-[#dce3ef] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#52617d] shadow-sm transition hover:border-[#bec9df]">
                    <Download className="h-3.5 w-3.5" /> Export overview
                  </button>
                  <button onClick={() => window.location.assign("/internship")} className="grid grid-flow-col auto-cols-max items-center gap-2 rounded-xl bg-[#3048a8] px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_6px_14px_rgba(48,72,168,0.2)] transition hover:bg-[#3c57be]">
                    <UploadCloud className="h-3.5 w-3.5" /> Add evidence
                  </button>
                </div>
              </div>

              <ReadinessHero data={data} />
              <MetricGrid data={data} />

              <div className="mt-5 grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
                <SkillProfile data={data} />
                <SkillGap data={data} />
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
                <InternshipCard data={data} />
                <CareerTimeline data={data} />
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.64fr]">
                <NextActions data={data} />
                <AiExplanation data={data} />
              </div>

              <footer className="mt-10 grid gap-2 border-t border-[#e0e6f0] pt-5 text-[11px] text-[#8290a7] sm:grid-cols-[1fr_auto] sm:items-center">
                <span>PRAGATI · From Student Progress to Career Readiness</span>
                <span className="grid grid-flow-col auto-cols-max items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#16a889]" /> Evidence-aware by design · v0.1 foundation
                </span>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="grid h-[92px] grid-cols-[auto_1fr] items-center gap-3 px-6">
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#8393ee] text-[#172446] shadow-[0_8px_20px_rgba(116,135,235,0.3)]">
        <span className="text-lg font-extrabold">P</span>
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#a7e3d3]" />
      </div>
      <div>
        <div className="text-[17px] font-extrabold tracking-[-0.04em]">PRAGATI</div>
        <div className="text-[9px] font-semibold uppercase tracking-[0.09em] text-[#8e9bc0]">Student intelligence</div>
      </div>
    </div>
  );
}

function SidebarNavItem({ item, active, onClick }: { item: { label: string; icon: IconType }; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition ${
        active ? "bg-[#3048a8] text-white shadow-[0_7px_16px_rgba(11,20,52,0.18)] font-semibold" : "text-[#aab6d4] hover:bg-white/[0.06] hover:text-white font-medium"
      }`}
    >
      <Icon className={`h-[17px] w-[17px] shrink-0 ${active ? "text-[#cbd2ff]" : "text-[#8290b7] group-hover:text-[#b9c4e6]"}`} />
      <span>{item.label}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-[#a8e2d4]" />}
    </button>
  );
}

function MobileNav({ activeSection, onClose, onNavigate }: { activeSection: string; onClose: () => void; onNavigate: (label: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button aria-label="Close navigation" onClick={onClose} className="absolute inset-0 bg-[#07112d]/50 backdrop-blur-sm" />
      <aside className="relative grid h-full w-[276px] grid-rows-[auto_1fr] bg-[#172446] text-white shadow-2xl">
        <div className="grid grid-cols-[1fr_auto] items-center">
          <SidebarBrand />
          <button aria-label="Close menu" onClick={onClose} className="mr-4 rounded-lg p-2 text-[#aab6d4] hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-3 overflow-y-auto">
          <div className="mb-3 px-3 text-[10.5px] font-bold uppercase tracking-[0.09em] text-[#8b99bd]">Workspace</div>
          <div className="grid gap-1">
            {navigation.map(item => (
              <SidebarNavItem key={item.label} item={item} active={activeSection === item.label} onClick={() => onNavigate(item.label)} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function ReadinessHero({ data }: { data: StudentDashboard }) {
  const circumference = 2 * Math.PI * 66;
  const offset = circumference - (data.readiness.score / 100) * circumference;
  const [showMethodology, setShowMethodology] = useState(false);
  return (
    <section className="hero-glow hero-enter overflow-visible rounded-[24px] p-5 text-white shadow-[0_20px_45px_rgba(39,62,151,0.2)] sm:p-7">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.88fr]">
        <div>
          <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.09em] text-[#bec8ff]">
            <Sparkles className="h-3.5 w-3.5" /> Readiness indicators · 12 Sep 2026
          </div>
          <h2 className="max-w-[530px] text-[27px] font-extrabold leading-[1.1] tracking-[-0.035em] sm:text-[38px]">
            Your progress is moving in the right direction.
          </h2>
          <p className="mt-4 max-w-[510px] text-sm leading-relaxed text-[#d5dcfb]">
            You&apos;ve made the strongest gains in DSA and Python this cycle. One focused intervention can unlock your next opportunity.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={() => window.location.assign("/progress")} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#3048a8] shadow-lg transition hover:bg-[#f0f2ff]">
              View my progress <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <span className="flex items-center gap-2 text-xs font-medium text-[#bfcaff]">
              <ShieldCheck className="h-4 w-4 text-[#a7e3d3]" /> Based on verified evidence
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#101b43]/30 p-4 sm:p-5">
          <div className="flex items-center gap-5">
            <div className="relative h-[150px] w-[150px] shrink-0">
              <svg viewBox="0 0 160 160" className="h-full w-full">
                <circle cx="80" cy="80" r="66" fill="none" strokeWidth="11" className="ring-track" />
                <circle cx="80" cy="80" r="66" fill="none" strokeWidth="11" strokeDasharray={circumference} strokeDashoffset={offset} className="ring-progress" />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="text-[36px] font-extrabold tracking-[-0.04em]">
                    {data.readiness.score}<span className="text-lg text-[#b9c5ff]">%</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#bec8ff]">Progress</div>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#cdd5fa]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#a7e3d3]" /> Up {data.readiness.delta}% from last assessment
              </div>
              <p className="text-[11px] leading-5 text-[#abb8df]">{data.readiness.methodology}</p>
              <button onClick={() => setShowMethodology(current => !current)} className="mt-3 flex items-center gap-1 text-[11px] font-bold text-white hover:text-[#cad2ff]">
                {showMethodology ? "Hide methodology" : "How this is calculated"} <ChevronRight className={`h-3 w-3 transition-transform ${showMethodology ? "rotate-90" : ""}`} />
              </button>
            </div>
          </div>
          {showMethodology && (
            <div role="dialog" aria-modal="true" aria-label="Readiness methodology" className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-[#172446] p-6 shadow-2xl">
              <button onClick={() => setShowMethodology(false)} className="mb-8 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">Close methodology</button>
              <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#bec8ff]">Transparent weighting</div>
              <div className="grid grid-cols-2 gap-2">
                {data.readiness.indicators.map(indicator => (
                  <div key={indicator.label} className="rounded-xl bg-white/[0.07] p-2.5">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-[#dbe1ff]">
                      <span>{indicator.label}</span>
                      <span className="font-bold text-[#a7e3d3]">{indicator.score}%</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="progress-fill h-full rounded-full bg-[#9daaff]" style={{ width: `${indicator.score}%` }} />
                    </div>
                    <div className="mt-1 text-[9px] text-[#9eabd3]">Weight {indicator.weight}%</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] leading-4 text-[#9eabd3]">{data.readiness.formula}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const toneClasses = { indigo: "bg-[#edf0ff] text-[#3048a8]", violet: "bg-[#f0ebff] text-[#7358c9]", emerald: "bg-[#e5f7f2] text-[#13876f]", amber: "bg-[#fff2df] text-[#bb741e]" };
const metricIcons = [GraduationCap, ShieldCheck, FileCheck2, BriefcaseBusiness];

function MetricGrid({ data }: { data: StudentDashboard }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
      {data.metrics.map((metric, index) => {
        const Icon = metricIcons[index] ?? Activity;
        return (
          <article key={metric.label} className={`premium-card motion-enter motion-delay-${index + 1} p-4 sm:p-5`}>
            <div className="mb-4 flex items-start justify-between">
              <div className={`grid h-9 w-9 place-items-center rounded-xl ${toneClasses[metric.tone]}`}>
                <Icon className="h-[17px] w-[17px]" />
              </div>
              <button aria-label={`More options for ${metric.label}`} className="rounded-lg p-1 text-[#a2adbf] hover:bg-[#f1f4f9]">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-[#8490a5]">{metric.label}</div>
            <div className="mt-1 flex items-end gap-2">
              <span className="kpi-value text-[25px] font-extrabold tracking-[-0.04em] text-[#1b2946] sm:text-[28px]">
                {metric.value}
              </span>
              <span className="mb-1 text-[11px] font-bold text-[#16a889]">{metric.delta}</span>
            </div>
            <div className="mt-1 text-[11px] text-[#8995aa]">{metric.helper}</div>
          </article>
        );
      })}
    </div>
  );
}

function SkillProfile({ data }: { data: StudentDashboard }) {
  const points = useMemo(() => data.skillProfile.map((skill, index) => { const angle = -Math.PI / 2 + (index * 2 * Math.PI) / data.skillProfile.length; const radius = 66 * (skill.score / 100); return `${90 + Math.cos(angle) * radius},${90 + Math.sin(angle) * radius}`; }).join(" "), [data.skillProfile]);
  const axis = useMemo(() => data.skillProfile.map((_, index) => { const angle = -Math.PI / 2 + (index * 2 * Math.PI) / data.skillProfile.length; return { x: 90 + Math.cos(angle) * 66, y: 90 + Math.sin(angle) * 66 }; }), [data.skillProfile]);
  return <section className="premium-card motion-enter motion-delay-2 p-5 sm:p-6"><div className="mb-5 flex items-start justify-between"><div><div className="eyebrow mb-2">Capability map</div><h3 className="text-lg font-bold tracking-tight text-[#1c2a47]">Skill profile</h3><p className="mt-1 text-xs text-[#7d899f]">Latest verified assessment · Sep 2026</p></div><button onClick={() => window.location.assign("/skills")} className="flex items-center gap-1.5 rounded-lg border border-[#e0e6f0] px-2.5 py-2 text-[11px] font-semibold text-[#52617d] hover:bg-[#f5f7fb]">View all <ArrowUpRight className="h-3 w-3" /></button></div><div className="grid items-center gap-4 sm:grid-cols-[210px_1fr] sm:gap-6"><div className="mx-auto h-[205px] w-[205px]"><svg viewBox="0 0 180 180" className="h-full w-full overflow-visible"><polygon points={axis.map(point => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#e8edf5" strokeWidth="1" />{[0.5, 0.75].map(scale => <polygon key={scale} points={axis.map(point => `${90 + (point.x - 90) * scale},${90 + (point.y - 90) * scale}`).join(" ")} fill="none" stroke="#e8edf5" strokeWidth="1" />)}{axis.map((point, index) => <line key={index} x1="90" y1="90" x2={point.x} y2={point.y} stroke="#eef1f6" strokeWidth="1" />)}<polygon points={points} fill="rgba(48,72,168,0.16)" stroke="#5268cb" strokeWidth="2.5" />{axis.map((point, index) => <circle key={index} cx={90 + (point.x - 90) * (data.skillProfile[index].score / 100)} cy={90 + (point.y - 90) * (data.skillProfile[index].score / 100)} r="3.5" fill="#5268cb" stroke="white" strokeWidth="1.5" />)}{axis.map((point, index) => <text key={index} x={90 + (point.x - 90) * 1.18} y={90 + (point.y - 90) * 1.18} textAnchor="middle" dominantBaseline="middle" className="fill-[#7f8ba2] text-[8px] font-bold">{data.skillProfile[index].label}</text>)}</svg></div><div className="grid grid-cols-2 gap-x-5 gap-y-4">{data.skillProfile.map(skill => <div key={skill.label} className="group"><div className="mb-1.5 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-[#43516c]">{skill.label}</span><span className="text-[11px] font-bold text-[#182643]">{skill.score}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#edf0f5]"><div className={`progress-fill h-full rounded-full ${skill.score < 65 ? "bg-[#e39a44]" : "bg-[#586cc8]"}`} style={{ width: `${skill.score}%` }} /></div><div className={`mt-1 text-[10px] font-semibold ${skill.delta >= 0 ? "text-[#16a889]" : "text-[#c57935]"}`}>{skill.delta >= 0 ? "↑" : "↓"} {Math.abs(skill.delta)}% <span className="font-normal text-[#9aa5b7]">trend</span></div></div>)}</div></div></section>;
}

function SkillGap({ data }: { data: StudentDashboard }) {
  return <section className="motion-enter motion-delay-3 flex flex-col overflow-hidden rounded-2xl border border-[#f1d7a7] bg-[#fffaf1] p-5 shadow-[0_16px_42px_rgba(139,91,24,0.06)] sm:p-6"><div className="flex items-start justify-between"><div><div className="mb-2 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff0d2] text-[#bd7a27]"><AlertTriangle className="h-4 w-4" /></span><span className="eyebrow text-[#ae7a3a]">Rule-generated finding</span></div><h3 className="text-lg font-bold tracking-tight text-[#4a3418]">Skill gap detected</h3></div><span className="rounded-full bg-[#fbe7bb] px-2.5 py-1 text-[10px] font-semibold text-[#a96d1c]">Needs attention</span></div><p className="mt-4 text-sm leading-5 text-[#7e6545]">{data.skillGap.skill} performance declined across two consecutive assessment cycles.</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-[#f1ddb9] bg-white/60 p-3"><div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#a58a65]">Current</div><div className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#a96d1c]">{data.skillGap.current}%</div></div><div className="rounded-xl border border-[#f1ddb9] bg-white/60 p-3"><div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#a58a65]">Previous</div><div className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#6d5b44]">{data.skillGap.previous}%</div></div></div><div className="mt-4 flex items-start gap-2 text-xs text-[#8f7555]"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{data.skillGap.reason}</span></div><button onClick={() => window.location.assign("/mentoring")} className="mt-auto flex items-center gap-2 pt-6 text-xs font-semibold text-[#9a6318] hover:text-[#754a10]">View {data.skillGap.skill} intervention plan <ArrowRight className="h-3.5 w-3.5" /></button></section>;
}

function InternshipCard({ data }: { data: StudentDashboard }) {
  const steps = data.internship.evidence;
  const evidenceProgress = Math.round((steps.filter(item => item.state === "verified").length / steps.length) * 100);
  return <section className="premium-card motion-enter motion-delay-2 p-5 sm:p-6"><div className="mb-5 flex items-start justify-between"><div><div className="eyebrow mb-2">Evidence trail</div><h3 className="text-lg font-bold tracking-tight text-[#1c2a47]">Internship progress</h3></div><span className="flex items-center gap-1.5 rounded-full bg-[#e5f7f2] px-2.5 py-1.5 text-[10px] font-semibold text-[#13876f]"><span className="h-1.5 w-1.5 rounded-full bg-[#16a889]" /> {data.internship.status}</span></div><div className="mb-5 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e9edfb] text-[#3048a8]"><BriefcaseBusiness className="h-5 w-5" /></div><div><div className="text-sm font-bold text-[#273652]">{data.internship.company}</div><div className="text-xs text-[#7f8ba1]">{data.internship.role}</div></div><div className="ml-auto text-right"><div className="text-lg font-extrabold tracking-tight text-[#3048a8]">{evidenceProgress}%</div><div className="text-[10.5px] font-medium text-[#8792a6]">evidence collected</div></div></div><div className="mb-5 h-2 overflow-hidden rounded-full bg-[#edf0f6]"><div className="progress-fill h-full rounded-full bg-gradient-to-r from-[#5268cb] to-[#8c7fe0]" style={{ width: `${evidenceProgress}%` }} /></div><div className="grid grid-cols-5 gap-1">{steps.map((step, index) => <div key={step.label} className="relative text-center"><div className={`mx-auto mb-2 grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${index < 3 ? "bg-[#e5f7f2] text-[#13876f]" : index === 3 ? "bg-[#fff0d2] text-[#bd7a27]" : "bg-[#eef1f6] text-[#95a1b3]"}`}>{index < 3 ? <Check className="h-3.5 w-3.5" /> : index === 3 ? <Clock3 className="h-3.5 w-3.5" /> : index + 1}</div><div className="text-[9px] font-semibold leading-3 text-[#7d899f]">{step.label}</div></div>)}</div><div className="mt-5 flex items-center justify-between rounded-xl bg-[#f7f8fc] px-3 py-2.5"><div className="flex items-center gap-2 text-xs text-[#65728b]"><FileCheck2 className="h-3.5 w-3.5 text-[#5268cb]" /> Next: <strong className="text-[#34415d]">{data.internship.nextMilestone}</strong></div><ChevronRight className="h-3.5 w-3.5 text-[#9ca7b8]" /></div></section>;
}

function CareerTimeline({ data }: { data: StudentDashboard }) {
  return <section className="premium-card motion-enter motion-delay-3 p-5 sm:p-6"><div className="mb-5 flex items-start justify-between"><div><div className="eyebrow mb-2">Your journey</div><h3 className="text-lg font-bold tracking-tight text-[#1c2a47]">Career timeline</h3></div><button aria-label="More timeline options" className="rounded-lg p-1 text-[#9da8ba] hover:bg-[#f1f4f9]"><MoreHorizontal className="h-4 w-4" /></button></div><div className="space-y-0">{data.timeline.map((event, index) => <div key={`${event.year}-${event.title}`} className="group flex gap-4"><div className="flex w-12 shrink-0 flex-col items-center"><span className={`relative z-10 grid h-7 w-7 place-items-center rounded-full border-[3px] text-[10px] font-bold ${event.state === "complete" ? "border-[#d9f1ea] bg-[#16a889] text-white" : event.state === "current" ? "border-[#e2e7ff] bg-[#586cc8] text-white" : "border-[#edf0f5] bg-white text-[#a2adbd]"}`}>{event.state === "complete" ? <Check className="h-3.5 w-3.5" /> : event.state === "current" ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : index + 1}</span>{index < data.timeline.length - 1 && <span className="h-full min-h-8 w-px bg-[#e4e9f1]" />}</div><div className="pb-5 pt-0.5"><div className="mb-1 flex items-center gap-2"><span className="text-[10px] font-medium text-[#8995a9]">{event.year}</span>{event.state === "current" && <span className="rounded-full bg-[#edf0ff] px-1.5 py-0.5 text-[9px] font-semibold text-[#5268cb]">In progress</span>}</div><div className="text-xs font-bold text-[#34415d]">{event.title}</div><div className="mt-1 text-[11px] leading-relaxed text-[#8995aa]">{event.detail}</div></div></div>)}</div></section>;
}

// Future backend-driven feed: the Overview only renders the typed API response.
// It does not own or calculate action recommendations in the UI.
function NextActions({ data }: { data: StudentDashboard }) {
  return <section className="premium-card motion-enter motion-delay-3 p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><div className="eyebrow mb-2">Keep moving</div><h3 className="text-lg font-bold tracking-tight text-[#1c2a47]">Your next best actions</h3></div><span className="rounded-full bg-[#edf0ff] px-2.5 py-1 text-[10px] font-semibold text-[#5268cb]">3 items</span></div><div className="divide-y divide-[#edf0f4]">{data.actions.map((action, index) => <button key={action.title} onClick={() => window.location.assign(routeByActionTitle[action.title] ?? "/progress")} className="group flex w-full items-center gap-3 py-3.5 text-left first:pt-2 last:pb-1"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${index === 0 ? "bg-[#edf0ff] text-[#5268cb]" : index === 1 ? "bg-[#fff1dc] text-[#bd7a27]" : "bg-[#f0ebff] text-[#7358c9]"}`}>{index === 0 ? <UsersRound className="h-4 w-4" /> : index === 1 ? <UploadCloud className="h-4 w-4" /> : <Target className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-[#34415d]">{action.title}</span><span className="mt-1 block truncate text-[11px] text-[#8995aa]">{action.detail}</span></span><span className={`hidden rounded-full px-2 py-1 text-[9px] font-semibold sm:block ${action.tone === "blue" ? "bg-[#edf0ff] text-[#5268cb]" : action.tone === "amber" ? "bg-[#fff1dc] text-[#a96d1c]" : "bg-[#f0ebff] text-[#7358c9]"}`}>{action.tag}</span><ChevronRight className="h-4 w-4 shrink-0 text-[#a4afc0] transition group-hover:translate-x-0.5 group-hover:text-[#5268cb]" /></button>)}</div></section>;
}

function AiExplanation({ data }: { data: StudentDashboard }) {
  return <section className="motion-enter motion-delay-4 overflow-hidden rounded-2xl border border-[#ddd6fb] bg-[#f8f6ff] p-5 shadow-[0_16px_42px_rgba(107,83,191,0.07)] sm:p-6"><div className="mb-4 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#e9e2ff] text-[#7358c9]"><Sparkles className="h-4 w-4" /></span><div><div className="eyebrow text-[#806fc4]">AI-generated explanation</div><div className="mt-0.5 text-[10px] text-[#9a8ed0]">Contextual guidance · not an institutional decision</div></div></div><p className="text-sm leading-6 text-[#5d5285]">Your {data.skillGap.skill} performance has declined across two consecutive assessment cycles while an active backlog remains open.</p><div className="mt-5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#8d80c3]">Suggested actions</div><ul className="mt-3 space-y-2.5 text-xs font-semibold text-[#665b8b]"><li className="flex items-center gap-2"><span className="grid h-4 w-4 place-items-center rounded-full bg-[#e7defd] text-[#7358c9]"><Check className="h-2.5 w-2.5" /></span>{data.skillGap.skill} mentoring session</li><li className="flex items-center gap-2"><span className="grid h-4 w-4 place-items-center rounded-full bg-[#e7defd] text-[#7358c9]"><Check className="h-2.5 w-2.5" /></span>Practice assessment</li><li className="flex items-center gap-2"><span className="grid h-4 w-4 place-items-center rounded-full bg-[#e7defd] text-[#7358c9]"><Check className="h-2.5 w-2.5" /></span>Peer learning session</li></ul><button onClick={() => window.location.assign("/mentoring")} className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#7358c9] hover:text-[#5744a8]">Explore support options <ArrowRight className="h-3.5 w-3.5" /></button></section>;
}

function DashboardSkeleton() {
  return <div className="min-h-screen bg-[#f5f7fb] p-6"><div className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-16 rounded-2xl bg-white" /><div className="h-64 rounded-[24px] bg-[#dfe5f4]" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(item => <div key={item} className="h-32 rounded-2xl bg-white" />)}</div><div className="h-72 rounded-2xl bg-white" /></div></div>;
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return <div className="grid min-h-screen place-items-center bg-[#f5f7fb] p-6"><div className="premium-card max-w-md p-8 text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1dc] text-[#bd7a27]"><AlertTriangle className="h-5 w-5" /></div><h1 className="text-xl font-extrabold text-[#1c2a47]">We couldn&apos;t load your progress</h1><p className="mt-2 text-sm leading-6 text-[#71809a]">Your student data is safe. Try again, or return once the platform connection is restored.</p><button onClick={onRetry} className="mt-5 rounded-xl bg-[#3048a8] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#3c57be]">Try again</button></div></div>;
}
