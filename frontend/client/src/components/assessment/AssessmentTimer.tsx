/**
 * AssessmentTimer Component
 * Displays remaining time with server-authoritative countdown
 * Shows status changes (normal -> amber -> red) as time runs low
 */

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface AssessmentTimerProps {
  serverEndTime: number; // Authoritative timestamp from server
  onTimeExpired: () => void;
  onLowTime?: (secondsRemaining: number) => void;
  lowTimeThreshold?: number;
}

interface TimeDisplay {
  minutes: number;
  seconds: number;
  display: string;
  status: "normal" | "amber" | "red";
}

export function AssessmentTimer({
  serverEndTime,
  onTimeExpired,
  onLowTime,
  lowTimeThreshold = 300, // 5 minutes
}: AssessmentTimerProps) {
  const [timeDisplay, setTimeDisplay] = useState<TimeDisplay | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lowTimeWarnedRef = useRef(false);
  const criticalTimeWarnedRef = useRef(false);

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const secondsRemaining = Math.floor((serverEndTime - now) / 1000);

      if (secondsRemaining <= 0) {
        setIsExpired(true);
        setTimeDisplay({
          minutes: 0,
          seconds: 0,
          display: "00:00",
          status: "red",
        });

        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        onTimeExpired();
        return;
      }

      const minutes = Math.floor(secondsRemaining / 60);
      const seconds = secondsRemaining % 60;
      const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      // Determine status
      let status: "normal" | "amber" | "red" = "normal";
      if (secondsRemaining <= 60) {
        status = "red";
        if (!criticalTimeWarnedRef.current) {
          criticalTimeWarnedRef.current = true;
          // Could trigger notification here
        }
      } else if (secondsRemaining <= lowTimeThreshold) {
        status = "amber";
        if (!lowTimeWarnedRef.current) {
          lowTimeWarnedRef.current = true;
          onLowTime?.(secondsRemaining);
        }
      }

      setTimeDisplay({
        minutes,
        seconds,
        display,
        status,
      });
    };

    // Initial update
    updateTime();

    // Update every 100ms for smooth display
    timerRef.current = setInterval(updateTime, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [serverEndTime, onTimeExpired, onLowTime, lowTimeThreshold]);

  if (!timeDisplay) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "red":
        return "text-red-600";
      case "amber":
        return "text-amber-600";
      default:
        return "text-primary";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "red":
        return "bg-red-50 border-red-200";
      case "amber":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-primary/10 border-primary/20";
    }
  };

  const getClockColor = (status: string) => {
    switch (status) {
      case "red":
        return "text-red-600";
      case "amber":
        return "text-amber-600";
      default:
        return "text-primary";
    }
  };

  return (
    <motion.div
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-colors ${getStatusBgColor(timeDisplay.status)}`}
      animate={timeDisplay.status === "red" ? { scale: [1, 1.02, 1] } : {}}
      transition={
        timeDisplay.status === "red"
          ? {
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : {}
      }
    >
      <Clock className={`h-5 w-5 ${getClockColor(timeDisplay.status)}`} />
      <div className="flex flex-col">
        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#7d8ba3]">
          Time Remaining
        </div>
        <motion.div
          className={`font-mono text-lg font-bold ${getStatusColor(timeDisplay.status)}`}
          key={timeDisplay.display}
          initial={{ scale: 0.9, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          {timeDisplay.display}
        </motion.div>
      </div>

      {/* Low time warning indicator */}
      {timeDisplay.status !== "normal" && (
        <motion.div
          className={`ml-auto h-2 w-2 rounded-full ${timeDisplay.status === "red" ? "bg-red-600" : "bg-amber-600"}`}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}
