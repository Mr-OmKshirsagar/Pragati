/**
 * Internship Analytics Service
 * Comprehensive reporting, statistics, and insights for internship program
 */

import { and, eq, gte, lte, count, desc, inArray } from "drizzle-orm";
import {
  internships,
  internshipEvidence,
  internshipCheckins,
  studentProfiles,
  users,
  departments,
  academicRecords,
} from "../../drizzle/schema";
import { getDb } from "../db";

const getDatabase = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
};

// ============================================================================
// STUDENT INTERNSHIP ANALYTICS
// ============================================================================

/**
 * Get comprehensive internship profile for a student
 */
export async function getStudentInternshipProfile(studentId: string) {
  const db = await getDatabase();

  const internshipRecords = await db
    .select()
    .from(internships)
    .where(eq(internships.studentId, studentId))
    .orderBy(desc(internships.createdAt));

  const profile = {
    totalInternships: internshipRecords.length,
    completed: internshipRecords.filter((i) => i.status === "COMPLETED").length,
    inProgress: internshipRecords.filter((i) => i.status === "IN_PROGRESS").length,
    applied: internshipRecords.filter((i) => i.status === "APPLIED").length,
    offered: internshipRecords.filter((i) => i.status === "OFFERED").length,
    terminated: internshipRecords.filter((i) => i.status === "TERMINATED").length,
    verified: internshipRecords.filter((i) => i.verificationStatus === "INSTITUTION_VERIFIED")
      .length,
    pending: internshipRecords.filter((i) => i.verificationStatus === "PENDING").length,
    rejected: internshipRecords.filter((i) => i.verificationStatus === "REJECTED").length,

    // Calculate totals
    totalStipend: internshipRecords.reduce(
      (sum, i) => sum + (i.stipend ? parseFloat(i.stipend) : 0),
      0
    ),
    averageStipend:
      internshipRecords.length > 0
        ? (
            internshipRecords.reduce((sum, i) => sum + (i.stipend ? parseFloat(i.stipend) : 0), 0) /
            internshipRecords.length
          ).toFixed(2)
        : 0,

    // Duration analysis
    totalDurationDays: internshipRecords.reduce((sum, i) => {
      if (!i.startDate || !i.endDate) return sum;
      const start = new Date(i.startDate);
      const end = new Date(i.endDate);
      return sum + Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }, 0),

    internships: internshipRecords,
  };

  return profile;
}

/**
 * Get internship performance metrics
 */
