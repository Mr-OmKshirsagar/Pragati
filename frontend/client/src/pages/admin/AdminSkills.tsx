import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { AdminTable, TableColumn } from "./components/AdminTable";
import { StatusBadge } from "./components/StatusBadge";
import {
  Zap,
  Plus,
  Edit2,
  Archive,
  MoreVertical,
  Eye,
  Layers,
  Users,
} from "lucide-react";
import { useState } from "react";

interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  usedIn: {
    assessments: number;
    students: number;
  };
  status: "active" | "inactive" | "archived";
  createdDate: string;
}

const mockSkills: Skill[] = [
  {
    id: "1",
    name: "Python",
    category: "Programming",
    description: "Core Python programming fundamentals",
    usedIn: { assessments: 12, students: 145 },
    status: "active",
    createdDate: "Jan 10, 2024",
  },
  {
    id: "2",
    name: "DSA",
    category: "Core CS",
    description: "Data Structures and Algorithms",
    usedIn: { assessments: 8, students: 132 },
    status: "active",
    createdDate: "Jan 10, 2024",
  },
  {
    id: "3",
    name: "Java",
    category: "Programming",
    description: "Java programming and OOP concepts",
    usedIn: { assessments: 6, students: 98 },
    status: "active",
    createdDate: "Feb 5, 2024",
  },
  {
    id: "4",
    name: "DBMS",
    category: "Core CS",
    description: "Database Management Systems",
    usedIn: { assessments: 5, students: 87 },
    status: "active",
    createdDate: "Feb 15, 2024",
  },
  {
    id: "5",
    name: "React",
    category: "Web Development",
    description: "React.js frontend development",
    usedIn: { assessments: 4, students: 56 },
    status: "active",
    createdDate: "Mar 1, 2024",
  },
];

const columns: TableColumn<Skill>[] = [
  { key: "name", label: "Skill", width: "18%" },
  {
    key: "category",
    label: "Category",
    width: "16%",
    render: (value) => (
      <span className="inline-flex px-2.5 py-1 rounded-lg bg-[#f0ebff] text-[#7358c9] text-xs font-semibold">
        {value}
      </span>
    ),
  },
  {
    key: "description",
    label: "Description",
    width: "25%",
    render: (value) => <span className="text-xs text-[#8290a7]">{value}</span>,
  },
  {
    key: "usedIn",
    label: "Assessments",
    width: "12%",
    render: (value: { assessments: number }) => (
      <span className="font-semibold text-[#1c2a47]">{value.assessments}</span>
    ),
  },
  {
    key: "usedIn",
    label: "Students",
    width: "12%",
    render: (value: { students: number }) => (
      <span className="font-semibold text-[#16a889]">{value.students}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    width: "12%",
    render: (value) => <StatusBadge status={value} />,
  },
];

export default function AdminSkills() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const filteredSkills = mockSkills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || skill.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || skill.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(mockSkills.map((s) => s.category)));

  return (
    <AdminLayout currentPage="/admin/skills">
      <AdminPageHeader
        title="Skill Management"
        subtitle="Manage the skill taxonomy, categories, usage tracking and activation status."
        breadcrumbs={["Admin", "Skills"]}
        actions={
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:opacity-90">
            <Plus className="h-4 w-4" />
            Add Skill
          </button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Total Skills
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">{mockSkills.length}</div>
        </div>
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Active
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#16a889]">
            {mockSkills.filter((s) => s.status === "active").length}
          </div>
        </div>
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Categories
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">{categories.length}</div>
        </div>
        <div className="premium-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Students Assessed
          </div>
          <div className="mt-2 text-2xl font-extrabold text-primary">
            {mockSkills.reduce((sum, s) => sum + s.usedIn.students, 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full grid grid-cols-[auto_1fr] gap-3 items-center rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 shadow-sm outline-none text-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs font-semibold text-[#3d4959] outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs font-semibold text-[#3d4959] outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filteredSkills}
        onRowClick={(skill) => setSelectedSkill(skill)}
        actions={(skill) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSkill(skill)}
              className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="Edit">
              <Edit2 className="h-4 w-4" />
            </button>
            {skill.status !== "archived" && (
              <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="Archive">
                <Archive className="h-4 w-4" />
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
        <span>Showing 1-5 of {filteredSkills.length}</span>
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
      {selectedSkill && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl border-l border-[#e2e8f2]">
          <div className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#1c2a47]">{selectedSkill.name}</h3>
                <span className="mt-2 inline-flex px-2.5 py-1 rounded-lg bg-[#f0ebff] text-[#7358c9] text-xs font-semibold">
                  {selectedSkill.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 border-t border-[#e2e8f2] pt-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Description
                </div>
                <p className="mt-2 text-xs text-[#8290a7]">{selectedSkill.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#e2e8f2] p-3">
                  <div className="flex items-center gap-2 text-xs text-[#8290a7]">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Assessments</span>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">
                    {selectedSkill.usedIn.assessments}
                  </div>
                </div>

                <div className="rounded-xl border border-[#e2e8f2] p-3">
                  <div className="flex items-center gap-2 text-xs text-[#8290a7]">
                    <Users className="h-3.5 w-3.5" />
                    <span>Students</span>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#16a889]">
                    {selectedSkill.usedIn.students}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Status
                </div>
                <div className="mt-2">
                  <StatusBadge status={selectedSkill.status === "archived" ? "inactive" : selectedSkill.status} />
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Created
                </div>
                <p className="mt-2 text-xs font-semibold text-[#3d4959]">{selectedSkill.createdDate}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <button className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90">
                  Edit
                </button>
                <button className="flex-1 rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#52617d] transition hover:bg-[#f8fafc]">
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
