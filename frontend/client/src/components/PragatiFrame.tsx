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
type PageTheme = {
  primary: string;
  soft: string;
  border: string;
  surface: string;
  assistantBg: string;
  assistantHover: string;
  assistantAccent: string;
  roleBg: string;
  roleText: string;
};

interface NavSection {
  title: string;
  items: NavItem[];
}

const studentSections: NavSection[] = [
  {
    title: "LEARNER WORKSPACE",
    items: [
      { label: "Overview", path: "/overview", icon: LayoutDashboard },
      { label: "My progress", path: "/progress", icon: TrendingUp },
      { label: "Skills & assessments", path: "/skills", icon: Activity },
      { label: "Achievements", path: "/achievements", icon: Award },
      { label: "Internship evidence", path: "/internship", icon: BriefcaseBusiness },
      { label: "Opportunities", path: "/opportunities", icon: Target },
      { label: "Career Passport", path: "/career-passport", icon: Route },
    ],
  },
];

const facultySections: NavSection[] = [
  {
    title: "FACULTY DESK",
    items: [
      { label: "Assigned Wards", path: "/faculty", icon: UsersRound },
      { label: "Mentoring Logs", path: "/mentoring", icon: Route },
    ],
  },
  {
    title: "ACADEMIC REVIEW",
    items: [
      { label: "Internship Approvals", path: "/internship", icon: BriefcaseBusiness },
    ],
  },
];

const hodSections: NavSection[] = [
  {
    title: "DEPARTMENT DESK",
    items: [
      { label: "Department Overview", path: "/overview", icon: LayoutDashboard },
      { label: "Faculty & Wards", path: "/faculty", icon: UsersRound },
    ],
  },
  {
    title: "ACADEMIC & PLACEMENT",
    items: [
      { label: "Skills Analytics", path: "/skills", icon: Activity },
      { label: "Opportunities", path: "/opportunities", icon: Target },
    ],
  },
];

const tnpSections: NavSection[] = [
  {
    title: "PLACEMENT DESK",
    items: [
      { label: "Placement Drives", path: "/admin/placement", icon: Target },
      { label: "Student Opportunities", path: "/opportunities", icon: Sparkles },
      { label: "Candidate Pipeline", path: "/faculty", icon: UsersRound },
    ],
  },
  {
    title: "CAREER OPERATIONS",
    items: [
      { label: "Corporate Internships", path: "/admin/internships", icon: BriefcaseBusiness },
      { label: "Evidence Verification", path: "/admin/verification", icon: FileCheck2 },
    ],
  },
];

const adminSections: NavSection[] = [
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Overview", path: "/admin/overview", icon: LayoutDashboard },
      { label: "Faculty & Wards", path: "/faculty", icon: UsersRound },
    ],
  },
  {
    title: "PLACEMENT & CAREER",
    items: [
      { label: "Placement Drives", path: "/admin/placement", icon: Target },
      { label: "Internships & Records", path: "/admin/internships", icon: BriefcaseBusiness },
      { label: "Verification", path: "/admin/verification", icon: FileCheck2 },
    ],
  },
  {
    title: "ACADEMICS & GOVERNANCE",
    items: [
      { label: "Skills Analytics", path: "/skills", icon: Activity },
      { label: "System Health", path: "/admin/system-health", icon: Activity },
    ],
  },
];

const WORKSPACES_BY_ROLE: Record<
  PragatiRole,
  { sections: NavSection[]; workspaceName: string }
> = {
  STUDENT: {
    sections: studentSections,
    workspaceName: "Student workspace",
  },
  FACULTY: {
    sections: facultySections,
    workspaceName: "Faculty workspace",
  },
  HOD: {
    sections: hodSections,
    workspaceName: "Department workspace",
  },
  TNP_COORDINATOR: {
    sections: tnpSections,
    workspaceName: "Placement workspace",
  },
  ADMIN: {
    sections: adminSections,
    workspaceName: "Admin workspace",
  },
};

