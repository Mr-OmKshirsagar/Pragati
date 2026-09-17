import { ROLE_CONFIG, type PragatiRole, type PragatiUser, usePragatiAuth } from "@/contexts/AuthContext";
import { getRoleSidebarTheme } from "@/lib/roleTheme";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

interface AuthProps {
  initialMode?: "login" | "register";
}

const ROLES: { role: PragatiRole; icon: React.ComponentType<{ className?: string }> }[] = [
  { role: "STUDENT", icon: GraduationCap },
  { role: "FACULTY", icon: UserCheck },
  { role: "HOD", icon: Building2 },
  { role: "TNP_COORDINATOR", icon: BriefcaseBusiness },
  { role: "ADMIN", icon: ShieldCheck },
];

const STATIC_DEMO_ACCOUNTS: Record<PragatiRole, PragatiUser & { hintPassword: string }> = {
  STUDENT: {
    id: "user-student-1",
    name: "Rahul Sharma",
    email: "rahul.sharma@northstar.edu",
    role: "STUDENT",
    department: "Computer Science & Engineering",
    departmentId: "CSE",
    institutionId: "NIT-001",
    roleId: "CS-2023-0842",
    designation: "B.Tech CSE · Sem 6",
    avatar: "RS",
    hintPassword: "password123",
    studentProfile: {
      id: "student-rahul-sharma",
      enrollmentNumber: "CSE2024042",
      program: "B.Tech Computer Science and Engineering",
      currentSemester: 6,
    },
  },
  FACULTY: {
    id: "user-faculty-1",
    name: "Dr. Meera Nair",
    email: "meera.nair@northstar.edu",
    role: "FACULTY",
    department: "Computer Science & Engineering",
    departmentId: "CSE",
    institutionId: "NIT-001",
    roleId: "FAC-CS-104",
    designation: "Associate Professor & Mentor",
    avatar: "MN",
    hintPassword: "password123",
  },
  HOD: {
    id: "user-hod-1",
    name: "Dr. Sunita Rao",
    email: "sunita.rao@northstar.edu",
    role: "HOD",
    department: "Computer Science & Engineering",
    departmentId: "CSE",
    institutionId: "NIT-001",
    roleId: "HOD-CSE-001",
    designation: "Head of Department (CSE)",
    avatar: "SR",
    hintPassword: "password123",
  },
  TNP_COORDINATOR: {
    id: "user-tnp-1",
    name: "Prof. Vikram Mehta",
    email: "vikram.mehta@northstar.edu",
    role: "TNP_COORDINATOR",
    department: "Training & Placement Cell",
    departmentId: "CSE",
    institutionId: "NIT-001",
    roleId: "TNP-ENG-042",
    designation: "Head of Training & Placement",
    avatar: "VM",
    hintPassword: "password123",
  },
  ADMIN: {
    id: "user-admin-1",
    name: "System Administrator",
    email: "admin@northstar.edu",
    role: "ADMIN",
    department: "Institutional Systems & Governance",
    departmentId: "SYS",
    institutionId: "NIT-001",
    roleId: "ADM-SYS-001",
    designation: "Platform Administrator",
    avatar: "SA",
    hintPassword: "password123",
  },
};

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
];

