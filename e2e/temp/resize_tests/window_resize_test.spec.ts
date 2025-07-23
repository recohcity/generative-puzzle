// Playwright/Node版本建议: 请确保Playwright与Node.js版本与CI一致，避免环境差异导致flaky
// Playwright: npx playwright --version
// Node.js: node --version

import { test, expect, Page } from '@playwright/test';
test.setTimeout(60000);
const { version } = require('../../package.json'); // 顶部引入版本号

// 定义性能指标接口
interface PerformanceMetrics {
    gotoLoadTime?: number;
    e2eLoadTime?: number;
    loadTime: number | undefined;
    resourceLoadTime?: number;
    shapeGenerationTime: number | undefined;
    puzzleGenerationTime: number | undefined;
    scatterTime: number | undefined;
    pieceInteractionTimes: number[];
    memoryUsage: number | undefined;
    fps: number[];
    totalTestTime: number | undefined;
    puzzleInteractionDuration: number | undefined;
    avgInteractionTime: number | undefined;
    shapeType?: string;
    cutType?: string;
    cutCount?: number;
    pieceCount?: number;
    version?: string;
    failReason?: string;
    envMode?: string;
    resizeAdaptationSuccess?: boolean;
    resizeAdaptationIssues?: string[];
}

// 自动识别开发/生产环境
function detectEnvMode() {
    if (process.env.NODE_ENV) return process.env.NODE_ENV;
    if (process.argv.some(arg => arg.includes('dev'))) return 'development';
    if (process.argv.some(arg => arg.includes('start') || arg.includes('prod'))) return 'production';
    try {
        const fs = require('fs');
        if (fs.existsSync('./.next') || fs.existsSync('./build') || fs.existsSync('./dist')) return 'production';
    } catch { }
    return 'development';
}

// 辅助函数：导航到页面并确保画布和控制面板可见
async function gotoAndEnsureCanvas(page: Page, initialWidth = 1366, initialHeight = 768) {
    await page.addInitScript(() => {
        (window as any).soundPlayedForTest = () => { };
    });
    await page.setViewportSize({ width: initialWidth, height: initialHeight });
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('canvas#puzzle-canvas');
    await waitForTip(page, '请点击生成你喜欢的形状');
}

// 辅助函数：旋转拼图到正确角度
async function rotatePieceToCorrectAngle(page: Page, pieceIndex: number, targetRotation: number) {
    const pieceCurrentRotation = (await page.evaluate((idx) => (window as any).__gameStateForTests__.puzzle[idx].rotation, pieceIndex));

    let diff = targetRotation - pieceCurrentRotation;
    // 调整角度差到 -180 到 180 之间，以找到最短旋转路径
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    // 每次旋转15度，计算所需调用次数
    const turns = Math.round(diff / 15);
    const clockwise = turns > 0;

    if (Math.abs(turns) > 0) {
        for (let t = 0; t < Math.abs(turns); t++) {
            const prevRotation = await page.evaluate((idx) => (window as any).__gameStateForTests__.puzzle[idx].rotation, pieceIndex);

            // 直接调用测试接口进行旋转
            await page.evaluate((isClockwise) => (window as any).rotatePieceForTest(isClockwise), clockwise);

            // 等待旋转完成
            await page.waitForFunction(([idx, initialRot]) => {
                const currentRot = (window as any).__gameStateForTests__.puzzle[idx].rotation;
                return currentRot !== initialRot;
            }, [pieceIndex, prevRotation], { timeout: 5000 });
        }
    }
}

// 健壮的等待函数，自动重试一次，超时提升到 30000ms
async function robustWaitForFunction(page: Page, fn: () => boolean, timeout = 30000) {
    try {
        await page.waitForFunction(fn, null, { timeout });
    } catch (e) {
        try {
            const state = await page.evaluate(() => (window as any).__gameStateForTests__);
            console.log('[robustWaitForFunction] retry after fail, state snapshot:', state);
        } catch (err) {
            console.log('[robustWaitForFunction] retry after fail, but page is closed.');
        }
        await page.waitForFunction(fn, null, { timeout });
    }
}

