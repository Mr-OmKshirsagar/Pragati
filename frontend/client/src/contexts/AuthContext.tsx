import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getRoleSidebarTheme } from "@/lib/roleTheme";

export type PragatiRole = "STUDENT" | "FACULTY" | "HOD" | "ADMIN";
export type UserRole = PragatiRole;

export interface StudentProfileData {
  id: string;
  enrollmentNumber: string;
  program: string;
  currentSemester: number;
}

export interface PragatiUser {
  id: string;
  name: string;
  email: string;
  role: PragatiRole;
  department?: string;
  departmentId?: string | null;
  institutionId?: string;
  roleId?: string;
  designation?: string;
  avatar?: string;
  studentProfile?: StudentProfileData;
  mustChangePassword?: boolean;
}
export type UserData = PragatiUser;

export const ROLE_CONFIG: Record<
  PragatiRole,
  {
    label: string;
    badge: string;
    description: string;
    idLabel: string;
    defaultPath: string;
    themeTone: string;
    avatarTone: string;
  }
> = {
  STUDENT: {
    label: "Student",
    badge: "Undergraduate",
    description: "Access your Career Passport, verified skills, and placement drives.",
    idLabel: "Roll No / USN",
    defaultPath: "/student/overview",
    themeTone: "bg-[#edf0ff] text-[#3048a8] border-[#cbd5f5]",
    avatarTone: "bg-[#3048a8] text-white",
  },
  FACULTY: {
    label: "Faculty Mentor",
    badge: "Mentorship",
    description: "Monitor mentee cohorts, skill gap interventions, and verify internships.",
    idLabel: "Faculty Employee ID",
    defaultPath: "/faculty/wards",
    themeTone: "bg-[#e5f7f2] text-[#13876f] border-[#a5dfd1]",
    avatarTone: "bg-[#13876f] text-white",
  },
  HOD: {
    label: "Head of Dept",
    badge: "Department Lead",
    description: "Department-wide analytics, curriculum gap insights, and cohort reports.",
    idLabel: "HOD / Faculty Code",
    defaultPath: "/hod/overview",
    themeTone: "bg-[#f0ebff] text-[#7358c9] border-[#d3c2fa]",
    avatarTone: "bg-[#7358c9] text-white",
  },
  ADMIN: {
    label: "System & Placement Admin",
    badge: "Institutional Governance",
    description: "System governance, placement operations, and institution-wide administration.",
    idLabel: "Admin Security Code",
    defaultPath: "/admin/overview",
    themeTone: "bg-[#ffebee] text-[#c24152] border-[#f8b4be]",
    avatarTone: "bg-[#c24152] text-white",
  },
};

export const STATIC_DEMO_PERSONAS: Record<PragatiRole, PragatiUser> = {
  STUDENT: {
    id: "10000000-0000-0000-0000-000000000005",
    name: "Rahul Sharma",
    email: "student@northstar.edu",
    role: "STUDENT",
    department: "Computer Science & Engineering",
    departmentId: "CSE",
    institutionId: "NIT-001",
    roleId: "CS-2023-0842",
    designation: "B.Tech CSE · Sem 6",
    avatar: "RS",
    studentProfile: {
      id: "student-rahul-sharma",
      enrollmentNumber: "CSE2024042",
      program: "B.Tech Computer Science and Engineering",
      currentSemester: 6,
    },
  },
  FACULTY: {
    id: "10000000-0000-0000-0000-000000000001",
    name: "Dr. Anand Verma",
    email: "faculty@northstar.edu",
    role: "FACULTY",
    department: "Computer Science & Engineering",
    departmentId: "CSE",
    institutionId: "NIT-001",
    roleId: "FAC-CS-104",
    designation: "Faculty Mentor & Advisor",
    avatar: "AV",
  },
  HOD: {
    id: "10000000-0000-0000-0000-000000000002",
    name: "Prof. Sunita Rao",
    email: "hod.cse@northstar.edu",
    role: "HOD",
    department: "Computer Science & Engineering",
    departmentId: "CSE",
    institutionId: "NIT-001",
    roleId: "HOD-CSE-001",
    designation: "Head of Department (CSE)",
    avatar: "SR",
  },
  ADMIN: {
    id: "10000000-0000-0000-0000-000000000004",
    name: "Platform Administrator",
    email: "admin@northstar.edu",
    role: "ADMIN",
    department: "Central Administration",
    departmentId: "ADMIN",
    institutionId: "NIT-001",
    roleId: "ADM-SYS-001",
    designation: "System & Placement Admin",
    avatar: "PA",
  },
};

export const DEFAULT_STUDENT: PragatiUser = STATIC_DEMO_PERSONAS.STUDENT;

