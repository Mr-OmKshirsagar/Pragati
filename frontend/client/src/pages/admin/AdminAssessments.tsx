import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { AdminTable, TableColumn } from "./components/AdminTable";
import { StatusBadge } from "./components/StatusBadge";
import {
  ClipboardCheck,
  Plus,
  Edit2,
  Eye,
  MoreVertical,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface Assessment {
  id: string;
  name: string;
  skill: string;
  maxScore: number;
  duration: string;
  semester: string;
  status: "draft" | "scheduled" | "published" | "closed" | "archived";
  enrolledStudents: number;
  completed: number;
  averageScore: number;
  createdDate: string;
}

const mockAssessments: Assessment[] = [
  {
    id: "1",
    name: "Python Fundamentals",
    skill: "Python",
    maxScore: 100,
    duration: "90 mins",
    semester: "Sem 1, 2024-25",
    status: "published",
    enrolledStudents: 145,
    completed: 132,
    averageScore: 76.4,
    createdDate: "Aug 15, 2024",
  },
  {
    id: "2",
    name: "DSA Challenge",
    skill: "DSA",
    maxScore: 150,
    duration: "120 mins",
    semester: "Sem 1, 2024-25",
    status: "published",
    enrolledStudents: 132,
    completed: 118,
    averageScore: 68.2,
    createdDate: "Aug 20, 2024",
  },
  {
    id: "3",
    name: "Java OOP Concepts",
    skill: "Java",
    maxScore: 100,
    duration: "90 mins",
    semester: "Sem 2, 2024-25",
    status: "scheduled",
    enrolledStudents: 98,
    completed: 0,
    averageScore: 0,
    createdDate: "Jan 5, 2025",
  },
  {
    id: "4",
    name: "Database Design",
    skill: "DBMS",
    maxScore: 120,
    duration: "100 mins",
    semester: "Sem 2, 2024-25",
    status: "draft",
    enrolledStudents: 0,
    completed: 0,
    averageScore: 0,
    createdDate: "Jan 8, 2025",
  },
  {
    id: "5",
    name: "React Development",
    skill: "React",
    maxScore: 100,
    duration: "120 mins",
    semester: "Sem 2, 2024-25",
    status: "scheduled",
    enrolledStudents: 56,
    completed: 0,
    averageScore: 0,
    createdDate: "Jan 10, 2025",
  },
];

const columns: TableColumn<Assessment>[] = [
  { key: "name", label: "Assessment", width: "18%" },
  {
    key: "skill",
    label: "Skill",
    width: "12%",
    render: (value) => (
      <span className="inline-flex px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
        {value}
      </span>
    ),
  },
  { key: "semester", label: "Semester", width: "14%" },
  {
    key: "status",
    label: "Status",
    width: "12%",
    render: (value) => {
      const statusMap = {
        draft: "pending",
        scheduled: "pending",
        published: "active",
        closed: "verified",
        archived: "inactive",
      } as const;
      return <StatusBadge status={statusMap[value as keyof typeof statusMap]} />;
    },
  },
  {
    key: "enrolledStudents",
    label: "Enrolled",
    width: "10%",
    render: (value) => <span className="font-semibold">{value}</span>,
  },
  {
    key: "completed",
    label: "Completed",
    width: "10%",
    render: (value) => <span className="font-semibold text-[#16a889]">{value}</span>,
  },
  {
    key: "averageScore",
    label: "Avg Score",
    width: "10%",
    render: (value) => <span className="font-semibold">{value ? `${value}%` : "-"}</span>,
  },
  {
    key: "duration",
    label: "Duration",
    width: "14%",
    render: (value) => <span className="text-xs text-[#8290a7]">{value}</span>,
  },
];

export default function AdminAssessments() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const assessmentsQuery = trpc.admin.listAssessments.useQuery();
  const allAssessments: Assessment[] =
    assessmentsQuery.data && assessmentsQuery.data.length > 0
      ? (assessmentsQuery.data as any)
      : mockAssessments;

  const filteredAssessments = allAssessments.filter((a) => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.skill.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: allAssessments.length,
    published: allAssessments.filter((a) => a.status === "published").length,
    totalEnrolled: allAssessments.reduce((sum, a) => sum + a.enrolledStudents, 0),
    totalCompleted: allAssessments.reduce((sum, a) => sum + a.completed, 0),
  };

  return (
    <AdminLayout currentPage="/admin/assessments">
      <AdminPageHeader
        title="Assessment Management"
        subtitle="Create, publish and monitor skill assessments across the institution."
        breadcrumbs={["Admin", "Assessments"]}
        actions={
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:opacity-90">
            <Plus className="h-4 w-4" />
            New Assessment
          </button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Total
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">{stats.total}</div>
        </div>
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Published
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#16a889]">{stats.published}</div>
        </div>
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Enrolled Students
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">{stats.totalEnrolled}</div>
        </div>
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Completed
          </div>
          <div className="mt-2 text-2xl font-extrabold text-primary">{stats.totalCompleted}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 shadow-sm outline-none text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs font-semibold text-[#3d4959] outline-none"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filteredAssessments}
        onRowClick={(assessment) => setSelectedAssessment(assessment)}
        actions={(assessment) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedAssessment(assessment)}
              className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            {assessment.status !== "closed" && assessment.status !== "archived" && (
              <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="Edit">
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="More">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-xs text-[#8290a7]">
        <span>Showing 1-5 of {filteredAssessments.length}</span>
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
      {selectedAssessment && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl border-l border-[#e2e8f2]">
          <div className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#1c2a47]">{selectedAssessment.name}</h3>
                <span className="mt-2 inline-flex px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                  {selectedAssessment.skill}
                </span>
              </div>
              <button
                onClick={() => setSelectedAssessment(null)}
                className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 border-t border-[#e2e8f2] pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#e2e8f2] p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                    Max Score
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">
                    {selectedAssessment.maxScore}
                  </div>
                </div>

                <div className="rounded-xl border border-[#e2e8f2] p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                    Duration
                  </div>
                  <div className="mt-2 font-semibold text-[#1c2a47]">
                    {selectedAssessment.duration}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Semester
                </div>
                <p className="mt-2 text-xs font-semibold text-[#3d4959]">{selectedAssessment.semester}</p>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Status
                </div>
                <div className="mt-2">
                  <StatusBadge
                    status={
                      {
                        draft: "pending",
                        scheduled: "pending",
                        published: "active",
                        closed: "verified",
                        archived: "inactive",
                      }[selectedAssessment.status] as any
                    }
                  />
                </div>
              </div>

              {selectedAssessment.status === "published" && (
                <>
                  <div className="border-t border-[#e2e8f2] pt-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                      Performance
                    </div>
                    <div className="mt-3 grid gap-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-[#8290a7]">Enrolled</span>
                        <span className="font-semibold text-[#1c2a47]">
                          {selectedAssessment.enrolledStudents}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-[#8290a7]">Completed</span>
                        <span className="font-semibold text-[#16a889]">
                          {selectedAssessment.completed}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-[#8290a7]">Completion Rate</span>
                        <span className="font-semibold text-[#1c2a47]">
                          {(
                            (selectedAssessment.completed /
                              selectedAssessment.enrolledStudents) *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-[#8290a7]">Average Score</span>
                        <span className="font-semibold text-primary">
                          {selectedAssessment.averageScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <button className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90">
                  Edit
                </button>
                <button className="flex-1 rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#52617d] transition hover:bg-[#f8fafc]">
                  View Results
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
