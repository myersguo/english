import type { StudyProgress } from './types';

const STORAGE_KEY = 'simple-english-progress-v1';

export const defaultProgress: StudyProgress = {
  learned: [],
  favorites: [],
  quizTotal: 0,
  quizCorrect: 0
};

export function loadProgress(): StudyProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    const parsed = JSON.parse(raw) as StudyProgress;
    return {
      learned: Array.isArray(parsed.learned) ? parsed.learned : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      quizTotal: Number.isFinite(parsed.quizTotal) ? parsed.quizTotal : 0,
      quizCorrect: Number.isFinite(parsed.quizCorrect) ? parsed.quizCorrect : 0,
      lastStudiedId: parsed.lastStudiedId
    };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: StudyProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}
