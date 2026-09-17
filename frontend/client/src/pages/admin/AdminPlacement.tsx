/**
 * Admin Placement & Recruitment Governance Console
 * Unified Administration & T&P Career Operations Desk
 * Route: /admin/placement & /tnp
 */

import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { exportPlacementsToExcel } from "@/utils/excelExport";

export default function AdminPlacement() {
  const query = (trpc as any).tnp?.getPlacements?.useQuery() ?? { data: [] };
  const createMutation = (trpc as any).tnp?.createPlacement?.useMutation() ?? { mutateAsync: async () => {} };
  const deleteMutation = (trpc as any).tnp?.deletePlacement?.useMutation() ?? { mutateAsync: async () => {} };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Internship" | "Placement">("All");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const placements: any[] = query.data ?? [];
  const filtered = placements.filter((p: any) => {
    const matchesSearch =
      p.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "All" || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this placement drive?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Placement drive deleted successfully");
      query.refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete placement drive");
    }
  };

  const handleExportAll = () => {
    try {
      const result = exportPlacementsToExcel(placements, "institutional_placements");
      if (result.success) {
        toast.success(`Exported ${result.count} placement drives to Excel`);
      } else {
        toast.error(result.error || "Export failed");
      }
      setShowExportMenu(false);
    } catch {
      toast.error("Failed to export placement drives");
    }
  };

  const handleExportFiltered = () => {
    try {
      const result = exportPlacementsToExcel(filtered, "institutional_placements_filtered");
      if (result.success) {
        toast.success(`Exported ${result.count} filtered drives to Excel`);
      } else {
        toast.error(result.error || "Export failed");
      }
      setShowExportMenu(false);
    } catch {
      toast.error("Failed to export placement drives");
    }
  };

  return (
    <AdminLayout currentPage="/admin/placement">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header with Executive Navy Gradient Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#07172B] via-[#0C2D48] to-[#143D66] p-6 sm:p-8 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-600/15 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 border border-white/15 backdrop-blur-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-300" />
                <span>UNIFIED T&amp;P &amp; SYSTEM GOVERNANCE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Placement &amp; Corporate Drives
              </h1>
              <p className="max-w-2xl text-xs sm:text-sm text-slate-200 leading-relaxed">
                Centralized management for institutional placement drives, corporate internships, AST eligibility evaluation, and student applicant rosters.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs backdrop-blur-xs hover:bg-white/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Roster</span>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-20 text-slate-800">
                    <button
                      onClick={handleExportAll}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      Export All Drives ({placements.length})
                    </button>
                    <button
                      onClick={handleExportFiltered}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-t border-slate-100 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" />
                      Export Filtered ({filtered.length})
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-950/20 hover:from-[#EA580C] hover:to-[#C2410C] active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create Placement Drive</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-time KPI Stats Cards */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {[
            { label: "Active Drives", value: placements.length, tone: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: Target },
            { label: "Internships", value: placements.filter((p) => p.type === "Internship").length, tone: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: Building2 },
            { label: "Full-Time Roles", value: placements.filter((p) => p.type === "Placement").length, tone: "bg-violet-50 text-violet-700 border-violet-100", icon: GraduationCap },
            { label: "Closing Soon", value: placements.filter((p) => p.closingSoon).length, tone: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock },
          ].map(({ label, value, tone, icon: Icon }) => (
            <div key={label} className={`rounded-2xl border ${tone} p-4 sm:p-5 shadow-2xs`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
                <Icon className="h-4 w-4 opacity-80" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold">{value}</div>
            </div>
          ))}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center shadow-xs">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-500 sm:flex-1 bg-slate-50/50">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company, role, location or skill..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {(["All", "Internship", "Placement"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  filterType === type
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Placements List */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-800">No placement drives found</p>
            <p className="text-xs text-slate-500 mt-1">Adjust your search or create a new placement drive above</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((placement) => (
              <div
                key={placement.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 transition hover:shadow-md hover:border-slate-300 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-base font-extrabold text-white shadow-xs">
                        {placement.company.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base truncate">{placement.company}</h3>
                          {placement.closingSoon && (
                            <span className="rounded-full bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-bold text-amber-800 shrink-0">
                              Closing Soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-indigo-600 truncate">{placement.role}</p>
                      </div>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          placement.type === "Internship"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                            : "bg-indigo-50 text-indigo-800 border border-indigo-200/60"
                        }`}
                      >
                        {placement.type}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {placement.location}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" />
                        {placement.openings} openings
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {placement.batch} Batch
                      </span>
                    </div>

                    <p className="mt-2.5 line-clamp-2 text-xs text-slate-600 leading-relaxed">
                      {placement.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {placement.skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 sm:self-start">
                    <button
                      title="View Details"
                      onClick={() => setSelectedPlacement(placement)}
                      className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      title="Delete Placement Drive"
                      onClick={() => handleDelete(placement.id)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Details Modal */}
        {selectedPlacement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                    {selectedPlacement.company.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{selectedPlacement.company}</h2>
                    <p className="text-xs text-slate-500">{selectedPlacement.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlacement(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-slate-400 block font-medium">Type</span>
                    <span className="font-bold text-slate-800">{selectedPlacement.type}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-slate-400 block font-medium">Location</span>
                    <span className="font-bold text-slate-800">{selectedPlacement.location}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-slate-400 block font-medium">Target Batch</span>
                    <span className="font-bold text-slate-800">{selectedPlacement.batch}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-slate-400 block font-medium">Openings</span>
                    <span className="font-bold text-slate-800">{selectedPlacement.openings} positions</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    {selectedPlacement.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Required Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPlacement.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Eligibility Criteria</h4>
                  <div className="space-y-1.5">
                    {selectedPlacement.criteria.map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
                        <span className="font-semibold text-slate-700">{c.label}</span>
                        <span className="font-mono font-bold text-indigo-600">{c.expected}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50 flex justify-end">
                <button
                  onClick={() => setSelectedPlacement(null)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Placement Modal */}
        {showCreateModal && (
          <CreatePlacementModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              query.refetch();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

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
      if (!form.company || !form.role || !form.location || !form.deadline || !form.description) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (form.skills.filter((s) => s.trim()).length === 0) {
        toast.error("Please add at least one required skill");
        return;
      }

      const filledSkills = form.skills.filter((s) => s.trim());
      const filledCriteria = form.criteria.filter((c) => c.label && c.expected);

      await createMutation.mutateAsync({
        company: form.company,
        role: form.role,
        type: form.type,
        location: form.location,
        deadline: form.deadline,
        description: form.description,
        skills: filledSkills,
        criteria: filledCriteria,
        verificationRequirements: form.verificationRequirements.filter((r) => r.trim()),
      });

      toast.success(`Placement drive for ${form.role} at ${form.company} created successfully!`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create placement drive");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 z-10">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Create Placement &amp; Corporate Drive</h2>
            <p className="text-xs text-slate-500">Configure corporate opportunity, role expectations and AST placement criteria</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Company Name *</label>
              <input
                required
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g. Google, Microsoft, Atlas Labs"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role *</label>
              <input
                required
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Software Development Engineer"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Opportunity Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
              >
                <option value="Internship">Internship (Corporate Attachment)</option>
                <option value="Placement">Full-time Placement</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Location *</label>
              <input
                required
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Bengaluru, Hyderabad, Hybrid"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Application Deadline *</label>
              <input
                required
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description &amp; Deliverables *</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Outline role overview, candidate qualifications, and key responsibilities..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Required Skills *</label>
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
                  placeholder={`Skill ${idx + 1} (e.g. Python, Distributed Systems, SQL)`}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, skills: [...form.skills, ""] })}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                + Add Skill Requirement
              </button>
            </div>
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Publishing Drive..." : "Publish Placement Drive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
