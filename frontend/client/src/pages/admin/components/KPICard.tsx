import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KPICardProps {
  label: string;
  value: number;
  delta?: number;
  deltaLabel?: string;
  tone?: "indigo" | "violet" | "emerald" | "amber";
  icon?: React.ReactNode;
  animate?: boolean;
  delay?: number;
}

const toneClasses = {
  indigo: "bg-primary/10 text-primary",
  violet: "bg-[#f0ebff] text-[#7358c9]",
  emerald: "bg-[#e5f7f2] text-[#13876f]",
  amber: "bg-[#fff2df] text-[#bb741e]",
};

export function KPICard({
  label,
  value,
  delta,
  deltaLabel,
  tone = "indigo",
  icon,
  animate = true,
  delay = 0,
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) return;

    const timer = setTimeout(() => {
      let current = 0;
      const increment = value / 30;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, 20);
    }, delay * 100);

    return () => clearTimeout(timer);
  }, [value, animate, delay]);

  const isPositive = delta ? delta > 0 : false;
  const isDelta = delta !== undefined;

  return (
    <article
      className="premium-card motion-enter p-5 sm:p-6"
      style={{
        animationDelay: `${delay * 100}ms`,
      }}
    >
      <div className="mb-4 flex items-start justify-between">
        {icon && (
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${toneClasses[tone]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-[#8490a5]">
        {label}
      </div>

      <div className="mt-3 flex items-end gap-3">
        <span className="kpi-value text-[32px] font-extrabold tracking-[-0.04em] text-[#1b2946]">
          {displayValue.toLocaleString()}
        </span>
        {isDelta && (
          <span
            className={`mb-1 flex items-center gap-1 text-xs font-bold ${
              isPositive ? "text-[#16a889]" : "text-[#c57935]"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta)}% {deltaLabel || ""}
          </span>
        )}
      </div>
    </article>
  );
}