export default function AuthPage({ initialMode = "login" }: AuthProps) {
  const [, navigate] = useLocation();
  const { login, loginWithDemo } = usePragatiAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [selectedRole, setSelectedRole] = useState<PragatiRole>("STUDENT");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [roleId, setRoleId] = useState("");
  const [designation, setDesignation] = useState("");

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const demoAccountsQuery = trpc.auth.demoAccounts.useQuery();

  const roleConfig = ROLE_CONFIG[selectedRole];
  const selectedTheme = getRoleSidebarTheme(selectedRole);

  // Pick demo account for current role (with fallback to static personas)
  const currentDemo =
    demoAccountsQuery.data?.find(a => a.role === selectedRole) ||
    STATIC_DEMO_ACCOUNTS[selectedRole];

  const fillDemoAccount = () => {
    if (currentDemo) {
      setEmail(currentDemo.email);
      setPassword(currentDemo.hintPassword);
      toast.info(`Filled demo credentials for ${currentDemo.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email.trim() || !password) {
          toast.error("Please enter your email and password.");
          setLoading(false);
          return;
        }

        const res = await loginMutation.mutateAsync({
          email: email.trim(),
          password,
          role: selectedRole,
        });

        if (res.success && res.user) {
          login(res.user as PragatiUser);
          toast.success(`Welcome back, ${res.user.name}!`);
          navigate(roleConfig.defaultPath);
        }
      } else {
        if (!name.trim()) {
          toast.error("Please enter your full name.");
          setLoading(false);
          return;
        }
        if (!email.trim()) {
          toast.error("Please enter your official institutional email.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Passwords do not match.");
          setLoading(false);
          return;
        }
        if (!roleId.trim()) {
          toast.error(`Please enter your ${roleConfig.idLabel}.`);
          setLoading(false);
          return;
        }

        const res = await registerMutation.mutateAsync({
          name: name.trim(),
          email: email.trim(),
          password,
          role: selectedRole,
          department,
          roleId: roleId.trim(),
          designation: designation.trim() || undefined,
        });

        if (res.success && res.user) {
          login(res.user as PragatiUser);
          toast.success(`Account created successfully! Welcome, ${res.user.name}.`);
          navigate(roleConfig.defaultPath);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed. Please check your credentials.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handle1ClickDemo = async (personaRole: PragatiRole) => {
    setLoading(true);
    try {
      if (loginWithDemo) {
        await loginWithDemo(personaRole);
      } else {
        const demo =
          demoAccountsQuery.data?.find(a => a.role === personaRole) ||
          STATIC_DEMO_ACCOUNTS[personaRole];
        login(demo as PragatiUser);
        toast.success(`Logged in as ${demo.name} (${ROLE_CONFIG[personaRole].label})`);
      }
      navigate(ROLE_CONFIG[personaRole].defaultPath);
    } catch {
      const demo =
        demoAccountsQuery.data?.find(a => a.role === personaRole) ||
        STATIC_DEMO_ACCOUNTS[personaRole];
      login(demo as PragatiUser);
      toast.success(`Logged in as ${demo.name} (${ROLE_CONFIG[personaRole].label})`);
      navigate(ROLE_CONFIG[personaRole].defaultPath);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#15223b]">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 border-b border-[#e2e8f2]/90 bg-[#f5f7fb]/90 backdrop-blur-xl">
        <div className="mx-auto grid h-[70px] max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-8">
          <Link href="/overview" className="grid grid-cols-[auto_1fr] items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-[#A598F5] text-[#1E1145] shadow-[0_8px_20px_rgba(165,152,245,0.3)]">
              <span className="text-xl font-extrabold">P</span>
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#a7e3d3]" />
            </div>
            <div>
              <div className="text-[18px] font-extrabold tracking-[-0.04em]">PRAGATI</div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6b7c9e]">Student Intelligence</div>
            </div>
          </Link>

          <div className="hidden sm:block text-center text-xs text-[#71809a]">
            Role-Based Institutional Authentication · <span className="font-semibold" style={{ color: selectedTheme.activePillBg }}>RBAC v1.0</span>
          </div>

          <Link
            href="/overview"
            className="grid grid-cols-[auto_auto] items-center gap-1.5 rounded-xl border border-[#dfe5ef] bg-white px-3.5 py-2 text-xs font-bold text-[#52617d] shadow-sm transition hover:bg-[#f8f9fc] hover:text-primary"
          >
            <span>Explore Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] xl:gap-12">
          {/* Left Column: Form */}
          <div className="premium-card p-6 sm:p-8 lg:p-10">
            {/* Header / Mode Switcher */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="eyebrow mb-1" style={{ color: selectedTheme.activePillBg }}>Institutional Access</div>
                <h1 className="text-2xl font-extrabold tracking-[-0.04em] text-[#182643] sm:text-3xl">
                  {mode === "login" ? "Sign in to PRAGATI" : "Create institutional account"}
                </h1>
                <p className="mt-1 text-xs text-[#6e7b93]">
                  {mode === "login"
                    ? "Choose your institutional role and enter your authorized credentials."
                    : "Register your profile under the authorized department."}
                </p>
              </div>

              {/* Toggle Mode Pill */}
              <div className="grid grid-cols-2 rounded-xl border border-[#dfe5ef] bg-[#edf1f8] p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-lg py-1.5 px-3 transition ${
                    mode === "login" ? "bg-white text-[#182643] shadow-sm" : "text-[#71809a] hover:text-[#182643]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`rounded-lg py-1.5 px-3 transition ${
                    mode === "register" ? "bg-white text-[#182643] shadow-sm" : "text-[#71809a] hover:text-[#182643]"
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Role Selector Tabs */}
            <div className="mb-6">
              <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#71809a]">
                Select Your Role ({ROLES.length} Personas)
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {ROLES.map(({ role, icon: Icon }) => {
                  const cfg = ROLE_CONFIG[role];
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`grid justify-items-center rounded-xl border p-2.5 text-center transition ${
                        isSelected
                          ? `${cfg.themeTone} shadow-sm font-bold scale-[1.02]`
                          : "border-[#dfe5ef] bg-white text-[#687691] hover:border-[#cbd5ef] hover:bg-[#fafbff]"
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-1 ${isSelected ? "" : "text-[#7f8da5]"}`} />
                      <span className="text-[11px] font-bold leading-tight">{cfg.label}</span>
                      <span className="mt-0.5 text-[9px] font-medium opacity-80">{cfg.badge}</span>
                    </button>
                  );
                })}
              </div>

              {/* Role Context Hint */}
              <div
                className="mt-3 grid grid-cols-[auto_1fr] items-center gap-2 rounded-xl px-3 py-2 text-xs transition-all duration-200"
                style={{
                  backgroundColor: selectedTheme.accentBg,
                  color: selectedTheme.accentText,
                  border: `1px solid ${selectedTheme.activePillBg}33`,
                }}
              >
                <Sparkles className="h-4 w-4 shrink-0" style={{ color: selectedTheme.activePillBg }} />
                <span>
                  <strong>{roleConfig.label}:</strong> {roleConfig.description}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#304063]">Full Name</label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#8b98b0]" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full rounded-xl border border-[#dfe5ef] bg-white py-2.5 pl-9 pr-3 text-xs text-[#182643] outline-none placeholder:text-[#a0acc0] focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#304063]">{roleConfig.idLabel}</label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#8b98b0]" />
                      <input
                        type="text"
                        required
                        placeholder={
                          selectedRole === "STUDENT"
                            ? "CS-2023-0842"
                            : selectedRole === "FACULTY"
                            ? "FAC-CS-104"
                            : selectedRole === "HOD"
                            ? "HOD-CSE-001"
                            : selectedRole === "TNP_COORDINATOR"
                            ? "TNP-ENG-042"
                            : "ADM-SYS-001"
                        }
                        value={roleId}
                        onChange={e => setRoleId(e.target.value)}
                        className="w-full rounded-xl border border-[#dfe5ef] bg-white py-2.5 pl-9 pr-3 text-xs text-[#182643] outline-none placeholder:text-[#a0acc0] focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {mode === "register" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#304063]">Department</label>
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs text-[#182643] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#304063]">Academic Designation</label>
                    <input
                      type="text"
                      placeholder={
                        selectedRole === "STUDENT"
                          ? "B.Tech CSE · Sem 6"
                          : selectedRole === "FACULTY"
                          ? "Associate Professor"
                          : selectedRole === "HOD"
                          ? "Head of Department"
                          : "Coordinator"
                      }
                      value={designation}
                      onChange={e => setDesignation(e.target.value)}
                      className="w-full rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs text-[#182643] outline-none placeholder:text-[#a0acc0] focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="mb-1 block text-xs font-bold text-[#304063]">
                  {mode === "login" ? "Institutional Email / ID" : "Official Institutional Email"}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#8b98b0]" />
                  <input
                    type="email"
                    required
                    placeholder={
                      selectedRole === "STUDENT"
                        ? "rahul.sharma@northstar.edu"
                        : selectedRole === "FACULTY"
                        ? "meera.nair@northstar.edu"
                        : selectedRole === "HOD"
                        ? "sunita.rao@northstar.edu"
                        : selectedRole === "TNP_COORDINATOR"
                        ? "vikram.mehta@northstar.edu"
                        : "admin@northstar.edu"
                    }
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#dfe5ef] bg-white py-2.5 pl-9 pr-3 text-xs text-[#182643] outline-none placeholder:text-[#a0acc0] focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={mode === "login" ? "sm:col-span-2" : ""}>
                  <label className="mb-1 block text-xs font-bold text-[#304063]">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#8b98b0]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#dfe5ef] bg-white py-2.5 pl-9 pr-10 text-xs text-[#182643] outline-none placeholder:text-[#a0acc0] focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-2.5 text-[#8b98b0] hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === "register" && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#304063]">Confirm Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#8b98b0]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#dfe5ef] bg-white py-2.5 pl-9 pr-3 text-xs text-[#182643] outline-none placeholder:text-[#a0acc0] focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick demo autofill helper in login mode */}
              {mode === "login" && currentDemo && (
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={fillDemoAccount}
                    style={{ color: selectedTheme.activePillBg }}
                    className="text-[11px] font-bold hover:underline"
                  >
                    Auto-fill demo credentials for {currentDemo.name}
                  </button>
                  <span className="text-[10px] text-[#8995aa]">Demo pwd: password123</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: selectedTheme.activePillBg,
                  boxShadow: `0 8px 20px ${selectedTheme.activePillShadow}`,
                }}
                className="mt-2 grid w-full grid-flow-col auto-cols-max items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
              >
                <span>
                  {loading
                    ? "Authenticating..."
                    : mode === "login"
                    ? `Sign in as ${roleConfig.label}`
                    : `Register as ${roleConfig.label}`}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick 1-Click Evaluation Personas */}
            <div className="mt-8 border-t border-[#e2e8f2] pt-6">
              <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#71809a]">
                1-Click Instant Demo Login (Evaluation Shortcuts)
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ROLES.map(({ role }) => {
                  const cfg = ROLE_CONFIG[role];
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handle1ClickDemo(role)}
                      className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-xl border border-[#dfe5ef] bg-[#f8f9fc] p-2.5 text-left transition hover:border-primary hover:bg-primary/5"
                    >
                      <span className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold ${cfg.avatarTone}`}>
                        {role === "STUDENT"
                          ? "RS"
                          : role === "FACULTY"
                          ? "MN"
                          : role === "HOD"
                          ? "SR"
                          : role === "TNP_COORDINATOR"
                          ? "VM"
                          : "SA"}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-[#182643]">{cfg.label}</div>
                        <div className="text-[10px] text-[#71809a]">1-Click Login</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Platform Identity & Institutional Assurance */}
          <div className="space-y-6">
            {/* Dark Brand Card */}
            <div className="overflow-hidden rounded-[24px] bg-[#1E1145] p-6 text-white shadow-[0_20px_45px_rgba(30,17,69,0.25)] sm:p-8">
              <div className="mb-4 inline-grid grid-cols-[auto_1fr] items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-[#a7e3d3]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>INSTITUTIONAL TRUST & RBAC</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">
                Smart Student Internship &amp; Career Management Platform
              </h2>
              <p className="mt-3 text-xs leading-5 text-[#b9c6e8]">
                PRAGATI enforces strict role-based access control across all 5 campus stakeholders. Single source of
                truth with zero mocked runtime metrics, cryptographic tamper detection, and deterministic rule engines.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#a8b5db]">Audit Rule Engine</div>
                  <div className="mt-1 text-sm font-bold text-white">Deterministic Evaluation</div>
                  <div className="mt-1 text-[10px] text-[#93a4d6]">Rules decide; AI only explains.</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#a8b5db]">Cryptographic Ledger</div>
                  <div className="mt-1 text-sm font-bold text-white">SHA-256 Tamper Audit</div>
                  <div className="mt-1 text-[10px] text-[#93a4d6]">Instant tamper detection.</div>
                </div>
              </div>

              {/* RBAC Persona Matrix */}
              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#93a4d6]">
                  Role Permissions Matrix
                </div>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-[auto_1fr] items-center gap-2 text-[#d2dcff]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16a889]" />
                    <span>
                      <strong>Students:</strong> Academic radar, assessment trajectory, Career Passport export.
                    </span>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] items-center gap-2 text-[#d2dcff]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16a889]" />
                    <span>
                      <strong>Faculty:</strong> Assigned student cohorts, skill gap interventions, internship review.
                    </span>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] items-center gap-2 text-[#d2dcff]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16a889]" />
                    <span>
                      <strong>HOD:</strong> Department-level risk cohort, curriculum gap analysis, analytics.
                    </span>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] items-center gap-2 text-[#d2dcff]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16a889]" />
                    <span>
                      <strong>T&amp;P:</strong> Recruitment drive publishing, criteria matching, placement rosters.
                    </span>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] items-center gap-2 text-[#d2dcff]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16a889]" />
                    <span>
                      <strong>Admin:</strong> Campus system governance, RBAC privileges, tamper verification audit.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="premium-card p-5">
              <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-xl transition-colors"
                  style={{
                    backgroundColor: selectedTheme.accentBg,
                    color: selectedTheme.activePillBg,
                  }}
                >
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#182643]">Need institutional onboarding?</div>
                  <div className="text-[11px] text-[#71809a]">Contact the campus administrator or T&amp;P cell.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

