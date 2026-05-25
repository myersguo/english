import type { CategoryId } from '../types';

export const categories: Array<{
  id: CategoryId | 'all';
  label: string;
  zh: string;
  expected: number;
  tone: string;
}> = [
  { id: 'all', label: 'All', zh: '全部', expected: 850, tone: 'all' },
  { id: 'operations', label: 'Operations', zh: '操作词', expected: 100, tone: 'amber' },
  { id: 'general', label: 'General', zh: '一般事物', expected: 400, tone: 'green' },
  { id: 'picturable', label: 'Picturable', zh: '可画事物', expected: 200, tone: 'brick' },
  { id: 'qualities', label: 'Qualities', zh: '一般性质', expected: 100, tone: 'blue' },
  { id: 'opposites', label: 'Opposites', zh: '对立性质', expected: 50, tone: 'ink' }
];
