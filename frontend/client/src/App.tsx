import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Achievements from "./pages/Achievements";
import Opportunities from "./pages/Opportunities";
import Progress from "./pages/Progress";
import Skills from "./pages/Skills";
import { WorkspacePage } from "./pages/WorkspacePages";
import { Route, Switch } from "wouter";

const Internship = () => <WorkspacePage kind="internship" />;
const Passport = () => <WorkspacePage kind="passport" />;
const Mentoring = () => <WorkspacePage kind="mentoring" />;

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/overview" component={Home} />
    <Route path="/dashboard" component={Home} />
    <Route path="/progress" component={Progress} />
    <Route path="/skills" component={Skills} />
    <Route path="/achievements" component={Achievements} />
    <Route path="/opportunities" component={Opportunities} />
    <Route path="/internship" component={Internship} />
    <Route path="/career-passport" component={Passport} />
    <Route path="/mentoring" component={Mentoring} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
