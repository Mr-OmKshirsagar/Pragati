import React, { useState } from "react";
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  Users,
  Plus,
  Lock,
  Unlock,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Sparkles,
  LogOut,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SuperAdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"INSTITUTIONS" | "TRASH" | "CHANGES">("INSTITUTIONS");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

  // Modals
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [selectedInstForSuspend, setSelectedInstForSuspend] = useState<{ id: string; name: string } | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");

  // Queries
  const statsQuery = trpc.superAdmin.getPlatformStats.useQuery();
  const institutionsQuery = trpc.superAdmin.listInstitutions.useQuery({
    status: filterStatus === "ALL" ? undefined : filterStatus,
    search: searchQuery || undefined,
  });
  const trashQuery = trpc.superAdmin.listTrash.useQuery();
  const changeRequestsQuery = trpc.superAdmin.listChangeRequests.useQuery();

  // Mutations
  const provisionMutation = trpc.superAdmin.provisionInstitution.useMutation({
    onSuccess: data => {
      toast.success(data.message);
      setIsProvisionModalOpen(false);
      institutionsQuery.refetch();
      statsQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const suspendMutation = trpc.superAdmin.suspendInstitution.useMutation({
    onSuccess: data => {
      toast.warning(data.message);
      setIsSuspendModalOpen(false);
      setSuspensionReason("");
      setSelectedInstForSuspend(null);
      institutionsQuery.refetch();
      statsQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const reviveMutation = trpc.superAdmin.reviveInstitution.useMutation({
    onSuccess: data => {
      toast.success(data.message);
      institutionsQuery.refetch();
      statsQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const deleteMutation = trpc.superAdmin.softDeleteInstitution.useMutation({
    onSuccess: data => {
      toast.info(data.message);
      institutionsQuery.refetch();
      trashQuery.refetch();
      statsQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const restoreMutation = trpc.superAdmin.restoreFromTrash.useMutation({
    onSuccess: data => {
      toast.success(data.message);
      trashQuery.refetch();
      institutionsQuery.refetch();
      statsQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const reviewChangeMutation = trpc.superAdmin.reviewChangeRequest.useMutation({
    onSuccess: data => {
      toast.success(data.message);
      changeRequestsQuery.refetch();
      institutionsQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  // Provisioning Form State
  const [provisionForm, setProvisionForm] = useState({
    name: "",
    code: "",
    domain: "",
    universityBoard: "",
    address: "",
    city: "",
    state: "",
    contactPhone: "",
    contactEmail: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminDesignation: "Principal / Director",
    adminEmployeeId: "",
  });

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    provisionMutation.mutate(provisionForm);
  };

  const handleSuspendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstForSuspend || !suspensionReason.trim()) return;
    suspendMutation.mutate({
      institutionId: selectedInstForSuspend.id,
      reason: suspensionReason,
    });
  };

  const stats = statsQuery.data || {
    totalInstitutions: 1,
    activeInstitutions: 1,
    suspendedInstitutions: 0,
    demoInstitutions: 1,
    totalUsers: 9,
    totalStudents: 1,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Governance Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">PRAGATI</h1>
                <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[11px] font-mono font-semibold text-indigo-400">
                  Platform Owner
                </span>
              </div>
              <p className="text-xs text-slate-400">Multi-Tenant Global Governance & Institutional Oversight</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Dual-Lock Active</span>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Colleges</span>
              <Building2 className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalInstitutions}</div>
            <p className="text-[11px] text-slate-500 mt-1">{stats.demoInstitutions} demo sandbox included</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300">{stats.activeInstitutions}</div>
            <p className="text-[11px] text-emerald-500/70 mt-1">Operational & accepting logins</p>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-4">
            <div className="flex items-center justify-between text-rose-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Suspended</span>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-300">{stats.suspendedInstitutions}</div>
            <p className="text-[11px] text-rose-500/70 mt-1">Cascaded lockout active</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Platform Accounts</span>
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-[11px] text-slate-500 mt-1">Students, Faculty & Staff</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("INSTITUTIONS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "INSTITUTIONS"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/50"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" /> Registered Institutions
            </button>

            <button
              onClick={() => setActiveTab("TRASH")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "TRASH"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/50"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" /> 30-Day Trash Pool
              {(trashQuery.data?.length ?? 0) > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white font-bold">
                  {trashQuery.data?.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("CHANGES")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "CHANGES"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/50"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Change Requests
              {(changeRequestsQuery.data?.length ?? 0) > 0 && (
                <span className="rounded-full bg-indigo-500 px-1.5 py-0.2 text-[10px] text-white font-bold">
                  {changeRequestsQuery.data?.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "INSTITUTIONS" && (
            <button
              onClick={() => setIsProvisionModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-900/30 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Provision New Institution
            </button>
          )}
        </div>

        {/* TAB 1: INSTITUTIONS DIRECTORY */}
        {activeTab === "INSTITUTIONS" && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by college name, AISHE code, domain, or city..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="flex gap-2">
                {(["ALL", "ACTIVE", "SUSPENDED"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      filterStatus === s
                        ? "bg-slate-800 text-white border border-slate-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Institutions Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Institution</th>
                    <th className="py-3.5 px-4 font-semibold">Code / AISHE</th>
                    <th className="py-3.5 px-4 font-semibold">Affiliation & Domain</th>
                    <th className="py-3.5 px-4 font-semibold">Location</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Governance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {institutionsQuery.isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                        Loading registered institutions...
                      </td>
                    </tr>
                  ) : (institutionsQuery.data?.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No institutions match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    institutionsQuery.data?.map(inst => (
                      <tr key={inst.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            {inst.name}
                            {inst.isDemo && (
                              <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
                                DEMO SANDBOX
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{inst.contactEmail || "No contact email"}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-indigo-300">{inst.code}</td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200">{inst.universityBoard || "Autonomous"}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{inst.domain || "—"}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {inst.city && inst.state ? `${inst.city}, ${inst.state}` : "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          {inst.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-rose-400">
                              <Lock className="h-2.5 w-2.5" /> Suspended
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inst.status === "ACTIVE" ? (
                              <button
                                onClick={() => {
                                  setSelectedInstForSuspend({ id: inst.id, name: inst.name });
                                  setIsSuspendModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 px-2.5 py-1 text-[11px] font-semibold text-rose-300 transition"
                              >
                                <Lock className="h-3 w-3" /> Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => reviveMutation.mutate({ institutionId: inst.id })}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 transition"
                              >
                                <Unlock className="h-3 w-3" /> Revive
                              </button>
                            )}

                            {!inst.isDemo && (
                              <button
                                onClick={() => {
                                  if (confirm(`Move ${inst.name} to 30-day trash recovery pool?`)) {
                                    deleteMutation.mutate({ institutionId: inst.id });
                                  }
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition"
                              >
                                <Trash2 className="h-3 w-3" /> Trash
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: 30-DAY TRASH POOL */}
        {activeTab === "TRASH" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-300 flex items-center gap-3">
              <Clock className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>
                <strong>30-Day Recovery Guarantee:</strong> Soft-deleted institutions and data can be restored within 30 days. After 30 days, items are automatically purged.
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Deleted At</th>
                    <th className="py-3 px-4">Recovery Window</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {(trashQuery.data?.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Trash recovery pool is empty. Zero soft-deleted entities.
                      </td>
                    </tr>
                  ) : (
                    trashQuery.data?.map(item => (
                      <tr key={item.resourceId} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-white">{item.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{item.resourceType}</td>
                        <td className="py-3 px-4 font-mono text-indigo-300">{item.code}</td>
                        <td className="py-3 px-4 text-slate-400">{item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : "—"}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 font-semibold ${item.daysRemaining <= 5 ? 'text-rose-400' : 'text-amber-300'}`}>
                            <Clock className="h-3 w-3" /> {item.daysRemaining} days remaining
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => restoreMutation.mutate({ resourceType: item.resourceType, resourceId: item.resourceId })}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1 text-xs font-semibold text-white transition"
                          >
                            <RotateCcw className="h-3 w-3" /> Restore
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CHANGE REQUESTS */}
        {activeTab === "CHANGES" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">Requested By</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {(changeRequestsQuery.data?.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No pending institution change requests.
                      </td>
                    </tr>
                  ) : (
                    changeRequestsQuery.data?.map(req => (
                      <tr key={req.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-white">{req.institutionName || "Unknown"}</td>
                        <td className="py-3 px-4">{req.requestedByName || "Admin"}</td>
                        <td className="py-3 px-4 text-slate-300 font-medium">"{req.reason}"</td>
                        <td className="py-3 px-4">
                          <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {req.status === "PENDING" && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => reviewChangeMutation.mutate({ requestId: req.id, action: "APPROVE" })}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white transition"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </button>
                              <button
                                onClick={() => reviewChangeMutation.mutate({ requestId: req.id, action: "REJECT" })}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white transition"
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: PROVISION NEW INSTITUTION */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-400" /> Provision New Real Institution
                </h3>
                <p className="text-xs text-slate-400">Creates isolated tenant partition & College Admin credentials</p>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official College Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oxford Institute of Engineering"
                    value={provisionForm.name}
                    onChange={e => setProvisionForm({ ...provisionForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">AISHE / College Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. C-12345 or OXFORD-01"
                    value={provisionForm.code}
                    onChange={e => setProvisionForm({ ...provisionForm, code: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Affiliated University / Board *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Technical University"
                    value={provisionForm.universityBoard}
                    onChange={e => setProvisionForm({ ...provisionForm, universityBoard: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Domain *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. oxford.edu.in"
                    value={provisionForm.domain}
                    onChange={e => setProvisionForm({ ...provisionForm, domain: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Campus Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Street, Campus Area"
                    value={provisionForm.address}
                    onChange={e => setProvisionForm({ ...provisionForm, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore"
                    value={provisionForm.city}
                    onChange={e => setProvisionForm({ ...provisionForm, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karnataka"
                    value={provisionForm.state}
                    onChange={e => setProvisionForm({ ...provisionForm, state: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 80 1234 5678"
                    value={provisionForm.contactPhone}
                    onChange={e => setProvisionForm({ ...provisionForm, contactPhone: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Contact Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="registrar@oxford.edu"
                    value={provisionForm.contactEmail}
                    onChange={e => setProvisionForm({ ...provisionForm, contactEmail: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Administrator Section */}
              <div className="border-t border-slate-800 pt-3 mt-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                  College Administrator (Root Admin)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Admin Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Rajesh Gupta"
                      value={provisionForm.adminName}
                      onChange={e => setProvisionForm({ ...provisionForm, adminName: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Admin Official Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="principal@oxford.edu"
                      value={provisionForm.adminEmail}
                      onChange={e => setProvisionForm({ ...provisionForm, adminEmail: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Admin Mobile Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      value={provisionForm.adminPhone}
                      onChange={e => setProvisionForm({ ...provisionForm, adminPhone: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Employee / Admin ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="EMP-ADM-001"
                      value={provisionForm.adminEmployeeId}
                      onChange={e => setProvisionForm({ ...provisionForm, adminEmployeeId: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisionMutation.isPending}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-900/40 transition disabled:opacity-50 cursor-pointer"
                >
                  {provisionMutation.isPending ? "Provisioning..." : "Complete Institution Provisioning"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUSPEND INSTITUTION */}
      {isSuspendModalOpen && selectedInstForSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Suspend Institutional Access</h3>
                <p className="text-xs text-rose-300/80">{selectedInstForSuspend.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Suspending this institution will <strong>immediately lock out all students, faculty, HODs, and administrators</strong> of this college. They will be greeted with the explanation reason you provide below.
            </p>

            <form onSubmit={handleSuspendSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Mandatory Suspension Explanation *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Annual institutional compliance renewal pending. Please contact university administration."
                  value={suspensionReason}
                  onChange={e => setSuspensionReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-rose-500 outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSuspendModalOpen(false);
                    setSelectedInstForSuspend(null);
                  }}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={suspendMutation.isPending || suspensionReason.trim().length < 5}
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/50 transition disabled:opacity-50 cursor-pointer"
                >
                  {suspendMutation.isPending ? "Suspending..." : "Confirm & Lock Institutional Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
