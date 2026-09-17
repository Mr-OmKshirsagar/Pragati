# PRAGATI — RBAC Enforcement Patterns Guide

**Purpose:** Concrete code patterns to prevent IDOR, ensure scope boundaries, and maintain the "RBAC-is-your-differentiator" claim.

**Principle:** Scope is **always** derived from authenticated context (`ctx.user`), **never** from user input.

---

## Pattern 1: Student Self-Scoped Query

**Use Case:** Student views their own data (profile, skills, academics, interventions).

**Template:**
```typescript
// In student router
getProfile: studentProcedure.query(async ({ ctx }) => {
  // ✅ CORRECT: Use ctx.user.studentProfile.id (derived from session)
  return studentService.getStudentProfile(ctx.user.studentProfile.id);
  
  // ❌ WRONG: Accept studentId from input
  // getStudentProfile(input.studentId) // <-- IDOR vulnerability
});
```

**Service Layer (studentService.ts):**
```typescript
export async function getStudentProfile(studentId: string) {
  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.id, studentId),
  });
  if (!profile) throw new Error("Profile not found");
  return profile;
}
// Service doesn't need to re-check scope (router already enforced it)
```

**Result:** If Alice (student A) tries to access Bob's (student B) data, the `ctx.user.studentProfile.id` will always be Alice's, so Bob's profile is inaccessible.

---

## Pattern 2: Faculty Ward-Scoped Query

**Use Case:** Faculty views interventions only for assigned students.

**Template:**
```typescript
// In faculty router
getWardInterventions: facultyProcedure
  .input(z.object({ studentId: z.string().uuid() }))
  .query(async ({ input, ctx }) => {
    // ✅ CORRECT: Validate studentId is in faculty's assigned wards
    const wards = await interventionService.getAssignedWards(ctx.user.id);
    const wardIds = wards.map(w => w.id);
    
    if (!wardIds.includes(input.studentId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Student is not assigned to you",
      });
    }
    
    return interventionService.getStudentInterventions(input.studentId);
  }),

// ❌ WRONG: Skip the ward validation check
//   → Directly call getStudentInterventions(input.studentId)
//   → Any faculty can now see any student's interventions
```

**Service Layer (interventionService.ts):**
```typescript
export async function getAssignedWards(facultyId: string) {
  return db.query.studentProfiles.findMany({
    where: eq(studentProfiles.assignedFacultyId, facultyId),
  });
}

export async function getStudentInterventions(studentId: string) {
  // Caller (router) already validated scope; service returns data
  return db.query.interventions.findMany({
    where: eq(interventions.studentId, studentId),
    with: { skillGap: true },
  });
}
```

---

## Pattern 3: Mutation with Ownership Validation

**Use Case:** Faculty creates an intervention for a ward (but must be their ward).

**Template:**
```typescript
// In faculty router
createIntervention: facultyProcedure
  .input(
    z.object({
      studentId: z.string().uuid(),
      skillGapId: z.string().uuid(),
      type: z.enum(["MENTORING", "REMEDIAL_CLASS", "ASSIGNMENT"]),
      description: z.string().min(5),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // 1. Validate studentId is faculty's assigned ward
    const wards = await interventionService.getAssignedWards(ctx.user.id);
    const wardIds = wards.map(w => w.id);
    
    if (!wardIds.includes(input.studentId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Can only create interventions for your assigned students",
      });
    }
    
    // 2. Validate skillGapId belongs to this student
    const skillGap = await db.query.skillGaps.findFirst({
      where: and(
        eq(skillGaps.id, input.skillGapId),
        eq(skillGaps.studentId, input.studentId)
      ),
    });
    
    if (!skillGap) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Skill gap not found for this student",
      });
    }
    
    // 3. Call service with ctx.user.id (faculty identity)
    return interventionService.createIntervention({
      assignedBy: ctx.user.id, // ← from ctx, not input
      studentId: input.studentId,
      skillGapId: input.skillGapId,
      type: input.type,
      description: input.description,
    });
  }),
```

