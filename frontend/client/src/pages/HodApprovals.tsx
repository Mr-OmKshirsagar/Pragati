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
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  BookOpen,
  UserCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import RoleSpecificUserModal from "@/components/RoleSpecificUserModal";

export default function HodApprovals() {
  const [activeTab, setActiveTab] = useState<"STUDENTS" | "CLASSES">("STUDENTS");
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [targetRejectIds, setTargetRejectIds] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");

  // Class creation dialog state
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newAcademicYear, setNewAcademicYear] = useState("2024-2025");
  const [newSemester, setNewSemester] = useState(6);

  // Assign Class Teacher dialog
  const [assignClassOpen, setAssignClassOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState("");

  // Student Enrollment Request Modal (Class Teacher / HOD)
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);

  // Queries
  const pendingRequestsQuery = trpc.hod.getPendingStudentRequests.useQuery();
  const classesQuery = trpc.hod.listClasses.useQuery();
  const facultyListQuery = trpc.admin.listFaculty.useQuery();

  // Mutations
  const processEnrollmentsMutation = trpc.hod.processStudentEnrollments.useMutation();
  const createClassMutation = trpc.hod.createClass.useMutation();
  const assignClassTeacherMutation = trpc.hod.assignClassTeacher.useMutation();

  const requests = pendingRequestsQuery.data || [];
  const classes = classesQuery.data || [];
  const facultyMembers = facultyListQuery.data || [];

  const filteredRequests = requests.filter((req: any) => {
    const data = req.studentData as any;
    const term = searchTerm.toLowerCase();
    return (
      data?.name?.toLowerCase().includes(term) ||
      data?.collegeEmail?.toLowerCase().includes(term) ||
      data?.enrollmentNumber?.toLowerCase().includes(term) ||
      req.classId?.toLowerCase().includes(term)
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
      await processEnrollmentsMutation.mutateAsync({
        requestIds: selectedRequestIds,
        action: "APPROVE",
      });
      toast.success(`Successfully approved and provisioned ${selectedRequestIds.length} students!`);
      setSelectedRequestIds([]);
      pendingRequestsQuery.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve enrollments.");
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
      await processEnrollmentsMutation.mutateAsync({
        requestIds: targetRejectIds,
        action: "REJECT",
        rejectionReason: rejectionReason || "Rejected by Head of Department",
      });
      toast.success(`Rejected ${targetRejectIds.length} enrollment request(s).`);
      setRejectDialogOpen(false);
      setSelectedRequestIds((prev) => prev.filter((id) => !targetRejectIds.includes(id)));
      pendingRequestsQuery.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject requests.");
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClassMutation.mutateAsync({
        className: newClassName,
        academicYear: newAcademicYear,
        semester: Number(newSemester),
      });
      toast.success(`Class ${newClassName} created successfully!`);
      setCreateClassOpen(false);
      setNewClassName("");
      classesQuery.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create class.");
    }
  };

  const handleAssignClassTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedFacultyId) return;
    try {
      await assignClassTeacherMutation.mutateAsync({
        classId: selectedClassId,
        facultyId: selectedFacultyId,
      });
      toast.success("Class Teacher assigned successfully!");
      setAssignClassOpen(false);
      classesQuery.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign Class Teacher.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Department Governance
            </span>
            <span className="text-xs text-muted-foreground">Tier 1 Approval Desk</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">HOD Student Approvals & Academic Scoping</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review student enrollments submitted by Class Teachers and manage department class allocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              pendingRequestsQuery.refetch();
              classesQuery.refetch();
            }}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setEnrollmentModalOpen(true)}
            className="text-xs gap-1.5 shadow-sm"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Initiate Enrollment
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending Student Requests</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{requests.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Awaiting HOD verification</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Allocated Classes</span>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{classes.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Active academic cohorts</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Department Faculty</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{facultyMembers.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Mentors & instructors</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Security Protocol</span>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-sm font-bold mt-2 text-foreground">Two-Tier Active</div>
          <div className="text-[11px] text-muted-foreground mt-1">Zero self-registration</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("STUDENTS")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "STUDENTS"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Pending Student Approvals ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab("CLASSES")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "CLASSES"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Academic Class Allocations ({classes.length})
        </button>
      </div>

      {/* TAB 1: PENDING STUDENT ENROLLMENTS */}
      {activeTab === "STUDENTS" && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by student, PRN, email, class..."
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

          {/* Requests Table */}
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
                    <th className="p-3">Student Name</th>
                    <th className="p-3">PRN / Roll No</th>
                    <th className="p-3">Email & Contact</th>
                    <th className="p-3">Program & Class</th>
                    <th className="p-3">Submitting Teacher</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
                          <p className="font-semibold text-foreground">No Pending Student Requests</p>
                          <p className="text-xs">All submitted student enrollments have been reviewed.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req: any) => {
                      const data = req.studentData as any;
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
                          <td className="p-3 font-semibold text-foreground">
                            {data?.name || "Unnamed Student"}
                          </td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {data?.enrollmentNumber || "N/A"}
                          </td>
                          <td className="p-3">
                            <div className="text-foreground">{data?.collegeEmail}</div>
                            {data?.parentPhone && (
                              <div className="text-[11px] text-muted-foreground">
                                Parent: {data.parentPhone}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-foreground">{req.classId}</div>
                            <div className="text-[11px] text-muted-foreground">
                              Sem {data?.currentSemester} · {data?.batch}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-foreground">{req.submitterName || "Faculty"}</div>
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
                                  processEnrollmentsMutation
                                    .mutateAsync({
                                      requestIds: [req.id],
                                      action: "APPROVE",
                                    })
                                    .then(() => {
                                      toast.success(`Approved ${data.name}!`);
                                      pendingRequestsQuery.refetch();
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

      {/* TAB 2: ACADEMIC CLASS ALLOCATIONS */}
      {activeTab === "CLASSES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Define academic classes and map Class Teachers to supervise student batches.
            </p>
            <Button
              size="sm"
              onClick={() => setCreateClassOpen(true)}
              className="text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Academic Class
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls: any) => (
              <div
                key={cls.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{cls.className}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Academic Year: {cls.academicYear} · Semester {cls.semester}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Active Class
                  </span>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Class Teacher:</span>
                  </div>
                  <div className="font-semibold text-foreground pl-5">
                    {cls.classTeacherName || (
                      <span className="text-amber-600 dark:text-amber-400 font-normal">
                        Not Assigned
                      </span>
                    )}
                  </div>
                  {cls.classTeacherEmail && (
                    <div className="text-[11px] text-muted-foreground pl-5">
                      {cls.classTeacherEmail}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setSelectedFacultyId(cls.classTeacherId || "");
                    setAssignClassOpen(true);
                  }}
                >
                  {cls.classTeacherId ? "Change Class Teacher" : "Assign Class Teacher"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REJECT DIALOG */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive">
              Reject Enrollment Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Please provide a reason for rejecting the student enrollment request. The submitting Class Teacher will be notified.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold">Rejection Notes / Reason *</Label>
            <Input
              placeholder="e.g. Duplicate PRN or invalid enrollment documents."
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

      {/* CREATE CLASS DIALOG */}
      <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Create Academic Class</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Register a new cohort section under your department.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClass} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Class Name *</Label>
              <Input
                required
                placeholder="e.g. Third Year CSE - Div A"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Academic Year *</Label>
                <Input
                  required
                  placeholder="2024-2025"
                  value={newAcademicYear}
                  onChange={(e) => setNewAcademicYear(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Semester *</Label>
                <Input
                  required
                  type="number"
                  min={1}
                  max={10}
                  value={newSemester}
                  onChange={(e) => setNewSemester(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateClassOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Create Class
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ASSIGN CLASS TEACHER DIALOG */}
      <Dialog open={assignClassOpen} onOpenChange={setAssignClassOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Assign Class Teacher</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select a faculty member to act as the primary Class Teacher for this section.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignClassTeacher} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Select Faculty Member *</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                required
              >
                <option value="">-- Choose Faculty Member --</option>
                {facultyMembers.map((fac: any) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.role}) - {fac.email}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAssignClassOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Confirm Assignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* STUDENT ENROLLMENT INITIATION MODAL */}
      <RoleSpecificUserModal
        open={enrollmentModalOpen}
        onOpenChange={setEnrollmentModalOpen}
        mode="STUDENT_ENROLLMENT"
        onSuccess={() => pendingRequestsQuery.refetch()}
      />
    </div>
  );
}
