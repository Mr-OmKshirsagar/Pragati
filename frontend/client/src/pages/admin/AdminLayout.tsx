import { useAuth } from "@/contexts/AuthContext";
import {
  Activity,
  BarChart3,
  Briefcase,
  BookOpen,
  Building2,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Compass,
  FileText,
  GraduationCap,
  Lock,
  Menu,
  Server,
  Settings,
  Target,
  UserCheck,
  Users,
  Users2,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import UserNav from "@/components/UserNav";

type IconType = typeof Users;

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  icon: IconType;
  route: string;
}

const adminNavigation: NavSection[] = [
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Overview", icon: BarChart3, route: "/admin/overview" },
      { label: "Approvals & Roles", icon: UserCheck, route: "/admin/approvals" },
      { label: "Users", icon: Users, route: "/admin/users" },
      { label: "Students", icon: GraduationCap, route: "/admin/students" },
      { label: "Faculty & HOD", icon: Activity, route: "/admin/faculty" },
      { label: "Departments", icon: Building2, route: "/admin/departments" },
    ],
  },
  {
    title: "ACADEMIC & SKILLS",
    items: [
      { label: "Academics", icon: BookOpen, route: "/admin/academics" },
      { label: "Skills", icon: Zap, route: "/admin/skills" },
      { label: "Assessments", icon: ClipboardCheck, route: "/admin/assessments" },
    ],
  },
  {
    title: "CAREER OPERATIONS",
    items: [
      { label: "Internships", icon: Briefcase, route: "/admin/internships" },
      { label: "Verification", icon: CheckCircle2, route: "/admin/verification" },
      { label: "Placement", icon: Target, route: "/admin/placement" },
      { label: "Recruitment", icon: Users2, route: "/admin/recruitment" },
    ],
  },
  {
    title: "GOVERNANCE",
    items: [
      { label: "Audit Logs", icon: FileText, route: "/admin/audit-logs" },
      { label: "Security", icon: Lock, route: "/admin/security" },
      { label: "System Health", icon: Server, route: "/admin/system-health" },
      { label: "Settings", icon: Settings, route: "/admin/settings" },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleNavigation = (route: string) => {
    navigate(route);
    setMobileNavOpen(false);
  };

  const pageTitle = currentPage.split("/").pop()?.replace(/-/g, " ") || "Overview";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <div className="grid min-h-screen lg:grid-cols-[250px_1fr]">
        {/* ShikshaSetu-Style Clean White Sidebar */}
        <aside className="sticky top-0 self-start hidden h-screen bg-white text-slate-800 lg:grid lg:grid-rows-[auto_1fr_auto] overflow-hidden z-40 border-r border-slate-200 shadow-2xs">
          {/* Brand Header */}
          <div className="grid h-[86px] grid-cols-[auto_1fr] items-center gap-3 px-5 border-b border-slate-100/80">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-[#B22746] to-[#E05271] text-white shadow-xs">
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

          {/* Navigation Sections */}
          <div className="overflow-y-auto px-3.5 pb-6 pt-3">
            {adminNavigation.map((section) => (
              <div key={section.title} className="mb-5">
                <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {section.title}
                </div>
                <nav className="grid gap-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      currentPage === item.route ||
                      (item.route === "/admin/overview" && currentPage === "/overview");
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleNavigation(item.route)}
                        className={`group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm transition-all duration-150 ${
                          isActive
                            ? "bg-rose-50/90 text-rose-800 font-bold shadow-2xs border border-rose-200/70"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                        }`}
                      >
                        <Icon
                          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                            isActive
                              ? "text-rose-700"
                              : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* User Footer Profile */}
          <div className="border-t border-slate-100 p-5 bg-white">
            <div className="text-sm font-bold text-slate-900 leading-tight truncate">
              {user?.name || "Platform Admin"}
            </div>
            <div className="text-xs text-slate-400 font-medium leading-tight mt-1 truncate">
              System Governance · Administrator
            </div>
          </div>
        </aside>

        {/* Header + Main Content */}
        <div className="min-w-0 grid grid-rows-[auto_1fr]">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
            <div className="grid h-[70px] grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-7 xl:px-10">
              <div className="grid grid-flow-col auto-cols-max items-center gap-3">
                <button
                  aria-label="Open navigation"
                  onClick={() => setMobileNavOpen(true)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <div className="hidden grid-flow-col auto-cols-max items-center gap-2 text-xs font-semibold text-slate-500 sm:grid">
                    <span>Admin Workspace</span>
                    <span className="text-slate-300">/</span>
                    <span className="font-bold text-slate-900 capitalize">{pageTitle}</span>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200/70">
                      ADMIN
                    </span>
                  </div>
                  <div className="truncate text-sm font-bold text-slate-900 sm:hidden">
                    PRAGATI / {pageTitle}
                  </div>
                </div>
              </div>
              <div className="grid grid-flow-col auto-cols-max items-center gap-2 sm:gap-3">
                <div className="hidden h-10 w-[240px] grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 shadow-2xs md:grid transition focus-within:border-slate-300 focus-within:bg-white">
                  <span className="text-xs">Search admin portal</span>
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
                <div className="ml-1 hidden h-8 w-px bg-slate-200 sm:block" />
                <UserNav />
              </div>
            </div>
          </header>

          {/* Mobile Navigation */}
          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                aria-label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
              />
              <aside className="relative grid h-full w-[276px] grid-rows-[auto_1fr_auto] bg-white text-slate-900 shadow-2xl">
                <div className="grid grid-cols-[1fr_auto] items-center border-b border-slate-100">
                  <div className="grid h-[86px] grid-cols-[auto_1fr] items-center gap-3 px-5">
                    <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-[#B22746] to-[#E05271] text-white shadow-xs">
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
                  <button
                    aria-label="Close menu"
                    onClick={() => setMobileNavOpen(false)}
                    className="mr-3 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="px-3.5 overflow-y-auto pt-3">
                  {adminNavigation.map((section) => (
                    <div key={section.title} className="mb-5">
                      <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        {section.title}
                      </div>
                      <div className="grid gap-1">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const isActive =
                            currentPage === item.route ||
                            (item.route === "/admin/overview" && currentPage === "/overview");
                          return (
                            <button
                              key={item.label}
                              onClick={() => handleNavigation(item.route)}
                              className={`group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm transition-all duration-150 ${
                                isActive
                                  ? "bg-[#E6F4F1] text-[#0E7490] font-bold shadow-2xs"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                              }`}
                            >
                              <Icon
                                className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                                  isActive
                                    ? "text-[#0E7490]"
                                    : "text-slate-400 group-hover:text-slate-600"
                                }`}
                              />
                              <span className="truncate">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 p-5 bg-white">
                  <div className="text-sm font-bold text-slate-900 leading-tight truncate">
                    {user?.name || "Platform Admin"}
                  </div>
                  <div className="text-xs text-slate-400 font-medium leading-tight mt-1 truncate">
                    System Governance · Administrator
                  </div>
                </div>
              </aside>
            </div>
          )}

          {/* Main Content */}
          <main className="dashboard-grid min-h-[calc(100vh-70px)] px-4 pb-12 pt-7 sm:px-7 xl:px-10">
            <div className="mx-auto max-w-[1420px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
