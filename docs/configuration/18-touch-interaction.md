# 触摸事件与交互配置

> 修订日期：2025-01-24 (v1.3.36)  
> 配置类型：触摸交互系统  
> 影响范围：移动端触摸操作、手势识别、交互反馈

## 概述

本文档详细说明触摸事件和交互系统的配置参数，包括触摸检测、拖拽操作、手势识别、磁吸效果等核心配置。

## 🎯 触摸事件处理配置

### 触摸事件监听器配置
- **作用**：移动端触摸事件处理，解决被动监听器 preventDefault 问题
- **事件类型**：支持所有触摸事件类型
  - `touchstart`：触摸开始
  - `touchmove`：触摸移动
  - `touchend`：触摸结束
  - `touchcancel`：触摸取消
- **监听器配置**：`{ passive: false }`（非被动监听器）
- **默认值**：非被动模式，允许 preventDefault
- **影响点**：移动端拖拽、旋转、页面滚动阻止
- **配置/代码位置**：`components/PuzzleCanvas.tsx`、`hooks/usePuzzleInteractions.ts`

### preventDefault策略配置
- **作用**：触摸操作与页面行为的协调
- **策略选择**：
  - 拖拽时阻止页面滚动
  - 旋转时阻止页面缩放
  - 长按时阻止上下文菜单
- **默认值**：智能阻止策略
- **影响点**：触摸操作与页面行为的协调
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（preventDefault逻辑）

## 🔍 触摸检测配置

### touchSensitivity
- **作用**：触摸检测灵敏度
- **设备差异**：
  - 触摸设备：30像素
  - 鼠标设备：20像素
- **取值范围**：20~50（像素）
- **默认值**：30（触摸），20（鼠标）
- **影响点**：拼图块选中精度、误触防护
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`

### touchTargetSize
- **作用**：触摸目标尺寸配置
- **最小尺寸**：44x44px（符合无障碍标准）
- **扩展区域**：拼图块周围的触摸检测区域
- **默认值**：44x44px最小触摸目标
- **影响点**：触摸操作的便利性和准确性
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（触摸区域计算）

### multiTouchSupport
- **作用**：多点触摸支持配置
- **支持功能**：
  - 双指旋转手势
  - 双指缩放手势（可选）
  - 多点拖拽（可选）
- **最大触摸点**：2个（双指操作）
- **默认值**：启用双指旋转
- **影响点**：高级触摸交互功能
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（多点触摸处理）

## 🖱️ 拖拽操作配置

### dragThreshold
- **作用**：拖拽触发阈值
- **取值范围**：5~15（像素）
- **默认值**：8像素
- **影响点**：区分点击和拖拽操作
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`

### dragSmoothness
- **作用**：拖拽平滑度配置
- **平滑策略**：
  - 位置插值平滑
  - 速度衰减处理
  - 边界缓冲处理
- **平滑系数**：0.1~0.5
- **默认值**：0.3（中等平滑）
- **影响点**：拖拽操作的流畅性
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（拖拽平滑逻辑）

### dragConstraints
- **作用**：拖拽约束配置
- **约束类型**：
  - 边界约束：限制在画布内
  - 速度约束：限制拖拽速度
  - 距离约束：限制拖拽距离
- **约束参数**：
  - 最大拖拽速度：1000px/s
  - 边界缓冲区：20px
- **默认值**：启用边界约束
- **影响点**：拖拽操作的合理性
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（约束逻辑）

### dragFeedback
- **作用**：拖拽反馈配置
- **反馈类型**：
  - 视觉反馈：拖拽时高亮显示
  - 触觉反馈：震动反馈（支持设备）
  - 听觉反馈：拖拽音效
- **默认值**：启用视觉和听觉反馈
- **影响点**：拖拽操作的用户体验
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（反馈逻辑）

## ✋ 手势识别配置

### gestureRecognition
- **作用**：手势识别系统配置
- **支持手势**：
  - 单指拖拽：移动拼图块
  - 双指旋转：旋转拼图块
  - 长按：显示上下文菜单
  - 双击：快速旋转
- **默认值**：启用所有手势
- **影响点**：触摸交互的丰富性
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（手势识别逻辑）

### rotationGesture
- **作用**：旋转手势配置
- **手势参数**：
  - 最小旋转角度：5度
  - 双指距离阈值：50px
  - 旋转中心：双指中点
- **默认值**：启用双指旋转手势
- **影响点**：旋转操作的便利性
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（旋转手势处理）

