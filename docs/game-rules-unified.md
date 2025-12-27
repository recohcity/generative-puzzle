# 生成式拼图游戏 - 统一规则文档

## 📋 文档状态

**版本**: v3.4 (基于实际测试优化的速度奖励版)  
**最后更新**: 2025/12/28  
**状态**: ✅ 与代码实现完全一致  
**基准代码**: `utils/score/ScoreCalculator.ts` + `utils/puzzle/cutGeneratorConfig.ts` + `utils/puzzle/graph/NetworkCutter.ts`

> **权威性声明**：本文档为游戏唯一权威规则说明，与代码实现完全一致。所有游戏逻辑、分数计算、难度设计均以此文档和对应代码为准。
>
> **文档合并说明**：本文档已合并了原 `docs/difficulty-design.md` 和 `docs/score-system.md` 的所有内容，原文档已被删除以避免信息不一致。
>
> **v3.3 更新说明**：引入动态速度奖励系统，基于难度级别和拼图数量计算合理的时间阈值和奖励分数，让每个难度都有机会获得速度加成奖励。
>
> **v3.4 更新说明**：基于实际测试数据（难度1，4片，极限完成时间约22秒）优化速度奖励阈值，调整每片平均时间和阈值倍数，使其更符合实际游戏体验。极速阈值从0.3倍基础时间调整为1.0倍基础时间，确保玩家可以达成速度奖励。

## ⚖️ v3.2 平衡优化摘要

### 修复的问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 曲线切割拼图数量过少 | 放射线使用 `targetCuts`，但放射线不交叉 | 改用 `pieceRange.max` |
| 曲线难度系数过高 | 原系数1.5基于错误假设 | 降低到1.25 |
| 斜线难度系数偏高 | 三角形形状独特，识别较易 | 从1.2降到1.15 |
| 锯齿形状系数过高 | 独特形状反而更易识别 | 从1.2降到1.05 |

### 平衡后的对比

| 配置 | v3.1系数 | v3.2系数 | 变化 |
|------|---------|---------|------|
| 曲线切割 | 1.5 | 1.25 | -17% |
| 斜线切割 | 1.2 | 1.15 | -4% |
| 锯齿形状 | 1.2 | 1.05 | -12.5% |

### 拼图数量验证（难度8）

| 切割类型 | v3.1数量 | v3.2数量 | 状态 |
|---------|---------|---------|------|
| 直线 | ~31块 | ~31块 | ✅ 不变 |
| 斜线 | ~31块 | ~31块 | ✅ 不变 |
| 曲线 | ~16块 | ~30块 | ✅ 修复 |

## 🎯 设计原则

### 核心理念
- **基于最优解**：旋转评分基于数学最优解，鼓励策略思考
- **难度平衡**：统一提示次数，公平合理
- **竞争激励**：时间奖励基于完成速度，动态竞争
- **教育意义**：显示最优解和效率，帮助玩家提升

### 架构完整性
- **零破坏性扩展**：完全基于现有系统扩展，不修改核心逻辑
- **性能标准维护**：保持60fps渲染，统计功能异步处理
- **适配系统保护**：不触及核心适配逻辑

## 🎮 难度系统设计

### 形状选择系统

游戏提供三种不同难度的形状供玩家选择：

| 形状类型 | 图标 | 难度系数 | 特点描述 |
|---------|------|---------|----------|
| 多边形 (Polygon) | ⬢️ | 1.0 | 标准难度，边缘规则，适合新手 |
| 云朵形 (Cloud) | ☁️ | 1.1 | 曲线边缘增加匹配难度，初级挑战 |
| 锯齿形 (Jagged) | ⚡ | 1.05 | 边缘不规则但形状独特更易识别 |

> **设计理念（v3.2 平衡优化）**：
> - **云朵形**：柔和曲线让拼图块边缘相似，匹配时需要更仔细判断，增加10%难度
> - **锯齿形**：虽然边缘不规则，但独特的尖刺形状反而让每块拼图更容易识别，仅增加5%难度
> - 难度系数影响最终得分，鼓励玩家挑战不同形状

### 难度级别与拼图数量映射

> **重要说明**：玩家选择难度1-8，系统根据难度级别生成对应数量的切割线，最终拼图数量在设定范围内波动。

