import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  classAllocations,
  departments,
  facultyOnboardingRequests,
  facultySubjectAssignments,
  studentEnrollmentRequests,
  studentProfiles,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";

// ============================================================================
// 1. STUDENT ENROLLMENT WORKFLOW (Class Teacher -> HOD)
// ============================================================================

export interface StudentEnrollmentPayload {
  name: string;
  collegeEmail: string;
  personalEmail?: string;
  mobilePhone?: string;
  parentPhone?: string;
  enrollmentNumber: string;
  program: string;
  batch: string;
  currentSemester: number;
  sectionDivision?: string;
  admissionYear?: number;
  graduationYear?: number;
}

export async function submitStudentEnrollment(params: {
  institutionId: string;
  departmentId: string;
  classId: string;
  submittedBy: string;
  studentData: StudentEnrollmentPayload;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

  const [request] = await db
    .insert(studentEnrollmentRequests)
    .values({
      institutionId: params.institutionId,
      departmentId: params.departmentId,
      classId: params.classId,
      submittedBy: params.submittedBy,
      studentData: params.studentData as any,
      status: "PENDING",
    })
    .returning();

  return request;
}

export async function getPendingStudentRequests(params: {
  institutionId: string;
  departmentId: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

  return db
    .select({
      id: studentEnrollmentRequests.id,
      institutionId: studentEnrollmentRequests.institutionId,
      departmentId: studentEnrollmentRequests.departmentId,
      classId: studentEnrollmentRequests.classId,
      submittedBy: studentEnrollmentRequests.submittedBy,
      studentData: studentEnrollmentRequests.studentData,
      status: studentEnrollmentRequests.status,
      createdAt: studentEnrollmentRequests.createdAt,
      submitterName: users.name,
      submitterEmail: users.email,
    })
    .from(studentEnrollmentRequests)
    .leftJoin(users, eq(studentEnrollmentRequests.submittedBy, users.id))
    .where(
      and(
        eq(studentEnrollmentRequests.institutionId, params.institutionId),
        eq(studentEnrollmentRequests.departmentId, params.departmentId),
        eq(studentEnrollmentRequests.status, "PENDING")
      )
    )
    .orderBy(desc(studentEnrollmentRequests.createdAt));
}

export async function processStudentEnrollments(params: {
  institutionId: string;
  departmentId: string;
  reviewedBy: string;
  requestIds: string[];
  action: "APPROVE" | "REJECT";
  reviewNotes?: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

  if (!params.requestIds.length) {
    return { processedCount: 0, action: params.action };
  }

  // 1. Fetch matching requests to enforce Departmental Boundary Isolation
  const requests = await db
    .select()
    .from(studentEnrollmentRequests)
    .where(inArray(studentEnrollmentRequests.id, params.requestIds));

  for (const req of requests) {
    if (req.institutionId !== params.institutionId || req.departmentId !== params.departmentId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Departmental Boundary Violation: Cannot review requests outside your department.",
      });
    }
  }

  const now = new Date();

  for (const req of requests) {
    if (params.action === "APPROVE") {
      const data = req.studentData as StudentEnrollmentPayload;
      const newUserId = crypto.randomUUID();

      // Check if user already exists with this email
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.collegeEmail))
        .limit(1);

      let targetUserId = existingUser?.id;

      if (!targetUserId) {
        targetUserId = newUserId;
        await db.insert(users).values({
          id: targetUserId,
          institutionId: req.institutionId,
          departmentId: req.departmentId,
          name: data.name,
          email: data.collegeEmail,
          role: "STUDENT",
          isActive: true,
          mustChangePassword: true,
        });
      }

      // Check if student profile exists
      const [existingProfile] = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, targetUserId))
        .limit(1);

      if (!existingProfile) {
        const admissionYear = data.admissionYear || new Date().getFullYear();
        const graduationYear = data.graduationYear || admissionYear + 4;

        await db.insert(studentProfiles).values({
          userId: targetUserId,
          institutionId: req.institutionId,
          departmentId: req.departmentId,
          assignedFacultyId: req.submittedBy,
          enrollmentNumber: data.enrollmentNumber,
          program: data.program || "B.Tech Computer Science and Engineering",
          section: data.sectionDivision || null,
          currentSemester: data.currentSemester || 1,
          admissionYear,
          graduationYear,
        });
      }

      await db
        .update(studentEnrollmentRequests)
        .set({
          status: "APPROVED",
          reviewedBy: params.reviewedBy,
          reviewedAt: now,
          createdUserId: targetUserId,
          reviewNotes: params.reviewNotes || null,
        })
        .where(eq(studentEnrollmentRequests.id, req.id));
    } else {
      await db
        .update(studentEnrollmentRequests)
        .set({
          status: "REJECTED",
          reviewedBy: params.reviewedBy,
          reviewedAt: now,
          reviewNotes: params.reviewNotes || "Rejected by HOD",
        })
        .where(eq(studentEnrollmentRequests.id, req.id));
    }
  }

  return { processedCount: requests.length, action: params.action };
}

