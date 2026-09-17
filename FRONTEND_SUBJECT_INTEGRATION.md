# Frontend Subject Tracking Integration Guide

## Overview
Teachers can now track student data (attendance, assignments, grades) for subjects they teach. This guide shows how to integrate the subject tracking APIs into the frontend.

---

## Key Features Available

### For Teachers (Faculty Role)
1. **View Assigned Subjects** - List all subjects they teach
2. **Manage Enrollment** - See all students enrolled in a subject
3. **Track Attendance** - Mark daily attendance (PRESENT/ABSENT/LATE)
4. **Create Assignments** - Post homework/exams with due dates
5. **Grade Submissions** - Review and grade student work
6. **View Analytics** - Class performance dashboard
7. **Identify At-Risk Students** - See who needs intervention
8. **Post Announcements** - Communicate with class

### For Students (Student Role)
1. **View Enrolled Subjects** - See all their classes
2. **Check Attendance** - View attendance % per subject
3. **Submit Assignments** - Upload solutions
4. **View Grades** - Check assignment grades
5. **See Announcements** - Read class announcements

---

## API Endpoints Reference

### Faculty Endpoints

#### Get My Subjects
```typescript
const subjects = await trpc.subject.getMySubjects.query({
  semester: 3,                    // optional
  academicYear: "2024-2025"       // optional
});

// Returns: Array of { assignment, subject }
// assignment: { id, facultyId, subjectId, semester, academicYear, role, createdAt }
// subject: { id, name, code, credits, departmentId, semester }
```

#### Get Subject Students
```typescript
const students = await trpc.subject.getSubjectStudents.query({
  subjectId: "550e8400-e29b-41d4-a716-446655440000",
  semester: 3,
  academicYear: "2024-2025"
});

// Returns: Array of { enrollment, student, user }
// enrollment: { id, studentId, subjectId, enrollmentStatus, enrollmentDate }
// student: { id, enrollmentNumber, program, section, currentSemester }
// user: { id, name, email, role, avatarUrl }
```

#### Record Attendance (Single)
```typescript
const result = await trpc.subject.recordAttendance.mutate({
  studentId: "550e8400-e29b-41d4-a716-446655440001",
  subjectId: "550e8400-e29b-41d4-a716-446655440000",
  date: new Date(),
  status: "PRESENT",              // "PRESENT" | "ABSENT" | "LATE"
  notes: "Arrived on time"        // optional
});
```

#### Record Attendance (Bulk)
```typescript
const result = await trpc.subject.recordBulkAttendance.mutate({
  subjectId: "550e8400-e29b-41d4-a716-446655440000",
  date: new Date(),
  records: [
    { studentId: "uuid-1", status: "PRESENT" },
    { studentId: "uuid-2", status: "ABSENT" },
    { studentId: "uuid-3", status: "LATE" }
  ]
});

// Returns: { success: true, count: 3, message: "..." }
```

#### Create Assignment
```typescript
const assignment = await trpc.subject.createAssignment.mutate({
  subjectId: "550e8400-e29b-41d4-a716-446655440000",
  title: "Chapter 1-2 Problem Set",
  description: "Solve problems 1-10 from textbook pages 10-15",
  maxMarks: 50,                   // optional, default: 100
  dueDate: new Date("2025-09-25T23:59:59Z")
});

// Returns: Assignment object with { id, subjectId, facultyId, title, description, maxMarks, dueDate, status, createdAt }
```

#### Get Subject Assignments
```typescript
const assignments = await trpc.subject.getSubjectAssignments.query({
  subjectId: "550e8400-e29b-41d4-a716-446655440000"
});

// Returns: Array of assignments
```

#### Grade Assignment
```typescript
const result = await trpc.subject.gradeAssignment.mutate({
  submissionId: "550e8400-e29b-41d4-a716-446655440002",
  marks: 45,                      // 0-100
  feedback: "Good work, watch notation in Question 3"  // optional
});

// Returns: Updated submission with { id, marks, feedback, status: "GRADED", gradedAt }
```

#### Post Announcement
```typescript
const announcement = await trpc.subject.postAnnouncement.mutate({
  subjectId: "550e8400-e29b-41d4-a716-446655440000",
  title: "Exam on Sept 28",
  content: "Final exam will cover Chapters 1-5. No external materials allowed.",
  priority: "HIGH"                // optional: "LOW" | "NORMAL" | "HIGH"
});

// Returns: Announcement object
```

#### Get Subject Announcements
```typescript
const announcements = await trpc.subject.getAnnouncements.query({
  subjectId: "550e8400-e29b-41d4-a716-446655440000"
});

// Returns: Array of announcements (latest 10)
```

