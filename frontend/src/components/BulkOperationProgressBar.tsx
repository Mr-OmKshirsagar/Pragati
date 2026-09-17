/**
 * Bulk Operation Progress Bar Component
 * Real-time progress tracking for bulk operations
 */

import React, { useMemo } from "react";
import { Box, Card, Flex, Progress, Text, Badge, Button } from "@radix-ui/themes";
import { CheckCircledIcon, CrossCircledIcon, ReloadIcon } from "@radix-ui/react-icons";

interface BulkOperationProgressBarProps {
  operationId: string;
  operationType: "IMPORT" | "EXPORT" | "BULK_UPDATE" | "VERIFICATION";
  progress: number;
  total: number;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
  startTime: Date;
  endTime?: Date;
  successCount?: number;
  failedCount?: number;
  errors?: Array<{ index: number; message: string }>;
  onCancel?: () => void;
  onRetry?: () => void;
  onDownload?: () => void;
}

export const BulkOperationProgressBar: React.FC<BulkOperationProgressBarProps> = ({
  operationId,
  operationType,
  progress,
  total,
  status,
  startTime,
  endTime,
  successCount,
  failedCount,
  errors = [],
  onCancel,
  onRetry,
  onDownload,
}) => {
  const percentComplete = useMemo(() => {
    return total > 0 ? (progress / total) * 100 : 0;
  }, [progress, total]);

  const elapsedTime = useMemo(() => {
    const end = endTime || new Date();
    const elapsed = (end.getTime() - startTime.getTime()) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    return `${minutes}m ${seconds}s`;
  }, [startTime, endTime]);

  const estimatedTimeRemaining = useMemo(() => {
    if (status !== "IN_PROGRESS" || progress === 0) return null;

    const elapsed = (new Date().getTime() - startTime.getTime()) / 1000;
    const timePerItem = elapsed / progress;
    const remainingItems = total - progress;
    const remainingSeconds = timePerItem * remainingItems;

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.floor(remainingSeconds % 60);
    return `${minutes}m ${seconds}s`;
  }, [progress, total, startTime, status]);

  const statusConfig = {
    IN_PROGRESS: { color: "blue", icon: null, label: "Processing..." },
    COMPLETED: { color: "green", icon: CheckCircledIcon, label: "Completed" },
    FAILED: { color: "red", icon: CrossCircledIcon, label: "Failed" },
    CANCELLED: { color: "gray", icon: CrossCircledIcon, label: "Cancelled" },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card size="2" style={{ width: "100%" }}>
      <Flex direction="column" gap="3">
        {/* Header */}
        <Flex justify="between" align="center">
          <Flex direction="column" gap="1">
            <Flex gap="2" align="center">
              {StatusIcon && <StatusIcon style={{ color: `var(--${config.color}-11)` }} />}
              <Text weight="bold">{operationType}</Text>
            </Flex>
            <Text size="1" color="gray">
              ID: {operationId}
            </Text>
          </Flex>
          <Badge color={config.color}>{config.label}</Badge>
        </Flex>

        {/* Progress Bar */}
        <Box>
          <Flex justify="between" mb="2">
            <Text size="2" weight="medium">
              {progress} / {total} items
            </Text>
            <Text size="2" weight="medium">
              {percentComplete.toFixed(1)}%
            </Text>
          </Flex>
          <Progress
            value={percentComplete}
            style={{ backgroundColor: "var(--gray-5)" }}
          />
        </Box>

        {/* Stats */}
        <Flex gap="3" justify="between">
          <Flex direction="column" gap="1">
            <Text size="1" color="gray">
              Elapsed
            </Text>
            <Text size="2" weight="medium">
              {elapsedTime}
            </Text>
          </Flex>

          {estimatedTimeRemaining && status === "IN_PROGRESS" && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Estimated Remaining
              </Text>
              <Text size="2" weight="medium">
                {estimatedTimeRemaining}
              </Text>
            </Flex>
          )}

          {successCount !== undefined && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Successful
              </Text>
              <Text size="2" weight="medium" color="green">
                {successCount}
              </Text>
            </Flex>
          )}

          {failedCount !== undefined && failedCount > 0 && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Failed
              </Text>
              <Text size="2" weight="medium" color="red">
                {failedCount}
              </Text>
            </Flex>
          )}
        </Flex>

        {/* Error Details */}
        {errors.length > 0 && (
          <Box
            style={{
              padding: 12,
              backgroundColor: "var(--red-2)",
              borderRadius: 6,
              maxHeight: 150,
              overflowY: "auto",
            }}
          >
            <Text size="1" weight="medium" color="red" display="block" mb="2">
              Errors ({errors.length})
            </Text>
            {errors.slice(0, 5).map((error, idx) => (
              <Text key={idx} size="1" color="red" display="block">
                Row {error.index}: {error.message}
              </Text>
            ))}
            {errors.length > 5 && (
              <Text size="1" color="red" display="block" mt="1">
                +{errors.length - 5} more errors
              </Text>
            )}
          </Box>
        )}

        {/* Actions */}
        <Flex gap="2">
          {status === "IN_PROGRESS" && onCancel && (
            <Button variant="soft" color="red" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {status === "FAILED" && onRetry && (
            <Button color="blue" onClick={onRetry}>
              <ReloadIcon />
              Retry
            </Button>
          )}
          {(status === "COMPLETED" || status === "FAILED") && onDownload && (
            <Button variant="outline" onClick={onDownload}>
              Download Report
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
};
