import { COOKIE_NAME } from "@shared/const";
import { dashboardData, opportunitiesData, progressData, skillsData } from "@shared/pragati";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export type PragatiRole = "STUDENT" | "FACULTY" | "HOD" | "TNP_COORDINATOR" | "ADMIN";

export interface PragatiUser {
  id: string;
  name: string;
  email: string;
  role: PragatiRole;
  department: string;
  roleId: string;
  designation: string;
  avatar: string;
}

const DEMO_PERSONAS: Record<PragatiRole, PragatiUser & { demoPassword: string }> = {
  STUDENT: {
    id: "user-student-1",
    name: "Rahul Sharma",
    email: "rahul.sharma@northstar.edu",
    role: "STUDENT",
    department: "Computer Science & Engineering",
    roleId: "CS-2023-0842",
    designation: "B.Tech CSE · Sem 6",
    avatar: "RS",
    demoPassword: "password123",
  },
  FACULTY: {
    id: "user-faculty-1",
    name: "Dr. Meera Nair",
    email: "meera.nair@northstar.edu",
    role: "FACULTY",
    department: "Computer Science & Engineering",
    roleId: "FAC-CS-104",
    designation: "Associate Professor & Mentor",
    avatar: "MN",
    demoPassword: "password123",
  },
  HOD: {
    id: "user-hod-1",
    name: "Dr. Sunita Rao",
    email: "sunita.rao@northstar.edu",
    role: "HOD",
    department: "Computer Science & Engineering",
    roleId: "HOD-CSE-001",
    designation: "Head of Department (CSE)",
    avatar: "SR",
    demoPassword: "password123",
  },
  TNP_COORDINATOR: {
    id: "user-tnp-1",
    name: "Prof. Vikram Mehta",
    email: "vikram.mehta@northstar.edu",
    role: "TNP_COORDINATOR",
    department: "Training & Placement Cell",
    roleId: "TNP-ENG-042",
    designation: "Head of Training & Placement",
    avatar: "VM",
    demoPassword: "password123",
  },
  ADMIN: {
    id: "user-admin-1",
    name: "System Administrator",
    email: "admin@northstar.edu",
    role: "ADMIN",
    department: "Institutional Systems & Governance",
    roleId: "ADM-SYS-001",
    designation: "Platform Administrator",
    avatar: "SA",
    demoPassword: "password123",
  },
};

