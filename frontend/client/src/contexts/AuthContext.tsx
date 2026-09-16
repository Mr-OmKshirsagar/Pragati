import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export type PragatiRole = "STUDENT" | "FACULTY" | "HOD" | "TNP_COORDINATOR" | "ADMIN";

export interface PragatiUser {
  id: string;
  name: string;
  email: string;
  role: PragatiRole;
  department: string;
  roleId: string;
  designation: string;
  avatar: string;
}

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
    defaultPath: "/mentoring",
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
  TNP_COORDINATOR: {
    label: "T&P Officer",
    badge: "Placement Cell",
    description: "Publish drives, evaluate eligibility criteria, and track offers.",
    idLabel: "T&P Officer ID",
    defaultPath: "/opportunities",
    themeTone: "bg-[#fff1dc] text-[#bd7a27] border-[#f6d7ab]",
    avatarTone: "bg-[#bd7a27] text-white",
  },
  ADMIN: {
    label: "Administrator",
    badge: "System Authority",
    description: "Institution governance, tamper audit trails, and platform configurations.",
    idLabel: "Admin Security Code",
    defaultPath: "/overview",
    themeTone: "bg-[#ffebee] text-[#c24152] border-[#f8b4be]",
    avatarTone: "bg-[#c24152] text-white",
  },
};

export const DEFAULT_STUDENT: PragatiUser = {
  id: "user-student-1",
  name: "Rahul Sharma",
  email: "rahul.sharma@northstar.edu",
  role: "STUDENT",
  department: "Computer Science & Engineering",
  roleId: "CS-2023-0842",
  designation: "B.Tech CSE · Sem 6",
  avatar: "RS",
};

interface AuthContextType {
  user: PragatiUser | null;
  role: PragatiRole;
  isAuthenticated: boolean;
  login: (user: PragatiUser) => void;
  logout: () => void;
  switchRole: (role: PragatiRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "pragati_active_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PragatiUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_STUDENT;
  });

  const login = (newUser: PragatiUser) => {
    setUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch {}
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const switchRole = (newRole: PragatiRole) => {
    const demoUser: PragatiUser = {
      id: `user-${newRole.toLowerCase()}`,
      name:
        newRole === "STUDENT"
          ? "Rahul Sharma"
          : newRole === "FACULTY"
          ? "Dr. Meera Nair"
          : newRole === "HOD"
          ? "Dr. Sunita Rao"
          : newRole === "TNP_COORDINATOR"
          ? "Prof. Vikram Mehta"
          : "System Administrator",
      email: `${newRole.toLowerCase()}@northstar.edu`,
      role: newRole,
      department: "Computer Science & Engineering",
      roleId:
        newRole === "STUDENT"
          ? "CS-2023-0842"
          : newRole === "FACULTY"
          ? "FAC-CS-104"
          : newRole === "HOD"
          ? "HOD-CSE-001"
          : newRole === "TNP_COORDINATOR"
          ? "TNP-ENG-042"
          : "ADM-SYS-001",
      designation: ROLE_CONFIG[newRole].description,
      avatar:
        newRole === "STUDENT"
          ? "RS"
          : newRole === "FACULTY"
          ? "MN"
          : newRole === "HOD"
          ? "SR"
          : newRole === "TNP_COORDINATOR"
          ? "VM"
          : "SA",
    };
    login(demoUser);
    toast.success(`Switched active persona to ${ROLE_CONFIG[newRole].label}`);
  };

  const role: PragatiRole = user?.role ?? "STUDENT";
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function usePragatiAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("usePragatiAuth must be used within an AuthProvider");
  }
  return context;
}
