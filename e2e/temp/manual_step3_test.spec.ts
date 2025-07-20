/**
 * Step3 手动测试脚本 - 按照用户指定的步骤进行测试
 * 
 * 测试步骤：
 * 1. 加载页面
 * 2. 选择生成的目标形状：点击多边形按钮
 * 3. 选择切割类型：点击斜线按钮
 * 4. 旋转切割次数：点击数字2按钮
 * 5. 生成拼图：点击切割形状按钮
 * 6. 此时改变浏览器窗口大小，观察切割的拼图有没有动态跟随目标形状进行适配（包括位置、大小）
 */

import { test, expect, Page } from '@playwright/test';
test.setTimeout(120000); // 增加超时时间以便观察

// 辅助函数：等待画布提示区域出现指定文本
async function waitForTip(page: Page, expected: string) {
  await expect(page.getByText(expected)).toBeVisible({ timeout: 10000 });
}

test.describe('Step3: 手动测试 - 拼图块跟随目标形状适配', () => {
  test('按照指定步骤测试拼图块适配功能', async ({ page }) => {
    console.log('🎯 开始Step3手动测试');
    
    // 1. 加载页面
    console.log('📝 步骤1: 加载页面');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await waitForTip(page, '请点击生成你喜欢的形状');
    console.log('✅ 页面加载完成');
    
    // 2. 选择生成的目标形状：点击多边形按钮
    console.log('📝 步骤2: 点击多边形按钮');
    await page.getByRole('button', { name: /多边形/ }).click();
    await waitForTip(page, '请选择切割类型');
    console.log('✅ 多边形形状已生成');
    
    // 3. 选择切割类型：点击斜线按钮
    console.log('📝 步骤3: 点击斜线按钮');
    await page.getByText('斜线').click();
    await waitForTip(page, '请切割形状');
    console.log('✅ 斜线切割类型已选择');
    
    // 4. 旋转切割次数：点击数字2按钮
    console.log('📝 步骤4: 点击数字2按钮');
    await page.getByRole('button', { name: '2' }).click();
    console.log('✅ 切割次数设置为2');
    
    // 5. 生成拼图：点击切割形状按钮
    console.log('📝 步骤5: 点击切割形状按钮');
    await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
    await waitForTip(page, '请散开拼图，开始游戏');
    console.log('✅ 拼图已生成');
    
    // 获取初始状态
    const initialState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        puzzle: state.puzzle,
        originalShape: state.originalShape,
        isScattered: state.isScattered,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight
      };
    });
    
    console.log(`📊 初始状态: 拼图块=${initialState.puzzle?.length || 0}个, 散开状态=${initialState.isScattered}, 画布=${initialState.canvasWidth}x${initialState.canvasHeight}`);
    
    // 验证拼图块已生成且未散开
    expect(initialState.puzzle).toBeTruthy();
    expect(initialState.puzzle.length).toBeGreaterThan(0);
    expect(initialState.isScattered).toBe(false);
    
    // 记录初始拼图块位置
    const initialPiecePositions = initialState.puzzle.map((piece: any, index: number) => ({
      index,
      x: piece.x,
      y: piece.y,
      rotation: piece.rotation
    }));
    
    console.log('📍 初始拼图块位置:');
    initialPiecePositions.forEach((pos: any) => {
      console.log(`  拼图块${pos.index}: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) 角度=${pos.rotation}°`);
    });
    
    // 6. 改变浏览器窗口大小，观察拼图块适配
    console.log('📝 步骤6: 改变浏览器窗口大小');
    
    const windowSizes = [
      { width: 1200, height: 900, name: '中等窗口' },
      { width: 1600, height: 1000, name: '大窗口' },
      { width: 1000, height: 800, name: '小窗口' },
      { width: 1400, height: 1050, name: '最终窗口' }
    ];
    
    for (let i = 0; i < windowSizes.length; i++) {
      const size = windowSizes[i];
      console.log(`🔄 改变窗口大小到 ${size.name}: ${size.width}x${size.height}`);
      
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(1500); // 等待适配完成
      
      // 获取适配后的状态
      const adaptedState = await page.evaluate(() => {
        const state = (window as any).__gameStateForTests__;
        return {
          puzzle: state.puzzle,
          originalShape: state.originalShape,
          isScattered: state.isScattered,
          canvasWidth: state.canvasWidth,
          canvasHeight: state.canvasHeight
        };
      });
      
      // 验证适配结果
      expect(adaptedState.puzzle).toBeTruthy();
      expect(adaptedState.puzzle.length).toBe(initialState.puzzle.length);
      expect(adaptedState.isScattered).toBe(false); // 仍然未散开
      
      // 记录适配后的拼图块位置
      const adaptedPiecePositions = adaptedState.puzzle.map((piece: any, index: number) => ({
        index,
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation
      }));
      
      console.log(`📍 ${size.name}下的拼图块位置:`);
      adaptedPiecePositions.forEach((pos: any, index: number) => {
        const initial = initialPiecePositions[index];
        const deltaX = pos.x - initial.x;
        const deltaY = pos.y - initial.y;
        console.log(`  拼图块${pos.index}: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) 角度=${pos.rotation}° [变化: Δx=${deltaX.toFixed(1)}, Δy=${deltaY.toFixed(1)}]`);
        
        // 验证拼图块仍保持0度角
        expect(pos.rotation).toBe(0);
      });
      
      // 验证拼图块位置发生了适配（除非是第一次，位置应该有变化）
      if (i > 0) {
        const positionChanged = adaptedPiecePositions.some((pos: any, index: number) => {
          const initial = initialPiecePositions[index];
          return Math.abs(pos.x - initial.x) > 1 || Math.abs(pos.y - initial.y) > 1;
        });
        expect(positionChanged).toBe(true);
        console.log('✅ 拼图块位置已适配');
      }
      
      console.log(`✅ ${size.name}适配完成\n`);
    }
    
    console.log('🎉 Step3手动测试完成！');
    console.log('📋 测试总结:');
    console.log('  ✅ 页面加载正常');
    console.log('  ✅ 多边形形状生成成功');
    console.log('  ✅ 斜线切割类型选择成功');
    console.log('  ✅ 切割次数设置成功');
    console.log('  ✅ 拼图块生成成功');
    console.log('  ✅ 拼图块在窗口大小变化时能够跟随目标形状进行适配');
    console.log('  ✅ 拼图块始终保持0度角（未旋转）');
    console.log('  ✅ 拼图块始终保持未散开状态');
    
    // 最后截图保存结果
    await page.screenshot({ 
      path: 'test-results/step3_manual_test_final.png',
      fullPage: true 
    });
    console.log('📸 最终状态截图已保存');
  });
  
  test('验证拼图块与目标形状的相对位置关系', async ({ page }) => {
    console.log('🎯 验证拼图块与目标形状的相对位置关系');
    
    // 执行相同的设置步骤
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    await waitForTip(page, '请点击生成你喜欢的形状');
    await page.getByRole('button', { name: /多边形/ }).click();
    await waitForTip(page, '请选择切割类型');
    
    await page.getByText('斜线').click();
    await waitForTip(page, '请切割形状');
    
    await page.getByRole('button', { name: '2' }).click();
    await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
    await waitForTip(page, '请散开拼图，开始游戏');
    
    // 获取初始状态
    const initialState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        puzzle: state.puzzle,
        originalShape: state.originalShape
      };
    });
    
    // 计算初始相对位置关系
    const calculateRelativePositions = (puzzle: any[], shape: any[]) => {
      if (!shape || shape.length === 0) return [];
      
      // 计算形状中心
      const shapeBounds = shape.reduce(
        (bounds, point) => ({
          minX: Math.min(bounds.minX, point.x),
          maxX: Math.max(bounds.maxX, point.x),
          minY: Math.min(bounds.minY, point.y),
          maxY: Math.max(bounds.maxY, point.y)
        }),
        { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
      );
      
      const shapeCenter = {
        x: (shapeBounds.minX + shapeBounds.maxX) / 2,
        y: (shapeBounds.minY + shapeBounds.maxY) / 2
      };
      
      // 计算每个拼图块相对于形状中心的位置
      return puzzle.map((piece, index) => ({
        index,
        relativeX: piece.x - shapeCenter.x,
        relativeY: piece.y - shapeCenter.y,
        absoluteX: piece.x,
        absoluteY: piece.y
      }));
    };
    
    const initialRelativePositions = calculateRelativePositions(initialState.puzzle, initialState.originalShape);
    console.log('📍 初始相对位置关系:');
    initialRelativePositions.forEach(pos => {
      console.log(`  拼图块${pos.index}: 相对位置(${pos.relativeX.toFixed(1)}, ${pos.relativeY.toFixed(1)}) 绝对位置(${pos.absoluteX.toFixed(1)}, ${pos.absoluteY.toFixed(1)})`);
    });
    
    // 改变窗口大小
    await page.setViewportSize({ width: 1300, height: 950 });
    await page.waitForTimeout(1500);
    
    // 获取适配后状态
    const adaptedState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        puzzle: state.puzzle,
        originalShape: state.originalShape
      };
    });
    
    const adaptedRelativePositions = calculateRelativePositions(adaptedState.puzzle, adaptedState.originalShape);
    console.log('📍 适配后相对位置关系:');
    adaptedRelativePositions.forEach(pos => {
      console.log(`  拼图块${pos.index}: 相对位置(${pos.relativeX.toFixed(1)}, ${pos.relativeY.toFixed(1)}) 绝对位置(${pos.absoluteX.toFixed(1)}, ${pos.absoluteY.toFixed(1)})`);
    });
    
    // 验证相对位置关系保持不变
    for (let i = 0; i < initialRelativePositions.length; i++) {
      const initial = initialRelativePositions[i];
      const adapted = adaptedRelativePositions[i];
      
      const relativeXDiff = Math.abs(initial.relativeX - adapted.relativeX);
      const relativeYDiff = Math.abs(initial.relativeY - adapted.relativeY);
      
      // 相对位置差异应该很小（允许一些浮点误差）
      expect(relativeXDiff).toBeLessThan(5);
      expect(relativeYDiff).toBeLessThan(5);
      
      console.log(`✅ 拼图块${i}相对位置关系保持稳定 (差异: Δx=${relativeXDiff.toFixed(2)}, Δy=${relativeYDiff.toFixed(2)})`);
    }
    
    console.log('🎉 相对位置关系验证完成！拼图块与目标形状保持完美的相对位置关系');
  });
});