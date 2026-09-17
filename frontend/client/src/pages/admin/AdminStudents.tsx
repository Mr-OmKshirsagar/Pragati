import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { AdminTable, TableColumn } from "./components/AdminTable";
import { StatusBadge } from "./components/StatusBadge";
import {
  GraduationCap,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Edit2,
  Download,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  cgpa: number;
  internshipStatus: "pending" | "in_progress" | "completed";
  skillGaps: number;
  status: "active" | "inactive";
}

const mockStudents: Student[] = [
  {
    id: "1",
    name: "Rahul Mehta",
    email: "rahul.mehta@student.northstar.edu",
    department: "Computer Science",
    year: "3",
    cgpa: 8.2,
    internshipStatus: "completed",
    skillGaps: 2,
    status: "active",
  },
  {
    id: "2",
    name: "Priyanka Singh",
    email: "priyanka.singh@student.northstar.edu",
    department: "Information Technology",
    year: "3",
    cgpa: 8.7,
    internshipStatus: "in_progress",
    skillGaps: 1,
    status: "active",
  },
  {
    id: "3",
    name: "Aman Gupta",
    email: "aman.gupta@student.northstar.edu",
    department: "Computer Science",
    year: "2",
    cgpa: 7.9,
    internshipStatus: "pending",
    skillGaps: 4,
    status: "active",
  },
  {
    id: "4",
    name: "Neha Patel",
    email: "neha.patel@student.northstar.edu",
    department: "Electronics",
    year: "4",
    cgpa: 8.5,
    internshipStatus: "completed",
    skillGaps: 0,
    status: "active",
  },
  {
    id: "5",
    name: "Vikram Verma",
    email: "vikram.verma@student.northstar.edu",
    department: "Computer Science",
    year: "3",
    cgpa: 7.1,
    internshipStatus: "pending",
    skillGaps: 6,
    status: "active",
  },
];

const columns: TableColumn<Student>[] = [
  {
    key: "name",
    label: "Name",
    width: "20%",
  },
  {
    key: "email",
    label: "Email",
    width: "25%",
    render: (value) => <span className="text-primary text-xs">{value}</span>,
  },
  {
    key: "department",
    label: "Department",
    width: "15%",
  },
  {
    key: "year",
    label: "Year",
    width: "8%",
    render: (value) => <span className="font-semibold">{value}</span>,
  },
  {
    key: "cgpa",
    label: "CGPA",
    width: "10%",
    render: (value) => (
      <span className={`font-semibold ${value >= 8 ? "text-[#16a889]" : "text-[#e39a44]"}`}>
        {value.toFixed(2)}
      </span>
    ),
  },
  {
    key: "internshipStatus",
    label: "Internship",
    width: "12%",
    render: (value) => {
      const statusMap: Record<string, string> = {
        pending: "Pending",
        in_progress: "In Progress",
        completed: "Completed",
      };
      const colorMap: Record<string, "pending" | "active" | "verified"> = {
        pending: "pending",
        in_progress: "active",
        completed: "verified",
      };
      return <StatusBadge status={colorMap[value] || "pending"} label={statusMap[value] || String(value)} />;
    },
  },
  {
    key: "skillGaps",
    label: "Skill Gaps",
    width: "10%",
    render: (value) => (
      <span className={`font-semibold ${value > 0 ? "text-[#e39a44]" : "text-[#16a889]"}`}>
        {value}
      </span>
    ),
  },
];

export default function AdminStudents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      departmentFilter === "all" || student.department === departmentFilter;
    const matchesYear = yearFilter === "all" || student.year === yearFilter;
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesYear && matchesStatus;
  });

  return (
    <AdminLayout currentPage="/admin/students">
      <AdminPageHeader
        title="Student Management"
        subtitle="View student profiles, academic records, skill assessments and internship progress."
        breadcrumbs={["Admin", "Students"]}
        actions={
          <button className="flex items-center gap-2 rounded-xl border border-[#dce3ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#52617d] shadow-sm transition hover:border-[#bec9df]">
            <Download className="h-4 w-4" />
            Export
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 shadow-sm">
            <Search className="h-4 w-4 text-[#8994a8]" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-[#3d4959] placeholder-[#8994a8] outline-none"
            />
          </div>

          {/* Filter Selects */}
          <div className="flex gap-2">
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

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs font-semibold text-[#3d4959] outline-none"
            >
              <option value="all">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-right text-[#8290a7]">
          {filteredStudents.length} students
        </div>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filteredStudents}
        onRowClick={(student) => setSelectedStudent(student)}
        actions={(student) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStudent(student)}
              className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              title="View student profile"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="Edit profile">
              <Edit2 className="h-4 w-4" />
            </button>
            <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="More options">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-xs text-[#8290a7]">
        <span>Showing 1-5 of {filteredStudents.length}</span>
        <div className="flex gap-2">
          <button className="rounded-lg border border-[#dfe5ef] px-3 py-2 hover:bg-[#f8fafc]">
            Previous
          </button>
          <button className="rounded-lg border border-[#dfe5ef] px-3 py-2 hover:bg-[#f8fafc]">
            Next
          </button>
        </div>
      </div>

      {/* Student Detail Drawer */}
      {selectedStudent && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl border-l border-[#e2e8f2]">
          <div className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#1c2a47]">{selectedStudent.name}</h3>
                <p className="mt-1 text-xs text-[#8290a7]">{selectedStudent.email}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 border-t border-[#e2e8f2] pt-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Academic
                </div>
                <div className="mt-3 grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">Department</span>
                    <span className="font-semibold text-[#1c2a47]">{selectedStudent.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">Year</span>
                    <span className="font-semibold text-[#1c2a47]">Year {selectedStudent.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">CGPA</span>
                    <span className="font-semibold text-[#16a889]">{selectedStudent.cgpa}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Career Status
                </div>
                <div className="mt-3 grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">Internship</span>
                    <StatusBadge status={selectedStudent.internshipStatus === "completed" ? "verified" : "pending"} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">Skill Gaps</span>
                    <span className="font-semibold text-[#e39a44]">{selectedStudent.skillGaps}</span>
                  </div>
                </div>
              </div>

              <button className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90">
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
