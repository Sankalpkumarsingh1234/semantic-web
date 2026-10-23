const synonymGroups: Record<string, string[]> = {
  javascript: ['js', 'javascript', 'react', 'frontend'],
  'machine learning': ['ml', 'machine learning', 'ai', 'models', 'prediction'],
  communication: ['communication', 'communication skills', 'present', 'presentation', 'explain', 'storytelling'],
  research: ['research', 'user research', 'ux research', 'investigate', 'evidence'],
  data: ['data', 'analytics', 'analysis', 'metrics', 'dashboard', 'sql'],
  business: ['business', 'strategy', 'customer', 'market', 'stakeholder'],
  cloud: ['cloud', 'aws', 'azure', 'gcp', 'infrastructure'],
  security: ['security', 'cybersecurity', 'risk', 'threat'],
  design: ['design', 'ux', 'product design', 'interface', 'experience'],
  leadership: ['leadership', 'lead', 'manage', 'facilitate', 'coordinate'],
};

export function normalizeToken(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9+#\s-]/g, '').replace(/\s+/g, ' ');
  const group = Object.entries(synonymGroups).find(([, words]) => words.includes(normalized));
  return group ? group[0] : normalized;
}

export function normalizeList(values: string[]) {
  return Array.from(new Set(values.map(normalizeToken).filter(Boolean)));
}

function words(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

export function semanticGoalSimilarity(goal: string, concepts: string[]) {
  if (!goal.trim()) return 0;

  const goalWords = words(goal);
  const expandedGoal = new Set(goalWords);

  for (const word of goalWords) {
    for (const [concept, synonyms] of Object.entries(synonymGroups)) {
      if (concept.includes(word) || synonyms.some((synonym) => synonym.includes(word) || word.includes(synonym))) {
        expandedGoal.add(concept);
        synonyms.forEach((synonym) => expandedGoal.add(synonym));
      }
    }
  }

  const conceptWords = concepts.flatMap(words);
  if (conceptWords.length === 0) return 0;

  const hits = conceptWords.filter((concept) =>
    expandedGoal.has(concept) || goalWords.some((word) => concept.includes(word) || word.includes(concept)),
  ).length;

  return Math.min(1, hits / Math.max(3, Math.min(conceptWords.length, 8)));
}
