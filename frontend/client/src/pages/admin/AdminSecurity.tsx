import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { StatusBadge } from "./components/StatusBadge";
import { Lock, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";

const securityPosture = [
  { component: "Authentication", status: "healthy", description: "Multi-factor auth enabled" },
  { component: "RBAC", status: "healthy", description: "Role-based access control active" },
  { component: "Rate Limiting", status: "healthy", description: "API rate limits enforced" },
  { component: "Audit Logging", status: "healthy", description: "All actions logged" },
  { component: "Tenant Isolation", status: "healthy", description: "Data properly isolated" },
  { component: "Document Integrity", status: "healthy", description: "Hash verification enabled" },
];

const recentEvents = [
  { timestamp: "Sep 17 2:30 PM", event: "Repeated failed login", severity: "high", ip: "203.0.113.42" },
  { timestamp: "Sep 17 1:45 PM", event: "Rate limit triggered", severity: "medium", ip: "192.168.1.100" },
  { timestamp: "Sep 16 4:20 PM", event: "Unauthorized access attempt", severity: "high", ip: "198.51.100.5" },
];

export default function AdminSecurity() {
  return (
    <AdminLayout currentPage="/admin/security">
      <AdminPageHeader
        title="Security Center"
        subtitle="Monitor institutional security posture, recent events and compliance status."
        breadcrumbs={["Admin", "Security"]}
      />

      {/* Security Posture */}
      <div className="mb-8">
        <h3 className="mb-4 text-sm font-bold text-[#1c2a47]">Security Posture</h3>
        <div className="grid gap-3">
          {securityPosture.map((item) => (
            <div
              key={item.component}
              className="flex items-center justify-between p-4 border border-[#e2e8f2] rounded-xl hover:bg-[#f8fafc]"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-[#16a889]" />
                <div>
                  <div className="font-semibold text-[#1c2a47]">{item.component}</div>
                  <div className="mt-0.5 text-xs text-[#8290a7]">{item.description}</div>
                </div>
              </div>
              <StatusBadge status={item.status as any} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="mb-8">
        <h3 className="mb-4 text-sm font-bold text-[#1c2a47]">Recent Security Events</h3>
        <div className="grid gap-3">
          {recentEvents.map((event, idx) => (
            <div key={idx} className="p-4 border border-[#e2e8f2] rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`h-5 w-5 mt-0.5 ${
                      event.severity === "high" ? "text-[#e74c3c]" : "text-[#e39a44]"
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-[#1c2a47]">{event.event}</div>
                    <div className="mt-2 grid gap-1 text-xs text-[#8290a7]">
                      <div>IP: {event.ip}</div>
                      <div>{event.timestamp}</div>
                    </div>
                  </div>
                </div>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.08em] ${
                    event.severity === "high"
                      ? "bg-[#ffe5e5] text-[#c24152]"
                      : "bg-[#fff2df] text-[#bb741e]"
                  }`}
                >
                  {event.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Settings */}
      <div className="premium-card p-6">
        <h3 className="text-lg font-bold text-[#1c2a47] mb-6">Security Configuration</h3>
        <div className="grid gap-4">
          <div className="flex items-center justify-between p-3 border border-[#e2e8f2] rounded-lg">
            <div>
              <div className="font-semibold text-[#1c2a47]">Session Timeout</div>
              <p className="mt-1 text-xs text-[#8290a7]">Auto-logout after inactivity</p>
            </div>
            <input type="text" defaultValue="30 min" className="w-20 rounded-lg border border-[#dfe5ef] px-2 py-1.5 text-xs text-right" />
          </div>

          <div className="flex items-center justify-between p-3 border border-[#e2e8f2] rounded-lg">
            <div>
              <div className="font-semibold text-[#1c2a47]">Password Expiry</div>
              <p className="mt-1 text-xs text-[#8290a7]">Force password reset</p>
            </div>
            <input type="text" defaultValue="90 days" className="w-20 rounded-lg border border-[#dfe5ef] px-2 py-1.5 text-xs text-right" />
          </div>

          <div className="flex items-center justify-between p-3 border border-[#e2e8f2] rounded-lg">
            <div>
              <div className="font-semibold text-[#1c2a47]">Rate Limit</div>
              <p className="mt-1 text-xs text-[#8290a7]">Requests per minute</p>
            </div>
            <input type="text" defaultValue="100" className="w-20 rounded-lg border border-[#dfe5ef] px-2 py-1.5 text-xs text-right" />
          </div>
        </div>

        <button className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90">
          Save Security Settings
        </button>
      </div>
    </AdminLayout>
  );
}