| 难度级别 | targetCuts | pieceRange | 难度分类 | 基础分数 | 难度系数 |
|---------|------------|------------|---------|---------|---------|
| 1       | 2条        | 3-4片      | 入门     | 500     | 1.0     |
| 2       | 3条        | 4-6片      | 简单     | 800     | 1.2     |
| 3       | 4条        | 5-8片      | 初级     | 1200    | 1.5     |
| 4       | 6条        | 7-12片     | 中级     | 1800    | 1.8     |
| 5       | 8条        | 9-16片     | 中高级   | 2500    | 2.2     |
| 6       | 10条       | 11-20片    | 高级     | 3500    | 2.8     |
| 7       | 12条       | 13-24片    | 专家     | 5000    | 3.5     |
| 8       | 15条       | 16-30片    | 大师     | 8000    | 5.0     |

#### 实际拼图数量（v3.2 验证数据）

| 难度 | 直线切割 | 斜线切割 | 曲线切割 |
|-----|---------|---------|---------|
| 8   | ~31块   | ~31块   | ~30块 ✅ |
| 5   | ~16块   | ~16块   | ~16块   |
| 3   | ~8块    | ~8块    | ~8块    |

> **v3.2 修复确认**：曲线切割现在能够产生与直线/斜线相近数量的拼图。

### 难度配置详情

```typescript
// 来自 cutGeneratorConfig.ts 的实际配置
const DIFFICULTY_SETTINGS = {
  1: { targetCuts: 2,  pieceRange: { min: 3, max: 4 },   baseScore: 500,  label: '入门难度' },
  2: { targetCuts: 3,  pieceRange: { min: 4, max: 6 },   baseScore: 800,  label: '简单难度' },
  3: { targetCuts: 4,  pieceRange: { min: 5, max: 8 },   baseScore: 1200, label: '初级难度' },
  4: { targetCuts: 6,  pieceRange: { min: 7, max: 12 },  baseScore: 1800, label: '中级难度' },
  5: { targetCuts: 8,  pieceRange: { min: 9, max: 16 },  baseScore: 2500, label: '中高级难度' },
  6: { targetCuts: 10, pieceRange: { min: 11, max: 20 }, baseScore: 3500, label: '高级难度' },
  7: { targetCuts: 12, pieceRange: { min: 13, max: 24 }, baseScore: 5000, label: '专家难度' },
  8: { targetCuts: 15, pieceRange: { min: 16, max: 30 }, baseScore: 8000, label: '大师难度' }
}
```

#### 切割类型使用配置的方式

```typescript
// 直线/斜线切割（cutGeneratorController.ts）
const cuts = generateCuts(shape, difficulty, cutType);
// 使用 targetCuts 条切割线，互相交叉产生约 2×targetCuts 块拼图

// 曲线切割（NetworkCutter.ts - v3.2修复）
const radialCount = pieceRange.max;  // 使用 pieceRange.max 而非 targetCuts
// 放射状曲线不交叉，n条线产生约n块扇形拼图
```

### 切割类型详解

游戏提供三种切割类型，每种产生不同形状的拼图：

| 切割类型 | 图标 | 难度系数 | 拼图形状 | 切割特点 |
|---------|------|---------|---------|---------|
| 直线 (Straight) | ━ | 1.0 | 方形/矩形 | 水平和垂直切割线互相交叉 |
| 斜线 (Diagonal) | ╲ | 1.15 | 三角形/菱形 | 45度角斜线互相交叉 |
| 曲线 (Curve) | 〰 | 1.25 | 扇形 | 从中心向外发射的放射状曲线 |

#### 切割类型系数

```typescript
// 切割类型难度系数（v3.2 平衡优化版）
const CUT_TYPE_MULTIPLIERS = {
  straight: 1.0,   // 直线切割：标准难度
  diagonal: 1.15,  // 斜线切割：增加15%难度
  curve: 1.25      // 曲线切割：增加25%难度
}
```

#### 切割算法差异（重要）

| 切割类型 | 算法 | 切割线数量 | 拼图数量公式 | 难度8示例 |
|---------|------|-----------|-------------|----------|
| 直线/斜线 | 互相交叉 | `targetCuts` | 约 2n 块 | 15条线 → ~31块 |
| 曲线 | 放射状 | `pieceRange.max` | 约 n 块 | 30条线 → ~30块 |

