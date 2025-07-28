# 配置变更影响矩阵

> 修订日期：2025-01-28 (v1.3.37 新增)

本文档提供配置变更的影响分析矩阵，帮助开发者理解修改某个配置可能产生的连锁影响，避免意外的副作用。

---

## 🎯 配置影响矩阵

### 核心架构配置影响
| 配置项 | 直接影响 | 间接影响 | 风险等级 | 测试建议 |
|-------|---------|---------|---------|---------|
| `DeviceManager.singleton` | 设备检测一致性 | 所有适配逻辑 | 🔴 高 | 全平台测试 |
| `CanvasManager.canvasSize` | 画布尺寸 | 拼图块适配、布局 | 🟡 中 | 多设备测试 |
| `AdaptationEngine.unified` | 适配系统 | 所有UI组件 | 🔴 高 | 回归测试 |

### 移动端适配配置影响
| 配置项 | 直接影响 | 间接影响 | 风险等级 | 测试建议 |
|-------|---------|---------|---------|---------|
| `MOBILE_ADAPTATION.PORTRAIT` | 竖屏布局 | 画布尺寸、面板高度 | 🟡 中 | 竖屏设备测试 |
| `MOBILE_ADAPTATION.LANDSCAPE` | 横屏布局 | 面板宽度、画布位置 | 🟡 中 | 横屏设备测试 |
| `landscapePanelWidthStrategy` | 面板宽度 | 内容显示完整性 | 🟢 低 | 横屏布局测试 |

### 游戏核心配置影响
| 配置项 | 直接影响 | 间接影响 | 风险等级 | 测试建议 |
|-------|---------|---------|---------|---------|
| `DIFFICULTY_CONFIGS` | 拼图难度 | 用户体验、性能 | 🟡 中 | 难度梯度测试 |
| `SHAPE_GENERATION` | 形状生成 | 切割算法、渲染 | 🟡 中 | 形状多样性测试 |
| `COLLISION_DETECTION` | 碰撞检测 | 游戏交互、性能 | 🟢 低 | 交互测试 |

---

## 🔄 配置变更工作流

### 1. 变更前评估
```bash
# 1. 确认影响范围
grep -r "配置项名称" src/ components/ utils/

# 2. 代码检查
npm run lint

# 3. 运行相关测试
npm run test:e2e  # 全流程测试包含配置验证
```

### 2. 变更实施
```bash
# 1. 创建功能分支
git checkout -b config/update-配置项名称

# 2. 修改配置
# 编辑相关配置文件

# 3. 更新文档
# 同步更新对应的配置文档
```

### 3. 变更验证
```bash
# 1. 代码检查
npm run lint

# 2. 单元测试
npm run test:unit

# 3. E2E测试（全流程验证）
npm run test:e2e

# 4. 构建验证
npm run build
```

---

## ⚠️ 高风险配置变更清单

### 需要全面测试的配置
- `DeviceManager` 相关配置
- `AdaptationEngine` 统一适配配置
- `CanvasManager` 画布管理配置
- 核心游戏逻辑配置

### 变更前必须备份的配置
- `constants/canvasAdaptation.ts`
- `core/DeviceManager.ts`
- `contexts/GameContext.tsx`
- `utils/adaptation/UnifiedAdaptationEngine.ts`

### 回滚预案
```bash
# 快速回滚到上一个稳定版本
git revert HEAD

# 或回滚到特定提交
git reset --hard <commit-hash>

# 重新部署
npm run build && npm run start
```

---

## 📊 配置变更追踪

### 版本变更记录
| 版本 | 主要配置变更 | 影响范围 | 测试状态 |
|------|-------------|---------|---------|
| v1.3.37 | 新增配置影响矩阵 | 文档体系 | ✅ 完成 |
| v1.3.36 | 桌面端画布居中配置 | 桌面端布局 | ✅ 完成 |
| v1.3.35 | 统一适配系统配置 | 全平台适配 | ✅ 完成 |
| v1.3.34 | 移动端适配配置优化 | 移动端体验 | ✅ 完成 |
| v1.3.33 | 统一架构管理器 | 整体架构 | ✅ 完成 |

---

> 💡 **最佳实践**: 修改任何配置前，先查阅本影响矩阵，了解可能的连锁影响，制定完整的测试计划。
>
> 🚨 **重要提醒**: 高风险配置变更必须在测试环境充分验证后才能应用到生产环境。