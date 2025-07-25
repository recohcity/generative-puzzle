# 统一架构管理器配置 (v1.3.33)

> 修订日期：2025-01-24 (v1.3.33 新增)

本文档详细说明v1.3.33版本中新增的统一架构管理器配置，包括DeviceManager、CanvasManager、EventManager、AdaptationEngine四大核心管理器的配置参数。

---

## 1. DeviceManager 配置

### singleton
- **作用**：单例模式，确保全局唯一的设备检测实例
- **取值范围**：DeviceManager.getInstance()
- **默认值**：自动创建单例
- **影响点**：设备检测一致性、内存优化
- **配置/代码位置**：`utils/core/DeviceManager.ts`

### deviceDetectionCache
- **作用**：设备检测结果缓存，避免重复计算
- **取值范围**：{ isMobile: boolean, isPortrait: boolean, deviceType: string }
- **默认值**：首次检测时自动缓存
- **影响点**：性能优化、检测一致性
- **配置/代码位置**：`utils/core/DeviceManager.ts`

### deviceDetectionMethods
- **作用**：设备检测方法优先级配置
- **取值范围**：用户代理检测 → 屏幕尺寸检测 → 触摸检测
- **默认值**：按优先级顺序执行
- **影响点**：设备识别准确性
- **配置/代码位置**：`utils/core/DeviceManager.ts`

---

## 2. CanvasManager 配置

### singleton
- **作用**：单例模式，确保全局唯一的画布管理实例
- **取值范围**：CanvasManager.getInstance()
- **默认值**：自动创建单例
- **影响点**：画布状态一致性、内存优化
- **配置/代码位置**：`utils/core/CanvasManager.ts`

### canvasStateCache
- **作用**：画布状态缓存，统一管理画布尺寸、缩放等状态
- **取值范围**：{ size: CanvasSize, scale: number, orientation: string }
- **默认值**：初始化时自动设置
- **影响点**：画布适配、状态同步
- **配置/代码位置**：`utils/core/CanvasManager.ts`

### canvasSizeCalculation
- **作用**：画布尺寸计算策略配置
- **取值范围**：动态计算策略，根据设备类型选择不同算法
- **默认值**：自适应计算
- **影响点**：画布显示效果、适配质量
- **配置/代码位置**：`utils/core/CanvasManager.ts`

---

## 3. EventManager 配置

### singleton
- **作用**：单例模式，确保全局唯一的事件管理实例
- **取值范围**：EventManager.getInstance()
- **默认值**：自动创建单例
- **影响点**：事件监听器管理、内存优化
- **配置/代码位置**：`utils/core/EventManager.ts`

### eventListenerRegistry
- **作用**：事件监听器注册表，避免重复监听
- **取值范围**：Map<string, EventListener[]>
- **默认值**：空Map，动态注册
- **影响点**：事件监听器优化、内存泄漏防护
- **配置/代码位置**：`utils/core/EventManager.ts`

### maxListenersPerEvent
- **作用**：每个事件类型的最大监听器数量限制
- **取值范围**：1~10
- **默认值**：3
- **影响点**：性能优化、内存控制
- **配置/代码位置**：`utils/core/EventManager.ts`

### eventTypes
- **作用**：支持的事件类型配置
- **取值范围**：resize, orientationchange, visibilitychange
- **默认值**：全部启用
- **影响点**：事件监听范围、性能优化
- **配置/代码位置**：`utils/core/EventManager.ts`

---

## 4. AdaptationEngine 配置

### singleton
- **作用**：单例模式，确保全局唯一的适配引擎实例
- **取值范围**：AdaptationEngine.getInstance()
- **默认值**：自动创建单例
- **影响点**：适配逻辑统一、性能优化
- **配置/代码位置**：`utils/core/AdaptationEngine.ts`

### adaptationQueue
- **作用**：适配任务队列，避免并发适配冲突
- **取值范围**：Queue<AdaptationTask>
- **默认值**：空队列，动态添加任务
- **影响点**：适配性能、状态一致性
- **配置/代码位置**：`utils/core/AdaptationEngine.ts`

### adaptationStrategies
- **作用**：适配策略配置，支持不同类型的适配算法
- **取值范围**：形状适配、拼图块适配、散开拼图适配
- **默认值**：全部启用
- **影响点**：适配功能完整性
- **配置/代码位置**：`utils/core/AdaptationEngine.ts`

---

## 5. 统一架构Hooks配置

