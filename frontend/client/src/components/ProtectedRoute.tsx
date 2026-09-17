import { useAuth, type PragatiRole, ROLE_CONFIG } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { ShieldCheck, Lock } from "lucide-react";

// ─── Role → allowed paths map ─────────────────────────────────────────────────
export const ROLE_ROUTES: Record<PragatiRole, string[]> = {
  STUDENT: [
    "/overview", "/dashboard", "/progress", "/skills",
    "/achievements", "/internship", "/opportunities",
    "/career-passport", "/mentoring",
  ],
  FACULTY: [
    "/faculty", "/faculty/wards", "/internship", "/mentoring", "/skills",
  ],
  HOD: [
    "/overview", "/dashboard", "/hod", "/faculty", "/faculty/wards",
    "/skills", "/opportunities",
  ],
  ADMIN: [
    "/overview", "/dashboard", "/hod", "/progress", "/skills",
    "/achievements", "/internship", "/opportunities",
    "/career-passport", "/mentoring", "/faculty", "/faculty/wards",
    "/admin/overview", "/admin/users", "/admin/students", "/admin/faculty",
    "/admin/departments", "/admin/academics", "/admin/skills", "/admin/assessments",
    "/admin/verification", "/admin/internships", "/admin/placement", "/admin/recruitment",
    "/admin/notifications", "/admin/audit-logs", "/admin/security", "/admin/system-health",
    "/admin/settings",
  ],
};

// ─── Default landing page per role ────────────────────────────────────────────
export const ROLE_DEFAULT_PATH: Record<PragatiRole, string> = {
  STUDENT:  "/overview",
  FACULTY:  "/faculty",
  HOD:      "/overview",
  ADMIN:    "/admin/overview",
};

// ─── ProtectedRoute wrapper ────────────────────────────────────────────────────
interface ProtectedRouteProps {
  allowedRoles: PragatiRole[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { role, user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f7fb]">
        <div className="premium-card max-w-sm p-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-extrabold text-[#1c2a47]">Sign in required</h2>
          <p className="mt-2 text-sm text-[#71809a]">Please log in to access PRAGATI.</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition shadow-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (user?.mustChangePassword && location !== "/reset-initial-password") {
    navigate("/reset-initial-password");
    return null;
  }

  if (!allowedRoles.includes(role)) {
    const config = ROLE_CONFIG[role];
    const defaultPath = ROLE_DEFAULT_PATH[role];
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f7fb]">
        <div className="premium-card max-w-sm p-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0d2] text-[#bd7a27]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-extrabold text-[#1c2a47]">Access Restricted</h2>
          <p className="mt-2 text-sm text-[#71809a]">
            This page is not available for <strong>{config.label}</strong> role.
          </p>
          <button
            onClick={() => navigate(defaultPath)}
            className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition shadow-sm"
          >
            Go to my dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
