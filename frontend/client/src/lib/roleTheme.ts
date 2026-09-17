import type { PragatiRole } from "@/contexts/AuthContext";

export interface RoleSidebarTheme {
  role: PragatiRole;
  label: string;
  subtitle: string;
  deskLabel: string;
  sidebarBg: string;
  sidebarBorder: string;
  activePillBg: string;
  activePillShadow: string;
  activeDot: string;
  brandBg: string;
  brandText: string;
  brandDot: string;
  accentBg: string;
  accentText: string;
  helpTitle: string;
  helpText: string;
  helpBtnText: string;
  helpBtnPath: string;
  helpBtnBg: string;
  helpBtnHover: string;
}

export const ROLE_SIDEBAR_THEMES: Record<PragatiRole, RoleSidebarTheme> = {
  STUDENT: {
    role: "STUDENT",
    label: "Student",
    subtitle: "Student intelligence",
    deskLabel: "Workspace",
    sidebarBg: "#FFFFFF",
    sidebarBorder: "#E2E8F0",
    activePillBg: "#2563EB",
    activePillShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
    activeDot: "#3B82F6",
    brandBg: "#2563EB",
    brandText: "#FFFFFF",
    brandDot: "#60A5FA",
    helpTitle: "Need a hand?",
    helpText: "Your mentor can help you turn a skill gap into your next opportunity.",
    helpBtnText: "Open mentoring",
    helpBtnPath: "/mentoring",
    helpBtnBg: "#2563EB",
    helpBtnHover: "#1D4ED8",
    accentBg: "#EFF6FF",
    accentText: "#1D4ED8",
  },
  FACULTY: {
    role: "FACULTY",
    label: "Faculty Mentor",
    subtitle: "Teacher-guardian desk",
    deskLabel: "Faculty Desk",
    sidebarBg: "#FFFFFF",
    sidebarBorder: "#E2E8F0",
    activePillBg: "#059669",
    activePillShadow: "0 4px 14px rgba(5, 150, 105, 0.28)",
    activeDot: "#10B981",
    brandBg: "#059669",
    brandText: "#FFFFFF",
    brandDot: "#10B981",
    helpTitle: "Mentor Support",
    helpText: "Review closed-loop mentorship guidelines and logged mentee interventions.",
    helpBtnText: "Open Ward Roster",
    helpBtnPath: "/faculty",
    helpBtnBg: "#059669",
    helpBtnHover: "#047857",
    accentBg: "#ECFDF5",
    accentText: "#047857",
  },
  HOD: {
    role: "HOD",
    label: "Head of Dept",
    subtitle: "Department lead desk",
    deskLabel: "Department Desk",
    sidebarBg: "#FFFFFF",
    sidebarBorder: "#E2E8F0",
    activePillBg: "#EA580C",
    activePillShadow: "0 4px 14px rgba(234, 88, 12, 0.30)",
    activeDot: "#F97316",
    brandBg: "#EA580C",
    brandText: "#FFFFFF",
    brandDot: "#FB923C",
    helpTitle: "Department Desk",
    helpText: "Curriculum or NAAC audit documentation query? Reach out to Accreditation Cell.",
    helpBtnText: "View Faculty Wards",
    helpBtnPath: "/faculty",
    helpBtnBg: "#EA580C",
    helpBtnHover: "#C2410C",
    accentBg: "#FFF7ED",
    accentText: "#C2410C",
  },
  ADMIN: {
    role: "ADMIN",
    label: "Administrator",
    subtitle: "System governance",
    deskLabel: "Governance Desk",
    sidebarBg: "#FFFFFF",
    sidebarBorder: "#E2E8F0",
    activePillBg: "#B22746",
    activePillShadow: "0 4px 14px rgba(178, 39, 70, 0.30)",
    activeDot: "#E05271",
    brandBg: "#B22746",
    brandText: "#FFFFFF",
    brandDot: "#E05271",
    helpTitle: "Platform Admin",
    helpText: "Inspect tamper-detection audit trails, institution keys, and role permissions.",
    helpBtnText: "System Overview",
    helpBtnPath: "/overview",
    helpBtnBg: "#B22746",
    helpBtnHover: "#931f3a",
    accentBg: "#FFF0F3",
    accentText: "#97263d",
  },
};

export function getRoleSidebarTheme(role?: PragatiRole): RoleSidebarTheme {
  if (!role || !ROLE_SIDEBAR_THEMES[role]) {
    return ROLE_SIDEBAR_THEMES.STUDENT;
  }
  return ROLE_SIDEBAR_THEMES[role];
}
