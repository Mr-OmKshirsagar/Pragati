import AdminLayout from "./AdminLayout";
import { AdminPageHeader } from "./components/AdminPageHeader";
import { StatusBadge } from "./components/StatusBadge";
import { Activity, TrendingUp, AlertCircle } from "lucide-react";

const systemMetrics = [
  { name: "API", status: "healthy", latency: "120ms", uptime: "99.98%" },
  { name: "MongoDB", status: "healthy", latency: "42ms", uptime: "99.99%" },
  { name: "Redis", status: "healthy", latency: "8ms", uptime: "100%" },
  { name: "Storage", status: "healthy", latency: "180ms", uptime: "99.95%" },
  { name: "AI Provider", status: "healthy", latency: "550ms", uptime: "99.90%" },
];

const resourceUsage = [
  { resource: "CPU", usage: 34, threshold: 80 },
  { resource: "Memory", usage: 62, threshold: 85 },
  { resource: "Disk", usage: 48, threshold: 90 },
  { resource: "Network", usage: 24, threshold: 75 },
];

export default function AdminSystemHealth() {
  return (
    <AdminLayout currentPage="/admin/system-health">
      <AdminPageHeader
        title="System Health"
        subtitle="Monitor infrastructure status, latency and resource utilization."
        breadcrumbs={["Admin", "System Health"]}
      />

      {/* System Status */}
      <div className="mb-8">
        <h3 className="mb-4 text-sm font-bold text-[#1c2a47]">Infrastructure Status</h3>
        <div className="grid gap-3">
          {systemMetrics.map((metric) => (
            <div
              key={metric.name}
              className="flex items-center justify-between p-4 border border-[#e2e8f2] rounded-xl hover:bg-[#f8fafc]"
            >
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold text-[#1c2a47]">{metric.name}</div>
                  <div className="mt-0.5 text-xs text-[#8290a7]">Latency: {metric.latency}</div>
                </div>
              </div>
              <div className="text-right">
                <StatusBadge status={metric.status as any} />
                <div className="mt-2 text-xs font-semibold text-[#16a889]">Uptime: {metric.uptime}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Usage */}
      <div className="mb-8">
        <h3 className="mb-4 text-sm font-bold text-[#1c2a47]">Resource Utilization</h3>
        <div className="grid gap-4">
          {resourceUsage.map((item) => {
            const isWarning = item.usage > item.threshold * 0.8;
            return (
              <div key={item.resource} className="premium-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-[#1c2a47]">{item.resource}</div>
                  <div className={`text-sm font-bold ${isWarning ? "text-[#e39a44]" : "text-[#16a889]"}`}>
                    {item.usage}%
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[#e2e8f2] overflow-hidden">
                  <div
                    className={`h-full transition-all ${isWarning ? "bg-[#e39a44]" : "bg-[#16a889]"}`}
                    style={{ width: `${item.usage}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-[#8290a7]">
                  Threshold: {item.threshold}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="premium-card p-4 text-center">
          <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Requests/sec
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">2,340</div>
        </div>

        <div className="premium-card p-4 text-center">
          <Activity className="h-5 w-5 text-[#16a889] mx-auto mb-2" />
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Active Sessions
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">487</div>
        </div>

        <div className="premium-card p-4 text-center">
          <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Avg Response
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">245ms</div>
        </div>

        <div className="premium-card p-4 text-center">
          <AlertCircle className="h-5 w-5 text-[#e39a44] mx-auto mb-2" />
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
            Alerts
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#1c2a47]">2</div>
        </div>
      </div>
    </AdminLayout>
  );
}
