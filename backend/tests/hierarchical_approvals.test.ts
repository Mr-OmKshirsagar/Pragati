import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "../src/routers";
import { getDb } from "../src/db";
import {
  institutions,
  departments,
  users,
  studentProfiles,
  studentEnrollmentRequests,
  facultyOnboardingRequests,
  classAllocations,
  subjects,
} from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import type { Context } from "../src/_core/context";

// Helper to create test context
function createTestContext(userOverrides: Partial<Context["user"]>): Context {
  return {
    req: {} as any,
    res: {} as any,
    user: {
      id: userOverrides.id || crypto.randomUUID(),
      email: userOverrides.email || "test@northstar.edu",
      role: userOverrides.role || "STUDENT",
      institutionId: userOverrides.institutionId || "10000000-0000-0000-0000-000000000000",
      departmentId: userOverrides.departmentId || null,
      name: userOverrides.name || "Test User",
      ...userOverrides,
    } as any,
  };
}

describe("Phase 14: Hierarchical Provisioning, Academic Scoping & Two-Tier Approvals", () => {
  let instId: string;
  let deptAId: string;
  let deptBId: string;
  let facultyAId: string;
  let facultyA2Id: string;
  let hodAId: string;
  let hodBId: string;
  let adminId: string;
  let subjectId: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable for tests");

    // 1. Create Test Institution
    const [inst] = await db
      .insert(institutions)
      .values({
        name: "Phase 14 Test Engineering College",
        code: `P14-ENG-${Date.now()}`,
        status: "ACTIVE",
      })
      .returning();
    instId = inst.id;

    // 2. Create Departments A and B
    const [deptA] = await db
      .insert(departments)
      .values({
        institutionId: instId,
        name: "Computer Science and Engineering",
        code: "CSE-14",
      })
      .returning();
    deptAId = deptA.id;

    const [deptB] = await db
      .insert(departments)
      .values({
        institutionId: instId,
        name: "Mechanical Engineering",
        code: "MECH-14",
      })
      .returning();
    deptBId = deptB.id;

    // 3. Create Admin
    adminId = crypto.randomUUID();
    await db.insert(users).values({
      id: adminId,
      institutionId: instId,
      name: "College Administrator",
      email: `admin.${Date.now()}@p14college.edu`,
      role: "ADMIN",
      isActive: true,
    });

    // 4. Create HOD for Dept A
    hodAId = crypto.randomUUID();
    await db.insert(users).values({
      id: hodAId,
      institutionId: instId,
      departmentId: deptAId,
      name: "Dr. Sunita Rao (HOD CSE)",
      email: `hod.cse.${Date.now()}@p14college.edu`,
      role: "HOD",
      isActive: true,
    });

    // 5. Create HOD for Dept B
    hodBId = crypto.randomUUID();
    await db.insert(users).values({
      id: hodBId,
      institutionId: instId,
      departmentId: deptBId,
      name: "Dr. Vikram Joshi (HOD MECH)",
      email: `hod.mech.${Date.now()}@p14college.edu`,
      role: "HOD",
      isActive: true,
    });

    // 6. Create Faculty Members in Dept A
    facultyAId = crypto.randomUUID();
    await db.insert(users).values({
      id: facultyAId,
      institutionId: instId,
      departmentId: deptAId,
      name: "Prof. Anand Verma",
      email: `anand.verma.${Date.now()}@p14college.edu`,
      role: "FACULTY",
      isActive: true,
    });

    facultyA2Id = crypto.randomUUID();
    await db.insert(users).values({
      id: facultyA2Id,
      institutionId: instId,
      departmentId: deptAId,
      name: "Prof. Rajesh Gupta",
      email: `rajesh.gupta.${Date.now()}@p14college.edu`,
      role: "FACULTY",
      isActive: true,
    });

    // 7. Create a subject for Dept A
    const [sub] = await db
      .insert(subjects)
      .values({
        institutionId: instId,
        departmentId: deptAId,
        name: "Operating Systems",
        code: `CS401-${Date.now()}`,
        credits: 4,
        semester: 6,
      })
      .returning();
    subjectId = sub.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db || !instId) return;
    try {
      await db.delete(institutions).where(eq(institutions.id, instId));
    } catch (e) {
      console.warn("Cleanup warning:", e);
    }
  });

  // ==========================================================================
  // TEST 1: Public Self-Registration Lockout (403 FORBIDDEN)
  // ==========================================================================
  it("should forbid public self-registration with a 403 error", async () => {
    const publicCtx: Context = {
      req: {} as any,
      res: {} as any,
      user: null as any,
    };
    const publicCaller = appRouter.createCaller(publicCtx);

    await expect(
      publicCaller.auth.register({
        name: "Rogue User",
        email: "rogue@gmail.com",
      })
    ).rejects.toThrowError(/Public self-registration is strictly disabled/);

    await expect(
      publicCaller.auth.selfRegister({
        name: "Rogue User 2",
        email: "rogue2@gmail.com",
      })
    ).rejects.toThrowError(/Public self-registration is strictly disabled/);
  });

  // ==========================================================================
  // TEST 2: Student Enrollment Flow (Faculty -> HOD Bulk Approval)
  // ==========================================================================
  it("should allow Class Teacher to submit students, and HOD to bulk approve into users with must_change_password: true", async () => {
    const facultyCtx = createTestContext({
      id: facultyAId,
      institutionId: instId,
      departmentId: deptAId,
      role: "FACULTY",
    });
    const facultyCaller = appRouter.createCaller(facultyCtx);

    const submittedRequestIds: string[] = [];
    const timestamp = Date.now();

    // Submit 5 student enrollment requests
    for (let i = 1; i <= 5; i++) {
      const res = await facultyCaller.faculty.submitStudentEnrollment({
        classId: "CSE-SEM6-A",
        departmentId: deptAId,
        studentData: {
          name: `Cohort Student ${i}`,
          collegeEmail: `student${i}.${timestamp}@p14college.edu`,
          enrollmentNumber: `PRN-2024-00${i}-${timestamp}`,
          program: "B.Tech Computer Science and Engineering",
          batch: "2022-2026",
          currentSemester: 6,
          sectionDivision: "Div A",
          parentPhone: `+91 98220 0000${i}`,
        },
      });

      expect(res.status).toBe("PENDING");
      expect(res.submittedBy).toBe(facultyAId);
      submittedRequestIds.push(res.id);
    }

    expect(submittedRequestIds.length).toBe(5);

    // HOD A views pending requests
    const hodACtx = createTestContext({
      id: hodAId,
      institutionId: instId,
      departmentId: deptAId,
      role: "HOD",
    });
    const hodACaller = appRouter.createCaller(hodACtx);

    const pendingList = await hodACaller.hod.getPendingStudentRequests({
      departmentId: deptAId,
    });
    expect(pendingList.length).toBeGreaterThanOrEqual(5);

    // HOD A bulk approves all 5 students
    const bulkResult = await hodACaller.hod.processStudentEnrollments({
      requestIds: submittedRequestIds,
      action: "APPROVE",
      departmentId: deptAId,
    });

    expect(bulkResult.processedCount).toBe(5);
    expect(bulkResult.action).toBe("APPROVE");

    // Verify database state: users must exist with mustChangePassword = true
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const approvedRequests = await db
      .select()
      .from(studentEnrollmentRequests)
      .where(inArray(studentEnrollmentRequests.id, submittedRequestIds));

    for (const req of approvedRequests) {
      expect(req.status).toBe("APPROVED");
      expect(req.reviewedBy).toBe(hodAId);
      expect(req.createdUserId).toBeDefined();

      // Check users table
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.createdUserId!))
        .limit(1);

      expect(user).toBeDefined();
      expect(user.role).toBe("STUDENT");
      expect(user.mustChangePassword).toBe(true);
      expect(user.isActive).toBe(true);

      // Check studentProfiles table
      const [profile] = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, user.id))
        .limit(1);

      expect(profile).toBeDefined();
      expect(profile.institutionId).toBe(instId);
      expect(profile.departmentId).toBe(deptAId);
      expect(profile.assignedFacultyId).toBe(facultyAId);
    }
  });

  // ==========================================================================
  // TEST 3: Faculty Onboarding Flow (HOD -> Admin Rejection with Reason)
  // ==========================================================================
  it("should allow HOD to request faculty creation, and Admin to reject with reason without creating user", async () => {
    const hodACtx = createTestContext({
      id: hodAId,
      institutionId: instId,
      departmentId: deptAId,
      role: "HOD",
    });
    const hodACaller = appRouter.createCaller(hodACtx);

    const facultyEmail = `candidate.fac.${Date.now()}@p14college.edu`;

    const request = await hodACaller.hod.requestFaculty({
      requestType: "CREATE",
      departmentId: deptAId,
      facultyData: {
        name: "Dr. Rejected Candidate",
        email: facultyEmail,
        designation: "Assistant Professor",
        specialization: "Quantum Computing",
        highestQualification: "Ph.D.",
      },
    });

    expect(request.status).toBe("PENDING");

    // Admin views and rejects the request
    const adminCtx = createTestContext({
      id: adminId,
      institutionId: instId,
      role: "ADMIN",
    });
    const adminCaller = appRouter.createCaller(adminCtx);

    const pendingFaculty = await adminCaller.admin.getPendingFacultyRequests();
    const found = pendingFaculty.find((f: any) => f.id === request.id);
    expect(found).toBeDefined();

    const rejectRes = await adminCaller.admin.processFacultyRequests({
      requestIds: [request.id],
      action: "REJECT",
      rejectionReason: "Department faculty quota currently full for this academic year.",
    });

    expect(rejectRes.processedCount).toBe(1);
    expect(rejectRes.action).toBe("REJECT");

    // Verify in DB that no user account was created
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, facultyEmail))
      .limit(1);

    expect(user).toBeUndefined();

    // Verify request row status
    const [updatedReq] = await db
      .select()
      .from(facultyOnboardingRequests)
      .where(eq(facultyOnboardingRequests.id, request.id))
      .limit(1);

    expect(updatedReq.status).toBe("REJECTED");
    expect(updatedReq.reviewNotes).toContain("quota currently full");
    expect(updatedReq.reviewedBy).toBe(adminId);
  });

  // ==========================================================================
  // TEST 4: Leadership Role Reassignment & Graceful HOD Succession
  // ==========================================================================
  it("should reassign Faculty to HOD with graceful automatic demotion of the prior HOD", async () => {
    const adminCtx = createTestContext({
      id: adminId,
      institutionId: instId,
      role: "ADMIN",
    });
    const adminCaller = appRouter.createCaller(adminCtx);

    // Initial check: hodAId is HOD, facultyA2Id is FACULTY
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [priorHod] = await db.select().from(users).where(eq(users.id, hodAId));
    expect(priorHod.role).toBe("HOD");

    const [candidate] = await db.select().from(users).where(eq(users.id, facultyA2Id));
    expect(candidate.role).toBe("FACULTY");

    // Admin appoints candidate (facultyA2Id) as new HOD of Dept A
    const updated = await adminCaller.admin.reassignFacultyDesignation({
      facultyUserId: facultyA2Id,
      newRole: "HOD",
      departmentId: deptAId,
    });

    expect(updated.role).toBe("HOD");
    expect(updated.id).toBe(facultyA2Id);

    // Verify prior HOD (hodAId) was gracefully transitioned to FACULTY
    const [demotedPriorHod] = await db.select().from(users).where(eq(users.id, hodAId));
    expect(demotedPriorHod.role).toBe("FACULTY");

    // Now reassign candidate to T&P Coordinator
    const tnpUpdate = await adminCaller.admin.reassignFacultyDesignation({
      facultyUserId: facultyA2Id,
      newRole: "TNP_COORDINATOR",
    });

    expect(tnpUpdate.role).toBe("TNP_COORDINATOR");
  });

  // ==========================================================================
  // TEST 5: Departmental Boundary Isolation
  // ==========================================================================
  it("should forbid an HOD from Department A from approving requests submitted in Department B", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Faculty submits request in Dept B
    const facultyCtx = createTestContext({
      id: facultyAId,
      institutionId: instId,
      departmentId: deptBId,
      role: "FACULTY",
    });
    const facultyCaller = appRouter.createCaller(facultyCtx);

    const reqB = await facultyCaller.faculty.submitStudentEnrollment({
      classId: "MECH-SEM4-A",
      departmentId: deptBId,
      studentData: {
        name: "Mechanical Student",
        collegeEmail: `mech.student.${Date.now()}@p14college.edu`,
        enrollmentNumber: `PRN-MECH-${Date.now()}`,
        program: "B.Tech Mechanical Engineering",
        batch: "2023-2027",
        currentSemester: 4,
      },
    });

    // HOD of Department A tries to approve Dept B request
    const hodACtx = createTestContext({
      id: hodAId,
      institutionId: instId,
      departmentId: deptAId, // Mismatched department!
      role: "HOD",
    });
    const hodACaller = appRouter.createCaller(hodACtx);

    await expect(
      hodACaller.hod.processStudentEnrollments({
        requestIds: [reqB.id],
        action: "APPROVE",
        departmentId: deptAId, // Caller's department
      })
    ).rejects.toThrowError(/Departmental Boundary Violation/);
  });

  // ==========================================================================
  // TEST 6: Class Allocation and Subject Teacher Mapping
  // ==========================================================================
  it("should allow HOD to create a class allocation and map Class and Subject teachers", async () => {
    const hodACtx = createTestContext({
      id: hodAId,
      institutionId: instId,
      departmentId: deptAId,
      role: "HOD",
    });
    const hodACaller = appRouter.createCaller(hodACtx);

    // 1. Create Class
    const newClass = await hodACaller.hod.createClass({
      className: "Final Year CSE - Div Alpha",
      academicYear: "2024-2025",
      semester: 7,
      departmentId: deptAId,
    });

    expect(newClass.id).toBeDefined();
    expect(newClass.className).toBe("Final Year CSE - Div Alpha");

    // 2. Assign Class Teacher
    const assigned = await hodACaller.hod.assignClassTeacher({
      classId: newClass.id,
      facultyId: facultyAId,
    });

    expect(assigned.classTeacherId).toBe(facultyAId);

    // 3. List Classes
    const classList = await hodACaller.hod.listClasses({ departmentId: deptAId });
    const foundClass = classList.find((c: any) => c.id === newClass.id);
    expect(foundClass).toBeDefined();
    expect(foundClass?.classTeacherId).toBe(facultyAId);

    // 4. Assign Subject Teacher
    const subjectAssignment = await hodACaller.hod.assignSubjectTeacher({
      departmentId: deptAId,
      subjectId,
      facultyId: facultyAId,
      classId: newClass.id,
      semester: 6,
      academicYear: "2024-2025",
      role: "LEAD_INSTRUCTOR",
    });

    expect(subjectAssignment).toBeDefined();
    expect(subjectAssignment.facultyId).toBe(facultyAId);
    expect(subjectAssignment.subjectId).toBe(subjectId);
  });
});
