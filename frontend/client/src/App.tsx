import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PersonaSwitcher from "./components/PersonaSwitcher";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Achievements from "./pages/Achievements";
import AuthPage from "./pages/Auth";
import CareerPassport from "./pages/CareerPassport";
import FacultyWards from "./pages/FacultyWards";
import HodDashboard from "./pages/HodDashboard";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Opportunities from "./pages/Opportunities";
import Progress from "./pages/Progress";
import Skills from "./pages/Skills";
import Assessment from "./pages/Assessment";
import AssessmentOverview from "./pages/AssessmentOverview";
import AssessmentAttempt from "./pages/AssessmentAttempt";
import AssessmentReview from "./pages/AssessmentReview";
import AssessmentResult from "./pages/AssessmentResult";
import { WorkspacePage } from "./pages/WorkspacePages";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminFaculty from "./pages/admin/AdminFaculty";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminAcademics from "./pages/admin/AdminAcademics";
import AdminSkills from "./pages/admin/AdminSkills";
import AdminAssessments from "./pages/admin/AdminAssessments";
import AdminVerification from "./pages/admin/AdminVerification";
import AdminInternships from "./pages/admin/AdminInternships";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminSystemHealth from "./pages/admin/AdminSystemHealth";
import {
  AdminPlacement,
  AdminRecruitment,
  AdminNotifications,
  AdminSettings,
} from "./pages/admin/AdminStubPages";
import SuperAdminPortal from "./pages/SuperAdminPortal";
import HodApprovals from "./pages/HodApprovals";
import AdminApprovals from "./pages/AdminApprovals";
import FirstLoginPasswordReset from "./pages/FirstLoginPasswordReset";
import AcademicsWorkspace from "./pages/AcademicsWorkspace";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import type { PragatiRole } from "@/contexts/AuthContext";

const Internship = () => <WorkspacePage kind="internship" />;
const Passport   = () => <CareerPassport />;
const Mentoring  = () => <WorkspacePage kind="mentoring" />;

function RoleRedirect({
  routes,
  fallback = "/student/overview",
}: {
  routes: Partial<Record<PragatiRole, string>>;
  fallback?: string;
}) {
  const { role } = useAuth();
  const [, navigate] = useLocation();
  const destination = routes[role] || fallback;

  useEffect(() => {
    navigate(destination, { replace: true });
  }, [destination, navigate]);

  return null;
}