> **v3.2 平衡说明**：
> - **曲线切割**系数从1.5降低到1.25，因为修复后曲线切割与直线/斜线产生相似数量的拼图
> - **斜线切割**系数从1.2降低到1.15，因为三角形拼图形状独特，实际识别难度不如想象中高
> - 曲线边缘确实增加了对齐难度，保留较高系数但更加合理
>
> **曲线切割技术说明**：
> - 直线/斜线：n条**互相交叉**的切割线 → 产生约2n块拼图
> - 曲线：n条**从中心向外**的放射线 → 产生约n块扇形拼图（不交叉）
> - 因此曲线切割使用 `pieceRange.max`（而非 `targetCuts`）作为放射线数量，确保拼图数量平衡

### 形状难度系数

```typescript
// 形状难度系数（v3.2 平衡优化版）
const SHAPE_MULTIPLIER = {
  polygon: 1.0,   // 多边形：标准难度
  cloud: 1.1,     // 云朵形：增加10%难度（曲线边缘增加匹配难度）
  jagged: 1.05    // 锯齿形：增加5%难度（独特形状反而更容易识别）
}
```

> **v3.2 平衡说明**：锯齿形系数从1.2降低到1.05，因为实际游戏体验中，不规则的尖刺边缘让每块拼图形状更独特，反而更容易被识别和匹配。

### 设备适配系数

```typescript
// 设备难度系数（与useDeviceDetection保持一致）
const DEVICE_MULTIPLIER = {
  desktop: 1.0,     // 桌面端：标准难度
  ipad: 1.0,        // iPad：标准难度  
  mobile: 1.1       // 移动端（横屏+竖屏）：统一1.1倍难度
}
```

### 最终难度系数公式

```typescript
finalMultiplier = baseDifficultyMultiplier × cutTypeMultiplier × deviceMultiplier × shapeMultiplier
```

#### 示例计算（v3.2 验证）

| 配置组合 | 基础 | 切割 | 设备 | 形状 | 最终系数 |
|---------|------|------|------|------|---------|
| 难度8 + 直线 + 桌面 + 多边形 | 5.0 | 1.0 | 1.0 | 1.0 | **5.0** |
| 难度8 + 斜线 + 桌面 + 多边形 | 5.0 | 1.15 | 1.0 | 1.0 | **5.75** |
| 难度8 + 曲线 + 桌面 + 多边形 | 5.0 | 1.25 | 1.0 | 1.0 | **6.25** |
| 难度8 + 曲线 + 桌面 + 云朵 | 5.0 | 1.25 | 1.0 | 1.1 | **6.875** |
| 难度8 + 曲线 + 移动端 + 锯齿 | 5.0 | 1.25 | 1.1 | 1.05 | **7.22** |
| 难度5 + 曲线 + 移动端 + 锯齿 | 2.2 | 1.25 | 1.1 | 1.05 | **3.18** |

> **对比旧版本 v3.1**：
> - 难度5+曲线+移动端+锯齿形：旧系数=4.356，新系数=3.18，**降低约27%**
> - 原因：曲线系数从1.5→1.25，斜线系数从1.2→1.15，锯齿系数从1.2→1.05

## 📊 分数计算系统

### 1. 基础分数系统

基于切割次数（难度级别）的固定基础分数：

```typescript
const BASE_SCORES_BY_DIFFICULTY = {
  1: 500,    // 1次切割
  2: 800,    // 2次切割
  3: 1200,   // 3次切割
  4: 1800,   // 4次切割
  5: 2500,   // 5次切割
  6: 3500,   // 6次切割
  7: 5000,   // 7次切割
  8: 8000    // 8次切割
}
```

### 2. 速度奖励系统（v3.4 基于实际测试优化版）

#### 设计理念

**问题**：原固定阈值（10秒、30秒、60秒等）只适合难度1-2（拼图数量少），当拼图数量达到30片时，玩家通常需要10-15分钟才能完成，无法获得速度奖励。

**解决方案**：基于难度级别和拼图数量动态计算时间阈值和奖励分数，让每个难度都有机会获得速度加成奖励。

