import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { AdminTable, TableColumn } from "./components/AdminTable";
import { Search, Filter, Download, Eye, MoreVertical } from "lucide-react";
import { useState } from "react";

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  resource: string;
  resourceId: string;
  result: "success" | "failure" | "blocked";
  ipAddress: string;
}

const mockLogs: AuditLog[] = [
  {
    id: "1",
    timestamp: "Sep 17, 2024 2:45 PM",
    actor: "Dr. Priya Sharma",
    role: "HOD",
    action: "Verified internship",
    resource: "Internship",
    resourceId: "INT-2024-001",
    result: "success",
    ipAddress: "192.168.1.10",
  },
  {
    id: "2",
    timestamp: "Sep 17, 2024 2:30 PM",
    actor: "Admin System",
    role: "ADMIN",
    action: "Published recruitment drive",
    resource: "Recruitment",
    resourceId: "REC-2024-005",
    result: "success",
    ipAddress: "10.0.0.1",
  },
  {
    id: "3",
    timestamp: "Sep 17, 2024 1:15 PM",
    actor: "Dr. Vikram Singh",
    role: "Faculty",
    action: "Created intervention",
    resource: "Intervention",
    resourceId: "INT-2024-456",
    result: "success",
    ipAddress: "192.168.1.15",
  },
  {
    id: "4",
    timestamp: "Sep 17, 2024 12:00 PM",
    actor: "Rahul Patel",
    role: "ADMIN",
    action: "Modified eligibility rule",
    resource: "Placement",
    resourceId: "RULE-2024-10",
    result: "success",
    ipAddress: "192.168.1.20",
  },
  {
    id: "5",
    timestamp: "Sep 17, 2024 11:45 AM",
    actor: "Unknown User",
    role: "UNKNOWN",
    action: "Failed login attempt",
    resource: "Authentication",
    resourceId: "AUTH-FAIL",
    result: "blocked",
    ipAddress: "203.0.113.42",
  },
];

const columns: TableColumn<AuditLog>[] = [
  {
    key: "timestamp",
    label: "Timestamp",
    width: "16%",
    render: (value) => <span className="text-xs">{value}</span>,
  },
  { key: "actor", label: "Actor", width: "14%" },
  {
    key: "role",
    label: "Role",
    width: "11%",
    render: (value) => (
      <span className="inline-flex px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
        {value}
      </span>
    ),
  },
  { key: "action", label: "Action", width: "15%" },
  { key: "resource", label: "Resource", width: "12%" },
  {
    key: "result",
    label: "Result",
    width: "11%",
    render: (value) => {
      const colorMap: Record<string, string> = {
        success: "bg-[#e5f7f2] text-[#13876f]",
        failure: "bg-[#ffe5e5] text-[#c24152]",
        blocked: "bg-[#fff2df] text-[#bb741e]",
      };
      return (
        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${colorMap[value]}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      );
    },
  },
  {
    key: "ipAddress",
    label: "IP Address",
    width: "13%",
    render: (value) => <span className="text-xs font-mono text-[#8290a7]">{value}</span>,
  },
];

export default function AdminAuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter);
    const matchesResult = resultFilter === "all" || log.result === resultFilter;

    return matchesSearch && matchesAction && matchesResult;
  });

  return (
    <AdminLayout currentPage="/admin/audit-logs">
      <AdminPageHeader
        title="Audit Logs"
        subtitle="Track all institutional changes, verifications and administrative actions for compliance."
        breadcrumbs={["Admin", "Audit Logs"]}
        actions={
          <button className="flex items-center gap-2 rounded-xl border border-[#dce3ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#52617d] shadow-sm transition hover:border-[#bec9df]">
            <Download className="h-4 w-4" />
            Export
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by actor, action or resource ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 shadow-sm outline-none text-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs font-semibold text-[#3d4959] outline-none"
          >
            <option value="all">All Results</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filteredLogs}
        onRowClick={(log) => setSelectedLog(log)}
        actions={(log) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedLog(log)}
              className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]" title="More">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-xs text-[#8290a7]">
        <span>Showing 1-5 of {filteredLogs.length} events</span>
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
      {selectedLog && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl border-l border-[#e2e8f2]">
          <div className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1c2a47]">{selectedLog.action}</h3>
                <p className="mt-1 text-xs text-[#8290a7]">{selectedLog.timestamp}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 border-t border-[#e2e8f2] pt-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Actor
                </div>
                <div className="mt-2 grid gap-2">
                  <p className="font-semibold text-[#1c2a47]">{selectedLog.actor}</p>
                  <span className="inline-flex px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold w-fit">
                    {selectedLog.role}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Resource
                </div>
                <div className="mt-2">
                  <p className="font-semibold text-[#1c2a47]">{selectedLog.resource}</p>
                  <p className="mt-1 text-xs font-mono text-[#8290a7]">{selectedLog.resourceId}</p>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Result
                </div>
                <div className="mt-2">
                  {selectedLog.result === "success" && (
                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-[#e5f7f2] text-[#13876f] text-xs font-semibold">
                      Success
                    </span>
                  )}
                  {selectedLog.result === "blocked" && (
                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-[#fff2df] text-[#bb741e] text-xs font-semibold">
                      Blocked
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  IP Address
                </div>
                <p className="mt-2 text-xs font-mono text-[#1c2a47]">{selectedLog.ipAddress}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
