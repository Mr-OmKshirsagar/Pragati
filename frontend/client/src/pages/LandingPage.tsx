import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Check,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Zap,
  BookOpen,
  TrendingUp,
  Building2,
  Star,
  Play,
  AlertCircle,
  Clock,
  BarChart3,
  Target,
  Lock,
  Brain,
} from "lucide-react";

function useTilt(strength = 12) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [strength, -strength]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-strength, strength]), { stiffness: 300, damping: 30 });
  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => { x.set(0); y.set(0); };
  return { ref, rotateX, rotateY, handleMouse, handleLeave };
}

function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = to / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [to]);
  return <>{count}{suffix}</>;
}

function HeroWidget() {
  const tilt = useTilt(12);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 400),
      setTimeout(() => setStage(2), 900),
      setTimeout(() => setStage(3), 1400),
      setTimeout(() => setStage(4), 1800),
      setTimeout(() => setStage(5), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const steps = [
    "? Academic records fetched",
    "? Skill matrix computed",
    "? Internship evidence verified",
    "? Matching career paths...",
  ];

  return (
    <motion.div
      ref={tilt.ref}
      onMouseMove={tilt.handleMouse}
      onMouseLeave={tilt.handleLeave}
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: "preserve-3d", perspective: 1000 }}
      className="w-full max-w-[420px] relative select-none"
    >
      <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-[#6B5CE7]/30 via-[#9b8df5]/20 to-[#6B5CE7]/10 blur-3xl pointer-events-none" />
      <div
        className="relative rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(60,70,200,0.35),0_8px_24px_rgba(60,70,200,0.2)]"
        style={{ background: "linear-gradient(135deg, #5C4BD1 0%, #5238C4 40%, #5c47c0 70%, #5C4BD1 100%)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200/70 mb-1">PRAGATI Intelligence</p>
              <h3 className="text-white font-bold text-xl leading-tight">Career Readiness Score</h3>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: stage >= 5 ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex items-center gap-1.5 bg-emerald-400/20 border border-emerald-400/40 rounded-full px-3 py-1"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-bold text-sm">95%</span>
            </motion.div>
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: stage > i ? 1 : 0.25, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <div className={"w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 " + (stage > i ? "bg-emerald-400/30" : "bg-white/10")}>
                  {stage > i ? <Check className="w-2.5 h-2.5 text-emerald-300" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/30" />}
                </div>
                <span className={"text-xs font-medium " + (stage > i ? "text-blue-100" : "text-white/35")}>{step}</span>
              </motion.div>
            ))}
          </div>
          <div className="h-px bg-white/10" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/60 mb-3">INTERNSHIP MATCHES</p>
            {[
              { label: "Software Engineer", pct: 91 },
              { label: "Data Analyst", pct: 76 },
              { label: "Product Manager", pct: 95 },
            ].map((item, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-blue-100/90 font-medium">{item.label}</span>
                  <motion.span className="text-xs font-bold text-white" initial={{ opacity: 0 }} animate={{ opacity: stage >= 5 ? 1 : 0 }}>
                    {item.pct}%
                  </motion.span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-300 to-white"
                    initial={{ width: 0 }}
                    animate={{ width: stage >= 5 ? item.pct + "%" : "0%" }}
                    transition={{ duration: 0.9, delay: i * 0.15, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[{ label: "Credits", value: "180" }, { label: "Evidence", value: "12" }, { label: "Weeks", value: "18w" }].map((s) => (
              <div key={s.label} className="bg-white/[0.08] rounded-xl p-2.5 text-center border border-white/[0.08]">
                <div className="text-white font-bold text-sm">{s.value}</div>
                <div className="text-blue-200/60 text-[10px] font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 2.5, type: "spring", stiffness: 300 }}
        className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-4 py-2.5 flex items-center gap-2.5 border border-slate-100"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-800">SHA-256 Verified</div>
          <div className="text-[10px] text-slate-500">Evidence tamper-proof</div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 3, type: "spring", stiffness: 300 }}
        className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-3 py-2 border border-slate-100"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Star className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">CGPA Match</div>
            <div className="text-xs font-bold text-slate-800">8.7 / 10.0</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [activeFeature, setActiveFeature] = useState(3);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#ffffff" }}>

      {/* -- Navbar -- */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-slate-100"
        style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6B5CE7] to-[#5C4BD1] flex items-center justify-center shadow-lg">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">PRAGATI</span>
          </div>
          <nav className="hidden md:flex items-center gap-7">
            {["Features", "How It Works", "About"].map((item) => (
              <a key={item} href={"#" + item.toLowerCase().replace(/ /g, "-")} className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="text-sm font-semibold text-slate-700 hover:text-violet-600 transition-colors px-3 py-1.5">Sign in</button>
            <button onClick={() => navigate("/register")} className="text-sm font-semibold text-white px-5 py-2 rounded-xl shadow-lg hover:scale-105 active:scale-100 transition-all" style={{ background: "linear-gradient(135deg, #6B5CE7, #5C4BD1)" }}>Get Started</button>
          </div>
        </div>
      </motion.header>

      {/* -- Hero -- */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #ffffff 0%, #f5f7ff 40%, #eef1ff 100%)" }}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "linear-gradient(#6B5CE7 1px, transparent 1px), linear-gradient(90deg, #6B5CE7 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-violet-100/60 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-100/40 blur-[80px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs font-semibold text-violet-700">Smart Internship Management Platform</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-[1.12] mb-5">
                The Internship Platform{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #6B5CE7, #9b8df5)" }}>
                  Built for Institutions
                </span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-md">
                PRAGATI digitally monitors and manages the complete internship lifecycle — from skill assessment to verified evidence — on one secure platform.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <button onClick={() => navigate("/register")} className="inline-flex items-center gap-2 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-xl hover:shadow-violet-300 hover:scale-105 transition-all" style={{ background: "linear-gradient(135deg, #6B5CE7, #5C4BD1)" }}>
                  Start Free <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate("/login")} className="inline-flex items-center gap-2 text-slate-700 font-semibold text-sm px-6 py-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:text-violet-600 transition-all bg-white">
                  <Play className="w-3.5 h-3.5 fill-current" /> Watch Demo
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[{ value: 95, suffix: "%", label: "Placement Rate" }, { value: 500, suffix: "+", label: "Internships Tracked" }, { value: 18, suffix: "+", label: "Institutions" }].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-extrabold text-violet-600"><AnimatedCounter to={stat.value} suffix={stat.suffix} /></div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="flex justify-center md:justify-end pb-8 md:pb-0">
              <HeroWidget />
            </motion.div>
          </div>
        </div>
      </section>

      {/* -- Problem Section -- */}
      <section id="features" className="py-20 md:py-24" style={{ background: "#f7f8ff" }}>
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">The Problem Institutions Face</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Thousands of internships go unmonitored — without verified evidence, structured tracking, or institutional visibility.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: AlertCircle, color: "from-rose-50 to-pink-50", iconBg: "bg-rose-100", iconColor: "text-rose-500", title: "No Visibility", desc: "Faculty and HODs have zero real-time visibility into student internship status or progress." },
              { icon: BarChart3, color: "from-amber-50 to-orange-50", iconBg: "bg-amber-100", iconColor: "text-amber-500", title: "Skill Gaps", desc: "Institutions cannot identify which skills students lack until placement season — too late to fix." },
              { icon: Clock, color: "from-violet-50 to-purple-50", iconBg: "bg-violet-100", iconColor: "text-violet-500", title: "Manual Chaos", desc: "Evidence collection is manual, error-prone, and impossible to audit at scale." },
            ].map((card, i) => (
              <motion.div key={card.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 }} whileHover={{ y: -4, transition: { duration: 0.2 } }} className={"rounded-2xl p-6 bg-gradient-to-br " + card.color + " border border-white shadow-sm"}>
                <div className={"w-12 h-12 rounded-xl " + card.iconBg + " flex items-center justify-center mb-4"}>
                  <card.icon className={"w-6 h-6 " + card.iconColor} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* -- How It Works -- */}
      <section id="how-it-works" className="py-20 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">OUR SOLUTION</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">How PRAGATI Works</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">A single, secure platform that digitises the full internship lifecycle</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px border-t-2 border-dashed border-violet-200 z-0" />
            {[
              { num: "1", icon: Brain, title: "AI Assessment", desc: "Students complete skill assessments. Our Rule Engine analyses academic profile, DSA scores, and interests to build a unique career fingerprint." },
              { num: "2", icon: Target, title: "Internship Matching", desc: "The platform surfaces the best-fit internships from verified enterprise partners, matched to the student's profile and institutional requirements." },
              { num: "3", icon: FileCheck2, title: "Verified Evidence", desc: "Every submission — offer letters, reports, certificates — is hashed with SHA-256 and locked into a tamper-proof Evidence Vault." },
            ].map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }} className="relative z-10 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-violet-100 transition-all group">
                <div className="absolute -top-3.5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md" style={{ background: "linear-gradient(135deg, #6B5CE7, #5C4BD1)" }}>{step.num}</div>
                <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
                  <step.icon className="w-6 h-6 text-violet-500" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Features Grid -- */}
      <section className="py-20 md:py-24" style={{ background: "#f7f8ff" }}>
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">POWERFUL FEATURES</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Everything You Need to Succeed</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Sparkles, title: "AI Skill Engine", desc: "Automated skill gap analysis using DSA scores, project history, and course completion data." },
              { icon: TrendingUp, title: "Live Progress Tracking", desc: "Faculty and HODs get real-time internship dashboards with completion heatmaps and alerts." },
              { icon: Zap, title: "Rule Engine Automation", desc: "Define custom eligibility rules: CGPA thresholds, credit requirements, attendance gates." },
              { icon: ShieldCheck, title: "Placement Ready Reports", desc: "Auto-generated NAAC/NBA-ready internship reports and career passport for every student." },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.1 }}
                onMouseEnter={() => setActiveFeature(i)}
                className={"rounded-2xl p-6 cursor-pointer transition-all duration-200 flex items-start gap-4 border " + (activeFeature === i ? "border-violet-300 bg-white shadow-lg shadow-violet-100/60" : "border-slate-200 bg-white/60 hover:bg-white hover:shadow-sm")}
              >
                <div className={"w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors " + (activeFeature === i ? "bg-violet-100" : "bg-slate-100")}>
                  <feat.icon className={"w-6 h-6 " + (activeFeature === i ? "text-violet-600" : "text-slate-500")} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base mb-1">{feat.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Role Cards -- */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">ROLE-BASED ACCESS</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Built for Every Stakeholder</h2>
            <p className="text-slate-500 text-lg">PRAGATI adapts to every role in your institution hierarchy</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: GraduationCap, role: "Student", bg: "bg-blue-50", text: "text-blue-700", desc: "Track internships, upload evidence, view skill gaps and career readiness passport." },
              { icon: BookOpen, role: "Faculty", bg: "bg-violet-50", text: "text-violet-700", desc: "Monitor batch progress, trigger interventions, and approve submitted evidence." },
              { icon: Building2, role: "HOD / T&P", bg: "bg-violet-50", text: "text-violet-700", desc: "Department-level analytics, placement forecasts, and NAAC-ready reports." },
              { icon: Lock, role: "Admin", bg: "bg-slate-50", text: "text-slate-700", desc: "Manage institution-wide rules, user roles, and system configuration." },
            ].map((r, i) => (
              <motion.div key={r.role} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.1 }} whileHover={{ y: -5, transition: { duration: 0.2 } }} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all">
                <div className={"w-11 h-11 rounded-xl " + r.bg + " flex items-center justify-center mb-4"}>
                  <r.icon className={"w-5 h-5 " + r.text} />
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1.5">{r.role}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* -- CTA Banner -- */}
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center" style={{ background: "linear-gradient(135deg, #5C4BD1 0%, #5238C4 50%, #5c47c0 100%)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">One Platform. Complete Lifecycle.</h2>
              <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">Stop managing internships in spreadsheets. Give your students a verified, structured, and monitored career journey.</p>
              <button onClick={() => navigate("/register")} className="inline-flex items-center gap-2 bg-white text-violet-700 font-bold text-sm px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-100 transition-all">
                Start Your Institution Journey <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* -- Footer -- */}
      <footer style={{ background: "#0f1629" }} className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6B5CE7] to-[#5C4BD1] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-lg">PRAGATI</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">Smart Student Internship &amp; Career Management Platform</p>
            </div>
            {[
              { heading: "Product", links: ["Features", "How It Works", "Security", "Pricing"] },
              { heading: "Institution", links: ["For Faculty", "For HOD", "For Admin", "NAAC Reports"] },
              { heading: "Resources", links: ["Documentation", "Help Centre", "Contact", "Blog"] },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="font-bold text-white text-sm mb-4">{col.heading}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}><a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-slate-500 text-xs">© 2026 PRAGATI. Problem Statement ED-06 · AICTE / NEP 2020 Aligned</p>
            <p className="text-slate-600 text-xs font-mono">SHA-256 Evidence · Rule Engine · RBAC · Real-time Analytics</p>
          </div>
        </div>
      </footer>
    </div>
  );
}



