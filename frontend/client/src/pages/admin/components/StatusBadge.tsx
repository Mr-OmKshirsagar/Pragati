interface StatusBadgeProps {
  status: "healthy" | "degraded" | "down" | "active" | "inactive" | "pending" | "verified" | "rejected" | "archived" | string;
  label?: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  healthy: {
    bg: "bg-[#e5f7f2]",
    text: "text-[#13876f]",
    dot: "bg-[#16a889]",
    label: "Healthy",
  },
  degraded: {
    bg: "bg-[#fff2df]",
    text: "text-[#bb741e]",
    dot: "bg-[#e39a44]",
    label: "Degraded",
  },
  down: {
    bg: "bg-[#ffe5e5]",
    text: "text-[#c24152]",
    dot: "bg-[#e74c3c]",
    label: "Down",
  },
  active: {
    bg: "bg-[#e5f7f2]",
    text: "text-[#13876f]",
    dot: "bg-[#16a889]",
    label: "Active",
  },
  inactive: {
    bg: "bg-[#f0f2f6]",
    text: "text-[#7d8ba3]",
    dot: "bg-[#b4bcd1]",
    label: "Inactive",
  },
  pending: {
    bg: "bg-primary/10",
    text: "text-primary",
    dot: "bg-primary/60",
    label: "Pending",
  },
  verified: {
    bg: "bg-[#e5f7f2]",
    text: "text-[#13876f]",
    dot: "bg-[#16a889]",
    label: "Verified",
  },
  rejected: {
    bg: "bg-[#ffe5e5]",
    text: "text-[#c24152]",
    dot: "bg-[#e74c3c]",
    label: "Rejected",
  },
  archived: {
    bg: "bg-[#f0f2f6]",
    text: "text-[#7d8ba3]",
    dot: "bg-[#b4bcd1]",
    label: "Archived",
  },
};

const fallbackConfig = {
  bg: "bg-[#f0f2f6]",
  text: "text-[#7d8ba3]",
  dot: "bg-[#b4bcd1]",
  label: "Unknown",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status] ?? fallbackConfig;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {label || config.label}
    </span>
  );
}
