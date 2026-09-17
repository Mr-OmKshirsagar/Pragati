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
    activePillBg: "#059669",
    activePillShadow: "0 4px 14px rgba(5, 150, 105, 0.28)",
    activeDot: "#10B981",
    brandBg: "#059669",
    brandText: "#FFFFFF",
    brandDot: "#10B981",
    helpTitle: "Need a hand?",
    helpText: "Your mentor can help you turn a skill gap into your next opportunity.",
    helpBtnText: "Open mentoring",
    helpBtnPath: "/mentoring",
    helpBtnBg: "#059669",
    helpBtnHover: "#047857",
    accentBg: "#ECFDF5",
    accentText: "#047857",
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
    activePillBg: "#059669",
    activePillShadow: "0 4px 14px rgba(5, 150, 105, 0.28)",
    activeDot: "#10B981",
    brandBg: "#059669",
    brandText: "#FFFFFF",
    brandDot: "#10B981",
    helpTitle: "Department Desk",
    helpText: "Curriculum or NAAC audit documentation query? Reach out to Accreditation Cell.",
    helpBtnText: "View Faculty Wards",
    helpBtnPath: "/faculty",
    helpBtnBg: "#059669",
    helpBtnHover: "#047857",
    accentBg: "#ECFDF5",
    accentText: "#047857",
  },
  TNP_COORDINATOR: {
    role: "TNP_COORDINATOR",
    label: "T&P Officer",
    subtitle: "Training & placement cell",
    deskLabel: "Placement Desk",
    sidebarBg: "#FFFFFF",
    sidebarBorder: "#E2E8F0",
    activePillBg: "#059669",
    activePillShadow: "0 4px 14px rgba(5, 150, 105, 0.28)",
    activeDot: "#10B981",
    brandBg: "#059669",
    brandText: "#FFFFFF",
    brandDot: "#10B981",
    helpTitle: "Placement Cell",
    helpText: "Configure placement drive criteria, eligibility cutoffs, and track confirmed offers.",
    helpBtnText: "Placement Drives",
    helpBtnPath: "/opportunities",
    helpBtnBg: "#059669",
    helpBtnHover: "#047857",
    accentBg: "#ECFDF5",
    accentText: "#047857",
  },
  ADMIN: {
    role: "ADMIN",
    label: "Administrator",
    subtitle: "System governance",
    deskLabel: "Governance Desk",
    sidebarBg: "#FFFFFF",
    sidebarBorder: "#E2E8F0",
    activePillBg: "#059669",
    activePillShadow: "0 4px 14px rgba(5, 150, 105, 0.28)",
    activeDot: "#10B981",
    brandBg: "#059669",
    brandText: "#FFFFFF",
    brandDot: "#10B981",
    helpTitle: "Platform Admin",
    helpText: "Inspect tamper-detection audit trails, institution keys, and role permissions.",
    helpBtnText: "System Overview",
    helpBtnPath: "/overview",
    helpBtnBg: "#059669",
    helpBtnHover: "#047857",
    accentBg: "#ECFDF5",
    accentText: "#047857",
  },
};

export function getRoleSidebarTheme(role?: PragatiRole): RoleSidebarTheme {
  if (!role || !ROLE_SIDEBAR_THEMES[role]) {
    return ROLE_SIDEBAR_THEMES.STUDENT;
  }
  return ROLE_SIDEBAR_THEMES[role];
}