#### 动态计算规则（v3.4 基于实际测试优化）

**1. 每片平均时间（随难度递增，基于实际测试数据优化）**
- 难度1-2：5秒/片（优化：从3秒调整为5秒，更符合实际游戏体验）
- 难度3-4：7秒/片（优化：从5秒调整为7秒）
- 难度5-6：10秒/片（优化：从8秒调整为10秒）
- 难度7-8：18秒/片（优化：从15秒调整为18秒）

> **优化说明**：基于实际测试数据（难度1，4片，极限完成时间约22秒），调整每片平均时间，使其更符合实际游戏体验。考虑操作延迟、界面交互、思考时间等因素。

**2. 基础时间计算**
```
基础时间 = 拼图数量 × 每片平均时间
```

**3. 速度奖励阈值（基于基础时间的倍数，基于实际测试优化）**
- **极速**（少于1.0倍基础时间）：+600分 × 难度倍数
- **快速**（少于1.3倍基础时间）：+400分 × 难度倍数
- **良好**（少于1.6倍基础时间）：+300分 × 难度倍数
- **标准**（少于2.0倍基础时间）：+200分 × 难度倍数
- **一般**（少于2.5倍基础时间）：+100分 × 难度倍数
- **慢**（超出2.5倍基础时间）：+0分

> **优化说明**：基于实际测试数据（难度1，4片，极限完成时间约22秒），调整速度奖励阈值倍数：
> - 基础时间 = 4 × 5 = 20秒
> - 极速阈值 = 20 × 1.0 = 20秒（接近22秒极限，可达成）
> - 快速阈值 = 20 × 1.3 = 26秒
> - 良好阈值 = 20 × 1.6 = 32秒
> - 标准阈值 = 20 × 2.0 = 40秒
> - 一般阈值 = 20 × 2.5 = 50秒

**4. 难度倍数（奖励分数随难度递增）**
- 难度1-2：1.0倍（基础倍数）
- 难度3-4：1.2倍
- 难度5-6：1.5倍
- 难度7-8：2.0倍

#### 示例计算（基于优化后的阈值）

**示例1：难度1，4片拼图（实际测试案例）**
- 每片平均时间：5秒（优化后）
- 基础时间：4 × 5 = 20秒
- 极速（少于1.0倍）：少于20秒内 → +600分（接近22秒极限，可达成）
- 快速（少于1.3倍）：少于26秒内 → +400分
- 良好（少于1.6倍）：少于32秒内 → +300分
- 标准（少于2.0倍）：少于40秒内 → +200分
- 一般（少于2.5倍）：少于50秒内 → +100分
- 慢（超出2.5倍）：超出50秒 → +0分

**示例2：难度8，30片拼图**
- 每片平均时间：18秒（优化后）
- 基础时间：30 × 18 = 540秒（9分钟）
- 极速（少于1.0倍）：少于540秒（9分钟）内 → +1200分（600 × 2.0）
- 快速（少于1.3倍）：少于702秒（11分42秒）内 → +800分（400 × 2.0）
- 良好（少于1.6倍）：少于864秒（14分24秒）内 → +600分（300 × 2.0）
- 标准（少于2.0倍）：少于1080秒（18分钟）内 → +400分（200 × 2.0）
- 一般（少于2.5倍）：少于1350秒（22分30秒）内 → +200分（100 × 2.0）
- 慢（超出2.5倍）：超出1350秒 → +0分

**示例3：难度5，16片拼图**
- 每片平均时间：10秒（优化后）
- 基础时间：16 × 10 = 160秒（2分40秒）
- 极速（少于1.0倍）：少于160秒（2分40秒）内 → +900分（600 × 1.5）
- 快速（少于1.3倍）：少于208秒（3分28秒）内 → +600分（400 × 1.5）
- 良好（少于1.6倍）：少于256秒（4分16秒）内 → +450分（300 × 1.5）
- 标准（少于2.0倍）：少于320秒（5分20秒）内 → +300分（200 × 1.5）
- 一般（少于2.5倍）：少于400秒（6分40秒）内 → +150分（100 × 1.5）
- 慢（超出2.5倍）：超出400秒 → +0分