#### Get Subject Analytics
```typescript
const analytics = await trpc.subject.getSubjectAnalytics.query({
  subjectId: "550e8400-e29b-41d4-a716-446655440000",
  semester: 3
});

// Returns: Array of students with {
//   studentId, studentName, enrollmentNumber, 
//   attendance (0-100), avgMarks, submissionsCount
// }
```

#### Get At-Risk Students
```typescript
const atRiskStudents = await trpc.subject.getAtRiskStudents.query({
  subjectId: "550e8400-e29b-41d4-a716-446655440000",
  semester: 3,
  attendanceThreshold: 75,        // default: 75
  gradeThreshold: 50              // default: 50
});

// Returns: Filtered analytics for students below thresholds
```

---

### Student Endpoints

#### Get My Subjects (for Students)
```typescript
const mySubjects = await trpc.subject.getMySubjectsForStudent.query({
  semester: 3,                    // optional
  academicYear: "2024-2025"       // optional
});

// Returns: Array of { enrollment, subject }
```

#### Submit Assignment
```typescript
const submission = await trpc.subject.submitAssignment.mutate({
  assignmentId: "550e8400-e29b-41d4-a716-446655440003",
  submissionText: "My solution to the problem set...",  // optional
  filePath: "/assignments/solution.pdf"                 // optional
});

// Returns: Submission object with { id, assignmentId, studentId, status: "SUBMITTED" }
```

#### Get My Assignment Submissions
```typescript
const submissions = await trpc.subject.getMyAssignmentSubmissions.query({
  assignmentId: "550e8400-e29b-41d4-a716-446655440003"  // optional - filter by assignment
});

// Returns: Array of { submission, assignment }
```

#### Get My Attendance
```typescript
const attendance = await trpc.subject.getMyAttendance.query({
  subjectId: "550e8400-e29b-41d4-a716-446655440000"
});

// Returns: Array of { id, date, status, recordedBy, notes, createdAt }
```

#### Get My Attendance Percentage
```typescript
const percent = await trpc.subject.getMyAttendancePercentage.query({
  subjectId: "550e8400-e29b-41d4-a716-446655440000"
});

// Returns: { subjectId, attendancePercentage: 85.5 }
```

---

### Admin Endpoints

#### Assign Faculty to Subject
```typescript
await trpc.subject.assignFacultyToSubject.mutate({
  facultyId: "uuid-faculty",
  subjectId: "uuid-subject",
  semester: 3,
  academicYear: "2024-2025",
  role: "INSTRUCTOR"              // optional
});
```

#### Enroll Student in Subject
```typescript
await trpc.subject.enrollStudentInSubject.mutate({
  studentId: "uuid-student",
  subjectId: "uuid-subject",
  semester: 3,
  academicYear: "2024-2025"
});
```

#### Remove Faculty from Subject
```typescript
await trpc.subject.removeFacultyFromSubject.mutate({
  facultyId: "uuid-faculty",
  subjectId: "uuid-subject",
  semester: 3
});
```

#### Drop Student from Subject
```typescript
await trpc.subject.dropStudentFromSubject.mutate({
  studentId: "uuid-student",
  subjectId: "uuid-subject",
  semester: 3
});
```

---

## Component Examples

### Example 1: Attendance Marking (Faculty)

