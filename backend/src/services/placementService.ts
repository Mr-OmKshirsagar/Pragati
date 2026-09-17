/**
 * Placement Service
 * Manages placement drives, internship opportunities, and eligibility matching
 */

// Type definitions (these should ideally come from the frontend shared module)
export interface Opportunity {
  id: string;
  company: string;
  role: string;
  type: "Internship" | "Placement";
  location: string;
  deadline: string;
  deadlineLabel: string;
  eligibilitySummary: string;
  eligibilityStatus: "Eligible" | "Not Eligible" | "Pending";
  applicationStatus: string;
  closingSoon: boolean;
  description: string;
  skills: string[];
  criteria: Array<{
    label: string;
    actual: string;
    expected: string;
    pass: boolean;
  }>;
  verificationRequirements: string[];
}

export interface OpportunitiesResponse {
  summary: {
    eligible: number;
    internships: number;
    placements: number;
    applications: number;
  };
  opportunities: Opportunity[];
}

export interface CreatePlacementInput {
  company: string;
  role: string;
  type: "Internship" | "Placement";
  location: string;
  deadline: string;
  description: string;
  skills: string[];
  criteria: Array<{
    label: string;
    expected: string;
  }>;
  verificationRequirements: string[];
}

export interface UpdatePlacementInput extends CreatePlacementInput {
  id: string;
}

/**
 * In-memory storage for placements (replace with database in production)
 */
let placements: Opportunity[] = [];

/**
 * Get all opportunities (for students and TNP viewing)
 */
export async function getOpportunities(): Promise<OpportunitiesResponse> {
  const summary = {
    eligible: placements.filter(p => p.eligibilityStatus === "Eligible").length,
    internships: placements.filter(p => p.type === "Internship").length,
    placements: placements.filter(p => p.type === "Placement").length,
    applications: placements.filter(p => p.applicationStatus !== "Not applied").length,
  };

  return {
    summary,
    opportunities: placements,
  };
}

/**
 * Get single opportunity by ID
 */
export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  return placements.find(p => p.id === id) || null;
}

/**
 * Create new placement drive (TNP Officer only)
 */
export async function createPlacement(input: CreatePlacementInput): Promise<Opportunity> {
  const id = `${input.company.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
  
  const now = new Date();
  const deadline = new Date(input.deadline);
  const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const newPlacement: Opportunity = {
    id,
    company: input.company,
    role: input.role,
    type: input.type,
    location: input.location,
    deadline: input.deadline,
    deadlineLabel: daysUntilDeadline > 0 
      ? `Closes in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? "s" : ""}`
      : "Deadline passed",
    eligibilitySummary: `${input.type} opportunity at ${input.company}`,
    eligibilityStatus: "Eligible",
    applicationStatus: "Not applied",
    closingSoon: daysUntilDeadline <= 7,
    description: input.description,
    skills: input.skills,
    criteria: input.criteria.map(c => ({
      label: c.label,
      actual: "—", // Will be populated from student profile
      expected: c.expected,
      pass: false, // Will be evaluated per student
    })),
    verificationRequirements: input.verificationRequirements,
  };

  placements.push(newPlacement);
  return newPlacement;
}

/**
 * Update placement drive (TNP Officer only)
 */
export async function updatePlacement(input: UpdatePlacementInput): Promise<Opportunity> {
  const index = placements.findIndex(p => p.id === input.id);
  if (index === -1) {
    throw new Error(`Placement with ID ${input.id} not found`);
  }

  const now = new Date();
  const deadline = new Date(input.deadline);
  const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const updated: Opportunity = {
    ...placements[index],
    company: input.company,
    role: input.role,
    type: input.type,
    location: input.location,
    deadline: input.deadline,
    deadlineLabel: daysUntilDeadline > 0 
      ? `Closes in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? "s" : ""}`
      : "Deadline passed",
    description: input.description,
    skills: input.skills,
    criteria: input.criteria.map(c => ({
      label: c.label,
      actual: placements[index].criteria.find((cr: any) => cr.label === c.label)?.actual || "—",
      expected: c.expected,
      pass: false,
    })),
    verificationRequirements: input.verificationRequirements,
    closingSoon: daysUntilDeadline <= 7,
  };

  placements[index] = updated;
  return updated;
}

/**
 * Delete placement drive (TNP Officer only)
 */
export async function deletePlacement(id: string): Promise<boolean> {
  const index = placements.findIndex(p => p.id === id);
  if (index === -1) {
    return false;
  }

  placements.splice(index, 1);
  return true;
}

/**
 * Get all placements created by TNP Officer (for management dashboard)
 */
export async function getTnpPlacements(): Promise<Opportunity[]> {
  return [...placements];
}

/**
 * Publish/unpublish placement (make visible to students)
 */
export async function togglePublishPlacement(id: string, published: boolean): Promise<Opportunity> {
  const placement = placements.find(p => p.id === id);
  if (!placement) {
    throw new Error(`Placement with ID ${id} not found`);
  }

  // In production, would set a published flag in database
  // For now, we keep all placements visible
  return placement;
}

/**
 * Apply for opportunity (student action)
 */
export async function applyForOpportunity(opportunityId: string, studentId: string): Promise<boolean> {
  const placement = placements.find(p => p.id === opportunityId);
  if (!placement) {
    throw new Error(`Opportunity not found`);
  }

  // In production, would create an application record in database
  // Update the mock application status
  if (placement.applicationStatus === "Not applied") {
    placement.applicationStatus = "Applied";
  }

  return true;
}

/**
 * Get student's applications
 */
export async function getStudentApplications(studentId: string): Promise<Opportunity[]> {
  return placements.filter(p => p.applicationStatus !== "Not applied");
}
