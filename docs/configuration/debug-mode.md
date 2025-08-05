# F10 Debug 调试模式配置

> 修订日期：2025-07-24 (v1.3.36)

本文档详细说明F10 Debug调试模式的配置参数，包括调试功能、日志输出、可视化显示等核心配置。

---

## 1. 调试模式启用配置

### debugToggle
- **作用**：F10键切换调试模式的核心配置
- **触发键**：F10键（keyCode 121）
- **默认值**：false（调试模式关闭）
- **影响点**：调试信息显示、日志收集、可视化渲染
- **配置/代码位置**：`hooks/useDebugToggle.ts`

### debugModeSupport
- **作用**：调试模式支持的设备类型
- **支持设备**：桌面端（直接按F10）、移动端（需外接键盘）
- **默认值**：全平台支持
- **影响点**：调试功能的可用性
- **配置/代码位置**：`hooks/useDebugToggle.ts`（键盘事件监听）

### debugStateManagement
- **作用**：调试状态管理配置
- **状态类型**：布尔值，全局共享
- **持久化**：会话期间保持，页面刷新重置
- **默认值**：false
- **影响点**：调试功能的开关状态
- **配置/代码位置**：`hooks/useDebugToggle.ts`（useState管理）

---

## 2. 调试显示内容配置

