# 🚀 快速开始指南

欢迎使用 Generative Puzzle！这个指南将帮助你在5分钟内上手项目。

## 📋 环境要求

- Node.js 18+ 
- npm 或 yarn
- 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)

## ⚡ 快速安装

### 1. 克隆项目
```bash
git clone https://github.com/recohcity/generative-puzzle.git
cd generative-puzzle
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 打开浏览器
访问 [http://localhost:3000](http://localhost:3000) 查看项目

## 🎮 基础使用

### 游戏体验
1. **选择形状**: 点击多边形、曲线或不规则形状按钮
2. **设置切割**: 选择切割次数(1-8)和类型(直线/斜线)
3. **开始游戏**: 拖拽拼图块到正确位置
4. **完成拼图**: 所有块归位后查看完成动画

### 响应式测试
- **桌面端**: 调整浏览器窗口大小查看适配效果
- **移动端**: 使用开发者工具模拟不同设备
- **横竖屏**: 旋转设备或模拟器测试方向适配

## 🔧 核心API使用

### 设备检测
```typescript
import { useDevice } from 'generative-puzzle';

function MyComponent() {
  const device = useDevice();
  
  return (
    <div>
      <p>设备类型: {device.deviceType}</p>
      <p>是否移动端: {device.isMobile ? '是' : '否'}</p>
      <p>屏幕尺寸: {device.screenWidth}x{device.screenHeight}</p>
    </div>
  );
}
```

### 画布管理
```typescript
import { useCanvas } from 'generative-puzzle';
import { useRef } from 'react';

function CanvasComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const canvasSize = useCanvas({
    containerRef,
    canvasRef,
    backgroundCanvasRef
  });
  
  return (
    <div ref={containerRef}>
      <canvas ref={backgroundCanvasRef} />
      <canvas ref={canvasRef} />
      <p>画布尺寸: {canvasSize.width}x{canvasSize.height}</p>
    </div>
  );
}
```

### 配置使用
```typescript
import { UNIFIED_CONFIG } from 'generative-puzzle';

// 获取移动端配置
const mobileConfig = UNIFIED_CONFIG.adaptation.mobile;
console.log('移动端画布最大尺寸:', mobileConfig.MAX_CANVAS_SIZE);

// 获取设备检测阈值
const deviceThresholds = UNIFIED_CONFIG.device.thresholds;
console.log('移动端断点:', deviceThresholds.MOBILE_BREAKPOINT);

// 获取性能配置
const performanceConfig = UNIFIED_CONFIG.performance.thresholds;
console.log('目标帧率:', performanceConfig.TARGET_FPS);
```

## 🛠️ 开发工具

### API文档工具
```bash
# 扫描API变更
npm run scan-api-changes

# 分类API优先级
npm run classify-apis

# 检查文档完整性
npm run docs:check
```

### 项目结构工具
```bash
# 生成项目结构文档
npm run generate-structure
```

### 测试工具
```bash
# 运行完整测试套件
npm run test:e2e

# 仅运行Playwright测试
npm run test

# 查看测试报告
npm run test:report

# UI模式调试测试
npx playwright test --ui
```

## 📱 响应式开发

### 设备适配示例
```typescript
import { useDevice, UNIFIED_CONFIG } from 'generative-puzzle';

function ResponsiveComponent() {
  const device = useDevice();
  const config = UNIFIED_CONFIG.adaptation;
  
  // 根据设备类型选择配置
  const adaptationConfig = device.isMobile 
    ? config.mobile 
    : config.desktop;
  
  // 根据方向调整布局
  const layoutConfig = device.isPortrait 
    ? adaptationConfig.PORTRAIT 
    : adaptationConfig.LANDSCAPE;
  
  return (
    <div style={{
      padding: layoutConfig.CANVAS_MARGIN,
      maxWidth: adaptationConfig.MAX_CANVAS_SIZE
    }}>
      <h2>{device.deviceType}端布局</h2>
      <p>当前方向: {device.isPortrait ? '竖屏' : '横屏'}</p>
    </div>
  );
}
```

### iPhone 16系列优化
```typescript
import { UNIFIED_CONFIG } from 'generative-puzzle';

