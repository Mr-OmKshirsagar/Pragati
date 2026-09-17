import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { AdminTable, TableColumn } from "./components/AdminTable";
import { StatusBadge } from "./components/StatusBadge";
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  semesters: number;
  programs: number;
  status: "active" | "inactive" | "archived";
}

interface Semester {
  id: string;
  name: string;
  year: string;
  startDate: string;
  endDate: string;
  examDate: string;
  status: "planned" | "ongoing" | "completed";
}

interface Program {
  id: string;
  name: string;
  code: string;
  duration: string;
  department: string;
  status: "active" | "inactive";
}

const mockAcademicYears: AcademicYear[] = [
  {
    id: "1",
    year: "2024-25",
    startDate: "Aug 1, 2024",
    endDate: "Jul 31, 2025",
    semesters: 2,
    programs: 8,
    status: "active",
  },
  {
    id: "2",
    year: "2025-26",
    startDate: "Aug 1, 2025",
    endDate: "Jul 31, 2026",
    semesters: 2,
    programs: 8,
    status: "inactive",
  },
  {
    id: "3",
    year: "2023-24",
    startDate: "Aug 1, 2023",
    endDate: "Jul 31, 2024",
    semesters: 2,
    programs: 8,
    status: "archived",
  },
];

const mockSemesters: Semester[] = [
  {
    id: "1",
    name: "Semester 1",
    year: "2024-25",
    startDate: "Aug 1, 2024",
    endDate: "Dec 15, 2024",
    examDate: "Dec 20-31, 2024",
    status: "ongoing",
  },
  {
    id: "2",
    name: "Semester 2",
    year: "2024-25",
    startDate: "Jan 6, 2025",
    endDate: "May 15, 2025",
    examDate: "May 20-31, 2025",
    status: "planned",
  },
];

const mockPrograms: Program[] = [
  { id: "1", name: "B.Tech CSE", code: "BTCSE", duration: "4 Years", department: "CSE", status: "active" },
  { id: "2", name: "B.Tech IT", code: "BTIT", duration: "4 Years", department: "IT", status: "active" },
  { id: "3", name: "B.Tech ECE", code: "BTECE", duration: "4 Years", department: "ECE", status: "active" },
  { id: "4", name: "B.Tech EE", code: "BTEE", duration: "4 Years", department: "EE", status: "active" },
  { id: "5", name: "B.Tech ME", code: "BTME", duration: "4 Years", department: "ME", status: "active" },
];

const academicYearColumns: TableColumn<AcademicYear>[] = [
  { key: "year", label: "Academic Year", width: "20%" },
  { key: "startDate", label: "Start Date", width: "18%" },
  { key: "endDate", label: "End Date", width: "18%" },
  {
    key: "semesters",
    label: "Semesters",
    width: "12%",
    render: (value) => <span className="font-semibold">{value}</span>,
  },
  {
    key: "programs",
    label: "Programs",
    width: "12%",
    render: (value) => <span className="font-semibold">{value}</span>,
  },
  {
    key: "status",
    label: "Status",
    width: "15%",
    render: (value) => <StatusBadge status={value} />,
  },
];

const semesterColumns: TableColumn<Semester>[] = [
  { key: "name", label: "Semester", width: "15%" },
  { key: "year", label: "Year", width: "12%" },
  { key: "startDate", label: "Start", width: "15%" },
  { key: "endDate", label: "End", width: "15%" },
  { key: "examDate", label: "Exam Period", width: "18%" },
  {
    key: "status",
    label: "Status",
    width: "12%",
    render: (value) => {
      const statusMap = { planned: "pending", ongoing: "active", completed: "verified" } as const;
      return <StatusBadge status={statusMap[value as keyof typeof statusMap]} />;
    },
  },
];

const programColumns: TableColumn<Program>[] = [
  { key: "name", label: "Program", width: "25%" },
  {
    key: "code",
    label: "Code",
    width: "12%",
    render: (value) => (
      <span className="inline-flex px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
        {value}
      </span>
    ),
  },
  { key: "duration", label: "Duration", width: "15%" },
  { key: "department", label: "Department", width: "20%" },
  {
    key: "status",
    label: "Status",
    width: "15%",
    render: (value) => <StatusBadge status={value} />,
  },
];

export default function AdminAcademics() {
  const [activeTab, setActiveTab] = useState<"years" | "semesters" | "programs">("years");

  return (
    <AdminLayout currentPage="/admin/academics">
      <AdminPageHeader
        title="Academic Configuration"
        subtitle="Manage academic years, semesters, programs, subjects and course structures."
        breadcrumbs={["Admin", "Academics"]}
        actions={
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:opacity-90">
            <Plus className="h-4 w-4" />
            Add New
          </button>
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[#e2e8f2]">
        {(["years", "semesters", "programs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] transition-colors border-b-2 ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-[#8290a7] hover:text-[#3d4959]"
            }`}
          >
            {tab === "years" && "Academic Years"}
            {tab === "semesters" && "Semesters"}
            {tab === "programs" && "Programs"}
          </button>
        ))}
      </div>

      {/* Academic Years */}
      {activeTab === "years" && (
        <div>
          <AdminTable
            columns={academicYearColumns}
            data={mockAcademicYears}
            actions={(year) => (
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="Edit">
                  <Edit2 className="h-4 w-4" />
                </button>
                {year.status === "archived" && (
                  <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          />

          <div className="mt-6 flex items-center justify-between text-xs text-[#8290a7]">
            <span>Showing 1-3 of {mockAcademicYears.length}</span>
          </div>
        </div>
      )}

      {/* Semesters */}
      {activeTab === "semesters" && (
        <div>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="premium-card p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                Active Semester
              </div>
              <div className="mt-2">
                <h3 className="font-bold text-[#1c2a47]">{mockSemesters[0].name}</h3>
                <p className="mt-1 text-xs text-[#8290a7]">{mockSemesters[0].year}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#16a889]" />
                  <span className="text-xs font-semibold text-[#16a889]">Ongoing</span>
                </div>
              </div>
            </div>

            <div className="premium-card p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                Upcoming Exam
              </div>
              <div className="mt-2">
                <p className="font-semibold text-[#1c2a47]">{mockSemesters[0].examDate}</p>
                <p className="mt-1 text-xs text-[#8290a7]">Semester 1, 2024-25</p>
              </div>
            </div>
          </div>

          <AdminTable
            columns={semesterColumns}
            data={mockSemesters}
            actions={(sem) => (
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="Edit">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}
          />

          <div className="mt-6 flex items-center justify-between text-xs text-[#8290a7]">
            <span>Showing 1-2 of {mockSemesters.length}</span>
          </div>
        </div>
      )}

      {/* Programs */}
      {activeTab === "programs" && (
        <div>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="premium-card p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                Active Programs
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#1c2a47]">
                {mockPrograms.filter((p) => p.status === "active").length}
              </div>
              <p className="mt-1 text-xs text-[#8290a7]">Across all departments</p>
            </div>

            <div className="premium-card p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                Program Types
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#1c2a47]">5</div>
              <p className="mt-1 text-xs text-[#8290a7]">B.Tech programs</p>
            </div>
          </div>

          <AdminTable
            columns={programColumns}
            data={mockPrograms}
            actions={(prog) => (
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="Edit">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}
          />

          <div className="mt-6 flex items-center justify-between text-xs text-[#8290a7]">
            <span>Showing 1-5 of {mockPrograms.length}</span>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
