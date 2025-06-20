# Test info

- Name: 完整自动化游戏流程（含性能评测）
- Location: /Users/recoh/Documents/myWork/Project/generative-puzzle/e2e/full_game_flow.spec.ts:193:5

# Error details

```
Error: 形状生成时间超标

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 500
Received:    612
    at /Users/recoh/Documents/myWork/Project/generative-puzzle/e2e/full_game_flow.spec.ts:372:53
```

# Page snapshot

```yaml
- main:
  - heading "生成式拼图游戏" [level=1]
  - button "开启背景音乐":
    - img
  - button "进入全屏":
    - img
  - heading "拼图设置" [level=3]
  - text: 选择形状类型
  - button "多边形":
    - img
    - text: 多边形
  - button "曲凸形状":
    - img
    - text: 曲凸形状
  - button "云朵形状":
    - img
    - text: 云朵形状
  - button "生成形状"
  - text: 选择切割类型
  - radiogroup:
    - radio "直线" [disabled]
    - text: 直线
    - radio "斜线" [disabled]
    - text: 斜线
  - text: 选择切割次数
  - button "选择切割1次" [disabled]: "1"
  - button "选择切割2次" [disabled]: "2"
  - button "选择切割3次" [disabled]: "3"
  - button "选择切割4次" [disabled]: "4"
  - button "选择切割5次" [disabled]: "5"
  - button "选择切割6次" [disabled]: "6"
  - button "选择切割7次" [disabled]: "7"
  - button "选择切割8次" [disabled]: "8"
  - text: 简单 困难
  - button "切割形状" [disabled]:
    - img
    - text: 切割形状
  - button "散开拼图" [disabled]:
    - img
    - text: 散开拼图
  - text: 散开拼图后将无法修改拼图设置
  - heading "游戏控制" [level=3]
  - button "显示提示" [disabled]:
    - img
  - button "逆时针旋转" [disabled]:
    - img
  - button "顺时针旋转" [disabled]:
    - img
  - button "重新开始":
    - img
    - text: 重新开始
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
  272 |         const piece = (window as any).__gameStateForTests__.puzzle[idx];
  273 |         return { x: piece.x, y: piece.y };
  274 |       }, i);
  275 |       await page.mouse.click(canvasBox.x + pieceCenter.x, canvasBox.y + pieceCenter.y);
  276 |       await page.waitForTimeout(100); // 等待选中状态生效
  277 |
  278 |       // 1. 旋转到目标角度（点击按钮，自动选择顺时针或逆时针，最短路径）
  279 |       const getRotation = async () => await page.evaluate((idx) => (window as any).__gameStateForTests__.puzzle[idx].rotation, i);
  280 |       const targetRotation = originalPositions[i].originalRotation ?? originalPositions[i].rotation;
  281 |       let currentRotation = await getRotation();
  282 |       let rotateCount = 0;
  283 |       while (Math.abs(((currentRotation - targetRotation + 360) % 360)) > 7 && rotateCount < 24) {
  284 |         const diff = ((targetRotation - currentRotation + 360) % 360);
  285 |         const counterDiff = ((currentRotation - targetRotation + 360) % 360);
  286 |         const useClockwise = diff <= counterDiff;
  287 |         if (useClockwise) {
  288 |           await page.getByRole('button', { name: /顺时针/ }).click();
  289 |         } else {
  290 |           await page.getByRole('button', { name: /逆时针/ }).click();
  291 |         }
  292 |         await page.waitForTimeout(50);
  293 |         currentRotation = await getRotation();
  294 |         rotateCount++;
  295 |       }
  296 |       console.log(`拼图块 ${i} 旋转完成。`);
  297 |
  298 |       // 2. 拖拽到目标位置（用相对位移）
  299 |       const targetX = originalPositions[i].x;
  300 |       const targetY = originalPositions[i].y;
  301 |       const dx = targetX - pieceCenter.x;
  302 |       const dy = targetY - pieceCenter.y;
  303 |       await page.mouse.move(canvasBox.x + pieceCenter.x, canvasBox.y + pieceCenter.y);
  304 |       await page.mouse.down();
  305 |       await page.mouse.move(canvasBox.x + pieceCenter.x + dx, canvasBox.y + pieceCenter.y + dy, { steps: 10 });
  306 |       await page.mouse.up();
  307 |       await page.waitForTimeout(200);
  308 |
  309 |       // 拖拽后输出实际位置和目标位置
  310 |       const pieceAfter = await page.evaluate((idx) => {
  311 |         const piece = (window as any).__gameStateForTests__.puzzle[idx];
  312 |         return { x: piece.x, y: piece.y, rotation: piece.rotation };
  313 |       }, i);
  314 |       console.log(`拼图块 ${i} 拖拽后位置:`, pieceAfter, '目标:', { x: targetX, y: targetY, rotation: targetRotation });
  315 |
  316 |       // 微调：如果未吸附，尝试小幅度多次靠近目标
  317 |       let microAdjustCount = 0;
  318 |       while (!(await page.evaluate((idx) => (window as any).__gameStateForTests__.completedPieces.includes(idx), i)) && microAdjustCount < 5) {
  319 |         await page.mouse.move(canvasBox.x + pieceCenter.x + dx + microAdjustCount, canvasBox.y + pieceCenter.y + dy + microAdjustCount);
  320 |         await page.mouse.down();
  321 |         await page.mouse.move(canvasBox.x + pieceCenter.x + dx, canvasBox.y + pieceCenter.y + dy, { steps: 2 });
  322 |         await page.mouse.up();
  323 |         await page.waitForTimeout(200);
  324 |         microAdjustCount++;
  325 |       }
  326 |
  327 |       // 等待 completedPieces 更新（延长等待时间）
  328 |       await page.waitForFunction(
  329 |         (idx) => (window as any).__gameStateForTests__.completedPieces.includes(idx),
  330 |         i,
  331 |         { timeout: 10000 }
  332 |       );
  333 |       const completedCount = await page.evaluate(() => (window as any).__gameStateForTests__.completedPieces.length);
  334 |       console.log(`拼图块 ${i} 拖拽完成，已完成数量更新为 ${completedCount}/${totalPieces}。`);
  335 |     }
  336 |     console.log('步骤 6: 拼图旋转和拖拽到目标位置 - 完成。');
  337 |
  338 |     // 7. 检查完成状态
  339 |     console.log('等待前 gameState:', await page.evaluate(() => (window as any).__gameStateForTests__));
  340 |     await page.waitForFunction(() => (window as any).__gameStateForTests__.isCompleted, null, { timeout: 20000 });
  341 |     console.log('等待后 gameState:', await page.evaluate(() => (window as any).__gameStateForTests__));
  342 |     console.log('步骤 7: 最后1块拼图完成时，画布渲染完成效果 - 完成。');
  343 |
  344 |     // 8. 重新开始
  345 |     await page.getByRole('button', { name: /重新开始/ }).click();
  346 |     await page.waitForTimeout(300);
  347 |     console.log('步骤 8: 点击重新开始按钮，清空画布，恢复初始游戏状态 - 完成。');
  348 |
  349 |     // 完成测试后评估性能
  350 |     metrics.totalTestTime = Date.now() - startTime;
  351 |     metrics.fps = await page.evaluate(() => (window as any).fpsData || []);
  352 |     const finalMetrics = await measurePerformance(page);
  353 |     metrics.memoryUsage = finalMetrics.memoryUsage;
  354 |
  355 |     // 输出性能评测结果
  356 |     console.log('\n=== 性能评测结果 ===');
  357 |     console.log(`页面加载时间: ${metrics.loadTime}ms`);
  358 |     console.log(`形状生成时间: ${metrics.shapeGenerationTime}ms`);
  359 |     console.log(`拼图生成时间: ${metrics.puzzleGenerationTime}ms`);
  360 |     console.log(`散开时间: ${metrics.scatterTime}ms`);
  361 |     const avgInteractionTime = metrics.pieceInteractionTimes.length > 0 ? (metrics.pieceInteractionTimes.reduce((a, b) => a + b, 0) / metrics.pieceInteractionTimes.length) : '缺失';
  362 |     console.log(`平均拼图交互时间: ${avgInteractionTime === '缺失' ? '缺失' : avgInteractionTime.toFixed(2) + 'ms'}`);
  363 |     const avgFps = metrics.fps.length > 0 ? (metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length) : '缺失';
  364 |     console.log(`平均帧率: ${avgFps === '缺失' ? '缺失' : avgFps.toFixed(1) + 'fps'}`);
  365 |     const memMB = metrics.memoryUsage === undefined ? '缺失' : (metrics.memoryUsage / 1024 / 1024).toFixed(2);
  366 |     console.log(`内存使用: ${memMB === '缺失' ? '缺失' : memMB + 'MB'}`);
  367 |     console.log(`总测试时间: ${metrics.totalTestTime}ms`);
  368 |     console.log('====================\n');
  369 |
  370 |     // 用expect断言性能基准
  371 |     expect(metrics.loadTime, '页面加载时间超标').toBeLessThanOrEqual(PERFORMANCE_BENCHMARKS.loadTime);
> 372 |     expect(metrics.shapeGenerationTime, '形状生成时间超标').toBeLessThanOrEqual(PERFORMANCE_BENCHMARKS.shapeGenerationTime);
      |                                                     ^ Error: 形状生成时间超标
  373 |     expect(metrics.puzzleGenerationTime, '拼图生成时间超标').toBeLessThanOrEqual(PERFORMANCE_BENCHMARKS.puzzleGenerationTime);
  374 |     expect(metrics.scatterTime, '散开时间超标').toBeLessThanOrEqual(PERFORMANCE_BENCHMARKS.scatterTime);
  375 |     expect(avgInteractionTime, '平均拼图交互时间超标').toBeLessThanOrEqual(PERFORMANCE_BENCHMARKS.pieceInteractionTime);
  376 |     expect(avgFps, '平均帧率过低').toBeGreaterThanOrEqual(PERFORMANCE_BENCHMARKS.minFps);
  377 |     expect(metrics.memoryUsage, '内存使用超标').toBeLessThanOrEqual(PERFORMANCE_BENCHMARKS.maxMemoryUsage);
  378 |
  379 |     console.log('测试通过: 完整自动化游戏流程测试成功。');
  380 |   } catch (e) {
  381 |     testError = e;
  382 |     throw e;
  383 |   } finally {
  384 |     metrics.totalTestTime = Date.now() - startTime;
  385 |     // 兼容未采集到的项
  386 |     const icon = (val: number | undefined, base: number, type: 'max' | 'min' = 'max', label = '', unit = '') => {
  387 |       if (val === undefined) return `❌ ${label}`;
  388 |       const n = typeof val === 'number' ? val : parseFloat(val as any);
  389 |       let flag = '';
  390 |       if (type === 'max') flag = n > base ? '⚠️' : '✅';
  391 |       if (type === 'min') flag = n < base ? '⚠️' : '✅';
  392 |       // 内存和帧率保留两位小数，ms保留0位
  393 |       let numStr: string | number = n;
  394 |       if (unit === 'MB' || unit === 'fps') numStr = n.toFixed(2);
  395 |       if (unit === 'ms') numStr = n.toFixed(0);
  396 |       return `${flag} ${label}: ${numStr}${unit}`;
  397 |     };
  398 |     const avgInteractionTime = metrics.pieceInteractionTimes.length > 0 ? (metrics.pieceInteractionTimes.reduce((a, b) => a + b, 0) / metrics.pieceInteractionTimes.length) : undefined;
  399 |     const avgFps = metrics.fps.length > 0 ? (metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length) : undefined;
  400 |     const memMB = metrics.memoryUsage === undefined ? undefined : (metrics.memoryUsage / 1024 / 1024);
  401 |     console.log('\n=== 性能评测结果 ===');
  402 |     console.log(icon(metrics.loadTime, PERFORMANCE_BENCHMARKS.loadTime, 'max', '页面加载时间', 'ms'));
  403 |     console.log(icon(metrics.shapeGenerationTime, PERFORMANCE_BENCHMARKS.shapeGenerationTime, 'max', '形状生成时间', 'ms'));
  404 |     console.log(icon(metrics.puzzleGenerationTime, PERFORMANCE_BENCHMARKS.puzzleGenerationTime, 'max', '拼图生成时间', 'ms'));
  405 |     console.log(icon(metrics.scatterTime, PERFORMANCE_BENCHMARKS.scatterTime, 'max', '散开时间', 'ms'));
  406 |     console.log(icon(avgInteractionTime, PERFORMANCE_BENCHMARKS.pieceInteractionTime, 'max', '平均拼图交互时间', 'ms'));
  407 |     console.log(icon(avgFps, PERFORMANCE_BENCHMARKS.minFps, 'min', '平均帧率', 'fps'));
  408 |     console.log(icon(memMB, PERFORMANCE_BENCHMARKS.maxMemoryUsage / 1024 / 1024, 'max', '内存使用', 'MB'));
  409 |     console.log(`总测试时间: ${metrics.totalTestTime ?? '缺失'}ms`);
  410 |     console.log('====================\n');
  411 |   }
  412 | });
```