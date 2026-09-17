# Subject Tracking Feature - Implementation Guide

**Status:** Schema added, Service & Router framework created  
**Issue:** Minor TypeScript date/type compatibility fixes needed  
**Priority:** High - Enables core teacher functionality

---

## What Was Accomplished

### 1. ✅ Schema Extended (6 New Tables)
Added to `backend/drizzle/schema.ts`:

1. **`faculty_subject_assignments`** - Links teachers to subjects they teach
2. **`subject_enrollments`** - Tracks student enrollment in subjects
3. **`subject_attendance`** - Records attendance (PRESENT/ABSENT/LATE)
4. **`assignments`** - Subject assignments created by faculty
5. **`assignment_submissions`** - Student submissions with grades
6. **`subject_announcements`** - Teacher announcements to subject

All types properly exported for use in services.

### 2. ✅ Service Layer Created
Created `backend/src/services/subjectService.ts` with functions:

- `getFacultySubjects()` - List subjects taught by faculty
- `assignFacultyToSubject()` - Assign teacher to subject (admin)
- `getSubjectEnrolledStudents()` - List students in subject
- `enrollStudentInSubject()` - Enroll student (admin)
- `recordAttendance()` - Record attendance entry
- `getAttendancePercentage()` - Calculate attendance %
- `createAssignment()` - Create assignment
- `submitAssignment()` - Student submits assignment
- `gradeAssignmentSubmission()` - Grade & feedback
- `postAnnouncement()` - Teacher announces
- `getSubjectAnalytics()` - Performance summary
- `getAtRiskStudents()` - Identify low performers

### 3. ✅ Router Endpoints Created
Created `backend/src/routers/subject.ts` with 20+ endpoints:

**Faculty Endpoints:**
- `subject.getMySubjects` - My assigned subjects
- `subject.getSubjectStudents` - Student roster
- `subject.recordAttendance` - Single attendance entry
- `subject.recordBulkAttendance` - Batch attendance
- `subject.createAssignment` - Create assignment
- `subject.getSubjectAssignments` - List assignments
- `subject.gradeAssignment` - Grade submission
- `subject.postAnnouncement` - Post to subject
- `subject.getAnnouncements` - View announcements
- `subject.getSubjectAnalytics` - Student performance
- `subject.getAtRiskStudents` - Alert on low performers

**Student Endpoints:**
- `subject.getMySubjectsForStudent` - My enrolled subjects
- `subject.submitAssignment` - Submit work
- `subject.getMyAssignmentSubmissions` - My submissions
- `subject.getMyAttendance` - My attendance record
- `subject.getMyAttendancePercentage` - My attendance %

**Admin Endpoints:**
- `subject.assignFacultyToSubject` - Assign teacher
- `subject.enrollStudentInSubject` - Enroll student
- `subject.removeFacultyFromSubject` - Unassign teacher
- `subject.dropStudentFromSubject` - Drop student

### 4. ✅ Router Registered
Updated `backend/src/routers/index.ts` to include `subjectRouter`

---

## Remaining Fixes (Minor)

### 1. Date Type Compatibility
**Issue:** Drizzle date fields expect string format, not Date objects

**Fix:** 
```typescript
// Convert Date to string
const dateStr = new Date().toISOString().split('T')[0]; // "2026-09-17"

// In enrollmentDate field:
enrollmentDate: dateStr,  // not new Date()
```

**Files to update:**
- `subjectService.ts` - Already done ✅
- Verify `enrollmentDate` type in schema is `date` not `timestamp`

### 2. Missing Service Functions in Router
**Issue:** Router calls functions that weren't exported from service

**Functions to add to `subjectService.ts`:**
```typescript
export async function getStudentEnrolledSubjects(...)
export async function getStudentAssignmentSubmissions(...)
export async function removeFacultyFromSubject(...)
export async function dropStudentFromSubject(...)
```

**Status:** Some need to be added, others need aliases

### 3. Build Steps
```bash
# 1. Fix remaining TypeScript errors
cd backend
npm run build

# 2. Generate migration
npx drizzle-kit generate

# 3. Apply migration
npx drizzle-kit push

# 4. Verify build
npm run build
```

---

## Frontend Components Needed

### For Faculty:

