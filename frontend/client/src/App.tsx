import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import PersonaSwitcher from "./components/PersonaSwitcher";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Achievements from "./pages/Achievements";
import AuthPage from "./pages/Auth";
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
import PlacementDashboard from "./pages/tnp/PlacementDashboard";
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
import { Route, Switch } from "wouter";

const Internship = () => <WorkspacePage kind="internship" />;
const Passport   = () => <WorkspacePage kind="passport" />;
const Mentoring  = () => <WorkspacePage kind="mentoring" />;

function RoleAwareDashboard() {
  const { role } = useAuth();
  if (role === "ADMIN") return <AdminOverview />;
  if (role === "HOD") return <HodDashboard />;
  if (role === "FACULTY") return <FacultyWards />;
  if (role === "TNP_COORDINATOR") return <PlacementDashboard />;
  return <Home />;
}

function Router() {
  return (
    <Switch>
      {/* Public — always visible */}
      <Route path="/"        component={LandingPage} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/login">{() => <AuthPage initialMode="login" />}</Route>
      <Route path="/register">{() => <AuthPage initialMode="register" />}</Route>
      <Route path="/auth">{() => <AuthPage initialMode="login" />}</Route>
      <Route path="/login-personas" component={Login} />

      {/* ── Role-aware Overview / Dashboard ── */}
      <Route path="/overview">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]}><RoleAwareDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]}><RoleAwareDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/hod">
        {() => <ProtectedRoute allowedRoles={["HOD", "ADMIN"]}><HodDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/progress">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><Progress /></ProtectedRoute>}
      </Route>
      <Route path="/skills">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "HOD", "ADMIN"]}><Skills /></ProtectedRoute>}
      </Route>
      <Route path="/assessments">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "HOD", "ADMIN"]}><Assessment /></ProtectedRoute>}
      </Route>
      <Route path="/assessments/:id">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "HOD", "ADMIN"]}><AssessmentOverview /></ProtectedRoute>}
      </Route>
      <Route path="/assessments/:id/attempt/:attemptId">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "HOD", "ADMIN"]}><AssessmentAttempt /></ProtectedRoute>}
      </Route>
      <Route path="/assessments/:id/review/:attemptId">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "HOD", "ADMIN"]}><AssessmentReview /></ProtectedRoute>}
      </Route>
      <Route path="/assessments/:id/result/:attemptId">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "HOD", "ADMIN"]}><AssessmentResult /></ProtectedRoute>}
      </Route>
      <Route path="/achievements">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><Achievements /></ProtectedRoute>}
      </Route>
      <Route path="/career-passport">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}><Passport /></ProtectedRoute>}
      </Route>
      <Route path="/mentoring">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "ADMIN"]}><Mentoring /></ProtectedRoute>}
      </Route>

      {/* ── Shared: STUDENT + FACULTY + ADMIN ── */}
      <Route path="/internship">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "ADMIN"]}><Internship /></ProtectedRoute>}
      </Route>

      {/* ── STUDENT + TNP + HOD + ADMIN ── */}
      <Route path="/opportunities">
        {() => <ProtectedRoute allowedRoles={["STUDENT", "TNP_COORDINATOR", "HOD", "ADMIN"]}><Opportunities /></ProtectedRoute>}
      </Route>

      {/* ── FACULTY + HOD + TNP + ADMIN ── */}
      <Route path="/faculty">
        {() => <ProtectedRoute allowedRoles={["FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]}><FacultyWards /></ProtectedRoute>}
      </Route>
      <Route path="/faculty/wards">
        {() => <ProtectedRoute allowedRoles={["FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]}><FacultyWards /></ProtectedRoute>}
      </Route>

      {/* ── TNP COORDINATOR ROUTES ── */}
      <Route path="/tnp">
        {() => <ProtectedRoute allowedRoles={["TNP_COORDINATOR", "ADMIN"]}><PlacementDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/tnp/placements">
        {() => <ProtectedRoute allowedRoles={["TNP_COORDINATOR", "ADMIN"]}><PlacementDashboard /></ProtectedRoute>}
      </Route>

      {/* ── ADMIN ROUTES ── */}
      <Route path="/admin/overview">
        {() => <ProtectedRoute allowedRoles={["ADMIN"]}><AdminOverview /></ProtectedRoute>}
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
