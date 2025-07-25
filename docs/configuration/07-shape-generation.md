# 形状生成配置

> 修订日期：2025-01-24 (v1.3.36)

本文档详细说明形状生成系统的配置参数，包括基础形状类型、几何参数、设备适配、性能优化等核心配置。

---

## 1. 基础形状类型配置

### shapeType
- **作用**：决定基础形状类型
- **取值范围**：'polygon' | 'curve' | 'irregular'
- **默认值**：'polygon'
- **影响点**：形状生成、拼图块形状、游戏难度
- **配置/代码位置**：`contexts/GameContext.tsx`（状态管理）、`components/ShapeControls.tsx`（UI控制）、`utils/shape/ShapeGenerator.ts`（算法实现）

### shapeTypeMapping
- **作用**：形状类型到生成算法的映射
- **映射关系**：
  - 'polygon': generatePolygon()
  - 'curve': generateCurve()
  - 'irregular': generateIrregularCircle()
- **默认值**：完整映射支持
- **影响点**：形状生成算法选择
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（算法分发）

### shapeComplexityLevels
- **作用**：形状复杂度等级配置
- **等级划分**：
  - 简单：3-5边形，基础曲线
  - 中等：6-8边形，中等曲线
  - 复杂：9-12边形，复杂曲线
- **默认值**：中等复杂度
- **影响点**：游戏难度、性能表现
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（复杂度控制）

---

## 2. 多边形配置

### numPoints
- **作用**：多边形顶点数
- **取值范围**：5~12（随设备/难度动态调整）
- **设备适配**：
  - 桌面端：8（默认）
  - 移动端：6（默认）
- **难度调整**：根据用户选择的难度动态调整
- **默认值**：8（桌面），6（移动端）
- **影响点**：多边形复杂度、切割难度、性能
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（generatePolygon函数）

### polygonRegularity
- **作用**：多边形规则性控制
- **取值范围**：0.0~1.0（0=完全不规则，1=完全规则）
- **默认值**：0.7（略微不规则）
- **影响点**：多边形的视觉效果和切割复杂度
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（顶点位置计算）

### polygonRadiusVariation
- **作用**：多边形半径变化幅度
- **取值范围**：0.0~0.3
- **默认值**：0.1（轻微变化）
- **影响点**：多边形边缘的不规则程度
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（半径计算）

### polygonAngleOffset
- **作用**：多边形角度偏移配置
- **取值范围**：0~360度
- **默认值**：随机偏移
- **影响点**：多边形的旋转角度
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（角度计算）

---

## 3. 曲线形状配置

### detail
- **作用**：曲线/不规则圆形的细节点数
- **取值范围**：60~200
- **设备适配**：
  - 桌面端：200（高精度）
  - 移动端：120（平衡性能）
- **默认值**：200（桌面），120（移动端）
- **影响点**：曲线平滑度、渲染性能、内存使用
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（generateCurve函数）

### curveComplexity
- **作用**：曲线复杂度配置
- **复杂度参数**：
  - 波浪数量：2~8
  - 波浪幅度：0.1~0.4
  - 频率变化：0.5~2.0
- **默认值**：中等复杂度（4波浪，0.2幅度）
- **影响点**：曲线的视觉复杂度和切割难度
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（曲线参数计算）

### curveSmoothness
- **作用**：曲线平滑度控制
- **平滑算法**：贝塞尔曲线插值
- **平滑级别**：1~5级
- **默认值**：3级（中等平滑）
- **影响点**：曲线的视觉质量
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（平滑处理）

---

## 4. 不规则圆形配置

### amplitude
- **作用**：不规则圆形的扰动幅度
- **取值范围**：0~0.2
- **设备适配**：
  - 桌面端：0.08（中等扰动）
  - 移动端：0.04（轻微扰动）
- **默认值**：0.08（桌面），0.04（移动端）
- **影响点**：形状不规则程度、切割复杂度
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（generateIrregularCircle函数）