#### 1. `SubjectDashboard.tsx` (Faculty view)
- List of assigned subjects for current semester
- Quick stats: Students enrolled, pending assignments, attendance rate
- Action buttons: View students, Create assignment, Post announcement

#### 2. `SubjectDetail.tsx` (Per subject)
- Left panel: Subject info, faculty contact, announcements
- Right panel: Student roster with attendance/grade summary
- Tabs: Students | Assignments | Attendance | Announcements

#### 3. `StudentRoster.tsx` (In SubjectDetail)
- Table: Student name, enrollment #, attendance %, avg grade, actions
- Actions: View profile, Send alert, Mark attendance
- Filters: By section, by attendance status

#### 4. `AttendanceMarking.tsx`
- Date picker
- List of enrolled students with radio buttons (Present/Absent/Late)
- Bulk actions: Mark all present, mark all absent
- Submit button

#### 5. `AssignmentCreation.tsx`
- Form: Title, Description, Max Marks, Due Date
- Upload attachment (syllabus, rubric)
- Preview before publish
- Submit button

#### 6. `GradeBook.tsx`
- Table: Student | Assignment 1 | Assignment 2 | ... | Avg Grade
- Editable cells for marks/feedback
- Save button
- Filter options

### For Students:

#### 7. `MySubjects.tsx` (Student view)
- Card layout per subject
- Shows: Subject name, faculty, next class, recent announcement
- Action: View details

#### 8. `SubjectDetail.tsx` (Student view - different from faculty)
- Faculty info + contact
- Attendance % (if visible to student)
- Assignments: Due date, status, submission count
- Announcements: Latest first
- Grades: If visible to student

#### 9. `AssignmentSubmission.tsx`
- Assignment details: Title, description, rubric, due date
- Submission form: Text input + file upload
- Submit button
- Already submitted? Show: Submission time, marks, feedback

#### 10. `AttendanceView.tsx`
- Calendar view of attendance
- Filter: By month, by status
- Export to PDF/Excel

---

## Integration Points

### 1. With Existing Features

**With Skill Tracking:**
- Teacher can tag assignments with skills
- Assignment grades → skill_history
- Low assignment grades → trigger skill_gap detection

**With Academic Records:**
- Subject grades accumulate into SGPA/CGPA
- Subject results feed `subjectResults` table (already exists)
- Low subject performance → intervention trigger

**With Interventions:**
- Low attendance → auto-trigger intervention
- Low grades → auto-trigger intervention
- Teacher can create intervention directly from subject dashboard

**With Notifications:**
- New assignment posted → notify all students
- Assignment graded → notify student
- At-risk alert → notify faculty + HOD
- Announcement posted → notify all students

### 2. With Existing Data Model

**`subjects` table:** Already exists with code, name, credits, semester, departmentId
- Reuse for faculty/student subject listing

**`subjectResults` table:** Already exists with marks, grade, status
- Link to assignments: assignments → assignment_submissions → subjectResults (when finalized)

**`academic_records` table:** Aggregates semester GPA
- After all assignments graded → populate subjectResults → accumulate into academicRecords

---

## RBAC Enforcement

### Faculty Scope:
```typescript
// Can only see/modify subjects they teach
facultyProcedure
  .input(z.object({ subjectId: z.string() }))
  .query(async ({ input, ctx }) => {
    // 1. Verify ctx.user teaches subjectId
    const assignment = await db.query.facultySubjectAssignments.findFirst({
      where: and(
        eq(facultySubjectAssignments.facultyId, ctx.user.id),
        eq(facultySubjectAssignments.subjectId, input.subjectId)
      )
    });
    
    if (!assignment) throw new TRPCError({ code: "FORBIDDEN" });
    
    // 2. Proceed with query
    return getSubjectEnrolledStudents(input.subjectId, ...);
  })
```

### Student Scope:
```typescript
// Can only see subjects they're enrolled in
studentProcedure
  .input(z.object({ subjectId: z.string() }))
  .query(async ({ input, ctx }) => {
    const enrollment = await db.query.subjectEnrollments.findFirst({
      where: and(
        eq(subjectEnrollments.studentId, ctx.user.studentProfile.id),
        eq(subjectEnrollments.subjectId, input.subjectId)
      )
    });
    
    if (!enrollment) throw new TRPCError({ code: "FORBIDDEN" });
    
    return getSubjectDetail(input.subjectId);
  })
```

