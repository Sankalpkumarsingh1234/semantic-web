import assert from 'node:assert/strict';
import test from 'node:test';
import { careers } from '@/data/careers';
import { calculateProfileStrength, recommendCareers } from './recommendation-engine';

void test('empty profile returns normalized sorted recommendations', () => {
  const results = recommendCareers({}, careers);
  assert.equal(results.length, careers.length);
  for (const result of results) {
    assert.ok(result.totalScore >= 0 && result.totalScore <= 100);
    assert.ok(result.careerReadiness >= 0 && result.careerReadiness <= 100);
  }
  assert.deepEqual(results, [...results].sort((a, b) => b.totalScore - a.totalScore));
});

void test('complete product analytics profile ranks product analyst strongly', () => {
  const [top] = recommendCareers(
    {
      goal: 'I want to use data, communication, and product thinking to help teams make business decisions.',
      skills: ['SQL', 'Data Analysis', 'Communication', 'Research', 'Presentation'],
      values: ['Impact', 'Learning', 'Career Growth'],
      environments: ['Hybrid', 'Collaborative'],
      experienceLevel: '1-3 Years',
      priorities: ['Career Growth', 'Technical Depth', 'Customer Interaction'],
    },
    careers,
  );
  assert.equal(top.career.id, 'product-analyst');
  assert.ok(top.totalScore >= 80);
});

void test('duplicate and custom skills are normalized', () => {
  const [top] = recommendCareers(
    {
      goal: 'Build machine learning tools and AI systems.',
      skills: ['ML', 'Machine Learning', 'Python', 'python'],
      values: ['Learning'],
      environments: ['Hybrid'],
      experienceLevel: 'Entry Level',
      priorities: ['Technical Depth'],
    },
    careers,
  );
  assert.ok(['machine-learning-engineer', 'ai-engineer', 'data-scientist'].includes(top.career.id));
});

void test('score breakdown sums near total score', () => {
  const [top] = recommendCareers(
    {
      goal: 'Help customers understand technical cloud products.',
      skills: ['Cloud', 'Communication', 'Presentation', 'Customer Interaction'],
      values: ['Recognition', 'Career Growth'],
      environments: ['Remote', 'Collaborative'],
      experienceLevel: '3-5 Years',
      priorities: ['Customer Interaction', 'Earning Potential'],
    },
    careers,
  );
  const sum = Object.values(top.scoreBreakdown).reduce((total, item) => total + item, 0);
  assert.ok(Math.abs(sum - top.totalScore) <= 2);
});

void test('profile strength reflects completion', () => {
  const low = calculateProfileStrength({ goal: '', skills: [], values: [], environments: [], experienceLevel: 'Student', priorities: [] });
  const high = calculateProfileStrength({
    goal: 'I like solving customer problems with technology and business communication.',
    skills: ['Cloud', 'Communication', 'Problem Solving', 'Presentation'],
    values: ['Impact', 'Career Growth', 'Learning'],
    environments: ['Remote', 'Collaborative'],
    experienceLevel: '1-3 Years',
    priorities: ['Customer Interaction', 'Career Growth', 'Technical Depth'],
  });
  assert.ok(high > low);
  assert.ok(high <= 100);
});
