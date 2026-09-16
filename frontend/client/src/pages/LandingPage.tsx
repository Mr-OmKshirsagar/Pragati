import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Cpu,
  FileCheck2,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Lock,
  Route,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"student" | "faculty" | "tnp">("student");
  const [beforeAfterView, setBeforeAfterView] = useState<"before" | "after">("after");

  // Micro-interactive state for hero live widget
  const [heroSkillScore, setHeroSkillScore] = useState(61);
  const [heroVerified, setHeroVerified] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroSkillScore(78);
      setHeroVerified(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#070d1e] font-sans text-slate-100 selection:bg-[#3048a8] selection:text-white overflow-x-hidden">
      {/* ─── Ambient Glow & Grid Background ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(48,72,168,0.18)_0%,transparent_60%)]" />
        <div className="absolute top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-[#16a889]/10 blur-[130px]" />
        <div className="absolute top-[50%] -right-[10%] h-[550px] w-[550px] rounded-full bg-[#8364e8]/10 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* ─── National Hackathon Announcement Pill ─── */}
        <div className="border-b border-white/[0.08] bg-[#0b142c]/80 backdrop-blur-md px-4 py-2 text-center text-xs">
          <div className="inline-flex items-center gap-2 font-medium text-slate-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-emerald-400">Problem Statement ED-06:</span>
            <span>Smart Internship Management &amp; Career Trajectory Platform</span>
            <span className="hidden md:inline-block text-slate-500">·</span>
            <span className="hidden md:inline-block text-[11px] text-slate-400 font-mono">AICTE / NEP 2020 Framework Aligned</span>
          </div>
        </div>

        {/* ─── Sticky Header ─── */}
        <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#070d1e]/85 backdrop-blur-xl transition-all">
          <div className="mx-auto flex h-18 max-w-[1360px] items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4f75ff] to-[#3048a8] shadow-[0_8px_20px_rgba(79,117,255,0.35)]">
                <span className="text-xl font-extrabold text-white">P</span>
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#16a889] ring-2 ring-[#070d1e]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold tracking-tight text-white">PRAGATI</span>
                  <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[9px] font-semibold tracking-wider text-slate-300">v1.0-ED06</span>
                </div>
                <div className="text-[10px] font-medium tracking-wide text-slate-400">Career Intelligence &amp; Internship Governance</div>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="hidden items-center gap-7 text-xs font-semibold text-slate-300 md:flex">
              <a href="#problem" className="transition hover:text-white">Problem &amp; Transformation</a>
              <a href="#journey" className="transition hover:text-white">4-Year Trajectory</a>
              <a href="#engines" className="transition hover:text-white">Core Engines</a>
              <a href="#personas" className="transition hover:text-white">Institutional Roles</a>
              <a href="#mandate" className="transition hover:text-white">National Mandate</a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="hidden rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.1] sm:inline-flex items-center gap-1.5"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/overview")}
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#3048a8] to-[#4361ee] px-4 py-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(48,72,168,0.4)] transition hover:from-[#2a3f94] hover:to-[#3853d8] active:scale-95"
              >
                <span>Launch Console</span>
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </header>

        {/* ─── Hero Section ─── */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[1.12fr_0.88fr] xl:gap-16">
              
              {/* Left Hero Column */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-300">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span>Smart Career Intelligence Platform</span>
                </div>

                <h1 className="mt-5 text-[38px] font-extrabold leading-[1.08] tracking-[-0.04em] text-white sm:text-[50px] xl:text-[58px]">
                  From Student Progress <br />
                  <span className="bg-gradient-to-r from-[#5f82ff] via-[#60a5fa] to-[#2dd4bf] bg-clip-text text-transparent">
                    to Career Readiness.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  PRAGATI connects academic trajectory, continuous skill assessments, closed-loop faculty mentoring, tamper-evident internship evidence, and deterministic placement eligibility into a single, verifiable institutional platform.
                </p>

                {/* Primary Actions */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => navigate("/overview")}
                    className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#3048a8] to-[#4361ee] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(48,72,168,0.45)] transition hover:from-[#25398a] hover:to-[#3650d3] active:scale-[0.98]"
                  >
                    <span>Explore PRAGATI</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <a
                    href="#problem"
                    className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    <span>See How It Works</span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </a>
                </div>

                {/* Key Architectural Truths (Zero fake statistics) */}
                <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-white/[0.08] pt-6">
                  {[
                    { title: "Evidence-First", detail: "SHA-256 Hashed Files" },
                    { title: "Deterministic Rules", detail: "Zero Hallucinated AI" },
                    { title: "Closed-Loop", detail: "Faculty Mentoring Logs" },
                    { title: "Career Passport", detail: "Cryptographic QR Seal" },
                  ].map((fact) => (
                    <div key={fact.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{fact.title}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">{fact.detail}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right Hero Column: Living Product Miniature Console */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                className="relative"
              >
                {/* Visual Glass Frame */}
                <div className="relative rounded-2xl border border-white/15 bg-[#0b1530]/90 p-5 shadow-[0_25px_65px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-6">
                  
                  {/* Miniature Console Top Bar */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
                        RS
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Rahul Sharma</span>
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-300">
                            Sem 7 Verified
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">CS-2023-0842 · NIT Rourkela</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <CircleDot className="h-3 w-3 animate-pulse text-emerald-400" />
                      <span>LIVE AUDIT TRAIL</span>
                    </div>
                  </div>

                  {/* Widget Row 1: Deterministic Readiness Gauge + Quick Stats */}
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.1fr]">
                    {/* Gauge Card */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Readiness Index</span>
                        <span className="text-emerald-400 font-mono">Weighted Deterministic</span>
                      </div>
                      <div className="mt-2.5 flex items-baseline gap-3">
                        <span className="text-3xl font-extrabold tracking-tight text-white font-mono">76%</span>
                        <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          +4% vs Cycle 2
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full transition-all duration-1000" style={{ width: "76%" }} />
                      </div>
                      <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                        <span>Academics: 8.42 CGPA</span>
                        <span>Skills: 7 Verified</span>
                      </div>
                    </div>

                    {/* Eligibility Badge Card */}
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Placement Eligibility
                        </span>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                          ✓ Eligible
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-bold text-slate-100">
                        Cognizant &amp; Infosys Tier-1 Drives
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        All criteria met: CGPA &ge; 7.5, DSA &ge; 70%, 1 Verified Internship, 0 Backlogs.
                      </div>
                    </div>
                  </div>

                  {/* Widget Row 2: Live Skill Score Progression */}
                  <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-blue-400" />
                        <span>DSA &amp; Problem Solving Capability</span>
                      </span>
                      <span className="font-mono text-xs font-extrabold text-blue-300">
                        {heroSkillScore}%
                      </span>
                    </div>

                    {/* Animated Score Progress */}
                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-400 rounded-full"
                        initial={{ width: "61%" }}
                        animate={{ width: `${heroSkillScore}%` }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Baseline: 61% (Cycle 1)</span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        {heroVerified && <Check className="h-3 w-3" />}
                        {heroVerified ? "DSA 61% → 78% (Cycle 3 Verified)" : "Evaluating progress..."}
                      </span>
                    </div>
                  </div>

                  {/* Widget Row 3: Rule-Generated Finding & Intervention */}
                  <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                        <span>Rule Engine Finding: Operating Systems Gap</span>
                      </div>
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                        INTERVENTION IN PROGRESS
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
                      Triggered by 9% score drop across 2 test cycles. Faculty mentor <strong className="text-white">Dr. Anand Verma</strong> assigned remedial module &amp; 1-on-1 review.
                    </p>
                  </div>

                  {/* Widget Row 4: Tamper-Evident Internship Evidence */}
                  <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                        <BriefcaseBusiness className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Cloud Architecture Internship · Cognizant</div>
                        <div className="text-[10px] font-mono text-slate-400">SHA-256: e3b0c44298fc1c149afbf4c8996fb...</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-[10px] font-bold text-teal-300">
                      Evidence 4/5 Verified
                    </span>
                  </div>

                  {/* Miniature Console Footer Indicator */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-blue-400" /> Row-Level Security Enforced
                    </span>
                    <span>Single Verifiable Record</span>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ─── The Problem & System Transformation Section ─── */}
        <section id="problem" className="relative border-t border-white/[0.08] bg-[#091124]/90 py-20 md:py-28">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-blue-400">
                <Layers className="h-3.5 w-3.5" />
                <span>The System Transformation</span>
              </div>
              <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight text-white sm:text-[40px]">
                Student data exists everywhere. <br />
                <span className="text-slate-400">Career readiness exists nowhere.</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                In most institutions today, the internship and placement journey is fractured across disconnected spreadsheets, paper logs, unverified certificates, and isolated faculty silos. PRAGATI creates one continuous, verifiable career pipeline.
              </p>
            </div>

            {/* Interactive Before vs After Toggle */}
            <div className="mt-8 flex justify-center">
              <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
                <button
                  onClick={() => setBeforeAfterView("before")}
                  className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                    beforeAfterView === "before"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Legacy Institutional Silos (Before)
                </button>
                <button
                  onClick={() => setBeforeAfterView("after")}
                  className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                    beforeAfterView === "after"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  PRAGATI Unified Engine (After)
                </button>
              </div>
            </div>

            {/* Before vs After Display Canvas */}
            <div className="mt-10">
              <AnimatePresence mode="wait">
                {beforeAfterView === "before" ? (
                  <motion.div
                    key="before"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl border border-rose-500/25 bg-rose-950/10 p-6 md:p-8"
                  >
                    <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 font-bold text-xs">
                          !
                        </div>
                        <span className="text-sm font-bold text-rose-200">
                          Current Reality: 6 Fragmented, Unverified Silos
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-rose-400">High Fraud Risk · 100% Manual Effort</span>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { title: "ERP & Grade Portals", issue: "Stale semester marks trapped in legacy tables with zero telemetry on actual industry capabilities." },
                        { title: "WhatsApp & Telegram Groups", issue: "Informal drive announcements lost in chat histories; critical placement deadlines routinely missed." },
                        { title: "Unverified PDF Certificates", issue: "Static certificates uploaded without cryptographic hashing or employer verification; easy to alter." },
                        { title: "Offline Internship Diaries", issue: "Handwritten weekly log sheets signed weeks after completion; zero evidence of real project output." },
                        { title: "Faculty Spreadsheet Logs", issue: "Mentoring sessions recorded informally without closed-loop intervention tracking or measurable outcomes." },
                        { title: "T&P Eligibility Friction", issue: "Placement cells spend weeks manually cross-referencing CGPA and branch lists; high human error rate." },
                      ].map((silo, idx) => (
                        <div key={silo.title} className="rounded-xl border border-rose-500/15 bg-white/[0.02] p-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{silo.title}</span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-slate-400">{silo.issue}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="after"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl border border-emerald-500/30 bg-[#0c1b33] p-6 md:p-8 shadow-[0_20px_50px_rgba(22,168,137,0.15)]"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                          ✓
                        </div>
                        <span className="text-sm font-bold text-white">
                          PRAGATI Solution: Continuous, Evidence-Driven Career Pipeline
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400 font-mono">
                        Cryptographic SHA-256 · Deterministic Rules · 0% Hallucination
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { title: "Unified Student Record", benefit: "Academics, continuous assessments, and internship evidence synchronized into a single source of truth." },
                        { title: "Deterministic Gap Engine", benefit: "Hardcoded rule triggers automatically detect capability declines and alert mentors without AI hallucinations." },
                        { title: "SHA-256 Hashed Evidence", benefit: "Every offer letter, weekly report, and supervisor sign-off is hashed and verified before granting credit." },
                        { title: "Closed-Loop Mentorship", benefit: "Faculty assign structured interventions; student progress is re-assessed to confirm resolution." },
                        { title: "Automated Drive Matching", benefit: "Placement cells define multi-dimensional criteria; eligible cohorts are computed instantly and deterministically." },
                        { title: "Portable Career Passport", benefit: "Graduating students receive a verifiable cryptographic QR passport trusted by enterprise employers." },
                      ].map((pillar) => (
                        <div key={pillar.title} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition hover:border-emerald-500/40">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>{pillar.title}</span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-slate-300">{pillar.benefit}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ─── The 4-Year Student Career Journey ─── */}
        <section id="journey" className="relative py-20 md:py-28">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-blue-400">
                <Route className="h-3.5 w-3.5" />
                <span>The 4-Year Student Trajectory</span>
              </div>
              <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight text-white sm:text-[40px]">
                Career readiness is not a final-year sprint. <br />
                <span className="text-slate-400">It is a four-year continuous system.</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                PRAGATI monitors, verifies, and elevates students semester by semester from matriculation to placement.
              </p>
            </div>

            {/* Journey Timeline Cards */}
            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-4">
              {[
                {
                  year: "Year 1",
                  title: "Foundation & Baseline",
                  color: "border-blue-500/30 bg-blue-950/20",
                  tag: "Semester 1 & 2",
                  highlights: [
                    "Academic onboarding & baseline profile",
                    "Core computer science literacy tracking",
                    "Initial career aspiration mapping",
                    "Attendance & foundational credits audit",
                  ],
                },
                {
                  year: "Year 2",
                  title: "Capability & Gap Rules",
                  color: "border-indigo-500/30 bg-indigo-950/20",
                  tag: "Semester 3 & 4",
                  highlights: [
                    "Continuous programming assessments",
                    "Deterministic skill-gap rule activation",
                    "Algorithmic alerts on trajectory drops",
                    "Early peer learning & lab group sync",
                  ],
                },
                {
                  year: "Year 3",
                  title: "Mentorship & Interventions",
                  color: "border-amber-500/30 bg-amber-950/20",
                  tag: "Semester 5 & 6",
                  highlights: [
                    "Closed-loop faculty mentor sessions",
                    "Remedial learning plan completions",
                    "Pre-internship readiness evaluations",
                    "Resume & skill portfolio verification",
                  ],
                },
                {
                  year: "Year 4",
                  title: "Internship & Placement",
                  color: "border-emerald-500/30 bg-emerald-950/20",
                  tag: "Semester 7 & 8",
                  highlights: [
                    "Industry internship milestone logs",
                    "Cryptographic SHA-256 evidence trail",
                    "Automated placement eligibility filters",
                    "Final Portable Career Passport issuance",
                  ],
                },
              ].map((step) => (
                <div
                  key={step.year}
                  className={`group relative rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-xl ${step.color}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-extrabold text-white text-base">{step.year}</span>
                    <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-extrabold text-white">{step.title}</h3>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    {step.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 mt-0.5 text-emerald-400 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Deep-Dive Feature Pillar Engines ─── */}
        <section id="engines" className="relative border-t border-white/[0.08] bg-[#081023] py-20 md:py-28">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-blue-400">
                <Cpu className="h-3.5 w-3.5" />
                <span>Core Engineering Pillars</span>
              </div>
              <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight text-white sm:text-[40px]">
                Built on rigorous verification, <br />
                <span className="text-slate-400">not synthetic claims.</span>
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
              
              {/* Pillar 1: Deterministic Skill Gap Engine */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">1. Deterministic Skill Gap Engine</h3>
                    <div className="text-xs text-amber-400 font-mono">Zero Hallucination · Pure Rule Logic</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Unlike generative chatbots that invent advice, PRAGATI executes rigorous rule thresholds. When a student&apos;s score in a core subject declines across consecutive assessments or fails a prerequisite benchmark, the engine deterministically generates a formal intervention finding.
                </p>
                <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 font-mono text-xs text-amber-200">
                  <code>
                    IF score(DSA, Cycle_N) &lt; 0.9 * score(DSA, Cycle_N-1) <br />
                    &nbsp;&nbsp;THEN trigger_intervention(TYPE=&quot;REMEDIAL_MENTORING&quot;, PRIORITY=&quot;HIGH&quot;)
                  </code>
                </div>
              </div>

              {/* Pillar 2: Tamper-Evident Evidence Vault */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/25">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">2. Tamper-Evident Internship Trail</h3>
                    <div className="text-xs text-teal-400 font-mono">SHA-256 Digests · Multi-Stage Sign-off</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Internship authenticity is enforced via 5 discrete milestone stages: Offer Letter &rarr; Joining Report &rarr; Mid-Term Review &rarr; Final Evaluation &rarr; Employer Completion Certificate. Every document is cryptographically hashed at the time of upload to guarantee zero post-dated tampering.
                </p>
                <div className="mt-5 rounded-xl border border-teal-500/20 bg-teal-950/20 p-3 font-mono text-xs text-teal-200">
                  <code>
                    DOCUMENT_HASH = SHA256(student_id + file_binary + timestamp) <br />
                    STATUS = VERIFIED_BY_INDUSTRY_SUPERVISOR_AND_FACULTY
                  </code>
                </div>
              </div>

              {/* Pillar 3: Portable Career Passport */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">3. Portable Career Passport</h3>
                    <div className="text-xs text-blue-400 font-mono">Public Verification QR · Self-Sovereign</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  A verifiable institutional credential that synthesizes cumulative CGPA, verified skill scores, verified internships, and faculty commendations. Recruiters scan the passport&apos;s cryptographic QR code to view live, tamper-evident proof without calling registrar offices.
                </p>
                <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-950/20 p-3 font-mono text-xs text-blue-200">
                  <code>
                    PASSPORT_SIGNATURE = Ed25519(Institution_Private_Key, Career_Payload) <br />
                    RECRUITER_VERIFICATION = VALID (0 ms delay)
                  </code>
                </div>
              </div>

              {/* Pillar 4: Institutional Role-Based Access Control */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">4. Institutional RBAC &amp; Row-Level Security</h3>
                    <div className="text-xs text-purple-400 font-mono">Supabase PostgreSQL RLS · JWT Auth</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Four strictly segregated roles: Students only view and submit their own evidence; Faculty Mentors manage their assigned wards; HODs inspect department cohort analytics; T&amp;P Officers configure placement drives and execute deterministic eligibility filters.
                </p>
                <div className="mt-5 rounded-xl border border-purple-500/20 bg-purple-950/20 p-3 font-mono text-xs text-purple-200">
                  <code>
                    CREATE POLICY &quot;Faculty read assigned wards&quot; ON interventions <br />
                    &nbsp;&nbsp;FOR SELECT USING (auth.uid() = assigned_faculty_id);
                  </code>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── Interactive Multi-Role Showcase ─── */}
        <section id="personas" className="relative py-20 md:py-28">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-blue-400">
                <UsersRound className="h-3.5 w-3.5" />
                <span>Multi-Stakeholder Experience</span>
              </div>
              <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight text-white sm:text-[40px]">
                Built for every institutional role.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                Switch personas to preview how PRAGATI streamlines operations across the campus.
              </p>
            </div>

            {/* Persona Switcher Tabs */}
            <div className="mt-10 flex justify-center">
              <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1.5">
                {[
                  { id: "student", label: "Student Console", icon: GraduationCap },
                  { id: "faculty", label: "Faculty Mentor Desk", icon: UserCheck },
                  { id: "tnp", label: "T&P Placement Cell", icon: BriefcaseBusiness },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition ${
                        activeTab === tab.id
                          ? "bg-[#3048a8] text-white shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Persona Content Display */}
            <div className="mt-8">
              <AnimatePresence mode="wait">
                {activeTab === "student" && (
                  <motion.div
                    key="student"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="rounded-2xl border border-white/15 bg-[#0a142c] p-6 sm:p-8"
                  >
                    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Student Portal</div>
                        <h3 className="mt-1 text-2xl font-extrabold text-white">Full Transparency Into Career Readiness</h3>
                        <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                          Students see their deterministic readiness score, continuous assessment trends, open skill gaps, and milestone evidence checklists. No hidden placement filtering criteria or arbitrary rejections.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2 text-xs">
                          {["My Progress Dashboard", "Skills & Assessments", "Internship Evidence Vault", "Career Passport Export"].map((feature) => (
                            <span key={feature} className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-slate-200 border border-white/[0.08]">
                              ✓ {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/overview")}
                        className="rounded-xl bg-[#3048a8] px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-[#25398a]"
                      >
                        Open Student View &rarr;
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === "faculty" && (
                  <motion.div
                    key="faculty"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="rounded-2xl border border-white/15 bg-[#0a142c] p-6 sm:p-8"
                  >
                    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">Faculty Desk</div>
                        <h3 className="mt-1 text-2xl font-extrabold text-white">Automated Wards Monitoring &amp; Closed-Loop Mentorship</h3>
                        <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                          Faculty mentors track their assigned student cohort. When the engine flags a declining capability or overdue internship report, faculty can assign 1-click structured intervention tasks with session notes.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2 text-xs">
                          {["Assigned Ward Roster", "Algorithmic Risk Alerts", "Intervention Task Creator", "Mentoring Session Logs"].map((feature) => (
                            <span key={feature} className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-slate-200 border border-white/[0.08]">
                              ✓ {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/faculty/wards")}
                        className="rounded-xl bg-[#3048a8] px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-[#25398a]"
                      >
                        Open Faculty Desk &rarr;
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === "tnp" && (
                  <motion.div
                    key="tnp"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="rounded-2xl border border-white/15 bg-[#0a142c] p-6 sm:p-8"
                  >
                    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-teal-400">Training &amp; Placement Cell</div>
                        <h3 className="mt-1 text-2xl font-extrabold text-white">Deterministic Placement Drives &amp; Zero-Fraud Hiring</h3>
                        <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                          T&amp;P Officers configure drive criteria (minimum CGPA, verified skill thresholds, verified internship requirement). The platform calculates eligible candidates in milliseconds with 100% auditability.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2 text-xs">
                          {["Drive Criteria Configuration", "Instant Deterministic Filtering", "One-Click Batch Export", "Recruiter Passport Verification"].map((feature) => (
                            <span key={feature} className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-slate-200 border border-white/[0.08]">
                              ✓ {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/opportunities")}
                        className="rounded-xl bg-[#3048a8] px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-[#25398a]"
                      >
                        Open Placement Drives &rarr;
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ─── National Mandate Alignment (Problem Statement ED-06) ─── */}
        <section id="mandate" className="relative border-t border-white/[0.08] bg-[#070e22] py-20 md:py-28">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-8">
            <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-[#0c1838] via-[#09132c] to-[#070d1e] p-8 md:p-12 shadow-2xl">
              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-300">
                    <Award className="h-3.5 w-3.5" />
                    <span>National Policy Alignment</span>
                  </div>
                  <h2 className="mt-4 text-[28px] font-extrabold leading-tight text-white sm:text-[36px]">
                    Built specifically for AICTE ED-06 &amp; NEP 2020 Guidelines.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    PRAGATI addresses the national imperative to bridge academic education with verifiable industry readiness, providing institutions with enterprise-grade monitoring while empowering students with self-sovereign career evidence.
                  </p>

                  <div className="mt-6 space-y-3">
                    {[
                      { title: "AICTE Internship Policy Compliance", desc: "Monitors mandatory 14-20 weeks internship credits across engineering and technical curricula." },
                      { title: "NEP 2020 Credit Framework", desc: "Maps verified experiential learning and skill milestones into recognized Academic Bank of Credits (ABC)." },
                      { title: "Digital India Security Standards", desc: "Implements tamper-evident cryptographic hashes, role-based data tenancy, and zero credential fraud." },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 mt-1 text-teal-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">{item.title}</div>
                          <div className="text-[11px] text-slate-400">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hackathon Callout Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center lg:text-left">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Presentation Ready</div>
                  <h3 className="mt-1 text-xl font-bold text-white">Experience PRAGATI in Action</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    Test the complete student journey, review the live deterministic gap triggers, verify an internship document hash, and inspect the portable career passport.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
                    <button
                      onClick={() => navigate("/overview")}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3048a8] to-[#4361ee] px-5 py-3 text-xs font-bold text-white shadow-lg hover:from-[#25398a] hover:to-[#3650d3]"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Launch Student Console</span>
                    </button>
                    <button
                      onClick={() => navigate("/login")}
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.1]"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Login with Institutional Demo Accounts</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Enterprise-Grade Footer ─── */}
        <footer className="border-t border-white/[0.08] bg-[#050a18] py-14 text-xs text-slate-400">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
              
              <div className="col-span-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4f75ff] to-[#3048a8] font-bold text-white">
                    P
                  </div>
                  <span className="text-base font-extrabold text-white">PRAGATI</span>
                </div>
                <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-400">
                  Smart Student Internship &amp; Career Management Platform. Built for National Hackathon Problem Statement ED-06.
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <span>FastAPI</span>
                  <span>·</span>
                  <span>Supabase PostgreSQL</span>
                  <span>·</span>
                  <span>RLS Security</span>
                  <span>·</span>
                  <span>SHA-256 Hashes</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform</div>
                <ul className="mt-3 space-y-2">
                  <li><a href="/overview" className="hover:text-white transition">Overview Dashboard</a></li>
                  <li><a href="/skills" className="hover:text-white transition">Skills &amp; Assessments</a></li>
                  <li><a href="/internship" className="hover:text-white transition">Internship Evidence</a></li>
                  <li><a href="/career-passport" className="hover:text-white transition">Career Passport</a></li>
                  <li><a href="/opportunities" className="hover:text-white transition">Placement Drives</a></li>
                </ul>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-200">Institutional</div>
                <ul className="mt-3 space-y-2">
                  <li><a href="/faculty/wards" className="hover:text-white transition">Faculty Wards Desk</a></li>
                  <li><a href="/mentoring" className="hover:text-white transition">Mentoring Intervention Logs</a></li>
                  <li><a href="/login" className="hover:text-white transition">Role-Based Sign In</a></li>
                  <li><a href="#mandate" className="hover:text-white transition">AICTE ED-06 Alignment</a></li>
                </ul>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-200">Architecture</div>
                <ul className="mt-3 space-y-2">
                  <li><span className="text-slate-500">Deterministic Rule Engine</span></li>
                  <li><span className="text-slate-500">Cryptographic Evidence Vault</span></li>
                  <li><span className="text-slate-500">Zero-Hallucination AI Guidance</span></li>
                  <li><span className="text-slate-500">Row-Level Tenancy Model</span></li>
                </ul>
              </div>

            </div>

            <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/[0.06] pt-6 text-[11px] text-slate-500 sm:flex-row sm:items-center">
              <div>&copy; 2026 PRAGATI. Smart Student Internship &amp; Career Management Platform. All rights reserved.</div>
              <div className="flex items-center gap-4">
                <span>National Hackathon Presentation Release</span>
                <span>·</span>
                <span className="text-emerald-400 font-semibold">ED-06 Qualified</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
