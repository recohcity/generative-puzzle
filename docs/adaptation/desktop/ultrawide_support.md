# 超宽屏显示器适配支持

## 🎯 适配目标

为超宽屏显示器（21:9、32:9等比例）提供专门的适配支持，确保游戏内容在超宽屏上能够合理布局，充分利用屏幕空间的同时保持良好的视觉体验。

## 📐 超宽屏规格分析

### 主流超宽屏分辨率

| 分辨率 | 宽高比 | 对角线 | 分类 | 适配优先级 |
|--------|--------|--------|------|------------|
| 2560×1080 | 21:9 | 29" | 标准超宽屏 | 🔥 高 |
| 3440×1440 | 21:9 | 34" | 高分辨率超宽屏 | 🔥 高 |
| 3840×1600 | 24:10 | 38" | 宽屏变种 | 🟡 中 |
| 5120×1440 | 32:9 | 49" | 超级超宽屏 | 🔥 高 |
| 5120×2160 | 21:9 | 49" | 5K超宽屏 | 🟡 中 |

### 超宽屏特性分析

```typescript
interface UltraWideSpecs {
  resolution: { width: number; height: number };
  aspectRatio: number;
  category: 'standard' | 'high-res' | 'super-wide';
  challenges: string[];
  opportunities: string[];
}

const ultraWideSpecs: UltraWideSpecs[] = [
  {
    resolution: { width: 3440, height: 1440 },
    aspectRatio: 2.39,
    category: 'high-res',
    challenges: [
      '内容可能过度拉伸',
      '界面元素分散过远',
      '视觉焦点不集中'
    ],
    opportunities: [
      '更多信息展示空间',
      '沉浸式游戏体验',
      '多窗口并行操作'
    ]
  }
];
```

## 🔍 超宽屏检测算法

### 检测逻辑

```typescript
class UltraWideDetector {
  private readonly ULTRA_WIDE_RATIO_THRESHOLD = 2.0;
  private readonly SUPER_WIDE_RATIO_THRESHOLD = 3.0;

  public detectUltraWideScreen(width: number, height: number): UltraWideDetection {
    const aspectRatio = width / height;
    
    if (aspectRatio < this.ULTRA_WIDE_RATIO_THRESHOLD) {
      return {
        isUltraWide: false,
        category: 'standard',
        aspectRatio,
        adaptationStrategy: 'default'
      };
    }

    if (aspectRatio >= this.SUPER_WIDE_RATIO_THRESHOLD) {
      return {
        isUltraWide: true,
        category: 'super-wide',
        aspectRatio,
        adaptationStrategy: 'extreme-centering'
      };
    }

    return {
      isUltraWide: true,
      category: 'ultra-wide',
      aspectRatio,
      adaptationStrategy: 'smart-centering'
    };
  }

  public getUltraWideConfig(detection: UltraWideDetection): UltraWideConfig {
    switch (detection.category) {
      case 'ultra-wide':
        return this.getStandardUltraWideConfig(detection.aspectRatio);
      case 'super-wide':
        return this.getSuperWideConfig(detection.aspectRatio);
      default:
        return this.getDefaultConfig();
    }
  }
}
```

### 精确匹配算法

```typescript
private matchKnownUltraWideResolutions(width: number, height: number): KnownResolution | null {
  const knownResolutions = [
    { width: 2560, height: 1080, name: '29" 21:9', category: 'standard' },
    { width: 3440, height: 1440, name: '34" 21:9', category: 'high-res' },
    { width: 5120, height: 1440, name: '49" 32:9', category: 'super-wide' },
    { width: 3840, height: 1600, name: '38" 24:10', category: 'wide-variant' }
  ];

  const tolerance = 10; // 10px容差

  for (const resolution of knownResolutions) {
    if (Math.abs(width - resolution.width) <= tolerance &&
        Math.abs(height - resolution.height) <= tolerance) {
      return {
        ...resolution,
        confidence: 0.95,
        exactMatch: true
      };
    }
  }

  return null;
}
```

## 🎨 适配策略设计

