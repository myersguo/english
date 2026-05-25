export type CategoryId = 'operations' | 'general' | 'picturable' | 'qualities' | 'opposites';

export type QuizMode = 'enToZh' | 'zhToEn' | 'spelling';

export interface ExampleSentence {
  en: string;
  zh: string;
}

export interface BasicWord {
  id: string;
  word: string;
  category: CategoryId;
  categoryLabel: string;
  chineseMeaning: string;
  englishDefinition: string;
  examples: ExampleSentence[];
  tags: string[];
}

export interface StudyProgress {
  learned: string[];
  favorites: string[];
  quizTotal: number;
  quizCorrect: number;
  lastStudiedId?: string;
}
