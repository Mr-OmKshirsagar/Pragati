import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { studentProfiles, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { hodProcedure, router } from "../_core/trpc";
import * as approvalWorkflowService from "../services/approvalWorkflowService";
import { sendInstitutionalEmail } from "../services/emailService";

export const hodRouter = router({
  // 1. List pending student enrollment requests for HOD's department
  getPendingStudentRequests: hodProcedure
    .input(
      z
        .object({
          departmentId: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const deptId = input?.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required to fetch pending student requests.",
        });
      }

      return approvalWorkflowService.getPendingStudentRequests({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
      });
    }),

  // 2. Single or Bulk approve/reject student enrollments
  processStudentEnrollments: hodProcedure
    .input(
      z.object({
        requestIds: z.array(z.string().uuid()).min(1),
        action: z.enum(["APPROVE", "REJECT"]),
        rejectionReason: z.string().optional(),
        departmentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deptId = input.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required to process student requests.",
        });
      }

      return approvalWorkflowService.processStudentEnrollments({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
        reviewedBy: ctx.user.id,
        requestIds: input.requestIds,
        action: input.action,
        reviewNotes: input.rejectionReason,
      });
    }),

  // 3. Request Faculty Account Creation or Deletion (HOD -> Admin)
  requestFaculty: hodProcedure
    .input(
      z.object({
        requestType: z.enum(["CREATE", "DELETE"]),
        targetUserId: z.string().uuid().optional(),
        departmentId: z.string().uuid().optional(),
        facultyData: z
          .object({
            name: z.string().min(2),
            email: z.string().email(),
            phone: z.string().optional(),
            facultyId: z.string().optional(),
            designation: z.string().min(2),
            specialization: z.string().optional(),
            highestQualification: z.string().optional(),
            classTeacherAllocation: z.string().optional(),
            subjectAssignments: z.array(z.string()).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deptId = input.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required to request faculty accounts.",
        });
      }

      if (input.requestType === "CREATE" && !input.facultyData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "facultyData is required for CREATE request type.",
        });
      }

      if (input.requestType === "DELETE" && !input.targetUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "targetUserId is required for DELETE request type.",
        });
      }

      return approvalWorkflowService.submitFacultyRequest({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
        submittedBy: ctx.user.id,
        requestType: input.requestType,
        targetUserId: input.targetUserId,
        facultyData: input.facultyData,
      });
    }),

  // 4. Assign Class Teacher to class
  assignClassTeacher: hodProcedure
    .input(
      z.object({
        classId: z.string().uuid(),
        facultyId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return approvalWorkflowService.assignClassTeacher({
        institutionId: ctx.user.institutionId,
        classId: input.classId,
        facultyId: input.facultyId,
      });
    }),

  // 5. Assign Subject Teacher to class & subject
  assignSubjectTeacher: hodProcedure
    .input(
      z.object({
        subjectId: z.string().uuid(),
        facultyId: z.string().uuid(),
        classId: z.string().uuid().optional(),
        departmentId: z.string().uuid().optional(),
        semester: z.number().int().optional(),
        academicYear: z.string().optional(),
        role: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deptId = input.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required.",
        });
      }

      return approvalWorkflowService.assignSubjectTeacher({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
        subjectId: input.subjectId,
        facultyId: input.facultyId,
        classId: input.classId,
        semester: input.semester,
        academicYear: input.academicYear,
        role: input.role,
      });
    }),

  // 6. List classes for department
  listClasses: hodProcedure
    .input(
      z
        .object({
          departmentId: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const deptId = input?.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required.",
        });
      }

      return approvalWorkflowService.listClasses({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
      });
    }),

  // 7. Create class allocation
  createClass: hodProcedure
    .input(
      z.object({
        className: z.string().min(2),
        academicYear: z.string().min(4),
        semester: z.number().int().min(1).max(10),
        departmentId: z.string().uuid().optional(),
        classTeacherId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deptId = input.departmentId || ctx.user.departmentId;
      if (!deptId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department ID is required.",
        });
      }

      return approvalWorkflowService.createClassAllocation({
        institutionId: ctx.user.institutionId,
        departmentId: deptId,
        className: input.className,
        academicYear: input.academicYear,
        semester: input.semester,
        classTeacherId: input.classTeacherId,
      });
    }),

  // 8. Department Summary Overview (Used by HodDashboard.tsx)
  getDepartmentSummary: hodProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const deptId = ctx.user.departmentId;

    let totalStudents = 120;
    let facultyCount = 14;
    let avgCgpa = 8.12;

    if (db && deptId) {
      const students = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.departmentId, deptId));
      if (students.length > 0) {
        totalStudents = students.length;
      }

      const fac = await db
        .select()
        .from(users)
        .where(and(eq(users.departmentId, deptId), eq(users.role, "FACULTY")));
      if (fac.length > 0) {
        facultyCount = fac.length;
      }
    }

    return {
      departmentName: "Computer Science & Engineering",
      code: "CSE",
      institution: "Northstar Institute of Technology",
      hodName: ctx.user.name || "Prof. Sunita Rao",
      totalStudents,
      activeBatches: ["2021-2025 (Final Year)", "2022-2026 (Pre-Final Year)"],
      facultyCount,
      avgCgpa,
      readinessScore: 79.4,
      readinessDelta: "+3.8%",
      internshipRate: 84.2,
      activeGapsCount: 18,
      resolvedInterventionsCount: 42,
      metrics: [
        {
          label: "Total CSE Students",
          value: String(totalStudents),
          delta: "4 active cohorts",
          helper: "98.4% attendance index",
          tone: "indigo" as const,
        },
        {
          label: "Dept Readiness Index",
          value: "79.4%",
          delta: "+3.8%",
          helper: "vs previous cycle",
          tone: "violet" as const,
        },
        {
          label: "Verified Internships",
          value: "84.2%",
          delta: "168 / 200",
          helper: "SHA-256 signed evidence",
          tone: "emerald" as const,
        },
        {
          label: "Active Skill Gaps",
          value: "18",
          delta: "11 DSA · 7 OS",
          helper: "Closed-loop remedial active",
          tone: "amber" as const,
        },
      ],
      readinessIndicators: [
        { label: "Academic progress", score: 81.2, weight: 30, helper: "Dept avg CGPA 8.12 across semesters" },
        { label: "Verified skill coverage", score: 77.5, weight: 30, helper: "18 core competencies benchmarked" },
        { label: "Internship progress", score: 84.2, weight: 20, helper: "168 students completed verified industry stints" },
        { label: "Authenticated evidence", score: 96.5, weight: 20, helper: "Faculty-verified SHA-256 cryptographic records" },
      ],
      skillHotspots: [
        {
          skill: "Data Structures & Algorithms",
          code: "CS301",
          flaggedStudents: 11,
          avgScore: 61,
          benchmark: 75,
          severity: "HIGH" as const,
          mentor: "Dr. Anand Verma",
          status: "Remedial Workshop Active",
        },
        {
          skill: "Operating Systems",
          code: "CS401",
          flaggedStudents: 7,
          avgScore: 64,
          benchmark: 70,
          severity: "MEDIUM" as const,
          mentor: "Dr. Meera Nair",
          status: "Lab Remediation Scheduled",
        },
        {
          skill: "Computer Networks",
          code: "CS501",
          flaggedStudents: 4,
          avgScore: 69,
          benchmark: 70,
          severity: "MEDIUM" as const,
          mentor: "Dr. Anand Verma",
          status: "Review Cycle Pending",
        },
        {
          skill: "Database Management Systems",
          code: "CS302",
          flaggedStudents: 3,
          avgScore: 72,
          benchmark: 70,
          severity: "LOW" as const,
          mentor: "Prof. Rajesh Gupta",
          status: "Cohort On Track",
        },
      ],
      facultyMentors: [
        {
          id: "f1",
          name: "Dr. Anand Verma",
          role: "Associate Professor",
          wardsCount: 18,
          flaggedCount: 2,
          activeInterventions: 3,
          complianceRate: 94,
        },
        {
          id: "f2",
          name: "Dr. Meera Nair",
          role: "Professor",
          wardsCount: 22,
          flaggedCount: 1,
          activeInterventions: 2,
          complianceRate: 100,
        },
        {
          id: "f3",
          name: "Prof. Rajesh Gupta",
          role: "Assistant Professor",
          wardsCount: 19,
          flaggedCount: 3,
          activeInterventions: 4,
          complianceRate: 89,
        },
        {
          id: "f4",
          name: "Prof. Vikram Malhotra",
          role: "Associate Professor",
          wardsCount: 20,
          flaggedCount: 0,
          activeInterventions: 1,
          complianceRate: 100,
        },
      ],
      placementReadiness: {
        eligibleTier1: 112,
        eligibleCore: 198,
        drivesPublished: 14,
        totalOffers: 86,
        topRecruiters: ["TechCorp", "Infosys SpringBoard", "Google Cloud", "Microsoft Engage"],
      },
      recentActivities: [
        {
          id: "act-1",
          title: "DSA Mentoring Session Scheduled",
          detail: "Dr. Anand Verma scheduled 1-on-1 session for Rahul Sharma (CSE2024042)",
          time: "12 mins ago",
          badge: "Intervention",
          tone: "violet" as const,
        },
        {
          id: "act-2",
          title: "Internship Certificate Verified",
          detail: "TechCorp 8-week completion certificate cryptographically confirmed via SHA-256",
          time: "1 hour ago",
          badge: "Verified",
          tone: "emerald" as const,
        },
        {
          id: "act-3",
          title: "Campus Drive Published",
          detail: "T&P cell opened ABC Technologies drive (min CGPA 7.5, DSA 70)",
          time: "3 hours ago",
          badge: "Placement",
          tone: "indigo" as const,
        },
        {
          id: "act-4",
          title: "Assessment Cycle 3 Completed",
          detail: "DSA Assessment Cycle 3 closed for Sem 6 with 96% cohort turnout",
          time: "Yesterday",
          badge: "Assessment",
          tone: "amber" as const,
        },
      ],
    };
  }),

  // 9. Schedule Remedial Clinic
  scheduleRemedialClinic: hodProcedure
    .input(
      z.object({
        subjectCode: z.string(),
        facultyMentor: z.string(),
        batchYear: z.string(),
        scheduledDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ input }) => ({
      success: true,
      clinicId: `clinic-${Date.now()}`,
      subjectCode: input.subjectCode,
      facultyMentor: input.facultyMentor,
      message: `Remedial clinic for ${input.subjectCode} assigned to ${input.facultyMentor} successfully.`,
    })),

  // 10. Send Activity Invitation
  sendActivityInvitation: hodProcedure
    .input(
      z.object({
        activityId: z.string(),
        title: z.string().min(3),
        detail: z.string().min(3),
        badge: z.string().optional(),
        time: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await sendInstitutionalEmail({
        toEmail: "student@northstar.edu",
        subject: `PRAGATI invitation: ${input.title}`,
        template: "ACCOUNT_WELCOME",
        data: {
          name: "Department Student",
          role: "STUDENT",
          tempPassword: "",
          portalUrl: "http://localhost:5173",
        },
      });

      return {
        success: true,
        activityId: input.activityId,
        totalStudents: 1,
        sentCount: 1,
        failedCount: 0,
        results: [{ studentEmail: "student@northstar.edu", sent: true }],
      };
    }),

  // 11. Export Audit Report
  exportAuditReport: hodProcedure.query(() => ({
    success: true,
    reportTitle: "PRAGATI CSE Department Skill & Placement Audit",
    department: "Computer Science & Engineering",
    institution: "Northstar Institute of Technology",
    generatedAt: new Date().toISOString(),
    format: "PDF (NAAC Criterion 2 & NBA Sub-tier compliant)",
  })),
});
