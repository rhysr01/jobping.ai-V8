// Utils/matching/categoryMapper.ts
// Maps form values to database categories for proper job matching

export interface FormCategory {
  value: string;
  label: string;
  databaseCategory: string;
  jobCount?: number;
}

// Complete mapping between form values and database categories
export const FORM_TO_DATABASE_MAPPING: Record<string, string> = {
  'strategy': 'strategy-business-design',
  'finance': 'finance-investment', 
  'sales': 'sales-client-success',
  'marketing': 'marketing-growth',
  'data': 'data-analytics',
  'operations': 'operations-supply-chain',
  'product': 'product-innovation',
  'tech': 'tech-transformation',
  'sustainability': 'sustainability-esg',
  'unsure': 'all-categories' // Special case for "Not Sure Yet"
};

// Mapping from form labels to database categories (for career_path field)
export const FORM_LABEL_TO_DATABASE_MAPPING: Record<string, string> = {
  'Strategy & Business Design': 'strategy-business-design',
  'Finance & Investment': 'finance-investment',
  'Sales & Client Success': 'sales-client-success', 
  'Marketing & Growth': 'marketing-growth',
  'Data & Analytics': 'data-analytics',
  'Operations & Supply Chain': 'operations-supply-chain',
  'Product & Innovation': 'product-innovation',
  'Tech & Engineering': 'tech-transformation',
  'Tech & Transformation': 'tech-transformation', // Handle both variations
  'Sustainability & ESG': 'sustainability-esg',
  'Not Sure Yet / General': 'all-categories'
};

// Reverse mapping for display purposes
export const DATABASE_TO_FORM_MAPPING: Record<string, string> = {
  'strategy-business-design': 'strategy',
  'finance-investment': 'finance',
  'sales-client-success': 'sales', 
  'marketing-growth': 'marketing',
  'data-analytics': 'data',
  'operations-supply-chain': 'operations',
  'product-innovation': 'product',
  'tech-transformation': 'tech',
  'sustainability-esg': 'sustainability',
  'retail-luxury': 'retail-luxury', // Not in form but exists in DB
  'technology': 'technology' // Not in form but exists in DB
};

// All work type categories in the database (excluding seniority levels)
export const WORK_TYPE_CATEGORIES = [
  'strategy-business-design',
  'data-analytics',
  'marketing-growth',
  'tech-transformation',
  'operations-supply-chain',
  'finance-investment',
  'sales-client-success',
  'product-innovation',
  'sustainability-esg',
  'retail-luxury',
  'technology'
];

// Student satisfaction optimization
// Prioritizes what students told us they want - simple relevance matching

export const STUDENT_SATISFACTION_FACTORS = {
  // How well jobs match what students explicitly selected
  preferenceMatch: {
    'exact': 100,      // Perfect match with user's career path choice
    'related': 70,     // Related work type categories
    'general': 40,     // General business jobs (fallback)
    'none': 0         // No match with preferences
  }
};

