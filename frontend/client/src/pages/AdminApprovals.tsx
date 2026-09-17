import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Building2,
  Briefcase,
  RefreshCw,
  Search,
  UserCheck,
  Award,
  AlertCircle,
} from "lucide-react";
import RoleSpecificUserModal from "@/components/RoleSpecificUserModal";

export default function AdminApprovals() {
  const [activeTab, setActiveTab] = useState<"REQUESTS" | "ROLES">("REQUESTS");
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [targetRejectIds, setTargetRejectIds] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");

  // Reassign modal state
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [targetFacultyUser, setTargetFacultyUser] = useState<any>(null);

  // Queries
  const pendingRequestsQuery = trpc.admin.getPendingFacultyRequests.useQuery();
  const facultyListQuery = trpc.admin.listFaculty.useQuery();
  const departmentsQuery = trpc.admin.listDepartments.useQuery();

  // Mutations
  const processFacultyMutation = trpc.admin.processFacultyRequests.useMutation();

  const requests = pendingRequestsQuery.data || [];
  const faculty = facultyListQuery.data || [];
  const departments = departmentsQuery.data || [];

  const filteredRequests = requests.filter((req: any) => {
    const data = req.facultyData as any;
    const term = searchTerm.toLowerCase();
    return (
      data?.name?.toLowerCase().includes(term) ||
      data?.email?.toLowerCase().includes(term) ||
      req.departmentName?.toLowerCase().includes(term) ||
      req.submitterName?.toLowerCase().includes(term)
    );
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRequestIds(filteredRequests.map((r: any) => r.id));
    } else {
      setSelectedRequestIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedRequestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (!selectedRequestIds.length) return;
    try {
      await processFacultyMutation.mutateAsync({
        requestIds: selectedRequestIds,
        action: "APPROVE",
      });
      toast.success(`Successfully approved ${selectedRequestIds.length} faculty requests!`);
      setSelectedRequestIds([]);
      pendingRequestsQuery.refetch();
      facultyListQuery.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve faculty requests.");
    }
  };

  const openRejectDialog = (ids: string[]) => {
    setTargetRejectIds(ids);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!targetRejectIds.length) return;
    try {
      await processFacultyMutation.mutateAsync({
        requestIds: targetRejectIds,
        action: "REJECT",
        rejectionReason: rejectionReason || "Rejected by College Administration",
      });
      toast.success(`Rejected ${targetRejectIds.length} faculty request(s).`);
      setRejectDialogOpen(false);
      setSelectedRequestIds((prev) => prev.filter((id) => !targetRejectIds.includes(id)));
      pendingRequestsQuery.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject requests.");
    }
  };

  const hodsCount = faculty.filter((f: any) => f.role === "HOD").length;
  const tnpCount = faculty.filter((f: any) => f.role === "TNP_COORDINATOR").length;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Institutional Admin
            </span>
            <span className="text-xs text-muted-foreground">Tier 2 Approval Desk</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Admin Faculty Approvals & Leadership Governance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Authorize faculty appointments initiated by Department Heads and reassign academic leadership positions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            pendingRequestsQuery.refetch();
            facultyListQuery.refetch();
          }}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending Faculty Requests</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{requests.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Awaiting administrative sign-off</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Faculty</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{faculty.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Teaching & mentoring staff</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Department Heads (HODs)</span>
            <Award className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{hodsCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Academic department heads</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">T&P Coordinators</span>
            <Briefcase className="h-4 w-4 text-violet-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{tnpCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Industry liaison officers</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("REQUESTS")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "REQUESTS"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Pending Faculty Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab("ROLES")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "ROLES"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Faculty Leadership Reassignment ({faculty.length})
        </button>
      </div>

      {/* TAB 1: PENDING FACULTY REQUESTS */}
      {activeTab === "REQUESTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by faculty, email, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            {selectedRequestIds.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-muted-foreground">
                  {selectedRequestIds.length} selected
                </span>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleBulkApprove}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openRejectDialog(selectedRequestIds)}
                  className="h-8 text-xs gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject Selected
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredRequests.length > 0 &&
                          selectedRequestIds.length === filteredRequests.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Faculty Name</th>
                    <th className="p-3">Official Email</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Designation & Specialization</th>
                    <th className="p-3">Submitting HOD</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
                          <p className="font-semibold text-foreground">No Pending Faculty Requests</p>
                          <p className="text-xs">All departmental faculty requests have been processed.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req: any) => {
                      const data = req.facultyData as any;
                      const isSelected = selectedRequestIds.includes(req.id);

                      return (
                        <tr
                          key={req.id}
                          className={`hover:bg-muted/30 transition-colors ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(req.id)}
                              className="rounded border-border"
                            />
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                req.requestType === "CREATE"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {req.requestType}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-foreground">
                            {data?.name || "Target User"}
                          </td>
                          <td className="p-3 text-foreground">{data?.email || "N/A"}</td>
                          <td className="p-3 font-medium text-foreground">
                            {req.departmentName || "Engineering"}
                          </td>
                          <td className="p-3">
                            <div className="text-foreground">{data?.designation || "Faculty"}</div>
                            {data?.specialization && (
                              <div className="text-[11px] text-muted-foreground">
                                {data.specialization}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="text-foreground">{req.submitterName || "HOD"}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {req.submitterEmail || "N/A"}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  processFacultyMutation
                                    .mutateAsync({
                                      requestIds: [req.id],
                                      action: "APPROVE",
                                    })
                                    .then(() => {
                                      toast.success("Approved faculty request!");
                                      pendingRequestsQuery.refetch();
                                      facultyListQuery.refetch();
                                    });
                                }}
                                className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRejectDialog([req.id])}
                                className="h-7 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FACULTY LEADERSHIP REASSIGNMENT */}
      {activeTab === "ROLES" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-primary" />
              Academic Scoping & Leadership Succession
            </p>
            <p>
              Reassign active faculty to Head of Department (HOD) or Training & Placement (T&P) Coordinator.
              Assigning a new HOD will automatically transition any prior HOD in that department to a standard Faculty role.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                  <tr>
                    <th className="p-3">Faculty Name</th>
                    <th className="p-3">Official Email</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Current Role</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {faculty.map((f: any) => (
                    <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-semibold text-foreground">{f.name}</td>
                      <td className="p-3 text-foreground">{f.email}</td>
                      <td className="p-3 text-muted-foreground">
                        {f.departmentName || "General Faculty"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            f.role === "HOD"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                              : f.role === "TNP_COORDINATOR"
                              ? "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {f.role}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTargetFacultyUser(f);
                            setReassignModalOpen(true);
                          }}
                          className="h-7 text-xs"
                        >
                          Reassign Role
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REJECT DIALOG */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive">
              Reject Faculty Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide an administrative reason for rejecting this faculty onboarding or deletion request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold">Administrative Rejection Reason *</Label>
            <Input
              placeholder="e.g. Budget allocation exceeded or missing qualification documentation."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ROLE REASSIGNMENT MODAL */}
      <RoleSpecificUserModal
        open={reassignModalOpen}
        onOpenChange={setReassignModalOpen}
        mode="ROLE_REASSIGNMENT"
        targetUser={targetFacultyUser}
        departmentId={targetFacultyUser?.departmentId || undefined}
        onSuccess={() => {
          facultyListQuery.refetch();
          pendingRequestsQuery.refetch();
        }}
      />
    </div>
  );
}
