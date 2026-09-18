import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { AdminTable, TableColumn } from "./components/AdminTable";
import { StatusBadge } from "./components/StatusBadge";
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit2,
  Download,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import RoleSpecificUserModal from "@/components/RoleSpecificUserModal";

interface FacultyMember {
  id: string;
  name: string;
  email: string;
  role: "Faculty" | "HOD";
  department: string;
  assignedStudents: number;
  openInterventions: number;
  pendingVerifications: number;
  status: "active" | "inactive";
}

const mockFaculty: FacultyMember[] = [
  {
    id: "1",
    name: "Dr. Priya Sharma",
    email: "priya.sharma@northstar.edu",
    role: "HOD",
    department: "Computer Science",
    assignedStudents: 120,
    openInterventions: 8,
    pendingVerifications: 12,
    status: "active",
  },
  {
    id: "2",
    name: "Vikram Singh",
    email: "vikram.singh@northstar.edu",
    role: "Faculty",
    department: "Computer Science",
    assignedStudents: 45,
    openInterventions: 3,
    pendingVerifications: 5,
    status: "active",
  },
  {
    id: "3",
    name: "Anjali Verma",
    email: "anjali.verma@northstar.edu",
    role: "Faculty",
    department: "Information Technology",
    assignedStudents: 38,
    openInterventions: 2,
    pendingVerifications: 3,
    status: "active",
  },
  {
    id: "4",
    name: "Dr. Rajesh Kumar",
    email: "rajesh.kumar@northstar.edu",
    role: "HOD",
    department: "Electronics",
    assignedStudents: 98,
    openInterventions: 6,
    pendingVerifications: 8,
    status: "active",
  },
  {
    id: "5",
    name: "Dr. Meera Gupta",
    email: "meera.gupta@northstar.edu",
    role: "Faculty",
    department: "Electronics",
    assignedStudents: 42,
    openInterventions: 1,
    pendingVerifications: 2,
    status: "inactive",
  },
];

