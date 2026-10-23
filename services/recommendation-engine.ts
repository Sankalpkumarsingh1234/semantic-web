import type { Career, CareerProfile, Recommendation, ScoreBreakdown } from '@/types/career';
import { normalizeList, normalizeToken, semanticGoalSimilarity } from './semantic-matcher';

export const scoringWeights = {
  goal: 0.4,
  skills: 0.25,
  values: 0.15,
  environment: 0.1,
  experience: 0.1,
} as const;

const emptyProfile: CareerProfile = {
  goal: '',
  skills: [],
  values: [],
  environments: [],
  experienceLevel: 'Student',
  priorities: [],
};

export function sanitizeProfile(profile: Partial<CareerProfile>): CareerProfile {
  return {
    ...emptyProfile,
    ...profile,
    goal: typeof profile.goal === 'string' ? profile.goal : '',
    skills: Array.isArray(profile.skills) ? Array.from(new Set(profile.skills.filter(Boolean))) : [],
    values: Array.isArray(profile.values) ? Array.from(new Set(profile.values.filter(Boolean))) : [],
    environments: Array.isArray(profile.environments) ? Array.from(new Set(profile.environments.filter(Boolean))) : [],
    priorities: Array.isArray(profile.priorities) ? Array.from(new Set(profile.priorities.filter(Boolean))).slice(0, 5) : [],
  };
}

export function calculateProfileStrength(profile: CareerProfile) {
  const score =
    (profile.goal.trim().length > 18 ? 24 : profile.goal.trim() ? 14 : 0) +
    Math.min(profile.skills.length, 6) * 6 +
    Math.min(profile.values.length, 4) * 6 +
    Math.min(profile.environments.length, 3) * 5 +
    (profile.experienceLevel ? 10 : 0) +
    Math.min(profile.priorities.length, 5) * 3;

  return Math.min(100, Math.round(score));
}

function percent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function overlap(profileValues: string[], careerValues: string[]) {
  const profileSet = new Set(normalizeList(profileValues));
  return careerValues.filter((item) => profileSet.has(normalizeToken(item)));
}

function skillScore(profileSkills: string[], career: Career) {
  const profileSet = new Set(normalizeList(profileSkills));
  const required = career.requiredSkills.filter((skill) => profileSet.has(normalizeToken(skill)));
  const preferred = career.preferredSkills.filter((skill) => profileSet.has(normalizeToken(skill)));
  const requiredScore = career.requiredSkills.length ? required.length / career.requiredSkills.length : 1;
  const preferredScore = career.preferredSkills.length ? preferred.length / career.preferredSkills.length : 1;

  return {
    value: requiredScore * 0.7 + preferredScore * 0.3,
    matching: [...required, ...preferred],
    missing: career.requiredSkills.filter((skill) => !profileSet.has(normalizeToken(skill))).slice(0, 4),
  };
}

function confidence(totalScore: number, profileStrength: number, skillCount: number): Recommendation['confidence'] {
  if (totalScore >= 78 && profileStrength >= 72 && skillCount >= 4) return 'High Confidence';
  if (totalScore >= 55 && profileStrength >= 45 && skillCount >= 2) return 'Medium Confidence';
  return 'Low Confidence';
}

export function recommendCareers(profileInput: Partial<CareerProfile>, careers: Career[]): Recommendation[] {
  const profile = sanitizeProfile(profileInput);
  const profileStrength = calculateProfileStrength(profile);

  return careers
    .map((career) => {
      const skills = skillScore(profile.skills, career);
      const valueMatches = overlap(profile.values, career.values);
      const environmentMatches = overlap(profile.environments, career.environments);
      const goal = semanticGoalSimilarity(profile.goal, career.concepts);
      const values = career.values.length ? valueMatches.length / career.values.length : 1;
      const environment = profile.environments.length === 0 ? 0.35 : environmentMatches.length / Math.min(career.environments.length, profile.environments.length);
      const experience = career.experienceLevels.includes(profile.experienceLevel) ? 1 : 0.35;

      const weighted =
        goal * scoringWeights.goal +
        skills.value * scoringWeights.skills +
        values * scoringWeights.values +
        environment * scoringWeights.environment +
        experience * scoringWeights.experience;

      const scoreBreakdown: ScoreBreakdown = {
        goal: percent(goal * scoringWeights.goal),
        skills: percent(skills.value * scoringWeights.skills),
        values: percent(values * scoringWeights.values),
        environment: percent(environment * scoringWeights.environment),
        experience: percent(experience * scoringWeights.experience),
      };
      const totalScore = Math.max(0, Math.min(100, Math.round(weighted * 100)));
      const careerReadiness = Math.round(skills.value * 100);
      const recommendationConfidence = confidence(totalScore, profileStrength, profile.skills.length);

      return {
        career,
        totalScore,
        scoreBreakdown,
        matchingSkills: skills.matching,
        missingSkills: skills.missing,
        matchingValues: valueMatches,
        matchingEnvironments: environmentMatches,
        confidence: recommendationConfidence,
        confidenceReason:
          recommendationConfidence === 'High Confidence'
            ? 'Your profile contains enough detail for a strong recommendation.'
            : recommendationConfidence === 'Medium Confidence'
              ? 'The recommendation has useful signals, but more preferences would improve quality.'
              : 'Add more skills and preferences to improve this recommendation.',
        careerReadiness,
        reasons: [
          goal > 0.45 ? 'Your stated goal aligns with this career direction.' : 'This role has some adjacent overlap with your goal.',
          skills.matching.length ? `${skills.matching.length} of your skills map to this role.` : 'This would be a fresh skill direction.',
          valueMatches.length ? `Your work values match ${valueMatches.join(', ')}.` : 'Your selected values are less central to this role.',
        ],
        reductions: [
          ...skills.missing.slice(0, 2).map((skill) => `${skill} is not currently listed.`),
          ...(environmentMatches.length ? [] : ['Your preferred environment is not a strong match yet.']),
        ].slice(0, 3),
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}