#### 优势

- **公平性**：每个难度都有机会获得速度奖励，不再局限于低难度
- **挑战性**：高难度奖励分数更高，鼓励玩家挑战高难度
- **合理性**：时间阈值基于实际拼图数量和难度，符合游戏体验
- **激励性**：成绩展示会显示对应的速度奖励等级，增加挑战欲望

#### 成绩展示说明

**速度奖励等级显示**：
- 游戏完成后，成绩详情会显示速度奖励等级和对应的时间阈值
- 例如："速度：一般（少于13.5秒内）" 或 "速度：慢（超出13.5秒）"
- 玩家可以清楚看到自己的完成速度属于哪个等级，以及对应的时间阈值

**挑战性提示**：
- 每个难度都有6个速度等级（极速/快速/良好/标准/一般/慢）
- 前5个等级有速度奖励，第6个等级（慢）无奖励，鼓励玩家重新挑战
- 玩家可以挑战更高等级的速度奖励，获得更高分数
- 高难度虽然时间阈值更长，但奖励分数也更高，鼓励玩家挑战极限

**示例挑战目标**（难度8，30片拼图）：
- 🏆 **极速**：少于135秒（2分15秒）内 → +1200分
- ⚡ **快速**：少于225秒（3分45秒）内 → +800分
- ✅ **良好**：少于315秒（5分15秒）内 → +600分
- 📊 **标准**：少于450秒（7分30秒）内 → +400分
- 💪 **一般**：少于675秒（11分15秒）内 → +200分
- ⚠️ **慢**：超出675秒 → +0分（建议重新挑战）

> **设计目标**：让玩家在每个难度都能感受到速度挑战的乐趣，不再因为时间阈值不合理而失去动力。高难度玩家可以通过快速完成获得更高的奖励分数，低难度玩家也能通过挑战极速完成获得成就感。

### 3. 旋转效率评分系统（v3.0 新算法）

#### 算法设计理念

采用"完美旋转奖励 + 超出旋转惩罚"算法：

- **完美旋转**：实际旋转次数 = 最小旋转次数 → **+500分**
- **超出旋转**：每超出1次旋转 → **-10分**
- **零旋转完美**：不需要旋转且没有旋转 → **+500分**

#### 最优解计算

```typescript
// 计算散开后每个拼图的最小旋转次数
const calculateMinimumRotationsAtStart = (pieces: PuzzlePiece[]): number => {
  return pieces.reduce((total, piece) => {
    let scatteredAngle = piece.rotation % 360;
    if (scatteredAngle < 0) scatteredAngle += 360;
    
    // 规则：≤180度用逆时针，>180度用顺时针
    let minRotations: number;
    if (scatteredAngle <= 180) {
      minRotations = Math.ceil(scatteredAngle / 15);  // 逆时针到0度
    } else {
      const clockwiseAngle = 360 - scatteredAngle;
      minRotations = Math.ceil(clockwiseAngle / 15);  // 顺时针到0度
    }
    
    return total + minRotations;
  }, 0);
};
```

#### 评分算法

```typescript
const calculateNewRotationScore = (actualRotations: number, minRotations: number): number => {
  if (actualRotations === minRotations) {
    return 500;  // 完美旋转：+500分
  } else {
    const excessRotations = actualRotations - minRotations;
    return -excessRotations * 10;  // 超出旋转：每次-10分
  }
};
```

#### 评分标准表

| 情况 | 分数计算 | 示例 | 描述 |
|------|---------|------|------|
| 完美旋转 | +500分 | 10/10次 → +500分 | 实际旋转 = 最小旋转 |
| 超出1次 | -10分 | 11/10次 → -10分 | 每超出1次扣10分 |
| 超出5次 | -50分 | 15/10次 → -50分 | 5次超出 × 10分 |
| 零旋转完美 | +500分 | 0/0次 → +500分 | 不需要旋转且没有旋转 |
| 不必要旋转 | 负分 | 3/0次 → -30分 | 不需要旋转但进行了旋转 |

### 4. 提示平衡机制

#### 统一赠送系统

```typescript
const HINT_CONFIG = {
  freeHintsPerGame: 3,      // 所有难度统一3次免费提示
  zeroHintBonus: 500,       // 零提示奖励分数
  excessHintPenalty: 25     // 超出每次的扣分
};
```

