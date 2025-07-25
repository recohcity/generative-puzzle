# 性能测试与报告配置

> 修订日期：2025-01-24 (v1.3.36)

本文档详细说明性能测试和报告系统的配置参数，包括基准值、环境识别、测试指标、报告生成等核心配置。

---

## 1. 性能基准值配置

### BENCHMARKS
- **作用**：性能基准值，用于评估各项指标，分为"资源加载(page.goto)"与"端到端加载(E2E)"两项
- **基准值配置**：
  - `resourceLoadTime`: 1000ms（页面资源加载基准）
  - `e2eLoadTime`: 1800ms（端到端加载基准）
  - `shapeGenerationTime`: 500ms（形状生成基准）
  - `puzzleGenerationTime`: 800ms（拼图生成基准）
  - `scatterTime`: 800ms（拼图散开基准）
  - `pieceInteractionTime`: 1200ms（拼图交互基准）
  - `minFps`: 30fps（最小帧率基准）
  - `maxMemoryUsage`: 100MB（最大内存使用基准）
- **默认值**：如上所示
- **影响点**：性能趋势仪表盘评级、分组统计、对比、差异高亮、趋势分析
- **配置/代码位置**：`app/test/page.tsx`（BENCHMARKS常量）

### performanceGrading
- **作用**：性能等级评定配置
- **评级标准**：
  - 优秀：≤基准值的80%
  - 良好：基准值的80%~100%
  - 一般：基准值的100%~120%
  - 较差：>基准值的120%
- **颜色编码**：
  - 优秀：绿色
  - 良好：蓝色
  - 一般：黄色
  - 较差：红色
- **默认值**：启用分级评定
- **影响点**：性能报告的可视化效果
- **配置/代码位置**：`app/test/page.tsx`（评级逻辑）

---

## 2. 环境识别配置

### environmentDetection
- **作用**：自动识别开发/生产环境，支持分组统计、对比、差异高亮、趋势分析
- **检测方式**：
  - 开发环境：localhost、127.0.0.1、dev域名
  - 生产环境：正式域名、部署环境
- **取值范围**：'development' | 'production'
- **默认值**：自动检测
- **影响点**：测试报告、API、前端可视化、分组统计、趋势分析
- **配置/代码位置**：`e2e/full_game_flow.spec.ts`、`app/test/page.tsx`、`scripts/archive-test-results.js`、`app/api/performance-trend/route.ts`

### environmentComparison
- **作用**：环境对比分析配置
- **对比维度**：
  - 性能指标差异
  - 稳定性对比
  - 资源使用对比
- **差异高亮**：自动标记显著差异
- **默认值**：启用环境对比
- **影响点**：环境差异分析、优化决策
- **配置/代码位置**：`app/test/page.tsx`（对比逻辑）

---

## 3. 测试指标配置

### coreMetrics
- **作用**：核心性能指标配置
- **指标列表**：
  - 页面加载时间（Page Load Time）
  - 端到端响应时间（E2E Response Time）
  - 形状生成时间（Shape Generation Time）
  - 拼图生成时间（Puzzle Generation Time）
  - 拼图散开时间（Scatter Time）
  - 交互响应时间（Interaction Time）
- **数据精度**：保留两位小数
- **默认值**：启用所有核心指标
- **影响点**：性能分析的全面性
- **配置/代码位置**：`e2e/full_game_flow.spec.ts`（指标采集）

### systemMetrics
- **作用**：系统性能指标配置
- **指标列表**：
  - 帧率（FPS）
  - 内存使用（Memory Usage）
  - CPU使用率（CPU Usage）
  - 网络延迟（Network Latency）
- **采集频率**：实时监控
- **默认值**：启用系统监控
- **影响点**：系统性能优化
- **配置/代码位置**：`e2e/full_game_flow.spec.ts`（系统监控）

### customMetrics
- **作用**：自定义性能指标配置
- **扩展指标**：
  - 适配执行时间
  - 拼图块渲染时间
  - 事件处理延迟
- **配置方式**：可动态添加新指标
- **默认值**：支持自定义扩展
- **影响点**：特定功能的性能分析
- **配置/代码位置**：`e2e/full_game_flow.spec.ts`（自定义指标）

---

## 4. 测试执行配置

### testConfiguration
- **作用**：Playwright测试执行配置
- **配置文件**：`playwright.config.ts`、`playwright.full.config.ts`
- **主要配置**：
  - 浏览器：Chrome、Firefox、Safari
  - 超时设置：30s（默认）
  - 重试次数：2次
  - 并发数：根据CPU核心数
- **默认值**：多浏览器并行测试
- **影响点**：测试覆盖率、执行效率
- **配置/代码位置**：`playwright.config.ts`

### testEnvironmentSetup
- **作用**：测试环境设置配置
- **环境变量**：
  - NODE_ENV：测试环境标识
  - TEST_TIMEOUT：测试超时时间
  - HEADLESS：无头模式开关
- **默认值**：自动化测试环境
- **影响点**：测试执行稳定性
- **配置/代码位置**：`e2e/full_game_flow.spec.ts`（环境设置）

---

## 5. 报告生成配置

### reportGeneration
- **作用**：测试报告生成配置
- **报告格式**：
  - HTML报告：可视化展示
  - JSON报告：数据分析
  - Markdown报告：文档化
- **生成时机**：测试完成后自动生成
- **默认值**：生成多格式报告
- **影响点**：报告的可用性和分析便利性
- **配置/代码位置**：`scripts/archive-test-results.js`