### longPressGesture
- **作用**：长按手势配置
- **长按参数**：
  - 长按时间：500ms
  - 移动容忍度：10px
  - 反馈延迟：300ms
- **默认值**：启用长按手势
- **影响点**：上下文操作的触发
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（长按处理）

### gestureConflictResolution
- **作用**：手势冲突解决配置
- **冲突处理**：
  - 拖拽与旋转冲突：优先拖拽
  - 长按与拖拽冲突：时间判断
  - 多手势同时：优先级排序
- **默认值**：启用冲突解决
- **影响点**：手势操作的稳定性
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（冲突解决逻辑）

## 🧲 磁吸效果配置

### magnetThreshold
- **作用**：磁吸效果触发距离
- **取值范围**：30~80（像素）
- **默认值**：50像素
- **影响点**：拼图块自动吸附的触发距离
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`

### magnetStrength
- **作用**：磁吸力强度
- **取值范围**：0.1~0.3
- **默认值**：0.15
- **影响点**：磁吸效果的强度和速度
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`

### magnetAnimation
- **作用**：磁吸动画配置
- **动画参数**：
  - 动画时长：200ms
  - 缓动函数：ease-out
  - 插值方式：贝塞尔曲线
- **默认值**：启用磁吸动画
- **影响点**：磁吸过程的视觉效果
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（磁吸动画）

### magnetFeedback
- **作用**：磁吸反馈配置
- **反馈类型**：
  - 视觉反馈：高亮显示吸附目标
  - 听觉反馈：吸附音效
  - 触觉反馈：震动提示
- **默认值**：启用所有反馈类型
- **影响点**：磁吸操作的用户体验
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（反馈逻辑）

## 📳 震动动画配置

### shakeAnimation
- **作用**：边界碰撞震动动画配置
- **震动参数**：
  - 震动次数：4~8次
  - 震动幅度：[8, -6, 5, -4, 3, -2]像素
  - 震动间隔：30ms
  - 总持续时间：180ms
- **默认值**：6次震动，间隔30ms
- **影响点**：边界反馈的视觉强度
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（震动动画逻辑）

### shakeIntensity
- **作用**：震动强度配置
- **强度等级**：
  - 轻微：幅度±3px，3次震动
  - 中等：幅度±6px，6次震动
  - 强烈：幅度±10px，8次震动
- **强度选择**：根据碰撞强度自动选择
- **默认值**：中等强度
- **影响点**：震动效果的视觉冲击力
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（强度计算）

### shakeDirection
- **作用**：震动方向配置
- **方向策略**：
  - 水平震动：左右摆动
  - 垂直震动：上下摆动
  - 随机震动：多方向组合
- **默认值**：根据碰撞方向自动选择
- **影响点**：震动效果的方向感
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（方向计算）

## ⚡ 触摸性能优化配置

### touchPerformanceOptimization
- **作用**：触摸性能优化配置
- **优化策略**：
  - 事件节流：减少高频事件处理
  - 计算缓存：缓存重复计算结果
  - DOM优化：减少DOM操作频率
- **性能目标**：
  - 触摸响应时间：< 16ms
  - 事件处理频率：< 60fps
  - 内存使用：稳定无泄漏
- **默认值**：启用所有优化
- **影响点**：触摸操作的性能表现
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（性能优化）

### eventThrottling
- **作用**：事件节流配置
- **节流参数**：
  - touchmove节流：16ms（60fps）
  - 计算节流：8ms（120fps）
  - 渲染节流：16ms（60fps）
- **默认值**：启用事件节流
- **影响点**：高频事件的性能控制
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（节流逻辑）

### memoryManagement
- **作用**：触摸交互内存管理配置
- **管理策略**：
  - 及时清理事件监听器
  - 触摸状态缓存释放
  - 避免闭包内存泄漏
- **默认值**：启用内存管理
- **影响点**：长期使用的内存稳定性
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（内存管理）

## 📱 设备适配配置

### mobileOptimization
- **作用**：移动端触摸优化配置
- **优化策略**：
  - 增大触摸目标区域
  - 优化手势识别精度
  - 提升响应速度
  - 减少误触发
- **优化参数**：
  - 触摸区域：+20%
  - 手势阈值：降低20%
  - 响应延迟：减少30%
- **默认值**：移动端自动启用
- **影响点**：移动端触摸体验
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（移动端优化）

