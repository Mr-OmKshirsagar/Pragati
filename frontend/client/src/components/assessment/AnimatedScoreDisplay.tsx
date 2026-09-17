/**
 * AnimatedScoreDisplay Component
 * Animates score from 0 to final value with progress ring
 * Used on assessment result page
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedScoreDisplayProps {
  score: number; // 0-100
  label?: string;
  delay?: number;
}

export function AnimatedScoreDisplay({
  score,
  label = "Score",
  delay = 0,
}: AnimatedScoreDisplayProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2000; // 2 seconds

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayScore(Math.round(score * progress));

      if (progress === 1) {
        clearInterval(timer);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [score]);

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 80) return "#16a889"; // emerald
    if (score >= 60) return "#f59e0b"; // amber
    if (score >= 40) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5eaf2"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getColor(displayScore)}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transition={{ duration: 0.1 }}
          />
        </svg>

        {/* Score Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-4xl font-extrabold text-[#182643]"
            key={displayScore}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1 }}
          >
            {displayScore}
          </motion.div>
          <div className="text-sm font-semibold text-[#7d8ba3]">%</div>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.5, duration: 0.3 }}
        className="mt-4 text-sm font-semibold text-[#6c7890]"
      >
        {label}
      </motion.p>

      {/* Performance Label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.8, duration: 0.3 }}
        className={`mt-3 px-3 py-1.5 rounded-full text-xs font-bold ${
          displayScore >= 80
            ? "bg-emerald-50 text-emerald-700"
            : displayScore >= 60
              ? "bg-amber-50 text-amber-700"
              : displayScore >= 40
                ? "bg-orange-50 text-orange-700"
                : "bg-red-50 text-red-700"
        }`}
      >
        {displayScore >= 80
          ? "Excellent"
          : displayScore >= 60
            ? "Good"
            : displayScore >= 40
              ? "Satisfactory"
              : "Needs Improvement"}
      </motion.div>
    </motion.div>
  );
}
