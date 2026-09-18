import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Phase 14 & 15 End-to-End Account Creation, Approvals & Email Workflow", () => {
  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "test-user-openid",
      name: "Dr. Anand Verma",
      email: "faculty@northstar.edu",
      loginMethod: "email",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  const caller = appRouter.createCaller(ctx);

  it("completes student enrollment -> HOD approvals -> provisioning & credential dispatch", async () => {
    const studentData = {
      name: "Aditya Kulkarni",
      collegeEmail: `aditya.kulkarni.${Date.now()}@northstar.edu`,
      personalEmail: "aditya.personal@gmail.com",
      enrollmentNumber: `CSE${Date.now().toString().slice(-4)}`,
      program: "B.Tech Computer Science and Engineering",
      batch: "2022-2026",
      currentSemester: 6,
      sectionDivision: "Div B",
      admissionYear: 2022,
      graduationYear: 2026,
    };

    // 1. Faculty submits student enrollment
    const submittedReq = await caller.faculty.submitStudentEnrollment({
      classId: "CSE-SEM6-B",
      departmentId: "dept-cse-001",
      studentData,
    });

    expect(submittedReq.id).toBeDefined();
    expect(submittedReq.status).toBe("PENDING");
    expect(submittedReq.studentData.name).toBe("Aditya Kulkarni");

    // 2. HOD fetches pending requests - the new student request MUST be present
    const pendingRequests = await caller.hod.getPendingStudentRequests();
    const found = pendingRequests.find((r) => r.id === submittedReq.id);
    expect(found).toBeDefined();
    expect(found?.studentData.collegeEmail).toBe(studentData.collegeEmail);

    // 3. HOD approves the student enrollment
    const approvalResult = await caller.hod.processStudentEnrollments({
      requestIds: [submittedReq.id],
      action: "APPROVE",
    });

    expect(approvalResult.processedCount).toBe(1);
    expect(approvalResult.action).toBe("APPROVE");

    // 4. Request should no longer be pending
    const pendingAfterApproval = await caller.hod.getPendingStudentRequests();
    const stillPending = pendingAfterApproval.find((r) => r.id === submittedReq.id);
    expect(stillPending).toBeUndefined();

    // 5. Faculty wards list should now include the new student
    const wards = await caller.faculty.getWards();
    const wardMatch = wards.find((w: any) => w.enrollmentNumber === studentData.enrollmentNumber);
    expect(wardMatch).toBeDefined();
    expect(wardMatch?.name).toBe("Aditya Kulkarni");

    // 6. Admin students list should now include the new student
    const adminStudents = await caller.admin.listStudents();
    const studentMatch = adminStudents.find((s: any) => s.enrollmentNumber === studentData.enrollmentNumber);
    expect(studentMatch).toBeDefined();
    expect(studentMatch?.name).toBe("Aditya Kulkarni");
  });

  it("completes faculty onboarding request -> Admin approvals -> faculty directory & credential dispatch", async () => {
    const facultyData = {
      name: "Dr. Neha Sengupta",
      email: `neha.sengupta.${Date.now()}@northstar.edu`,
      phone: "+91 98333 44556",
      facultyId: `FAC-CS-${Date.now().toString().slice(-3)}`,
      designation: "Associate Professor",
      specialization: "Artificial Intelligence & ML",
      highestQualification: "Ph.D. in AI",
    };

    // 1. HOD requests faculty account onboarding
    const requestedReq = await caller.hod.requestFaculty({
      requestType: "CREATE",
      departmentId: "dept-cse-001",
      facultyData,
    });

    expect(requestedReq.id).toBeDefined();
    expect(requestedReq.status).toBe("PENDING");
    expect(requestedReq.facultyData?.name).toBe("Dr. Neha Sengupta");

    // 2. Admin views pending faculty requests - the request MUST appear
    const pendingRequests = await caller.admin.getPendingFacultyRequests();
    const found = pendingRequests.find((r) => r.id === requestedReq.id);
    expect(found).toBeDefined();
    expect(found?.facultyData?.email).toBe(facultyData.email);

    // 3. Admin approves faculty onboarding
    const approvalResult = await caller.admin.processFacultyRequests({
      requestIds: [requestedReq.id],
      action: "APPROVE",
    });

    expect(approvalResult.processedCount).toBe(1);
    expect(approvalResult.action).toBe("APPROVE");

    // 4. Request should no longer be pending
    const pendingAfterApproval = await caller.admin.getPendingFacultyRequests();
    const stillPending = pendingAfterApproval.find((r) => r.id === requestedReq.id);
    expect(stillPending).toBeUndefined();

    // 5. Admin and HOD faculty roster must now list the new faculty member
    const facultyList = await caller.admin.listFaculty();
    const facultyMatch = facultyList.find((f: any) => f.email === facultyData.email);
    expect(facultyMatch).toBeDefined();
    expect(facultyMatch?.name).toBe("Dr. Neha Sengupta");
    expect(facultyMatch?.role).toBe("FACULTY");
  });
});