interface AuthContextType {
  user: PragatiUser | null;
  role: PragatiRole;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: PragatiUser) => void;
  loginWithDemo: (role: PragatiRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: PragatiRole) => Promise<void>;
  updateMustChangePassword: (mustChange: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "pragati_active_user";
const TOKEN_KEY = "pragati_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return (
      localStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(TOKEN_KEY) ||
      "demo_STUDENT"
    );
  });

  const [user, setUser] = useState<PragatiUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return DEFAULT_STUDENT;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const utils = trpc.useUtils();
  const demoLoginMutation = trpc.auth.demoLogin.useMutation();

  // On initial mount only, sync with database in background
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (savedToken && savedToken.startsWith("demo_")) {
      const targetRole = savedToken.replace("demo_", "") as PragatiRole;
      demoLoginMutation
        .mutateAsync({ role: targetRole })
        .then((res) => {
          if (res.success && res.user) {
            setUser((prev) => {
              if (!prev || prev.role !== targetRole) return prev;
              const updated: PragatiUser = {
                ...prev,
                ...res.user,
                role: (res.user.role === "TNP_COORDINATOR" ? "ADMIN" : res.user.role) as PragatiRole,
              };
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              } catch { }
              return updated;
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  const login = (newUser: PragatiUser) => {
    setUser(newUser);
    setToken(`demo_${newUser.role}`);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      localStorage.setItem(TOKEN_KEY, `demo_${newUser.role}`);
    } catch { }
  };

  const loginWithDemo = async (targetRole: PragatiRole) => {
    // 1. INSTANT OPTIMISTIC UPDATE (0ms delay, no screen freeze or access flicker)
    const persona = STATIC_DEMO_PERSONAS[targetRole] || DEFAULT_STUDENT;
    setUser(persona);
    setToken(`demo_${targetRole}`);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persona));
      localStorage.setItem(TOKEN_KEY, `demo_${targetRole}`);
    } catch { }

    // Update document theme synchronously
    const theme = getRoleSidebarTheme(targetRole);
    document.documentElement.setAttribute("data-role", targetRole);
    document.documentElement.style.setProperty("--primary", theme.activePillBg);
    document.documentElement.style.setProperty("--color-primary", theme.activePillBg);
    document.documentElement.style.setProperty("--ring", theme.activePillBg);
    document.documentElement.style.setProperty("--sidebar", theme.sidebarBg);
    document.documentElement.style.setProperty("--sidebar-primary", theme.activePillBg);
    document.documentElement.style.setProperty("--role-primary", theme.activePillBg);
    document.documentElement.style.setProperty("--role-bg", theme.sidebarBg);

    toast.success(`Logged in as ${persona.name} (${ROLE_CONFIG[targetRole]?.label || targetRole})`);

    // Invalidate query cache in background so fresh data loads for the new role
    utils.invalidate().catch(() => {});

    // 2. Background database sync with Supabase
    demoLoginMutation
      .mutateAsync({ role: targetRole })
      .then((res) => {
        if (res.success && res.user) {
          const syncedUser: PragatiUser = {
            ...persona,
            ...res.user,
            role: (res.user.role === "TNP_COORDINATOR" ? "ADMIN" : res.user.role) as PragatiRole,
            avatar: res.user.name
              .split(" ")
              .map((p: string) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase(),
          };
          setUser((prev) => (prev?.role === targetRole ? syncedUser : prev));
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedUser));
            localStorage.setItem(TOKEN_KEY, res.token);
          } catch { }
        }
      })
      .catch((err) => {
        console.warn("[AuthContext] Background persona sync skipped:", err);
      });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    toast.info("Logged out of PRAGATI.");
  };

  const switchRole = async (newRole: PragatiRole) => {
    await loginWithDemo(newRole);
  };

  const updateMustChangePassword = (mustChange: boolean) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, mustChangePassword: mustChange };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  const role: PragatiRole = user?.role ?? "STUDENT";
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    const theme = getRoleSidebarTheme(role);
    document.documentElement.setAttribute("data-role", role);
    document.documentElement.style.setProperty("--primary", theme.activePillBg);
    document.documentElement.style.setProperty("--color-primary", theme.activePillBg);
    document.documentElement.style.setProperty("--ring", theme.activePillBg);
    document.documentElement.style.setProperty("--sidebar", theme.sidebarBg);
    document.documentElement.style.setProperty("--sidebar-primary", theme.activePillBg);
    document.documentElement.style.setProperty("--role-primary", theme.activePillBg);
    document.documentElement.style.setProperty("--role-bg", theme.sidebarBg);
  }, [role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isLoading,
        isAuthenticated,
        login,
        loginWithDemo,
        logout,
        switchRole,
        updateMustChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function usePragatiAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("usePragatiAuth must be used within an AuthProvider");
  }
  return context;
}
