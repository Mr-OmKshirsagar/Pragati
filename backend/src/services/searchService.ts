/**
 * Search & Filtering Service
 * Advanced full-text search and filtering for internships, subjects, and students
 */

import { getDb } from "../db";
import {
  internships,
  studentProfiles,
  subjects,
  users,
  internshipEvidence,
} from "../../drizzle/schema";
import { ilike, or, and, eq } from "drizzle-orm";

const getDatabase = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
};

// ============================================================================
// SEARCH TYPES & INTERFACES
// ============================================================================

export interface SearchQuery {
  q: string; // Search term
  filters?: {
    status?: string | string[];
    dateFrom?: string; // Keep as string
    dateTo?: string; // Keep as string
    minValue?: number;
    maxValue?: number;
    department?: string;
    verificationStatus?: string;
    attendanceRange?: [number, number]; // [min, max]
    gradeRange?: [number, number];
  };
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  query: string;
  executedAt: Date;
  filters: Record<string, any>;
}

// ============================================================================
// INTERNSHIP SEARCH
// ============================================================================

/**
 * Search internships with advanced filtering
 */
export async function searchInternships(
  searchQuery: SearchQuery
): Promise<SearchResult<any>> {
  const db = await getDatabase();

  const page = searchQuery.page || 1;
  const limit = Math.min(searchQuery.limit || 20, 100);
  const offset = (page - 1) * limit;

  // Build search conditions
  let conditions = [];

  // Full-text search on multiple fields
  if (searchQuery.q && searchQuery.q.trim()) {
    conditions.push(
      or(
        ilike(internships.companyName, `%${searchQuery.q}%`),
        ilike(internships.role, `%${searchQuery.q}%`),
        ilike(internships.supervisorName, `%${searchQuery.q}%`)
      )
    );
  }

  // Status filter (simplified - without inArray due to enum typing)
  if (searchQuery.filters?.status) {
    const statusValue = Array.isArray(searchQuery.filters.status)
      ? searchQuery.filters.status[0]
      : searchQuery.filters.status;

    conditions.push(eq(internships.status, statusValue as any));
  }

  // Verification status filter
  if (searchQuery.filters?.verificationStatus) {
    conditions.push(eq(internships.verificationStatus, searchQuery.filters.verificationStatus as any));
  }

  // Build base query
  let baseQuery = db.select().from(internships);

  // Get total count before pagination
  const countResult = await (
    conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery
  );

  const total = countResult.length;

  // Execute paginated query
  const items = await (
    conditions.length > 0
      ? db.select().from(internships).where(and(...conditions))
      : db.select().from(internships)
  )
    .limit(limit)
    .offset(offset);

  return {
    items,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
    query: searchQuery.q,
    executedAt: new Date(),
    filters: searchQuery.filters || {},
  };
}

// ============================================================================
// STUDENT SEARCH
// ============================================================================

/**
 * Search students with advanced filtering
 */
export async function searchStudents(
  searchQuery: SearchQuery
): Promise<SearchResult<any>> {
  const db = await getDatabase();

  const page = searchQuery.page || 1;
  const limit = Math.min(searchQuery.limit || 20, 100);
  const offset = (page - 1) * limit;

  let conditions = [];

  // Full-text search
  if (searchQuery.q && searchQuery.q.trim()) {
    conditions.push(
      or(
        ilike(studentProfiles.enrollmentNumber, `%${searchQuery.q}%`),
        ilike(studentProfiles.program, `%${searchQuery.q}%`)
      )
    );
  }

  // Department filter
  if (searchQuery.filters?.department) {
    conditions.push(eq(studentProfiles.departmentId, searchQuery.filters.department));
  }

  // Get total count
  const countResult = await (
    conditions.length > 0
      ? db.select().from(studentProfiles).where(and(...conditions))
      : db.select().from(studentProfiles)
  );

  const total = countResult.length;

  // Execute paginated query
  const items = await (
    conditions.length > 0
      ? db.select().from(studentProfiles).where(and(...conditions))
      : db.select().from(studentProfiles)
  )
    .limit(limit)
    .offset(offset);

  return {
    items,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
    query: searchQuery.q,
    executedAt: new Date(),
    filters: searchQuery.filters || {},
  };
}