### deviceSpecificConfiguration
- **作用**：设备特定配置
- **设备类型**：
  - iPhone：优化Safari触摸处理
  - Android：优化Chrome触摸处理
  - iPad：优化大屏触摸体验
- **配置优化**：
  - 触摸延迟处理
  - 手势识别精度
  - 性能优化策略
- **默认值**：自动设备检测和配置
- **影响点**：不同设备的触摸体验一致性
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（设备适配）

### accessibilitySupport
- **作用**：无障碍支持配置
- **支持功能**：
  - 最小触摸目标尺寸（44x44px）
  - 高对比度模式支持
  - 屏幕阅读器兼容
  - 键盘导航支持
- **默认值**：启用无障碍支持
- **影响点**：无障碍用户的使用体验
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（无障碍处理）

## 🔄 交互状态管理配置

### interactionState
- **作用**：交互状态管理配置
- **状态类型**：
  - 空闲状态：无交互
  - 拖拽状态：正在拖拽
  - 旋转状态：正在旋转
  - 磁吸状态：正在吸附
- **状态转换**：严格的状态机管理
- **默认值**：空闲状态
- **影响点**：交互操作的状态控制
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（状态管理）

### interactionHistory
- **作用**：交互历史记录配置
- **记录内容**：
  - 交互类型和时间戳
  - 交互参数和结果
  - 用户行为模式
- **记录长度**：最近50次交互
- **默认值**：启用历史记录
- **影响点**：交互分析和优化
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（历史记录）

### interactionValidation
- **作用**：交互有效性验证配置
- **验证规则**：
  - 交互权限检查
  - 状态一致性验证
  - 参数有效性检查
- **默认值**：启用完整验证
- **影响点**：交互操作的安全性
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（验证逻辑）

## 🛠️ 调试配置

### touchDebugMode
- **作用**：触摸调试模式配置
- **调试功能**：
  - 显示触摸点位置
  - 输出触摸事件详情
  - 验证手势识别结果
  - 调试可视化
- **调试可视化**：
  - 触摸轨迹显示
  - 手势识别区域
  - 交互状态指示
- **默认值**：开发环境启用，生产环境禁用
- **影响点**：开发调试效率
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（调试逻辑）

### performanceMonitoring
- **作用**：触摸性能监控配置
- **监控指标**：
  - 触摸响应时间
  - 事件处理频率
  - 内存使用情况
  - 手势识别准确率
- **默认值**：开发环境启用
- **影响点**：性能分析和优化
- **配置/代码位置**：`hooks/usePuzzleInteractions.ts`（性能监控逻辑）

## 📊 配置示例

### 基础触摸配置示例
```typescript
// 触摸配置示例
const touchConfig = {
  sensitivity: {
    touch: 30,
    mouse: 20,
    targetSize: 44
  },
  drag: {
    threshold: 8,
    smoothness: 0.3,
    constraints: true
  },
  gestures: {
    rotation: true,
    longPress: true,
    multiTouch: true
  }
};
```

### 磁吸效果配置示例
```typescript
// 磁吸效果配置
const magnetConfig = {
  threshold: 50,
  strength: 0.15,
  animation: {
    duration: 200,
    easing: 'ease-out'
  },
  feedback: {
    visual: true,
    audio: true,
    haptic: true
  }
};
```

### 性能优化配置示例
```typescript
// 性能优化配置
const performanceConfig = {
  throttling: {
    touchmove: 16,
    calculation: 8,
    rendering: 16
  },
  optimization: {
    eventCache: true,
    memoryManagement: true,
    batchProcessing: true
  },
  monitoring: {
    responseTime: 16,
    eventFrequency: 60,
    memoryStable: true
  }
};
```

## 🔍 故障排除

### 常见问题
1. **触摸不响应**：检查触摸事件监听器和灵敏度配置
2. **拖拽卡顿**：调整拖拽平滑度和性能优化配置
3. **手势识别失效**：验证手势参数和冲突解决配置
4. **磁吸效果异常**：检查磁吸阈值和强度配置

### 调试方法
- 启用触摸调试模式
- 检查触摸事件参数
- 验证手势识别逻辑
- 监控触摸性能指标

---

> 📖 **相关文档**
> - [移动端适配配置](./03-mobile-adaptation.md)
> - [碰撞与回弹配置](./09-collision-bounce.md)
> - [旋转配置](./10-rotation.md)
> - [设备适配与响应式配置](./11-device-responsive.md)