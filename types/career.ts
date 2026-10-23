export type ExperienceLevel =
  | 'Student'
  | 'Entry Level'
  | '1-3 Years'
  | '3-5 Years'
  | '5+ Years';

export type GrowthOutlook = 'Very High' | 'High' | 'Steady' | 'Emerging';

export type CareerProfile = {
  goal: string;
  skills: string[];
  values: string[];
  environments: string[];
  experienceLevel: ExperienceLevel;
  priorities: string[];
};

export type Career = {
  id: string;
  title: string;
  category: string;
  description: string;
  detailedDescription: string;
  requiredSkills: string[];
  preferredSkills: string[];
  values: string[];
  environments: string[];
  experienceLevels: ExperienceLevel[];
  priorities: string[];
  responsibilities: string[];
  growthOutlook: GrowthOutlook;
  relatedRoles: string[];
  transferableSkills: string[];
  suggestedNextStep: string;
  concepts: string[];
};

export type ScoreBreakdown = {
  goal: number;
  skills: number;
  values: number;
  environment: number;
  experience: number;
};

export type Recommendation = {
  career: Career;
  totalScore: number;
  scoreBreakdown: ScoreBreakdown;
  matchingSkills: string[];
  missingSkills: string[];
  matchingValues: string[];
  matchingEnvironments: string[];
  confidence: 'High Confidence' | 'Medium Confidence' | 'Low Confidence';
  confidenceReason: string;
  careerReadiness: number;
  reasons: string[];
  reductions: string[];
};
