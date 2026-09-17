/**
 * Search & Filter Panel Component
 * Advanced filtering for internships, students, and subjects
 */

import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  Flex,
  Text,
  TextField,
  Select,
  Checkbox,
  Separator,
  Badge,
} from "@radix-ui/themes";
import { MagnifyingGlassIcon, CrossCircledIcon } from "@radix-ui/react-icons";

export interface FilterState {
  query: string;
  status?: string[];
  department?: string;
  dateRange?: { from: string; to: string };
  page: number;
}

interface SearchFilterPanelProps {
  onSearch: (filters: FilterState) => void;
  resourceType: "INTERNSHIPS" | "STUDENTS" | "SUBJECTS";
  departments?: Array<{ id: string; name: string }>;
  loading?: boolean;
}

export const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  onSearch,
  resourceType,
  departments = [],
  loading = false,
}) => {
  const [query, setQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions: Record<string, string[]> = {
    INTERNSHIPS: [
      "APPLIED",
      "OFFERED",
      "IN_PROGRESS",
      "COMPLETED",
      "TERMINATED",
    ],
    STUDENTS: ["ACTIVE", "INACTIVE", "GRADUATED", "SUSPENDED"],
    SUBJECTS: ["ACTIVE", "ARCHIVED", "DRAFT"],
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleSearch = () => {
    onSearch({
      query,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      department: selectedDepartment || undefined,
      dateRange:
        dateFrom || dateTo
          ? { from: dateFrom, to: dateTo }
          : undefined,
      page: 1,
    });
  };

  const handleClear = () => {
    setQuery("");
    setSelectedStatuses([]);
    setSelectedDepartment("");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters =
    query ||
    selectedStatuses.length > 0 ||
    selectedDepartment ||
    dateFrom ||
    dateTo;

  return (
    <Card size="2" style={{ width: "100%" }}>
      <Flex direction="column" gap="3">
        {/* Search Bar */}
        <Flex gap="2">
          <TextField.Root
            placeholder={`Search ${resourceType.toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            style={{ flex: 1 }}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height="16" width="16" />
            </TextField.Slot>
          </TextField.Root>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
          {hasFilters && (
            <Button
              variant="soft"
              color="gray"
              onClick={handleClear}
            >
              <CrossCircledIcon />
              Clear
            </Button>
          )}
        </Flex>

        {/* Expandable Filters */}
        <Box>
          <Button
            variant="ghost"
            size="1"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ paddingLeft: 0 }}
          >
            {isExpanded ? "Hide Filters" : "Show Advanced Filters"}
          </Button>
        </Box>

        {isExpanded && (
          <>
            <Separator size="4" />

            <Flex direction="column" gap="3">
              {/* Status Filter */}
              <Box>
                <Text weight="medium" size="2" display="block" mb="2">
                  Status
                </Text>
                <Flex gap="2" wrap="wrap">
                  {statusOptions[resourceType].map((status) => (
                    <Flex
                      key={status}
                      gap="1"
                      align="center"
                      onClick={() => handleStatusToggle(status)}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid var(--gray-7)",
                        borderRadius: 6,
                        cursor: "pointer",
                        backgroundColor: selectedStatuses.includes(status)
                          ? "var(--blue-3)"
                          : "transparent",
                      }}
                    >
                      <Checkbox
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={() => handleStatusToggle(status)}
                      />
                      <Text size="2">{status}</Text>
                    </Flex>
                  ))}
                </Flex>
              </Box>

              {/* Department Filter */}
              {departments.length > 0 && (
                <Box>
                  <Text weight="medium" size="2" display="block" mb="2">
                    Department
                  </Text>
                  <Select.Root
                    value={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="">All Departments</Select.Item>
                      {departments.map((dept) => (
                        <Select.Item key={dept.id} value={dept.id}>
                          {dept.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>
              )}

              {/* Date Range Filter */}
              <Flex gap="2">
                <Box style={{ flex: 1 }}>
                  <Text weight="medium" size="2" display="block" mb="2">
                    From Date
                  </Text>
                  <TextField.Root
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </Box>
                <Box style={{ flex: 1 }}>
                  <Text weight="medium" size="2" display="block" mb="2">
                    To Date
                  </Text>
                  <TextField.Root
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </Box>
              </Flex>
            </Flex>

            <Separator size="4" />
          </>
        )}

        {/* Active Filters Badge */}
        {hasFilters && (
          <Flex gap="2" wrap="wrap">
            {query && (
              <Badge>
                Query: <strong>{query}</strong>
              </Badge>
            )}
            {selectedStatuses.map((status) => (
              <Badge key={status} color="blue">
                {status}
              </Badge>
            ))}
            {selectedDepartment && (
              <Badge>
                Dept: <strong>{selectedDepartment}</strong>
              </Badge>
            )}
            {dateFrom && <Badge>From: {dateFrom}</Badge>}
            {dateTo && <Badge>To: {dateTo}</Badge>}
          </Flex>
        )}
      </Flex>
    </Card>
  );
};