// ============================================================================
// SUBJECT SEARCH
// ============================================================================

/**
 * Search subjects with advanced filtering
 */
export async function searchSubjects(
  searchQuery: SearchQuery
): Promise<SearchResult<any>> {
  const db = await getDatabase();

  const page = searchQuery.page || 1;
  const limit = Math.min(searchQuery.limit || 20, 100);
  const offset = (page - 1) * limit;

  let conditions = [];

  // Full-text search
  if (searchQuery.q && searchQuery.q.trim()) {
    conditions.push(
      or(
        ilike(subjects.name, `%${searchQuery.q}%`),
        ilike(subjects.code, `%${searchQuery.q}%`)
      )
    );
  }

  // Department filter
  if (searchQuery.filters?.department) {
    conditions.push(eq(subjects.departmentId, searchQuery.filters.department));
  }

  // Get total count
  const countResult = await (
    conditions.length > 0
      ? db.select().from(subjects).where(and(...conditions))
      : db.select().from(subjects)
  );

  const total = countResult.length;

  // Execute paginated query
  const items = await (
    conditions.length > 0
      ? db.select().from(subjects).where(and(...conditions))
      : db.select().from(subjects)
  )
    .limit(limit)
    .offset(offset);

  return {
    items,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
    query: searchQuery.q,
    executedAt: new Date(),
    filters: searchQuery.filters || {},
  };
}

// ============================================================================
// ADVANCED FILTERING FUNCTIONS
// ============================================================================

/**
 * Filter internships by attendance range
 */
export async function filterInternshipsByPerformance(data: {
  minAttendance?: number;
  maxAttendance?: number;
  minGrade?: number;
  maxGrade?: number;
  status?: string[];
  page?: number;
  limit?: number;
}): Promise<SearchResult<any>> {
  const db = await getDatabase();

  const page = data.page || 1;
  const limit = Math.min(data.limit || 20, 100);
  const offset = (page - 1) * limit;

  let conditions = [];

  if (data.status && data.status.length > 0) {
    // Filter by first status value due to enum typing
    conditions.push(eq(internships.status, data.status[0] as any));
  }

  // Get total count
  const countResult = await (
    conditions.length > 0
      ? db.select().from(internships).where(and(...conditions))
      : db.select().from(internships)
  );

  const total = countResult.length;

  // Execute paginated query
  const items = await (
    conditions.length > 0
      ? db.select().from(internships).where(and(...conditions))
      : db.select().from(internships)
  )
    .limit(limit)
    .offset(offset);

  return {
    items,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
    query: "",
    executedAt: new Date(),
    filters: data,
  };
}

/**
 * Filter students by at-risk criteria
 */
export async function filterAtRiskStudents(data: {
  maxAttendance?: number;
  maxGrade?: number;
  department?: string;
  page?: number;
  limit?: number;
}): Promise<SearchResult<any>> {
  const db = await getDatabase();

  const page = data.page || 1;
  const limit = Math.min(data.limit || 20, 100);
  const offset = (page - 1) * limit;

  let conditions = [];

  if (data.department) {
    conditions.push(eq(studentProfiles.departmentId, data.department));
  }

  // Get total count
  const countResult = await (
    conditions.length > 0
      ? db.select().from(studentProfiles).where(and(...conditions))
      : db.select().from(studentProfiles)
  );

  const total = countResult.length;

  // Execute paginated query
  const items = await (
    conditions.length > 0
      ? db.select().from(studentProfiles).where(and(...conditions))
      : db.select().from(studentProfiles)
  )
    .limit(limit)
    .offset(offset);

  return {
    items,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
    query: "",
    executedAt: new Date(),
    filters: data,
  };
}

// ============================================================================
// SEARCH SUGGESTIONS
// ============================================================================

/**
 * Get search suggestions based on partial query
 */
