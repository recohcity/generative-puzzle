/**
 * 拼图难度元数据定义
 */

export interface DifficultyMetadata {
  level: number;
  nameKey: string;
  pieceRange: string;
  intensity: number; // 0-100
  descriptionKey: string;
  colorClass: string;
}

export const DIFFICULTY_METADATA: Record<number, DifficultyMetadata> = {
  1: {
    level: 1,
    nameKey: 'difficulty.levels.1',
    pieceRange: '2 - 4',
    intensity: 15,
    descriptionKey: 'difficulty.desc.1',
    colorClass: 'text-brand-peach'
  },
  2: {
    level: 2,
    nameKey: 'difficulty.levels.2',
    pieceRange: '4 - 6',
    intensity: 25,
    descriptionKey: 'difficulty.desc.2',
    colorClass: 'text-brand-peach'
  },
  3: {
    level: 3,
    nameKey: 'difficulty.levels.3',
    pieceRange: '5 - 8',
    intensity: 40,
    descriptionKey: 'difficulty.desc.3',
    colorClass: 'text-brand-peach'
  },
  4: {
    level: 4,
    nameKey: 'difficulty.levels.4',
    pieceRange: '7 - 12',
    intensity: 55,
    descriptionKey: 'difficulty.desc.4',
    colorClass: 'text-brand-peach'
  },
  5: {
    level: 5,
    nameKey: 'difficulty.levels.5',
    pieceRange: '9 - 16',
    intensity: 70,
    descriptionKey: 'difficulty.desc.5',
    colorClass: 'text-brand-peach'
  },
  6: {
    level: 6,
    nameKey: 'difficulty.levels.6',
    pieceRange: '11 - 20',
    intensity: 80,
    descriptionKey: 'difficulty.desc.6',
    colorClass: 'text-brand-peach'
  },
  7: {
    level: 7,
    nameKey: 'difficulty.levels.7',
    pieceRange: '13 - 24',
    intensity: 90,
    descriptionKey: 'difficulty.desc.7',
    colorClass: 'text-brand-peach'
  },
  8: {
    level: 8,
    nameKey: 'difficulty.levels.8',
    pieceRange: '16 - 30 +',
    intensity: 100,
    descriptionKey: 'difficulty.desc.8',
    colorClass: 'text-brand-peach'
  }
};

export const getDifficultyMetadata = (level: number): DifficultyMetadata => {
  return DIFFICULTY_METADATA[level] || DIFFICULTY_METADATA[1];
};
