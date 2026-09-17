/**
 * Export Modal Component
 * Select format and download reports
 */

import React, { useState } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  Box,
  RadioGroup,
  Checkbox,
  Spinner,
} from "@radix-ui/themes";
import { DownloadIcon } from "@radix-ui/react-icons";

export type ExportFormat = "PDF" | "EXCEL" | "CSV" | "JSON";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, options: any) => Promise<void>;
  reportType: string;
  availableFormats?: ExportFormat[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  reportType,
  availableFormats = ["PDF", "EXCEL", "CSV", "JSON"],
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    availableFormats[0] as ExportFormat
  );
  const [isLoading, setIsLoading] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const formatDescriptions: Record<ExportFormat, string> = {
    PDF: "Best for sharing and printing",
    EXCEL: "Best for data analysis and spreadsheets",
    CSV: "Best for importing into other systems",
    JSON: "Best for API integration",
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await onExport(selectedFormat, {
        includeMetadata,
      });
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content maxWidth="400px">
        <Dialog.Title>Export Report</Dialog.Title>
        <Dialog.Description>
          Select a format and options to export your {reportType} report
        </Dialog.Description>

        <Flex direction="column" gap="4" mt="4">
          {/* Format Selection */}
          <Box>
            <Text weight="medium" size="2" display="block" mb="2">
              Export Format
            </Text>
            <RadioGroup.Root
              value={selectedFormat}
              onValueChange={(value) => setSelectedFormat(value as ExportFormat)}
            >
              {availableFormats.map((format) => (
                <Flex key={format} gap="2" align="center" mb="2">
                  <RadioGroup.Item value={format} />
                  <Flex direction="column" gap="1">
                    <Text weight="medium" size="2">
                      {format}
                    </Text>
                    <Text size="1" color="gray">
                      {formatDescriptions[format]}
                    </Text>
                  </Flex>
                </Flex>
              ))}
            </RadioGroup.Root>
          </Box>

          {/* Options */}
          <Box>
            <Text weight="medium" size="2" display="block" mb="2">
              Options
            </Text>
            <Flex gap="2" align="center">
              <Checkbox
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
              />
              <Text size="2">Include metadata and timestamps</Text>
            </Flex>
          </Box>

          {/* Format Preview */}
          <Box
            style={{
              padding: 12,
              backgroundColor: "var(--gray-2)",
              borderRadius: 6,
            }}
          >
            <Text size="1" color="gray" weight="medium" display="block" mb="1">
              Preview:
            </Text>
            <Text size="1" family="mono">
              report.{selectedFormat.toLowerCase()}
            </Text>
          </Box>
        </Flex>

        {/* Dialog Actions */}
        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button onClick={handleExport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="1" />
                Exporting...
              </>
            ) : (
              <>
                <DownloadIcon />
                Export
              </>
            )}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