```typescript
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function AttendanceMarking({ subjectId }: { subjectId: string }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [records, setRecords] = useState<Array<{ studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }>>([]);

  const { data: students } = trpc.subject.getSubjectStudents.useQuery({
    subjectId,
    semester: 3,
    academicYear: "2024-2025"
  });

  const recordAttendance = trpc.subject.recordBulkAttendance.useMutation();

  const handleMarkAttendance = async () => {
    await recordAttendance.mutateAsync({
      subjectId,
      date: selectedDate,
      records
    });
    alert("Attendance marked successfully!");
  };

  const toggleStudentStatus = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    setRecords(prev => {
      const existing = prev.find(r => r.studentId === studentId);
      if (existing) {
        return prev.map(r => r.studentId === studentId ? { ...r, status } : r);
      }
      return [...prev, { studentId, status }];
    });
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-4">Mark Attendance</h2>
      
      <input
        type="date"
        value={selectedDate.toISOString().split("T")[0]}
        onChange={e => setSelectedDate(new Date(e.target.value))}
        className="mb-4 p-2 border rounded"
      />

      <div className="space-y-2">
        {students?.map(({ student, user }) => (
          <div key={student.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>{user.name}</span>
            <div className="space-x-2">
              <button
                onClick={() => toggleStudentStatus(student.id, "PRESENT")}
                className={`px-2 py-1 rounded ${records.find(r => r.studentId === student.id)?.status === "PRESENT" ? "bg-green-500 text-white" : "bg-gray-200"}`}
              >
                Present
              </button>
              <button
                onClick={() => toggleStudentStatus(student.id, "ABSENT")}
                className={`px-2 py-1 rounded ${records.find(r => r.studentId === student.id)?.status === "ABSENT" ? "bg-red-500 text-white" : "bg-gray-200"}`}
              >
                Absent
              </button>
              <button
                onClick={() => toggleStudentStatus(student.id, "LATE")}
                className={`px-2 py-1 rounded ${records.find(r => r.studentId === student.id)?.status === "LATE" ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
              >
                Late
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleMarkAttendance}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        disabled={recordAttendance.isPending}
      >
        {recordAttendance.isPending ? "Saving..." : "Save Attendance"}
      </button>
    </div>
  );
}
```

### Example 2: Student Attendance View

```typescript
export function StudentAttendanceView({ subjectId }: { subjectId: string }) {
  const { data: attendanceRecords, isLoading } = trpc.subject.getMyAttendance.useQuery({ subjectId });
  const { data: percent } = trpc.subject.getMyAttendancePercentage.useQuery({ subjectId });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-4">My Attendance</h2>
      
      <div className="mb-4 p-4 bg-blue-50 rounded">
        <span className="text-2xl font-bold">{percent?.attendancePercentage?.toFixed(1)}%</span>
        <span className="ml-2 text-gray-600">attendance</span>
      </div>

      <div className="space-y-2">
        {attendanceRecords?.map(record => (
          <div key={record.id} className="flex justify-between p-2 bg-gray-50 rounded">
            <span className="font-medium">{new Date(record.date).toDateString()}</span>
            <span className={`px-2 py-1 rounded text-white ${
              record.status === "PRESENT" ? "bg-green-500" : record.status === "ABSENT" ? "bg-red-500" : "bg-yellow-500"
            }`}>
              {record.status}
            </span>
            {record.notes && <span className="text-sm text-gray-600">{record.notes}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Class Analytics Dashboard

```typescript
export function ClassAnalytics({ subjectId }: { subjectId: string }) {
  const { data: analytics } = trpc.subject.getSubjectAnalytics.useQuery({
    subjectId,
    semester: 3
  });
  const { data: atRisk } = trpc.subject.getAtRiskStudents.useQuery({
    subjectId,
    semester: 3,
    attendanceThreshold: 75,
    gradeThreshold: 50
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="font-bold text-red-900">At-Risk Students</h3>
        <p className="text-2xl font-bold text-red-600">{atRisk?.length || 0}</p>
        <ul className="mt-2 space-y-1">
          {atRisk?.map(student => (
            <li key={student.studentId} className="text-sm text-red-700">
              {student.studentName} ({student.attendance}% attendance)
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-bold text-blue-900">Class Performance</h3>
        <p className="text-sm text-blue-700">
          {analytics?.length || 0} students enrolled
        </p>
        <div className="mt-2 space-y-1">
          {analytics?.slice(0, 5).map(student => (
            <div key={student.studentId} className="flex justify-between text-xs">
              <span>{student.studentName}</span>
              <span className={student.attendance >= 75 ? "text-green-600" : "text-red-600"}>
                {student.attendance}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Error Handling

All endpoints may throw errors. Wrap calls in try-catch:

```typescript
try {
  const result = await trpc.subject.recordAttendance.mutate({...});
} catch (error) {
  if (error.code === "UNAUTHORIZED") {
    console.error("Not authenticated");
  } else if (error.code === "FORBIDDEN") {
    console.error("You don't have permission for this action");
  } else {
    console.error("Error:", error.message);
  }
}
```

---

## Rate Limiting

Subject tracking endpoints are rate-limited per user:
- Faculty: 100 requests/minute
- Students: 50 requests/minute
- Admin: 200 requests/minute

See `backend/src/_core/middleware/rateLimit.ts` for details.

---

## Type Safety

All endpoints are fully typed through tRPC:

```typescript
// Get full type for students query
type StudentResponse = Awaited<ReturnType<typeof trpc.subject.getSubjectStudents.query>>;

// Get input type for mutation
type SubmitInput = Parameters<typeof trpc.subject.submitAssignment.useMutation>[0];
```

---

## Next: Build These Components

1. **SubjectDashboard** - Main teacher hub
2. **AttendanceMarking** - Daily attendance
3. **AssignmentCreation** - Create homework
4. **GradeBook** - View/manage grades
5. **StudentSubjectView** - Student's class view
6. **ClassAnalytics** - Performance dashboard
7. **AtRiskAlerts** - Intervention flags
8. **AnnouncementPanel** - Class announcements

---

**Status:** Ready for frontend integration  
**Test Server:** `npm run dev` (backend)