const usersStore: Map<string, PragatiUser & { passwordHash?: string }> = new Map(
  Object.values(DEMO_PERSONAS).map(user => [user.email.toLowerCase(), user])
);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    demoAccounts: publicProcedure.query(() => {
      return Object.values(DEMO_PERSONAS).map(({ demoPassword, ...user }) => ({
        ...user,
        hintPassword: demoPassword,
      }));
    }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
          role: z.enum(["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const found = usersStore.get(input.email.toLowerCase());
        if (!found) {
          // Allow demo login fallback if demo user was requested
          const demoFallback = DEMO_PERSONAS[input.role];
          if (demoFallback && (input.email.toLowerCase() === demoFallback.email.toLowerCase() || input.password === "password123")) {
            return { success: true, user: demoFallback };
          }
          throw new Error("Invalid credentials or account not found. Use a Demo Persona or Register.");
        }

        if (found.role !== input.role) {
          throw new Error(`Account registered as ${found.role}, not ${input.role}. Please select the correct role tab.`);
        }

        return { success: true, user: found };
      }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2),
          email: z.string().email(),
          password: z.string().min(6),
          role: z.enum(["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]),
          department: z.string().default("Computer Science & Engineering"),
          roleId: z.string().min(2),
          designation: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const key = input.email.toLowerCase();
        if (usersStore.has(key)) {
          throw new Error("An account with this email already exists. Please sign in instead.");
        }

        const initials = input.name
          .split(" ")
          .map(part => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "U";

        const newUser: PragatiUser = {
          id: `user-${Date.now()}`,
          name: input.name,
          email: input.email,
          role: input.role,
          department: input.department,
          roleId: input.roleId,
          designation: input.designation || `${input.role} (${input.department})`,
          avatar: initials,
        };

        usersStore.set(key, newUser);
        return { success: true, user: newUser };
      }),
    demoLogin: publicProcedure
      .input(z.object({ role: z.enum(["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]) }))
      .mutation(({ input }) => {
        const personaNames: Record<string, string> = {
          STUDENT: "Rahul Sharma",
          FACULTY: "Dr. Anand Verma",
          HOD: "Prof. Sunita Rao",
          TNP_COORDINATOR: "Vikram Malhotra",
          ADMIN: "Platform Administrator",
        };
        return {
          success: true,
          token: `demo_${input.role}`,
          user: {
            id: "10000000-0000-0000-0000-000000000005",
            name: personaNames[input.role] || "Demo User",
            email: `${input.role.toLowerCase()}@northstar.edu`,
            role: input.role,
            institutionId: "NIT-001",
            departmentId: "CSE",
            studentProfile:
              input.role === "STUDENT"
                ? {
                    id: "student-rahul-sharma",
                    enrollmentNumber: "CSE2024042",
                    program: "B.Tech Computer Science and Engineering",
                    currentSemester: 6,
                  }
                : undefined,
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  student: router({
    dashboard: publicProcedure.query(() => dashboardData),
    opportunities: publicProcedure.query(() => opportunitiesData),
    progress: publicProcedure.query(() => progressData),
    skills: publicProcedure.query(() => skillsData),
    getProfile: publicProcedure.query(() => ({
      id: "student-rahul-sharma",
      userId: "10000000-0000-0000-0000-000000000005",
      name: "Rahul Sharma",
      email: "student@northstar.edu",
      avatarUrl: null,
      enrollmentNumber: "CSE2024042",
      program: "B.Tech Computer Science and Engineering",
      section: "A",
      currentSemester: 6,
      admissionYear: 2021,
      graduationYear: 2025,
      institution: { id: "inst-nit-001", name: "Northstar Institute of Technology", code: "NIT-001" },
      department: { id: "dept-cse-001", name: "Computer Science and Engineering", code: "CSE" },
      mentor: { id: "faculty-anand-verma", name: "Dr. Anand Verma", email: "faculty@northstar.edu" },
    })),
    getAcademics: publicProcedure.query(() => ({
      cgpa: 8.42,
      totalCredits: 100,
      activeBacklogsCount: 1,
      semesters: [
        { semester: 1, academicYear: "2021-22", sgpa: 8.5, cgpa: 8.5, totalCredits: 20, subjects: [] },
        { semester: 2, academicYear: "2021-22", sgpa: 8.4, cgpa: 8.45, totalCredits: 20, subjects: [] },
        { semester: 3, academicYear: "2022-23", sgpa: 8.6, cgpa: 8.5, totalCredits: 20, subjects: [] },
        { semester: 4, academicYear: "2022-23", sgpa: 8.1, cgpa: 8.4, totalCredits: 20, subjects: [] },
        { semester: 5, academicYear: "2023-24", sgpa: 8.5, cgpa: 8.42, totalCredits: 20, subjects: [] },
      ],
      backlogs: [
        { id: "backlog-os", subjectCode: "CS401", subjectName: "Operating Systems", semester: 4, status: "ACTIVE" as const },
      ],
    })),
    getSkills: publicProcedure.query(() => ({
      skills: [
        { id: "s1", name: "Data Structures & Algorithms", category: "Core Technical", latestScore: 61, delta: -9, scoreHistory: [78, 70, 61], verified: true },
        { id: "s2", name: "Python", category: "Programming Languages", latestScore: 84, delta: 5, scoreHistory: [72, 79, 84], verified: true },
        { id: "s3", name: "DBMS", category: "Data & Storage", latestScore: 72, delta: 3, scoreHistory: [64, 69, 72], verified: true },
        { id: "s4", name: "Object-Oriented Programming", category: "Software Engineering", latestScore: 81, delta: 5, scoreHistory: [68, 76, 81], verified: true },
        { id: "s5", name: "Operating Systems", category: "Systems & Architecture", latestScore: 61, delta: -9, scoreHistory: [78, 70, 61], verified: true },
        { id: "s6", name: "Computer Networks", category: "Systems & Architecture", latestScore: 69, delta: 5, scoreHistory: [59, 64, 69], verified: true },
      ],
    })),
    getAssessments: publicProcedure.query(() => [
      { id: "assess-dsa-1", name: "DSA Assessment Cycle 1", maxScore: 100, durationMinutes: 60, status: "PUBLISHED" },
      { id: "assess-dsa-2", name: "DSA Assessment Cycle 2", maxScore: 100, durationMinutes: 60, status: "PUBLISHED" },
      { id: "assess-dsa-3", name: "DSA Assessment Cycle 3", maxScore: 100, durationMinutes: 60, status: "PUBLISHED" },
    ]),
    submitAssessment: publicProcedure
      .input(
        z.object({
          assessmentId: z.string(),
          answers: z.record(z.string(), z.any()).optional(),
          score: z.number().optional(),
        })
      )
      .mutation(({ input }) => ({
        success: true,
        submissionId: "demo-sub-id",
        assessmentName: "DSA Assessment",
        score: input.score ?? 85,
        attemptNumber: 1,
        submittedAt: new Date().toISOString(),
      })),
    getInterventions: publicProcedure.query(() => [
      {
        id: "interv-01",
        studentId: "student-rahul-sharma",
        skillGapId: "gap-dsa-01",
        assignedTo: "10000000-0000-0000-0000-000000000001",
        assignedFacultyName: "Dr. Anand Verma",
        type: "MENTORING" as const,
        description:
          "1-on-1 mentoring session to review core concepts in Data Structures & Algorithms and address backlog concepts.",
        status: "SCHEDULED" as const,
        startDate: new Date(),
        endDate: null,
        outcome: null,
        skillGap: {
          id: "gap-dsa-01",
          skillName: "Data Structures & Algorithms",
          severity: "HIGH",
          status: "IN_REVIEW",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
  }),
  skillGap: router({
    getMyGaps: publicProcedure.query(() => [
      {
        id: "gap-dsa-01",
        studentId: "student-rahul-sharma",
        skillId: "s1",
        skillName: "Data Structures & Algorithms",
        ruleId: "RULE_GAP_01",
        severity: "HIGH" as const,
        status: "OPEN" as const,
        reason: {
          score_history: [78, 70, 61],
          active_backlogs: 1,
          backlog_subject: "Operating Systems",
          trigger_text: "Two consecutive score drops accompanied by an active backlog.",
        },
        createdAt: new Date(),
        resolvedAt: null,
      },
    ]),
    explainGap: publicProcedure
      .input(z.object({ skillGapId: z.string() }))
      .query(() => ({
        explanation:
          "Data Structures & Algorithms assessment scores declined across consecutive cycles (78 → 70 → 61) while an active backlog in Operating Systems remains unresolved.",
        recommendedAction:
          "Schedule a 1-on-1 faculty mentoring session to review core concepts in Data Structures & Algorithms and Operating Systems remediation.",
        source: "ai" as const,
      })),
    getDepartmentGaps: publicProcedure
      .input(z.object({ departmentId: z.string().optional() }).optional())
      .query(() => []),
    createAssessment: publicProcedure
      .input(
        z.object({
          name: z.string(),
          departmentId: z.string().optional(),
          skillIds: z.array(z.string()),
          maxScore: z.number().optional(),
          durationMinutes: z.number().optional(),
        })
      )
      .mutation(({ input }) => ({
        id: "new-assessment-id",
        name: input.name,
        skillIds: input.skillIds,
        maxScore: input.maxScore ?? 100,
        durationMinutes: input.durationMinutes ?? 60,
        status: "PUBLISHED",
        createdAt: new Date(),
      })),
  }),
  faculty: router({
    getWards: publicProcedure.query(() => [
      {
        studentProfileId: "student-rahul-sharma",
        userId: "10000000-0000-0000-0000-000000000005",
        name: "Rahul Sharma",
        email: "student@northstar.edu",
        enrollmentNumber: "CSE2024042",
        program: "B.Tech Computer Science and Engineering",
        currentSemester: 6,
        cgpa: 8.42,
        activeBacklogsCount: 1,
        activeGapsCount: 1,
        activeInterventionsCount: 1,
        status: "NEEDS_ATTENTION" as "NEEDS_ATTENTION" | "ON_TRACK",
        activeGaps: [
          {
            id: "gap-dsa-01",
            skillId: "s1",
            skillName: "Data Structures & Algorithms",
            severity: "HIGH",
            status: "IN_REVIEW",
            reason: {
              score_history: [78, 70, 61],
              active_backlogs: 1,
              trigger_text:
                "Two consecutive score drops accompanied by an active backlog.",
            },
          },
        ],
        recentInterventions: [
          {
            id: "interv-01",
            type: "MENTORING",
            description:
              "1-on-1 mentoring session to review core concepts in Data Structures & Algorithms",
            status: "SCHEDULED",
            startDate: new Date(),
            outcome: null,
          },
        ],
      },
    ]),
    createIntervention: publicProcedure
      .input(
        z.object({
          studentId: z.string(),
          skillGapId: z.string().optional(),
          type: z
            .enum(["MENTORING", "REMEDIAL_CLASS", "ASSIGNMENT", "PEER_TUTORING"])
            .default("MENTORING"),
          description: z.string().min(5),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .mutation(({ input }) => ({
        success: true,
        intervention: {
          id: "new-interv-id",
          studentId: input.studentId,
          skillGapId: input.skillGapId ?? null,
          type: input.type,
          description: input.description,
          status: "SCHEDULED",
          startDate: input.startDate ? new Date(input.startDate) : new Date(),
          endDate: input.endDate ? new Date(input.endDate) : null,
          outcome: null,
          createdAt: new Date(),
        },
      })),
    recordOutcome: publicProcedure
      .input(
        z.object({
          interventionId: z.string(),
          outcome: z.string().min(5),
          status: z.enum(["COMPLETED", "CANCELLED"]).default("COMPLETED"),
        })
      )
      .mutation(({ input }) => ({
        success: true,
        intervention: {
          id: input.interventionId,
          outcome: input.outcome,
          status: input.status,
          updatedAt: new Date(),
        },
      })),
    getWardInterventions: publicProcedure
      .input(z.object({ studentProfileId: z.string() }))
      .query(() => []),
  }),
  evidence: router({
    getMyEvidence: publicProcedure.query(() => [
      {
        id: "ev-01",
        studentId: "student-rahul-sharma",
        achievementId: null,
        filename: "TechCorp_OfferLetter.pdf",
        storageBucket: "evidence-vault",
        storagePath:
          "NIT-001/student-rahul-sharma/1726500000000-TechCorp_OfferLetter.pdf",
        mimeType: "application/pdf",
        fileSize: 245000,
        sha256Hash:
          "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
        verificationStatus: "INSTITUTION_VERIFIED" as const,
        uploadedAt: new Date(),
        downloadUrl: "/mock-storage/TechCorp_OfferLetter.pdf",
      },
    ]),
    registerEvidence: publicProcedure
      .input(
        z.object({
          filename: z.string(),
          storagePath: z.string(),
          mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
          fileSize: z.number(),
          sha256Hash: z.string(),
          achievementId: z.string().optional(),
        })
      )
      .mutation(({ input }) => ({
        id: "new-ev-id",
        studentId: "student-rahul-sharma",
        achievementId: input.achievementId ?? null,
        filename: input.filename,
        storageBucket: "evidence-vault",
        storagePath: input.storagePath,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        sha256Hash: input.sha256Hash,
        verificationStatus: "SELF_REPORTED" as const,
        uploadedAt: new Date(),
      })),
    uploadAndRegister: publicProcedure
      .input(
        z.object({
          filename: z.string(),
          mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
          base64Data: z.string(),
          clientHash: z.string().optional(),
          achievementId: z.string().optional(),
        })
      )
      .mutation(({ input }) => ({
        id: "new-ev-id",
        studentId: "student-rahul-sharma",
        achievementId: input.achievementId ?? null,
        filename: input.filename,
        storageBucket: "evidence-vault",
        storagePath: `NIT-001/student-rahul-sharma/${Date.now()}-${input.filename}`,
        mimeType: input.mimeType,
        fileSize: Math.round(input.base64Data.length * 0.75),
        sha256Hash:
          input.clientHash ||
          "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
        verificationStatus: "SELF_REPORTED" as const,
        uploadedAt: new Date(),
      })),
    verifyIntegrity: publicProcedure
      .input(
        z.object({
          evidenceId: z.string(),
          base64Data: z.string().optional(),
        })
      )
      .query(({ input }) => ({
        evidenceId: input.evidenceId,
        filename: "TechCorp_OfferLetter.pdf",
        storedHash:
          "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
        computedHash:
          "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
        isIntact: true,
        status: "VERIFIED" as const,
        message:
          "Cryptographic integrity verified: Stored SHA-256 matches exact document byte sequence.",
      })),
    simulateTamper: publicProcedure
      .input(
        z
          .object({
            originalText: z.string().optional(),
            tamperedText: z.string().optional(),
          })
          .optional()
      )
      .mutation(() => ({
        documentName: "TechCorp_OfferLetter.pdf",
        originalText: "Monthly Stipend: INR 45,000",
        tamperedText: "Monthly Stipend: INR 95,000",
        originalHash:
          "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
        tamperedHash:
          "e81a4b2c1d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
        isMatch: false,
        status: "TAMPER_DETECTED" as const,
        alertMessage:
          "INTEGRITY FAILURE: Document bytes altered. SHA-256 hash mismatch detected.",
        educationalNote:
          "SHA-256 cryptographic hashing detects any bit-level tampering. Institutional authenticity requires faculty sign-off.",
      })),
  }),
});

export type AppRouter = typeof appRouter;

