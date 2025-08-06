# 按钮测试ID参考文档

本文档列出了游戏界面中所有按钮的 `data-testid` 属性，用于 Playwright 自动化测试。

## 形状选择按钮
- `shape-polygon-button` - 多边形按钮
- `shape-curve-button` - 云朵形状按钮  
- `shape-irregular-button` - 锯齿形状按钮

## 切割类型按钮
- `cut-type-straight-button` - 直线切割按钮
- `cut-type-diagonal-button` - 斜线切割按钮

## 切割次数按钮
- `cut-count-1-button` - 切割1次按钮
- `cut-count-2-button` - 切割2次按钮
- `cut-count-3-button` - 切割3次按钮
- `cut-count-4-button` - 切割4次按钮
- `cut-count-5-button` - 切割5次按钮
- `cut-count-6-button` - 切割6次按钮
- `cut-count-7-button` - 切割7次按钮
- `cut-count-8-button` - 切割8次按钮

## 游戏操作按钮
- `generate-puzzle-button` - 切割形状按钮
- `scatter-puzzle-button` - 散开拼图按钮
- `hint-button` - 提示按钮
- `rotate-left-button` - 左转按钮
- `rotate-right-button` - 右转按钮
- `restart-button` - 重新开始按钮

## 移动端Tab按钮
- `tab-shape-button` - 形状选择Tab
- `tab-puzzle-button` - 切割类型Tab
- `tab-cut-button` - 切割次数Tab
- `tab-scatter-button` - 散开拼图Tab
- `tab-controls-button` - 游戏控制Tab

## 全局工具按钮
- `toggle-music-button` - 音乐开关按钮
- `toggle-fullscreen-button` - 全屏开关按钮

## Playwright 测试示例

```typescript
// 选择云朵形状
await page.getByTestId('shape-curve-button').click();

// 选择斜线切割
await page.getByTestId('cut-type-diagonal-button').click();

// 选择切割8次
await page.getByTestId('cut-count-8-button').click();

// 切割形状
await page.getByTestId('generate-puzzle-button').click();

// 散开拼图
await page.getByTestId('scatter-puzzle-button').click();

// 显示提示
await page.getByTestId('hint-button').click();

// 旋转拼图
await page.getByTestId('rotate-left-button').click();
await page.getByTestId('rotate-right-button').click();

// 重新开始游戏
await page.getByTestId('restart-button').click();
```

## 注意事项

1. 所有按钮文本已设置为不可选择，避免误触浏览器翻译或阅读插件
2. 使用 `data-testid` 比基于文本的选择器更稳定可靠
3. 测试脚本应优先使用 `getByTestId()` 而不是 `getByRole()` 或 `getByText()`