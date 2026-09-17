import { trpc } from "@/lib/trpc";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface InternshipCheckinModalProps {
  internshipId: string;
  companyName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InternshipCheckinModal({
  internshipId,
  companyName,
  onClose,
  onSuccess,
}: InternshipCheckinModalProps) {
  const [summary, setSummary] = useState("");
  const [learnings, setLearnings] = useState("");
  const [hours, setHours] = useState("40");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkinMutation = trpc.internship.submitCheckin.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (summary.trim().length < 10) {
      toast.error("Please provide a summary of at least 10 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullSummary = `${summary.trim()}${
        learnings.trim() ? `\n\nKey Learnings: ${learnings.trim()}` : ""
      }${hours ? `\nHours Logged: ${hours}h` : ""}`;

      await checkinMutation.mutateAsync({
        internshipId,
        summary: fullSummary,
      });

      toast.success("Progress check-in logged and submitted for faculty review!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit check-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#dfe5ef] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef1f6] bg-gradient-to-r from-[#f8faff] to-[#f4f7fd]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef2fd] text-[#3048a8]">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#182643]">
                Bi-Weekly Progress Check-in
              </h3>
              <p className="text-xs text-[#71809a]">
                Document work milestones at {companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#8b99bd] hover:bg-slate-100 hover:text-[#182643] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-xs text-[#52617d] flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-[#182643]">
              <Calendar className="h-3.5 w-3.5 text-[#3048a8]" /> Check-in Period
            </span>
            <span className="font-mono text-[11px] text-[#64748b]">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#263653] mb-1.5">
              Work Completed & Key Deliverables{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe the tasks, features, bug fixes, or architecture work delivered during this sprint..."
              className="w-full rounded-xl border border-[#cbd5e1] p-3 text-xs text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#3048a8] focus:ring-1 focus:ring-[#3048a8] outline-none transition"
            />
            <span className="text-[10px] text-[#8995aa]">
              Minimum 10 characters required.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#263653] mb-1.5">
              Key Technical Learnings / Blockers (Optional)
            </label>
            <textarea
              rows={2}
              value={learnings}
              onChange={(e) => setLearnings(e.target.value)}
              placeholder="e.g. Learned Docker containerization, optimized PostgreSQL indices, resolved race condition..."
              className="w-full rounded-xl border border-[#cbd5e1] p-3 text-xs text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#3048a8] focus:ring-1 focus:ring-[#3048a8] outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#263653] mb-1.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#3048a8]" /> Hours Contributed
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full rounded-xl border border-[#cbd5e1] px-3 py-2 text-xs text-[#1e293b] outline-none focus:border-[#3048a8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#263653] mb-1.5">
                Evidence Weight
              </label>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                +25% Completeness
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eef1f6]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#182643] rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || summary.trim().length < 10}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#3048a8] hover:bg-[#3f5ac1] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/15 transition"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Submit Check-in
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