### 智能居中策略

```typescript
class UltraWideLayoutManager {
  public calculateSmartCentering(
    screenWidth: number,
    screenHeight: number,
    aspectRatio: number
  ): SmartCenteringResult {
    // 1. 计算理想内容宽度（基于高度的合理比例）
    const idealContentWidth = screenHeight * 1.8; // 1.8:1 黄金比例
    
    // 2. 如果屏幕宽度超过理想宽度，进行居中处理
    if (screenWidth > idealContentWidth) {
      const horizontalMargin = (screenWidth - idealContentWidth) / 2;
      
      return {
        strategy: 'smart-centering',
        contentWidth: idealContentWidth,
        horizontalMargin,
        verticalMargin: 0,
        layoutStyle: {
          maxWidth: idealContentWidth,
          margin: `0 ${horizontalMargin}px`,
          justifyContent: 'center'
        }
      };
    }

    // 3. 如果屏幕宽度合理，使用标准布局
    return {
      strategy: 'standard',
      contentWidth: screenWidth,
      horizontalMargin: 0,
      verticalMargin: 0,
      layoutStyle: {
        width: '100%',
        justifyContent: 'center'
      }
    };
  }
}
```

### 极端居中策略（32:9超级超宽屏）

```typescript
public calculateExtremeCentering(
  screenWidth: number,
  screenHeight: number
): ExtremeCenteringResult {
  // 对于32:9这样的极端比例，采用更保守的居中策略
  const maxContentWidth = screenHeight * 2.2; // 限制最大内容宽度
  const actualContentWidth = Math.min(screenWidth * 0.6, maxContentWidth);
  const horizontalMargin = (screenWidth - actualContentWidth) / 2;

  return {
    strategy: 'extreme-centering',
    contentWidth: actualContentWidth,
    horizontalMargin,
    utilizationRatio: actualContentWidth / screenWidth,
    layoutStyle: {
      maxWidth: actualContentWidth,
      margin: `0 ${horizontalMargin}px`,
      padding: '0 20px', // 额外的内边距
      justifyContent: 'center'
    }
  };
}
```

## 🖼️ 画布适配算法

### 超宽屏画布尺寸计算

```typescript
class UltraWideCanvasCalculator {
  public calculateUltraWideCanvasSize(
    screenWidth: number,
    screenHeight: number,
    ultraWideConfig: UltraWideConfig
  ): UltraWideCanvasResult {
    const TOP_BOTTOM_MARGIN = 40;
    const PANEL_WIDTH = 280;
    const CANVAS_PANEL_GAP = 10;
    const MIN_SIDE_MARGIN = 50; // 超宽屏最小侧边距

    // 1. 计算可用高度（与标准桌面端相同）
    const availableHeight = screenHeight - TOP_BOTTOM_MARGIN * 2;

    // 2. 计算理想内容宽度
    const idealContentWidth = ultraWideConfig.contentWidth || screenHeight * 1.8;
    
    // 3. 计算实际可用宽度
    const sideMargin = Math.max(
      (screenWidth - idealContentWidth) / 2,
      MIN_SIDE_MARGIN
    );
    
    const availableWidth = idealContentWidth - PANEL_WIDTH - CANVAS_PANEL_GAP - MIN_SIDE_MARGIN * 2;

    // 4. 确定画布尺寸（优先基于高度）
    let canvasSize = availableHeight;
    
    // 如果宽度限制更严格，则基于宽度
    if (availableWidth < canvasSize) {
      canvasSize = availableWidth;
    }

    // 5. 应用尺寸限制
    canvasSize = Math.max(240, Math.min(canvasSize, 1600));

    return {
      canvasSize,
      panelHeight: canvasSize,
      actualPanelWidth: PANEL_WIDTH,
      sideMargin,
      contentWidth: idealContentWidth,
      spaceUtilization: (canvasSize + PANEL_WIDTH + CANVAS_PANEL_GAP) / screenWidth,
      debug: {
        screenSize: `${screenWidth}x${screenHeight}`,
        aspectRatio: screenWidth / screenHeight,
        idealContentWidth,
        availableWidth,
        availableHeight,
        finalCanvasSize: canvasSize,
        strategy: ultraWideConfig.strategy
      }
    };
  }
}
```