#### 提示评分机制

```typescript
const calculateHintScore = (actualHints: number, allowance: number): number => {
  if (actualHints === 0) {
    return 500;  // 零提示完成：+500分奖励
  }
  
  if (actualHints <= allowance) {
    return 0;    // 在赠送范围内：无惩罚
  }
  
  // 超出赠送次数：每次扣25分
  const excessHints = actualHints - allowance;
  return -excessHints * 25;
};
```

#### 设计优势

- **简化理解**：所有难度都是3次，用户无需记忆复杂规则
- **平衡体验**：3次提示既能帮助新手，又保持挑战性
- **鼓励自律**：让玩家自己控制使用，培养解谜技巧
- **高额奖励**：零提示完成+500分，强烈刺激挑战欲望

## 🏆 最终分数计算公式

```typescript
const calculateFinalScore = (stats: GameStats, pieces: PuzzlePiece[]): ScoreBreakdown => {
  // 1. 基础分数
  const baseScore = BASE_SCORES_BY_DIFFICULTY[stats.difficulty.cutCount];
  
  // 2. 速度奖励
  const timeBonus = calculateTimeBonus(stats).timeBonus;
  
  // 3. 旋转效率评分
  const minRotations = stats.minRotations; // 游戏开始时保存的值
  const rotationScore = calculateNewRotationScore(stats.totalRotations, minRotations);
  
  // 4. 提示使用评分
  const hintScore = calculateHintScore(stats.hintUsageCount, 3);
  
  // 5. 难度系数（包含形状系数）
  const difficultyMultiplier = calculateDifficultyMultiplier(stats.difficulty);
  
  // 6. 最终分数
  const subtotal = baseScore + timeBonus + rotationScore + hintScore;
  const finalScore = Math.max(100, Math.round(subtotal * difficultyMultiplier));
  
  return { baseScore, timeBonus, rotationScore, hintScore, difficultyMultiplier, finalScore };
};
```

## 🎨 拼图分布系统

### 分布因子计算

```typescript
// 根据难度动态计算分布因子
let distributionFactor: number;

if (difficulty <= 3) {
  // 低难度(1-3片)拼图更集中
  distributionFactor = 0.7 - ((difficulty - 1) * 0.05);
} else if (difficulty <= 6) {
  // 中等难度(4-6片)
  distributionFactor = 0.8 + ((difficulty - 4) * 0.05);
} else {
  // 高难度(7-8片)使用全部空间或更大范围
  distributionFactor = difficulty === 7 ? 1.0 : 1.1;
}
```

### 旋转角度设计

#### 移动设备（竖屏模式）

采用简化的90度倍数旋转：

```typescript
// 简单难度(1-3)：常用0度或90度
const rotationOptions = [0, 0, 90, 90];

// 中等难度(4-6)：使用0、90、180度
const rotationOptions = [0, 90, 90, 180];

// 高难度(7+)：使用0、90、180、270度
const rotationOptions = [0, 90, 180, 270];
```

#### 桌面端和移动设备横屏

使用精细的15度增量旋转：

```typescript
// 简单难度：0-45度，15度倍数
rotation = Math.floor(Math.random() * 4) * 15;

// 中等难度：0-90度，15度倍数
rotation = Math.floor(Math.random() * 7) * 15;

// 高难度：0-180度，15度倍数
rotation = Math.floor(Math.random() * 13) * 15;

// 极高难度：0-345度，15度倍数
rotation = Math.floor(Math.random() * 24) * 15;
```

## 📱 设备适配策略

### 设备检测机制

```typescript
const getDeviceMultiplier = (): number => {
  const userAgent = navigator.userAgent;
  const screenWidth = window.innerWidth;
  
  // 检测移动设备（与useDeviceDetection保持一致）
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isTouchDevice = 'ontouchstart' in window;
  
  // iPad检测
  const isIPad = /iPad/i.test(userAgent) || 
    (isIOS && screenWidth >= 768) ||
    (isTouchDevice && screenWidth >= 768 && screenWidth <= 1366);
  
  // 移动设备检测（排除iPad）
  const isMobileDevice = isMobile && !isIPad;
  
  return isMobileDevice ? 1.1 : 1.0;
};
```

