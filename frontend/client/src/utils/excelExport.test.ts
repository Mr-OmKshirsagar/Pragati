/**
 * Excel Export Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { exportPlacementsToExcel, exportApplicationsToExcel, exportPlacementSummary } from './excelExport';

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    encode_cell: vi.fn((cell) => `${cell.c}:${cell.r}`),
    decode_range: vi.fn(() => ({ s: { c: 0, r: 0 }, e: { c: 5, r: 0 } })),
  },
  writeFile: vi.fn(),
}));

describe('Excel Export Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportPlacementsToExcel', () => {
    it('should export placements successfully', () => {
      const mockPlacements = [
        {
          id: '1',
          company: 'Google',
          role: 'Software Engineer',
          type: 'Placement',
          location: 'Bengaluru',
          deadline: '2026-10-15',
          deadlineLabel: '28 days left',
          eligibilityStatus: 'Eligible',
          applicationStatus: 'Applied',
          closingSoon: false,
          skills: ['Python', 'JavaScript'],
          description: 'Great opportunity',
          verificationRequirements: ['Academic Record'],
        },
      ];

      const result = exportPlacementsToExcel(mockPlacements, 'test');

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.filename).toMatch(/test_\d{4}-\d{2}-\d{2}\.xlsx/);
    });

    it('should handle empty placements', () => {
      const result = exportPlacementsToExcel([], 'test');

      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
    });

    it('should catch errors gracefully', () => {
      vi.mocked(XLSX.utils.json_to_sheet).mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const result = exportPlacementsToExcel([], 'test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('exportApplicationsToExcel', () => {
    it('should export applications successfully', () => {
      const mockApplications = [
        {
          company: 'Microsoft',
          role: 'Cloud Engineer',
          appliedDate: '2026-09-10',
          status: 'Under Review',
          location: 'Pune',
        },
      ];

      const result = exportApplicationsToExcel(mockApplications, 'apps');

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.filename).toMatch(/apps_\d{4}-\d{2}-\d{2}\.xlsx/);
    });
  });

  describe('exportPlacementSummary', () => {
    it('should export summary successfully', () => {
      const summary = {
        eligible: 15,
        internships: 8,
        placements: 12,
        applications: 45,
      };

      const result = exportPlacementSummary(summary, 20);

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/placement_summary_\d{4}-\d{2}-\d{2}\.xlsx/);
    });
  });
});
