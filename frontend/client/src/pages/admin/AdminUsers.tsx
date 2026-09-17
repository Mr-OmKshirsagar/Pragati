import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { AdminTable, TableColumn } from "./components/AdminTable";
import { StatusBadge } from "./components/StatusBadge";
import { Users, Search, Filter, Plus, MoreVertical, Eye, Edit2, Power, Lock } from "lucide-react";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive";
  lastActive: string;
  created: string;
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Dr. Priya Sharma",
    email: "priya.sharma@northstar.edu",
    role: "HOD",
    department: "Computer Science",
    status: "active",
    lastActive: "2 hours ago",
    created: "Jan 15, 2024",
  },
  {
    id: "2",
    name: "Vikram Singh",
    email: "vikram.singh@northstar.edu",
    role: "Faculty",
    department: "Computer Science",
    status: "active",
    lastActive: "30 mins ago",
    created: "Feb 1, 2024",
  },
  {
    id: "3",
    name: "Anjali Verma",
    email: "anjali.verma@northstar.edu",
    role: "Faculty",
    department: "IT",
    status: "active",
    lastActive: "1 day ago",
    created: "Mar 10, 2024",
  },
  {
    id: "4",
    name: "Rahul Patel",
    email: "rahul.patel@northstar.edu",
    role: "TNP Coordinator",
    department: "Placement",
    status: "active",
    lastActive: "4 hours ago",
    created: "Jan 5, 2024",
  },
  {
    id: "5",
    name: "Meera Gupta",
    email: "meera.gupta@northstar.edu",
    role: "Faculty",
    department: "Electronics",
    status: "inactive",
    lastActive: "7 days ago",
    created: "Dec 20, 2023",
  },
];

const columns: TableColumn<User>[] = [
  {
    key: "name",
    label: "Name",
    width: "25%",
  },
  {
    key: "email",
    label: "Email",
    width: "30%",
    render: (value) => <span className="text-primary text-xs">{value}</span>,
  },
  {
    key: "role",
    label: "Role",
    width: "15%",
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
    key: "status",
    label: "Status",
    width: "10%",
    render: (value) => <StatusBadge status={value} />,
  },
  {
    key: "lastActive",
    label: "Last Active",
    width: "15%",
    render: (value) => <span className="text-xs text-[#8290a7]">{value}</span>,
  },
];

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesDepartment =
      departmentFilter === "all" || user.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  const handleRowAction = (action: string, user: User) => {
    console.log(`${action} for user:`, user);
  };

  return (
    <AdminLayout currentPage="/admin/users">
      <AdminPageHeader
        title="User Management"
        subtitle="Manage institution users, roles, access levels and security credentials."
        breadcrumbs={["Admin", "Users"]}
        actions={
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:opacity-90">
            <Plus className="h-4 w-4" />
            Add User
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
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-[#3d4959] placeholder-[#8994a8] outline-none"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs font-semibold text-[#3d4959] outline-none"
            >
              <option value="all">All Roles</option>
              <option value="Faculty">Faculty</option>
              <option value="HOD">HOD</option>
              <option value="TNP Coordinator">TNP Coordinator</option>
              <option value="Admin">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs font-semibold text-[#3d4959] outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-right text-[#8290a7]">
          {filteredUsers.length} users
        </div>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filteredUsers}
        actions={(user) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRowAction("view", user)}
              className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              title="View user"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleRowAction("edit", user)}
              className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              title="Edit user"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleRowAction("toggle", user)}
              className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              title={user.status === "active" ? "Deactivate" : "Activate"}
            >
              <Power className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleRowAction("more", user)}
              className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              title="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-xs text-[#8290a7]">
        <span>Showing 1-5 of {filteredUsers.length}</span>
        <div className="flex gap-2">
          <button className="rounded-lg border border-[#dfe5ef] px-3 py-2 hover:bg-[#f8fafc]">
            Previous
          </button>
          <button className="rounded-lg border border-[#dfe5ef] px-3 py-2 hover:bg-[#f8fafc]">
            Next
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
