import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_CONFIG, type PragatiRole, usePragatiAuth } from "@/contexts/AuthContext";
import {
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  GraduationCap,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

const ROLE_ICONS: Record<PragatiRole, React.ComponentType<{ className?: string }>> = {
  STUDENT: GraduationCap,
  FACULTY: UserCheck,
  HOD: Building2,
  TNP_COORDINATOR: BriefcaseBusiness,
  ADMIN: ShieldCheck,
};

export default function UserNav() {
  const { user, role, switchRole, logout, isAuthenticated } = usePragatiAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated || !user) {
    return (
      <div className="grid grid-flow-col auto-cols-max items-center gap-2">
        <Link
          href="/login"
          className="grid grid-flow-col auto-cols-max items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Sign In</span>
        </Link>
      </div>
    );
  }

  const roleConfig = ROLE_CONFIG[role];
  const CurrentRoleIcon = ROLE_ICONS[role];

  const handleRoleSwitch = (newRole: PragatiRole) => {
    switchRole(newRole);
    navigate(ROLE_CONFIG[newRole].defaultPath);
  };

  const handleSignOut = () => {
    logout();
    toast.info("Signed out of PRAGATI");
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="User navigation menu"
          className="group grid grid-flow-col auto-cols-max items-center gap-2 rounded-xl p-1 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cbd3f6]"
        >
          <span className={`grid h-8 w-8 place-items-center rounded-xl text-[11px] font-bold ${roleConfig.avatarTone}`}>
            {user.avatar}
          </span>
          <div className="hidden text-left md:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#182643] leading-none">{user.name}</span>
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${roleConfig.themeTone}`}>
                {roleConfig.label}
              </span>
            </div>
            <div className="text-[10px] text-[#71809a] leading-none mt-1">{user.roleId}</div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-[#8995aa] transition group-hover:text-primary" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border border-[#dfe5ef]">
        {/* User Card */}
        <DropdownMenuLabel className="p-2">
          <div className="flex items-center gap-2.5">
            <span className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-bold ${roleConfig.avatarTone}`}>
              {user.avatar}
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-[#182643]">{user.name}</div>
              <div className="truncate text-[10px] text-[#71809a]">{user.email}</div>
              <div className="text-[10px] font-semibold text-primary mt-0.5">{user.designation}</div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1" />

        {/* Quick Switch Persona */}
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8b98b0]">
          Switch Active Role (Demo)
        </div>
        {(["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"] as PragatiRole[]).map(r => {
          const cfg = ROLE_CONFIG[r];
          const Icon = ROLE_ICONS[r];
          const isCurrent = role === r;
          return (
            <DropdownMenuItem
              key={r}
              onClick={() => handleRoleSwitch(r)}
              className={`flex items-center justify-between gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer ${
                isCurrent ? "bg-primary/10 text-primary font-bold" : "text-[#4b5872] hover:bg-[#f8f9fc]"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${isCurrent ? "text-primary" : "text-[#8b98b0]"}`} />
                <span>{cfg.label}</span>
              </span>
              {isCurrent && <span className="text-[10px] text-primary">Active</span>}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="my-1" />

        {/* Auth links */}
        <DropdownMenuItem asChild>
          <Link
            href="/login"
            className="flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-[#4b5872] hover:bg-[#f8f9fc] cursor-pointer"
          >
            <LogIn className="h-4 w-4 text-[#8b98b0]" />
            <span>Sign In with another role</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/register"
            className="flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-[#4b5872] hover:bg-[#f8f9fc] cursor-pointer"
          >
            <UserPlus className="h-4 w-4 text-[#8b98b0]" />
            <span>Register new account</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        {/* Sign out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-[#c24152] hover:bg-[#ffebee] cursor-pointer"
        >
          <LogOut className="h-4 w-4 text-[#c24152]" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

