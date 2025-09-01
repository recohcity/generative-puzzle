# 旋转评分显示组件

旋转评分显示组件是一个支持多种显示模式的UI组件，用于展示玩家的旋转效率评分。该组件集成了国际化支持，使用适当的颜色方案区分完美旋转和超出旋转。

## 功能特性

- ✅ **多种显示模式**: 支持桌面端、移动端和紧凑模式
- ✅ **国际化支持**: 完整的中英文切换支持
- ✅ **智能颜色方案**: 金色表示完美旋转，红色表示超出旋转
- ✅ **无障碍性**: 支持屏幕阅读器和键盘导航
- ✅ **响应式设计**: 适配不同屏幕尺寸
- ✅ **性能优化**: 使用React.memo和useMemo优化渲染
- ✅ **错误处理**: 完善的错误处理和降级方案

## 组件变体

### 1. RotationScoreDisplay (主要组件)

支持所有显示模式和配置选项的主要组件。

```tsx
import { RotationScoreDisplay } from '@/components/score/RotationScoreDisplay';

<RotationScoreDisplay
  actualRotations={15}
  minRotations={10}
  displayMode="desktop"
  showIcon={true}
  showScore={true}
/>
```

### 2. SimpleRotationScoreDisplay (简化版本)

自动使用紧凑模式的简化版本，适合嵌入其他组件。

```tsx
import { SimpleRotationScoreDisplay } from '@/components/score/RotationScoreDisplay';

<SimpleRotationScoreDisplay
  actualRotations={12}
  minRotations={8}
/>
```

### 3. RotationScoreCard (卡片版本)

适合统计面板使用的卡片版本。

```tsx
import { RotationScoreCard } from '@/components/score/RotationScoreDisplay';

<RotationScoreCard
  actualRotations={10}
  minRotations={10}
/>
```

## 属性说明

### RotationScoreDisplay Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `actualRotations` | `number` | - | 实际旋转次数（必需） |
| `minRotations` | `number` | - | 最小旋转次数（必需） |
| `displayMode` | `'desktop' \| 'mobile' \| 'compact'` | `'desktop'` | 显示模式 |
| `showIcon` | `boolean` | `true` | 是否显示图标 |
| `showScore` | `boolean` | `true` | 是否显示分数 |
| `className` | `string` | `''` | 自定义CSS类名 |

## 显示模式

### Desktop 模式
- 完整的桌面端显示
- 包含图标、详细文本和分数
- 显示完整的标签和详细信息
- 适合桌面端游戏界面

### Mobile 模式
- 移动端优化显示
- 使用简化标签和图标
- 紧凑的布局设计
- 适合手机屏幕

### Compact 模式
- 最小化显示
- 只显示核心信息
- 适合嵌入其他组件
- 节省屏幕空间

## 算法说明

组件使用新的旋转效率算法：

- **完美旋转**: 实际旋转次数 = 最小旋转次数，获得 +500 分
- **超出旋转**: 每超出 1 次旋转，扣除 10 分
- **显示格式**: `实际次数/最小次数（状态描述）`

### 示例

```
10/10（完美）+500     // 完美旋转
15/10（多了5次）-50   // 超出5次旋转
0/0（完美）+500       // 零旋转完美
5/0（多了5次）-50     // 不必要的旋转
```

## 颜色方案

### 完美旋转 (金色主题)
- 容器: `border-yellow-200 bg-yellow-50/90`
- 图标: `text-yellow-600`
- 文本: `text-yellow-800`
- 分数: `text-yellow-700`

### 超出旋转 (红色主题)
- 容器: `border-red-200 bg-red-50/90`
- 图标: `text-red-600`
- 文本: `text-red-800`
- 分数: `text-red-700`

### 错误状态 (灰色主题)
- 容器: `border-gray-200 bg-gray-50`
- 图标: `text-gray-500`
- 文本: `text-gray-600`

## 国际化

组件支持完整的国际化，使用以下翻译键值：

```json
{
  "rotation": {
    "label": "旋转",
    "perfect": "完美",
    "excess": "多了{count}次",
    "score": {
      "perfect": "完美旋转，+500分",
      "excess": "超出{count}次，-{penalty}分"
    }
  }
}
```

### 英文翻译

```json
{
  "rotation": {
    "label": "Rotation",
    "perfect": "Perfect",
    "excess": "Excess {count}",
    "score": {
      "perfect": "Perfect rotation, +500 points",
      "excess": "Excess {count} times, -{penalty} points"
    }
  }
}
```

## 使用场景

### 1. 游戏完成统计

```tsx
<div className="game-stats">
  <RotationScoreCard
    actualRotations={gameStats.totalRotations}
    minRotations={gameStats.minRotations}
  />
</div>
```

### 2. 实时分数显示

```tsx
<div className="live-score">
  <RotationScoreDisplay
    actualRotations={currentRotations}
    minRotations={minRotations}
    displayMode="mobile"
  />
</div>
```

### 3. 嵌入式显示

```tsx
<div className="score-breakdown">
  <span>旋转评分：</span>
  <SimpleRotationScoreDisplay
    actualRotations={15}
    minRotations={10}
  />
</div>
```

## 样式定制

### CSS 模块

组件使用 CSS 模块提供额外的样式支持：

```css
/* 动画效果 */
.rotationScoreAnimation {
  animation: slideInFromRight 0.3s ease-out;
}

/* 完美旋转特效 */
.perfectRotationGlow {
  animation: perfectGlow 2s ease-in-out infinite alternate;
}

/* 响应式字体 */
.rotationText {
  font-size: clamp(0.75rem, 2vw, 1rem);
}
```

### 自定义样式

```tsx
<RotationScoreDisplay
  actualRotations={10}
  minRotations={10}
  className="custom-rotation-display"
/>
```

```css
.custom-rotation-display {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

## 无障碍性

组件遵循 WCAG 2.1 AA 标准：

- ✅ 支持屏幕阅读器 (`role="status"`, `aria-label`)
- ✅ 键盘导航支持
- ✅ 高对比度模式支持
- ✅ 减少动画模式支持
- ✅ 触摸目标大小符合标准 (44px+)

## 性能优化

- 使用 `React.memo` 避免不必要的重新渲染
- 使用 `useMemo` 缓存计算结果
- CSS 模块提供样式隔离
- 支持代码分割和懒加载

## 测试

组件包含完整的测试覆盖：

```bash
npm run test:unit -- components/score/__tests__/RotationScoreDisplay.test.tsx
```

测试覆盖：
- ✅ 完美旋转场景
- ✅ 超出旋转场景
- ✅ 边界条件处理
- ✅ 显示选项配置
- ✅ 颜色方案验证
- ✅ 无障碍性检查
- ✅ 错误处理
- ✅ 性能测试

## 错误处理

组件具有完善的错误处理机制：

1. **数据验证**: 验证输入参数的有效性
2. **降级方案**: 计算失败时显示安全的默认值
3. **错误日志**: 记录错误信息用于调试
4. **用户友好**: 向用户显示友好的错误信息

## 浏览器支持

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ iOS Safari 14+
- ✅ Android Chrome 90+

## 更新日志

### v1.0.0 (2025-01-01)
- ✅ 初始版本发布
- ✅ 支持三种显示模式
- ✅ 完整的国际化支持
- ✅ 新的旋转效率算法
- ✅ 完善的测试覆盖
- ✅ 无障碍性支持

## 贡献指南

1. 确保所有测试通过
2. 遵循现有的代码风格
3. 添加适当的测试用例
4. 更新文档和类型定义
5. 验证无障碍性要求

## 许可证

MIT License