const PAGE_THEMES: Record<string, PageTheme> = {
  dashboard: {
    primary: "#0F766E",
    soft: "#CCFBF1",
    border: "#99F6E4",
    surface: "#F0FDFA",
    assistantBg: "#0C2D48",
    assistantHover: "#103E54",
    assistantAccent: "#67E8F9",
    roleBg: "#CCFBF1",
    roleText: "#115E59",
  },
  progress: {
    primary: "#2563EB",
    soft: "#DBEAFE",
    border: "#BFDBFE",
    surface: "#EFF6FF",
    assistantBg: "#173B78",
    assistantHover: "#1D4E9C",
    assistantAccent: "#93C5FD",
    roleBg: "#DBEAFE",
    roleText: "#1E3A8A",
  },
  skills: {
    primary: "#7C3AED",
    soft: "#EDE9FE",
    border: "#DDD6FE",
    surface: "#F5F3FF",
    assistantBg: "#3B1D72",
    assistantHover: "#4C2596",
    assistantAccent: "#C4B5FD",
    roleBg: "#EDE9FE",
    roleText: "#5B21B6",
  },
  mentoring: {
    primary: "#E11D48",
    soft: "#FFE4E6",
    border: "#FECDD3",
    surface: "#FFF1F2",
    assistantBg: "#7F1D1D",
    assistantHover: "#991B1B",
    assistantAccent: "#FDA4AF",
    roleBg: "#FFE4E6",
    roleText: "#9F1239",
  },
  opportunities: {
    primary: "#D97706",
    soft: "#FEF3C7",
    border: "#FDE68A",
    surface: "#FFFBEB",
    assistantBg: "#78350F",
    assistantHover: "#92400E",
    assistantAccent: "#FCD34D",
    roleBg: "#FEF3C7",
    roleText: "#92400E",
  },
  achievements: {
    primary: "#DB2777",
    soft: "#FCE7F3",
    border: "#FBCFE8",
    surface: "#FDF2F8",
    assistantBg: "#831843",
    assistantHover: "#9D174D",
    assistantAccent: "#F9A8D4",
    roleBg: "#FCE7F3",
    roleText: "#9D174D",
  },
  internship: {
    primary: "#0891B2",
    soft: "#CFFAFE",
    border: "#A5F3FC",
    surface: "#ECFEFF",
    assistantBg: "#164E63",
    assistantHover: "#155E75",
    assistantAccent: "#67E8F9",
    roleBg: "#CFFAFE",
    roleText: "#155E75",
  },
  passport: {
    primary: "#4F46E5",
    soft: "#E0E7FF",
    border: "#C7D2FE",
    surface: "#EEF2FF",
    assistantBg: "#312E81",
    assistantHover: "#3730A3",
    assistantAccent: "#A5B4FC",
    roleBg: "#E0E7FF",
    roleText: "#3730A3",
  },
  faculty: {
    primary: "#16A34A",
    soft: "#DCFCE7",
    border: "#BBF7D0",
    surface: "#F0FDF4",
    assistantBg: "#14532D",
    assistantHover: "#166534",
    assistantAccent: "#86EFAC",
    roleBg: "#DCFCE7",
    roleText: "#166534",
  },
  assessments: {
    primary: "#9333EA",
    soft: "#F3E8FF",
    border: "#E9D5FF",
    surface: "#FAF5FF",
    assistantBg: "#581C87",
    assistantHover: "#6B21A8",
    assistantAccent: "#D8B4FE",
    roleBg: "#F3E8FF",
    roleText: "#6B21A8",
  },
  admin: {
    primary: "#DC2626",
    soft: "#FEE2E2",
    border: "#FECACA",
    surface: "#FEF2F2",
    assistantBg: "#7F1D1D",
    assistantHover: "#991B1B",
    assistantAccent: "#FCA5A5",
    roleBg: "#FEE2E2",
    roleText: "#991B1B",
  },
};

function getPageTheme(activePath: string, title: string, role: PragatiRole) {
  if (role === "ADMIN" || activePath.startsWith("/admin")) return PAGE_THEMES.admin;
  if (activePath === "/overview" && title.toLowerCase().includes("department")) return PAGE_THEMES.skills;
  if (activePath === "/overview") return PAGE_THEMES.dashboard;
  if (activePath === "/career-passport") return PAGE_THEMES.passport;
  if (activePath.includes("assessment")) return PAGE_THEMES.assessments;
  if (activePath.includes("progress")) return PAGE_THEMES.progress;
  if (activePath.includes("skills")) return PAGE_THEMES.skills;
  if (activePath.includes("mentoring")) return PAGE_THEMES.mentoring;
  if (activePath.includes("opportunities") || activePath.includes("tnp")) return PAGE_THEMES.opportunities;
  if (activePath.includes("achievements")) return PAGE_THEMES.achievements;
  if (activePath.includes("internship")) return PAGE_THEMES.internship;
  if (activePath.includes("faculty")) return PAGE_THEMES.faculty;
  return PAGE_THEMES.dashboard;
}

