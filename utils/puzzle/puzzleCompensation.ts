import type { Point } from '@/types/puzzleTypes';
import { CutLine, CutType } from './cutGeneratorTypes';

export type Cut = CutLine;

export type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  diagonal: number;
};

export const computeBounds = (shape: Point[]): Bounds => {
  const xs = shape.map(p => p.x);
  const ys = shape.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const diagonal = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2));
  return { minX, maxX, minY, maxY, centerX, centerY, diagonal };
};

export const buildExtraCuts = (params: {
  cutType: CutType;
  cutCount: number;
  bounds: Bounds;
  isHighDifficulty: boolean;
  neededExtraCuts: number;
  randomFn?: () => number;
}): Cut[] => {
  const { cutType, bounds, isHighDifficulty, neededExtraCuts } = params;
  const rnd = params.randomFn ?? Math.random;
  const cuts: Cut[] = [];

  for (let i = 0; i < neededExtraCuts; i++) {
    const { minX, maxX, minY, maxY, centerX, centerY, diagonal } = bounds;
    let x1: number, y1: number, x2: number, y2: number;

    if (isHighDifficulty) {
      const angle = rnd() * Math.PI;
      const offsetX = (rnd() - 0.5) * (maxX - minX) * 0.3;
      const offsetY = (rnd() - 0.5) * (maxY - minY) * 0.3;
      x1 = centerX + offsetX + Math.cos(angle) * diagonal * 0.8;
      y1 = centerY + offsetY + Math.sin(angle) * diagonal * 0.8;
      x2 = centerX + offsetX + Math.cos(angle + Math.PI) * diagonal * 0.8;
      y2 = centerY + offsetY + Math.sin(angle + Math.PI) * diagonal * 0.8;
    } else if (cutType === 'straight') {
      const isVertical = rnd() < 0.5;
      x1 = isVertical ? centerX : minX - diagonal * 0.1;
      y1 = isVertical ? minY - diagonal * 0.1 : centerY;
      x2 = isVertical ? centerX : maxX + diagonal * 0.1;
      y2 = isVertical ? maxY + diagonal * 0.1 : centerY;
    } else {
      const angle = rnd() * Math.PI;
      x1 = centerX + Math.cos(angle) * diagonal;
      y1 = centerY + Math.sin(angle) * diagonal;
      x2 = centerX + Math.cos(angle + Math.PI) * diagonal;
      y2 = centerY + Math.sin(angle + Math.PI) * diagonal;
    }

    cuts.push({ x1, y1, x2, y2, type: cutType });
  }

  return cuts;
};

export const applyExtraCutsWithRetry = (params: {
  shape: Point[];
  cuts: Cut[];
  cutType: CutType;
  cutCount: number;
  splitPolygon: (shape: Point[], cuts: Cut[]) => Point[][];
  initialPieces: Point[][];
  randomFn?: () => number;
}): Point[][] => {
  const { shape, cuts, cutType, cutCount, splitPolygon, initialPieces } = params;
  const rnd = params.randomFn ?? Math.random;

  let splitPieces = initialPieces;
  const isHighDifficulty = cutCount >= 7;
  const maxRetryCount = isHighDifficulty ? 5 : 3;
  let retryCount = 0;

  while (splitPieces.length < cuts.length && retryCount < maxRetryCount) {
    retryCount++;
    const bounds = computeBounds(shape);
    const neededExtraCuts = Math.max(0, Math.min(3, cuts.length - splitPieces.length + 1));
    const extraCuts = buildExtraCuts({
      cutType,
      cutCount,
      bounds,
      isHighDifficulty,
      neededExtraCuts,
      randomFn: rnd,
    });

    if (extraCuts.length > 0) {
      const additionalPieces = splitPolygon(shape, [...cuts, ...extraCuts]);
      if (additionalPieces.length > splitPieces.length) {
        splitPieces = additionalPieces;
      }
    }
  }

  return splitPieces;
};