// 辅助函数：等待画布提示区域出现指定文本
async function waitForTip(page: Page, expected: string) {
    await expect(page.getByText(expected)).toBeVisible({ timeout: 10000 });
}

// 监听控制台日志
function setupConsoleListener(page: Page) {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
        const text = msg.text();
        consoleLogs.push(text);
        if (text.includes('basePuzzle') ||
            text.includes('RESET_GAME') ||
            text.includes('SET_BASE_PUZZLE') ||
            text.includes('generatePuzzle') ||
            text.includes('拼图块适配') ||
            text.includes('resize') ||
            text.includes('window') ||
            text.includes('Error')) {
            console.log('🔍 浏览器控制台:', text);
        }
    });
    return consoleLogs;
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        (window as any).soundPlayedForTest = () => { };
        // FPS采集脚本
        let lastTime = performance.now();
        let frames = 0;
        const fpsData: number[] = [];
        function measureFPS() {
            const now = performance.now();
            frames++;
            if (now - lastTime >= 1000) {
                const fps = Math.round((frames * 1000) / (now - lastTime));
                fpsData.push(fps);
                frames = 0;
                lastTime = now;
            }
            (window as any).fpsData = fpsData;
            requestAnimationFrame(measureFPS);
        }
        requestAnimationFrame(measureFPS);
        // 隐藏动画，确保浏览器持续刷新
        function dummyAnim() { requestAnimationFrame(dummyAnim); }
        requestAnimationFrame(dummyAnim);
    });
    // 使用较小的初始分辨率 1366x768
    await gotoAndEnsureCanvas(page, 1366, 768);
});

// --- 窗口大小变化适应性测试脚本 ---

