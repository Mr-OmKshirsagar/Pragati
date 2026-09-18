import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { AdminTable, TableColumn } from "./components/AdminTable";
import { StatusBadge } from "./components/StatusBadge";
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit2,
  Settings,
  X,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  code: string;
  hod: string;
  facultyCount: number;
  studentCount: number;
  activeInternships: number;
  status: "active" | "inactive";
  createdDate: string;
}

const mockDepartments: Department[] = [
  {
    id: "1",
    name: "Computer Science",
    code: "CSE",
    hod: "Dr. Priya Sharma",
    facultyCount: 18,
    studentCount: 420,
    activeInternships: 56,
    status: "active",
    createdDate: "Jan 5, 2024",
  },
  {
    id: "2",
    name: "Information Technology",
    code: "IT",
    hod: "Dr. Vikram Singh",
    facultyCount: 14,
    studentCount: 320,
    activeInternships: 42,
    status: "active",
    createdDate: "Jan 5, 2024",
  },
  {
    id: "3",
    name: "Electronics & Communication",
    code: "ECE",
    hod: "Dr. Rajesh Kumar",
    facultyCount: 16,
    studentCount: 380,
    activeInternships: 48,
    status: "active",
    createdDate: "Jan 5, 2024",
  },
  {
    id: "4",
    name: "Electrical Engineering",
    code: "EE",
    hod: "Dr. Meera Gupta",
    facultyCount: 12,
    studentCount: 280,
    activeInternships: 32,
    status: "active",
    createdDate: "Feb 10, 2024",
  },
  {
    id: "5",
    name: "Mechanical Engineering",
    code: "ME",
    hod: "Dr. Arun Patel",
    facultyCount: 11,
    studentCount: 250,
    activeInternships: 28,
    status: "active",
    createdDate: "Mar 1, 2024",
  },
];

const columns: TableColumn<Department>[] = [
  {
    key: "name",
    label: "Department",
    width: "18%",
  },
  {
    key: "code",
    label: "Code",
    width: "10%",
    render: (value) => (
      <span className="inline-flex px-2.5 py-1 rounded-lg bg-[#f0ebff] text-[#7358c9] text-xs font-semibold">
        {value}
      </span>
    ),
  },
  {
    key: "hod",
    label: "HOD",
    width: "18%",
  },
  {
    key: "facultyCount",
    label: "Faculty",
    width: "10%",
    render: (value) => <span className="font-semibold">{value}</span>,
  },
  {
    key: "studentCount",
    label: "Students",
    width: "12%",
    render: (value) => <span className="font-semibold">{value}</span>,
  },
  {
    key: "activeInternships",
    label: "Internships",
    width: "14%",
    render: (value) => (
      <span className="inline-flex items-center gap-1 font-semibold text-[#16a889]">
        <span className="h-2 w-2 rounded-full bg-[#16a889]" />
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

export default function AdminDepartments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deptsQuery = trpc.admin.listDepartments.useQuery();
  const createDeptMutation = trpc.admin.createDepartment.useMutation();

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptCode.trim()) {
      toast.error("Please provide both department name and code.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createDeptMutation.mutateAsync({
        name: newDeptName.trim(),
        code: newDeptCode.trim().toUpperCase(),
      });
      toast.success(`Department "${newDeptName}" (${newDeptCode.toUpperCase()}) created successfully.`);
      setIsCreateModalOpen(false);
      setNewDeptName("");
      setNewDeptCode("");
      deptsQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create department.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const departmentsList: Department[] =
    deptsQuery.data && deptsQuery.data.length > 0
      ? deptsQuery.data.map((d, idx) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          hod: "Dr. Department Head",
          facultyCount: 14 + (idx % 3) * 4,
          studentCount: 320 + (idx % 3) * 60,
          activeInternships: 36 + (idx % 3) * 12,
          status: "active" as const,
          createdDate: (d as any).createdAt
            ? new Date((d as any).createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Jan 5, 2024",
        }))
      : mockDepartments;

  const filteredDepts = departmentsList.filter((dept) => {
    return (
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.hod.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const stats = {
    totalDepts: departmentsList.length,
    totalFaculty: departmentsList.reduce((sum, d) => sum + d.facultyCount, 0),
    totalStudents: departmentsList.reduce((sum, d) => sum + d.studentCount, 0),
    activeInternships: departmentsList.reduce((sum, d) => sum + d.activeInternships, 0),
  };

  return (
    <AdminLayout currentPage="/admin/departments">
      <AdminPageHeader
        title="Department Management"
        subtitle="Manage departments, assign HODs, configure sections and monitor departmental metrics."
        breadcrumbs={["Admin", "Departments"]}
        actions={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add Department
          </button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Departments
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">{stats.totalDepts}</div>
        </div>
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Faculty
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
            Internships
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#16a889]">{stats.activeInternships}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="flex-1 grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-[#8994a8]" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-[#3d4959] placeholder-[#8994a8] outline-none"
          />
        </div>

        <div className="text-xs text-right text-[#8290a7]">
          {filteredDepts.length} departments
        </div>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filteredDepts}
        onRowClick={(dept) => setSelectedDept(dept)}
        actions={(dept) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDept(dept)}
              className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="Edit">
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              title="Configure"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="More">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-xs text-[#8290a7]">
        <span>Showing 1-5 of {filteredDepts.length}</span>
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
      {selectedDept && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl border-l border-[#e2e8f2]">
          <div className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#1c2a47]">{selectedDept.name}</h3>
                <p className="mt-1 text-xs text-[#8290a7]">
                  Department Code: <span className="font-semibold">{selectedDept.code}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 border-t border-[#e2e8f2] pt-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Department Head
                </div>
                <div className="mt-3">
                  <p className="font-semibold text-[#1c2a47]">{selectedDept.hod}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                    Faculty Count
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">
                    {selectedDept.facultyCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                    Students
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">
                    {selectedDept.studentCount}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Career Operations
                </div>
                <div className="mt-3 grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">Active Internships</span>
                    <span className="font-semibold text-[#16a889]">{selectedDept.activeInternships}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">Status</span>
                    <StatusBadge status={selectedDept.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">Created</span>
                    <span className="font-semibold text-[#3d4959]">{selectedDept.createdDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90">
                  Edit
                </button>
                <button className="flex-1 rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#52617d] transition hover:bg-[#f8fafc]">
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add Academic Department</h3>
                  <p className="text-xs text-slate-500">Configure new discipline within the institution</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence & Data Science"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. AIDS or CSE"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-mono text-slate-900 uppercase placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
                <p className="mt-1 text-[11px] text-slate-500">Used for course prefixes and enrollment schemes (2-10 uppercase chars).</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary/95 active:scale-95 disabled:opacity-50 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isSubmitting ? "Creating..." : "Create Department"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
