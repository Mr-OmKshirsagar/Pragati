import React, { useState } from "react";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Building2,
  Users,
  KeyRound,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface PersonaCard {
  role: UserRole;
  name: string;
  title: string;
  email: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const PERSONAS: PersonaCard[] = [
  {
    role: "STUDENT",
    name: "Rahul Sharma",
    title: "Year 3 B.Tech CSE (Roll: CSE2024042)",
    email: "student@northstar.edu",
    badge: "Hero Student",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-300",
    icon: GraduationCap,
    description: "CGPA 8.42, 1 Active OS Backlog, DSA drop [78, 70, 61]. Ready for skill-gap mentoring.",
  },
  {
    role: "FACULTY",
    name: "Dr. Anand Verma",
    title: "Faculty Mentor & Assistant Professor",
    email: "faculty@northstar.edu",
    badge: "Faculty Mentor",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-300",
    icon: Users,
    description: "Mentors assigned wards, reviews early warnings, logs closed-loop mentoring sessions.",
  },
  {
    role: "HOD",
    name: "Prof. Sunita Rao",
    title: "Head of Department (CSE)",
    email: "hod.cse@northstar.edu",
    badge: "Department Head",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-300",
    icon: Building2,
    description: "Inspects department skill heatmaps, backlog clusters, and faculty intervention velocity.",
  },
  {
    role: "TNP_COORDINATOR",
    name: "Vikram Malhotra",
    title: "Training & Placement Officer",
    email: "tnp@northstar.edu",
    badge: "T&P Officer",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-300",
    icon: Briefcase,
    description: "Publishes placement drives (ABC Technologies), configures AST eligibility rules.",
  },
  {
    role: "ADMIN",
    name: "Platform Administrator",
    title: "System & Compliance Administrator",
    email: "admin@northstar.edu",
    badge: "Institutional Admin",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    icon: ShieldCheck,
    description: "Maintains institutional hierarchy, skill taxonomy, and inspects immutable audit logs.",
  },
];

export default function Login() {
  const { loginWithDemo, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<UserRole>("STUDENT");

  const handleSelectRole = async (role: UserRole) => {
    setSelectedRole(role);
    await loginWithDemo(role);
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          PRAGATI Portal
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Smart Student Internship & Career Management Platform
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Northstar Institute of Technology (NIT-001)
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Select Persona for Live Evaluation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any persona card below to simulate instantaneous 1-click RBAC login.
              </p>
            </div>
            {user && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Active: {user.role}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {PERSONAS.map((p) => {
              const Icon = p.icon;
              const isCurrent = user?.role === p.role;
              return (
                <button
                  key={p.role}
                  onClick={() => handleSelectRole(p.role)}
                  disabled={isLoading}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start justify-between group ${
                    isCurrent
                      ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isCurrent
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {p.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${p.badgeColor}`}
                        >
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {p.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Login <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Role-Based Access Control is enforced server-side via Supabase PostgreSQL & tRPC middlewares.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
