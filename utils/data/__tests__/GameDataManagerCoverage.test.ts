/**
 * GameDataManager 覆盖率补充测试
 */

import { GameDataManager } from '../GameDataManager';

describe('GameDataManager Coverage Supplement', () => {
    let mockStore: Record<string, string> = {};

    const mockLocalStorage = {
        getItem: jest.fn((key: string) => mockStore[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            mockStore[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete mockStore[key];
        }),
        clear: jest.fn(() => {
            mockStore = {};
        }),
    };

    const mockSessionStore: Record<string, string> = {};
    const mockSessionStorage = {
        getItem: jest.fn((key: string) => mockSessionStore[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            mockSessionStore[key] = value;
        }),
    };

    beforeAll(() => {
        Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
        Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });
    });

    beforeEach(() => {
        mockStore = {};
        for (const key in mockSessionStore) delete mockSessionStore[key];
        jest.clearAllMocks();
        // Reset mock implementations to follow mockStore
        mockLocalStorage.getItem.mockImplementation((key: string) => mockStore[key] || null);
        mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
            mockStore[key] = value;
        });
        mockLocalStorage.removeItem.mockImplementation((key: string) => {
            delete mockStore[key];
        });
        mockSessionStorage.getItem.mockImplementation((key: string) => mockSessionStore[key] || null);
        mockSessionStorage.setItem.mockImplementation((key: string, value: string) => {
            mockSessionStore[key] = value;
        });
    });

    describe('trackVisitor', () => {
        it('应该在新访客进入时增加计数', () => {
            mockStore['puzzle-visitor-count'] = '5';
            mockSessionStore['puzzle-visited'] = '';

            GameDataManager.trackVisitor();

            expect(mockStore['puzzle-visitor-count']).toBe('6');
            expect(mockStore['puzzle-visited']).toBeUndefined(); // It sets to sessionStorage
            expect(mockSessionStore['puzzle-visited']).toBe('true');
        });

        it('应处理访客计数为空的情况', () => {
            delete mockStore['puzzle-visitor-count'];
            delete mockSessionStore['puzzle-visited'];

            GameDataManager.trackVisitor();

            expect(mockStore['puzzle-visitor-count']).toBe('1');
        });
    });

    describe('trackGameStart', () => {
        it('应该增加游戏开始计数', () => {
            mockStore['puzzle-game-start-count'] = '10';

            GameDataManager.trackGameStart();

            expect(mockStore['puzzle-game-start-count']).toBe('11');
        });
    });

    describe('getGlobalStats', () => {
        it('应该呈现综合统计', () => {
            mockStore['puzzle-visitor-count'] = '100';
            mockStore['puzzle-game-start-count'] = '500';

            const stats = GameDataManager.getGlobalStats();
            expect(stats.visitorCount).toBe(100);
            expect(stats.gameStartCount).toBe(500);
        });

        it('应处理统计数据为空的情况', () => {
            delete mockStore['puzzle-visitor-count'];
            delete mockStore['puzzle-game-start-count'];

            const stats = GameDataManager.getGlobalStats();
            expect(stats.visitorCount).toBe(0);
            expect(stats.gameStartCount).toBe(0);
        });
    });

    describe('getDataStats', () => {
        it('应处理数据为空的情况', () => {
            delete mockStore['puzzle-leaderboard'];
            delete mockStore['puzzle-history'];

            const stats = GameDataManager.getDataStats();
            expect(stats.storageUsed).toBe(0);
            expect(stats.isStorageAvailable).toBe(true);
        });
    });
});
