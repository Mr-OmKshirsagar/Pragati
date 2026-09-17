/**
 * Internship Profile Card Component
 * Displays comprehensive internship information with verification status
 */

import React from "react";
import { Badge, Card, Flex, Text, Box, Button } from "@radix-ui/themes";
import { CalendarIcon, UserIcon, CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";

interface InternshipProfileCardProps {
  id: string;
  companyName: string;
  role: string;
  startDate: string;
  endDate?: string;
  stipend?: number;
  supervisorName?: string;
  status: "APPLIED" | "OFFERED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED";
  verificationStatus: "SELF_REPORTED" | "PENDING" | "INSTITUTION_VERIFIED" | "ISSUER_VERIFIED" | "REJECTED";
  onEdit?: (id: string) => void;
  onUploadEvidence?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  APPLIED: "gray",
  OFFERED: "blue",
  IN_PROGRESS: "orange",
  COMPLETED: "green",
  TERMINATED: "red",
};

const verificationColors: Record<string, string> = {
  SELF_REPORTED: "gray",
  PENDING: "amber",
  INSTITUTION_VERIFIED: "green",
  ISSUER_VERIFIED: "teal",
  REJECTED: "red",
};

export const InternshipProfileCard: React.FC<InternshipProfileCardProps> = ({
  id,
  companyName,
  role,
  startDate,
  endDate,
  stipend,
  supervisorName,
  status,
  verificationStatus,
  onEdit,
  onUploadEvidence,
}) => {
  const durationDays = endDate
    ? Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card size="2" style={{ width: "100%", maxWidth: "500px" }}>
      <Flex direction="column" gap="4">
        {/* Header */}
        <Flex justify="between" align="start">
          <Flex direction="column" gap="1">
            <Text as="div" size="5" weight="bold">
              {companyName}
            </Text>
            <Text as="div" size="3" color="gray">
              {role}
            </Text>
          </Flex>
          <Flex gap="2">
            <Badge color={statusColors[status]} variant="soft">
              {status}
            </Badge>
          </Flex>
        </Flex>

        {/* Verification Status */}
        <Flex gap="2" align="center">
          {verificationStatus === "REJECTED" ? (
            <>
              <CrossCircledIcon style={{ color: "var(--red-11)" }} />
              <Text size="2" color="red">
                Verification Rejected
              </Text>
            </>
          ) : verificationStatus === "INSTITUTION_VERIFIED" || verificationStatus === "ISSUER_VERIFIED" ? (
            <>
              <CheckCircledIcon style={{ color: "var(--green-11)" }} />
              <Text size="2" color="green">
                Verified
              </Text>
            </>
          ) : (
            <Badge color={verificationColors[verificationStatus]} variant="soft">
              {verificationStatus}
            </Badge>
          )}
        </Flex>

        {/* Dates */}
        <Flex gap="4">
          <Flex align="center" gap="2">
            <CalendarIcon style={{ color: "var(--gray-11)" }} />
            <Flex direction="column" gap="1">
              <Text size="1" color="gray" weight="medium">
                Start
              </Text>
              <Text size="2">{new Date(startDate).toDateString()}</Text>
            </Flex>
          </Flex>

          {endDate && (
            <Flex align="center" gap="2">
              <CalendarIcon style={{ color: "var(--gray-11)" }} />
              <Flex direction="column" gap="1">
                <Text size="1" color="gray" weight="medium">
                  End
                </Text>
                <Text size="2">{new Date(endDate).toDateString()}</Text>
              </Flex>
            </Flex>
          )}
        </Flex>

        {/* Metadata Grid */}
        <Flex gap="4">
          {durationDays && (
            <Box>
              <Text size="1" color="gray" weight="medium">
                Duration
              </Text>
              <Text size="2">{durationDays} days</Text>
            </Box>
          )}

          {stipend && (
            <Box>
              <Text size="1" color="gray" weight="medium">
                Stipend
              </Text>
              <Text size="2">₹{stipend.toLocaleString()}/month</Text>
            </Box>
          )}

          {supervisorName && (
            <Box>
              <Text size="1" color="gray" weight="medium">
                Supervisor
              </Text>
              <Flex gap="1" align="center">
                <UserIcon style={{ width: 14, height: 14 }} />
                <Text size="2">{supervisorName}</Text>
              </Flex>
            </Box>
          )}
        </Flex>

        {/* Action Buttons */}
        <Flex gap="2" mt="2">
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(id)}>
              Edit
            </Button>
          )}
          {onUploadEvidence && (
            <Button color="blue" onClick={() => onUploadEvidence(id)}>
              Upload Evidence
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
};
