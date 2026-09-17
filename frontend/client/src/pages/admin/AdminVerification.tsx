import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { AdminTable, TableColumn } from "./components/AdminTable";
import { StatusBadge } from "./components/StatusBadge";
import { Shield, Plus, Edit2, Eye, MoreVertical, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

interface VerificationPolicy {
  id: string;
  name: string;
  resourceType: string;
  requiredEvidence: string[];
  requiredReviewers: number;
  status: "active" | "inactive";
  appliedTo: number;
  lastUpdated: string;
}

const mockPolicies: VerificationPolicy[] = [
  {
    id: "1",
    name: "Internship Verification",
    resourceType: "Internship Certificate",
    requiredEvidence: ["Offer Letter", "Check-in", "Report", "Completion Certificate"],
    requiredReviewers: 1,
    status: "active",
    appliedTo: 156,
    lastUpdated: "Dec 15, 2024",
  },
  {
    id: "2",
    name: "Project Completion",
    resourceType: "Project Documentation",
    requiredEvidence: ["Project Proposal", "Implementation", "Report"],
    requiredReviewers: 1,
    status: "active",
    appliedTo: 89,
    lastUpdated: "Nov 20, 2024",
  },
  {
    id: "3",
    name: "Achievement Verification",
    resourceType: "Achievement Certificate",
    requiredEvidence: ["Certificate", "Issuer Confirmation"],
    requiredReviewers: 1,
    status: "active",
    appliedTo: 234,
    lastUpdated: "Dec 10, 2024",
  },
];

const verificationStates = [
  { name: "Self Reported", color: "bg-primary/10", textColor: "text-primary" },
  { name: "Pending", color: "bg-[#fff2df]", textColor: "text-[#bb741e]" },
  { name: "Institution Verified", color: "bg-[#e5f7f2]", textColor: "text-[#13876f]" },
  { name: "Issuer Verified", color: "bg-[#e5f7f2]", textColor: "text-[#13876f]" },
  { name: "Rejected", color: "bg-[#ffe5e5]", textColor: "text-[#c24152]" },
];

const columns: TableColumn<VerificationPolicy>[] = [
  { key: "name", label: "Policy", width: "20%" },
  { key: "resourceType", label: "Resource Type", width: "18%" },
  {
    key: "requiredReviewers",
    label: "Reviewers Required",
    width: "15%",
    render: (value) => <span className="font-semibold">{value}</span>,
  },
  {
    key: "status",
    label: "Status",
    width: "12%",
    render: (value) => <StatusBadge status={value} />,
  },
  {
    key: "appliedTo",
    label: "Applied To",
    width: "12%",
    render: (value) => <span className="font-semibold text-primary">{value}</span>,
  },
  {
    key: "lastUpdated",
    label: "Last Updated",
    width: "15%",
    render: (value) => <span className="text-xs text-[#8290a7]">{value}</span>,
  },
];

export default function AdminVerification() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState<VerificationPolicy | null>(null);

  const filteredPolicies = mockPolicies.filter((policy) =>
    policy.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout currentPage="/admin/verification">
      <AdminPageHeader
        title="Verification Policy"
        subtitle="Configure verification workflows, evidence requirements and approval chains."
        breadcrumbs={["Admin", "Verification"]}
        actions={
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:opacity-90">
            <Plus className="h-4 w-4" />
            New Policy
          </button>
        }
      />

      {/* Verification States Overview */}
      <div className="mb-8">
        <h3 className="mb-4 text-sm font-bold text-[#1c2a47]">Verification States</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {verificationStates.map((state) => (
            <div
              key={state.name}
              className={`rounded-xl p-3 text-center ${state.color}`}
            >
              <div className={`text-xs font-bold ${state.textColor}`}>{state.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Policies */}
      <div className="mb-6">
        <div className="mb-4 flex-1">
          <input
            type="text"
            placeholder="Search policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 shadow-sm outline-none text-sm"
          />
        </div>

        <AdminTable
          columns={columns}
          data={filteredPolicies}
          onRowClick={(policy) => setSelectedPolicy(policy)}
          actions={(policy) => (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPolicy(policy)}
                className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
                title="View"
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
      </div>

      {/* Detail Drawer */}
      {selectedPolicy && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl border-l border-[#e2e8f2]">
          <div className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#1c2a47]">{selectedPolicy.name}</h3>
                <p className="mt-1 text-xs text-[#8290a7]">{selectedPolicy.resourceType}</p>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="rounded-lg p-2 text-[#8290a7] hover:bg-[#f0f2f6]"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 border-t border-[#e2e8f2] pt-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Required Evidence
                </div>
                <div className="mt-3 grid gap-2">
                  {selectedPolicy.requiredEvidence.map((evidence) => (
                    <div
                      key={evidence}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[#f8fafc]"
                    >
                      <CheckCircle className="h-4 w-4 text-[#16a889]" />
                      <span className="text-xs font-medium text-[#3d4959]">{evidence}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#e2e8f2] pt-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                  Configuration
                </div>
                <div className="mt-3 grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">Reviewers Required</span>
                    <span className="font-semibold text-[#1c2a47]">{selectedPolicy.requiredReviewers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">Applied To</span>
                    <span className="font-semibold text-primary">{selectedPolicy.appliedTo} records</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#8290a7]">Status</span>
                    <StatusBadge status={selectedPolicy.status} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90">
                  Edit Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
