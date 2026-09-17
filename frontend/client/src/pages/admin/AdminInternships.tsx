import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { StatusBadge } from "./components/StatusBadge";
import { Plus, Edit2, Eye, ArrowRight } from "lucide-react";
import { useState } from "react";

interface InternshipStatus {
  state: string;
  label: string;
  description: string;
  order: number;
}

const internshipStateMachine: InternshipStatus[] = [
  { state: "draft", label: "Draft", description: "Initial registration", order: 1 },
  { state: "registered", label: "Registered", description: "Enrolled in internship", order: 2 },
  { state: "in_progress", label: "In Progress", description: "Active internship period", order: 3 },
  { state: "evidence_pending", label: "Evidence Pending", description: "Awaiting documentation", order: 4 },
  { state: "faculty_review", label: "Faculty Review", description: "Under verification", order: 5 },
  { state: "verified", label: "Verified", description: "Approved by faculty", order: 6 },
  { state: "completed", label: "Completed", description: "Internship concluded", order: 7 },
];

const requiredEvidence = [
  { name: "Offer Letter", required: true, description: "Signed internship offer from company" },
  { name: "Check-in Report", required: true, description: "Initial check-in on first day" },
  { name: "Weekly Reports", required: false, description: "Optional progress reports" },
  { name: "Final Report", required: true, description: "Comprehensive internship report" },
  { name: "Completion Certificate", required: true, description: "Issued by company" },
  { name: "Testimonial", required: false, description: "Optional company reference" },
];

export default function AdminInternships() {
  const [expandedSection, setExpandedSection] = useState<string | null>("workflow");

  return (
    <AdminLayout currentPage="/admin/internships">
      <AdminPageHeader
        title="Internship Configuration"
        subtitle="Define internship statuses, evidence requirements, and faculty verification workflow."
        breadcrumbs={["Admin", "Internships"]}
        actions={
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:opacity-90">
            <Edit2 className="h-4 w-4" />
            Edit Configuration
          </button>
        }
      />

      {/* State Machine Workflow */}
      <div className="mb-8">
        <div className="premium-card p-6">
          <h3 className="text-lg font-bold text-[#1c2a47] mb-6">Internship Status Workflow</h3>

          {/* State flow visualization */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-2 min-w-max">
              {internshipStateMachine.map((status, idx) => (
                <div key={status.state} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className="rounded-xl bg-primary/10 px-3 py-2 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
                        {status.order}
                      </div>
                      <div className="mt-1 text-xs font-bold text-[#1c2a47]">{status.label}</div>
                      <div className="mt-0.5 text-[10px] text-[#8290a7]">{status.description}</div>
                    </div>
                  </div>
                  {idx < internshipStateMachine.length - 1 && (
                    <div className="flex items-center gap-1 pb-6">
                      <ArrowRight className="h-4 w-4 text-[#d0d8e6]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-xs text-[#8290a7] border-t border-[#e2e8f2] pt-4">
            <p>States are strictly ordered. Internships progress through the workflow in sequence. No backward transitions allowed.</p>
          </div>
        </div>
      </div>

      {/* Required Evidence */}
      <div className="mb-8">
        <div className="premium-card p-6">
          <h3 className="text-lg font-bold text-[#1c2a47] mb-6">Required Evidence</h3>

          <div className="grid gap-3">
            {requiredEvidence.map((evidence) => (
              <div
                key={evidence.name}
                className="flex items-start gap-4 p-4 border border-[#e2e8f2] rounded-xl hover:bg-[#f8fafc] transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1c2a47]">{evidence.name}</span>
                    {evidence.required && (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-[#ffe5e5] text-[#c24152] text-[10px] font-bold uppercase tracking-[0.08em]">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#8290a7]">{evidence.description}</p>
                </div>
                <button className="rounded-lg p-2 text-[#8290a7] hover:bg-primary/10" title="Edit">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button className="mt-4 w-full rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#52617d] transition hover:bg-[#f8fafc]">
            <Plus className="inline h-4 w-4 mr-2" />
            Add Evidence Type
          </button>
        </div>
      </div>

      {/* Verification Workflow */}
      <div className="mb-8">
        <div className="premium-card p-6">
          <h3 className="text-lg font-bold text-[#1c2a47] mb-6">Verification Workflow</h3>

          <div className="grid gap-4">
            <div className="p-4 border border-[#e2e8f2] rounded-xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3] mb-2">
                Faculty Verification
              </div>
              <p className="text-xs text-[#8290a7] mb-3">
                Faculty members assigned to a student can review and verify internship evidence.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-[#d0d8e6] text-primary accent-primary"
                />
                <span className="text-xs font-medium text-[#3d4959]">
                  Allow multiple faculty reviews before approval
                </span>
              </div>
            </div>

            <div className="p-4 border border-[#e2e8f2] rounded-xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3] mb-2">
                Check-in Frequency
              </div>
              <p className="text-xs text-[#8290a7] mb-3">
                How often students must check in during their internship.
              </p>
              <select className="w-full rounded-lg border border-[#dfe5ef] bg-white px-3 py-2 text-xs outline-none">
                <option>Daily</option>
                <option>Weekly (Recommended)</option>
                <option>Bi-weekly</option>
                <option>Monthly</option>
              </select>
            </div>

            <div className="p-4 border border-[#e2e8f2] rounded-xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3] mb-2">
                Completion Criteria
              </div>
              <p className="text-xs text-[#8290a7] mb-3">
                Minimum requirements for internship completion.
              </p>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-[#d0d8e6] text-primary accent-primary"
                  />
                  <span className="text-xs font-medium text-[#3d4959]">
                    All required evidence submitted
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-[#d0d8e6] text-primary accent-primary"
                  />
                  <span className="text-xs font-medium text-[#3d4959]">
                    Faculty verification completed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-[#d0d8e6] text-primary accent-primary"
                  />
                  <span className="text-xs font-medium text-[#3d4959]">
                    Minimum internship duration met
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90">
              Save Configuration
            </button>
            <button className="flex-1 rounded-xl border border-[#dfe5ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#52617d] transition hover:bg-[#f8fafc]">
              Reset to Default
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