### 移动设备（竖屏）优化

1. **画布尺寸**：强制正方形画布，限制最大尺寸
2. **拼图分布**：更紧凑的网格系统，增大安全边距
3. **拼图缩放**：自动缩小过大拼图，最大缩放到80%
4. **旋转简化**：使用90度倍数，减少视觉混乱
5. **边界约束**：更严格的边界检查

## 📈 实时分数显示

### 实时分数计算

```typescript
const calculateLiveScore = (stats: GameStats): number => {
  // 实时分数 = 基础分数 + 速度奖励 + 旋转分数 + 提示分数
  // 注意：实时分数不应用难度系数，只有最终分数才应用
  const subtotal = baseScore + timeBonus + rotationScore + hintScore;
  return Math.max(100, Math.round(subtotal));
};
```

### 显示组件设计

#### 画布显示元素
- **左上角**：计时器（mm:ss格式）
- **右上角**：实时分数（千分位分隔符格式）

#### 完成统计面板
- 最终得分（大号显示）
- 分数详情分解
- 效率统计信息
- 重新开始按钮

## 🔧 性能优化

### 计算优化
- **异步计算**：分数计算在`requestIdleCallback`中进行
- **缓存机制**：最优解计算结果缓存
- **防抖处理**：实时分数更新使用100ms防抖

```typescript
const createLiveScoreUpdater = (updateCallback, debounceMs = 100) => {
  const debouncedUpdate = debounce((stats, leaderboard) => {
    const result = calculateScoreDelta(lastStats, stats, leaderboard);
    updateCallback(result.newScore, result.delta, result.reason);
  }, debounceMs);
  
  return { updateScore: debouncedUpdate, reset: () => lastStats = null };
};
```

### 渲染优化
- **React.memo**：统计组件使用memo优化
- **useMemo**：复杂计算使用memo缓存
- **增量计算**：只计算变化部分

## 🧪 数据结构定义

### 游戏统计数据

```typescript
interface GameStats {
  // 时间统计
  gameStartTime: number;
  gameEndTime?: number;
  totalDuration: number;

  // 操作统计
  totalRotations: number;
  hintUsageCount: number;
  dragOperations: number;

  // 难度信息
  difficulty: DifficultyConfig;

  // 最优解数据（游戏开始时计算并保存）
  minRotations: number;
  rotationEfficiency: number;
  hintAllowance: number;

  // 设备信息
  deviceType: 'desktop' | 'mobile-portrait' | 'mobile-landscape' | 'ipad';
  canvasSize: { width: number; height: number };
}
```

### 分数分解数据

```typescript
interface ScoreBreakdown {
  baseScore: number;              // 基础分数
  timeBonus: number;              // 速度奖励
  timeBonusRank: number;          // 速度排名
  isTimeRecord: boolean;          // 是否新记录
  rotationScore: number;          // 旋转效率分数
  rotationEfficiency: number;     // 旋转效率百分比
  minRotations: number;           // 最小旋转次数
  hintScore: number;              // 提示使用分数
  hintAllowance: number;          // 提示赠送次数
  difficultyMultiplier: number;   // 难度系数
  finalScore: number;             // 最终分数
}
```

## 🎯 系统优势

### 公平性
- ✅ 基于最优解的客观评分
- ✅ 统一的提示赠送机制
- ✅ 设备适配的难度平衡

### 竞争性
- ✅ 实时分数反馈
- ✅ 动态速度奖励机制（v3.4：基于实际测试数据优化，每个难度都有机会获得奖励）
- ✅ 效率评分激励
- ✅ 高难度高奖励，鼓励挑战极限

### 教育性
- ✅ 显示最优解帮助学习
- ✅ 效率反馈促进改进
- ✅ 策略思维培养

### 体验性
- ✅ 直观的分数计算
- ✅ 丰富的视觉反馈
- ✅ 平滑的性能表现

### 多样性
- ✅ 三种形状选择，不同难度挑战
- ✅ 形状难度系数，鼓励挑战高难度
- ✅ 个性化的游戏体验

## 🔄 版本历史