// ============================================================================
// 2. FACULTY ONBOARDING WORKFLOW (HOD -> College Admin)
// ============================================================================

export interface FacultyOnboardingPayload {
  name: string;
  email: string;
  phone?: string;
  facultyId?: string;
  designation: string;
  specialization?: string;
  highestQualification?: string;
  classTeacherAllocation?: string;
  subjectAssignments?: string[];
}

export async function submitFacultyRequest(params: {
  institutionId: string;
  departmentId: string;
  submittedBy: string;
  requestType: "CREATE" | "DELETE";
  targetUserId?: string;
  facultyData?: FacultyOnboardingPayload;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

  const [request] = await db
    .insert(facultyOnboardingRequests)
    .values({
      institutionId: params.institutionId,
      departmentId: params.departmentId,
      submittedBy: params.submittedBy,
      requestType: params.requestType,
      targetUserId: params.targetUserId || null,
      facultyData: params.facultyData as any,
      status: "PENDING",
    })
    .returning();

  return request;
}

export async function getPendingFacultyRequests(params: { institutionId: string }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

  return db
    .select({
      id: facultyOnboardingRequests.id,
      institutionId: facultyOnboardingRequests.institutionId,
      departmentId: facultyOnboardingRequests.departmentId,
      submittedBy: facultyOnboardingRequests.submittedBy,
      requestType: facultyOnboardingRequests.requestType,
      targetUserId: facultyOnboardingRequests.targetUserId,
      facultyData: facultyOnboardingRequests.facultyData,
      status: facultyOnboardingRequests.status,
      createdAt: facultyOnboardingRequests.createdAt,
      departmentName: departments.name,
      submitterName: users.name,
      submitterEmail: users.email,
    })
    .from(facultyOnboardingRequests)
    .leftJoin(departments, eq(facultyOnboardingRequests.departmentId, departments.id))
    .leftJoin(users, eq(facultyOnboardingRequests.submittedBy, users.id))
    .where(
      and(
        eq(facultyOnboardingRequests.institutionId, params.institutionId),
        eq(facultyOnboardingRequests.status, "PENDING")
      )
    )
    .orderBy(desc(facultyOnboardingRequests.createdAt));
}

export async function processFacultyRequests(params: {
  institutionId: string;
  reviewedBy: string;
  requestIds: string[];
  action: "APPROVE" | "REJECT";
  reviewNotes?: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

  if (!params.requestIds.length) {
    return { processedCount: 0, action: params.action };
  }

  const requests = await db
    .select()
    .from(facultyOnboardingRequests)
    .where(
      and(
        inArray(facultyOnboardingRequests.id, params.requestIds),
        eq(facultyOnboardingRequests.institutionId, params.institutionId)
      )
    );

  const now = new Date();

  for (const req of requests) {
    if (params.action === "APPROVE") {
      if (req.requestType === "CREATE") {
        const data = req.facultyData as FacultyOnboardingPayload;
        const newUserId = crypto.randomUUID();

        // Check if user already exists with this email
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, data.email))
          .limit(1);

        if (!existingUser) {
          await db.insert(users).values({
            id: newUserId,
            institutionId: req.institutionId,
            departmentId: req.departmentId,
            name: data.name,
            email: data.email,
            role: "FACULTY",
            isActive: true,
            mustChangePassword: true,
          });
        }
      } else if (req.requestType === "DELETE" && req.targetUserId) {
        await db
          .update(users)
          .set({ isActive: false })
          .where(eq(users.id, req.targetUserId));
      }

      await db
        .update(facultyOnboardingRequests)
        .set({
          status: "APPROVED",
          reviewedBy: params.reviewedBy,
          reviewedAt: now,
          reviewNotes: params.reviewNotes || null,
        })
        .where(eq(facultyOnboardingRequests.id, req.id));
    } else {
      await db
        .update(facultyOnboardingRequests)
        .set({
          status: "REJECTED",
          reviewedBy: params.reviewedBy,
          reviewedAt: now,
          reviewNotes: params.reviewNotes || "Rejected by College Admin",
        })
        .where(eq(facultyOnboardingRequests.id, req.id));
    }
  }

  return { processedCount: requests.length, action: params.action };
}

