# 核心架构配置

> 修订日期：2025-01-24 (v1.3.36)

本文档说明项目的核心架构配置，包括主要配置文件分工、文档体系和架构演进历程。

---

## 1. 主要配置文件与分工

### 核心业务逻辑
- `utils/puzzle/cutGenerators.ts`：切割算法与难度映射
- `utils/puzzle/PuzzleGenerator.ts`：拼图块生成主逻辑
- `utils/puzzle/ScatterPuzzle.ts`：拼图块散布与分布算法
- `utils/shape/ShapeGenerator.ts`：基础形状生成与参数
- `utils/puzzlePieceAdaptationUtils.ts`：拼图块适配工具函数（Step3新增）

### 统一架构管理器（v1.3.33新增）
- `utils/core/DeviceManager.ts`：统一设备检测管理器，单例模式
- `utils/core/CanvasManager.ts`：统一画布管理器，单例模式
- `utils/core/EventManager.ts`：统一事件管理器，单例模式
- `utils/core/AdaptationEngine.ts`：统一适配引擎管理器

### 状态与组件
- `contexts/GameContext.tsx`：全局游戏状态、边界检测、回弹、适配
- `components/PuzzleCanvas.tsx`：主画布渲染与交互
- `components/GameInterface.tsx`、`components/layouts/`：多端布局与适配

### 统一架构Hooks（v1.3.33新增）
- `hooks/useDevice.ts`：统一设备检测Hook
- `hooks/useCanvas.ts`：统一画布管理Hook
- `hooks/useEventManager.ts`：统一事件管理Hook

### 传统Hooks（保持兼容）
- `hooks/useShapeAdaptation.ts`：形状与拼图块同步适配（Step2-3）
- `hooks/usePuzzleAdaptation.ts`：散开拼图适配（Step2，v1.3.36已禁用）
- `hooks/useResponsiveCanvasSizing.ts`：响应式尺寸管理
- `hooks/useDeviceDetection.ts`：传统设备检测（逐步迁移中）

### 其他配置
- `utils/rendering/soundEffects.ts`：音效管理
- `public/`：静态资源（图片、音效）
- `tailwind.config.ts`、`components.json`：UI 主题与组件
- `next.config.mjs`：构建配置

---

## 2. 文档体系结构

### 核心文档
- `docs/project_structure.md`：项目结构说明（本文档的上级）
- `docs/configuration/`：配置文档目录（本目录）
- `docs/difficulty-design.md`：游戏难度系统设计说明

### 专项文档目录
- `docs/puzzle_memory_adaptation_optimization/`：拼图记忆适配优化文档
  - `step1_canvas_adaptation_plan.md`：画布适配系统（Step1）
  - `step2_shape_adaptation_plan.md`：智能形状适配系统（Step2）
  - `step3/`：拼图块适配系统文档集（Step3）
- `docs/rebuild/`：统一架构重构文档（v1.3.33新增）
- `docs/TDC/`：技术债务和问题分析目录

---

## 3. 架构演进历程

### v1.3.33 - 统一架构重构
- 实现DeviceManager、CanvasManager、EventManager、AdaptationEngine四大核心管理器
- 事件监听器从约20个减少到3个，代码重复度降低70%
- 详见：[统一架构管理器配置](./02-unified-managers.md)

### v1.3.34 - 移动端适配完善
- 优化移动端设备检测，优先使用用户代理检测
- 智能面板宽度计算，支持iPhone 16系列精确适配
- 详见：[移动端适配配置](./03-mobile-adaptation.md)

### v1.3.35 - 统一适配系统架构完善
- 统一变换矩阵，所有拼图元素使用相同的缩放和偏移计算
- 移除重复适配系统，确保拼图元素100%一致性
- 详见：[统一适配系统配置](./04-unified-adaptation.md)

### v1.3.36 - 桌面端画布居中修复
- 创新手动适配机制，摆脱复杂Hook循环依赖
- 彻底解决无限循环和累积缩放错误问题
- 详见：[桌面端画布居中配置](./05-desktop-centering.md)

---

## 4. 配置查找指南

### 按功能分类
- **适配系统**: 02, 03, 04, 05, 11, 12
- **游戏逻辑**: 06, 07, 08, 09, 10
- **用户体验**: 13, 14, 18, 19
- **开发工具**: 15, 16, 17

### 按重要性分类
- **🔥 核心必读**: 01, 02, 05
- **📱 移动端**: 03, 11, 18
- **🎮 游戏体验**: 06, 07, 13
- **🔧 开发调试**: 16, 19

### 按版本分类
- **v1.3.36新增**: 05
- **v1.3.35新增**: 04
- **v1.3.34新增**: 03
- **v1.3.33新增**: 02

---

## 5. 维护规范

### 配置变更流程
1. 修改代码中的配置
2. 更新对应的配置文档
3. 更新本文档的修订日期
4. 如有新增配置，更新README.md索引

### 文档编写规范
- 每个配置项必须包含：作用、取值范围、默认值、影响点、配置位置
- 代码位置必须精确到文件路径和函数名
- 相关配置之间要有明确的交叉引用
- 版本变更要有明确的标记和说明

---

> 📖 **相关文档**
> - [统一架构管理器配置](./02-unified-managers.md)
> - [桌面端画布居中配置](./05-desktop-centering.md)
> - [项目结构说明](../project_structure.md)