export async function getInternshipPerformanceMetrics(internshipId: string) {
  const db = await getDatabase();

  const internship = await db
    .select()
    .from(internships)
    .where(eq(internships.id, internshipId))
    .limit(1)
    .then(([result]) => result);

  if (!internship) throw new Error("Internship not found");

  // Get check-ins
  const checkIns = await db
    .select()
    .from(internshipCheckins)
    .where(eq(internshipCheckins.internshipId, internshipId))
    .orderBy(desc(internshipCheckins.checkInDate));

  // Get evidence uploads
  const evidence = await db
    .select({ count: count() })
    .from(internshipEvidence)
    .where(eq(internshipEvidence.internshipId, internshipId))
    .then(([result]) => result?.count || 0);

  // Calculate metrics
  const metrics = {
    internshipId,
    company: internship.companyName,
    role: internship.role,
    status: internship.status,
    verificationStatus: internship.verificationStatus,

    // Check-in metrics
    totalCheckIns: checkIns.length,
    averageCheckInInterval:
      checkIns.length > 1
        ? Math.round(
            checkIns.reduce((sum, ci, idx) => {
              if (idx === 0) return sum;
              const curr = new Date(ci.checkInDate);
              const prev = new Date(checkIns[idx - 1].checkInDate);
              return sum + Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
            }, 0) / (checkIns.length - 1)
          )
        : 0,

    // Evidence metrics
    totalEvidenceUploads: evidence,
    evidenceQuality:
      evidence >= 3
        ? "HIGH"
        : evidence >= 1
          ? "MEDIUM"
          : "LOW",

    // Duration
    durationDays:
      internship.startDate && internship.endDate
        ? Math.floor(
            (new Date(internship.endDate).getTime() - new Date(internship.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,

    // Stipend
    stipend: internship.stipend ? parseFloat(internship.stipend) : null,
    monthlyStipend:
      internship.stipend && internship.startDate && internship.endDate
        ? (
            (parseFloat(internship.stipend) *
              Math.floor(
                (new Date(internship.endDate).getTime() -
                  new Date(internship.startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )) /
            30
          ).toFixed(2)
        : null,

    // Performance score (0-100)
    performanceScore: calculatePerformanceScore({
      checkIns: checkIns.length,
      evidence,
      status: internship.status,
      verificationStatus: internship.verificationStatus,
    }),

    checkIns,
  };

  return metrics;
}

/**
 * Calculate performance score
 */
function calculatePerformanceScore(params: {
  checkIns: number;
  evidence: number;
  status: string;
  verificationStatus: string;
}): number {
  let score = 50; // Base score

  // Check-in contributions
  if (params.checkIns >= 8) score += 20;
  else if (params.checkIns >= 4) score += 10;
  else if (params.checkIns > 0) score += 5;

  // Evidence contributions
  if (params.evidence >= 6) score += 15;
  else if (params.evidence >= 3) score += 10;
  else if (params.evidence > 0) score += 5;

  // Status contributions
  if (params.status === "COMPLETED") score += 10;

  // Verification contributions
  if (params.verificationStatus === "INSTITUTION_VERIFIED") score += 10;
  else if (params.verificationStatus === "REJECTED") score -= 15;

  return Math.min(100, Math.max(0, score));
}

// ============================================================================
// DEPARTMENT & COHORT ANALYTICS
// ============================================================================

/**
 * Get department internship statistics (HOD Dashboard)
 */
export async function getDepartmentInternshipAnalytics(departmentId: string) {
  const db = await getDatabase();

  // Get all students in department
  const students = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.departmentId, departmentId));

  const studentIds = students.map((s) => s.id);

  let allInternships: typeof internships.$inferSelect[] = [];
  if (studentIds.length > 0) {
    allInternships = await db
      .select()
      .from(internships)
      .where(inArray(internships.studentId, studentIds));
  }

  // Calculate comprehensive stats
  const analytics = {
    departmentId,
    studentCount: students.length,
    internshipParticipation: {
      enrolled: studentIds.length,
      withInternship: new Set(allInternships.map((i) => i.studentId)).size,
      participationRate:
        studentIds.length > 0
          ? (
              ((new Set(allInternships.map((i) => i.studentId)).size || 0) / studentIds.length) *
              100
            ).toFixed(2)
          : 0,
    },

    internshipStats: {
      total: allInternships.length,
      completed: allInternships.filter((i) => i.status === "COMPLETED").length,
      inProgress: allInternships.filter((i) => i.status === "IN_PROGRESS").length,
      applied: allInternships.filter((i) => i.status === "APPLIED").length,
      offered: allInternships.filter((i) => i.status === "OFFERED").length,
      terminated: allInternships.filter((i) => i.status === "TERMINATED").length,
    },

    verificationStats: {
      verified: allInternships.filter((i) => i.verificationStatus === "INSTITUTION_VERIFIED")
        .length,
      pending: allInternships.filter((i) => i.verificationStatus === "PENDING").length,
      rejected: allInternships.filter((i) => i.verificationStatus === "REJECTED").length,
      verificationRate:
        allInternships.length > 0
          ? (
              (allInternships.filter((i) => i.verificationStatus === "INSTITUTION_VERIFIED")
                .length / allInternships.length) *
              100
            ).toFixed(2)
          : 0,
    },

    stipendAnalysis: {
      averageStipend:
        allInternships.length > 0
          ? (
              allInternships.reduce((sum, i) => sum + (i.stipend ? parseFloat(i.stipend) : 0), 0) /
              allInternships.length
            ).toFixed(2)
          : 0,
      maxStipend: allInternships.length > 0 ? Math.max(...allInternships.map((i) => parseInt(i.stipend || "0"))) : 0,
      minStipend: allInternships.length > 0 ? Math.min(...allInternships.map((i) => parseInt(i.stipend || "0"))) : 0,
      totalStipend: allInternships.reduce((sum, i) => sum + (i.stipend ? parseFloat(i.stipend) : 0), 0).toFixed(2),
    },

    companyDistribution: getCompanyDistribution(allInternships),
    roleDistribution: getRoleDistribution(allInternships),
  };

  return analytics;
}

/**
 * Get company distribution analysis
 */
function getCompanyDistribution(internships_list: any[]) {
  const distribution: Record<string, number> = {};

  internships_list.forEach((i) => {
    distribution[i.companyName] = (distribution[i.companyName] || 0) + 1;
  });

  return Object.entries(distribution)
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10
}

/**
 * Get role distribution analysis
 */
function getRoleDistribution(internships_list: any[]) {
  const distribution: Record<string, number> = {};

  internships_list.forEach((i) => {
    distribution[i.role] = (distribution[i.role] || 0) + 1;
  });

  return Object.entries(distribution)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10
}

// ============================================================================
// SEMESTER & BATCH ANALYTICS
// ============================================================================

/**
 * Get semester-wise internship trends
 */
export async function getSemesterInternshipTrends(departmentId: string) {
  const db = await getDatabase();

  // Get students by semester
  const semesters: Record<string, any> = {};

  const students = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.departmentId, departmentId));

  for (const student of students) {
    const sem = student.currentSemester;
    if (!semesters[sem]) {
      semesters[sem] = {
        semester: sem,
        students: 0,
        internships: 0,
        completed: 0,
        inProgress: 0,
      };
    }
    semesters[sem].students++;

    // Get internships for this student
    const studentInternships = await db
      .select()
      .from(internships)
      .where(eq(internships.studentId, student.id));

    semesters[sem].internships += studentInternships.length;
    semesters[sem].completed += studentInternships.filter((i) => i.status === "COMPLETED").length;
    semesters[sem].inProgress += studentInternships.filter((i) => i.status === "IN_PROGRESS")
      .length;
  }

  return Object.values(semesters).sort((a, b) => a.semester - b.semester);
}

/**
 * Get admission year cohort analysis
 */
export async function getCohortInternshipAnalysis(departmentId: string, admissionYear: number) {
  const db = await getDatabase();

  const cohortStudents = await db
    .select()
    .from(studentProfiles)
    .where(
      and(
        eq(studentProfiles.departmentId, departmentId),
        eq(studentProfiles.admissionYear, admissionYear)
      )
    );

  const studentIds = cohortStudents.map((s) => s.id);

  let cohortInternships: typeof internships.$inferSelect[] = [];
  if (studentIds.length > 0) {
    cohortInternships = await db
      .select()
      .from(internships)
      .where(inArray(internships.studentId, studentIds));
  }

  return {
    admissionYear,
    cohortSize: cohortStudents.length,
    participationStats: {
      totalInternships: cohortInternships.length,
      studentsWithInternships: new Set(cohortInternships.map((i) => i.studentId)).size,
      averageInternshipsPerStudent:
        cohortStudents.length > 0
          ? (cohortInternships.length / cohortStudents.length).toFixed(2)
          : 0,
    },
    statusBreakdown: {
      completed: cohortInternships.filter((i) => i.status === "COMPLETED").length,
      inProgress: cohortInternships.filter((i) => i.status === "IN_PROGRESS").length,
      applied: cohortInternships.filter((i) => i.status === "APPLIED").length,
      terminated: cohortInternships.filter((i) => i.status === "TERMINATED").length,
    },
    verificationBreakdown: {
      verified: cohortInternships.filter((i) => i.verificationStatus === "INSTITUTION_VERIFIED")
        .length,
      pending: cohortInternships.filter((i) => i.verificationStatus === "PENDING").length,
      rejected: cohortInternships.filter((i) => i.verificationStatus === "REJECTED").length,
    },
  };
}

// ============================================================================
// INTERNSHIP QUALITY METRICS
// ============================================================================

/**
 * Get internship quality scorecard
 */
export async function getInternshipQualityScorecard(internshipId: string) {
  const db = await getDatabase();

  const internship = await db
    .select()
    .from(internships)
    .where(eq(internships.id, internshipId))
    .limit(1)
    .then(([result]) => result);

  if (!internship) throw new Error("Internship not found");

  const checkIns = await db
    .select()
    .from(internshipCheckins)
    .where(eq(internshipCheckins.internshipId, internshipId));

  const evidence = await db
    .select()
    .from(internshipEvidence)
    .where(eq(internshipEvidence.internshipId, internshipId));

  const scorecard = {
    internshipId,
    overall: calculateQualityScore({
      checkIns: checkIns.length,
      evidence: evidence.length,
      status: internship.status,
      verificationStatus: internship.verificationStatus,
    }),

    dimensions: {
      documentation: {
        score: Math.min(100, evidence.length * 15),
        description: "Quality of evidence documentation",
        requiredEvidence: ["OFFER_LETTER", "COMPLETION_CERTIFICATE", "INTERNSHIP_REPORT"],
        uploadedTypes: evidence.map((e) => e.evidenceType),
        feedback: evidence.length >= 3 ? "✅ Excellent documentation" : `⚠️ Need ${3 - evidence.length} more documents`,
      },

      progress: {
        score: Math.min(100, checkIns.length * 12),
        description: "Regular progress updates",
        requiredCheckIns: 8,
        actualCheckIns: checkIns.length,
        feedback:
          checkIns.length >= 8
            ? "✅ Excellent progress tracking"
            : `⚠️ ${8 - checkIns.length} more check-ins recommended`,
      },

      completion: {
        score: internship.status === "COMPLETED" ? 100 : internship.status === "IN_PROGRESS" ? 60 : 30,
        description: "Internship completion status",
        status: internship.status,
        feedback:
          internship.status === "COMPLETED"
            ? "✅ Internship completed"
            : internship.status === "IN_PROGRESS"
              ? "⏳ In progress"
              : "❌ Not started",
      },

      verification: {
        score: internship.verificationStatus === "INSTITUTION_VERIFIED" ? 100 : 50,
        description: "Institutional verification",
        status: internship.verificationStatus,
        feedback:
          internship.verificationStatus === "INSTITUTION_VERIFIED"
            ? "✅ Verified"
            : internship.verificationStatus === "REJECTED"
              ? "❌ Rejected - resubmit required"
              : "⏳ Pending verification",
      },
    },

    recommendations: generateRecommendations({
      checkIns: checkIns.length,
      evidence: evidence.length,
      status: internship.status,
      verificationStatus: internship.verificationStatus,
    }),
  };

  return scorecard;
}

/**
 * Calculate quality score
 */
function calculateQualityScore(params: {
  checkIns: number;
  evidence: number;
  status: string;
  verificationStatus: string;
}): number {
  const documentationScore = Math.min(100, params.evidence * 15);
  const progressScore = Math.min(100, params.checkIns * 12);
  const completionScore = params.status === "COMPLETED" ? 100 : params.status === "IN_PROGRESS" ? 60 : 30;
  const verificationScore =
    params.verificationStatus === "INSTITUTION_VERIFIED"
      ? 100
      : params.verificationStatus === "REJECTED"
        ? 0
        : 50;

  return Math.round((documentationScore + progressScore + completionScore + verificationScore) / 4);
}

/**
 * Generate recommendations
 */
function generateRecommendations(params: {
  checkIns: number;
  evidence: number;
  status: string;
  verificationStatus: string;
}): string[] {
  const recommendations: string[] = [];

  if (params.evidence < 3) {
    recommendations.push("Upload at least 3 evidence documents (offer letter, completion cert, report)");
  }

  if (params.checkIns < 8) {
    recommendations.push(`Record ${8 - params.checkIns} more progress updates`);
  }

  if (params.status !== "COMPLETED") {
    recommendations.push("Mark internship as completed when finished");
  }

  if (params.verificationStatus === "PENDING") {
    recommendations.push("Submit for faculty verification");
  }

  if (params.verificationStatus === "REJECTED") {
    recommendations.push("Address feedback and resubmit for verification");
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ Internship profile is complete and verified!");
  }

  return recommendations;
}

// ============================================================================
// TREND ANALYSIS
// ============================================================================

/**
 * Get internship trends over time
 */
export async function getInternshipTrendsOverTime(
  departmentId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDatabase();

  const students = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.departmentId, departmentId));

  const studentIds = students.map((s) => s.id);

  // Group by month
  const monthlyTrends: Record<string, any> = {};

  let internships_list: typeof internships.$inferSelect[] = [];
  if (studentIds.length > 0) {
    internships_list = await db
      .select()
      .from(internships)
      .where(
        and(
          inArray(internships.studentId, studentIds),
          gte(internships.createdAt, startDate),
          lte(internships.createdAt, endDate)
        )
      );
  }

  internships_list.forEach((i) => {
    const monthKey = new Date(i.createdAt).toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyTrends[monthKey]) {
      monthlyTrends[monthKey] = {
        month: monthKey,
        total: 0,
        completed: 0,
        inProgress: 0,
        applied: 0,
      };
    }
    monthlyTrends[monthKey].total++;
    if (i.status === "COMPLETED") monthlyTrends[monthKey].completed++;
    if (i.status === "IN_PROGRESS") monthlyTrends[monthKey].inProgress++;
    if (i.status === "APPLIED") monthlyTrends[monthKey].applied++;
  });

  return Object.values(monthlyTrends).sort((a, b) => a.month.localeCompare(b.month));
}
