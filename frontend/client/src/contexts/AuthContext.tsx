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
    defaultPath: "/overview",
    themeTone: "bg-[#edf0ff] text-[#3048a8] border-[#cbd5f5]",
    avatarTone: "bg-[#3048a8] text-white",
  },
  FACULTY: {
    label: "Faculty Mentor",
    badge: "Mentorship",
    description: "Monitor mentee cohorts, skill gap interventions, and verify internships.",
    idLabel: "Faculty Employee ID",
    defaultPath: "/faculty",
    themeTone: "bg-[#e5f7f2] text-[#13876f] border-[#a5dfd1]",
    avatarTone: "bg-[#13876f] text-white",
  },
  HOD: {
    label: "Head of Dept",
    badge: "Department Lead",
    description: "Department-wide analytics, curriculum gap insights, and cohort reports.",
    idLabel: "HOD / Faculty Code",
    defaultPath: "/overview",
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

export const DEFAULT_STUDENT: PragatiUser = {
  id: "user-student-1",
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
};

interface AuthContextType {
  user: PragatiUser | null;
  role: PragatiRole;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: PragatiUser) => void;
  loginWithDemo: (role: PragatiRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: PragatiRole) => void;
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
    } catch {}
    return DEFAULT_STUDENT;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const demoLoginMutation = trpc.auth.demoLogin.useMutation();

  const syncUser = async (authToken: string) => {
    if (authToken.startsWith("demo_")) {
      const targetRole = authToken.replace("demo_", "") as PragatiRole;
      try {
        const res = await demoLoginMutation.mutateAsync({
          role: targetRole,
        });
        if (res.success && res.user) {
          const syncedUser: PragatiUser = {
            ...res.user,
            avatar: res.user.name
              .split(" ")
              .map(p => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase(),
            roleId:
              targetRole === "STUDENT"
                ? "CS-2023-0842"
                : targetRole === "FACULTY"
                ? "FAC-CS-104"
                : targetRole === "HOD"
                ? "HOD-CSE-001"
                : "ADM-SYS-001",
            department: "Computer Science & Engineering",
            designation: ROLE_CONFIG[targetRole]?.description ?? "",
          };
          setUser(syncedUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedUser));
          localStorage.setItem(TOKEN_KEY, res.token);
        }
      } catch (err: any) {
        console.error("[AuthContext] Failed to sync user:", err);
      }
    }
  };

  useEffect(() => {
    if (token) {
      syncUser(token);
    }
  }, [token]);

  const login = (newUser: PragatiUser) => {
    setUser(newUser);
    setToken(`demo_${newUser.role}`);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      localStorage.setItem(TOKEN_KEY, `demo_${newUser.role}`);
    } catch {}
  };

  const loginWithDemo = async (targetRole: PragatiRole) => {
    setIsLoading(true);
    try {
      const res = await demoLoginMutation.mutateAsync({ role: targetRole });
      if (res.success && res.user) {
        setToken(res.token);
        const syncedUser: PragatiUser = {
          ...res.user,
          avatar: res.user.name
            .split(" ")
            .map(p => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase(),
          roleId:
            targetRole === "STUDENT"
              ? "CS-2023-0842"
              : targetRole === "FACULTY"
              ? "FAC-CS-104"
              : targetRole === "HOD"
              ? "HOD-CSE-001"
              : "ADM-SYS-001",
          department: "Computer Science & Engineering",
          designation: ROLE_CONFIG[targetRole]?.description ?? "",
        };
        setUser(syncedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedUser));
        localStorage.setItem(TOKEN_KEY, res.token);
        toast.success(`Logged in as ${res.user.name} (${res.user.role})`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to switch role.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    toast.info("Logged out of PRAGATI.");
  };

  const switchRole = (newRole: PragatiRole) => {
    loginWithDemo(newRole);
  };

  const updateMustChangePassword = (mustChange: boolean) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, mustChangePassword: mustChange };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
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
