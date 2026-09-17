import { COOKIE_NAME } from "@shared/const";
import { dashboardData, opportunitiesData, progressData, skillsData, type Opportunity } from "@shared/pragati";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sendMail } from "./_core/email";
import { supabaseAdmin } from "./_core/supabase";
import { ensureSupabaseAuthPersonas } from "./_core/supabaseAuthSync";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const supabaseAnonClient = createClient(
  process.env.SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type PragatiRole = "STUDENT" | "FACULTY" | "HOD" | "ADMIN";

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

const FACULTY_WARDS = [
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
    scorecard: {
      readinessScore: 76,
      attendancePercent: 92,
      creditsEarned: 100,
      totalCredits: 120,
      verifiedEvidenceCount: 9,
      internshipStatus: "Active internship at Atlas Labs",
      academicTrend: [
        { label: "Sem 1", sgpa: 8.5 },
        { label: "Sem 2", sgpa: 8.4 },
        { label: "Sem 3", sgpa: 8.6 },
        { label: "Sem 4", sgpa: 8.1 },
        { label: "Sem 5", sgpa: 8.5 },
        { label: "Sem 6", sgpa: 8.42 },
      ],
      skillScores: [
        { skill: "DSA", score: 78, benchmark: 75, trend: "up" },
        { skill: "Python", score: 84, benchmark: 75, trend: "up" },
        { skill: "DBMS", score: 72, benchmark: 70, trend: "up" },
        { skill: "Operating Systems", score: 61, benchmark: 70, trend: "down" },
        { skill: "Computer Networks", score: 69, benchmark: 70, trend: "up" },
      ],
      recentAssessments: [
        { name: "DSA Assessment Cycle 3", score: 78, date: "12 Sep 2026", status: "Verified" },
        { name: "Python Technical Review", score: 84, date: "10 Sep 2026", status: "Verified" },
        { name: "Operating Systems Review", score: 61, date: "28 Aug 2026", status: "Needs follow-up" },
      ],
    },
  },
];

const ACTIVITY_INVITE_STUDENTS = Array.from(
  new Map(
    [
      ...FACULTY_WARDS.map(ward => ({
        name: ward.name,
        email: ward.email,
        enrollmentNumber: ward.enrollmentNumber,
      })),
      {
        name: DEMO_PERSONAS.STUDENT.name,
        email: DEMO_PERSONAS.STUDENT.email,
        enrollmentNumber: DEMO_PERSONAS.STUDENT.roleId,
      },
      ...(process.env.ACTIVITY_INVITE_EMAILS || "")
        .split(",")
        .map(email => email.trim())
        .filter(Boolean)
        .map(email => ({
          name: "PRAGATI Student",
          email,
          enrollmentNumber: "Department Student",
        })),
    ].map(student => [student.email.toLowerCase(), student])
  ).values()
);

const placementInputSchema = z.object({
  company: z.string().min(1, "Company name required").max(100),
  role: z.string().min(1, "Role required").max(100),
  type: z.enum(["Internship", "Placement"]),
  location: z.string().min(1, "Location required").max(100),
  deadline: z.string().refine(value => !Number.isNaN(Date.parse(value)), "Invalid deadline date"),
  description: z.string().min(10, "Description too short").max(1000),
  skills: z.array(z.string().min(1)).min(1, "At least one skill required").max(10),
  criteria: z.array(
    z.object({
      label: z.string().min(1).max(50),
      expected: z.string().min(1).max(50),
    })
  ).min(1, "At least one eligibility criterion required"),
  verificationRequirements: z.array(z.string().min(1)).min(1).max(5),
});

const tnpUploadedOpportunities: Opportunity[] = [];

function getOpportunityStore() {
  const opportunities = [...opportunitiesData.opportunities, ...tnpUploadedOpportunities];
  return {
    summary: {
      eligible: opportunities.filter(item => item.eligibilityStatus === "Eligible").length,
      internships: opportunities.filter(item => item.type === "Internship").length,
      placements: opportunities.filter(item => item.type === "Placement").length,
      applications: opportunities.filter(item => item.applicationStatus !== "Not applied").length,
    },
    opportunities,
  };
}

