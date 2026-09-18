import { useAuth, type PragatiRole, ROLE_CONFIG } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { ShieldCheck, Lock, Users, Building2, LogIn, GraduationCap } from "lucide-react";

// ─── Role → allowed paths map ─────────────────────────────────────────────────
export const ROLE_ROUTES: Record<PragatiRole, string[]> = {
  STUDENT: [
    "/student/overview", "/student/progress", "/student/academics", "/student/skills",
    "/student/assessments", "/student/achievements", "/student/internship",
    "/student/opportunities", "/student/career-passport",
    // legacy aliases for backward-compatibility
    "/overview", "/dashboard", "/progress", "/skills", "/achievements", "/internship", "/opportunities", "/career-passport", "/academics",
  ],
  FACULTY: [
    "/faculty/overview", "/faculty/wards", "/faculty/academics", "/faculty/mentoring", "/faculty/internships", "/faculty/skills",
    // legacy aliases for backward-compatibility
    "/faculty", "/internship", "/mentoring", "/academics", "/skills",
  ],
  HOD: [
    "/hod/overview", "/hod/approvals", "/hod/faculty", "/hod/academics", "/hod/skills", "/hod/opportunities",
    // legacy aliases for backward-compatibility
    "/hod", "/overview", "/dashboard", "/skills", "/opportunities", "/academics", "/faculty",
  ],
  ADMIN: [
    "/admin/overview", "/admin/approvals", "/admin/users", "/admin/students", "/admin/faculty",
    "/admin/departments", "/admin/academics", "/admin/skills", "/admin/assessments",
    "/admin/verification", "/admin/internships", "/admin/placement", "/admin/recruitment",
    "/admin/notifications", "/admin/audit-logs", "/admin/security", "/admin/system-health",
    "/admin/settings",
    // legacy aliases for backward-compatibility
    "/overview", "/dashboard", "/hod", "/progress", "/skills", "/achievements", "/internship", "/opportunities", "/career-passport", "/mentoring", "/faculty",
  ],
};

// ─── Default landing page per role ────────────────────────────────────────────
export const ROLE_DEFAULT_PATH: Record<PragatiRole, string> = {
  STUDENT:  "/student/overview",
  FACULTY:  "/faculty/wards",
  HOD:      "/hod/overview",
  ADMIN:    "/admin/overview",
};

// ─── ProtectedRoute wrapper ────────────────────────────────────────────────────
interface ProtectedRouteProps {
  allowedRoles: PragatiRole[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { role, user, isAuthenticated, switchRole } = useAuth();
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
      <div className="grid min-h-screen place-items-center bg-[#f5f7fb] p-4">
        <div className="premium-card max-w-md w-full p-8 text-center shadow-xl border border-slate-200/80 rounded-3xl bg-white">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-xs">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-[#1c2a47] tracking-tight">Access Restricted</h2>
          <p className="mt-2 text-sm text-[#71809a] leading-relaxed">
            This page requires an authorized role ({allowedRoles.map(r => ROLE_CONFIG[r]?.label || r).join(" / ")}), but you are currently signed in as:
          </p>
          <div className="my-3 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-800 border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {user?.name || "User"} ({config?.label || role})
          </div>

          <div className="mt-5 space-y-2">
            {allowedRoles.includes("STUDENT") && role !== "STUDENT" && (
              <button
                type="button"
                onClick={async () => {
                  await switchRole("STUDENT");
                  navigate("/student/overview");
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-xs font-bold text-white hover:bg-[#1d4ed8] transition shadow-sm"
              >
                <GraduationCap className="h-4 w-4" />
                Switch to Student (Rahul Sharma)
              </button>
            )}

            {allowedRoles.includes("FACULTY") && role !== "FACULTY" && (
              <button
                type="button"
                onClick={async () => {
                  await switchRole("FACULTY");
                  navigate("/faculty/wards");
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#13876f] px-4 py-3 text-xs font-bold text-white hover:bg-[#0f6c58] transition shadow-sm"
              >
                <Users className="h-4 w-4" />
                Switch to Faculty Mentor (Dr. Anand Verma)
              </button>
            )}

            {allowedRoles.includes("HOD") && role !== "HOD" && (
              <button
                type="button"
                onClick={async () => {
                  await switchRole("HOD");
                  navigate("/hod/overview");
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#7358c9] px-4 py-3 text-xs font-bold text-white hover:bg-[#5e44ab] transition shadow-sm"
              >
                <Building2 className="h-4 w-4" />
                Switch to Head of Dept (Prof. Sunita Rao)
              </button>
            )}

            {allowedRoles.includes("ADMIN") && role !== "ADMIN" && (
              <button
                type="button"
                onClick={async () => {
                  await switchRole("ADMIN");
                  navigate("/admin/overview");
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#c24152] px-4 py-3 text-xs font-bold text-white hover:bg-[#a63342] transition shadow-sm"
              >
                <ShieldCheck className="h-4 w-4" />
                Switch to Administrator
              </button>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate(defaultPath)}
                className="rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                My Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                Switch Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