### irregularityFrequency
- **作用**：不规则性频率控制
- **取值范围**：1~10（频率倍数）
- **默认值**：3（中等频率）
- **影响点**：不规则变化的密集程度
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（频率计算）

### noiseFunction
- **作用**：噪声函数配置
- **噪声类型**：Perlin噪声、简单正弦波
- **默认值**：简单正弦波（性能优化）
- **影响点**：不规则性的自然程度
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（噪声生成）

---

## 5. 形状标准化配置

### STANDARD_SIZE
- **作用**：所有形状归一化的基准尺寸
- **取值范围**：1000（常量）
- **默认值**：1000
- **影响点**：归一化、缩放、适配的基准
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`、`utils/constants.ts`

### normalizationStrategy
- **作用**：形状标准化策略
- **标准化方法**：
  - 边界框标准化
  - 中心点对齐
  - 尺寸统一
- **默认值**：边界框标准化
- **影响点**：不同形状的尺寸一致性
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（标准化函数）

### aspectRatioPreservation
- **作用**：宽高比保持配置
- **保持策略**：在标准化过程中保持原始宽高比
- **默认值**：启用宽高比保持
- **影响点**：形状的视觉比例
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（比例计算）

---

## 6. 设备适配配置

### deviceSpecificOptimization
- **作用**：设备特定的形状生成优化
- **优化策略**：
  - 移动端：减少顶点数，降低复杂度
  - 桌面端：提高精度，增加细节
  - 高DPI屏：优化渲染质量
- **默认值**：启用设备优化
- **影响点**：不同设备的性能和视觉效果平衡
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（设备检测逻辑）

### mobileOptimization
- **作用**：移动端形状生成优化配置
- **优化参数**：
  - 最大顶点数：8（vs 桌面端12）
  - 细节点数：120（vs 桌面端200）
  - 扰动幅度：0.04（vs 桌面端0.08）
- **默认值**：自动根据设备类型调整
- **影响点**：移动端性能和电池续航
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（移动端参数）

### performanceThresholds
- **作用**：性能阈值配置
- **阈值设置**：
  - 形状生成时间：< 100ms
  - 内存使用：< 10MB
  - 渲染帧率：> 30fps
- **默认值**：启用性能监控
- **影响点**：形状生成的性能标准
- **配置/代码位置**：性能监控逻辑

---

## 7. 形状适配系统配置

### shapeAdaptationEngine
- **作用**：形状适配引擎配置（Step2新增）
- **适配功能**：
  - 基于拓扑记忆的智能适配
  - 30%直径规则应用
  - 精确居中对齐
- **默认值**：启用智能适配
- **影响点**：形状在不同画布尺寸下的显示效果
- **配置/代码位置**：`utils/shape/shapeAdaptationUtils.ts`

### topologyMemorySystem
- **作用**：拓扑记忆系统配置
- **记忆内容**：
  - 形状结构特征
  - 关键点位置
  - 几何属性
- **默认值**：启用拓扑记忆
- **影响点**：形状适配的准确性和性能
- **配置/代码位置**：`utils/memory/TopologyExtractor.ts`

### adaptationRules
- **作用**：形状适配规则配置
- **核心规则**：
  - 30%直径规则：形状直径占画布30%
  - 精确居中：形状中心与画布中心对齐
  - 宽高比保持：保持原始形状比例
- **默认值**：启用所有核心规则
- **影响点**：形状适配的质量和一致性
- **配置/代码位置**：`utils/memory/AdaptationRules.ts`

---

## 8. 性能优化配置

### shapeGenerationPerformance
- **作用**：形状生成性能优化配置
- **优化策略**：
  - 算法复杂度控制
  - 内存使用优化
  - 计算结果缓存
- **性能目标**：
  - 简单形状：< 50ms
  - 复杂形状：< 200ms
  - 内存使用：< 5MB
- **默认值**：启用所有优化
- **影响点**：形状生成的响应速度
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（性能优化逻辑）

### geometryCalculationOptimization
- **作用**：几何计算优化配置
- **优化方法**：
  - 预计算常用值
  - 避免重复计算
  - 使用高效算法
- **默认值**：启用计算优化
- **影响点**：形状生成的计算效率
- **配置/代码位置**：`utils/shape/geometryUtils.ts`

### memoryManagement
- **作用**：形状生成内存管理配置
- **管理策略**：
  - 及时释放临时对象
  - 重用几何计算结果
  - 避免内存泄漏
- **默认值**：启用内存管理
- **影响点**：长期使用的内存稳定性
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（内存管理）

---

## 9. 质量控制配置

### shapeValidation
- **作用**：形状有效性验证配置
- **验证规则**：
  - 最小顶点数检查
  - 自相交检测
  - 面积阈值验证
  - 边界完整性检查
- **默认值**：启用所有验证
- **影响点**：生成形状的质量保证
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（验证函数）

### qualityMetrics
- **作用**：形状质量指标配置
- **质量指标**：
  - 形状复杂度评分
  - 切割适宜性评分
  - 视觉美观度评分
- **默认值**：启用质量评估
- **影响点**：形状生成的质量标准
- **配置/代码位置**：质量评估逻辑

### errorHandling
- **作用**：形状生成错误处理配置
- **错误类型**：
  - 算法计算错误
  - 参数验证错误
  - 内存不足错误
- **处理策略**：
  - 详细错误日志
  - 优雅降级处理
  - 重试机制
- **默认值**：启用完整错误处理
- **影响点**：系统稳定性和健壮性
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（错误处理）

---

## 10. 调试配置

### shapeDebugMode
- **作用**：形状生成调试模式配置
- **调试功能**：
  - 显示形状生成过程
  - 输出几何计算详情
  - 验证形状属性
- **默认值**：开发环境启用，生产环境禁用
- **影响点**：开发调试效率
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（调试日志）

### shapeVisualization
- **作用**：形状可视化配置
- **可视化内容**：
  - 顶点标记
  - 边界框显示
  - 中心点标记
  - 几何属性显示
- **默认值**：调试模式下启用
- **影响点**：形状分析和优化
- **配置/代码位置**：`utils/shape/ShapeGenerator.ts`（可视化函数）

---

## 11. 配置示例

### 基础形状配置示例
```typescript
// 形状生成配置
const shapeConfig = {
  type: 'polygon',
  polygon: {
    numPoints: 8,
    regularity: 0.7,
    radiusVariation: 0.1,
    angleOffset: 'random'
  },
  curve: {
    detail: 200,
    complexity: 'medium',
    smoothness: 3
  },
  irregular: {
    amplitude: 0.08,
    frequency: 3,
    noiseType: 'sine'
  }
};
```

### 设备适配配置示例
```typescript
// 设备特定配置
const deviceShapeConfig = {
  mobile: {
    polygon: { numPoints: 6 },
    curve: { detail: 120 },
    irregular: { amplitude: 0.04 }
  },
  desktop: {
    polygon: { numPoints: 8 },
    curve: { detail: 200 },
    irregular: { amplitude: 0.08 }
  }
};
```

### 性能优化配置示例
```typescript
// 性能优化配置
const performanceConfig = {
  generation: {
    maxTime: 200,
    maxMemory: 5,
    caching: true
  },
  validation: {
    enabled: true,
    strictMode: false
  },
  debugging: {
    enabled: process.env.NODE_ENV === 'development',
    visualization: true
  }
};
```

---

## 12. 故障排除

### 常见问题
1. **形状生成失败**：检查参数范围和验证规则
2. **性能问题**：调整复杂度参数和优化配置
3. **移动端卡顿**：确认移动端优化配置已启用
4. **形状不规则**：检查标准化和质量控制配置

### 调试方法
- 启用形状调试模式
- 检查形状生成参数
- 验证设备适配配置
- 监控性能指标

---

> 📖 **相关文档**
> - [难度与切割配置](./06-difficulty-cutting.md)
> - [拼图散开与分布配置](./08-puzzle-scatter.md)
> - [拼图块适配系统配置](./12-puzzle-piece-adaptation.md)