### reportArchiving
- **作用**：报告归档配置
- **归档目录**：`playwright-test-logs/`
- **文件命名**：包含时间戳和环境标识
- **保留策略**：保留最近30天的报告
- **默认值**：自动归档
- **影响点**：历史数据追踪
- **配置/代码位置**：`scripts/archive-test-results.js`（归档逻辑）

### reportVisualization
- **作用**：报告可视化配置
- **可视化组件**：
  - 性能趋势图表
  - 环境对比图表
  - 指标分布图表
- **图表库**：Chart.js或类似库
- **默认值**：启用可视化
- **影响点**：数据分析的直观性
- **配置/代码位置**：`app/test/page.tsx`（可视化组件）

---

## 6. API配置

### performanceTrendAPI
- **作用**：性能趋势API配置
- **API路径**：`/api/performance-trend`
- **数据源**：归档的测试报告
- **响应格式**：JSON格式的聚合数据
- **缓存策略**：5分钟缓存
- **默认值**：启用API服务
- **影响点**：前端数据获取
- **配置/代码位置**：`app/api/performance-trend/route.ts`

### dataAggregation
- **作用**：数据聚合配置
- **聚合维度**：
  - 按环境分组
  - 按时间段统计
  - 按指标类型分类
- **聚合算法**：平均值、最大值、最小值、趋势分析
- **默认值**：启用多维度聚合
- **影响点**：数据分析的深度
- **配置/代码位置**：`app/api/performance-trend/route.ts`（聚合逻辑）

---

## 7. 仪表盘配置

### dashboardLayout
- **作用**：性能趋势仪表盘布局配置
- **页面路径**：`/test`
- **布局组件**：
  - 环境切换器
  - 指标卡片
  - 趋势图表
  - 对比分析
- **响应式设计**：支持桌面端和移动端
- **默认值**：响应式布局
- **影响点**：用户体验
- **配置/代码位置**：`app/test/page.tsx`（布局组件）

### dashboardFeatures
- **作用**：仪表盘功能特性配置
- **功能列表**：
  - 实时数据刷新
  - 历史数据查询
  - 环境对比分析
  - 趋势预测
  - 异常告警
- **默认值**：启用所有功能
- **影响点**：分析功能的完整性
- **配置/代码位置**：`app/test/page.tsx`（功能实现）

### dashboardStyling
- **作用**：仪表盘样式配置
- **主题配置**：
  - 颜色方案：与主应用一致
  - 字体设置：系统字体栈
  - 间距规范：Tailwind CSS规范
- **暗色模式**：支持主题切换
- **默认值**：跟随系统主题
- **影响点**：视觉一致性
- **配置/代码位置**：`app/test/page.tsx`（样式配置）

---

## 8. 数据存储配置

### dataStorage
- **作用**：性能数据存储配置
- **存储方式**：文件系统存储
- **数据格式**：JSON格式
- **存储路径**：`playwright-test-logs/`
- **数据结构**：标准化的性能数据格式
- **默认值**：本地文件存储
- **影响点**：数据持久化
- **配置/代码位置**：`scripts/archive-test-results.js`（存储逻辑）

### dataRetention
- **作用**：数据保留策略配置
- **保留期限**：30天（可配置）
- **清理策略**：自动清理过期数据
- **备份机制**：重要数据备份
- **默认值**：30天保留期
- **影响点**：存储空间管理
- **配置/代码位置**：数据清理脚本

### dataCompression
- **作用**：数据压缩配置
- **压缩算法**：gzip压缩
- **压缩时机**：归档时自动压缩
- **压缩比例**：约70%空间节省
- **默认值**：启用压缩
- **影响点**：存储效率
- **配置/代码位置**：`scripts/archive-test-results.js`（压缩逻辑）

---

## 9. 监控告警配置

### performanceMonitoring
- **作用**：性能监控配置
- **监控指标**：所有核心性能指标
- **监控频率**：每次测试执行
- **阈值设置**：基于基准值的动态阈值
- **默认值**：启用全面监控
- **影响点**：性能问题及时发现
- **配置/代码位置**：监控逻辑

### alertConfiguration
- **作用**：告警配置
- **告警条件**：
  - 性能指标超过阈值
  - 连续多次测试失败
  - 环境差异过大
- **告警方式**：
  - 控制台输出
  - 日志记录
  - 邮件通知（可扩展）
- **默认值**：基础告警
- **影响点**：问题响应速度
- **配置/代码位置**：告警逻辑

---

## 10. 配置示例

### 基础性能测试配置示例
```typescript
// 性能基准配置
const performanceConfig = {
  benchmarks: {
    resourceLoadTime: 1000,
    e2eLoadTime: 1800,
    shapeGenerationTime: 500,
    puzzleGenerationTime: 800
  },
  grading: {
    excellent: 0.8,
    good: 1.0,
    average: 1.2
  }
};
```

### 高级报告配置示例
```typescript
// 报告生成配置
const reportConfig = {
  formats: ['html', 'json', 'markdown'],
  archiving: {
    directory: 'playwright-test-logs',
    retention: 30,
    compression: true
  },
  visualization: {
    charts: true,
    trends: true,
    comparison: true
  }
};
```

---

## 11. 故障排除

### 常见问题
1. **测试执行失败**：检查Playwright配置和环境设置
2. **报告生成错误**：验证归档脚本和文件权限
3. **API数据异常**：检查数据聚合逻辑和文件读取
4. **仪表盘显示问题**：确认前端组件和API连接

### 调试方法
- 检查测试执行日志
- 验证报告文件完整性
- 监控API响应状态
- 测试仪表盘功能

---

> 📖 **相关文档**
> - [F10 Debug 调试模式配置](./19-debug-mode.md)
> - [构建与开发配置](./15-build-dev.md)
> - [自动化测试工作流](../automated_testing_workflow.cn.md)