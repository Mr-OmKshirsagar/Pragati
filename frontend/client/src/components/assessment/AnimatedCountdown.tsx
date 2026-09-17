/**
 * AnimatedCountdown Component
 * Displays a smooth 3...2...1...START countdown animation
 * Used before starting the assessment
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedCountdownProps {
  onComplete: () => void;
  duration?: number;
}

export function AnimatedCountdown({ onComplete, duration = 4000 }: AnimatedCountdownProps) {
  const [count, setCount] = useState<number | string>(3);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const countdownSequence = [
      { number: 3, time: 0 },
      { number: 2, time: 1000 },
      { number: 1, time: 2000 },
      { number: "START", time: 3000 },
    ];

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;

      const currentStep = countdownSequence.find((s) => elapsed >= s.time && elapsed < s.time + 500);

      if (currentStep) {
        setCount(currentStep.number);
      }

      if (elapsed >= duration) {
        clearInterval(timer);
        setIsComplete(true);
        setTimeout(onComplete, 300);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#f5f7fb] to-[#f0f2f7]">
      <AnimatePresence>
        {!isComplete && (
          <motion.div
            key={count}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="text-center"
          >
            {typeof count === "number" ? (
              <div className="flex flex-col items-center">
                <motion.div
                  className="text-9xl font-extrabold bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent drop-shadow-lg"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeInOut",
                  }}
                >
                  {count}
                </motion.div>
                <motion.div
                  className="mt-4 text-lg font-semibold text-[#6c7890]"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{
                    duration: 1,
                    ease: "easeInOut",
                  }}
                >
                  Get ready
                </motion.div>
              </div>
            ) : (
              <motion.div
                className="flex flex-col items-center"
                animate={{
                  scale: [0.8, 1, 1.1],
                  opacity: [0, 1, 1],
                }}
                transition={{
                  duration: 1,
                  ease: "easeInOut",
                }}
              >
                <div className="text-7xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent drop-shadow-lg">
                  START
                </div>
                <motion.div
                  className="mt-4 text-sm font-medium text-[#16a889]"
                  animate={{ opacity: [0.6, 1] }}
                  transition={{
                    duration: 0.5,
                  }}
                >
                  Assessment beginning...
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
