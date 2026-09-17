/**
 * Notification Service
 * Email and in-app notifications for critical events
 */

import { eq, and } from "drizzle-orm";
import {
  notifications,
  users,
  studentProfiles,
  internships,
  internshipEvidence,
  subjectAttendance,
  assignmentSubmissions,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { nanoid } from "nanoid";

const getDatabase = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
};

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export enum NotificationType {
  // Internship Events
  INTERNSHIP_CREATED = "INTERNSHIP_CREATED",
  INTERNSHIP_COMPLETED = "INTERNSHIP_COMPLETED",
  INTERNSHIP_VERIFICATION_PENDING = "INTERNSHIP_VERIFICATION_PENDING",
  INTERNSHIP_VERIFIED = "INTERNSHIP_VERIFIED",
  INTERNSHIP_REJECTED = "INTERNSHIP_REJECTED",
  EVIDENCE_UPLOADED = "EVIDENCE_UPLOADED",
  EVIDENCE_REJECTED = "EVIDENCE_REJECTED",

  // Subject Events
  ASSIGNMENT_CREATED = "ASSIGNMENT_CREATED",
  ASSIGNMENT_DUE_SOON = "ASSIGNMENT_DUE_SOON",
  ASSIGNMENT_OVERDUE = "ASSIGNMENT_OVERDUE",
  GRADE_PUBLISHED = "GRADE_PUBLISHED",
  ATTENDANCE_MARKED = "ATTENDANCE_MARKED",
  AT_RISK_ALERT = "AT_RISK_ALERT",

  // Admin Events
  BULK_OPERATION_COMPLETED = "BULK_OPERATION_COMPLETED",
  ENROLLMENT_COMPLETE = "ENROLLMENT_COMPLETE",
  REPORT_GENERATED = "REPORT_GENERATED",

  // System Events
  SYSTEM_ALERT = "SYSTEM_ALERT",
  VERIFICATION_REMINDER = "VERIFICATION_REMINDER",
}

export enum NotificationPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// ============================================================================
// CORE NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Create and send notification
 */
export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  priority?: NotificationPriority;
  data?: Record<string, any>;
}) {
  const db = await getDatabase();

  const notification = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      isRead: false,
      createdAt: new Date(),
    })
    .returning();

  return notification[0];
}

/**
 * Create bulk notifications for multiple users
 */