**Service Layer (interventionService.ts):**
```typescript
export async function createIntervention(data: {
  assignedBy: string; // from ctx.user.id
  studentId: string;
  skillGapId: string;
  type: string;
  description: string;
}) {
  // Router already validated ownership; service just inserts
  return db.insert(interventions).values({
    id: nanoid(),
    assignedBy: data.assignedBy,
    studentId: data.studentId,
    skillGapId: data.skillGapId,
    type: data.type,
    description: data.description,
    status: "ACTIVE",
    createdAt: new Date(),
  }).returning();
}
```

---

## Pattern 4: Institution-Scoped Query (TNP)

**Use Case:** TNP officer views only their institution's recruitment drives.

**Template:**
```typescript
// In tnp router
getPlacements: tnpProcedure.query(async ({ ctx }) => {
  // ✅ CORRECT: Filter by ctx.user.institutionId
  return placementService.getTnpPlacements(ctx.user.institutionId);
  
  // ❌ WRONG: No institutionId filter
  //   → TNP from Inst A sees Inst B's drives
});
```

**Service Layer (placementService.ts):**
```typescript
export async function getTnpPlacements(institutionId: string) {
  return db.query.recruitmentDrives.findMany({
    where: eq(recruitmentDrives.institutionId, institutionId),
    with: {
      eligibilityEvaluations: true,
      applications: true,
    },
  });
}
```

**CRITICAL:** When updating, also validate drive ownership:
```typescript
export async function updatePlacement(
  id: string,
  institutionId: string, // from ctx.user.institutionId
  data: UpdatePlacementData
) {
  // 1. Fetch drive and verify ownership
  const drive = await db.query.recruitmentDrives.findFirst({
    where: and(
      eq(recruitmentDrives.id, id),
      eq(recruitmentDrives.institutionId, institutionId)
    ),
  });
  
  if (!drive) {
    throw new Error("Drive not found or not owned by this institution");
  }
  
  // 2. Update
  return db.update(recruitmentDrives)
    .set(data)
    .where(eq(recruitmentDrives.id, id))
    .returning();
}
```

---

## Pattern 5: Department-Scoped Query (HOD)

**Use Case:** HOD views analytics only for their department.

**Template:**
```typescript
// In hod router (to be built in Phase 9)
getDepartmentStats: hodProcedure.query(async ({ ctx }) => {
  // ✅ CORRECT: Filter by ctx.user.departmentId
  return analyticsService.getDepartmentStats(ctx.user.departmentId);
  
  // ❌ WRONG: Accept departmentId from input
  //   → HOD could query other departments
});
```

**Service Layer (analyticsService.ts):**
```typescript
export async function getDepartmentStats(departmentId: string) {
  // Aggregate stats for this department only
  const students = await db.query.studentProfiles.findMany({
    where: eq(studentProfiles.departmentId, departmentId),
  });
  
  const studentIds = students.map(s => s.id);
  
  // Average CGPA
  const academicRecords = await db.query.academicRecords.findMany({
    where: inArray(academicRecords.studentId, studentIds),
  });
  const avgCgpa = academicRecords.reduce((sum, ar) => sum + ar.cgpa, 0) / academicRecords.length;
  
  // Active backlogs count
  const activeBacklogs = await db.query.backlogs.findMany({
    where: and(
      inArray(backlogs.studentId, studentIds),
      eq(backlogs.status, "ACTIVE")
    ),
  });
  
  return {
    departmentId,
    totalStudents: students.length,
    avgCgpa,
    activeBacklogCount: activeBacklogs.length,
    // ... more stats
  };
}
```

---

## Pattern 6: Bulk Evaluation with Scope Boundary

**Use Case:** TNP runs eligibility evaluation for all students in their institution, writes results to `eligibility_evaluations`.

