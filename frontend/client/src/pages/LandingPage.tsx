import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  GraduationCap,
  BriefcaseBusiness,
  ShieldCheck,
  TrendingUp,
  Award,
  Target,
  ArrowRight,
  Sparkles,
  Users,
  BookOpenCheck,
  Route,
  ChevronRight,
  Star,
  Zap,
  Globe,
  Lock,
  BarChart3,
  Brain,
  CheckCircle2,
  Play,
  Github,
} from "lucide-react";
import React from "react";

// ─── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── 3D Tilt Card ─────────────────────────────────────────────────────────────

function TiltCard({
  children,
  className,
  intensity = 12,
  glare = true,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 180, damping: 22 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity]), springConfig);
  const glareX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
      mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 900 }}
      className={cn("relative", className)}
    >
      {children}
      {glare && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
          }}
        />
      )}
    </motion.div>
  );
}

// ─── Floating 3D Orb ──────────────────────────────────────────────────────────

function FloatingOrb({
  size,
  color,
  delay = 0,
  duration = 6,
  x,
  y,
}: {
  size: number;
  color: string;
  delay?: number;
  duration?: number;
  x: string;
  y: string;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: color,
        filter: "blur(60px)",
      }}
      animate={{
        y: [0, -30, 0],
        scale: [1, 1.1, 1],
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 20);
    return () => clearInterval(timer);
  }, [started, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Hover Topic Pill ─────────────────────────────────────────────────────────

function TopicPill({
  icon: Icon,
  label,
  color,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  delay?: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="relative cursor-default overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur-sm"
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 rounded-2xl"
            style={{ background: `${color}18` }}
          />
        )}
      </AnimatePresence>
      <div className="relative flex items-center gap-2.5">
        <motion.div
          animate={hovered ? { rotate: [0, -10, 10, 0], scale: 1.2 } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${color}22`, color }}
        >
          <Icon className="h-4 w-4" />
        </motion.div>
        <span className="text-sm font-semibold text-white/90">{label}</span>
        <motion.div
          animate={hovered ? { x: 0, opacity: 1 } : { x: -6, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <ChevronRight className="h-3.5 w-3.5 text-white/40" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── 3D Feature Card ──────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
  accent,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accent: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="group"
    >
      <TiltCard intensity={8} className="h-full">
        <div
          className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 backdrop-blur-sm transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_24px_56px_rgba(0,0,0,0.35)]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Glow on hover */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: `radial-gradient(circle at top left, ${accent}14, transparent 60%)` }}
          />

          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110"
            style={{ background: `${accent}20`, color: accent }}
          >
            <Icon className="h-6 w-6" />
          </div>

          <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
          <p className="text-sm leading-relaxed text-white/55">{description}</p>

          <motion.div
            initial={false}
            animate={{ width: "0%" }}
            whileHover={{ width: "100%" }}
            className="absolute bottom-0 left-0 h-[2px] rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </TiltCard>
    </motion.div>
  );
}

// ─── 3D Stats Card ────────────────────────────────────────────────────────────

function StatCard({
  value,
  suffix,
  label,
  icon: Icon,
  color,
  delay = 0,
}: {
  value: number;
  suffix?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="group"
    >
      <TiltCard intensity={6}>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-6 text-center backdrop-blur-sm transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.08]">
          <div
            className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: `${color}22`, color }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-[32px] font-extrabold tracking-tight text-white">
            <AnimatedCounter target={value} suffix={suffix ?? ""} />
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/45">{label}</div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

// ─── Role Card ────────────────────────────────────────────────────────────────

function RoleCard({
  icon: Icon,
  title,
  badge,
  description,
  color,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge: string;
  description: string;
  color: string;
  delay?: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group cursor-default"
    >
      <TiltCard intensity={10}>
        <div
          className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-400"
          style={{
            borderColor: hovered ? `${color}50` : "rgba(255,255,255,0.08)",
            background: hovered
              ? `linear-gradient(135deg, ${color}12 0%, rgba(255,255,255,0.03) 100%)`
              : "rgba(255,255,255,0.03)",
          }}
        >
          <motion.div
            animate={hovered ? { scale: 1.05, rotate: -3 } : { scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: `${color}22`, color }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-bold text-white">{title}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: `${color}22`, color }}
            >
              {badge}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-white/50">{description}</p>
        </div>
      </TiltCard>
    </motion.div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-[#0a1228]/80 shadow-[0_4px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6d7ee0] to-[#3048a8] shadow-[0_6px_18px_rgba(48,72,168,0.45)]">
            <span className="text-base font-extrabold text-white">P</span>
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#a7e3d3] shadow-[0_0_6px_rgba(167,227,211,0.8)]" />
          </div>
          <div>
            <div className="text-[15px] font-extrabold tracking-tight text-white">PRAGATI</div>
            <div className="text-[9px] font-semibold uppercase tracking-widest text-white/40">
              Career Intelligence
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {["Features", "For Students", "For Institutions", "About"].map((item) => (
            <motion.button
              key={item}
              whileHover={{ color: "#ffffff" }}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/[0.06]"
            >
              {item}
            </motion.button>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-2.5">
          <motion.button
            onClick={onLogin}
            whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.97 }}
            className="rounded-xl border border-white/20 px-4 py-2 text-[13px] font-semibold text-white/80 transition-all duration-200 hover:border-white/40 hover:text-white"
          >
            Log in
          </motion.button>
          <motion.button
            onClick={onSignup}
            whileHover={{ scale: 1.04, boxShadow: "0 8px 28px rgba(48,72,168,0.5)" }}
            whileTap={{ scale: 0.97 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#3048a8] to-[#5268cb] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(48,72,168,0.35)]"
          >
            <span className="relative z-10">Sign up free</span>
            <motion.div
              className="absolute inset-0 bg-white/10"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.4 }}
            />
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    },
    [mouseX, mouseY]
  );

  const heroRotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 60,
    damping: 20,
  });
  const heroRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 60,
    damping: 20,
  });

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#060d1e] via-[#0d1a3a] to-[#0a1530]" />

      {/* Floating orbs */}
      <FloatingOrb size={500} color="rgba(48,72,168,0.35)" x="60%" y="-10%" delay={0} duration={7} />
      <FloatingOrb size={380} color="rgba(109,126,224,0.25)" x="-8%" y="30%" delay={1} duration={9} />
      <FloatingOrb size={280} color="rgba(22,168,137,0.2)" x="75%" y="55%" delay={2} duration={8} />
      <FloatingOrb size={220} color="rgba(116,88,201,0.2)" x="15%" y="65%" delay={0.5} duration={6.5} />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-5 py-32 sm:px-8 sm:py-40">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Left column */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#3048a8]/50 bg-[#3048a8]/15 px-4 py-1.5 backdrop-blur-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#9daaff]" />
              <span className="text-[12px] font-bold text-[#b8c4ff]">Smart Career Intelligence Platform</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              className="mb-6 text-[44px] font-extrabold leading-[1.08] tracking-[-0.04em] text-white sm:text-[58px] lg:text-[64px]"
            >
              From Student{" "}
              <span className="bg-gradient-to-r from-[#8292ee] via-[#a78bfa] to-[#6ee7b7] bg-clip-text text-transparent">
                Progress
              </span>{" "}
              <br className="hidden sm:block" />
              to Career{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-[#6ee7b7] to-[#38bdf8] bg-clip-text text-transparent">
                  Readiness
                </span>
                <motion.div
                  className="absolute -bottom-1 left-0 h-[3px] rounded-full bg-gradient-to-r from-[#6ee7b7] to-[#38bdf8]"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                />
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="mb-9 max-w-[520px] text-[17px] leading-relaxed text-white/55"
            >
              PRAGATI unifies skill assessments, internship evidence, faculty mentoring and placement
              readiness into one evidence-backed career record — so students and institutions always
              know exactly where they stand.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-wrap items-center gap-4"
            >
              {/* Primary CTA */}
              <motion.button
                onClick={onSignup}
                whileHover={{ scale: 1.04, boxShadow: "0 12px 40px rgba(48,72,168,0.55)" }}
                whileTap={{ scale: 0.97 }}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3048a8] to-[#5268cb] px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_6px_24px_rgba(48,72,168,0.4)]"
              >
                <span className="relative z-10 flex items-center gap-2.5">
                  Get started free
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#5268cb] to-[#7b61d9]"
                  initial={{ x: "100%" }}
                  whileHover={{ x: "0%" }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </motion.button>

              {/* Secondary */}
              <motion.button
                onClick={onLogin}
                whileHover={{ scale: 1.04, borderColor: "rgba(255,255,255,0.35)" }}
                whileTap={{ scale: 0.97 }}
                className="group flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.06] px-7 py-3.5 text-[15px] font-bold text-white/80 backdrop-blur-sm transition-all hover:bg-white/[0.10] hover:text-white"
              >
                <Play className="h-4 w-4 fill-current" />
                Sign in
              </motion.button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="mt-8 flex flex-wrap items-center gap-5 text-[12px] text-white/35"
            >
              {[
                { icon: ShieldCheck, text: "Evidence-first design" },
                { icon: Lock, text: "Secure & auditable" },
                { icon: Zap, text: "Real-time tracking" },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-[#6ee7b7]" />
                  {text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right column — 3D floating dashboard mock */}
          <motion.div
            style={{ rotateX: heroRotateX, rotateY: heroRotateY, transformStyle: "preserve-3d", perspective: 1000 }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            className="relative"
          >
            {/* Main card */}
            <div
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e1a3a]/90 to-[#0a1228]/90 p-5 shadow-[0_32px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
              style={{ transform: "translateZ(0px)" }}
            >
              {/* Mini header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-[#6d7ee0] to-[#3048a8] grid place-items-center shadow-lg">
                    <span className="text-[10px] font-extrabold text-white">P</span>
                  </div>
                  <span className="text-xs font-bold text-white/70">Student Dashboard</span>
                </div>
                <div className="flex gap-1.5">
                  {["#ff6b6b", "#ffd93d", "#6bcb77"].map((c) => (
                    <div key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
              </div>

              {/* Progress ring */}
              <div className="mb-4 flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0">
                  <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" strokeWidth="6" stroke="rgba(255,255,255,0.1)" />
                    <motion.circle
                      cx="40" cy="40" r="32" fill="none" strokeWidth="6"
                      stroke="url(#heroGrad)" strokeLinecap="round"
                      strokeDasharray={201}
                      initial={{ strokeDashoffset: 201 }}
                      animate={{ strokeDashoffset: 201 * 0.32 }}
                      transition={{ delay: 0.8, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                    />
                    <defs>
                      <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8292ee" />
                        <stop offset="100%" stopColor="#6ee7b7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 grid place-items-center">
                    <div>
                      <div className="text-center text-[18px] font-extrabold text-white">68%</div>
                      <div className="text-center text-[8px] font-semibold uppercase tracking-wide text-white/40">
                        Ready
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/50">Career Readiness Score</div>
                  <div className="mt-1 text-lg font-extrabold text-white">Rahul Sharma</div>
                  <div className="text-[11px] text-white/40">B.Tech CSE · Sem 6</div>
                </div>
              </div>

              {/* Skill bars */}
              {[
                { label: "DSA", val: 78, color: "#8292ee" },
                { label: "Python", val: 85, color: "#6ee7b7" },
                { label: "DBMS", val: 62, color: "#f59e0b" },
                { label: "Networks", val: 55, color: "#f87171" },
              ].map(({ label, val, color }, i) => (
                <div key={label} className="mb-2.5">
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="font-semibold text-white/70">{label}</span>
                    <span className="font-bold text-white/60">{val}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ delay: 0.9 + i * 0.1, duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Floating badge — internship */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-5 -left-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#13876f]/30 px-3 py-2 shadow-xl backdrop-blur-xl"
              style={{ transform: "translateZ(20px)" }}
            >
              <div className="h-6 w-6 rounded-lg bg-[#16a889]/30 grid place-items-center">
                <BriefcaseBusiness className="h-3 w-3 text-[#6ee7b7]" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/80">Internship verified</div>
                <div className="text-[9px] text-white/40">TechCorp India · 3 months</div>
              </div>
            </motion.div>

            {/* Floating badge — achievement */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -right-6 top-8 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#3048a8]/30 px-3 py-2 shadow-xl backdrop-blur-xl"
              style={{ transform: "translateZ(24px)" }}
            >
              <Award className="h-4 w-4 text-[#9daaff]" />
              <div className="text-[10px] font-bold text-white/80">+3 Skills verified</div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5"
      >
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
          Explore
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="h-6 w-[1px] bg-gradient-to-b from-white/30 to-transparent"
        />
      </motion.div>
    </section>
  );
}

// ─── Topics / Hover Pills Section ─────────────────────────────────────────────

const TOPICS = [
  { icon: GraduationCap, label: "Skill Assessment Tracking", color: "#8292ee" },
  { icon: Brain, label: "AI-Powered Gap Detection", color: "#a78bfa" },
  { icon: BriefcaseBusiness, label: "Internship Evidence Vault", color: "#6ee7b7" },
  { icon: Users, label: "Faculty Mentoring Portal", color: "#38bdf8" },
  { icon: Target, label: "Placement Eligibility Engine", color: "#f59e0b" },
  { icon: Route, label: "Portable Career Passport", color: "#f87171" },
  { icon: BarChart3, label: "Department Analytics", color: "#34d399" },
  { icon: ShieldCheck, label: "Evidence Integrity Checks", color: "#818cf8" },
  { icon: Award, label: "Achievement Badges", color: "#fb923c" },
  { icon: BookOpenCheck, label: "Academic Record Sync", color: "#c084fc" },
  { icon: Globe, label: "Recruitment Drive Management", color: "#22d3ee" },
  { icon: TrendingUp, label: "Progress Trend Analysis", color: "#4ade80" },
];

function TopicsSection() {
  return (
    <section className="relative bg-gradient-to-b from-[#060d1e] to-[#0a1530] py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="mb-12 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#3048a8]/40 bg-[#3048a8]/10 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#9daaff]" />
            <span className="text-[12px] font-bold text-[#b8c4ff]">Everything in one platform</span>
          </div>
          <h2 className="text-[38px] font-extrabold tracking-[-0.03em] text-white sm:text-[46px]">
            Built for the full career{" "}
            <span className="bg-gradient-to-r from-[#8292ee] to-[#6ee7b7] bg-clip-text text-transparent">
              lifecycle
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-white/45">
            Hover any topic to explore. Every module is designed to connect seamlessly
            across the student journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TOPICS.map((topic, i) => (
            <TopicPill
              key={topic.label}
              icon={topic.icon}
              label={topic.label}
              color={topic.color}
              delay={i * 0.04}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Brain,
    title: "Explainable AI Insights",
    description:
      "Rules detect conditions, AI explains in plain language. Students see exactly why they have a skill gap — no black box.",
    accent: "#8292ee",
  },
  {
    icon: ShieldCheck,
    title: "Evidence-First Verification",
    description:
      "Every claim has an evidence state. Certificates, internship reports and skill scores are verified, not assumed.",
    accent: "#6ee7b7",
  },
  {
    icon: TrendingUp,
    title: "Closed-Loop Interventions",
    description:
      "Faculty flags a gap → assigns intervention → tracks outcome. The loop closes when evidence improves.",
    accent: "#a78bfa",
  },
  {
    icon: Target,
    title: "Transparent Eligibility",
    description:
      "T&P sets configurable placement criteria. Students see exactly which conditions they meet and which they don't.",
    accent: "#f59e0b",
  },
  {
    icon: Route,
    title: "Portable Career Passport",
    description:
      "Every verified achievement is packaged into a structured, shareable career record students carry beyond graduation.",
    accent: "#38bdf8",
  },
  {
    icon: Globe,
    title: "Institution-Wide Visibility",
    description:
      "HODs and coordinators see cohort trends, not just individual students. Curriculum gaps become visible before placement season.",
    accent: "#f87171",
  },
];

function FeaturesSection() {
  return (
    <section className="relative bg-[#0a1530] py-28">
      {/* Subtle orbs */}
      <FloatingOrb size={400} color="rgba(48,72,168,0.12)" x="80%" y="10%" duration={9} />
      <FloatingOrb size={300} color="rgba(110,231,183,0.08)" x="-5%" y="60%" delay={2} duration={11} />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <h2 className="text-[38px] font-extrabold tracking-[-0.03em] text-white sm:text-[46px]">
            Why PRAGATI is{" "}
            <span className="bg-gradient-to-r from-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent">
              different
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-white/45">
            Most platforms store records. PRAGATI actively monitors, detects, intervenes and verifies.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              description={f.description}
              accent={f.accent}
              delay={i * 0.07}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats Section ────────────────────────────────────────────────────────────

function StatsSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#172446] to-[#0d1a3a] py-20">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard value={15000} suffix="+" label="Students Tracked" icon={GraduationCap} color="#8292ee" delay={0} />
          <StatCard value={98} suffix="%" label="Evidence Accuracy" icon={ShieldCheck} color="#6ee7b7" delay={0.1} />
          <StatCard value={340} suffix="+" label="Placement Drives" icon={Target} color="#f59e0b" delay={0.2} />
          <StatCard value={5} label="User Roles Supported" icon={Users} color="#a78bfa" delay={0.3} />
        </div>
      </div>
    </section>
  );
}

// ─── Roles Section ────────────────────────────────────────────────────────────

const ROLES_DATA = [
  {
    icon: GraduationCap,
    title: "Students",
    badge: "Primary",
    description:
      "Track your progress, upload internship evidence, view skill gaps, and explore placement opportunities.",
    color: "#8292ee",
  },
  {
    icon: BookOpenCheck,
    title: "Faculty Mentors",
    badge: "Mentorship",
    description:
      "Monitor mentee cohorts, assign interventions on skill gaps, and verify internship completion.",
    color: "#6ee7b7",
  },
  {
    icon: BarChart3,
    title: "Head of Department",
    badge: "Analytics",
    description:
      "Department-wide performance dashboards, curriculum gap reports, and intervention trend analysis.",
    color: "#a78bfa",
  },
  {
    icon: Target,
    title: "T&P Coordinators",
    badge: "Placement",
    description:
      "Publish recruitment drives, configure eligibility criteria, and evaluate student readiness at scale.",
    color: "#f59e0b",
  },
  {
    icon: ShieldCheck,
    title: "Administrators",
    badge: "System",
    description:
      "Manage institution configuration, audit trails, user access and platform-wide security controls.",
    color: "#f87171",
  },
];

function RolesSection() {
  return (
    <section className="bg-gradient-to-b from-[#0a1530] to-[#060d1e] py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <h2 className="text-[38px] font-extrabold tracking-[-0.03em] text-white sm:text-[46px]">
            Built for every{" "}
            <span className="bg-gradient-to-r from-[#f59e0b] to-[#f87171] bg-clip-text text-transparent">
              role
            </span>{" "}
            in your institution
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-white/45">
            Five distinct portals, one unified platform. Everyone has exactly the context they need.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ROLES_DATA.map((role, i) => (
            <RoleCard
              key={role.title}
              icon={role.icon}
              title={role.title}
              badge={role.badge}
              description={role.description}
              color={role.color}
              delay={i * 0.07}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#172446] via-[#1a2e62] to-[#172446] py-28">
      <FloatingOrb size={600} color="rgba(48,72,168,0.25)" x="50%" y="50%" duration={10} />

      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="mb-5 flex justify-center">
            <div className="flex -space-x-2">
              {["#8292ee", "#6ee7b7", "#f59e0b", "#f87171", "#a78bfa"].map((c, i) => (
                <motion.div
                  key={c}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="h-9 w-9 rounded-full border-2 border-[#172446] grid place-items-center text-xs font-bold text-white"
                  style={{ background: c }}
                >
                  {["S", "F", "H", "T", "A"][i]}
                </motion.div>
              ))}
            </div>
          </div>

          <h2 className="mb-4 text-[38px] font-extrabold tracking-[-0.03em] text-white sm:text-[50px]">
            Ready to transform your institution's career intelligence?
          </h2>
          <p className="mb-8 text-[16px] text-white/50">
            Join institutions that have moved beyond spreadsheets and fragmented data.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <motion.button
              onClick={onSignup}
              whileHover={{ scale: 1.05, boxShadow: "0 16px 48px rgba(48,72,168,0.6)" }}
              whileTap={{ scale: 0.97 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3048a8] to-[#5268cb] px-8 py-4 text-[15px] font-bold text-white shadow-[0_8px_28px_rgba(48,72,168,0.4)]"
            >
              <span className="relative z-10 flex items-center gap-2.5">
                <Sparkles className="h-4 w-4" />
                Create your free account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#5268cb] to-[#7b61d9]"
                initial={{ x: "100%" }}
                whileHover={{ x: "0%" }}
                transition={{ duration: 0.35 }}
              />
            </motion.button>

            <motion.button
              onClick={onLogin}
              whileHover={{ scale: 1.04, borderColor: "rgba(255,255,255,0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/[0.06] px-8 py-4 text-[15px] font-bold text-white/75 backdrop-blur-sm transition-all hover:bg-white/[0.10] hover:text-white"
            >
              Already have an account? Sign in
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[12px] text-white/30">
            {["No credit card required", "Free for students", "Secure & auditable"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#6ee7b7]" />
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  return (
    <footer className="border-t border-white/[0.07] bg-[#060d1e] py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-8 grid gap-8 sm:grid-cols-[1fr_auto_auto_auto]">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#6d7ee0] to-[#3048a8]">
                <span className="text-sm font-extrabold text-white">P</span>
              </div>
              <span className="text-[14px] font-extrabold text-white">PRAGATI</span>
            </div>
            <p className="max-w-[200px] text-[12px] leading-relaxed text-white/35">
              From Student Progress to Career Readiness. Evidence-aware by design.
            </p>
          </div>

          {/* Links */}
          {[
            { heading: "Platform", links: ["Features", "Security", "Pricing", "Changelog"] },
            { heading: "Users", links: ["Students", "Faculty", "T&P Cell", "HOD"] },
            { heading: "Company", links: ["About", "Blog", "Contact", "Privacy"] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/30">
                {heading}
              </div>
              <ul className="grid gap-2">
                {links.map((l) => (
                  <li key={l}>
                    <button className="text-[13px] text-white/45 transition-colors hover:text-white/80">
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] pt-6 flex flex-col items-center justify-between gap-3 text-[11px] text-white/25 sm:flex-row">
          <span>© 2026 PRAGATI · Smart Student Career Intelligence Platform</span>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 hover:text-white/50 transition-colors">
              <Github className="h-3.5 w-3.5" />
              GitHub
            </button>
            <button
              onClick={onLogin}
              className="hover:text-white/50 transition-colors"
            >
              Log in
            </button>
            <motion.button
              onClick={onSignup}
              whileHover={{ scale: 1.05 }}
              className="rounded-lg bg-[#3048a8]/60 px-3 py-1 text-white/70 hover:bg-[#3048a8] hover:text-white transition-all"
            >
              Sign up
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [, navigate] = useLocation();

  const handleLogin = () => navigate("/login");
  const handleSignup = () => navigate("/register");

  return (
    <div className="landing-page-root min-h-screen antialiased">
      <Navbar onLogin={handleLogin} onSignup={handleSignup} />
      <HeroSection onLogin={handleLogin} onSignup={handleSignup} />
      <TopicsSection />
      <FeaturesSection />
      <StatsSection />
      <RolesSection />
      <CTASection onLogin={handleLogin} onSignup={handleSignup} />
      <Footer onLogin={handleLogin} onSignup={handleSignup} />
    </div>
  );
}