export default function PragatiFrame({ children, title, activePath }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, navigate] = useLocation();
  const { role, user } = useAuth();

  const currentConfig = WORKSPACES_BY_ROLE[role] || WORKSPACES_BY_ROLE.STUDENT;
  const sections = currentConfig.sections;
  const workspaceName = currentConfig.workspaceName;
  const theme = getRoleSidebarTheme(role);
  const pageTheme = getPageTheme(activePath, title, role);
  const pageThemeStyle = {
    "--primary": pageTheme.primary,
    "--ring": pageTheme.primary,
    "--page-primary": pageTheme.primary,
    "--page-soft": pageTheme.soft,
    "--page-border": pageTheme.border,
    "--page-surface": pageTheme.surface,
  } as React.CSSProperties;

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
          <div className="overflow-y-auto px-3.5 pb-6 pt-3">
            {sections.map((section) => (
              <NavGroup
                key={section.title}
                label={section.title}
                items={section.items}
                activePath={activePath}
                onNavigate={nav}
              />
            ))}
          </div>
          <UserFooter role={role} user={user} />
        </aside>

        {/* Main Content Pane */}
        <div className="min-w-0 grid grid-rows-[auto_1fr]" style={pageThemeStyle}>
          <header
            className="sticky top-0 z-30 border-b backdrop-blur-xl"
            style={{
              borderColor: pageTheme.border,
              background: `linear-gradient(90deg, #ffffff 0%, ${pageTheme.surface} 52%, #ffffff 100%)`,
            }}
          >
            <div className="grid h-[70px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-7 xl:px-10">
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
                  <span
                    className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: pageTheme.roleBg,
                      borderColor: pageTheme.border,
                      color: pageTheme.roleText,
                    }}
                  >
                    {role}
                  </span>
                </div>
                <div className="truncate text-sm font-bold text-slate-900 sm:hidden">
                  PRAGATI / {title}
                </div>
              </div>
              <button
                onClick={() => window.location.assign("/mentoring")}
                className="hidden justify-self-center md:inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
                style={{ backgroundColor: pageTheme.assistantBg }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = pageTheme.assistantHover;
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = pageTheme.assistantBg;
                }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: pageTheme.assistantAccent }} />
                <span>PRAGATI AI Assistant</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: `${pageTheme.assistantAccent}24`,
                    color: pageTheme.assistantAccent,
                  }}
                >
                  Assistant
                </span>
              </button>
              <div className="grid grid-flow-col auto-cols-max items-center gap-2 justify-self-end sm:gap-3">
                <div className="hidden">
                  <span className="text-xs">Search your workspace</span>
                  <span className="rounded border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                    ⌘ K
                  </span>
                </div>
                <button
                  aria-label="Help"
                  className="hidden"
                >
                  <CircleHelp className="h-[18px] w-[18px]" />
                </button>
                <button
                  aria-label="Notifications"
                  className="hidden"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-white" />
                </button>
                <div className="hidden" />
                <UserNav />
              </div>
            </div>
          </header>

          {mobileOpen && (
            <MobileNav
              sections={sections}
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
    <div className="mb-4 pt-2">
      {/* Section Eyebrow Label (LEARNER WORKSPACE) */}
      <div className="mb-1.5 px-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <nav className="grid gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            activePath === item.path ||
            (item.path === "/overview" &&
              (activePath === "/dashboard" || activePath === "/hod")) ||
            (item.path === "/skills" &&
              (activePath === "/skills" || activePath.startsWith("/assessments")));

          return (
            <Link
              key={item.label}
              href={item.path}
              onClick={() => onNavigate(item)}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-all duration-150 ${
                active
                  ? "bg-emerald-50/90 text-emerald-800 font-bold shadow-2xs border border-emerald-200/70"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                    active
                      ? "text-emerald-700"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {active && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
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
  sections,
  activePath,
  onClose,
  user,
  role,
}: {
  sections: NavSection[];
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
        <div className="px-3.5 overflow-y-auto pt-3">
          {sections.map((section) => (
            <NavGroup
              key={section.title}
              label={section.title}
              items={section.items}
              activePath={activePath}
              onNavigate={() => onClose()}
            />
          ))}
        </div>
        <UserFooter role={role} user={user} />
      </aside>
    </div>
  );
}
