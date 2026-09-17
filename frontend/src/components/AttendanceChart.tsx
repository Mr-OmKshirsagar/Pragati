/**
 * Attendance Chart Component
 * Display attendance as pie or bar chart
 */

import React, { useMemo } from "react";
import { Box, Text, Flex, Progress, Card } from "@radix-ui/themes";

interface AttendanceChartProps {
  present: number;
  absent: number;
  late?: number;
  total: number;
  chartType?: "pie" | "bar" | "progress";
  size?: "small" | "medium" | "large";
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({
  present,
  absent,
  late = 0,
  total,
  chartType = "bar",
  size = "medium",
}) => {
  const attendance = useMemo(() => {
    const percent = total > 0 ? (present / total) * 100 : 0;
    return {
      percent: parseFloat(percent.toFixed(1)),
      color: percent >= 75 ? "green" : percent >= 60 ? "orange" : "red",
      status: percent >= 75 ? "Good" : percent >= 60 ? "Warning" : "At Risk",
    };
  }, [present, total]);

  if (chartType === "progress") {
    return (
      <Card size="2">
        <Flex direction="column" gap="3">
          <Flex justify="between" align="center">
            <Text weight="medium">Attendance</Text>
            <Text size="3" weight="bold" color={attendance.color}>
              {attendance.percent}%
            </Text>
          </Flex>
          <Progress value={attendance.percent} />
          <Flex gap="4" justify="between" mt="2">
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Present
              </Text>
              <Text size="2" weight="bold">
                {present}
              </Text>
            </Flex>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Absent
              </Text>
              <Text size="2" weight="bold">
                {absent}
              </Text>
            </Flex>
            {late > 0 && (
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">
                  Late
                </Text>
                <Text size="2" weight="bold">
                  {late}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Card>
    );
  }

  // Bar chart view
  const barHeight = size === "small" ? 150 : size === "medium" ? 200 : 250;

  return (
    <Card size="2">
      <Flex direction="column" gap="3">
        <Text weight="medium">Attendance Breakdown</Text>

        <Flex gap="2" align="flex-end" justify="center" style={{ height: barHeight }}>
          {/* Present Bar */}
          <Flex direction="column" gap="1" align="center">
            <Box
              style={{
                width: 40,
                height: (present / total) * barHeight,
                backgroundColor: "var(--green-9)",
                borderRadius: 4,
              }}
            />
            <Text size="1">{present}</Text>
            <Text size="1" color="gray">
              Present
            </Text>
          </Flex>

          {/* Absent Bar */}
          <Flex direction="column" gap="1" align="center">
            <Box
              style={{
                width: 40,
                height: (absent / total) * barHeight,
                backgroundColor: "var(--red-9)",
                borderRadius: 4,
              }}
            />
            <Text size="1">{absent}</Text>
            <Text size="1" color="gray">
              Absent
            </Text>
          </Flex>

          {/* Late Bar */}
          {late > 0 && (
            <Flex direction="column" gap="1" align="center">
              <Box
                style={{
                  width: 40,
                  height: (late / total) * barHeight,
                  backgroundColor: "var(--amber-9)",
                  borderRadius: 4,
                }}
              />
              <Text size="1">{late}</Text>
              <Text size="1" color="gray">
                Late
              </Text>
            </Flex>
          )}
        </Flex>

        {/* Summary */}
        <Flex gap="2" justify="center" mt="3">
          <Box
            style={{
              padding: "8px 12px",
              backgroundColor: "var(--blue-3)",
              borderRadius: 4,
            }}
          >
            <Text size="2" weight="bold" color="blue">
              {attendance.percent}% Attendance
            </Text>
          </Box>
          <Box
            style={{
              padding: "8px 12px",
              backgroundColor:
                attendance.color === "green"
                  ? "var(--green-3)"
                  : attendance.color === "orange"
                    ? "var(--amber-3)"
                    : "var(--red-3)",
              borderRadius: 4,
            }}
          >
            <Text size="2" weight="bold" color={attendance.color}>
              {attendance.status}
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Card>
  );
};