function buildOpportunity(input: z.infer<typeof placementInputSchema>): Opportunity {
  const id = `${input.company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;
  const deadline = new Date(input.deadline);
  const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return {
    id,
    company: input.company,
    role: input.role,
    type: input.type,
    location: input.location,
    deadline: input.deadline,
    deadlineLabel:
      daysUntilDeadline > 0
        ? `Closes in ${daysUntilDeadline} day${daysUntilDeadline === 1 ? "" : "s"}`
        : "Deadline passed",
    eligibilitySummary: `${input.type} opportunity uploaded by the Training & Placement Cell.`,
    eligibilityStatus: "Eligible",
    applicationStatus: "Not applied",
    closingSoon: daysUntilDeadline <= 7,
    description: input.description,
    skills: input.skills,
    criteria: input.criteria.map(criteria => ({
      label: criteria.label,
      actual: "Pending verification",
      expected: criteria.expected,
      pass: true,
    })),
    verificationRequirements: input.verificationRequirements,
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    demoAccounts: publicProcedure.query(() => {
      ensureSupabaseAuthPersonas().catch(() => {});
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
          role: z.enum(["STUDENT", "FACULTY", "HOD", "ADMIN"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const emailLower = input.email.toLowerCase();

        // 1. Authenticate with Supabase Authentication (Users tab)
        try {
          const { data: authData, error: authError } =
            await supabaseAnonClient.auth.signInWithPassword({
              email: emailLower,
              password: input.password,
            });

          if (!authError && authData?.user) {
            const meta = authData.user.user_metadata || {};
            const userRole = (meta.role || input.role) as PragatiRole;
            const initials = (meta.name || "User")
              .split(" ")
              .map((part: string) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            const authedUser: PragatiUser = {
              id: authData.user.id,
              name: meta.name || input.email.split("@")[0],
              email: authData.user.email || input.email,
              role: userRole,
              department: meta.department || "Computer Science & Engineering",
              roleId: meta.roleId || meta.enrollmentNumber || "ROLE-001",
              designation: meta.designation || `${userRole}`,
              avatar: initials,
            };

            return {
              success: true,
              user: authedUser,
              token: authData.session?.access_token || `demo_${userRole}`,
            };
          }
        } catch {
          // Fallback to local / demo store if Supabase Auth is unavailable
        }

        const found = usersStore.get(emailLower);
        if (!found) {
          // Allow demo login fallback if demo user was requested
          const demoFallback = DEMO_PERSONAS[input.role];
          if (
            demoFallback &&
            (emailLower === demoFallback.email.toLowerCase() || input.password === "password123")
          ) {
            return { success: true, user: demoFallback, token: `demo_${input.role}` };
          }
          throw new Error("Invalid credentials or account not found in Supabase Authentication. Please register or use a demo account.");
        }

        if (found.role !== input.role) {
          throw new Error(`Account registered as ${found.role}, not ${input.role}. Please select the correct role tab.`);
        }

        return { success: true, user: found, token: `demo_${found.role}` };
      }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2),
          email: z.string().email(),
          password: z.string().min(6),
          role: z.enum(["STUDENT", "FACULTY", "HOD", "ADMIN"]),
          department: z.string().default("Computer Science & Engineering"),
          roleId: z.string().min(2),
          designation: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const key = input.email.toLowerCase();

        // 1. Securely create user in Supabase Authentication Users tab (auth.users)
        let supabaseUserId: string | null = null;
        try {
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: input.email.toLowerCase(),
            password: input.password,
            email_confirm: true,
            user_metadata: {
              name: input.name,
              role: input.role,
              department: input.department,
              roleId: input.roleId,
              designation: input.designation || `${input.role} (${input.department})`,
              email_verified: true,
            },
          });

          if (authError) {
            if (
              authError.message?.toLowerCase().includes("already registered") ||
              authError.status === 422
            ) {
              throw new Error("An account with this email already exists in Supabase Authentication. Please sign in instead.");
            }
            console.warn("[Auth] Supabase admin createUser notice:", authError.message);
          } else if (authData?.user) {
            supabaseUserId = authData.user.id;
          }
        } catch (e: any) {
          if (e.message?.includes("already exists")) throw e;
          console.warn("[Auth] Supabase auth registration notice:", e);
        }

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
          id: supabaseUserId || `user-${Date.now()}`,
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
      .input(z.object({ role: z.enum(["STUDENT", "FACULTY", "HOD", "ADMIN"]) }))
      .mutation(async ({ input }) => {
        ensureSupabaseAuthPersonas().catch(() => {});

        const email =
          input.role === "HOD" ? "hod.cse@northstar.edu" : `${input.role.toLowerCase()}@northstar.edu`;
        let supabaseToken = `demo_${input.role}`;
        let supabaseUserId = "10000000-0000-0000-0000-000000000005";

        try {
          const { data: authData } = await supabaseAnonClient.auth.signInWithPassword({
            email,
            password: "password123",
          });
          if (authData?.session?.access_token) {
            supabaseToken = authData.session.access_token;
            supabaseUserId = authData.user.id;
          }
        } catch {}
        const personaNames: Record<string, string> = {
          STUDENT: "Rahul Sharma",
          FACULTY: "Dr. Anand Verma",
          HOD: "Prof. Sunita Rao",
          ADMIN: "Platform Administrator",
        };

        return {
          success: true,
          token: supabaseToken,
          user: {
            id: supabaseUserId,
            name: personaNames[input.role] || "Demo User",
            email,
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
    opportunities: publicProcedure.query(() => getOpportunityStore()),
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
  tnp: router({
    getPlacements: publicProcedure.query(() => getOpportunityStore().opportunities),
    createPlacement: publicProcedure
      .input(placementInputSchema)
      .mutation(({ input }) => {
        const opportunity = buildOpportunity(input);
        tnpUploadedOpportunities.unshift(opportunity);
        return {
          success: true,
          placement: opportunity,
          message: `${input.type} data for ${input.role} at ${input.company} uploaded successfully.`,
        };
      }),
    deletePlacement: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => {
        const index = tnpUploadedOpportunities.findIndex(item => item.id === input.id);
        if (index === -1) {
          throw new Error("Only newly uploaded opportunities can be deleted in this demo workspace.");
        }
        tnpUploadedOpportunities.splice(index, 1);
        return { success: true, message: "Opportunity deleted successfully." };
      }),
  }),
  faculty: router({
    getWards: publicProcedure.query(() => FACULTY_WARDS),
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
      .mutation(async ({ input, ctx }) => {
        const ward = FACULTY_WARDS.find(item => item.studentProfileId === input.studentId);
        const facultyName = ctx.user?.name || "Your faculty mentor";
        const sessionDate = input.startDate ? new Date(input.startDate) : new Date();
        const intervention = {
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
        };

        let emailNotification = {
          sent: false,
          reason: "student_not_found" as "student_not_found" | "missing_config" | "smtp_error" | undefined,
        };

        if (ward) {
          const mailResult = await sendMail({
            to: ward.email,
            subject: "PRAGATI mentoring session scheduled",
            text: [
              `Hello ${ward.name},`,
              "",
              `${facultyName} has scheduled a ${input.type.replace(/_/g, " ").toLowerCase()} session for you in PRAGATI.`,
              "",
              `Date: ${sessionDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}`,
              `Student ID: ${ward.enrollmentNumber}`,
              "",
              "Session plan:",
              input.description,
              "",
              "Please open your PRAGATI mentoring workspace for the latest intervention details and follow-up actions.",
              "",
              "Regards,",
              "PRAGATI Teacher-Guardian Desk",
            ].join("\n"),
          });

          emailNotification = mailResult.sent
            ? { sent: true, reason: undefined }
            : { sent: false, reason: mailResult.reason };
        }

        return {
          success: true,
          intervention,
          emailNotification,
        };
      }),
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
  hod: router({
    getDepartmentSummary: publicProcedure.query(() => ({
      departmentName: "Computer Science & Engineering",
      code: "CSE",
      institution: "Northstar Institute of Technology",
      hodName: "Prof. Sunita Rao",
      totalStudents: 248,
      activeBatches: ["2021-2025 (Final Year)", "2022-2026 (Pre-Final Year)"],
      facultyCount: 14,
      avgCgpa: 8.12,
      readinessScore: 79.4,
      readinessDelta: "+3.8%",
      internshipRate: 84.2,
      activeGapsCount: 18,
      resolvedInterventionsCount: 42,
      metrics: [
        {
          label: "Total CSE Students",
          value: "248",
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
        {
          skill: "Object-Oriented Programming",
          code: "CS201",
          flaggedStudents: 2,
          avgScore: 81,
          benchmark: 70,
          severity: "LOW" as const,
          mentor: "Prof. Vikram Malhotra",
          status: "Proficient",
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
    })),
    scheduleRemedialClinic: publicProcedure
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
    sendActivityInvitation: publicProcedure
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
        const senderName = ctx.user?.name || "PRAGATI HOD Desk";
        const results = await Promise.all(
          ACTIVITY_INVITE_STUDENTS.map(async student => {
            const mailResult = await sendMail({
              to: student.email,
              subject: `PRAGATI invitation: ${input.title}`,
              text: [
                `Hello ${student.name},`,
                "",
                `${senderName} has sent you an invitation for the following PRAGATI department activity.`,
                "",
                `Activity: ${input.title}`,
                `Category: ${input.badge || "Department Activity"}`,
                input.time ? `Posted: ${input.time}` : "",
                "",
                "Details:",
                input.detail,
                "",
                "Please log in to PRAGATI and check your workspace for any required action.",
                "",
                "Regards,",
                "PRAGATI Department Desk",
              ].filter(Boolean).join("\n"),
            });

            return {
              studentEmail: student.email,
              sent: mailResult.sent,
              reason: mailResult.sent ? undefined : mailResult.reason,
            };
          })
        );

        return {
          success: true,
          activityId: input.activityId,
          totalStudents: ACTIVITY_INVITE_STUDENTS.length,
          sentCount: results.filter(result => result.sent).length,
          failedCount: results.filter(result => !result.sent).length,
          results,
        };
      }),
    exportAuditReport: publicProcedure.query(() => ({
      success: true,
      reportTitle: "PRAGATI CSE Department Skill & Placement Audit",
      department: "Computer Science & Engineering",
      institution: "Northstar Institute of Technology",
      generatedAt: new Date().toISOString(),
      format: "PDF (NAAC Criterion 2 & NBA Sub-tier compliant)",
    })),
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
  internship: router({
    getMyInternship: publicProcedure.query(() => ({
      id: "internship-01",
      studentId: "student-rahul-sharma",
      companyName: "Atlas Labs",
      role: "Product Engineering Intern",
      startDate: "2026-06-01",
      endDate: "2026-11-30",
      stipend: "45000.00",
      status: "IN_PROGRESS" as "APPLIED" | "OFFERED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED",
      supervisorName: "Sarah Jenkins",
      supervisorEmail: "s.jenkins@atlaslabs.io",
      verificationStatus: "PENDING" as "SELF_REPORTED" | "PENDING" | "INSTITUTION_VERIFIED" | "ISSUER_VERIFIED" | "REJECTED",
      completeness: 50,
      milestones: {
        hasOfferLetter: true,
        hasCheckin: true,
        hasReport: false,
        hasCertificate: false,
      },
      evidence: [
        {
          id: "ie-01",
          internshipId: "internship-01",
          evidenceType: "OFFER_LETTER" as const,
          status: "INSTITUTION_VERIFIED" as const,
          createdAt: new Date(),
          documentId: "ev-01",
          filename: "TechCorp_OfferLetter.pdf",
          storagePath: "NIT-001/student-rahul-sharma/TechCorp_OfferLetter.pdf",
          mimeType: "application/pdf",
          fileSize: 245000,
          sha256Hash: "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
          verificationStatus: "INSTITUTION_VERIFIED" as const,
          downloadUrl: "/mock-storage/TechCorp_OfferLetter.pdf",
        },
      ],
      checkins: [
        {
          id: "chk-01",
          internshipId: "internship-01",
          studentId: "student-rahul-sharma",
          checkInDate: "2026-07-15",
          summary: "Completed backend API integration and added comprehensive test coverage for Phase 6.",
          status: "SUBMITTED",
          createdAt: new Date(),
        },
      ],
    })),
    createInternship: publicProcedure
      .input(
        z.object({
          companyName: z.string().min(2),
          role: z.string().min(2),
          startDate: z.string(),
          endDate: z.string().optional(),
          stipend: z.number().optional(),
          supervisorName: z.string().optional(),
          supervisorEmail: z.string().email().optional(),
        })
      )
      .mutation(({ input }) => ({
        id: "internship-new",
        studentId: "student-rahul-sharma",
        companyName: input.companyName,
        role: input.role,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        stipend: input.stipend ? input.stipend.toString() : null,
        status: "IN_PROGRESS" as const,
        supervisorName: input.supervisorName ?? null,
        supervisorEmail: input.supervisorEmail ?? null,
        verificationStatus: "PENDING" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    submitCheckin: publicProcedure
      .input(
        z.object({
          internshipId: z.string(),
          summary: z.string().min(5),
          checkInDate: z.string().optional(),
        })
      )
      .mutation(({ input }) => ({
        id: `chk-${Date.now()}`,
        internshipId: input.internshipId,
        studentId: "student-rahul-sharma",
        checkInDate: input.checkInDate || new Date().toISOString().split("T")[0],
        summary: input.summary,
        status: "SUBMITTED" as const,
        reviewedBy: null,
        createdAt: new Date(),
      })),
    linkEvidence: publicProcedure
      .input(
        z.object({
          internshipId: z.string(),
          evidenceDocumentId: z.string(),
          evidenceType: z.enum([
            "OFFER_LETTER",
            "CHECK_IN",
            "COMPLETION_CERTIFICATE",
            "INTERNSHIP_REPORT",
            "SUPERVISOR_CONFIRMATION",
            "SKILL_CERTIFICATE",
          ]),
        })
      )
      .mutation(({ input }) => ({
        id: `ie-${Date.now()}`,
        internshipId: input.internshipId,
        evidenceDocumentId: input.evidenceDocumentId,
        evidenceType: input.evidenceType,
        status: "PENDING" as const,
        createdAt: new Date(),
      })),
    getReviewQueue: publicProcedure.query(() => [
      {
        id: "internship-01",
        studentId: "student-rahul-sharma",
        studentName: "Rahul Sharma",
        studentEmail: "student@northstar.edu",
        enrollmentNumber: "CSE2024042",
        companyName: "Atlas Labs",
        role: "Product Engineering Intern",
        startDate: "2026-06-01",
        endDate: "2026-11-30",
        stipend: "45000.00",
        status: "IN_PROGRESS" as "APPLIED" | "OFFERED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED",
        verificationStatus: "PENDING" as "SELF_REPORTED" | "PENDING" | "INSTITUTION_VERIFIED" | "ISSUER_VERIFIED" | "REJECTED",
        createdAt: new Date(),
        completeness: 50,
        evidenceCount: 1,
        checkinCount: 1,
        evidence: [
          {
            id: "ie-01",
            evidenceType: "OFFER_LETTER" as const,
            status: "INSTITUTION_VERIFIED" as const,
            filename: "TechCorp_OfferLetter.pdf",
            storagePath: "NIT-001/student-rahul-sharma/TechCorp_OfferLetter.pdf",
            sha256Hash: "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
            uploadedAt: new Date(),
          },
        ],
        checkins: [
          {
            id: "chk-01",
            internshipId: "internship-01",
            studentId: "student-rahul-sharma",
            checkInDate: "2026-07-15",
            summary: "Completed backend API integration and added comprehensive test coverage for Phase 6.",
            status: "SUBMITTED",
            createdAt: new Date(),
          },
        ],
      },
    ]),
    verifyInternship: publicProcedure
      .input(
        z.object({
          internshipId: z.string(),
          status: z.enum(["INSTITUTION_VERIFIED", "REJECTED"]),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => ({
        success: true,
        internshipId: input.internshipId,
        verificationStatus: input.status,
        status: input.status === "INSTITUTION_VERIFIED" ? "COMPLETED" : "IN_PROGRESS",
        verifiedAt: new Date().toISOString(),
      })),
  }),
  placement: router({
    checkMyEligibility: publicProcedure
      .input(z.object({ driveId: z.string() }))
      .query(({ input }) => ({
        studentId: "student-rahul-sharma",
        driveId: input.driveId,
        eligible: true,
        reasons: [
          "Cumulative CGPA: Actual 8.42 >= Required 7.5 [PASS]",
          "Active Backlogs: Actual 0 = Required 0 [PASS]",
          "DSA Score: Actual 78 >= Required 70 [PASS]",
          "Python Score: Actual 84 >= Required 65 [PASS]",
          "Internship Status: Actual COMPLETED = Required COMPLETED [PASS]",
        ],
        criteriaResults: [
          {
            passed: true,
            reason: "Cumulative CGPA: Actual 8.42 >= Required 7.5 [PASS]",
            field: "cgpa",
            actualValue: 8.42,
            expectedValue: 7.5,
            operator: ">=",
          },
          {
            passed: true,
            reason: "Active Backlogs: Actual 0 = Required 0 [PASS]",
            field: "active_backlogs",
            actualValue: 0,
            expectedValue: 0,
            operator: "=",
          },
          {
            passed: true,
            reason: "DSA Score: Actual 78 >= Required 70 [PASS]",
            field: "skill.DSA",
            actualValue: 78,
            expectedValue: 70,
            operator: ">=",
          },
          {
            passed: true,
            reason: "Python Score: Actual 84 >= Required 65 [PASS]",
            field: "skill.Python",
            actualValue: 84,
            expectedValue: 65,
            operator: ">=",
          },
          {
            passed: true,
            reason: "Internship Status: Actual COMPLETED = Required COMPLETED [PASS]",
            field: "internship_status",
            actualValue: "COMPLETED",
            expectedValue: "COMPLETED",
            operator: "=",
          },
        ],
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        ctcOrStipend: "14.5 LPA",
        candidateSnapshot: {
          id: "student-rahul-sharma",
          name: "Rahul Sharma",
          cgpa: 8.42,
          activeBacklogs: 0,
          skills: { DSA: 78, Python: 84 },
          internshipStatus: "COMPLETED" as const,
        },
      })),
    getDrives: publicProcedure.query(() => [
      {
        id: "drive-abc-tech",
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        description:
          "Core software engineering and systems development role requiring robust foundation in data structures, algorithms, python, and verified internship experience.",
        ctcOrStipend: "14.5 LPA",
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED" as const,
        createdAt: new Date(),
        ruleVersion: 1,
        ruleDefinition: {
          operator: "AND" as const,
          conditions: [
            { field: "cgpa", operator: ">=" as const, value: 7.5 },
            { field: "active_backlogs", operator: "=" as const, value: 0 },
            { field: "skill.DSA", operator: ">=" as const, value: 70 },
            { field: "skill.Python", operator: ">=" as const, value: 65 },
            { field: "internship_status", operator: "=" as const, value: "COMPLETED" },
          ],
        },
        eligibleCount: 18,
        totalEvaluated: 24,
      },
    ]),
    getDriveById: publicProcedure
      .input(z.object({ driveId: z.string() }))
      .query(({ input }) => ({
        drive: {
          id: input.driveId,
          companyName: "ABC Technologies",
          jobTitle: "Associate Software Engineer",
          description: "Core software engineering and systems development role.",
          ctcOrStipend: "14.5 LPA",
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "PUBLISHED" as const,
          createdAt: new Date(),
        },
        rule: {
          operator: "AND" as const,
          conditions: [
            { field: "cgpa", operator: ">=" as const, value: 7.5 },
            { field: "active_backlogs", operator: "=" as const, value: 0 },
            { field: "skill.DSA", operator: ">=" as const, value: 70 },
            { field: "skill.Python", operator: ">=" as const, value: 65 },
            { field: "internship_status", operator: "=" as const, value: "COMPLETED" },
          ],
        },
      })),
    getBenchmarkDrive: publicProcedure.query(() => ({
      drive: {
        id: "drive-abc-tech",
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        description: "Core software engineering role.",
        ctcOrStipend: "14.5 LPA",
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED" as const,
        createdAt: new Date(),
      },
      rule: {
        operator: "AND" as const,
        conditions: [
          { field: "cgpa", operator: ">=" as const, value: 7.5 },
          { field: "active_backlogs", operator: "=" as const, value: 0 },
          { field: "skill.DSA", operator: ">=" as const, value: 70 },
          { field: "skill.Python", operator: ">=" as const, value: 65 },
          { field: "internship_status", operator: "=" as const, value: "COMPLETED" },
        ],
      },
    })),
    evaluateRoster: publicProcedure
      .input(z.object({ driveId: z.string() }))
      .mutation(({ input }) => ({
        driveId: input.driveId,
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        totalEvaluated: 42,
        eligibleCount: 31,
        ineligibleCount: 11,
        results: [
          {
            studentId: "student-rahul-sharma",
            studentName: "Rahul Sharma",
            enrollmentNumber: "CSE2024042",
            eligible: true,
            reasons: ["All benchmarks passed"],
            criteriaResults: [],
            snapshot: {
              id: "student-rahul-sharma",
              name: "Rahul Sharma",
              cgpa: 8.42,
              activeBacklogs: 0,
              skills: { DSA: 78, Python: 84 },
              internshipStatus: "COMPLETED" as const,
            },
          },
        ],
      })),
    saveRule: publicProcedure
      .input(
        z.object({
          driveId: z.string(),
          rule: z.object({
            operator: z.enum(["AND", "OR"]),
            conditions: z.array(z.any()),
          }),
        })
      )
      .mutation(({ input }) => ({
        id: "rule-new",
        recruitmentDriveId: input.driveId,
        version: 2,
        ruleDefinition: input.rule,
        isActive: true,
        createdAt: new Date(),
      })),
  }),
  recruitment: router({
    getActiveDrives: publicProcedure.query(() => [
      {
        id: "drive-abc-tech",
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        description: "Core software engineering role.",
        ctcOrStipend: "14.5 LPA",
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED" as const,
        totalApplicants: 12,
        rule: {
          operator: "AND" as const,
          conditions: [
            { field: "cgpa", operator: ">=" as const, value: 7.5 },
            { field: "active_backlogs", operator: "=" as const, value: 0 },
            { field: "skill.DSA", operator: ">=" as const, value: 70 },
            { field: "skill.Python", operator: ">=" as const, value: 65 },
            { field: "internship_status", operator: "=" as const, value: "COMPLETED" },
          ],
        },
      },
    ]),
    applyToDrive: publicProcedure
      .input(z.object({ driveId: z.string() }))
      .mutation(({ input }) => ({
        application: {
          id: "app-demo-1",
          studentId: "student-rahul-sharma",
          recruitmentDriveId: input.driveId,
          status: "APPLIED" as const,
          appliedAt: new Date(),
        },
        drive: {
          id: input.driveId,
          companyName: "ABC Technologies",
          jobTitle: "Associate Software Engineer",
          ctcOrStipend: "14.5 LPA",
        },
        evaluation: {
          studentId: "student-rahul-sharma",
          driveId: input.driveId,
          eligible: true,
          reasons: ["All criteria passed"],
          criteriaResults: [],
        },
      })),
    getMyApplications: publicProcedure.query(() => [
      {
        id: "app-1",
        recruitmentDriveId: "drive-abc-tech",
        status: "APPLIED" as "APPLIED" | "SHORTLISTED" | "INTERVIEWING" | "OFFERED" | "REJECTED",
        appliedAt: new Date(),
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        description: "Core software engineering role.",
        ctcOrStipend: "14.5 LPA",
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        driveStatus: "PUBLISHED" as const,
      },
    ]),
    getDriveApplicants: publicProcedure
      .input(z.object({ driveId: z.string() }))
      .query(({ input }) => [
        {
          applicationId: "app-1",
          status: "APPLIED" as "APPLIED" | "SHORTLISTED" | "INTERVIEWING" | "OFFERED" | "REJECTED",
          appliedAt: new Date(),
          studentId: "student-rahul-sharma",
          enrollmentNumber: "CSE2024042",
          program: "B.Tech Computer Science and Engineering",
          currentSemester: 6,
          studentName: "Rahul Sharma",
          studentEmail: "rahul.sharma@northstar.edu",
          snapshot: {
            id: "student-rahul-sharma",
            name: "Rahul Sharma",
            cgpa: 8.42,
            activeBacklogs: 0,
            skills: { DSA: 78, Python: 84 },
            internshipStatus: "COMPLETED" as const,
          },
        },
      ]),
    updateApplicantStatus: publicProcedure
      .input(
        z.object({
          applicationId: z.string(),
          status: z.enum([
            "APPLIED",
            "SHORTLISTED",
            "INTERVIEWING",
            "OFFERED",
            "REJECTED",
          ]),
          remarks: z.string().optional(),
        })
      )
      .mutation(({ input }) => ({
        id: input.applicationId,
        status: input.status,
        updatedAt: new Date(),
      })),
  }),
  dashboard: router({
    getStudentDashboard: publicProcedure.query(() => ({
      student: {
        id: "student-rahul-sharma",
        name: "Rahul Sharma",
        email: "student@northstar.edu",
        enrollmentNumber: "CS-2023-0842",
        program: "B.Tech Computer Science and Engineering",
        institution: "Northstar Institute of Technology",
        semester: 6,
        admissionYear: 2023,
        graduationYear: 2027,
      },
      metrics: {
        cgpa: 8.42,
        totalCredits: 132,
        activeBacklogs: 0,
        verifiedSkillsCount: 5,
        totalSkillsCount: 6,
        internshipStatus: "COMPLETED",
        internshipCompleteness: 100,
        totalEvidenceDocuments: 10,
        verifiedEvidenceDocuments: 9,
      },
      readinessScorecard: {
        readinessScore: 87.26,
        methodologyExplanation:
          "A deterministic weighted average of four transparent progress indicators: (Academic 30%) + (Skill Coverage 30%) + (Internship 20%) + (Verified Evidence 20%). It is not an AI-generated employability score.",
        formula: "ReadinessScore = (A * 0.30) + (S * 0.30) + (I * 0.20) + (E * 0.20)",
        breakdown: {
          academic: {
            rawCgpa: 8.42,
            percentage: 84.2,
            weight: 0.3,
            weightedContribution: 25.26,
          },
          skills: {
            totalCoreSkills: 5,
            skillsAboveThreshold: 4,
            percentage: 80,
            weight: 0.3,
            weightedContribution: 24,
          },
          internship: {
            completeness: 100,
            weight: 0.2,
            weightedContribution: 20,
          },
          evidence: {
            totalClaims: 10,
            verifiedClaims: 9,
            percentage: 90,
            weight: 0.2,
            weightedContribution: 18,
          },
        },
      },
      academics: {
        cgpa: 8.42,
        totalCredits: 132,
        activeBacklogsCount: 0,
        semesters: [] as any[],
      },
      skills: [] as any[],
      internship: null as any,
      skillGap: {
        skill: "Operating Systems",
        severity: "MEDIUM",
        reason: "OS score dropped by 9% across two assessment cycles.",
        detectedAt: "2026-09-17T12:00:00.000Z",
      },
      applications: [] as any[],
    })),
    getCareerPassport: publicProcedure.query(() => ({
      passportId: "PASS-NIT-CSE-CS20230842",
      generatedAt: "2026-09-17T12:00:00.000Z",
      institution: {
        name: "Northstar Institute of Technology",
        code: "NIT",
        department: "Department of Computer Science & Engineering",
        sealText: "OFFICIAL INSTITUTIONAL SEAL · VERIFIED PORTABLE CAREER DOSSIER",
      },
      student: {
        id: "student-rahul-sharma",
        name: "Rahul Sharma",
        email: "student@northstar.edu",
        enrollmentNumber: "CS-2023-0842",
        program: "B.Tech Computer Science and Engineering",
        institution: "Northstar Institute of Technology",
        semester: 6,
        admissionYear: 2023,
        graduationYear: 2027,
      },
      readinessScorecard: {
        readinessScore: 87.26,
        methodologyExplanation:
          "A deterministic weighted average of four transparent progress indicators: (Academic 30%) + (Skill Coverage 30%) + (Internship 20%) + (Verified Evidence 20%). It is not an AI-generated employability score.",
        formula: "ReadinessScore = (A * 0.30) + (S * 0.30) + (I * 0.20) + (E * 0.20)",
        breakdown: {
          academic: { rawCgpa: 8.42, percentage: 84.2, weight: 0.3, weightedContribution: 25.26 },
          skills: { totalCoreSkills: 5, skillsAboveThreshold: 4, percentage: 80, weight: 0.3, weightedContribution: 24 },
          internship: { completeness: 100, weight: 0.2, weightedContribution: 20 },
          evidence: { totalClaims: 10, verifiedClaims: 9, percentage: 90, weight: 0.2, weightedContribution: 18 },
        },
      },
      academicLedger: {
        cumulativeCgpa: 8.42,
        totalCredits: 132,
        activeBacklogs: 0,
        backlogStatus: "ZERO_ACTIVE_BACKLOGS" as const,
        verifiedStatus: "INSTITUTION_VERIFIED" as const,
        semesters: [
          { semester: 1, semesterLabel: "Semester 1", academicYear: "2023-24", sgpa: 8.2, cgpa: 8.2, creditsEarned: 22, status: "COMPLETED" },
          { semester: 2, semesterLabel: "Semester 2", academicYear: "2023-24", sgpa: 8.5, cgpa: 8.35, creditsEarned: 22, status: "COMPLETED" },
          { semester: 3, semesterLabel: "Semester 3", academicYear: "2024-25", sgpa: 8.4, cgpa: 8.37, creditsEarned: 22, status: "COMPLETED" },
          { semester: 4, semesterLabel: "Semester 4", academicYear: "2024-25", sgpa: 8.1, cgpa: 8.3, creditsEarned: 22, status: "COMPLETED" },
          { semester: 5, semesterLabel: "Semester 5", academicYear: "2025-26", sgpa: 8.6, cgpa: 8.36, creditsEarned: 22, status: "COMPLETED" },
          { semester: 6, semesterLabel: "Semester 6", academicYear: "2025-26", sgpa: 8.7, cgpa: 8.42, creditsEarned: 22, status: "COMPLETED" },
        ],
      },
      verifiedSkills: [
        { skillName: "Python Programming", category: "Software Development", score: 84, proficiency: "EXPERT" as const, lastAssessed: "Assessment Cycle 3", assessmentCycles: 3, verified: true },
        { skillName: "Data Structures & Algorithms", category: "Core Technical", score: 78, proficiency: "PROFICIENT" as const, lastAssessed: "Assessment Cycle 3", assessmentCycles: 3, verified: true },
        { skillName: "Object-Oriented Programming", category: "Software Development", score: 81, proficiency: "EXPERT" as const, lastAssessed: "Assessment Cycle 3", assessmentCycles: 3, verified: true },
        { skillName: "Database Management Systems", category: "Core Technical", score: 72, proficiency: "PROFICIENT" as const, lastAssessed: "Assessment Cycle 3", assessmentCycles: 3, verified: true },
      ],
      verifiedInternship: {
        companyName: "TechCorp Innovations",
        role: "Software Engineering Intern",
        duration: "8 Weeks (Jun 2026 - Aug 2026)",
        startDate: "2026-06-01",
        endDate: "2026-08-01",
        status: "COMPLETED",
        verificationStatus: "INSTITUTION_VERIFIED",
        mentorSignOff: {
          facultyName: "Dr. Anand Verma",
          designation: "Associate Professor & Faculty Placement Advisor",
          signedAt: "16 Sep 2026",
          notes: "Approved with complete institutional compliance and milestone verification.",
        },
        cryptographicEvidence: [
          {
            documentType: "PDF_DOCUMENT",
            title: "TechCorp_Offer_Letter.pdf",
            sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            verified: true,
            verifiedAt: "2026-09-16",
          },
          {
            documentType: "PDF_DOCUMENT",
            title: "TechCorp_Completion_Certificate.pdf",
            sha256Hash: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
            verified: true,
            verifiedAt: "2026-09-16",
          },
        ],
      },
      placementDrives: [
        {
          companyName: "ABC Technologies",
          jobTitle: "Associate Software Engineer",
          ctcOrStipend: "14.5 LPA",
          status: "SHORTLISTED",
          appliedAt: new Date().toISOString(),
        },
      ],
      verificationStamp: {
        sha256IntegrityHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
        signatureAuthority: "Dean of Academic Affairs & Faculty Placement Board",
        verificationUrl: "https://pragati.nit.ac.in/verify/PASS-NIT-CSE-CS20230842",
      },
    })),
    getHodAnalytics: publicProcedure.query(() => ({
      department: {
        id: "dept-cse-001",
        name: "Department of Computer Science & Engineering",
        code: "CSE",
        totalStudents: 120,
        facultyCount: 14,
        averageCgpa: 8.15,
      },
      skillHeatmap: {
        semesters: ["Sem 3", "Sem 4", "Sem 5", "Sem 6"],
        skills: [
          {
            skillName: "Data Structures & Algorithms",
            category: "Core Technical",
            semesterAverages: [
              { semester: "Sem 3", averageScore: 72, status: "MODERATE" as const },
              { semester: "Sem 4", averageScore: 68, status: "MODERATE" as const },
              { semester: "Sem 5", averageScore: 76, status: "EXCELLENT" as const },
              { semester: "Sem 6", averageScore: 78, status: "EXCELLENT" as const },
            ],
          },
          {
            skillName: "Operating Systems",
            category: "Systems",
            semesterAverages: [
              { semester: "Sem 3", averageScore: 65, status: "MODERATE" as const },
              { semester: "Sem 4", averageScore: 59, status: "CRITICAL" as const },
              { semester: "Sem 5", averageScore: 64, status: "CRITICAL" as const },
              { semester: "Sem 6", averageScore: 71, status: "MODERATE" as const },
            ],
          },
          {
            skillName: "Database Management Systems",
            category: "Core Technical",
            semesterAverages: [
              { semester: "Sem 3", averageScore: 75, status: "EXCELLENT" as const },
              { semester: "Sem 4", averageScore: 79, status: "EXCELLENT" as const },
              { semester: "Sem 5", averageScore: 82, status: "EXCELLENT" as const },
              { semester: "Sem 6", averageScore: 84, status: "EXCELLENT" as const },
            ],
          },
          {
            skillName: "Python Programming",
            category: "Software Development",
            semesterAverages: [
              { semester: "Sem 3", averageScore: 80, status: "EXCELLENT" as const },
              { semester: "Sem 4", averageScore: 83, status: "EXCELLENT" as const },
              { semester: "Sem 5", averageScore: 85, status: "EXCELLENT" as const },
              { semester: "Sem 6", averageScore: 88, status: "EXCELLENT" as const },
            ],
          },
          {
            skillName: "Computer Networks",
            category: "Systems",
            semesterAverages: [
              { semester: "Sem 3", averageScore: 68, status: "MODERATE" as const },
              { semester: "Sem 4", averageScore: 67, status: "MODERATE" as const },
              { semester: "Sem 5", averageScore: 70, status: "MODERATE" as const },
              { semester: "Sem 6", averageScore: 75, status: "EXCELLENT" as const },
            ],
          },
        ],
      },
      interventionVelocity: {
        flaggedGaps: 18,
        scheduledInterventions: 16,
        completedInterventions: 14,
        resolutionRate: 77.8,
        breakdown: [
          { category: "Systems (OS/CN)", flagged: 9, resolved: 7 },
          { category: "Algorithms & Data Structures", flagged: 6, resolved: 5 },
          { category: "Core Databases", flagged: 3, resolved: 2 },
        ],
      },
      placementReadinessDistribution: {
        totalEligible: 101,
        tier1Eligible: { count: 46, percentage: 38, label: "Tier 1 (10+ LPA)" as const },
        tier2Eligible: { count: 55, percentage: 46, label: "Tier 2 (6-10 LPA)" as const },
        remedialRequired: { count: 19, percentage: 16, label: "Remedial Needed (<65)" as const },
      },
    })),
  }),

  superAdmin: router({
    getPlatformStats: publicProcedure.query(async () => {
      return {
        totalInstitutions: 2,
        activeInstitutions: 2,
        suspendedInstitutions: 0,
        demoInstitutions: 1,
        totalUsers: 9,
        totalStudents: 1,
      };
    }),
    listInstitutions: publicProcedure
      .input(
        z
          .object({
            status: z.enum(["ACTIVE", "SUSPENDED", "ALL"]).optional(),
            includeDemo: z.boolean().default(true),
            search: z.string().optional(),
          })
          .optional()
      )
      .query(async () => {
        return [
          {
            id: "10000000-0000-0000-0000-000000000000",
            name: "Northstar Institute of Technology (Demo)",
            code: "NIT-DEMO",
            domain: "northstar.edu",
            universityBoard: "Autonomous Technical University",
            address: "100 Innovation Boulevard, Tech District",
            city: "Pune",
            state: "Maharashtra",
            contactPhone: "+91 98765 43210",
            contactEmail: "admin@northstar.edu",
            isDemo: true,
            status: "ACTIVE" as const,
            suspensionReason: null,
            suspendedAt: null,
            isDeleted: false,
            deletedAt: null,
            createdAt: new Date().toISOString(),
          },
        ];
      }),
    provisionInstitution: publicProcedure
      .input(
        z.object({
          name: z.string().min(3),
          code: z.string().min(2),
          domain: z.string().min(3),
          universityBoard: z.string().min(2),
          address: z.string().min(5),
          city: z.string().min(2),
          state: z.string().min(2),
          contactPhone: z.string().min(8),
          contactEmail: z.string().email(),
          adminName: z.string().min(2),
          adminEmail: z.string().email(),
          adminPhone: z.string().min(8),
          adminDesignation: z.string().min(2),
          adminEmployeeId: z.string().min(2),
        })
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          message: `Institution '${input.name}' and administrator '${input.adminName}' provisioned successfully.`,
          institution: {
            id: "inst-" + Date.now(),
            name: input.name,
            code: input.code,
            domain: input.domain,
            status: "ACTIVE" as const,
            isDemo: false,
          },
        };
      }),
    suspendInstitution: publicProcedure
      .input(
        z.object({
          institutionId: z.string(),
          reason: z.string().min(5),
        })
      )
      .mutation(async () => {
        return {
          success: true,
          message: `Institution suspended. Lockout reason recorded.`,
        };
      }),
    reviveInstitution: publicProcedure
      .input(z.object({ institutionId: z.string() }))
      .mutation(async () => {
        return {
          success: true,
          message: "Institution revived successfully.",
        };
      }),
    softDeleteInstitution: publicProcedure
      .input(z.object({ institutionId: z.string() }))
      .mutation(async () => {
        return {
          success: true,
          message: "Institution soft-deleted into 30-day recovery pool.",
        };
      }),
    listTrash: publicProcedure.query(async () => {
      return [] as {
        resourceType: "INSTITUTION";
        resourceId: string;
        name: string;
        code: string;
        deletedAt: string;
        daysRemaining: number;
        isExpired: boolean;
      }[];
    }),
    restoreFromTrash: publicProcedure
      .input(
        z.object({
          resourceType: z.enum(["INSTITUTION", "USER", "DEPARTMENT"]),
          resourceId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          message: `${input.resourceType} restored from trash.`,
        };
      }),
    listChangeRequests: publicProcedure
      .input(
        z
          .object({
            status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
          })
          .optional()
      )
      .query(async () => {
        return [] as {
          id: string;
          institutionId: string;
          institutionName: string | null;
          requestedBy: string;
          requestedByName: string | null;
          requestedChanges: unknown;
          reason: string;
          status: "PENDING" | "APPROVED" | "REJECTED";
          reviewNotes: string | null;
          reviewedAt: string | null;
          createdAt: string;
        }[];
      }),
    reviewChangeRequest: publicProcedure
      .input(
        z.object({
          requestId: z.string(),
          action: z.enum(["APPROVE", "REJECT"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          message: `Change request marked as ${input.action}.`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;