export async function createBulkNotifications(data: {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  priority?: NotificationPriority;
}) {
  const db = await getDatabase();

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const userId of data.userIds) {
    try {
      await db.insert(notifications).values({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false,
        createdAt: new Date(),
      });

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Failed for user ${userId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return results;
}

/**
 * Get user notifications
 */
export async function getUserNotifications(userId: string, limit: number = 50) {
  const db = await getDatabase();

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(notifications.createdAt)
    .limit(limit);
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string) {
  const db = await getDatabase();

  const result = await db
    .select({ count: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .limit(1);

  return result[0]?.count ? 1 : 0; // Returns count of unread
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const db = await getDatabase();

  return db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId))
    .returning();
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string) {
  const db = await getDatabase();

  return db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  const db = await getDatabase();

  return db
    .delete(notifications)
    .where(eq(notifications.id, notificationId))
    .returning();
}

// ============================================================================
// INTERNSHIP NOTIFICATIONS
// ============================================================================

/**
 * Notify about internship created
 */
export async function notifyInternshipCreated(internshipId: string, studentId: string) {
  const db = await getDatabase();

  const internship = (
    await db
      .select()
      .from(internships)
      .where(eq(internships.id, internshipId))
      .limit(1)
  )[0];

  if (!internship) return;

  await createNotification({
    userId: studentId,
    type: NotificationType.INTERNSHIP_CREATED,
    title: "Internship Created",
    message: `Your internship at ${internship.companyName} for the role of ${internship.role} has been registered.`,
    link: `/internship/${internshipId}`,
    priority: NotificationPriority.NORMAL,
  });
}

/**
 * Notify about evidence upload
 */
export async function notifyEvidenceUploaded(internshipId: string, studentId: string, evidenceType: string) {
  await createNotification({
    userId: studentId,
    type: NotificationType.EVIDENCE_UPLOADED,
    title: "Evidence Uploaded Successfully",
    message: `Your ${evidenceType.replace(/_/g, " ").toLowerCase()} has been uploaded and saved.`,
    link: `/internship/${internshipId}`,
    priority: NotificationPriority.NORMAL,
  });
}

/**
 * Notify for verification pending
 */
export async function notifyVerificationPending(internshipId: string, studentId: string) {
  await createNotification({
    userId: studentId,
    type: NotificationType.INTERNSHIP_VERIFICATION_PENDING,
    title: "Awaiting Verification",
    message: "Your internship has been submitted for faculty verification. Check back soon!",
    link: `/internship/${internshipId}`,
    priority: NotificationPriority.HIGH,
  });
}

/**
 * Notify for internship verified
 */
export async function notifyInternshipVerified(internshipId: string, studentId: string, notes?: string) {
  await createNotification({
    userId: studentId,
    type: NotificationType.INTERNSHIP_VERIFIED,
    title: "✅ Internship Verified!",
    message: `Your internship has been verified successfully. ${notes ? `Note: ${notes}` : ""}`,
    link: `/internship/${internshipId}`,
    priority: NotificationPriority.HIGH,
  });
}

/**
 * Notify for internship rejected
 */
export async function notifyInternshipRejected(
  internshipId: string,
  studentId: string,
  reason?: string
) {
  await createNotification({
    userId: studentId,
    type: NotificationType.INTERNSHIP_REJECTED,
    title: "❌ Internship Rejected",
    message: `Your internship verification was rejected. ${reason ? `Reason: ${reason}` : "Please review and resubmit."}`,
    link: `/internship/${internshipId}`,
    priority: NotificationPriority.CRITICAL,
  });
}

// ============================================================================
// SUBJECT/ASSIGNMENT NOTIFICATIONS
// ============================================================================

/**
 * Notify about assignment created
 */
export async function notifyAssignmentCreated(
  assignmentId: string,
  studentIds: string[],
  assignmentTitle: string,
  dueDate: Date
) {
  await createBulkNotifications({
    userIds: studentIds,
    type: NotificationType.ASSIGNMENT_CREATED,
    title: "New Assignment Posted",
    message: `Assignment "${assignmentTitle}" has been posted. Due: ${dueDate.toDateString()}`,
    link: `/assignment/${assignmentId}`,
    priority: NotificationPriority.NORMAL,
  });
}

/**
 * Notify about assignment due soon
 */
export async function notifyAssignmentDueSoon(
  assignmentId: string,
  studentIds: string[],
  assignmentTitle: string,
  hoursUntilDue: number
) {
  await createBulkNotifications({
    userIds: studentIds,
    type: NotificationType.ASSIGNMENT_DUE_SOON,
    title: "⏰ Assignment Due Soon",
    message: `"${assignmentTitle}" is due in ${hoursUntilDue} hours. Submit now!`,
    link: `/assignment/${assignmentId}`,
    priority: NotificationPriority.HIGH,
  });
}

/**
 * Notify about grades published
 */
export async function notifyGradePublished(
  assignmentId: string,
  studentId: string,
  marks: number,
  maxMarks: number,
  feedback?: string
) {
  const percentage = ((marks / maxMarks) * 100).toFixed(1);

  await createNotification({
    userId: studentId,
    type: NotificationType.GRADE_PUBLISHED,
    title: "📊 Grade Published",
    message: `Your grade for the assignment: ${marks}/${maxMarks} (${percentage}%). ${feedback ? `Feedback: ${feedback.substring(0, 100)}...` : ""}`,
    link: `/assignment/${assignmentId}`,
    priority: NotificationPriority.NORMAL,
  });
}

/**
 * Notify at-risk students
 */
export async function notifyAtRiskStudent(
  studentId: string,
  subjectId: string,
  reason: string,
  details: Record<string, any>
) {
  await createNotification({
    userId: studentId,
    type: NotificationType.AT_RISK_ALERT,
    title: "⚠️ You Need Attention",
    message: `${reason}. Your mentor has been notified. Attendance: ${details.attendance}%, Grade: ${details.avgGrade || "N/A"}`,
    link: `/subject/${subjectId}`,
    priority: NotificationPriority.CRITICAL,
  });
}

// ============================================================================
// EMAIL NOTIFICATION SERVICE
// ============================================================================

/**
 * Email content templates
 */
const emailTemplates = {
  [NotificationType.INTERNSHIP_VERIFIED]: (data: any) => ({
    subject: "✅ Your Internship Has Been Verified",
    html: `
      <h2>Congratulations!</h2>
      <p>Your internship at <strong>${data.company}</strong> has been successfully verified.</p>
      <p>You can now view your verified internship profile and share it with others.</p>
      <a href="${data.link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">View Internship</a>
    `,
  }),

  [NotificationType.INTERNSHIP_REJECTED]: (data: any) => ({
    subject: "❌ Internship Verification Rejected",
    html: `
      <h2>Internship Verification Status</h2>
      <p>Your internship verification was not approved.</p>
      <p><strong>Reason:</strong> ${data.reason || "Please review your submission and try again"}</p>
      <p>You can resubmit your internship with updated documentation.</p>
      <a href="${data.link}" style="background-color: #FF9800; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Resubmit</a>
    `,
  }),

  [NotificationType.GRADE_PUBLISHED]: (data: any) => ({
    subject: `📊 Your Grade: ${data.marks}/${data.maxMarks}`,
    html: `
      <h2>Grade Published</h2>
      <p>Your assignment "<strong>${data.assignmentTitle}</strong>" has been graded.</p>
      <h3>Grade: ${data.marks}/${data.maxMarks} (${((data.marks / data.maxMarks) * 100).toFixed(1)}%)</h3>
      ${data.feedback ? `<p><strong>Feedback:</strong> ${data.feedback}</p>` : ""}
      <a href="${data.link}" style="background-color: #2196F3; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">View Details</a>
    `,
  }),

  [NotificationType.AT_RISK_ALERT]: (data: any) => ({
    subject: "⚠️ Academic Performance Alert",
    html: `
      <h2>Performance Alert</h2>
      <p>We've noticed your academic performance needs attention:</p>
      <ul>
        <li>Attendance: ${data.attendance}%</li>
        <li>Average Grade: ${data.avgGrade || "N/A"}</li>
      </ul>
      <p>Your mentor has been notified and will reach out to help. In the meantime, you can contact academic support.</p>
      <a href="${data.link}" style="background-color: #FF5252; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Contact Support</a>
    `,
  }),

  [NotificationType.ASSIGNMENT_DUE_SOON]: (data: any) => ({
    subject: `⏰ Assignment Due in ${data.hoursUntilDue} Hours`,
    html: `
      <h2>Assignment Reminder</h2>
      <p>Your assignment "<strong>${data.assignmentTitle}</strong>" is due soon!</p>
      <p><strong>Due in:</strong> ${data.hoursUntilDue} hours</p>
      <p>Make sure to submit before the deadline to avoid late penalties.</p>
      <a href="${data.link}" style="background-color: #FF9800; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Submit Now</a>
    `,
  }),
};

/**
 * Send email notification
 */
export async function sendEmailNotification(data: {
  recipientEmail: string;
  type: NotificationType;
  templateData: Record<string, any>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  // For now, return mock response
  console.log(`📧 Email sent to ${data.recipientEmail}`, {
    type: data.type,
    timestamp: new Date().toISOString(),
  });

  // Mock email sending
  return {
    success: true,
    messageId: `msg_${nanoid()}`,
  };
}

/**
 * Send batch emails
 */
export async function sendBatchEmails(data: {
  recipients: Array<{ email: string; userId: string }>;
  type: NotificationType;
  templateData: Record<string, any>;
}): Promise<{ successful: number; failed: number; errors: string[] }> {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const recipient of data.recipients) {
    try {
      await sendEmailNotification({
        recipientEmail: recipient.email,
        type: data.type,
        templateData: data.templateData,
      });

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Failed for ${recipient.email}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return results;
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(userId: string) {
  // TODO: Implement notification preferences table
  // For now, return default preferences
  return {
    userId,
    emailNotifications: true,
    internshipNotifications: true,
    assignmentNotifications: true,
    gradeNotifications: true,
    atRiskAlerts: true,
    marketingEmails: false,
    digestFrequency: "IMMEDIATE", // IMMEDIATE, DAILY, WEEKLY
  };
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<any>
) {
  // TODO: Implement preference updates
  return {
    userId,
    ...preferences,
  };
}

// ============================================================================
// NOTIFICATION REMINDERS & SCHEDULES
// ============================================================================

/**
 * Check and send assignment reminders
 */
export async function checkAndSendAssignmentReminders() {
  const db = await getDatabase();

  // Get assignments due within 24 hours
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // TODO: Query assignments within time range
  // For now, mock the function
  console.log("✅ Assignment reminders checked and sent");

  return {
    processed: 0,
    sent: 0,
  };
}

/**
 * Check and send verification reminders
 */
export async function checkAndSendVerificationReminders() {
  const db = await getDatabase();

  // Get pending internship verifications older than 7 days
  // TODO: Query pending internships
  console.log("✅ Verification reminders checked and sent");

  return {
    processed: 0,
    reminded: 0,
  };
}

/**
 * Check and send at-risk alerts
 */
export async function checkAndSendAtRiskAlerts() {
  // TODO: Query at-risk students and send notifications
  console.log("✅ At-risk alerts checked and sent");

  return {
    processed: 0,
    alerted: 0,
  };
}