- **v1.0.0** (2025/08/22): 基础分数系统设计
- **v2.0.0** (2025/08/29): 新旋转评分算法
- **v2.1.0** (2025/09/01): 核心计分系统实现
- **v3.0.0** (2025/09/09): 统一规则文档，修正难度级别表格，与代码实现完全一致
- **v3.1.0** (2025/09/28): 新增形状难度系数，支持三种形状的不同难度奖励，版本标识同步
- **v3.2.0** (2025/12/26): **平衡优化版** - 修复曲线切割拼图数量问题，重新平衡难度系数
  - 🔧 修复：曲线切割使用 `pieceRange.max` 作为放射线数量（难度8时30条），产生与直线/斜线相似数量的拼图
  - 📐 原理：直线/斜线的n条线互相交叉产生约2n块，曲线的n条放射线产生约n块扇形
  - ⚖️ 平衡：曲线切割系数从1.5降低到1.25，斜线切割系数从1.2降低到1.15
  - ⚖️ 平衡：锯齿形状系数从1.2降低到1.05（独特形状反而更容易识别）
- **v3.3.0** (2025/12/27): **动态速度奖励版** - 引入基于难度和拼图数量的动态速度奖励系统
  - 🎯 公平性：每个难度都有机会获得速度奖励，不再局限于低难度（难度1-2）
  - ⏱️ 动态阈值：基于拼图数量和难度级别计算合理的时间阈值（每片平均时间随难度递增）
  - 💰 奖励递增：高难度奖励分数更高（难度倍数：1.0/1.2/1.5/2.0），鼓励玩家挑战高难度
  - 📊 成绩展示：显示对应的速度奖励等级（极速/快速/良好/标准/一般），增加挑战欲望
  - 📈 示例：难度8（30片）基础时间450秒，极速135秒内完成可获得+1200分奖励
- **v3.4.0** (2025/12/28): **基于实际测试优化的速度奖励版** - 优化速度奖励阈值，使其更符合实际游戏体验
  - 🧪 实际测试：基于难度1，4片拼图，极限完成时间约22秒的真实测试数据
  - ⏱️ 阈值优化：极速阈值从0.3倍基础时间调整为1.0倍基础时间，确保玩家可以达成
  - 📊 时间调整：每片平均时间优化（难度1-2：3→5秒，难度3-4：5→7秒，难度5-6：8→10秒，难度7-8：15→18秒）
  - 🎯 阈值倍数：速度奖励阈值倍数优化（极速1.0倍，快速1.3倍，良好1.6倍，标准2.0倍，一般2.5倍）
  - ✅ 可达成性：极速奖励现在可以达成，例如难度1（4片）极速阈值20秒，接近22秒极限

## 🔗 技术实现参考

### 核心文件
- `utils/score/ScoreCalculator.ts` - 分数计算引擎（包含形状系数和切割类型系数）
- `utils/score/RotationEfficiencyCalculator.ts` - 旋转效率计算
- `utils/puzzle/cutGeneratorConfig.ts` - 难度配置系统
- `utils/puzzle/cutGeneratorController.ts` - 直线/斜线切割生成控制器
- `utils/puzzle/graph/NetworkCutter.ts` - 曲线切割生成引擎（v3.2修复）
- `utils/puzzle/ScatterPuzzle.ts` - 拼图分布系统
- `contexts/GameContext.tsx` - 游戏状态管理

### UI组件
- `components/ShapeControls.tsx` - 形状选择组件
- `components/score/ScoreDisplay.tsx` - 分数显示组件
- `components/score/MobileScoreLayout.tsx` - 移动端分数布局

### 相关 Hooks
- `useDeviceDetection` - 设备检测
- `useGameStats` - 游戏统计
- `useScoreCalculation` - 分数计算

---

**文档版本**: v3.4  
**创建日期**: 2025/09/09  
**最新更新**: 2025/12/28 (基于实际测试优化的速度奖励版)  
**基准代码**: utils/score/ScoreCalculator.ts + utils/puzzle/cutGeneratorConfig.ts + utils/puzzle/graph/NetworkCutter.ts  
**一致性状态**: ✅ 完全一致  
**权威性**: 🔒 唯一权威规则文档  
**维护原则**: 代码先行，文档跟随，保持同步更新
