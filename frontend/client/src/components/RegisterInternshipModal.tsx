import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  Mail,
  User,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface RegisterInternshipModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RegisterInternshipModal({
  open,
  onClose,
  onSuccess,
}: RegisterInternshipModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-11-30");
  const [stipend, setStipend] = useState("45000");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");

  const utils = trpc.useUtils();
  const createMutation = trpc.internship.createInternship.useMutation({
    onSuccess: () => {
      toast.success("Internship registered successfully!", {
        description: `${companyName} attachment is now active in your workspace.`,
      });
      utils.internship.getMyInternship.invalidate();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to register internship.");
    },
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      companyName: companyName.trim(),
      role: role.trim(),
      startDate,
      endDate: endDate || undefined,
      stipend: stipend ? Number(stipend) : undefined,
      supervisorName: supervisorName.trim() || undefined,
      supervisorEmail: supervisorEmail.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 border border-white/20 text-emerald-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                Register Internship Attachment
              </h2>
              <p className="text-xs text-slate-300">
                Formalize your corporate engagement and begin milestone tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Company / Organization Name *
            </label>
            <div className="relative mt-1">
              <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                required
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Atlas Labs, Google, Microsoft"
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Internship Role / Title *
            </label>
            <div className="relative mt-1">
              <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                required
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineering Intern, ML Research Intern"
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Start Date *
              </label>
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                End Date (Expected)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Monthly Stipend (INR)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                placeholder="45000"
                className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              Industry Supervisor Contact (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="Supervisor Name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-primary"
                />
              </div>
              <div>
                <input
                  type="email"
                  value={supervisorEmail}
                  onChange={(e) => setSupervisorEmail(e.target.value)}
                  placeholder="supervisor@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Register Attachment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