**Template:**
```typescript
// In tnp router
evaluateEligibility: tnpProcedure
  .input(z.object({ driveId: z.string().uuid() }))
  .mutation(async ({ input, ctx }) => {
    // 1. Validate drive belongs to this institution
    const drive = await db.query.recruitmentDrives.findFirst({
      where: and(
        eq(recruitmentDrives.id, input.driveId),
        eq(recruitmentDrives.institutionId, ctx.user.institutionId)
      ),
    });
    
    if (!drive) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Drive not found or not owned by your institution",
      });
    }
    
    // 2. Fetch the placement rule
    const rule = await db.query.placementRules.findFirst({
      where: eq(placementRules.recruitmentDriveId, input.driveId),
    });
    
    if (!rule) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No rule defined for this drive",
      });
    }
    
    // 3. Call service to evaluate all students in institution
    return placementService.evaluateEligibilityForInstitution({
      driveId: input.driveId,
      institutionId: ctx.user.institutionId,
      ruleAST: rule.ruleDefinition,
    });
  }),
```

**Service Layer (placementService.ts):**
```typescript
export async function evaluateEligibilityForInstitution(data: {
  driveId: string;
  institutionId: string;
  ruleAST: RuleAST;
}) {
  // 1. Fetch all students in institution
  const students = await db.query.studentProfiles.findMany({
    where: eq(studentProfiles.institutionId, data.institutionId),
    with: {
      academicRecords: true,
      backlogs: true,
      skillHistory: true,
      internships: true,
    },
  });
  
  // 2. For each student, evaluate rule
  const evaluations = [];
  for (const student of students) {
    const eligible = evaluateRuleAST(data.ruleAST, student);
    const reasons = getEligibilityReasons(data.ruleAST, student);
    
    evaluations.push({
      id: nanoid(),
      recruitmentDriveId: data.driveId,
      studentId: student.id,
      eligible,
      reasons,
      evaluatedAt: new Date(),
    });
  }
  
  // 3. Bulk insert
  return db.insert(eligibilityEvaluations).values(evaluations).returning();
}
```

---

## Pattern 7: Student Evidence Upload (Ownership + Storage)

**Use Case:** Student uploads evidence; system validates student owns the evidence record before writing to storage.

**Template:**
```typescript
// In student router
uploadEvidence: studentProcedure
  .input(
    z.object({
      achievementId: z.string().uuid(),
      file: z.instanceof(File),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // 1. Validate achievement belongs to this student
    const achievement = await db.query.achievements.findFirst({
      where: and(
        eq(achievements.id, input.achievementId),
        eq(achievements.studentId, ctx.user.studentProfile.id)
      ),
    });
    
    if (!achievement) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Achievement not found or not owned by you",
      });
    }
    
    // 2. Upload to storage (S3) and compute SHA256
    const sha256Hash = await computeSha256(input.file);
    const storagePath = `student/${ctx.user.studentProfile.id}/${input.achievementId}/${nanoid()}`;
    
    await uploadToS3(input.file, storagePath);
    
    // 3. Record in evidence_documents
    const doc = await db.insert(evidenceDocuments).values({
      id: nanoid(),
      achievementId: input.achievementId,
      storagePath,
      sha256Hash,
      mimeType: input.file.type,
      createdAt: new Date(),
    }).returning();
    
    return {
      success: true,
      document: doc,
      hash: sha256Hash,
    };
  }),
```

---

## Pattern 8: Faculty Verifies Evidence (Triple Check)

**Use Case:** Faculty reviews evidence for a student's internship; must validate (1) faculty assigned to student, (2) evidence belongs to that student, (3) evidence not already verified.