function Router() {
  return (
    <Switch>
      {/* ── Unlinked Platform Owner / Super Admin Portal ── */}
      <Route path="/super-admin-pragati01" component={SuperAdminPortal} />

      {/* Public — always visible */}
      <Route path="/"        component={LandingPage} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/login">{() => <AuthPage initialMode="login" />}</Route>
      <Route path="/register">{() => <AuthPage initialMode="register" />}</Route>
      <Route path="/auth">{() => <AuthPage initialMode="login" />}</Route>
      <Route path="/login-personas" component={Login} />
      <Route path="/reset-initial-password" component={FirstLoginPasswordReset} />

      {/* ══════════════════════════════════════════════════════════════════════
          1. STUDENT WORKSPACE ROUTES (/student/*)
         ══════════════════════════════════════════════════════════════════════ */}
      <Route path="/student/overview">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><Home /></ProtectedRoute>}
      </Route>
      <Route path="/student/progress">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><Progress /></ProtectedRoute>}
      </Route>
      <Route path="/student/academics">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><AcademicsWorkspace /></ProtectedRoute>}
      </Route>
      <Route path="/student/skills">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><Skills /></ProtectedRoute>}
      </Route>
      <Route path="/student/assessments">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><Assessment /></ProtectedRoute>}
      </Route>
      <Route path="/student/assessments/:id">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><AssessmentOverview /></ProtectedRoute>}
      </Route>
      <Route path="/student/assessments/:id/attempt/:attemptId">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><AssessmentAttempt /></ProtectedRoute>}
      </Route>
      <Route path="/student/assessments/:id/review/:attemptId">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><AssessmentReview /></ProtectedRoute>}
      </Route>
      <Route path="/student/assessments/:id/result/:attemptId">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><AssessmentResult /></ProtectedRoute>}
      </Route>
      <Route path="/student/achievements">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><Achievements /></ProtectedRoute>}
      </Route>
      <Route path="/student/career-passport">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><CareerPassport /></ProtectedRoute>}
      </Route>
      <Route path="/student/internship">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><Internship /></ProtectedRoute>}
      </Route>
      <Route path="/student/opportunities">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><Opportunities /></ProtectedRoute>}
      </Route>

      {/* ══════════════════════════════════════════════════════════════════════
          2. FACULTY WORKSPACE ROUTES (/faculty/*)
         ══════════════════════════════════════════════════════════════════════ */}
      <Route path="/faculty/overview">
        {() => <ProtectedRoute allowedRoles={["FACULTY", "HOD", "ADMIN"]}><FacultyWards /></ProtectedRoute>}
      </Route>
      <Route path="/faculty/wards">
        {() => <ProtectedRoute allowedRoles={["FACULTY", "HOD", "ADMIN"]}><FacultyWards /></ProtectedRoute>}
      </Route>
      <Route path="/faculty/academics">
        {() => <ProtectedRoute allowedRoles={["FACULTY", "HOD", "ADMIN"]}><AcademicsWorkspace /></ProtectedRoute>}
      </Route>
      <Route path="/faculty/mentoring">
        {() => <ProtectedRoute allowedRoles={["FACULTY", "HOD", "ADMIN"]}><Mentoring /></ProtectedRoute>}
      </Route>
      <Route path="/faculty/internships">
        {() => <ProtectedRoute allowedRoles={["FACULTY", "HOD", "ADMIN"]}><Internship /></ProtectedRoute>}
      </Route>
      <Route path="/faculty/skills">
        {() => <ProtectedRoute allowedRoles={["FACULTY", "HOD", "ADMIN"]}><Skills /></ProtectedRoute>}
      </Route>

      {/* ══════════════════════════════════════════════════════════════════════
          3. HOD WORKSPACE ROUTES (/hod/*)
         ══════════════════════════════════════════════════════════════════════ */}
      <Route path="/hod/overview">
        {() => <ProtectedRoute allowedRoles={["HOD", "ADMIN"]}><HodDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/hod/approvals">
        {() => <ProtectedRoute allowedRoles={["HOD", "ADMIN"]}><HodApprovals /></ProtectedRoute>}
      </Route>
      <Route path="/hod/faculty">
        {() => <ProtectedRoute allowedRoles={["HOD", "ADMIN"]}><FacultyWards /></ProtectedRoute>}
      </Route>
      <Route path="/hod/academics">
        {() => <ProtectedRoute allowedRoles={["HOD", "ADMIN"]}><AcademicsWorkspace /></ProtectedRoute>}
      </Route>
      <Route path="/hod/skills">
        {() => <ProtectedRoute allowedRoles={["HOD", "ADMIN"]}><Skills /></ProtectedRoute>}
      </Route>
      <Route path="/hod/opportunities">
        {() => <ProtectedRoute allowedRoles={["HOD", "ADMIN"]}><Opportunities /></ProtectedRoute>}
      </Route>

      {/* ══════════════════════════════════════════════════════════════════════
          4. LEGACY ROOT SHIMS (Redirect to Role-Scoped URLs)
         ══════════════════════════════════════════════════════════════════════ */}
      <Route path="/overview">
        {() => (
          <RoleRedirect
            routes={{
              STUDENT: "/student/overview",
              FACULTY: "/faculty/wards",
              HOD: "/hod/overview",
              ADMIN: "/admin/overview",
            }}
          />
        )}
      </Route>
      <Route path="/dashboard">
        {() => (
          <RoleRedirect
            routes={{
              STUDENT: "/student/overview",
              FACULTY: "/faculty/wards",
              HOD: "/hod/overview",
              ADMIN: "/admin/overview",
            }}
          />
        )}
      </Route>
      <Route path="/hod">
        {() => <RoleRedirect routes={{ HOD: "/hod/overview", ADMIN: "/hod/overview" }} fallback="/hod/overview" />}
      </Route>
      <Route path="/faculty">
        {() => <RoleRedirect routes={{ FACULTY: "/faculty/wards", HOD: "/hod/faculty", ADMIN: "/admin/faculty" }} fallback="/faculty/wards" />}
      </Route>
      <Route path="/progress">
        {() => <RoleRedirect routes={{ STUDENT: "/student/progress" }} fallback="/student/progress" />}
      </Route>
      <Route path="/academics">
        {() => (
          <RoleRedirect
            routes={{
              STUDENT: "/student/academics",
              FACULTY: "/faculty/academics",
              HOD: "/hod/academics",
              ADMIN: "/admin/academics",
            }}
          />
        )}
      </Route>
      <Route path="/skills">
        {() => (
          <RoleRedirect
            routes={{
              STUDENT: "/student/skills",
              FACULTY: "/faculty/skills",
              HOD: "/hod/skills",
              ADMIN: "/admin/skills",
            }}
          />
        )}
      </Route>
      <Route path="/assessments">
        {() => <RoleRedirect routes={{ STUDENT: "/student/assessments" }} fallback="/student/assessments" />}
      </Route>
      <Route path="/assessments/:id">
        {(params) => <RoleRedirect routes={{ STUDENT: `/student/assessments/${params.id}` }} fallback={`/student/assessments/${params.id}`} />}
      </Route>
      <Route path="/assessments/:id/attempt/:attemptId">
        {(params) => <RoleRedirect routes={{ STUDENT: `/student/assessments/${params.id}/attempt/${params.attemptId}` }} fallback={`/student/assessments/${params.id}/attempt/${params.attemptId}`} />}
      </Route>
      <Route path="/assessments/:id/review/:attemptId">
        {(params) => <RoleRedirect routes={{ STUDENT: `/student/assessments/${params.id}/review/${params.attemptId}` }} fallback={`/student/assessments/${params.id}/review/${params.attemptId}`} />}
      </Route>
      <Route path="/assessments/:id/result/:attemptId">
        {(params) => <RoleRedirect routes={{ STUDENT: `/student/assessments/${params.id}/result/${params.attemptId}` }} fallback={`/student/assessments/${params.id}/result/${params.attemptId}`} />}
      </Route>
      <Route path="/achievements">
        {() => <RoleRedirect routes={{ STUDENT: "/student/achievements" }} fallback="/student/achievements" />}
      </Route>
      <Route path="/career-passport">
        {() => <RoleRedirect routes={{ STUDENT: "/student/career-passport" }} fallback="/student/career-passport" />}
      </Route>
      <Route path="/internship">
        {() => (
          <RoleRedirect
            routes={{
              STUDENT: "/student/internship",
              FACULTY: "/faculty/internships",
              ADMIN: "/admin/internships",
            }}
          />
        )}
      </Route>
      <Route path="/opportunities">
        {() => (
          <RoleRedirect
            routes={{
              STUDENT: "/student/opportunities",
              HOD: "/hod/opportunities",
              ADMIN: "/admin/placement",
            }}
          />
        )}
      </Route>
      <Route path="/mentoring">
        {() => (
          <RoleRedirect
            routes={{
              STUDENT: "/student/mentoring",
              FACULTY: "/faculty/mentoring",
              ADMIN: "/admin/overview",
            }}
          />
        )}
      </Route>

      {/* ── ADMIN ROUTES ── */}
      <Route path="/admin/overview">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminOverview /></ProtectedRoute>}
      </Route>
      <Route path="/admin/approvals">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminApprovals /></ProtectedRoute>}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminUsers /></ProtectedRoute>}
      </Route>
      <Route path="/admin/students">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminStudents /></ProtectedRoute>}
      </Route>
      <Route path="/admin/faculty">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminFaculty /></ProtectedRoute>}
      </Route>
      <Route path="/admin/departments">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminDepartments /></ProtectedRoute>}
      </Route>
      <Route path="/admin/academics">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminAcademics /></ProtectedRoute>}
      </Route>
      <Route path="/admin/skills">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminSkills /></ProtectedRoute>}
      </Route>
      <Route path="/admin/assessments">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminAssessments /></ProtectedRoute>}
      </Route>
      <Route path="/admin/verification">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminVerification /></ProtectedRoute>}
      </Route>
      <Route path="/admin/internships">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminInternships /></ProtectedRoute>}
      </Route>
      <Route path="/admin/placement">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminPlacement /></ProtectedRoute>}
      </Route>
      <Route path="/admin/recruitment">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminRecruitment /></ProtectedRoute>}
      </Route>
      <Route path="/admin/audit-logs">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminAuditLogs /></ProtectedRoute>}
      </Route>
      <Route path="/admin/security">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminSecurity /></ProtectedRoute>}
      </Route>
      <Route path="/admin/system-health">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminSystemHealth /></ProtectedRoute>}
      </Route>
      <Route path="/admin/notifications">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminNotifications /></ProtectedRoute>}
      </Route>
      <Route path="/admin/settings">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminSettings /></ProtectedRoute>}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <PersonaSwitcher />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