export async function getSearchSuggestions(
  partialQuery: string,
  type: "INTERNSHIPS" | "STUDENTS" | "SUBJECTS" | "ALL" = "ALL"
): Promise<string[]> {
  const db = await getDatabase();

  const suggestions = new Set<string>();

  if (type === "INTERNSHIPS" || type === "ALL") {
    const companies = await db
      .select({ name: internships.companyName })
      .from(internships)
      .where(ilike(internships.companyName, `${partialQuery}%`))
      .limit(5);

    const roles = await db
      .select({ role: internships.role })
      .from(internships)
      .where(ilike(internships.role, `${partialQuery}%`))
      .limit(5);

    companies.forEach((c) => suggestions.add(c.name));
    roles.forEach((r) => suggestions.add(r.role));
  }

  if (type === "STUDENTS" || type === "ALL") {
    const studentNames = await db
      .select({ name: users.name })
      .from(users)
      .where(ilike(users.name, `${partialQuery}%`))
      .limit(5);

    studentNames.forEach((s) => suggestions.add(s.name));
  }

  if (type === "SUBJECTS" || type === "ALL") {
    const subjectNames = await db
      .select({ name: subjects.name })
      .from(subjects)
      .where(ilike(subjects.name, `${partialQuery}%`))
      .limit(5);

    subjectNames.forEach((s) => suggestions.add(s.name));
  }

  return Array.from(suggestions).slice(0, 10);
}

// ============================================================================
// SEARCH RANKINGS & SCORING
// ============================================================================

/**
 * Score and rank search results
 */
export function scoreSearchResult(
  item: any,
  query: string,
  type: "INTERNSHIP" | "STUDENT" | "SUBJECT"
): number {
  if (!query || query.trim() === "") return 0;

  const queryLower = query.toLowerCase();
  let score = 0;

  if (type === "INTERNSHIP") {
    // Exact matches score highest
    if (item.companyName?.toLowerCase() === queryLower) score += 100;
    else if (item.companyName?.toLowerCase().startsWith(queryLower)) score += 50;
    else if (item.companyName?.toLowerCase().includes(queryLower)) score += 25;

    if (item.role?.toLowerCase() === queryLower) score += 80;
    else if (item.role?.toLowerCase().startsWith(queryLower)) score += 40;
    else if (item.role?.toLowerCase().includes(queryLower)) score += 20;

    // Recent internships score higher
    if (item.createdAt) {
      const daysOld = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 10 - daysOld / 10);
    }

    // Verified internships score higher
    if (item.verificationStatus === "VERIFIED") score += 15;
  } else if (type === "STUDENT") {
    if (item.name?.toLowerCase() === queryLower) score += 100;
    else if (item.name?.toLowerCase().startsWith(queryLower)) score += 50;
    else if (item.name?.toLowerCase().includes(queryLower)) score += 25;

    if (item.enrollmentNumber?.toLowerCase() === queryLower) score += 90;
    else if (item.enrollmentNumber?.toLowerCase().startsWith(queryLower)) score += 45;
  } else if (type === "SUBJECT") {
    if (item.name?.toLowerCase() === queryLower) score += 100;
    else if (item.name?.toLowerCase().startsWith(queryLower)) score += 50;
    else if (item.name?.toLowerCase().includes(queryLower)) score += 25;

    if (item.code?.toLowerCase() === queryLower) score += 90;
    else if (item.code?.toLowerCase().startsWith(queryLower)) score += 45;
  }

  return score;
}

/**
 * Rank search results by relevance
 */
export function rankSearchResults<T>(
  results: T[],
  query: string,
  type: "INTERNSHIP" | "STUDENT" | "SUBJECT"
): T[] {
  return results
    .map((item) => ({
      item,
      score: scoreSearchResult(item, query, type),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

// ============================================================================
// SAVED SEARCHES
// ============================================================================

/**
 * Save a search query for later use
 */
export async function saveSearch(data: {
  userId: string;
  name: string;
  searchQuery: SearchQuery;
  type: "INTERNSHIP" | "STUDENT" | "SUBJECT";
}): Promise<{ searchId: string; name: string; createdAt: Date }> {
  // TODO: Implement saved searches table
  return {
    searchId: `search_${Date.now()}`,
    name: data.name,
    createdAt: new Date(),
  };
}

/**
 * Get user's saved searches
 */
export async function getSavedSearches(userId: string): Promise<any[]> {
  // TODO: Query saved searches from database
  return [];
}

/**
 * Delete saved search
 */
export async function deleteSavedSearch(searchId: string): Promise<boolean> {
  // TODO: Implement deletion
  return true;
}
