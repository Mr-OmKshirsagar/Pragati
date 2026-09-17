import {
  Activity,
  Award,
  Bell,
  BriefcaseBusiness,
  CircleHelp,
  Compass,
  FileCheck2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Route,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import UserNav from "./UserNav";
import { useAuth, type PragatiRole } from "@/contexts/AuthContext";
import { getRoleSidebarTheme, type RoleSidebarTheme } from "@/lib/roleTheme";

type Props = { children: React.ReactNode; title: string; activePath: string };
type NavItem = { label: string; path: string; icon: any };

const studentWorkspace: NavItem[] = [
  { label: "Dashboard", path: "/overview", icon: LayoutDashboard },
  { label: "My Competencies", path: "/progress", icon: Compass },
  { label: "Assessments", path: "/skills", icon: FileText },
  { label: "Skill Gaps", path: "/mentoring", icon: Target },
  { label: "Recommendations", path: "/opportunities", icon: Sparkles },
  { label: "Achievements", path: "/achievements", icon: Award },
  { label: "Evidence Ledger", path: "/internship", icon: FileCheck2 },
  { label: "Career Passport", path: "/career-passport", icon: GraduationCap },
];

const facultyWorkspace: NavItem[] = [
  { label: "Assigned Wards", path: "/faculty", icon: UsersRound },
  { label: "Skills Overview", path: "/skills", icon: Activity },
  { label: "Internship Approvals", path: "/internship", icon: BriefcaseBusiness },
  { label: "Mentoring Logs", path: "/mentoring", icon: Route },
];

const hodWorkspace: NavItem[] = [
  { label: "Department Overview", path: "/overview", icon: LayoutDashboard },
  { label: "Faculty & Wards", path: "/faculty", icon: UsersRound },
  { label: "Skills Analytics", path: "/skills", icon: Activity },
  { label: "Opportunities", path: "/opportunities", icon: Target },
];

const tnpWorkspace: NavItem[] = [
  { label: "Opportunities & Drives", path: "/opportunities", icon: Target },
  { label: "Student Roster", path: "/faculty", icon: UsersRound },
];

const adminWorkspace: NavItem[] = [
  { label: "Overview", path: "/overview", icon: LayoutDashboard },
  { label: "Faculty & Wards", path: "/faculty", icon: UsersRound },
  { label: "Skills Analytics", path: "/skills", icon: Activity },
  { label: "Opportunities", path: "/opportunities", icon: Target },
  { label: "Career Passport", path: "/career-passport", icon: Route },
];

const WORKSPACES_BY_ROLE: Record<
  PragatiRole,
  { items: NavItem[]; deskLabel: string; workspaceName: string }
> = {
  STUDENT: {
    items: studentWorkspace,
    deskLabel: "LEARNER WORKSPACE",
    workspaceName: "Student workspace",
  },
  FACULTY: {
    items: facultyWorkspace,
    deskLabel: "FACULTY WORKSPACE",
    workspaceName: "Faculty workspace",
  },
  HOD: {
    items: hodWorkspace,
    deskLabel: "DEPARTMENT WORKSPACE",
    workspaceName: "Department workspace",
  },
  TNP_COORDINATOR: {
    items: tnpWorkspace,
    deskLabel: "PLACEMENT WORKSPACE",
    workspaceName: "Placement workspace",
  },
  ADMIN: {
    items: adminWorkspace,
    deskLabel: "GOVERNANCE WORKSPACE",
    workspaceName: "Admin workspace",
  },
};

export default function PragatiFrame({ children, title, activePath }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, navigate] = useLocation();
  const { role, user } = useAuth();

  const currentConfig = WORKSPACES_BY_ROLE[role] || WORKSPACES_BY_ROLE.STUDENT;
  const items = currentConfig.items;
  const deskLabel = currentConfig.deskLabel;
  const workspaceName = currentConfig.workspaceName;
  const theme = getRoleSidebarTheme(role);

  const nav = (item: NavItem) => {
    if (item.path.includes("#")) {
      navigate(item.path.split("#")[0]);
      return;
    }
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <div className="grid min-h-screen lg:grid-cols-[250px_1fr]">
        {/* ShikshaSetu-Style Clean White Sidebar */}
        <aside className="sticky top-0 self-start hidden h-screen bg-white text-slate-800 lg:grid lg:grid-rows-[auto_1fr_auto] overflow-hidden z-40 border-r border-slate-200 shadow-2xs">
          <Brand theme={theme} />
          <div className="overflow-y-auto px-3.5 pb-4">
            <NavGroup
              label={deskLabel}
              items={items}
              activePath={activePath}
              onNavigate={nav}
            />
          </div>
          <UserFooter role={role} user={user} />
        </aside>

        {/* Main Content Pane */}
        <div className="min-w-0 grid grid-rows-[auto_1fr]">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
            <div className="grid h-[70px] grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-7 xl:px-10">
              <div className="grid grid-flow-col auto-cols-max items-center gap-3">
                <button
                  aria-label="Open navigation"
                  onClick={() => setMobileOpen(true)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden grid-flow-col auto-cols-max items-center gap-2 text-xs font-semibold text-slate-500 sm:grid">
                  <span>{workspaceName}</span>
                  <span className="text-slate-300">/</span>
                  <span className="font-bold text-slate-900">{title}</span>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200/70">
                    {role}
                  </span>
                </div>
                <div className="truncate text-sm font-bold text-slate-900 sm:hidden">
                  PRAGATI / {title}
                </div>
              </div>
              <div className="grid grid-flow-col auto-cols-max items-center gap-2 sm:gap-3">
                <div className="hidden h-10 w-[240px] grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 shadow-2xs md:grid transition focus-within:border-slate-300 focus-within:bg-white">
                  <span className="text-xs">Search your workspace</span>
                  <span className="rounded border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                    ⌘ K
                  </span>
                </div>
                <button
                  aria-label="Help"
                  className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:grid place-items-center"
                >
                  <CircleHelp className="h-[18px] w-[18px]" />
                </button>
                <button
                  aria-label="Notifications"
                  className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 grid place-items-center"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-white" />
                </button>
                <div className="ml-1 hidden h-8 w-px bg-slate-200 sm:block" />
                <UserNav />
              </div>
            </div>
          </header>

          {mobileOpen && (
            <MobileNav
              items={items}
              deskLabel={deskLabel}
              activePath={activePath}
              onClose={() => setMobileOpen(false)}
              user={user}
              role={role}
            />
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Brand (Clean Logo + Dark Title + Cyan Subtitle)
// ═══════════════════════════════════════════════════════════════════════════

function Brand({ theme }: { theme: RoleSidebarTheme }) {
  return (
    <div className="grid h-[86px] grid-cols-[auto_1fr] items-center gap-3 px-5 border-b border-slate-100/80">
      {/* Geometric ShikshaSetu-like colored icon emblem */}
      <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-[#0F766E] to-[#06B6D4] text-white shadow-xs">
        <Compass className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[17px] font-bold tracking-tight text-slate-900 leading-tight">
          PRAGATI
        </div>
        <div className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400 leading-tight mt-0.5">
          CAPABILITY INTELLIGENCE
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NavGroup (Soft Rounded Mint/Teal Active Pill)
// ═══════════════════════════════════════════════════════════════════════════

function NavGroup({
  label,
  items,
  activePath,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  activePath: string;
  onNavigate: (item: NavItem) => void;
}) {
  return (
    <div className="mb-6 pt-3">
      {/* Section Eyebrow Label (LEARNER WORKSPACE) */}
      <div className="mb-2 px-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <nav className="grid gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            activePath === item.path ||
            (item.path === "/overview" &&
              (activePath === "/dashboard" || activePath === "/hod")) ||
            (item.path === "/faculty" &&
              (activePath === "/faculty/wards" || activePath === "/faculty"));

          return (
            <Link
              key={item.label}
              href={item.path}
              onClick={() => onNavigate(item)}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-all duration-150 ${
                active
                  ? "bg-emerald-50/90 text-emerald-800 font-bold shadow-2xs border border-emerald-200/70"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                  active
                    ? "text-emerald-700"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// User Footer (Matching Rajesh Sharma Bottom Card from ShikshaSetu)
// ═══════════════════════════════════════════════════════════════════════════

function UserFooter({ role, user }: { role: PragatiRole; user: any }) {
  const name = user?.name || "Rahul Sharma";
  const subtitle =
    role === "STUDENT"
      ? "Student · CS-2023-0842"
      : role === "FACULTY"
      ? "Faculty Mentor"
      : role === "HOD"
      ? "Department Head"
      : role === "TNP_COORDINATOR"
      ? "Placement Officer"
      : "Platform Admin";

  return (
    <div className="border-t border-slate-100 p-5 bg-white">
      <div className="text-sm font-bold text-slate-900 leading-tight truncate">
        {name}
      </div>
      <div className="text-xs text-slate-400 font-medium leading-tight mt-1 truncate">
        {subtitle}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Mobile Nav (Matching White Theme)
// ═══════════════════════════════════════════════════════════════════════════

function MobileNav({
  items,
  deskLabel,
  activePath,
  onClose,
  user,
  role,
}: {
  items: NavItem[];
  deskLabel: string;
  activePath: string;
  onClose: () => void;
  user: any;
  role: PragatiRole;
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
      />
      <aside className="relative grid h-full w-[276px] grid-rows-[auto_1fr_auto] bg-white text-slate-900 shadow-2xl">
        <div className="grid grid-cols-[1fr_auto] items-center border-b border-slate-100">
          <Brand theme={getRoleSidebarTheme(role)} />
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="mr-3 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-3.5 overflow-y-auto">
          <NavGroup
            label={deskLabel}
            items={items}
            activePath={activePath}
            onNavigate={() => onClose()}
          />
        </div>
        <UserFooter role={role} user={user} />
      </aside>
    </div>
  );
}
