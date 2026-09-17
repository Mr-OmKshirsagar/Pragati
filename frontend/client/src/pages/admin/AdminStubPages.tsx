// Stub implementations for remaining admin pages
import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { Plus } from "lucide-react";

export function AdminPlacement() {
  return (
    <AdminLayout currentPage="/admin/placement">
      <AdminPageHeader
        title="Placement Configuration"
        subtitle="Configure eligibility criteria, rule builders and placement workflows."
        breadcrumbs={["Admin", "Placement"]}
        actions={
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:opacity-90">
            <Plus className="h-4 w-4" />
            New Rule
          </button>
        }
      />
      <div className="premium-card p-8 text-center">
        <p className="text-sm text-[#8290a7]">Configure institutional placement eligibility rules and criteria.</p>
      </div>
    </AdminLayout>
  );
}

export function AdminRecruitment() {
  return (
    <AdminLayout currentPage="/admin/recruitment">
      <AdminPageHeader
        title="Recruitment Settings"
        subtitle="Manage recruitment categories, application workflows and document requirements."
        breadcrumbs={["Admin", "Recruitment"]}
        actions={
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:opacity-90">
            <Plus className="h-4 w-4" />
            Add Configuration
          </button>
        }
      />
      <div className="premium-card p-8 text-center">
        <p className="text-sm text-[#8290a7]">Configure recruitment drives, deadlines and notification workflows.</p>
      </div>
    </AdminLayout>
  );
}

export function AdminNotifications() {
  return (
    <AdminLayout currentPage="/admin/notifications">
      <AdminPageHeader
        title="Notification Management"
        subtitle="Manage notification templates, channels and delivery preferences."
        breadcrumbs={["Admin", "Notifications"]}
        actions={
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:opacity-90">
            <Plus className="h-4 w-4" />
            New Template
          </button>
        }
      />
      <div className="premium-card p-8 text-center">
        <p className="text-sm text-[#8290a7]">Create and manage institutional notification templates.</p>
      </div>
    </AdminLayout>
  );
}

export function AdminSettings() {
  return (
    <AdminLayout currentPage="/admin/settings">
      <AdminPageHeader
        title="System Settings"
        subtitle="Configure institution profile, academic calendar, security and feature flags."
        breadcrumbs={["Admin", "Settings"]}
      />
      <div className="grid gap-6">
        <div className="premium-card p-6">
          <h3 className="text-lg font-bold text-[#1c2a47] mb-4">Institution Settings</h3>
          <div className="grid gap-4">
            <input type="text" placeholder="Institution Name" className="w-full rounded-lg border border-[#dfe5ef] px-4 py-2.5" />
            <input type="email" placeholder="Contact Email" className="w-full rounded-lg border border-[#dfe5ef] px-4 py-2.5" />
            <button className="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90">
              Save Settings
            </button>
          </div>
        </div>

        <div className="premium-card p-6">
          <h3 className="text-lg font-bold text-[#1c2a47] mb-4">Feature Flags</h3>
          <div className="grid gap-3">
            {[
              { name: "AI Explanations", enabled: true },
              { name: "Career Passport", enabled: true },
              { name: "Issuer Verification", enabled: false },
              { name: "Recruitment Portal", enabled: true },
            ].map((flag) => (
              <div key={flag.name} className="flex items-center justify-between p-3 border border-[#e2e8f2] rounded-lg">
                <span className="font-medium text-[#1c2a47]">{flag.name}</span>
                <input type="checkbox" defaultChecked={flag.enabled} className="rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