---

## Testing Scenarios

### Faculty Tests:
- [ ] Faculty can see only subjects assigned to them
- [ ] Faculty can view all students enrolled in their subject
- [ ] Faculty can record attendance for students
- [ ] Faculty cannot record attendance for students not in their subject
- [ ] Faculty can create assignments
- [ ] Faculty can grade submissions from enrolled students
- [ ] Faculty cannot grade submissions from non-enrolled students

### Student Tests:
- [ ] Student can see only subjects they're enrolled in
- [ ] Student can submit assignment for their subjects
- [ ] Student can see their grades
- [ ] Student can see their attendance (if enabled)
- [ ] Student can view teacher announcements
- [ ] Student cannot access subjects they're not enrolled in

### Admin Tests:
- [ ] Admin can assign faculty to subjects
- [ ] Admin can enroll students in subjects
- [ ] Admin can bulk enroll multiple students

---

## Performance Considerations

### Indexing Strategy:
```sql
-- Add indexes for common queries
CREATE INDEX idx_faculty_subject_faculty_semester 
ON faculty_subject_assignments(faculty_id, semester);

CREATE INDEX idx_student_enrollment_student_semester 
ON subject_enrollments(student_id, semester);

CREATE INDEX idx_attendance_student_subject 
ON subject_attendance(student_id, subject_id);

CREATE INDEX idx_assignment_subject 
ON assignments(subject_id);
```

### Query Optimization:
- Use `.limit(100)` on large queries (student rosters)
- Implement pagination for assignment submissions
- Cache analytics queries (recalculate on schedule, not per request)

---

## Deployment Steps

### Pre-deployment:
1. Fix remaining TypeScript errors
2. Run `npm run build` - ensure no errors
3. Generate migration: `npx drizzle-kit generate`
4. Review migration SQL
5. Create test data (fixtures)

### Deployment:
1. Apply migration to staging: `npx drizzle-kit push`
2. Test all endpoints on staging
3. Create backup of production database
4. Apply migration to production
5. Monitor error logs

### Post-deployment:
1. Run smoke tests (faculty can view subjects, students can submit assignments)
2. Monitor database performance
3. Gather user feedback
4. Fix bugs (if any)

---

## Success Criteria

| Criterion | Target | How to Verify |
|---|---|---|
| Faculty can view their subjects | 100% | Faculty logs in, sees subject list |
| Faculty can track student attendance | < 2s per entry | Bulk record 50 students, measure time |
| Students can submit assignments | < 1s per submission | Submit 10 assignments, measure time |
| At-risk students identified | 95% accuracy | Manual check vs automated alerts |
| RBAC enforcement | 100% | Attempt cross-role access (should fail) |
| Database performance | < 500ms queries | Monitor slow query log |

---

## Timeline Estimate

- **Week 1:** Fix build errors, frontend component creation (SubjectDashboard, StudentRoster, AttendanceMarking)
- **Week 2:** Assignment & grading UI, announcements, integration with interventions
- **Week 3:** Analytics & at-risk alerts, testing & bug fixes
- **Week 4:** Performance optimization, deployment, user training

**Total:** 4 weeks from now to full feature deployment

---

## Current Blockers

1. **TypeScript Compilation:** Minor type mismatches (dates, schema fields)
   - **Fix Time:** 30 min
   - **Impact:** Blocking build

2. **Missing Aliases:** Some functions called in router but not yet in service
   - **Fix Time:** 15 min
   - **Impact:** Blocking build

3. **Database Migration:** Schema changes need to be applied
   - **Fix Time:** 5 min (generate) + deployment time
   - **Impact:** Can proceed after build

---

## Next Action

Run these commands to fix and verify:

```bash
# 1. Navigate to backend
cd backend

# 2. Fix TypeScript errors (identified above)
# (Manual edits in subjectService.ts)

# 3. Build to check for errors
npm run build

# 4. If build succeeds, generate migration
npx drizzle-kit generate

# 5. Review the generated SQL migration
# File will be in: backend/drizzle/migrations/

# 6. When ready to apply (need DB access):
# npx drizzle-kit push
```

---

**Status:** Ready for quick fixes → full feature build  
**Estimated Fix Time:** 1 hour  
**Impact:** Enables complete teacher-student academic tracking
