import type { CareerProfile } from '@/types/career';
import { sanitizeProfile } from '@/services/recommendation-engine';

const profileKey = 'pathwise.profile.v1';
const compareKey = 'pathwise.compare.v1';

export function loadProfile(fallback: CareerProfile) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(profileKey);
    return raw ? sanitizeProfile(JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}

export function saveProfile(profile: CareerProfile) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(profileKey, JSON.stringify(profile));
}

export function loadCompare() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(compareKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string').slice(0, 3) : [];
  } catch {
    return [];
  }
}

export function saveCompare(ids: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(compareKey, JSON.stringify(ids.slice(0, 3)));
}

export function clearPathwiseStorage() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(profileKey);
  window.localStorage.removeItem(compareKey);
}