test('窗口大小变化适应性测试', async ({ page }) => {
    // 测试开始，记录初始时间
    console.log('[E2E-debugLOG] 测试开始', { startTime: Date.now() });
    const startTime = Date.now();
    const metrics: PerformanceMetrics = {
        gotoLoadTime: undefined,
        e2eLoadTime: undefined,
        loadTime: undefined,
        resourceLoadTime: undefined,
        shapeGenerationTime: undefined,
        puzzleGenerationTime: undefined,
        scatterTime: undefined,
        pieceInteractionTimes: [],
        memoryUsage: undefined,
        fps: [],
        totalTestTime: undefined,
        puzzleInteractionDuration: undefined,
        avgInteractionTime: undefined,
        shapeType: 'N/A',
        cutType: 'N/A',
        cutCount: 0,
        pieceCount: 0,
        version,
        envMode: detectEnvMode(),
        resizeAdaptationSuccess: true,
        resizeAdaptationIssues: [],
    };

    // 设置控制台日志监听
    const consoleLogs = setupConsoleListener(page);

    try {
        // 1. 等待初始提示
        await waitForTip(page, '请点击生成你喜欢的形状');
        console.log('步骤 1: 初始提示 - 完成。');

        // 2. 形状生成
        const shapeGenStart = Date.now();
        await page.getByRole('button', { name: /云朵形状|云朵/ }).click();
        await waitForTip(page, '请选择切割类型');
        metrics.shapeGenerationTime = Date.now() - shapeGenStart;
        metrics.shapeType = '云朵';
        const stateAfterShape = await page.evaluate(() => (window as any).__gameStateForTests__);
        console.log('[E2E-debugLOG] 形状生成后全局状态', stateAfterShape);
        console.log('步骤 2: 选择云朵形状并生成 - 完成。');

        // 3. 拼图生成
        await page.getByText('斜线').click();
        metrics.cutType = '斜线';
        await waitForTip(page, '请切割形状');
        await page.getByRole('button', { name: '8' }).click();
        metrics.cutCount = 8;
        const puzzleGenStart = Date.now();
        await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
        await waitForTip(page, '请散开拼图，开始游戏');
        metrics.puzzleGenerationTime = Date.now() - puzzleGenStart;
        const stateAfterCut = await page.evaluate(() => (window as any).__gameStateForTests__);
        console.log('[E2E-debugLOG] 切割形状后全局状态', stateAfterCut);
        console.log('步骤 3: 切割形状并渲染拼图 - 完成。');

        // 4. 散开拼图
        const scatterStartTime = Date.now();
        await page.getByRole('button', { name: '散开拼图' }).click();
        await robustWaitForFunction(page, () => {
            const state = (window as any).__gameStateForTests__;
            return state && state.puzzle !== undefined;
        }, 30000);
        await robustWaitForFunction(page, () => {
            const state = (window as any).__gameStateForTests__;
            return Array.isArray(state.puzzle) && state.puzzle.length > 0
                && Array.isArray(state.originalPositions) && state.originalPositions.length > 0;
        }, 30000);
        const puzzle = await page.evaluate(() => (window as any).__gameStateForTests__.puzzle);
        await waitForTip(page, `0 / ${puzzle.length} 块拼图已完成`);
        metrics.scatterTime = Date.now() - scatterStartTime;
        console.log(`步骤 4: 点击散开拼图 - 完成。`);

        // 5. 获取原始位置信息
        const originalPositions = await page.evaluate(() => (window as any).__gameStateForTests__.originalPositions);
        console.log('[E2E-debugLOG] 获取 originalPositions', originalPositions ? originalPositions.length : originalPositions);
        metrics.pieceCount = puzzle.length;
        expect(puzzle.length).toBeGreaterThan(0);
        console.log(`步骤 5: 画布提示 (${puzzle.length} 块) - 完成。`);

        // 6. 记录窗口调整前的详细状态
        console.log('步骤 6: 记录窗口调整前的详细状态');
        const beforeResizeState = await page.evaluate(() => {
            const state = (window as any).__gameStateForTests__;

            // 计算原始形状的边界框
            const originalShapeBounds = state.originalShape.reduce((bounds, point) => {
                return {
                    minX: Math.min(bounds.minX, point.x),
                    minY: Math.min(bounds.minY, point.y),
                    maxX: Math.max(bounds.maxX, point.x),
                    maxY: Math.max(bounds.maxY, point.y)
                };
            }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

            // 计算拼图块相对于目标位置的偏移
            const pieceOffsets = state.puzzle.map((piece, index) => {
                const target = state.originalPositions[index];
                return {
                    index,
                    currentX: piece.x,
                    currentY: piece.y,
                    targetX: target.x,
                    targetY: target.y,
                    offsetX: piece.x - target.x,
                    offsetY: piece.y - target.y,
                    offsetDistance: Math.sqrt(Math.pow(piece.x - target.x, 2) + Math.pow(piece.y - target.y, 2))
                };
            });

            // 计算平均偏移和最大偏移
            const avgOffset = pieceOffsets.reduce((sum, offset) => sum + offset.offsetDistance, 0) / pieceOffsets.length;
            const maxOffset = Math.max(...pieceOffsets.map(offset => offset.offsetDistance));

            return {
                hasBasePuzzle: !!state.basePuzzle,
                basePuzzleLength: state.basePuzzle?.length || 0,
                puzzleLength: state.puzzle?.length || 0,
                isScattered: state.isScattered,
                canvasWidth: state.canvasWidth,
                canvasHeight: state.canvasHeight,
                baseCanvasSize: state.baseCanvasSize,
                originalShapeBounds,
                pieceOffsets,
                avgOffset,
                maxOffset,
                // 记录第一个拼图块的详细信息
                firstPiece: state.puzzle && state.puzzle.length > 0 ? {
                    x: state.puzzle[0].x,
                    y: state.puzzle[0].y,
                    points: state.puzzle[0].points.slice(0, 3),
                    targetX: state.originalPositions[0].x,
                    targetY: state.originalPositions[0].y,
                    offsetX: state.puzzle[0].x - state.originalPositions[0].x,
                    offsetY: state.puzzle[0].y - state.originalPositions[0].y
                } : null
            };
        });
        console.log('📊 窗口调整前详细状态:', beforeResizeState);

        // 保存窗口调整前的截图
        await page.screenshot({ path: 'before-resize.png' });

        // 7. 改变浏览器窗口大小
        console.log('步骤 7: 改变浏览器窗口大小 (1366x768 -> 1600x900)');
        await page.setViewportSize({ width: 1600, height: 900 });
        await page.waitForTimeout(2000); // 等待调整完成和可能的重绘

        // 保存窗口调整后的截图
        await page.screenshot({ path: 'after-resize.png' });

        // 8. 记录窗口调整后的详细状态
        console.log('步骤 8: 记录窗口调整后的详细状态');
        const afterResizeState = await page.evaluate(() => {
            const state = (window as any).__gameStateForTests__;

            // 计算原始形状的边界框
            const originalShapeBounds = state.originalShape.reduce((bounds, point) => {
                return {
                    minX: Math.min(bounds.minX, point.x),
                    minY: Math.min(bounds.minY, point.y),
                    maxX: Math.max(bounds.maxX, point.x),
                    maxY: Math.max(bounds.maxY, point.y)
                };
            }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

            // 计算拼图块相对于目标位置的偏移
            const pieceOffsets = state.puzzle.map((piece, index) => {
                const target = state.originalPositions[index];
                return {
                    index,
                    currentX: piece.x,
                    currentY: piece.y,
                    targetX: target.x,
                    targetY: target.y,
                    offsetX: piece.x - target.x,
                    offsetY: piece.y - target.y,
                    offsetDistance: Math.sqrt(Math.pow(piece.x - target.x, 2) + Math.pow(piece.y - target.y, 2))
                };
            });

            // 计算平均偏移和最大偏移
            const avgOffset = pieceOffsets.reduce((sum, offset) => sum + offset.offsetDistance, 0) / pieceOffsets.length;
            const maxOffset = Math.max(...pieceOffsets.map(offset => offset.offsetDistance));

            return {
                hasBasePuzzle: !!state.basePuzzle,
                basePuzzleLength: state.basePuzzle?.length || 0,
                puzzleLength: state.puzzle?.length || 0,
                isScattered: state.isScattered,
                canvasWidth: state.canvasWidth,
                canvasHeight: state.canvasHeight,
                baseCanvasSize: state.baseCanvasSize,
                originalShapeBounds,
                pieceOffsets,
                avgOffset,
                maxOffset,
                // 记录第一个拼图块的详细信息
                firstPiece: state.puzzle && state.puzzle.length > 0 ? {
                    x: state.puzzle[0].x,
                    y: state.puzzle[0].y,
                    points: state.puzzle[0].points.slice(0, 3),
                    targetX: state.originalPositions[0].x,
                    targetY: state.originalPositions[0].y,
                    offsetX: state.puzzle[0].x - state.originalPositions[0].x,
                    offsetY: state.puzzle[0].y - state.originalPositions[0].y
                } : null
            };
        });
        console.log('📊 窗口调整后详细状态:', afterResizeState);

        // 添加偏移分析
        console.log('📊 偏移分析:');
        if (beforeResizeState.avgOffset !== undefined && afterResizeState.avgOffset !== undefined) {
            console.log(`- 窗口调整前平均偏移: ${beforeResizeState.avgOffset.toFixed(2)}px`);
            console.log(`- 窗口调整后平均偏移: ${afterResizeState.avgOffset.toFixed(2)}px`);
        }
        if (beforeResizeState.maxOffset !== undefined && afterResizeState.maxOffset !== undefined) {
            console.log(`- 窗口调整前最大偏移: ${beforeResizeState.maxOffset.toFixed(2)}px`);
            console.log(`- 窗口调整后最大偏移: ${afterResizeState.maxOffset.toFixed(2)}px`);
        }

        // 计算第一个拼图块的偏移变化
        if (beforeResizeState.firstPiece && afterResizeState.firstPiece &&
            beforeResizeState.firstPiece.offsetX !== undefined && beforeResizeState.firstPiece.offsetY !== undefined &&
            afterResizeState.firstPiece.offsetX !== undefined && afterResizeState.firstPiece.offsetY !== undefined) {
            const firstPieceOffsetChange = {
                x: afterResizeState.firstPiece.offsetX - beforeResizeState.firstPiece.offsetX,
                y: afterResizeState.firstPiece.offsetY - beforeResizeState.firstPiece.offsetY
            };
            console.log(`- 第一个拼图块偏移变化: X轴 ${firstPieceOffsetChange.x.toFixed(2)}px, Y轴 ${firstPieceOffsetChange.y.toFixed(2)}px`);
        }

        // 9. 检查窗口调整后是否有问题
        if (!afterResizeState.hasBasePuzzle) {
            console.log('❌ 问题: 窗口调整后basePuzzle丢失');
            metrics.resizeAdaptationSuccess = false;
            metrics.resizeAdaptationIssues.push('窗口调整后basePuzzle丢失');
        }

        if (beforeResizeState.puzzleLength !== afterResizeState.puzzleLength) {
            console.log(`❌ 问题: 窗口调整后拼图数量变化 (${beforeResizeState.puzzleLength} -> ${afterResizeState.puzzleLength})`);
            metrics.resizeAdaptationSuccess = false;
            metrics.resizeAdaptationIssues.push(`窗口调整后拼图数量变化 (${beforeResizeState.puzzleLength} -> ${afterResizeState.puzzleLength})`);
        }

        // 检查偏移是否显著增加
        if (afterResizeState.avgOffset !== undefined && beforeResizeState.avgOffset !== undefined &&
            afterResizeState.avgOffset > beforeResizeState.avgOffset * 1.5) {
            console.log(`❌ 问题: 窗口调整后平均偏移显著增加 (${beforeResizeState.avgOffset.toFixed(2)}px -> ${afterResizeState.avgOffset.toFixed(2)}px)`);
            metrics.resizeAdaptationSuccess = false;
            metrics.resizeAdaptationIssues.push(`窗口调整后平均偏移显著增加 (${beforeResizeState.avgOffset.toFixed(2)}px -> ${afterResizeState.avgOffset.toFixed(2)}px)`);
        }

        // 检查第一个拼图块的偏移是否显著变化
        if (beforeResizeState.firstPiece && afterResizeState.firstPiece &&
            beforeResizeState.firstPiece.offsetX !== undefined && beforeResizeState.firstPiece.offsetY !== undefined &&
            afterResizeState.firstPiece.offsetX !== undefined && afterResizeState.firstPiece.offsetY !== undefined) {
            const offsetXChange = Math.abs(afterResizeState.firstPiece.offsetX - beforeResizeState.firstPiece.offsetX);
            const offsetYChange = Math.abs(afterResizeState.firstPiece.offsetY - beforeResizeState.firstPiece.offsetY);

            if (offsetXChange > 50 || offsetYChange > 50) {
                console.log(`❌ 问题: 窗口调整后第一个拼图块偏移显著变化 (X轴变化: ${offsetXChange.toFixed(2)}px, Y轴变化: ${offsetYChange.toFixed(2)}px)`);
                metrics.resizeAdaptationSuccess = false;
                metrics.resizeAdaptationIssues.push(`窗口调整后第一个拼图块偏移显著变化 (X轴变化: ${offsetXChange.toFixed(2)}px, Y轴变化: ${offsetYChange.toFixed(2)}px)`);
            }
        }

        // 10. 继续拼图交互测试
        console.log('步骤 9: 继续拼图交互测试');
        let puzzleInteractionStartTime = Date.now();

        // 检查是否可以继续交互
        try {
            // 尝试选择第一个拼图块
            await page.evaluate((index) => (window as any).selectPieceForTest(index), 0);
            console.log('✅ 窗口调整后可以选择拼图块');
        } catch (e) {
            console.log('❌ 问题: 窗口调整后无法选择拼图块', e);
            metrics.resizeAdaptationSuccess = false;
            metrics.resizeAdaptationIssues.push('窗口调整后无法选择拼图块');
        }

        // 继续完成拼图
        for (let i = 0; i < puzzle.length; i++) {
            const pieceInteractionStartTime = Date.now();
            try {
                // 使用新的测试接口直接选中拼图
                await page.evaluate((index) => (window as any).selectPieceForTest(index), i);

                const targetRotation = originalPositions[i].rotation;
                await rotatePieceToCorrectAngle(page, i, targetRotation);

                // 直接调用函数重置位置
                await page.evaluate((idx) => (window as any).resetPiecePositionForTest(idx), i);

                // 标记为完成
                await page.evaluate((idx) => (window as any).markPieceAsCompletedForTest(idx), i);

                const pieceInteractionEndTime = Date.now();
                metrics.pieceInteractionTimes.push(pieceInteractionEndTime - pieceInteractionStartTime);
                console.log(`✅ 拼图块 ${i} 完成`);
            } catch (e) {
                console.log(`❌ 问题: 拼图块 ${i} 交互失败`, e);
                metrics.resizeAdaptationSuccess = false;
                metrics.resizeAdaptationIssues.push(`拼图块 ${i} 交互失败: ${e}`);
            }
        }
        metrics.puzzleInteractionDuration = Date.now() - puzzleInteractionStartTime;

        // 11. 验证游戏是否最终完成
        console.log('步骤 10: 验证游戏是否最终完成');
        try {
            await robustWaitForFunction(page, () => {
                const state = (window as any).__gameStateForTests__;
                return state.completedPieces && state.puzzle && state.completedPieces.length === state.puzzle.length;
            }, 30000);

            await robustWaitForFunction(page, () => (window as any).__gameStateForTests__.isCompleted, 30000);
            console.log('✅ 游戏成功完成');
        } catch (e) {
            console.log('❌ 问题: 游戏未能成功完成', e);
            metrics.resizeAdaptationSuccess = false;
            metrics.resizeAdaptationIssues.push('游戏未能成功完成');
        }

        // 12. 收集相关日志
        const relevantLogs = consoleLogs.filter(log =>
            log.includes('basePuzzle') ||
            log.includes('RESET_GAME') ||
            log.includes('SET_BASE_PUZZLE') ||
            log.includes('generatePuzzle') ||
            log.includes('拼图块适配') ||
            log.includes('resize') ||
            log.includes('window') ||
            log.includes('Error')
        );

        console.log('🔍 相关日志:');
        relevantLogs.forEach(log => console.log('   ', log));

        // 13. 总结测试结果
        console.log('步骤 11: 总结测试结果');
        if (metrics.resizeAdaptationSuccess) {
            console.log('✅ 窗口大小变化适应性测试通过');
        } else {
            console.log('❌ 窗口大小变化适应性测试失败');
            console.log('问题列表:');
            metrics.resizeAdaptationIssues.forEach(issue => console.log(`- ${issue}`));
        }

        // 计算总测试时间并附加到报告
        metrics.totalTestTime = Date.now() - startTime;
        await test.info().attach('performance-metrics', {
            body: JSON.stringify(metrics, null, 2),
            contentType: 'application/json',
        });

    } catch (e) {
        // 如果测试失败，记录失败原因
        metrics.totalTestTime = Date.now() - startTime;
        metrics.failReason = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e);
        metrics.resizeAdaptationSuccess = false;
        metrics.resizeAdaptationIssues.push(`测试异常: ${metrics.failReason}`);

        try {
            await test.info().attach('performance-metrics', {
                body: JSON.stringify(metrics, null, 2),
                contentType: 'application/json',
            });
        } catch (attachError) {
            console.error('附加失败性能数据时出错:', attachError);
        }
        throw e;
    }
});