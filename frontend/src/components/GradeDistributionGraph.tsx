/**
 * Grade Distribution Graph Component
 * Visualize grade distribution across students
 */

import React from "react";
import { Box, Card, Flex, Text } from "@radix-ui/themes";

interface GradeDistribution {
  excellent: number; // 90-100
  veryGood: number; // 80-89
  good: number; // 70-79
  satisfactory: number; // 60-69
  needsImprovement: number; // <60
}

interface GradeDistributionGraphProps {
  distribution: GradeDistribution;
  total: number;
  averageGrade?: number;
  passPercentage?: number;
}

const GRADE_RANGES = [
  { label: "Excellent (90-100)", key: "excellent", color: "#10b981" },
  { label: "Very Good (80-89)", key: "veryGood", color: "#06b6d4" },
  { label: "Good (70-79)", key: "good", color: "#3b82f6" },
  { label: "Satisfactory (60-69)", key: "satisfactory", color: "#f59e0b" },
  { label: "Needs Improvement (<60)", key: "needsImprovement", color: "#ef4444" },
];

export const GradeDistributionGraph: React.FC<GradeDistributionGraphProps> = ({
  distribution,
  total,
  averageGrade = 0,
  passPercentage = 0,
}) => {
  const maxValue = Math.max(...Object.values(distribution));

  return (
    <Card size="2" style={{ width: "100%" }}>
      <Flex direction="column" gap="4">
        {/* Header */}
        <Flex justify="between" align="start">
          <Flex direction="column" gap="1">
            <Text weight="bold" size="4">
              Grade Distribution
            </Text>
            <Text color="gray" size="2">
              Total Students: {total}
            </Text>
          </Flex>
          <Flex direction="column" gap="1" align="end">
            <Box>
              <Text size="1" color="gray">
                Average Grade
              </Text>
              <Text size="3" weight="bold">
                {averageGrade.toFixed(1)}
              </Text>
            </Box>
            <Box>
              <Text size="1" color="gray">
                Pass Rate
              </Text>
              <Text size="3" weight="bold">
                {passPercentage.toFixed(1)}%
              </Text>
            </Box>
          </Flex>
        </Flex>

        {/* Horizontal Bar Chart */}
        <Flex direction="column" gap="3">
          {GRADE_RANGES.map((range) => {
            const value = distribution[range.key as keyof GradeDistribution];
            const percentage = total > 0 ? (value / total) * 100 : 0;
            const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;

            return (
              <Flex key={range.key} direction="column" gap="1">
                <Flex justify="between" align="center" mb="1">
                  <Text size="2" weight="medium">
                    {range.label}
                  </Text>
                  <Text size="2" color="gray">
                    {value} ({percentage.toFixed(1)}%)
                  </Text>
                </Flex>

                {/* Bar */}
                <Box
                  style={{
                    height: 24,
                    backgroundColor: "#f3f4f6",
                    borderRadius: 4,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {barWidth > 0 && (
                    <Box
                      style={{
                        height: "100%",
                        width: `${barWidth}%`,
                        backgroundColor: range.color,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: 8,
                        transition: "width 0.3s ease",
                      }}
                    >
                      {barWidth > 15 && (
                        <Text size="1" weight="bold" style={{ color: "white" }}>
                          {value}
                        </Text>
                      )}
                    </Box>
                  )}
                  {barWidth <= 15 && barWidth > 0 && (
                    <Text
                      size="1"
                      weight="bold"
                      style={{
                        position: "absolute",
                        right: 6,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#666",
                      }}
                    >
                      {value}
                    </Text>
                  )}
                </Box>
              </Flex>
            );
          })}
        </Flex>

        {/* Legend */}
        <Flex gap="2" wrap="wrap" mt="2">
          {GRADE_RANGES.map((range) => (
            <Flex key={range.key} gap="1" align="center">
              <Box
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: range.color,
                  borderRadius: 2,
                }}
              />
              <Text size="1" color="gray">
                {range.label}
              </Text>
            </Flex>
          ))}
        </Flex>

        {/* Summary Stats */}
        <Flex gap="2">
          <Box
            style={{
              padding: "8px 12px",
              backgroundColor: "#f0fdf4",
              borderRadius: 4,
              flex: 1,
            }}
          >
            <Text size="1" color="gray">
              Passed
            </Text>
            <Text size="2" weight="bold" color="green">
              {(distribution.excellent +
                distribution.veryGood +
                distribution.good +
                distribution.satisfactory)}{" "}
              students
            </Text>
          </Box>

          <Box
            style={{
              padding: "8px 12px",
              backgroundColor: "#fef2f2",
              borderRadius: 4,
              flex: 1,
            }}
          >
            <Text size="1" color="gray">
              Failed
            </Text>
            <Text size="2" weight="bold" color="red">
              {distribution.needsImprovement} students
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Card>
  );
};
