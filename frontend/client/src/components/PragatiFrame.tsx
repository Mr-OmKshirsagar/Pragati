import {
  Activity,
  Award,
  Bell,
  BriefcaseBusiness,
  CircleHelp,
  LayoutDashboard,
  Menu,
  Route,
  Settings2,
  Target,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

type Props = { children: React.ReactNode; title: string; activePath: string };
type NavItem = { label: string; path: string; icon: typeof LayoutDashboard };

const workspace: NavItem[] = [
  { label: "Overview", path: "/overview", icon: LayoutDashboard },
  { label: "My Progress", path: "/progress", icon: TrendingUp },
  { label: "Skills & Assessments", path: "/skills", icon: Activity },
  { label: "Achievements", path: "/achievements", icon: Award },
  { label: "Internship Evidence", path: "/internship", icon: BriefcaseBusiness },
  { label: "Opportunities", path: "/opportunities", icon: Target },
  { label: "Career Passport", path: "/career-passport", icon: Route },
];
const support: NavItem[] = [
  { label: "Mentoring", path: "/mentoring", icon: UsersRound },
  { label: "Notifications", path: "/progress#notifications", icon: Bell },
  { label: "Settings", path: "/progress#settings", icon: Settings2 },
];

export default function PragatiFrame({ children, title, activePath }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, navigate] = useLocation();
  const nav = (item: NavItem) => {
    if (item.path.includes("#")) {
      navigate(item.path.split("#")[0]);
      return;
    }
    setMobileOpen(false);
  };
  return <div className="min-h-screen bg-[#f5f7fb] text-[#15223b]"><div className="flex min-h-screen"><aside className="hidden w-[246px] shrink-0 flex-col bg-[#172446] text-white lg:flex"><Brand /><div className="flex-1 overflow-y-auto px-3 pb-6"><NavGroup label="Workspace" items={workspace} activePath={activePath} onNavigate={nav} /><NavGroup label="Support" items={support} activePath={activePath} onNavigate={nav} /></div><HelpCard /></aside><div className="min-w-0 flex-1"><header className="sticky top-0 z-30 border-b border-[#e2e8f2]/90 bg-[#f5f7fb]/90 backdrop-blur-xl"><div className="flex h-[70px] items-center justify-between gap-4 px-4 sm:px-7 xl:px-10"><div className="flex min-w-0 items-center gap-3"><button aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-[#52617d] hover:bg-white lg:hidden"><Menu className="h-5 w-5" /></button><div className="hidden items-center gap-2 text-[11px] font-semibold text-[#71809a] sm:flex"><span>Student workspace</span><span className="text-[#b0bacb]">/</span><span className="text-[#3048a8]">{title}</span></div><div className="truncate text-sm font-bold text-[#182643] sm:hidden">PRAGATI / {title}</div></div><div className="flex items-center gap-2 sm:gap-3"><div className="hidden h-10 w-[230px] items-center gap-2 rounded-xl border border-[#dfe5ef] bg-white px-3 text-[#8994a8] shadow-sm md:flex"><span className="text-xs">Search your workspace</span><span className="ml-auto rounded border border-[#e3e8f1] px-1.5 py-0.5 font-mono text-[10px]">⌘ K</span></div><button aria-label="Help" className="hidden rounded-lg p-2 text-[#687691] hover:bg-white sm:block"><CircleHelp className="h-[18px] w-[18px]" /></button><button aria-label="Notifications" className="relative rounded-lg p-2 text-[#687691] hover:bg-white"><Bell className="h-[18px] w-[18px]" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#e39a44] ring-2 ring-[#f5f7fb]" /></button><div className="ml-1 hidden h-8 w-px bg-[#e2e8f2] sm:block" /><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#3048a8] text-[11px] font-bold text-white">RS</span><span className="hidden text-xs font-semibold text-[#304063] md:block">Rahul Sharma</span></div></div></div></header>{mobileOpen && <MobileNav activePath={activePath} onClose={() => setMobileOpen(false)} />}{children}</div></div></div>;
}

function Brand() { return <div className="flex h-[92px] items-center gap-3 px-6"><div className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#8393ee] text-[#172446] shadow-[0_8px_20px_rgba(116,135,235,0.3)]"><span className="text-lg font-extrabold">P</span><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#a7e3d3]" /></div><div><div className="text-[17px] font-extrabold tracking-[-0.04em]">PRAGATI</div><div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8e9bc0]">Student intelligence</div></div></div>; }
function NavGroup({ label, items, activePath, onNavigate }: { label: string; items: NavItem[]; activePath: string; onNavigate: (item: NavItem) => void }) { return <div className="mb-8"><div className="mb-3 px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b99bd]">{label}</div><nav className="space-y-1">{items.map(item => { const Icon = item.icon; const active = activePath === item.path; return <Link key={item.label} href={item.path} onClick={() => onNavigate(item)} aria-current={active ? "page" : undefined} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${active ? "bg-[#3048a8] text-white shadow-[0_7px_16px_rgba(11,20,52,0.18)]" : "text-[#aab6d4] hover:bg-white/[0.06] hover:text-white"}`}><Icon className={`h-[17px] w-[17px] shrink-0 ${active ? "text-[#cbd2ff]" : "text-[#8290b7] group-hover:text-[#b9c4e6]"}`} /><span>{item.label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#a8e2d4]" />}</Link>; })}</nav></div>; }
function HelpCard() { return <div className="m-3 rounded-xl border border-white/10 bg-white/[0.055] p-3"><div className="mb-2 flex items-center gap-2 text-[#bfcaff]"><CircleHelp className="h-4 w-4" /><span className="text-xs font-semibold">Need a hand?</span></div><p className="mb-3 text-[11px] leading-4 text-[#98a7cc]">Your mentor can help you turn a skill gap into your next opportunity.</p><Link href="/mentoring" className="flex w-full items-center justify-between rounded-lg bg-[#3048a8] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#3e59bf]">Open mentoring <span>↗</span></Link></div>; }
function MobileNav({ activePath, onClose }: { activePath: string; onClose: () => void }) { return <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation" onClick={onClose} className="absolute inset-0 bg-[#07112d]/50 backdrop-blur-sm" /><aside className="relative flex h-full w-[276px] flex-col bg-[#172446] text-white shadow-2xl"><div className="flex items-center justify-between"><Brand /><button aria-label="Close menu" onClick={onClose} className="mr-4 rounded-lg p-2 text-[#aab6d4] hover:bg-white/10"><X className="h-5 w-5" /></button></div><div className="px-3"><NavGroup label="Workspace" items={workspace} activePath={activePath} onNavigate={onCloseAndNavigate(onClose)} /><NavGroup label="Support" items={support} activePath={activePath} onNavigate={onCloseAndNavigate(onClose)} /></div></aside></div>; }
function onCloseAndNavigate(onClose: () => void) { return (_item: NavItem) => onClose(); }