**Template:**
```typescript
// In faculty router
verifyInternshipEvidence: facultyProcedure
  .input(
    z.object({
      evidenceId: z.string().uuid(),
      approvalStatus: z.enum(["APPROVED", "REJECTED"]),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // 1. Fetch evidence and trace ownership
    const evidence = await db.query.internshipEvidence.findFirst({
      where: eq(internshipEvidence.id, input.evidenceId),
      with: {
        internship: {
          with: { studentProfile: true },
        },
      },
    });
    
    if (!evidence) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Evidence not found",
      });
    }
    
    const studentId = evidence.internship.studentProfile.id;
    
    // 2. Validate faculty is assigned to this student
    const wards = await interventionService.getAssignedWards(ctx.user.id);
    const wardIds = wards.map(w => w.id);
    
    if (!wardIds.includes(studentId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not assigned to this student",
      });
    }
    
    // 3. Check evidence not already verified
    if (evidence.verificationStatus === "VERIFIED") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Evidence already verified",
      });
    }
    
    // 4. Create verification record
    const verification = await db.insert(verifications).values({
      id: nanoid(),
      resourceType: "INTERNSHIP_EVIDENCE",
      resourceId: input.evidenceId,
      verifierUserId: ctx.user.id,
      status: input.approvalStatus,
      notes: input.notes,
      createdAt: new Date(),
    }).returning();
    
    // 5. Update evidence status
    await db.update(internshipEvidence)
      .set({
        verificationStatus: input.approvalStatus === "APPROVED" ? "VERIFIED" : "REJECTED",
        verifiedAt: new Date(),
      })
      .where(eq(internshipEvidence.id, input.evidenceId));
    
    return {
      success: true,
      verification,
    };
  }),
```

---

## Pattern 9: Admin Audit Trail (No Scope Filter, Full Logging)

**Use Case:** Admin views institution-wide audit log; no department filtering.

**Template:**
```typescript
// In admin router
getAuditLogs: adminProcedure
  .input(
    z.object({
      resourceType: z.string().optional(),
      limit: z.number().default(100),
      offset: z.number().default(0),
    })
  )
  .query(async ({ input, ctx }) => {
    // ✅ CORRECT: No institutionId or departmentId filter
    // (ADMIN is org-wide)
    const logs = await db.query.auditLogs.findMany({
      where: input.resourceType 
        ? eq(auditLogs.resourceType, input.resourceType)
        : undefined,
      orderBy: desc(auditLogs.createdAt),
      limit: input.limit,
      offset: input.offset,
    });
    
    return logs;
  }),
```

---

## Checklist: Before Submitting Code

- [ ] **Scope Derived from ctx:** All identity/scope comes from `ctx.user.*`, never from input
- [ ] **Input Validated Against Scope:** If input contains a resource ID, validate it belongs to the user's scope
- [ ] **Service Layer Doesn't Re-check:** Router enforces scope; service trusts router and focuses on business logic
- [ ] **No Unfiltered Bulk Queries:** Never `findMany()` without a WHERE clause that includes scope
- [ ] **Mutation Ownership Check:** Every `.mutation()` validates input ownership before writing
- [ ] **Audit Logged:** Sensitive mutations (create user, verify evidence, update status) logged to `audit_logs`
- [ ] **Error Messages Generic:** Don't reveal whether resource exists if out of scope (e.g., return generic "Not found" instead of "You don't have access to this student")
- [ ] **Test RBAC Negative Cases:** Write tests that verify role X **cannot** access resource owned by role Y

---

## Anti-Patterns to Avoid

```typescript
// ❌ IDOR: Accept and trust userId from input
getProfile: studentProcedure
  .input(z.object({ studentId: z.string() }))
  .query(async ({ input }) => studentService.getStudentProfile(input.studentId));

// ❌ Privilege Escalation: Don't validate role in input
updateUser: adminProcedure
  .input(z.object({ userId: z.string(), role: z.string() }))
  .mutation(async ({ input }) => userService.updateRole(input.userId, input.role));
// ^ Should enforce role is one of allowed enum values

// ❌ Cross-Department Access: Unfiltered query
getDepartmentStats: hodProcedure.query(async ({ input }) => {
  // Missing: WHERE departmentId = ctx.user.departmentId
  return db.query.academicRecords.findMany();
});

// ❌ No Verification on Update: Mutate without ownership check
updateIntervention: facultyProcedure
  .input(z.object({ interventionId: z.string(), status: z.string() }))
  .mutation(async ({ input }) => {
    // Missing: validate ctx.user is assignedBy
    return interventionService.updateStatus(input.interventionId, input.status);
  });
```

---

**Last Updated:** September 17, 2026  
**Purpose:** Handed to coding agents to enforce IDOR resistance & scope isolation
