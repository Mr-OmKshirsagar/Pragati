# Subject Enrollment & Teacher Tracking Feature

**Problem:** Teachers need to track data for students enrolled in their subjects.

**Current Gap:** No table linking:
1. Teachers → Subjects they teach
2. Students → Subjects they're enrolled in (only `subject_results` tracks results after enrollment)

---

## Schema Additions Needed

### 1. `faculty_subject_assignments` Table (New)
```sql
CREATE TABLE faculty_subject_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  academic_year VARCHAR(32) NOT NULL,
  role VARCHAR(32) DEFAULT 'INSTRUCTOR', -- 'INSTRUCTOR', 'COORDINATOR', 'EXAMINER'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Links faculty members to subjects they teach in specific semesters.

### 2. `subject_enrollments` Table (New)
```sql
CREATE TABLE subject_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  academic_year VARCHAR(32) NOT NULL,
  enrollment_status VARCHAR(32) DEFAULT 'REGISTERED', -- 'REGISTERED', 'DROPPED', 'COMPLETED'
  enrollment_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id, semester)
);
```

**Purpose:** Tracks which students are enrolled in which subjects (separate from results).

---

## Current Schema Analysis

### Existing Tables:
1. **`subjects`** - Department subjects with code, name, credits, semester
2. **`subject_results`** - Student marks/grades for completed subjects  
3. **`users`** - Has `role = 'FACULTY'` for teachers
4. **`student_profiles`** - Student academic info

### Missing Links:
- No way to know which faculty teaches which subject
- No way to know which students are currently enrolled in a subject (only historical results)

---

## Feature Requirements

### For Teachers:
1. **View "My Subjects" Dashboard**
   - List of subjects assigned to them for current semester
   - For each subject: list enrolled students
   - Student data: name, enrollment number, current attendance %, assignment submissions

2. **Track Student Progress**
   - View attendance records per student
   - View assignment submissions and grades
   - View exam performance (when available)
   - Send alerts for at-risk students

3. **Manage Subject Content**
   - Upload syllabus
   - Create assignments
   - Post announcements
   - Grade submissions

### For Students:
1. **View "My Subjects"**
   - List of enrolled subjects for current semester
   - For each subject: teacher info, syllabus, assignments, announcements
   - Submit assignments
   - Check grades and attendance

---

## Proposed Endpoints

### Teacher Endpoints (`facultyRouter`)

1. **`faculty.getMySubjects`**
   ```typescript
   GET /api/trpc/faculty.getMySubjects
   Response: Array<{ subject: Subject, semester: number, academicYear: string, role: string }>
   ```

2. **`faculty.getSubjectStudents`**
   ```typescript
   GET /api/trpc/faculty.getSubjectStudents?subjectId=...&semester=...
   Response: Array<{
     student: StudentProfile,
     enrollment: SubjectEnrollment,
     attendance: number,
     assignmentCount: number,
     avgGrade: number
   }>
   ```

3. **`faculty.recordAttendance`**
   ```typescript
   POST /api/trpc/faculty.recordAttendance
   Body: { subjectId, studentId, date, status: 'PRESENT'|'ABSENT'|'LATE', notes? }
   ```

4. **`faculty.createAssignment`**
   ```typescript
   POST /api/trpc/faculty.createAssignment
   Body: { subjectId, title, description, dueDate, maxMarks, attachments? }
   ```

5. **`faculty.gradeAssignment`**
   ```typescript
   POST /api/trpc/faculty.gradeAssignment
   Body: { assignmentId, studentId, marks, feedback? }
   ```

### Student Endpoints (`studentRouter`)

1. **`student.getMySubjects`**
   ```typescript
   GET /api/trpc/student.getMySubjects?semester=...
   Response: Array<{
     subject: Subject,
     faculty: User,
     enrollment: SubjectEnrollment,
     assignments: Assignment[],
     announcements: Announcement[]
   }>
   ```

2. **`student.submitAssignment`**
   ```typescript
   POST /api/trpc/student.submitAssignment
   Body: { assignmentId, file, submissionText? }
   ```

3. **`student.getSubjectGrades`**
   ```typescript
   GET /api/trpc/student.getSubjectGrades?subjectId=...
   Response: { assignments: AssignmentSubmission[], attendance: number, finalGrade? }
   ```

---

## New Tables Needed

### 1. `faculty_subject_assignments` (M2M: Faculty ↔ Subjects)
```typescript
export const facultySubjectAssignments = pgTable(
  "faculty_subject_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    facultyId: uuid("faculty_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    semester: integer("semester").notNull(),
    academicYear: varchar("academic_year", { length: 32 }).notNull(),
    role: varchar("role", { length: 32 }).default("INSTRUCTOR").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("faculty_subject_semester_unique").on(table.facultyId, table.subjectId, table.semester)]
);
```

### 2. `subject_enrollments` (M2M: Students ↔ Subjects)
```typescript
export const subjectEnrollments = pgTable(
  "subject_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    semester: integer("semester").notNull(),
    academicYear: varchar("academic_year", { length: 32 }).notNull(),
    enrollmentStatus: varchar("enrollment_status", { length: 32 })
      .default("REGISTERED")
      .notNull(),
    enrollmentDate: date("enrollment_date").defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("student_subject_semester_unique").on(table.studentId, table.subjectId, table.semester)]
);
```

### 3. `subject_attendance` (Attendance Records)
```typescript
export const subjectAttendance = pgTable(
  "subject_attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    date: date("date").defaultNow().notNull(),
    status: varchar("status", { length: 32 }).notNull(), // 'PRESENT', 'ABSENT', 'LATE'
    recordedBy: uuid("recorded_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("student_subject_date_unique").on(table.studentId, table.subjectId, table.date)]
);
```

### 4. `assignments` (Subject Assignments)
```typescript
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  facultyId: uuid("faculty_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  maxMarks: integer("max_marks").default(100).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 32 }).default("ACTIVE").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

### 5. `assignment_submissions` (Student Submissions)
```typescript
export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: uuid("assignment_id")
    .notNull()
    .references(() => assignments.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  submissionText: text("submission_text"),
  filePath: text("file_path"),
  marks: numeric("marks", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
  status: varchar("status", { length: 32 }).default("SUBMITTED").notNull(),
});
```

### 6. `subject_announcements` (Teacher Announcements)
```typescript
export const subjectAnnouncements = pgTable("subject_announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  facultyId: uuid("faculty_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: varchar("priority", { length: 32 }).default("NORMAL").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

---

## Integration with Existing System

### Relationship to `subject_results`:
- `subject_enrollments` → Current/past enrollment
- `subject_results` → Final grades after subject completion
- Flow: Enroll → Attend → Complete assignments → Get final result

### Relationship to `academic_records`:
- `subject_results` feeds into `academic_records.sgpa`
- Teacher tracks individual subject performance
- HOD/Analytics aggregates across subjects

---

## RBAC Enforcement

### Teacher Scope:
- Can only access subjects they're assigned to
- Can only view students enrolled in their subjects
- Can only create assignments/announcements for their subjects

### Student Scope:
- Can only access subjects they're enrolled in
- Can only submit assignments for subjects they're enrolled in
- Can only view their own grades/attendance

### Admin/HOD:
- Can assign faculty to subjects
- Can enroll students in subjects
- Can view all subject data across department

---

## Frontend Pages Needed

### 1. **Teacher: Subject Dashboard** (`/faculty/subjects`)
- List of assigned subjects
- Quick stats per subject (enrollment, pending submissions, attendance %)
- Navigation to individual subject pages

### 2. **Teacher: Subject Detail** (`/faculty/subjects/:subjectId`)
- Student roster with attendance/grade summary
- Create/manage assignments
- Post announcements
- Record attendance (bulk or individual)

### 3. **Teacher: Student Detail** (`/faculty/subjects/:subjectId/students/:studentId`)
- Student's attendance record
- Assignment submissions and grades
- Performance trends
- Contact info + send notifications

### 4. **Student: My Subjects** (`/subjects`)
- List of enrolled subjects for current semester
- Assignment deadlines
- Recent announcements
- Quick links to submit assignments

### 5. **Student: Subject Detail** (`/subjects/:subjectId`)
- Subject syllabus
- Assignments list with due dates
- Submit assignment form
- View grades and attendance
- Contact teacher

### 6. **Admin/HOD: Subject Management** (`/admin/subjects`)
- Assign faculty to subjects
- Enroll students in subjects
- View subject analytics
- Manage subject catalog

---

## Migration Strategy

### Phase 1: Schema + Basic CRUD
1. Add new tables to schema
2. Create faculty assignment CRUD endpoints
3. Create student enrollment CRUD endpoints
4. Basic "My Subjects" views for faculty/students

### Phase 2: Attendance Tracking
1. Add attendance table
2. Create attendance recording endpoints
3. Build attendance UI for teachers
4. Add attendance reports

### Phase 3: Assignment Management
1. Add assignment tables
2. Create assignment creation/submission/grading endpoints
3. Build assignment UI for teachers/students
4. Add gradebook view

### Phase 4: Analytics & Reports
1. Add subject performance analytics
2. Build at-risk student alerts
3. Add export features (attendance sheets, grade sheets)
4. Integration with academic records

---

## Integration with Existing Features

### With Skill Tracking:
- Subjects can be linked to skills (already have `skills` table)
- Teacher can tag assignments with relevant skills
- Skill mastery tracked through subject performance

### With Interventions:
- Low attendance → trigger intervention
- Poor assignment performance → trigger intervention
- Teacher can create interventions directly from subject dashboard

### With Academic Records:
- Subject results feed into `subject_results` table
- Final grades populate `academic_records`
- Backlogs automatically tracked from failed subjects

---

## Sample Data Flow

### Teacher Records Attendance:
```
Teacher → Subject Dashboard → Select Date → Mark Attendance → Submit
↓
POST /api/trpc/faculty.recordAttendance (batch)
↓
Insert into subject_attendance
↓
Student sees updated attendance % in their dashboard
↓
If attendance < threshold → trigger notification to student/faculty
```

### Student Submits Assignment:
```
Student → My Subjects → Select Assignment → Upload File → Submit
↓
POST /api/trpc/student.submitAssignment
↓
Insert into assignment_submissions (status: SUBMITTED)
↓
Teacher sees "Pending Grading" in assignment dashboard
↓
Teacher grades → Updates assignment_submissions (marks, feedback, status: GRADED)
↓
Student sees grade + feedback
↓
If marks < passing threshold → trigger intervention
```

### HOD Views Subject Analytics:
```
HOD → Department Analytics → Subject Performance
↓
Query: subject_results aggregated by subject, semester
↓
Show: Pass rate, average marks, top performers, at-risk students
↓
Drill down: View individual teacher performance across subjects
```

---

## Priority Implementation Order

### Week 1: Core Enrollment System
1. Add `faculty_subject_assignments` and `subject_enrollments` tables
2. Create CRUD endpoints for faculty/student subject management
3. Build basic "My Subjects" dashboard for teachers and students
4. Admin interface to assign faculty/enroll students

### Week 2: Attendance Tracking
1. Add `subject_attendance` table
2. Build attendance recording interface for teachers
3. Student attendance view
4. Attendance reports and analytics

### Week 3: Assignment System
1. Add `assignments` and `assignment_submissions` tables
2. Build assignment creation/grading workflow
3. Student assignment submission interface
4. Gradebook view for teachers

### Week 4: Advanced Features
1. Announcements system
2. Analytics and reporting
3. Export features (Excel sheets)
4. Integration with interventions and skill tracking

---

## Success Metrics

1. **Teacher Adoption:** 80% of faculty using system within 1 month
2. **Data Accuracy:** 95% attendance records entered within 24 hours
3. **Student Engagement:** 90% assignment submission rate
4. **Performance Tracking:** Identify at-risk students 2 weeks earlier
5. **Integration:** Seamless flow from subject performance → academic records → skill gaps

---

## Risk Mitigation

### Risk: Faculty resistance to new system
- **Mitigation:** Minimal data entry, bulk operations, mobile-friendly interface
- **Mitigation:** Training sessions, clear benefits demonstration

### Risk: Data migration from existing systems
- **Mitigation:** CSV import/export for initial data load
- **Mitigation:** Parallel run with existing systems for 1 month

### Risk: Performance with large classes
- **Mitigation:** Pagination, lazy loading for student lists
- **Mitigation:** Bulk operations for attendance/grade entry
- **Mitigation:** Index optimization on large tables

---

## Next Steps

1. **Approve Schema Changes:** Add 6 new tables to `drizzle/schema.ts`
2. **Create Migration:** Generate Drizzle migration for new tables
3. **Implement Phase 1:** Basic subject assignment/enrollment endpoints
4. **Build UI:** "My Subjects" dashboard for teachers and students
5. **Test:** RBAC enforcement and integration with existing features

**Estimated Timeline:** 4 weeks to full feature set
**Priority:** High (critical for academic tracking)
**Impact:** Enables complete student performance tracking by teachers