## 🎮 用户体验优化

### 视觉焦点管理

```typescript
class UltraWideFocusManager {
  public optimizeVisualFocus(ultraWideResult: UltraWideCanvasResult): FocusOptimization {
    const { canvasSize, sideMargin, contentWidth } = ultraWideResult;

    return {
      // 1. 主要内容区域突出
      mainContentStyle: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      },

      // 2. 侧边区域淡化
      sideAreaStyle: {
        backgroundColor: '#f8fafc',
        opacity: 0.6
      },

      // 3. 渐变过渡效果
      gradientOverlay: {
        background: `linear-gradient(
          to right,
          rgba(248, 250, 252, 0.8) 0%,
          rgba(248, 250, 252, 0) ${sideMargin}px,
          rgba(248, 250, 252, 0) ${contentWidth - sideMargin}px,
          rgba(248, 250, 252, 0.8) 100%
        )`
      }
    };
  }
}
```

### 交互区域优化

```typescript
class UltraWideInteractionOptimizer {
  public optimizeInteractionAreas(screenWidth: number): InteractionOptimization {
    // 在超宽屏上，鼠标移动距离可能很长，需要优化交互区域
    const isExtremelyWide = screenWidth > 4000;

    return {
      // 1. 扩大可点击区域
      clickTargetSize: isExtremelyWide ? 48 : 44, // 更大的点击目标

      // 2. 智能鼠标捕获
      mouseCapture: {
        enabled: isExtremelyWide,
        captureRadius: 100, // 100px捕获半径
        magneticEffect: true // 磁性效果
      },

      // 3. 键盘快捷键增强
      keyboardShortcuts: {
        enabled: true,
        focusJump: true, // 快速跳转到游戏区域
        quickActions: ['space', 'enter', 'esc'] // 快捷操作键
      }
    };
  }
}
```

## 📊 性能优化

### 渲染优化

```typescript
class UltraWideRenderingOptimizer {
  public optimizeForUltraWide(screenWidth: number, screenHeight: number): RenderingOptimization {
    const pixelCount = screenWidth * screenHeight;
    const isHighPixelDensity = pixelCount > 4000000; // 4M像素以上

    return {
      // 1. 渲染区域限制
      renderingBounds: {
        enabled: true,
        maxWidth: Math.min(screenWidth, screenHeight * 2.5),
        culling: true // 视锥剔除
      },

      // 2. LOD（细节层次）调整
      levelOfDetail: {
        enabled: isHighPixelDensity,
        distanceThreshold: screenWidth / 10,
        qualityLevels: ['high', 'medium', 'low']
      },

      // 3. 批量渲染
      batchRendering: {
        enabled: true,
        batchSize: isHighPixelDensity ? 100 : 50,
        instancedRendering: true
      }
    };
  }
}
```

### 内存管理

```typescript
class UltraWideMemoryManager {
  public optimizeMemoryUsage(ultraWideConfig: UltraWideConfig): MemoryOptimization {
    return {
      // 1. 纹理压缩
      textureCompression: {
        enabled: true,
        format: 'DXT5', // 适合超宽屏的压缩格式
        mipmaps: true
      },

      // 2. 缓存策略
      cacheStrategy: {
        maxCacheSize: '100MB',
        evictionPolicy: 'LRU',
        preloadDistance: 200 // 预加载距离
      },

      // 3. 垃圾回收优化
      garbageCollection: {
        frequency: 'adaptive',
        threshold: 0.8, // 80%内存使用率时触发
        incrementalGC: true
      }
    };
  }
}
```

## 🧪 测试验证

### 超宽屏测试用例

