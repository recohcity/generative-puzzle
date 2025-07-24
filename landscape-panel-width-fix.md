# 横屏面板宽度修复

## 问题描述
- 竖屏正常适配 ✅
- 横屏左侧面板很窄，显示不完整 ❌
- 用户建议：横屏时左侧tab面板宽度可以与画布高度一致，横屏有足够位置显示

## 修复方案

### 智能面板宽度计算
```typescript
// 智能计算面板宽度：优先使用画布尺寸，如果空间不够则使用原始计算值
const idealPanelWidth = canvasSizeValue; // 理想情况下与画布尺寸一致
const totalRequiredWidth = idealPanelWidth + canvasSizeValue + canvasMargin * 3; // 面板 + 画布 + 3个边距
const availableWidth = device.screenWidth;
const hasEnoughSpace = availableWidth >= totalRequiredWidth;

// 如果空间足够，使用理想宽度；否则使用原始计算的宽度
const panelWidth = hasEnoughSpace ? idealPanelWidth : landscapeResult.panelWidth;
```

### 修复逻辑
1. **理想宽度**：面板宽度 = 画布尺寸（正方形）
2. **空间检查**：计算总需求宽度 = 面板宽度 + 画布宽度 + 边距
3. **智能选择**：
   - 如果屏幕宽度足够：使用理想宽度（与画布一致）
   - 如果屏幕宽度不够：使用原始计算的宽度

### 预期效果

#### 大屏幕设备（如iPhone 16 Pro Max横屏 956px）
- 面板宽度 = 画布尺寸（如420px）
- 总需求：420 + 420 + 18 = 858px < 956px ✅
- 使用理想宽度，面板显示完整

#### 小屏幕设备（如iPhone 16横屏 852px）
- 理想宽度可能导致总需求超过屏幕宽度
- 自动降级使用原始计算的宽度
- 确保布局不会溢出

## 调试信息
修复后会输出详细的计算信息：
```
📱 横屏画布尺寸计算: {
  screenSize: "956x440",
  canvasSize: 420,
  originalPanelWidth: 260,
  idealPanelWidth: 420,
  actualPanelWidth: 420,
  totalRequiredWidth: 858,
  availableWidth: 956,
  hasEnoughSpace: true,
  strategy: "使用理想宽度(与画布一致)"
}
```

## 优势
1. **显示完整**：面板有足够宽度显示所有内容
2. **智能适配**：根据屏幕尺寸自动选择最佳宽度
3. **向后兼容**：小屏幕设备仍使用原始计算逻辑
4. **视觉平衡**：面板与画布尺寸一致，视觉更协调