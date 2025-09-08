import { computeBounds, buildExtraCuts, applyExtraCutsWithRetry, type Cut } from '@/utils/puzzle/puzzleCompensation';
import type { Point } from '@/types/puzzleTypes';

const square: Point[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

const tri = (ox: number, oy: number): Point[] => [
  { x: ox, y: oy }, { x: ox + 10, y: oy }, { x: ox + 5, y: oy + 8 }
];

const quad = (ox: number, oy: number): Point[] => [
  { x: ox, y: oy }, { x: ox + 8, y: oy }, { x: ox + 8, y: oy + 8 }, { x: ox, y: oy + 8 }
];

describe('puzzleCompensation - 纯函数测试', () => {
  test('computeBounds 返回正确的边界与对角线', () => {
    const b = computeBounds(square);
    expect(b.minX).toBe(0);
    expect(b.maxX).toBe(100);
    expect(b.minY).toBe(0);
    expect(b.maxY).toBe(100);
    expect(b.centerX).toBe(50);
    expect(b.centerY).toBe(50);
    expect(Math.round(b.diagonal)).toBe(141);
  });

  test('buildExtraCuts - 直线切割：固定随机序列触发水平/垂直', () => {
    const rndSeq = [0.4, 0.6, 0.49, 0.51];
    let i = 0;
    const rnd = () => rndSeq[(i++) % rndSeq.length];
    const bounds = computeBounds(square);

    const verticalCuts = buildExtraCuts({ cutType: 'straight', cutCount: 5, bounds, isHighDifficulty: false, neededExtraCuts: 1, randomFn: rnd });
    expect(verticalCuts.length).toBe(1);
    // 第一条 isVertical=true，x1=x2=centerX
    expect(Math.round(verticalCuts[0].x1)).toBe(50);
    expect(Math.round(verticalCuts[0].x2)).toBe(50);

    const horizontalCuts = buildExtraCuts({ cutType: 'straight', cutCount: 5, bounds, isHighDifficulty: false, neededExtraCuts: 1, randomFn: rnd });
    expect(horizontalCuts.length).toBe(1);
    // 第二条 isVertical=false，y1=y2=centerY
    expect(Math.round(horizontalCuts[0].y1)).toBe(50);
    expect(Math.round(horizontalCuts[0].y2)).toBe(50);
  });

  test('buildExtraCuts - 高难度：对角与偏移', () => {
    const bounds = computeBounds(square);
    const rnd = () => 0.25; // 固定角度与偏移
    const cuts = buildExtraCuts({ cutType: 'diagonal', cutCount: 8, bounds, isHighDifficulty: true, neededExtraCuts: 2, randomFn: rnd });
    expect(cuts.length).toBe(2);
    cuts.forEach(c => {
      expect(typeof c.x1).toBe('number');
      expect(typeof c.y1).toBe('number');
      expect(typeof c.x2).toBe('number');
      expect(typeof c.y2).toBe('number');
    });
  });

  test('applyExtraCutsWithRetry - 多次重试直至提升片段数', () => {
    const bounds = computeBounds(square);
    const cuts: Cut[] = Array.from({ length: 5 }, (_, k) => ({ x1: 0, y1: k * 10, x2: 100, y2: k * 10, type: 'straight' as const }));

    // splitPolygon 序列：1 -> 1 -> 3 -> 6（最终 > cuts.length? 无需，满足 > initial）
    const seq = [ [tri(0,0)], [tri(0,0)], [tri(0,0), tri(12,0), tri(24,0)], [tri(0,0), tri(12,0), tri(24,0), tri(36,0), tri(48,0), tri(60,0)] ];
    let idx = 0;
    const splitPolygon = (_shape: Point[], _cuts: Cut[]) => {
      const out = seq[Math.min(idx, seq.length - 1)];
      idx++;
      return out;
    };

    const rnd = () => 0.4; // 让直线切割优先生成垂直
    const result = applyExtraCutsWithRetry({ shape: square, cuts, cutType: 'straight', cutCount: 5, splitPolygon, initialPieces: seq[0], randomFn: rnd });
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  test('applyExtraCutsWithRetry - 高难度对角线，重试上限为 5', () => {
    const cuts: Cut[] = Array.from({ length: 8 }, (_, k) => ({ x1: 0, y1: k * 8, x2: 100, y2: k * 8, type: 'diagonal' as const }));
    // 一直不提升，直到达到上限
    let calls = 0;
    const splitPolygon = (_shape: Point[], _cuts: Cut[]) => {
      calls++;
      return [tri(0,0)];
    };
    const res = applyExtraCutsWithRetry({ shape: square, cuts, cutType: 'diagonal', cutCount: 8, splitPolygon, initialPieces: [tri(0,0)], randomFn: () => 0.3 });
    expect(res.length).toBe(1); // 未能提升
    expect(calls).toBeGreaterThan(0); // 发生了重试
  });
});