// Student satisfaction scoring - matches all user preferences for maximum satisfaction
export function getStudentSatisfactionScore(
  jobCategories: string[],
  userFormValues: string[],
  jobWorkEnvironment?: string,
  jobExperienceRequired?: string,
  userWorkEnvironment?: string,
  userEntryLevel?: string,
  userCompanyTypes?: string[]
): number {
  if (!userFormValues || userFormValues.length === 0) return 1; // Neutral for flexible users

  let score = 0;

  // Primary: Exact career path match (most important for satisfaction)
  const userDatabaseCategories = new Set<string>();
  userFormValues.forEach(formValue => {
    getDatabaseCategoriesForForm(formValue).forEach(category => {
      userDatabaseCategories.add(category);
    });
  });

  const exactMatches = jobCategories.filter(category => userDatabaseCategories.has(category));
  if (exactMatches.length > 0) {
    score += 60; // Strong career alignment
  }

  // Secondary: Work type categorization (shows job quality)
  const workTypeMatches = jobCategories.filter(cat => WORK_TYPE_CATEGORIES.includes(cat));
  if (workTypeMatches.length > 0) {
    score += 20; // Properly categorized = higher quality
  }

  // Tertiary: Work environment preference match
  if (userWorkEnvironment && jobWorkEnvironment) {
    const userEnv = userWorkEnvironment.toLowerCase();
    const jobEnv = jobWorkEnvironment.toLowerCase();

    if (userEnv === jobEnv) {
      score += 10; // Exact work environment match
    } else if ((userEnv === 'hybrid' && jobEnv === 'office') ||
               (userEnv === 'remote' && (jobEnv === 'office' || jobEnv === 'hybrid'))) {
      score += 5; // Reasonable work environment compromise
    } else if (jobEnv === 'remote' && userEnv !== 'remote') {
      score += 8; // Remote work bonus (flexible for students)
    }
  }

  // Quaternary: Entry level appropriateness
  if (userEntryLevel && jobExperienceRequired) {
    const userLevel = userEntryLevel.toLowerCase();
    const jobExp = jobExperienceRequired.toLowerCase();

    if (userLevel === 'entry' && (jobExp.includes('entry') || jobExp.includes('junior') || jobExp.includes('graduate'))) {
      score += 10; // Perfect for entry level
    } else if (userLevel === 'mid' && !jobExp.includes('entry') && !jobExp.includes('junior')) {
      score += 10; // Appropriate for mid level
    } else if (userLevel === 'senior' && (jobExp.includes('senior') || jobExp.includes('lead'))) {
      score += 10; // Appropriate for senior level
    }
  }

  return Math.min(score, 100); // Cap at 100
}

// Seniority levels (not work types)
export const SENIORITY_LEVELS = [
  'early-career',
  'experienced', 
  'internship',
  'business-graduate'
];

/**
 * Maps form category value to database category
 */
export function mapFormToDatabase(formValue: string): string {
  return FORM_TO_DATABASE_MAPPING[formValue] || formValue;
}

/**
 * Maps form label to database category (for career_path field)
 */
export function mapFormLabelToDatabase(formLabel: string): string {
  return FORM_LABEL_TO_DATABASE_MAPPING[formLabel] || formLabel;
}

/**
 * Maps database category to form value
 */
export function mapDatabaseToForm(databaseCategory: string): string {
  return DATABASE_TO_FORM_MAPPING[databaseCategory] || databaseCategory;
}

/**
 * Gets all database categories for a form value
 * Handles special case of 'unsure' which should include all categories
 */
export function getDatabaseCategoriesForForm(formValue: string): string[] {
  if (formValue === 'unsure') {
    return WORK_TYPE_CATEGORIES;
  }
  
  const mappedCategory = mapFormToDatabase(formValue);
  return mappedCategory === 'all-categories' ? WORK_TYPE_CATEGORIES : [mappedCategory];
}

/**
 * Checks if a job category matches any of the user's selected form categories
 */
export function jobMatchesUserCategories(jobCategories: string[], userFormValues: string[]): boolean {
  if (!jobCategories || jobCategories.length === 0) return false;
  if (!userFormValues || userFormValues.length === 0) return true; // If no preferences, show all
  
  // Get all database categories the user is interested in
  const userDatabaseCategories = new Set<string>();
  userFormValues.forEach(formValue => {
    getDatabaseCategoriesForForm(formValue).forEach(category => {
      userDatabaseCategories.add(category);
    });
  });
  
  // Check if any job category matches user preferences
  return jobCategories.some(category => userDatabaseCategories.has(category));
}

/**
 * Gets the priority score for a job based on category alignment
 */
export function getCategoryPriorityScore(jobCategories: string[], userFormValues: string[]): number {
  if (!jobCategories || jobCategories.length === 0) return 0;
  if (!userFormValues || userFormValues.length === 0) return 1; // Neutral score if no preferences
  
  const userDatabaseCategories = new Set<string>();
  userFormValues.forEach(formValue => {
    getDatabaseCategoriesForForm(formValue).forEach(category => {
      userDatabaseCategories.add(category);
    });
  });
  
  // Count how many job categories match user preferences
  const matchingCategories = jobCategories.filter(category => userDatabaseCategories.has(category));
  return matchingCategories.length;
}