function iPhone16Optimization() {
  const iPhone16Config = UNIFIED_CONFIG.adaptation.iPhone16;
  
  // 获取特定型号的配置
  const iPhone16ProConfig = iPhone16Config.PORTRAIT_LIMITS['iPhone 16 Pro'];
  
  return (
    <div>
      <p>iPhone 16 Pro 竖屏最大画布: {iPhone16ProConfig}px</p>
    </div>
  );
}
```

## 🎨 自定义开发

### 创建自定义Hook
```typescript
import { useDevice, useCanvas } from 'generative-puzzle';
import { useMemo } from 'react';

function useCustomAdaptation() {
  const device = useDevice();
  const canvas = useCanvas();
  
  const adaptedSize = useMemo(() => {
    if (device.isMobile) {
      return Math.min(canvas.width, canvas.height) * 0.8;
    }
    return Math.min(canvas.width, canvas.height) * 0.6;
  }, [device.isMobile, canvas.width, canvas.height]);
  
  return {
    adaptedSize,
    isMobile: device.isMobile,
    canvasSize: canvas
  };
}
```

### 扩展配置
```typescript
import { UNIFIED_CONFIG } from 'generative-puzzle';

// 创建自定义配置
const customConfig = {
  ...UNIFIED_CONFIG,
  custom: {
    myFeature: {
      enabled: true,
      threshold: 100
    }
  }
};
```

## 🧪 测试你的代码

### 单元测试示例
```typescript
import { render, screen } from '@testing-library/react';
import { useDevice } from 'generative-puzzle';

// Mock the hook
jest.mock('generative-puzzle', () => ({
  useDevice: jest.fn()
}));

test('renders device info', () => {
  (useDevice as jest.Mock).mockReturnValue({
    deviceType: 'desktop',
    isMobile: false,
    screenWidth: 1920,
    screenHeight: 1080
  });
  
  render(<MyComponent />);
  expect(screen.getByText('设备类型: desktop')).toBeInTheDocument();
});
```

### E2E测试示例
```typescript
import { test, expect } from '@playwright/test';

test('device detection works', async ({ page }) => {
  await page.goto('/');
  
  // 测试桌面端
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(page.locator('[data-testid="device-type"]')).toContainText('desktop');
  
  // 测试移动端
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('[data-testid="device-type"]')).toContainText('phone');
});
```

## 📊 性能优化

### 性能监控
```typescript
import { UNIFIED_CONFIG } from 'generative-puzzle';

function PerformanceMonitor() {
  const thresholds = UNIFIED_CONFIG.performance.thresholds;
  
  // 监控帧率
  const checkFrameRate = () => {
    const fps = getCurrentFPS(); // 你的FPS获取逻辑
    if (fps < thresholds.MIN_ACCEPTABLE_FPS) {
      console.warn('帧率过低:', fps);
    }
  };
  
  // 监控内存使用
  const checkMemoryUsage = () => {
    const memory = getMemoryUsage(); // 你的内存获取逻辑
    if (memory > thresholds.MAX_MEMORY_USAGE_MB) {
      console.warn('内存使用过高:', memory);
    }
  };
}
```

## 🔍 故障排除

### 常见问题

**Q: 设备检测不准确？**
A: 检查 `DEVICE_THRESHOLDS` 配置，确保断点设置符合你的需求。

**Q: 画布尺寸计算错误？**
A: 确保容器元素已正确挂载，并且 refs 已正确传递给 `useCanvas`。

**Q: 性能测试失败？**
A: 运行 `npm run test:e2e` 查看详细的性能报告，检查是否有性能回归。

**Q: API文档不同步？**
A: 运行 `npm run scan-api-changes` 检查API变更，然后更新相应文档。

### 调试技巧

1. **开启调试模式**: 按 F10 键开启调试元素显示
2. **查看性能数据**: 访问 `/test` 页面查看性能趋势
3. **检查API覆盖率**: 运行 `npm run classify-apis` 查看文档覆盖情况
4. **使用开发者工具**: 利用浏览器开发者工具调试响应式布局

## 📚 下一步

- 📖 阅读 [完整API文档](./API_DOCUMENTATION.md)
- 🤝 查看 [贡献指南](../CONTRIBUTING.md)
- 🏗️ 了解 [项目架构](./project_structure.md)
- 🧪 学习 [测试指南](./automated_testing_workflow.cn.md)

## 💬 获取帮助

如果遇到问题：
1. 查看 [常见问题](./FAQ.md)
2. 搜索 [GitHub Issues](https://github.com/recohcity/generative-puzzle/issues)
3. 在 [讨论区](https://github.com/recohcity/generative-puzzle/discussions) 提问
4. 联系维护者: contact@recohcity.com

祝你使用愉快！🎉