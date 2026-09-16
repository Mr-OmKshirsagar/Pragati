import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  GraduationCap,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InterventionModalProps {
  ward: {
    studentProfileId: string;
    name: string;
    enrollmentNumber: string;
    activeGaps: {
      id: string;
      skillName: string;
      severity: string;
      reason: any;
    }[];
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function InterventionModal({
  ward,
  onClose,
  onSuccess,
}: InterventionModalProps) {
  const selectedGap = ward.activeGaps[0];
  const [type, setType] = useState<"MENTORING" | "REMEDIAL_CLASS" | "ASSIGNMENT">(
    "MENTORING"
  );
  const [description, setDescription] = useState(
    `1-on-1 mentoring session to review core concepts in ${
      selectedGap?.skillName || "Target Skill"
    } and address backlog concepts.`
  );
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = trpc.faculty.createIntervention.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGap) {
      toast.error("No active skill gap selected for intervention.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        studentId: ward.studentProfileId,
        skillGapId: selectedGap.id,
        type,
        description,
        startDate,
      });

      toast.success(
        `Intervention scheduled successfully for ${ward.name}. Skill gap transitioned to In Review.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule intervention.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#07112d]/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#3048a8]">
              Closed-Loop Mentoring
            </div>
            <h2 className="mt-0.5 text-lg font-extrabold text-[#1a2848]">
              Schedule Mentoring Intervention
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#f1f5f9]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Student & Gap Context */}
        <div className="mt-4 rounded-xl border border-[#fed7aa] bg-[#fffaf0] p-3.5 text-[#9a3412]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#ea580c]" />
              <span className="text-xs font-bold text-[#7c2d12]">
                {ward.name} ({ward.enrollmentNumber})
              </span>
            </div>
            <span className="rounded bg-[#ffedd5] px-2 py-0.5 text-[9px] font-bold text-[#c2410c]">
              Needs Attention
            </span>
          </div>
          {selectedGap && (
            <div className="mt-2 text-xs text-[#9a3412]">
              <strong>Target Skill Gap:</strong> {selectedGap.skillName} (Severity:{" "}
              {selectedGap.severity})
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1.5">
              Intervention Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "MENTORING", label: "1-on-1 Mentoring", icon: Users },
                { id: "REMEDIAL_CLASS", label: "Remedial Class", icon: BookOpen },
                { id: "ASSIGNMENT", label: "Study Task", icon: FileText },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = type === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setType(fmt.id as any)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition ${
                      isSelected
                        ? "border-[#3048a8] bg-[#eff3ff] text-[#3048a8] font-bold shadow-sm"
                        : "border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[11px]">{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1.5">
              Planned Session Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-[#cbd5e1] p-2.5 text-xs font-semibold text-[#1e293b] outline-none focus:ring-2 focus:ring-[#3048a8]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1.5">
              Action Plan &amp; Guidance Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the session topics, remedial resources, or practice problems assigned..."
              className="w-full rounded-xl border border-[#cbd5e1] p-2.5 text-xs font-medium text-[#1e293b] outline-none focus:ring-2 focus:ring-[#3048a8]"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-[#e2e8f0] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#3048a8] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#253782] disabled:opacity-50"
            >
              {isSubmitting ? "Scheduling..." : "Assign Intervention"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
