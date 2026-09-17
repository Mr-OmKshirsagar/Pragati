/**
 * TNP Officer Placement Dashboard
 * Manage placement drives, internship opportunities, and publish to students
 */

import PragatiFrame from "@/components/PragatiFrame";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Edit2,
  Eye,
  Plus,
  Search,
  Trash2,
  X,
  MapPin,
  Users,
  Download,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { exportPlacementsToExcel } from "@/utils/excelExport";

export default function PlacementDashboard() {
  const query = (trpc as any).tnp?.getPlacements?.useQuery() ?? { data: [] };
  const createMutation = (trpc as any).tnp?.createPlacement?.useMutation() ?? { mutateAsync: async () => {} };
  const deleteMutation = (trpc as any).tnp?.deletePlacement?.useMutation() ?? { mutateAsync: async () => {} };
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Internship" | "Placement">("All");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const placements: any[] = query.data ?? [];
  const filtered = placements.filter((p: any) => {
    const matchesSearch = p.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this placement drive?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Placement drive deleted");
      query.refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete placement");
    }
  };

  const handleExportAll = () => {
    try {
      const result = exportPlacementsToExcel(placements, "placements");
      if (result.success) {
        toast.success(`Exported ${result.count} placements to Excel`);
      } else {
        toast.error(result.error || "Export failed");
      }
      setShowExportMenu(false);
    } catch (error: any) {
      toast.error("Failed to export placements");
    }
  };

  const handleExportFiltered = () => {
    try {
      const result = exportPlacementsToExcel(filtered, "placements_filtered");
      if (result.success) {
        toast.success(`Exported ${result.count} placements to Excel`);
      } else {
        toast.error(result.error || "Export failed");
      }
      setShowExportMenu(false);
    } catch (error: any) {
      toast.error("Failed to export placements");
    }
  };

  return (
    <PragatiFrame title="Placement Drives" activePath="/tnp">
      <main className="min-h-[calc(100vh-70px)] bg-[#f5f7fb] px-4 py-7 sm:px-7 xl:px-10">
        <div className="mx-auto max-w-[1400px]">
          {/* Header */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-[#182643]">Placement Drives</h1>
              <p className="mt-2 text-sm text-[#6c7890]">Create and manage internship & placement opportunities</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 rounded-xl border border-[#dfe5ef] bg-white px-4 py-3 text-sm font-semibold text-[#6c7890] hover:bg-[#f8fafc]"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[#e2e8f2] bg-white shadow-lg z-10">
                    <button
                      onClick={handleExportAll}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-[#6c7890] hover:bg-[#f8fafc] rounded-t-lg"
                    >
                      Export All Placements
                    </button>
                    <button
                      onClick={handleExportFiltered}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-[#6c7890] hover:bg-[#f8fafc] rounded-b-lg border-t border-[#e2e8f2]"
                    >
                      Export Filtered Results
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create Placement Drive
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            {[
              ["Total Drives", placements.length.toString(), "bg-indigo-50 text-indigo-600"],
              ["Internships", placements.filter((p: any) => p.type === "Internship").length.toString(), "bg-emerald-50 text-emerald-600"],
              ["Placements", placements.filter((p: any) => p.type === "Placement").length.toString(), "bg-violet-50 text-violet-600"],
              ["Closing Soon", placements.filter((p: any) => p.closingSoon).length.toString(), "bg-amber-50 text-amber-600"],
            ].map(([label, value, color]) => (
              <div key={label} className={`rounded-2xl border border-[#e2e8f2] ${color} p-6`}>
                <div className="text-sm font-semibold opacity-75">{label}</div>
                <div className="mt-2 text-3xl font-extrabold">{value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#e2e8f2] bg-white p-4 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 rounded-xl border border-[#dfe5ef] px-3 py-2 text-[#8994a8] sm:flex-1">
              <Search className="h-4 w-4" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search company or role..."
                className="w-full bg-transparent text-xs outline-none"
              />
            </label>
            <div className="flex gap-2">
              {["All", "Internship", "Placement"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as any)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    filterType === type
                      ? "bg-indigo-600 text-white"
                      : "border border-[#dfe5ef] text-[#6c7890] hover:bg-[#f8fafc]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Placements List */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e2e8f2] bg-white p-12 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-[#cbd5e1]" />
              <p className="mt-4 text-sm font-semibold text-[#182643]">No placements found</p>
              <p className="text-xs text-[#8995aa]">Create your first placement drive to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((placement) => (
                <div
                  key={placement.id}
                  className="rounded-2xl border border-[#e2e8f2] bg-white p-6 transition hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-600">
                          {placement.company.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#182643]">{placement.company}</h3>
                          <p className="text-sm font-semibold text-indigo-600">{placement.role}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3 text-xs">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            placement.type === "Internship"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {placement.type}
                        </span>
                        {placement.closingSoon && (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                            Closing Soon
                          </span>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="text-[#6c7890]">{placement.location}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-[#6c7890]">{placement.openings} openings</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-[#6c7890]">{placement.batch} Batch</span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-xs text-[#6c7890]">{placement.description}</p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {placement.skills.slice(0, 3).map((skill: any) => (
                          <span
                            key={skill}
                            className="rounded-lg border border-[#dfe5ef] bg-[#f8fafc] px-2 py-1 text-[10px] font-semibold text-[#52617d]"
                          >
                            {skill}
                          </span>
                        ))}
                        {placement.skills.length > 3 && (
                          <span className="text-[10px] font-semibold text-[#8995aa]">
                            +{placement.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        title="View details"
                        className="rounded-lg p-2 text-[#6c7890] hover:bg-[#f1f4f9] hover:text-indigo-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        title="Edit placement"
                        className="rounded-lg p-2 text-[#6c7890] hover:bg-[#f1f4f9] hover:text-indigo-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        title="Delete placement"
                        onClick={() => handleDelete(placement.id)}
                        className="rounded-lg p-2 text-[#6c7890] hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreatePlacementModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              query.refetch();
            }}
          />
        )}
      </main>
    </PragatiFrame>
  );
}

/**
 * Create Placement Modal
 */
function CreatePlacementModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const createMutation = (trpc as any).tnp?.createPlacement?.useMutation() ?? { mutateAsync: async () => {} };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    company: "",
    role: "",
    type: "Internship" as const,
    location: "",
    deadline: "",
    description: "",
    skills: [""] as string[],
    criteria: [{ label: "CGPA", expected: ">= 7.5" }] as Array<{ label: string; expected: string }>,
    verificationRequirements: ["Verified academic record"] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate
      if (!form.company || !form.role || !form.location || !form.deadline || !form.description) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (form.skills.filter(s => s.trim()).length === 0) {
        toast.error("Please add at least one skill");
        return;
      }

      const filledSkills = form.skills.filter(s => s.trim());
      const filledCriteria = form.criteria.filter(c => c.label && c.expected);

      await createMutation.mutateAsync({
        company: form.company,
        role: form.role,
        type: form.type,
        location: form.location,
        deadline: form.deadline,
        description: form.description,
        skills: filledSkills,
        criteria: filledCriteria,
        verificationRequirements: form.verificationRequirements.filter(r => r.trim()),
      });

      toast.success(`Placement drive for ${form.role} created successfully!`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create placement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-[#e2e8f2] bg-white p-6">
          <h2 className="text-xl font-bold text-[#182643]">Create Placement Drive</h2>
          <button onClick={onClose} className="text-[#6c7890] hover:text-[#182643]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Company */}
            <div>
              <label className="text-xs font-bold text-[#6c7890] uppercase">Company Name *</label>
              <input
                required
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g., Google, Microsoft"
                className="mt-1 w-full rounded-lg border border-[#dfe5ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-bold text-[#6c7890] uppercase">Role *</label>
              <input
                required
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g., Software Engineer"
                className="mt-1 w-full rounded-lg border border-[#dfe5ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-bold text-[#6c7890] uppercase">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-[#dfe5ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Internship">Internship</option>
                <option value="Placement">Placement</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-bold text-[#6c7890] uppercase">Location *</label>
              <input
                required
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Bengaluru, Hybrid"
                className="mt-1 w-full rounded-lg border border-[#dfe5ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Deadline */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#6c7890] uppercase">Application Deadline *</label>
              <input
                required
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#dfe5ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-[#6c7890] uppercase">Description *</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the role, responsibilities, and what to expect..."
              rows={4}
              className="mt-1 w-full rounded-lg border border-[#dfe5ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="text-xs font-bold text-[#6c7890] uppercase">Required Skills *</label>
            <div className="mt-2 space-y-2">
              {form.skills.map((skill, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={skill}
                  onChange={(e) => {
                    const newSkills = [...form.skills];
                    newSkills[idx] = e.target.value;
                    setForm({ ...form, skills: newSkills });
                  }}
                  placeholder={`Skill ${idx + 1}`}
                  className="w-full rounded-lg border border-[#dfe5ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, skills: [...form.skills, ""] })}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                + Add Skill
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-[#e2e8f2] pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#dfe5ef] px-4 py-2 text-sm font-semibold text-[#6c7890] hover:bg-[#f8fafc]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Placement Drive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
