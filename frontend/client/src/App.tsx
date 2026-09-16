import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import PersonaSwitcher from "./components/PersonaSwitcher";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Achievements from "./pages/Achievements";
import AuthPage from "./pages/Auth";
import FacultyWards from "./pages/FacultyWards";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Opportunities from "./pages/Opportunities";
import Progress from "./pages/Progress";
import Skills from "./pages/Skills";
import { WorkspacePage } from "./pages/WorkspacePages";
import { Route, Switch } from "wouter";

const Internship = () => <WorkspacePage kind="internship" />;
const Passport = () => <WorkspacePage kind="passport" />;
const Mentoring = () => <WorkspacePage kind="mentoring" />;

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/overview" component={Home} />
      <Route path="/dashboard" component={Home} />
      <Route path="/login">{() => <AuthPage initialMode="login" />}</Route>
      <Route path="/register">{() => <AuthPage initialMode="register" />}</Route>
      <Route path="/auth">{() => <AuthPage initialMode="login" />}</Route>
      <Route path="/login-personas" component={Login} />
      <Route path="/progress" component={Progress} />
      <Route path="/skills" component={Skills} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/opportunities" component={Opportunities} />
      <Route path="/internship" component={Internship} />
      <Route path="/career-passport" component={Passport} />
      <Route path="/mentoring" component={Mentoring} />
      <Route path="/faculty" component={FacultyWards} />
      <Route path="/faculty/wards" component={FacultyWards} />
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