### puzzleBorderVisualization
- **作用**：拼图占位红色虚线矩形框显示配置
- **显示内容**：每个拼图块的红色虚线边框
- **样式配置**：
  - 颜色：红色 (#ff0000)
  - 线型：虚线 (dashed)
  - 线宽：2px
  - 透明度：0.8
- **默认值**：调试模式下启用
- **影响点**：拼图块边界可视化
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（debug状态下渲染）

### puzzleIndexDisplay
- **作用**：拼图序号显示配置
- **显示内容**：每个拼图块中心显示序号（从1开始）
- **样式配置**：
  - 字体：Arial, sans-serif
  - 字号：16px
  - 颜色：红色 (#ff0000)
  - 背景：白色半透明
  - 对齐：居中
- **默认值**：调试模式下启用
- **影响点**：拼图块索引识别
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（debug状态下渲染）

### canvasBorderVisualization
- **作用**：游戏有效交互区域红色虚线边框显示配置
- **显示内容**：整个拼图交互区域的边框
- **样式配置**：
  - 颜色：红色 (#ff0000)
  - 线型：虚线 (dashed)
  - 线宽：3px
  - 透明度：0.6
- **默认值**：调试模式下启用
- **影响点**：画布边界可视化
- **配置/代码位置**：`utils/rendering/puzzleDrawing.ts`（drawCanvasBorderLine函数）

### centerCrossVisualization
- **作用**：画布中心和形状中心对齐检测配置
- **显示内容**：
  - 红色+：画布几何中心点
  - 黑色+：目标形状实际中心点
- **样式配置**：
  - 画布中心：红色 (#ff0000)，线宽3px，长度30px
  - 形状中心：黑色 (#000000)，线宽3px，长度30px
- **对齐判断**：
  - 完美居中：只看到黑色+（两个+重叠）
  - 偏移错误：看到红色+和黑色+分离
- **默认值**：调试模式下启用
- **影响点**：形状居中适配验证
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（F10调试功能）

---

## 3. 调试日志配置

### debugLogCollection
- **作用**：调试日志收集配置
- **收集内容**：
  - canvas有效交互区域尺寸与坐标
  - 每个拼图块的中心点、所有顶点坐标
  - 拼图块旋转角度、完成/选中状态
  - 时间戳信息
- **存储方式**：内存数组，实时更新
- **默认值**：调试模式下启用
- **影响点**：调试信息的完整性
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（logDebugEvent函数）

### debugLogTriggers
- **作用**：调试日志触发时机配置
- **触发条件**：
  - 调试模式开启时
  - 画布尺寸变化时
  - 拼图块移动/散开/吸附时
  - 窗口resize时
- **默认值**：启用所有触发条件
- **影响点**：日志记录的完整性和及时性
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（各事件处理函数）

### debugLogFormat
- **作用**：调试日志格式配置
- **数据结构**：
```typescript
{
  timestamp: string,
  event: string,
  canvas: { width: number, height: number, area: number },
  puzzlePieces: Array<{
    index: number,
    center: { x: number, y: number },
    vertices: Array<{ x: number, y: number }>,
    rotation: number,
    isCompleted: boolean,
    isSelected: boolean
  }>
}
```
- **默认值**：结构化JSON格式
- **影响点**：日志的可读性和分析便利性
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（日志数据结构）

---

## 4. 调试日志导出配置

### debugLogExportButton
- **作用**：调试日志导出按钮配置
- **显示位置**：右上角固定位置
- **样式配置**：
  - 背景：半透明深蓝色 (rgba(30, 58, 138, 0.9))
  - 文字：白色 (#ffffff)
  - 圆角：8px
  - 阴影：0 4px 6px rgba(0, 0, 0, 0.1)
  - 悬停：高亮效果
- **默认值**：调试模式下显示
- **影响点**：调试日志的导出便利性
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（导出按钮渲染）

### debugLogExportFormat
- **作用**：调试日志导出格式配置
- **文件格式**：JSON格式
- **文件命名**：debugLog-yyyymmddhhmmss.json
- **导出方式**：浏览器下载
- **默认值**：JSON格式，时间戳命名
- **影响点**：导出文件的标准化和可识别性
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（exportDebugLog函数）

### debugLogExportContent
- **作用**：调试日志导出内容配置
- **导出内容**：完整的调试日志数组
- **数据处理**：JSON.stringify格式化
- **文件大小**：根据日志数量动态变化
- **默认值**：导出所有收集的日志
- **影响点**：导出数据的完整性
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（导出逻辑）

---

## 5. 调试性能配置

### debugRenderingPerformance
- **作用**：调试渲染性能配置
- **性能影响**：调试模式下渲染开销增加约10-15%
- **优化策略**：只在调试模式下执行调试渲染
- **默认值**：生产环境自动优化
- **影响点**：调试功能对性能的影响
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（条件渲染）

### debugLogPerformance
- **作用**：调试日志性能配置
- **内存使用**：日志数组占用内存，随时间增长
- **性能优化**：限制日志数组最大长度
- **最大日志数**：1000条（可配置）
- **默认值**：启用日志数量限制
- **影响点**：长时间调试的内存稳定性
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（日志数组管理）

### debugEventThrottling
- **作用**：调试事件节流配置
- **节流策略**：高频事件（如resize）进行节流处理
- **节流间隔**：100ms
- **默认值**：启用事件节流
- **影响点**：调试模式下的性能稳定性
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（事件处理优化）

---

## 6. 调试功能扩展配置

### debugEventTypes
- **作用**：支持的调试事件类型配置
- **当前支持**：
  - 'debug_mode_enabled'：调试模式启用
  - 'canvas_resize'：画布尺寸变化
  - 'puzzle_move'：拼图块移动
  - 'puzzle_scatter'：拼图散开
  - 'puzzle_snap'：拼图吸附
- **扩展支持**：可添加更多事件类型
- **默认值**：启用所有当前支持的事件
- **影响点**：调试信息的覆盖范围
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（事件类型定义）

### debugDataExtension
- **作用**：调试数据扩展配置
- **当前字段**：
  - isTablet: null（预留扩展）
  - isDesktop: null（预留扩展）
  - browserInfo: 可扩展浏览器信息
- **扩展可能**：设备详细信息、性能指标、用户行为等
- **默认值**：保留扩展接口
- **影响点**：调试信息的详细程度
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（数据结构扩展）

---

## 7. 调试模式安全配置

### debugModeRestriction
- **作用**：调试模式使用限制配置
- **使用场景**：开发和测试阶段
- **生产环境**：建议禁用或限制访问
- **安全考虑**：避免敏感信息泄露
- **默认值**：开发环境启用，生产环境可选
- **影响点**：系统安全性
- **配置/代码位置**：环境变量控制

### debugLogSecurity
- **作用**：调试日志安全配置
- **敏感信息**：避免记录用户隐私数据
- **数据脱敏**：坐标信息相对化处理
- **本地存储**：日志仅在客户端处理
- **默认值**：启用安全措施
- **影响点**：用户隐私保护
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（数据处理逻辑）

---

## 8. 调试工具集成配置

### browserDevToolsIntegration
- **作用**：浏览器开发者工具集成配置
- **控制台输出**：调试信息同时输出到控制台
- **性能分析**：支持Performance API集成
- **内存监控**：支持内存使用情况监控
- **默认值**：开发环境启用
- **影响点**：开发调试效率
- **配置/代码位置**：`components/PuzzleCanvas.tsx`（console.log输出）

### debugVisualizationTools
- **作用**：调试可视化工具配置
- **可视化内容**：边界、序号、坐标等
- **绘制工具**：Canvas 2D API
- **样式定制**：颜色、线型、字体等可配置
- **默认值**：启用基础可视化
- **影响点**：调试信息的直观性
- **配置/代码位置**：`utils/rendering/puzzleDrawing.ts`

---

## 9. 配置示例

### 基础调试配置示例
```typescript
// 调试模式配置
const debugConfig = {
  enabled: false,
  visualizations: {
    puzzleBorders: true,
    puzzleIndexes: true,
    canvasBorder: true
  },
  logging: {
    maxLogCount: 1000,
    exportFormat: 'json',
    eventThrottling: 100
  }
};
```

### 高级调试配置示例
```typescript
// 扩展调试配置
const advancedDebugConfig = {
  performance: {
    renderingImpact: 0.15,
    memoryLimit: '50MB',
    eventThrottling: true
  },
  security: {
    productionMode: false,
    dataSanitization: true,
    localOnly: true
  },
  integration: {
    devTools: true,
    performanceAPI: true,
    memoryMonitoring: true
  }
};
```

---

## 10. 故障排除

### 常见问题
1. **F10键无响应**：检查键盘事件监听器是否正常
2. **调试信息不显示**：确认调试模式已启用
3. **日志导出失败**：检查浏览器下载权限
4. **性能影响过大**：调整调试功能的启用范围
5. **中心+不对齐**：
   - 红色+和黑色+分离 = 形状未正确居中
   - 只看到黑色+ = 形状完美居中（正确状态）
   - 检查SimpleAdapter.ts的缩放逻辑

### 调试方法
- 检查useDebugToggle Hook状态
- 验证调试渲染条件
- 监控日志收集性能
- 测试导出功能完整性

---

## 11. 中心对齐调试使用指南

### 🎯 中心+调试功能使用方法

#### 1. **启用调试模式**
- 按 **F10键** 启用调试模式
- 画布上会显示红色虚线边框和中心+标记

#### 2. **观察中心对齐**
- **红色+**：画布几何中心点（固定位置）
- **黑色+**：目标形状实际中心点（应该与红色+重叠）

#### 3. **判断适配效果**
- ✅ **完美居中**：只看到黑色+（两个+完全重叠）
- ❌ **偏移错误**：看到红色+和黑色+分离

#### 4. **测试适配功能**
1. 生成任意形状
2. 观察初始状态的中心对齐
3. 调整窗口大小（放大/缩小）
4. 观察形状是否始终保持居中

#### 5. **问题诊断**
- **放大时右下偏移**：缩放原点错误
- **缩小时左上偏移**：缩放原点错误  
- **形状大小不对**：缩放因子计算错误
- **形状位置飘移**：适配基准计算错误

### 🔧 调试数据分析

#### 中心点坐标对比
```typescript
// 理想状态（完美居中）
canvasCenter = { x: canvasWidth/2, y: canvasHeight/2 }
shapeCenter = { x: canvasWidth/2, y: canvasHeight/2 }
centerError = { x: 0, y: 0 }

// 问题状态（偏移错误）
canvasCenter = { x: 400, y: 400 }
shapeCenter = { x: 350, y: 420 }  // 偏移了
centerError = { x: 50, y: 20 }    // 需要修复
```

---

## 12. 扩展建议

### 功能扩展
- **更多事件记录**：drag、drop、rotate、reset等交互事件
- **设备信息完善**：isTablet、isDesktop字段的实现
- **性能指标集成**：FPS、内存使用、渲染时间等
- **自动化分析**：日志数据的自动分析和报告生成

### 工具集成
- **远程调试**：支持远程日志收集和分析
- **可视化增强**：更丰富的调试可视化工具
- **测试集成**：与自动化测试系统的集成
- **监控告警**：异常情况的自动检测和告警

---

> 📖 **相关文档**
> - [核心架构配置](./01-core-architecture.md)
> - [性能测试与报告配置](./16-performance-test.md)
> - [触摸事件与交互配置](./18-touch-interaction.md)