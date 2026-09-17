/**
 * Search Router
 * Endpoints for advanced search and filtering
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  searchInternships,
  searchStudents,
  searchSubjects,
  filterInternshipsByPerformance,
  filterAtRiskStudents,
  getSearchSuggestions,
  rankSearchResults,
} from "../services/searchService";

// ============================================================================
// SCHEMAS
// ============================================================================

const SearchQuerySchema = z.object({
  q: z.string().min(1, "Search query required"),
  filters: z
    .object({
      status: z.union([z.string(), z.array(z.string())]).optional(),
      dateFrom: z.string().optional(), // Keep as string
      dateTo: z.string().optional(), // Keep as string
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      department: z.string().optional(),
      verificationStatus: z.string().optional(),
      attendanceRange: z.tuple([z.number(), z.number()]).optional(),
      gradeRange: z.tuple([z.number(), z.number()]).optional(),
    })
    .optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional().default("DESC"),
});

const FilterInternshipsSchema = z.object({
  minAttendance: z.number().optional(),
  maxAttendance: z.number().optional(),
  minGrade: z.number().optional(),
  maxGrade: z.number().optional(),
  status: z.array(z.string()).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

const FilterAtRiskSchema = z.object({
  maxAttendance: z.number().optional(),
  maxGrade: z.number().optional(),
  department: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

// ============================================================================
// SEARCH ROUTER
// ============================================================================

export const searchRouter = router({
  /**
   * Search internships with filters
   * GET /api/search/internships?q=company&filters[status]=ACTIVE
   */
  searchInternships: publicProcedure
    .input(SearchQuerySchema)
    .query(async ({ input }) => {
      try {
        const results = await searchInternships({
          q: input.q,
          filters: input.filters,
          page: input.page,
          limit: input.limit,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
        });

        return {
          success: true,
          data: results,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Search failed",
        };
      }
    }),

  /**
   * Search students with filters
   * GET /api/search/students?q=john
   */
  searchStudents: publicProcedure
    .input(SearchQuerySchema)
    .query(async ({ input }) => {
      try {
        const results = await searchStudents({
          q: input.q,
          filters: input.filters,
          page: input.page,
          limit: input.limit,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
        });

        return {
          success: true,
          data: results,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Search failed",
        };
      }
    }),

  /**
   * Search subjects with filters
   * GET /api/search/subjects?q=physics
   */
  searchSubjects: publicProcedure
    .input(SearchQuerySchema)
    .query(async ({ input }) => {
      try {
        const results = await searchSubjects({
          q: input.q,
          filters: input.filters,
          page: input.page,
          limit: input.limit,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
        });

        return {
          success: true,
          data: results,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Search failed",
        };
      }
    }),

  /**
   * Get search suggestions
   * GET /api/search/suggestions?q=goo&type=INTERNSHIPS
   */
  getSuggestions: publicProcedure
    .input(
      z.object({
        q: z.string().min(1),
        type: z.enum(["INTERNSHIPS", "STUDENTS", "SUBJECTS", "ALL"]).optional().default("ALL"),
      })
    )
    .query(async ({ input }) => {
      try {
        const suggestions = await getSearchSuggestions(input.q, input.type);

        return {
          success: true,
          data: suggestions,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get suggestions",
        };
      }
    }),

  /**
   * Filter internships by performance metrics
   * GET /api/search/internships/filter?status=ACTIVE&minAttendance=75
   */
  filterInternships: publicProcedure
    .input(FilterInternshipsSchema)
    .query(async ({ input }) => {
      try {
        const results = await filterInternshipsByPerformance({
          minAttendance: input.minAttendance,
          maxAttendance: input.maxAttendance,
          minGrade: input.minGrade,
          maxGrade: input.maxGrade,
          status: input.status,
          page: input.page,
          limit: input.limit,
        });

        return {
          success: true,
          data: results,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Filter failed",
        };
      }
    }),

  /**
   * Filter at-risk students
   * GET /api/search/students/at-risk?maxAttendance=75&maxGrade=60
   */
  filterAtRiskStudents: publicProcedure
    .input(FilterAtRiskSchema)
    .query(async ({ input }) => {
      try {
        const results = await filterAtRiskStudents({
          maxAttendance: input.maxAttendance,
          maxGrade: input.maxGrade,
          department: input.department,
          page: input.page,
          limit: input.limit,
        });

        return {
          success: true,
          data: results,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Filter failed",
        };
      }
    }),

  /**
   * Global search across all entities
   * GET /api/search/global?q=internship
   */
  globalSearch: publicProcedure
    .input(
      z.object({
        q: z.string().min(1),
        limit: z.number().int().min(1).max(50).optional().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const [internships, students, subjects] = await Promise.all([
          searchInternships({
            q: input.q,
            limit: input.limit,
          }),
          searchStudents({
            q: input.q,
            limit: input.limit,
          }),
          searchSubjects({
            q: input.q,
            limit: input.limit,
          }),
        ]);

        return {
          success: true,
          data: {
            internships: rankSearchResults(internships.items, input.q, "INTERNSHIP"),
            students: rankSearchResults(students.items, input.q, "STUDENT"),
            subjects: rankSearchResults(subjects.items, input.q, "SUBJECT"),
            totalResults: internships.total + students.total + subjects.total,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Global search failed",
        };
      }
    }),

  /**
   * Advanced search with complex filters
   */
  advancedSearch: publicProcedure
    .input(
      z.object({
        type: z.enum(["INTERNSHIPS", "STUDENTS", "SUBJECTS"]),
        q: z.string().optional(),
        filters: z.record(z.any()).optional(),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(20),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["ASC", "DESC"]).optional().default("DESC"),
      })
    )
    .query(async ({ input }) => {
      try {
        let results;

        switch (input.type) {
          case "INTERNSHIPS":
            results = await searchInternships({
              q: input.q || "",
              filters: input.filters,
              page: input.page,
              limit: input.limit,
              sortBy: input.sortBy,
              sortOrder: input.sortOrder,
            });
            break;

          case "STUDENTS":
            results = await searchStudents({
              q: input.q || "",
              filters: input.filters,
              page: input.page,
              limit: input.limit,
              sortBy: input.sortBy,
              sortOrder: input.sortOrder,
            });
            break;

          case "SUBJECTS":
            results = await searchSubjects({
              q: input.q || "",
              filters: input.filters,
              page: input.page,
              limit: input.limit,
              sortBy: input.sortBy,
              sortOrder: input.sortOrder,
            });
            break;

          default:
            throw new Error("Invalid search type");
        }

        return {
          success: true,
          data: results,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Advanced search failed",
        };
      }
    }),
});