// ============================================================================
// 3. ACADEMIC SCOPING & ROLE REASSIGNMENT (College Admin)
// ============================================================================

export async function reassignFacultyDesignation(params: {
  institutionId: string;
  facultyUserId: string;
  newRole: "FACULTY" | "HOD" | "TNP_COORDINATOR";
  departmentId?: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

  const [targetUser] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, params.facultyUserId),
        eq(users.institutionId, params.institutionId)
      )
    )
    .limit(1);

  if (!targetUser) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Target faculty member not found in this institution.",
    });
  }

  const effectiveDepartmentId = params.departmentId || targetUser.departmentId;

  // If appointing as HOD, ensure graceful demotion of any existing HOD in that department
  if (params.newRole === "HOD" && effectiveDepartmentId) {
    const existingHods = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.institutionId, params.institutionId),
          eq(users.departmentId, effectiveDepartmentId),
          eq(users.role, "HOD")
        )
      );

    for (const existingHod of existingHods) {
      if (existingHod.id !== params.facultyUserId) {
        await db
          .update(users)
          .set({ role: "FACULTY" })
          .where(eq(users.id, existingHod.id));
      }
    }
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      role: params.newRole,
      departmentId: effectiveDepartmentId,
    })
    .where(eq(users.id, params.facultyUserId))
    .returning();

  return updatedUser;
}

// ============================================================================
// 4. CLASS & SUBJECT ALLOCATIONS (HOD)
// ============================================================================

export async function listClasses(params: {
  institutionId: string;
  departmentId: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

  return db
    .select({
      id: classAllocations.id,
      className: classAllocations.className,
      academicYear: classAllocations.academicYear,
      semester: classAllocations.semester,
      classTeacherId: classAllocations.classTeacherId,
      classTeacherName: users.name,
      classTeacherEmail: users.email,
      createdAt: classAllocations.createdAt,
    })
    .from(classAllocations)
    .leftJoin(users, eq(classAllocations.classTeacherId, users.id))
    .where(
      and(
        eq(classAllocations.institutionId, params.institutionId),
        eq(classAllocations.departmentId, params.departmentId)
      )
    )
    .orderBy(desc(classAllocations.createdAt));
}

export async function createClassAllocation(params: {
  institutionId: string;
  departmentId: string;
  className: string;
  academicYear: string;
  semester: number;
  classTeacherId?: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

  const [created] = await db
    .insert(classAllocations)
    .values({
      institutionId: params.institutionId,
      departmentId: params.departmentId,
      className: params.className,
      academicYear: params.academicYear,
      semester: params.semester,
      classTeacherId: params.classTeacherId || null,
    })
    .returning();

  return created;
}

export async function assignClassTeacher(params: {
  institutionId: string;
  classId: string;
  facultyId: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

  const [updated] = await db
    .update(classAllocations)
    .set({ classTeacherId: params.facultyId })
    .where(
      and(
        eq(classAllocations.id, params.classId),
        eq(classAllocations.institutionId, params.institutionId)
      )
    )
    .returning();

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Class allocation not found." });
  }

  return updated;
}

export async function assignSubjectTeacher(params: {
  institutionId: string;
  departmentId: string;
  subjectId: string;
  facultyId: string;
  classId?: string;
  semester?: number;
  academicYear?: string;
  role?: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

  const semester = params.semester || 1;
  const academicYear = params.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  const [existing] = await db
    .select()
    .from(facultySubjectAssignments)
    .where(
      and(
        eq(facultySubjectAssignments.facultyId, params.facultyId),
        eq(facultySubjectAssignments.subjectId, params.subjectId),
        eq(facultySubjectAssignments.semester, semester)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(facultySubjectAssignments)
      .set({
        academicYear,
        role: params.role || "INSTRUCTOR",
      })
      .where(eq(facultySubjectAssignments.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(facultySubjectAssignments)
    .values({
      facultyId: params.facultyId,
      subjectId: params.subjectId,
      semester,
      academicYear,
      role: params.role || "INSTRUCTOR",
    })
    .returning();

  return created;
}
