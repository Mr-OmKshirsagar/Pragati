import React, { useState } from "react";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Building2,
  Users,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export default function PersonaSwitcher() {
  const { user, loginWithDemo, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const roles: { role: UserRole; label: string; name: string; icon: any }[] = [
    {
      role: "STUDENT",
      label: "Student",
      name: "Rahul Sharma",
      icon: GraduationCap,
    },
    {
      role: "FACULTY",
      label: "Faculty",
      name: "Dr. Anand Verma",
      icon: Users,
    },
    {
      role: "HOD",
      label: "HOD",
      name: "Prof. Sunita Rao",
      icon: Building2,
    },
    {
      role: "TNP_COORDINATOR",
      label: "T&P Officer",
      name: "Vikram Malhotra",
      icon: Briefcase,
    },
    {
      role: "ADMIN",
      label: "Admin",
      name: "Platform Admin",
      icon: ShieldCheck,
    },
  ];

  const current = roles.find((r) => r.role === user?.role) || roles[0];
  const Icon = current.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-2 bg-white/95 backdrop-blur shadow-lg border border-slate-200 rounded-full hover:shadow-xl hover:border-indigo-400 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="text-left text-xs">
            <div className="font-semibold text-slate-800 leading-tight">
              {current.name}
            </div>
            <div className="text-[10px] text-slate-500 font-medium leading-tight">
              {current.label} (NIT-001)
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>

        {isOpen && (
          <div className="absolute bottom-12 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 text-xs">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-slate-600">
              <span className="font-bold flex items-center gap-1.5 text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Role Switcher
              </span>
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                Live RBAC
              </span>
            </div>
            <div className="mt-1 space-y-1">
              {roles.map((item) => {
                const ItemIcon = item.icon;
                const isSelected = user?.role === item.role;
                return (
                  <button
                    key={item.role}
                    disabled={isLoading}
                    onClick={async () => {
                      await loginWithDemo(item.role);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <ItemIcon className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-semibold leading-tight">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
