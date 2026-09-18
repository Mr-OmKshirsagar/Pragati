import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  Info,
} from "lucide-react";

export type RoleModalMode = "STUDENT_ENROLLMENT" | "FACULTY_ONBOARDING" | "ROLE_REASSIGNMENT";

interface RoleSpecificUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: RoleModalMode;
  targetUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    departmentId?: string | null;
  } | null;
  departmentId?: string;
  onSuccess?: () => void;
}

export default function RoleSpecificUserModal({
  open,
  onOpenChange,
  mode,
  targetUser,
  departmentId,
  onSuccess,
}: RoleSpecificUserModalProps) {
  // Student Form State
  const [studentName, setStudentName] = useState("");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [program, setProgram] = useState("B.Tech Computer Science and Engineering");
  const [batch, setBatch] = useState("2022-2026");
  const [currentSemester, setCurrentSemester] = useState(6);
  const [sectionDivision, setSectionDivision] = useState("Div A");
  const [classId, setClassId] = useState("CSE-SEM6-A");

  // Department Selection State
  const departmentsQuery = trpc.admin.listDepartments.useQuery();
  const departments = departmentsQuery.data || [
    { id: "dept-cse-001", name: "Computer Science & Engineering", code: "CSE" },
    { id: "dept-it-002", name: "Information Technology", code: "IT" },
    { id: "dept-ece-003", name: "Electronics & Communication", code: "ECE" },
  ];
  const [selectedDeptId, setSelectedDeptId] = useState(departmentId || "dept-cse-001");

  // Faculty Form State
  const [facultyName, setFacultyName] = useState("");
  const [facultyEmail, setFacultyEmail] = useState("");
  const [facultyPhone, setFacultyPhone] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [specialization, setSpecialization] = useState("");
  const [highestQualification, setHighestQualification] = useState("M.Tech");

  // Reassignment Form State
  const [newRole, setNewRole] = useState<"FACULTY" | "HOD" | "TNP_COORDINATOR">("HOD");
  const [reassignDeptId, setReassignDeptId] = useState(departmentId || "dept-cse-001");

  const [submitting, setSubmitting] = useState(false);

  // Queries & Mutations
  const utils = trpc.useUtils();
  const submitStudentMutation = trpc.faculty.submitStudentEnrollment.useMutation();
  const requestFacultyMutation = trpc.hod.requestFaculty.useMutation();
  const reassignRoleMutation = trpc.admin.reassignFacultyDesignation.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const activeDeptId = selectedDeptId || departmentId || departments[0]?.id || "dept-cse-001";

    try {
      if (mode === "STUDENT_ENROLLMENT") {
        await submitStudentMutation.mutateAsync({
          classId,
          departmentId: activeDeptId,
          studentData: {
            name: studentName,
            collegeEmail,
            personalEmail: personalEmail || undefined,
            mobilePhone: mobilePhone || undefined,
            parentPhone: parentPhone || undefined,
            enrollmentNumber,
            program,
            batch,
            currentSemester: Number(currentSemester),
            sectionDivision,
          },
        });
        toast.success(`Student enrollment request for ${studentName} submitted for HOD approval!`);
        utils.hod.getPendingStudentRequests.invalidate();
        utils.faculty.getWards.invalidate();
        utils.admin.listStudents.invalidate();
      } else if (mode === "FACULTY_ONBOARDING") {
        await requestFacultyMutation.mutateAsync({
          requestType: "CREATE",
          departmentId: activeDeptId,
          facultyData: {
            name: facultyName,
            email: facultyEmail,
            phone: facultyPhone || undefined,
            facultyId: facultyId || undefined,
            designation,
            specialization: specialization || undefined,
            highestQualification,
          },
        });
        toast.success(`Faculty onboarding request for ${facultyName} submitted for Admin approval!`);
        utils.admin.getPendingFacultyRequests.invalidate();
        utils.admin.listFaculty.invalidate();
      } else if (mode === "ROLE_REASSIGNMENT" && targetUser) {
        await reassignRoleMutation.mutateAsync({
          facultyUserId: targetUser.id,
          newRole,
          departmentId: reassignDeptId || activeDeptId,
        });
        toast.success(`Role reassigned: ${targetUser.name} is now ${newRole}!`);
        utils.admin.listFaculty.invalidate();
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {mode === "STUDENT_ENROLLMENT" && <GraduationCap className="h-5 w-5" />}
              {mode === "FACULTY_ONBOARDING" && <UserPlus className="h-5 w-5" />}
              {mode === "ROLE_REASSIGNMENT" && <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {mode === "STUDENT_ENROLLMENT" && "Submit Student Enrollment Request"}
                {mode === "FACULTY_ONBOARDING" && "Request Faculty Account Creation"}
                {mode === "ROLE_REASSIGNMENT" && "Reassign Faculty Leadership Role"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {mode === "STUDENT_ENROLLMENT" &&
                  "Tier 1 Provisioning: Submitted by Class Teacher and routed to Head of Department for verification."}
                {mode === "FACULTY_ONBOARDING" &&
                  "Tier 2 Provisioning: Initiated by HOD and routed to College Administrator for activation."}
                {mode === "ROLE_REASSIGNMENT" &&
                  "Academic Governance: Reassign leadership roles with automatic prior-holder transition."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* STUDENT ENROLLMENT FORM */}
          {mode === "STUDENT_ENROLLMENT" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Student Full Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Pooja Hegde"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">PRN / Enrollment Number *</Label>
                  <Input
                    required
                    placeholder="e.g. CSE2024099"
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">College Email *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="pooja.hegde@northstar.edu"
                    value={collegeEmail}
                    onChange={(e) => setCollegeEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Personal Email</Label>
                  <Input
                    type="email"
                    placeholder="pooja.personal@gmail.com"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Student Mobile Phone</Label>
                  <Input
                    placeholder="+91 98220 54321"
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Parent / Guardian Phone</Label>
                  <Input
                    placeholder="+91 98220 12345"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Program *</Label>
                  <Input
                    required
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Batch *</Label>
                  <Input
                    required
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Current Semester *</Label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={10}
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-xs font-semibold">Academic Department *</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                  >
                    {departments.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Section / Division</Label>
                  <Input
                    placeholder="Div A"
                    value={sectionDivision}
                    onChange={(e) => setSectionDivision(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Class Identifier *</Label>
                  <Input
                    required
                    placeholder="CSE-SEM6-A"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Once approved by your Head of Department, the student account will be provisioned in the database with <strong>must_change_password: true</strong>.
                </span>
              </div>
            </div>
          )}

          {/* FACULTY ONBOARDING FORM */}
          {mode === "FACULTY_ONBOARDING" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Faculty Name *</Label>
                  <Input
                    required
                    placeholder="Dr. Rajesh Kulkarni"
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Official Email *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="rajesh.kulkarni@northstar.edu"
                    value={facultyEmail}
                    onChange={(e) => setFacultyEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Faculty / Employee ID</Label>
                  <Input
                    placeholder="FAC-CS-205"
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Contact Phone</Label>
                  <Input
                    placeholder="+91 98221 67890"
                    value={facultyPhone}
                    onChange={(e) => setFacultyPhone(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Department Assignment *</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                >
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Designation *</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Adjunct Faculty">Adjunct Faculty</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Highest Qualification</Label>
                  <Input
                    placeholder="Ph.D. in Computer Engg"
                    value={highestQualification}
                    onChange={(e) => setHighestQualification(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Specialization</Label>
                  <Input
                    placeholder="Cloud & Distributed Systems"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  This request will be sent to the College Administrator. Once approved, the faculty account is created and activated.
                </span>
              </div>
            </div>
          )}

          {/* ROLE REASSIGNMENT FORM */}
          {mode === "ROLE_REASSIGNMENT" && targetUser && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
                <div className="font-semibold text-foreground">{targetUser.name}</div>
                <div className="text-muted-foreground">{targetUser.email}</div>
                <div className="text-muted-foreground">Current Role: <span className="font-medium text-foreground">{targetUser.role}</span></div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Select New Leadership Role *</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                >
                  <option value="HOD">Head of Department (HOD)</option>
                  <option value="TNP_COORDINATOR">Training & Placement Coordinator (T&P)</option>
                  <option value="FACULTY">Standard Faculty Member</option>
                </select>
              </div>

              {newRole === "HOD" && (
                <div className="rounded-lg bg-amber-500/15 border border-amber-500/30 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <strong>Graceful Succession Active:</strong> Appointing {targetUser.name} as HOD will automatically transition any current HOD in this department to a Faculty role to avoid dual-leadership conflicts.
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Submitting..." : mode === "ROLE_REASSIGNMENT" ? "Confirm Role Reassignment" : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
