import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type UserRole =
  | "STUDENT"
  | "FACULTY"
  | "HOD"
  | "TNP_COORDINATOR"
  | "ADMIN";

export interface StudentProfileData {
  id: string;
  enrollmentNumber: string;
  program: string;
  currentSemester: number;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institutionId: string;
  departmentId?: string | null;
  studentProfile?: StudentProfileData;
}

interface AuthContextType {
  user: UserData | null;
  role: UserRole | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithDemo: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return (
      localStorage.getItem("pragati_token") ||
      sessionStorage.getItem("pragati_token") ||
      "demo_STUDENT" // Default to Student demo persona for effortless first load
    );
  });

  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // In demo mode or Supabase mode, fetch current user info
  const demoLoginMutation = trpc.auth.demoLogin.useMutation();

  const syncUser = async (authToken: string) => {
    setIsLoading(true);
    try {
      if (authToken.startsWith("demo_")) {
        const targetRole = authToken.replace("demo_", "") as UserRole;
        const res = await demoLoginMutation.mutateAsync({ role: targetRole });
        if (res.success && res.user) {
          setUser(res.user as UserData);
          localStorage.setItem("pragati_token", res.token);
        }
      }
    } catch (err: any) {
      console.error("[AuthContext] Failed to sync user:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      syncUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const loginWithDemo = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const res = await demoLoginMutation.mutateAsync({ role: targetRole });
      if (res.success && res.user) {
        setToken(res.token);
        setUser(res.user as UserData);
        localStorage.setItem("pragati_token", res.token);
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
    localStorage.removeItem("pragati_token");
    sessionStorage.removeItem("pragati_token");
    toast.info("Logged out of PRAGATI.");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        token,
        isLoading,
        isAuthenticated: Boolean(user),
        loginWithDemo,
        logout,
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