const columns: TableColumn<FacultyMember>[] = [
  {
    key: "name",
    label: "Name",
    width: "18%",
  },
  {
    key: "email",
    label: "Email",
    width: "22%",
    render: (value) => <span className="text-primary text-xs">{value}</span>,
  },
  {
    key: "role",
    label: "Role",
    width: "10%",
    render: (value) => (
      <span className="inline-flex px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
        {value}
      </span>
    ),
  },
  {
    key: "department",
    label: "Department",
    width: "15%",
  },
  {
    key: "assignedStudents",
    label: "Students",
    width: "10%",
    render: (value) => <span className="font-semibold">{value}</span>,
  },
  {
    key: "openInterventions",
    label: "Interventions",
    width: "12%",
    render: (value) => (
      <span className={`font-semibold ${value > 0 ? "text-[#e39a44]" : "text-[#16a889]"}`}>
        {value}
      </span>
    ),
  },
  {
    key: "pendingVerifications",
    label: "Pending",
    width: "10%",
    render: (value) => (
      <span className={`font-semibold ${value > 0 ? "text-primary" : "text-[#16a889]"}`}>
        {value}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    width: "10%",
    render: (value) => <StatusBadge status={value} />,
  },
];

export default function AdminFaculty() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);

  const facultyQuery = trpc.admin.listFaculty.useQuery();
  const pendingFacultyQuery = trpc.admin.getPendingFacultyRequests.useQuery();
  const pendingCount = (pendingFacultyQuery.data || []).length;

  const facultyList: FacultyMember[] =
    facultyQuery.data && facultyQuery.data.length > 0
      ? facultyQuery.data.map((f, idx) => ({
          id: f.id,
          name: f.name,
          email: f.email,
          role: (f.role === "HOD" ? "HOD" : "Faculty") as "Faculty" | "HOD",
          department: f.departmentName || "Computer Science",
          assignedStudents: 35 + (idx % 4) * 10,
          openInterventions: 2 + (idx % 3),
          pendingVerifications: 3 + (idx % 4),
          status: f.isActive ? ("active" as const) : ("inactive" as const),
        }))
      : mockFaculty;

  const filteredFaculty = facultyList.filter((faculty) => {
    const matchesSearch =
      faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || faculty.role === roleFilter;
    const matchesDepartment =
      departmentFilter === "all" || faculty.department === departmentFilter;

    return matchesSearch && matchesRole && matchesDepartment;
  });

  const stats = {
    totalFaculty: facultyList.length,
    totalStudents: facultyList.reduce((sum, f) => sum + f.assignedStudents, 0),
    openInterventions: facultyList.reduce((sum, f) => sum + f.openInterventions, 0),
    pendingVerifications: facultyList.reduce((sum, f) => sum + f.pendingVerifications, 0),
  };

  return (
    <AdminLayout currentPage="/admin/faculty">
      <AdminPageHeader
        title="Faculty & HOD Management"
        subtitle="Manage faculty assignments, student mappings, and departmental oversight."
        breadcrumbs={["Admin", "Faculty"]}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFacultyModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add / Onboard Faculty
            </button>
          </div>
        }
      />

      {/* Pending Faculty Requests Banner */}
      {pendingCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-950">
                Tier-2 Pending Approvals: {pendingCount} Faculty Onboarding {pendingCount === 1 ? "Request" : "Requests"} Pending
              </h4>
              <p className="text-xs text-amber-800">
                Department HODs have requested faculty recruitments. Review qualifications, approve accounts, or assign faculty designations.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/approvals")}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-amber-700 active:scale-95 transition"
          >
            <span>Review in Approvals Desk</span>
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Total Faculty
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">{stats.totalFaculty}</div>
        </div>
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Students
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">{stats.totalStudents}</div>
        </div>
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Open Interventions
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#e39a44]">{stats.openInterventions}</div>
        </div>
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Pending Verifications
          </div>
          <div className="mt-2 text-2xl font-extrabold text-primary">{stats.pendingVerifications}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 shadow-sm">
            <Search className="h-4 w-4 text-[#8994a8]" />
            <input
              type="text"
              placeholder="Search faculty by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-[#3d4959] placeholder-[#8994a8] outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs font-semibold text-[#3d4959] outline-none"
            >
              <option value="all">All Roles</option>
              <option value="Faculty">Faculty</option>
              <option value="HOD">HOD</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs font-semibold text-[#3d4959] outline-none"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">IT</option>
              <option value="Electronics">Electronics</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-right text-[#8290a7]">
          {filteredFaculty.length} faculty
        </div>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filteredFaculty}
        onRowClick={(faculty) => setSelectedFaculty(faculty)}
        actions={(faculty) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFaculty(faculty)}
              className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="Edit">
              <Edit2 className="h-4 w-4" />
            </button>
            <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="More">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-xs text-[#8290a7]">
        <span>Showing 1-5 of {filteredFaculty.length}</span>
        <div className="flex gap-2">
          <button className="rounded-lg border border-[#dfe5ef] px-3 py-2 hover:bg-[#f8fafc]">
            Previous
          </button>
          <button className="rounded-lg border border-[#dfe5ef] px-3 py-2 hover:bg-[#f8fafc]">
            Next
          </button>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedFaculty && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl border-l border-[#e2e8f2]">
          <div className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-[#1c2a47]">{selectedFaculty.name}</h3>
                  <span className="inline-flex px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                    {selectedFaculty.role}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#8290a7]">{selectedFaculty.email}</p>
              </div>
              <button
                onClick={() => setSelectedFaculty(null)}
                className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 border-t border-[#e2e8f2] pt-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Overview
                </div>
                <div className="mt-3 grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">Department</span>
                    <span className="font-semibold text-[#1c2a47]">{selectedFaculty.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">Assigned Students</span>
                    <span className="font-semibold text-[#1c2a47]">{selectedFaculty.assignedStudents}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Workload
                </div>
                <div className="mt-3 grid gap-3">
                  {selectedFaculty.openInterventions > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#fff2df]">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-[#bb741e]" />
                        <span className="text-xs text-[#bb741e] font-semibold">
                          {selectedFaculty.openInterventions} open intervention
                          {selectedFaculty.openInterventions > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedFaculty.pendingVerifications > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10">
                      <span className="text-xs text-primary font-semibold">
                        {selectedFaculty.pendingVerifications} pending verification
                        {selectedFaculty.pendingVerifications > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90">
                  View Profile
                </button>
                <button className="flex-1 rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#52617d] transition hover:bg-[#f8fafc]">
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Onboarding Modal */}
      <RoleSpecificUserModal
        open={facultyModalOpen}
        onOpenChange={setFacultyModalOpen}
        mode="FACULTY_ONBOARDING"
        onSuccess={() => {
          facultyQuery.refetch();
          pendingFacultyQuery.refetch();
        }}
      />
    </AdminLayout>
  );
}
