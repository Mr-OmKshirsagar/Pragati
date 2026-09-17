/**
 * Excel Export Utility
 * Exports placement data to Excel format
 */

import * as XLSX from 'xlsx';
import type { Opportunity } from '@shared/pragati';

/**
 * Export placements to Excel file
 */
export function exportPlacementsToExcel(placements: Opportunity[], filename: string = 'placements.xlsx') {
  try {
    // Prepare data for Excel
    const data = placements.map(p => ({
      'Company': p.company,
      'Role': p.role,
      'Type': p.type,
      'Location': p.location,
      'Deadline': p.deadline,
      'Days Left': p.deadlineLabel,
      'Status': p.eligibilityStatus,
      'Applications': p.applicationStatus,
      'Closing Soon': p.closingSoon ? 'Yes' : 'No',
      'Skills Required': p.skills.join(', '),
      'Description': p.description,
      'Verification Requirements': p.verificationRequirements.join(', '),
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Placements');

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Company
      { wch: 25 }, // Role
      { wch: 12 }, // Type
      { wch: 20 }, // Location
      { wch: 12 }, // Deadline
      { wch: 15 }, // Days Left
      { wch: 15 }, // Status
      { wch: 15 }, // Applications
      { wch: 12 }, // Closing Soon
      { wch: 30 }, // Skills
      { wch: 40 }, // Description
      { wch: 35 }, // Verification
    ];
    worksheet['!cols'] = columnWidths;

    // Style header row
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4A43B3' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    };

    // Apply header styling
    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = headerStyle;
        }
      }
    }

    // Add freeze panes (freeze header row)
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = filename.replace('.xlsx', '') + `_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, finalFilename);

    return {
      success: true,
      filename: finalFilename,
      count: data.length,
    };
  } catch (error: any) {
    console.error('Excel export failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Export applications to Excel file
 */
export function exportApplicationsToExcel(
  applications: Array<{
    company: string;
    role: string;
    appliedDate: string;
    status: string;
    location: string;
  }>,
  filename: string = 'applications.xlsx'
) {
  try {
    const data = applications.map(app => ({
      'Company': app.company,
      'Position': app.role,
      'Applied Date': app.appliedDate,
      'Status': app.status,
      'Location': app.location,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

    const columnWidths = [
      { wch: 20 }, // Company
      { wch: 25 }, // Position
      { wch: 15 }, // Applied Date
      { wch: 15 }, // Status
      { wch: 20 }, // Location
    ];
    worksheet['!cols'] = columnWidths;

    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '16a889' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = headerStyle;
        }
      }
    }

    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = filename.replace('.xlsx', '') + `_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, finalFilename);

    return {
      success: true,
      filename: finalFilename,
      count: data.length,
    };
  } catch (error: any) {
    console.error('Applications export failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Export placement summary statistics
 */
export function exportPlacementSummary(
  summary: {
    eligible: number;
    internships: number;
    placements: number;
    applications: number;
  },
  totalDrives: number
) {
  try {
    const data = [
      { Metric: 'Total Placement Drives', Count: totalDrives },
      { Metric: 'Eligible Opportunities', Count: summary.eligible },
      { Metric: 'Internship Opportunities', Count: summary.internships },
      { Metric: 'Placement Opportunities', Count: summary.placements },
      { Metric: 'Applications Submitted', Count: summary.applications },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');

    worksheet['!cols'] = [{ wch: 30 }, { wch: 15 }];

    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '5E53BA' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = headerStyle;
        }
      }
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `placement_summary_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, filename);

    return {
      success: true,
      filename,
    };
  } catch (error: any) {
    console.error('Summary export failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