```typescript
describe('超宽屏适配测试', () => {
  const ultraWideResolutions = [
    { width: 2560, height: 1080, name: '29" 21:9' },
    { width: 3440, height: 1440, name: '34" 21:9' },
    { width: 5120, height: 1440, name: '49" 32:9' }
  ];

  ultraWideResolutions.forEach(({ width, height, name }) => {
    test(`${name} (${width}x${height}) 适配测试`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      // 等待适配完成
      await page.waitForSelector('canvas');
      await page.waitForTimeout(500);

      // 验证内容居中
      const gameContainer = await page.$('.game-container');
      const containerBox = await gameContainer?.boundingBox();
      
      expect(containerBox).toBeTruthy();
      
      // 验证侧边距合理
      const sideMargin = (width - (containerBox?.width || 0)) / 2;
      expect(sideMargin).toBeGreaterThan(50); // 至少50px侧边距
      
      // 验证画布尺寸合理
      const canvas = await page.$('canvas');
      const canvasSize = await canvas?.evaluate(el => ({
        width: el.width,
        height: el.height
      }));
      
      expect(canvasSize?.width).toBeGreaterThan(240);
      expect(canvasSize?.height).toBeGreaterThan(240);
      expect(canvasSize?.width).toBeLessThanOrEqual(1600);
    });
  });
});
```

### 性能基准测试

```typescript
test('超宽屏性能基准测试', async ({ page }) => {
  await page.setViewportSize({ width: 5120, height: 1440 });
  await page.goto('/');

  // 测试渲染性能
  const renderingMetrics = await page.evaluate(() => {
    const start = performance.now();
    
    // 触发重绘
    const canvas = document.querySelector('canvas');
    const ctx = canvas?.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    
    const end = performance.now();
    return {
      renderTime: end - start,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    };
  });

  expect(renderingMetrics.renderTime).toBeLessThan(16); // 60fps要求
  expect(renderingMetrics.memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB限制
});
```

## 📈 适配效果评估

### 空间利用率分析

```typescript
interface SpaceUtilizationAnalysis {
  resolution: string;
  totalPixels: number;
  gameAreaPixels: number;
  utilization: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
}

const utilizationAnalysis: SpaceUtilizationAnalysis[] = [
  {
    resolution: '2560×1080',
    totalPixels: 2764800,
    gameAreaPixels: 1200000, // 估算游戏区域像素
    utilization: 0.43,
    rating: 'good'
  },
  {
    resolution: '3440×1440',
    totalPixels: 4953600,
    gameAreaPixels: 1800000,
    utilization: 0.36,
    rating: 'good'
  },
  {
    resolution: '5120×1440',
    totalPixels: 7372800,
    gameAreaPixels: 2000000,
    utilization: 0.27,
    rating: 'fair'
  }
];
```

### 用户体验评分

```typescript
interface UXScorecard {
  resolution: string;
  visualComfort: number; // 1-10
  interactionEfficiency: number; // 1-10
  contentReadability: number; // 1-10
  overallExperience: number; // 1-10
}

const uxScorecard: UXScorecard[] = [
  {
    resolution: '3440×1440',
    visualComfort: 9,
    interactionEfficiency: 8,
    contentReadability: 9,
    overallExperience: 8.7
  },
  {
    resolution: '5120×1440',
    visualComfort: 7,
    interactionEfficiency: 6,
    contentReadability: 8,
    overallExperience: 7.0
  }
];
```

## 🔮 未来优化计划

### 短期优化 (1-2个月)
1. **动态内容扩展**: 在超宽屏上显示更多游戏信息
2. **多窗口支持**: 支持同时显示多个游戏实例
3. **自定义布局**: 允许用户自定义超宽屏布局

### 中期优化 (3-6个月)
1. **沉浸式模式**: 全屏沉浸式游戏体验
2. **侧边栏功能**: 利用侧边空间显示辅助信息
3. **画中画模式**: 支持小窗口模式

### 长期优化 (6个月+)
1. **AI布局优化**: 基于用户行为智能调整布局
2. **多显示器支持**: 跨多个显示器的游戏体验
3. **VR/AR集成**: 为未来的沉浸式显示做准备

---

*本文档详细描述了超宽屏显示器的适配支持方案，确保在各种超宽屏设备上都能提供优秀的用户体验。*