### useDevice Hook
- **作用**：统一设备检测Hook，替代分散的设备检测逻辑
- **取值范围**：{ isMobile: boolean, isPortrait: boolean, deviceType: string }
- **默认值**：自动检测
- **影响点**：所有组件的设备检测逻辑
- **配置/代码位置**：`hooks/useDevice.ts`

### useCanvas Hook
- **作用**：统一画布管理Hook，替代分散的画布状态管理
- **取值范围**：{ canvasSize: CanvasSize, scale: number, updateCanvas: Function }
- **默认值**：自动初始化
- **影响点**：所有布局组件的画布管理
- **配置/代码位置**：`hooks/useCanvas.ts`

### useEventManager Hook
- **作用**：统一事件管理Hook，替代分散的事件监听器
- **取值范围**：{ addEventListener: Function, removeEventListener: Function }
- **默认值**：自动管理
- **影响点**：事件监听器数量减少85%
- **配置/代码位置**：`hooks/useEventManager.ts`

---

## 6. 性能优化配置

### managerInitTime
- **作用**：管理器初始化时间基准
- **取值范围**：<10ms
- **默认值**：自动测量
- **影响点**：启动性能
- **配置/代码位置**：各管理器构造函数

### eventListenerReduction
- **作用**：事件监听器数量减少比例
- **取值范围**：85%减少（从~20个到3个）
- **默认值**：自动统计
- **影响点**：内存使用、性能优化
- **配置/代码位置**：`utils/core/EventManager.ts`

### codeReductionRatio
- **作用**：代码重复度减少比例
- **取值范围**：70%减少
- **默认值**：重构后自动达成
- **影响点**：维护性、可读性
- **配置/代码位置**：全局重构成果

### memoryOptimization
- **作用**：内存使用优化配置
- **取值范围**：单例模式 + 缓存机制 + 事件监听器优化
- **默认值**：全部启用
- **影响点**：内存使用稳定性
- **配置/代码位置**：各管理器实现

---

## 7. 组件迁移配置

### migratedComponents
- **作用**：已迁移到统一架构的组件列表
- **组件列表**：
  - 所有控制组件：ActionButtons、ShapeControls、PuzzleControls系列
  - 所有布局组件：DesktopLayout、PhoneLandscapeLayout、PhonePortraitLayout
  - 背景组件：ResponsiveBackground
  - 核心组件：PuzzleCanvas
- **影响点**：代码重复度降低70%，事件监听器减少85%
- **配置/代码位置**：各组件文件（使用useDevice()、useCanvas()、useEventManager()）

### migrationStatus
- **作用**：组件迁移状态跟踪
- **取值范围**：95%完成
- **默认值**：自动统计
- **影响点**：重构质量评估
- **配置/代码位置**：重构总结文档

---

## 8. 兼容性配置

### backwardCompatibility
- **作用**：与传统系统的向后兼容性保证
- **兼容策略**：保留原有Hook接口，逐步迁移
- **默认值**：启用兼容性保证
- **影响点**：系统升级的平滑性
- **配置/代码位置**：各Hook文件的兼容性处理

### legacyHookSupport
- **作用**：传统Hook的支持配置
- **支持范围**：useDeviceDetection、useResponsiveCanvasSizing等
- **默认值**：保持支持，逐步迁移
- **影响点**：迁移过程的稳定性
- **配置/代码位置**：传统Hook文件

---

## 9. 配置示例

### 完整配置示例
```typescript
// 使用统一架构的组件示例
import { useDevice } from '@/hooks/useDevice';
import { useCanvas } from '@/hooks/useCanvas';
import { useEventManager } from '@/hooks/useEventManager';

export function ExampleComponent() {
  // 统一设备检测
  const { isMobile, isPortrait, deviceType } = useDevice();
  
  // 统一画布管理
  const { canvasSize, scale, updateCanvas } = useCanvas();
  
  // 统一事件管理
  const { addEventListener, removeEventListener } = useEventManager();
  
  // 组件逻辑...
}
```

---

## 10. 故障排除

### 常见问题
1. **管理器初始化失败**：检查单例模式实现
2. **事件监听器重复**：确认使用统一事件管理器
3. **设备检测不准确**：检查设备检测优先级配置
4. **画布状态不同步**：确认使用统一画布管理器

### 调试方法
- 检查管理器单例状态
- 监控事件监听器数量
- 验证设备检测结果
- 追踪画布状态变化

---

> 📖 **相关文档**
> - [核心架构配置](./01-core-architecture.md)
> - [移动端适配配置](./03-mobile-adaptation.md)
> - [重构文档](../rebuild/REFACTORING_SUMMARY.md)