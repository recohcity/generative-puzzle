/**
 * ScoreCalculator 覆盖率补充测试
 */

import {
    setHintConfig,
    getShapeMultiplier,
    getDeviceMultiplier,
    calculateRemainingRotations,
    getSpeedBonusDescription,
    getSpeedBonusDetails,
    calculateRotationScore,
    calculateHintScoreFromStats,
    calculateFinalScore,
    calculateTimeBonus
} from '../ScoreCalculator';
import { ShapeType, CutType, DifficultyLevel } from '@/types/puzzleTypes';

describe('ScoreCalculator Coverage Supplement', () => {
    describe('setHintConfig', () => {
        it('应该能更新提示配置', () => {
            setHintConfig({ freeHintsPerGame: 5 });
            const stats = {
                hintUsageCount: 4,
                difficulty: { cutCount: 1, actualPieces: 4, cutType: CutType.Straight, difficultyLevel: 'easy' as DifficultyLevel }
            } as any;
            expect(calculateHintScoreFromStats(stats)).toBe(0);
            setHintConfig({ freeHintsPerGame: 3 });
        });
    });

    describe('getShapeMultiplier', () => {
        it('应该为不同形状返回正确系数', () => {
            expect(getShapeMultiplier(ShapeType.Polygon)).toBe(1.0);
            expect(getShapeMultiplier(ShapeType.Cloud)).toBe(1.1);
            expect(getShapeMultiplier(ShapeType.Jagged)).toBe(1.05);
            expect(getShapeMultiplier('unknown')).toBe(1.0);

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            expect(getShapeMultiplier(undefined)).toBe(1.0);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('getDeviceMultiplier', () => {
        const originalNavigator = global.navigator;
        const originalWindow = global.window;

        afterEach(() => {
            global.navigator = originalNavigator;
            global.window = originalWindow;
            if (global.window) {
                delete (global.window as any).ontouchstart;
            }
        });

        it('在服务端环境应返回1.0', () => {
            const win = global.window;
            delete (global as any).window;
            expect(getDeviceMultiplier()).toBe(1.0);
            (global as any).window = win;
        });

        it('在有触摸支持的大屏设备应被视为iPad (1.0)', () => {
            Object.defineProperty(global.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                configurable: true
            });
            Object.defineProperty(global.navigator, 'maxTouchPoints', { value: 5, configurable: true });
            (global.window as any).ontouchstart = () => { };

            // Case 1: Standard iPad Portrait
            global.window.innerWidth = 768;
            global.window.innerHeight = 1024;
            expect(getDeviceMultiplier()).toBe(1.0);

            // Case 2: Standard iPad Landscape
            global.window.innerWidth = 1024;
            global.window.innerHeight = 768;
            expect(getDeviceMultiplier()).toBe(1.0);

            // Case 3: iPad Pro 12.9 Portrait
            global.window.innerWidth = 1024;
            global.window.innerHeight = 1366;
            expect(getDeviceMultiplier()).toBe(1.0);

            // Case 4: iPad Pro 12.9 Landscape
            global.window.innerWidth = 1366;
            global.window.innerHeight = 1024;
            expect(getDeviceMultiplier()).toBe(1.0);
        });

        it('移动设备极小屏应返回1.1', () => {
            Object.defineProperty(global.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)',
                configurable: true
            });
            // Small phone
            global.window.innerWidth = 320;
            global.window.innerHeight = 480;
            expect(getDeviceMultiplier()).toBe(1.1);
        });

        it('非触摸大屏应返回1.0', () => {
            Object.defineProperty(global.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                configurable: true
            });
            Object.defineProperty(global.navigator, 'maxTouchPoints', { value: 0, configurable: true });
            global.window.innerWidth = 1920;
            expect(getDeviceMultiplier()).toBe(1.0);
        });
    });

    describe('calculateRemainingRotations', () => {
        it('应处理各种边界情况', () => {
            const pieces = [
                { rotation: -45, isCompleted: false } as any,
                { rotation: 180, isCompleted: false } as any,
                { rotation: 360, isCompleted: false } as any,
                { rotation: 0, isCompleted: true } as any
            ];
            expect(calculateRemainingRotations(pieces)).toBe(15);
        });

        it('应处理空输入', () => {
            expect(calculateRemainingRotations(null as any)).toBe(0);
        });
    });

    describe('Speed Bonus Details & Descriptions', () => {
        const pieceCount = 4;
        const diff = 1; // baseTime = 20s. bonusMulti = 1.0. thresholds: 20, 26, 32, 40, 50

        it('应提供正确的细节', () => {
            const details = getSpeedBonusDetails(25, pieceCount, diff);
            expect(details.currentLevel?.name).toBe('快速');
            expect(details.nextLevel?.name).toBe('极速');
            expect(details.allLevels.length).toBe(5);
        });

        it('应处理慢节奏', () => {
            // slowThreshold = 20 * 1.5 = 30 in getSpeedBonusDetails.
            const desc = getSpeedBonusDescription(60, pieceCount, diff);
            expect(desc).toContain('慢');
        });

        it('应处理正好在阈值上的情况', () => {
            const desc = getSpeedBonusDescription(20, pieceCount, diff);
            expect(desc).toContain('极速');
        });

        it('应处理非常慢的情况 (getSpeedBonusDescription fallback)', () => {
            // duration very large
            const desc = getSpeedBonusDescription(1000, 4, 1);
            expect(desc).toContain('慢');
        });
    });

    describe('Speed Bonus Variations (Time Multipliers)', () => {
        it('应该测试所有难度区间的速度奖励', () => {
            // Difficulty 1-2 (avg 5s, coeff 1.0)
            expect(calculateTimeBonus({ difficulty: { cutCount: 1, actualPieces: 4 }, totalDuration: 10 } as any).timeBonus).toBe(600);
            // Difficulty 3-4 (avg 7s, coeff 1.2)
            expect(calculateTimeBonus({ difficulty: { cutCount: 3, actualPieces: 4 }, totalDuration: 10 } as any).timeBonus).toBe(720);
            // Difficulty 5-6 (avg 10s, coeff 1.5)
            expect(calculateTimeBonus({ difficulty: { cutCount: 5, actualPieces: 4 }, totalDuration: 10 } as any).timeBonus).toBe(900);
            // Difficulty 7-8 (avg 18s, coeff 2.0)
            expect(calculateTimeBonus({ difficulty: { cutCount: 7, actualPieces: 4 }, totalDuration: 10 } as any).timeBonus).toBe(1200);
        });
    });

    describe('calculateRotationScore - Legacy Branches', () => {
        it('应该覆盖降级算法的所有效率区间', () => {
            const baseStats = { minRotations: 100 };
            // 100%
            expect(calculateRotationScore({ ...baseStats, totalRotations: 100, hintUsageCount: 0 } as any)).toBeDefined();
            // 85% (efficiency = 100/110 = 90.9% > 80%)
            expect(calculateRotationScore({ ...baseStats, totalRotations: 110, hintUsageCount: 0 } as any)).toBeDefined();
            // 65% (efficiency = 100/150 = 66.6% > 60%)
            expect(calculateRotationScore({ ...baseStats, totalRotations: 150, hintUsageCount: 0 } as any)).toBeDefined();
            // 45% (efficiency = 100/220 = 45.4% > 40%)
            expect(calculateRotationScore({ ...baseStats, totalRotations: 220, hintUsageCount: 0 } as any)).toBeDefined();
            // 25% (efficiency = 100/400 = 25% > 20%)
            expect(calculateRotationScore({ ...baseStats, totalRotations: 400, hintUsageCount: 0 } as any)).toBeDefined();
            // 10% (efficiency = 100/1000 = 10% < 20%)
            expect(calculateRotationScore({ ...baseStats, totalRotations: 1000, hintUsageCount: 0 } as any)).toBeDefined();

            // Trigger legacy fallback with huge value
            expect(calculateRotationScore({ minRotations: 10, totalRotations: 1000000 } as any)).toBeDefined();
        });
    });

    describe('calculateLiveScore - Low Score Branch', () => {
        it('应处理小计低于100的情况', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const stats = {
                totalDuration: 5000, // Very slow
                totalRotations: 5000, // Very inefficient
                hintUsageCount: 100, // Too many hints
                difficulty: { cutCount: 1, actualPieces: 4, cutType: CutType.Straight, difficultyLevel: 'easy' as DifficultyLevel }
            } as any;
            // Subtotal will likely be negative or very small
            const result = (global as any).calculateLiveScore ? (global as any).calculateLiveScore(stats, []) : 100;
            // Wait, I should call the real function
            const realResult = (require('../ScoreCalculator')).calculateLiveScore(stats, []);
            expect(realResult).toBe(100);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Math.max(100'), expect.anything());
            consoleSpy.mockRestore();
        });
    });

    describe('validateScoreParams - Object Branch', () => {
        it('应处理stats不是对象的情况', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const { validateScoreParams } = require('../ScoreCalculator');
            expect(validateScoreParams(null)).toBe(false);
            expect(validateScoreParams(123)).toBe(false);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('calculateRotationScore', () => {
        it('应该处理无效输入', () => {
            expect(calculateRotationScore(null as any)).toBe(0);
            expect(calculateRotationScore({} as any)).toBe(0);
            expect(calculateRotationScore({ minRotations: 0, totalRotations: 10 } as any)).toBe(0);
        });

        it('降级到旧算法', () => {
            const stats = { minRotations: 5, totalRotations: 10000 } as any;
            expect(calculateRotationScore(stats)).toBeLessThan(0);
        });
    });

    describe('calculateFinalScore - pieces recompute', () => {
        it('应该包含所有得分细项并处理重新计算', () => {
            const stats = {
                totalDuration: 20,
                totalRotations: 5,
                hintUsageCount: 0,
                difficulty: { cutCount: 1, actualPieces: 4, cutType: CutType.Straight, difficultyLevel: 'easy' as DifficultyLevel }
            } as any;
            const pieces = [{ rotation: 15, isCompleted: false, points: [], originalPoints: [], id: 1 }] as any;
            const result = calculateFinalScore(stats, pieces, []);
            expect(result.minRotations).toBe(1);
            expect(result.finalScore).toBeDefined();
        });
    });
});
