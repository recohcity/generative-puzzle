# 生成式拼图游戏 - 统一规则文档

## 📋 文档状态

**版本**: v3.1 (统一规则版)  
**最后更新**: 2025/09/28  
**状态**: ✅ 与代码实现完全一致  
**基准代码**: `utils/score/ScoreCalculator.ts` + `utils/puzzle/cutGeneratorConfig.ts`

> **权威性声明**：本文档为游戏唯一权威规则说明，与代码实现完全一致。所有游戏逻辑、分数计算、难度设计均以此文档和对应代码为准。
>
> **文档合并说明**：本文档已合并了原 `docs/difficulty-design.md` 和 `docs/score-system.md` 的所有内容，原文档已被删除以避免信息不一致。

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
| 云朵形 (Cloud) | ☁️ | 1.1 | 轻微增雾，曲线边缘，初级挑战 |
| 锯齿形 (Jagged) | ⚡ | 1.2 | 较高难度，不规则边缘，高手挑战 |

> **设计理念**：不同形状的边缘复杂度不同，影响拼图的识别和匹配难度，因此给予不同的分数系数奖励。

### 难度级别与拼图数量映射

> **重要说明**：玩家选择难度1-8，系统根据难度级别生成对应数量的切割线，最终拼图数量在设定范围内波动。

| 难度级别 | 切割线数量 | 拼图数量范围 | 难度分类 | 基础分数 | 难度系数 |
|---------|------------|-------------|---------|---------|---------|
| 1       | 2条        | 3-4片       | 入门     | 500     | 1.0     |
| 2       | 3条        | 4-6片       | 简单     | 800     | 1.2     |
| 3       | 4条        | 5-8片       | 初级     | 1200    | 1.5     |
| 4       | 6条        | 7-12片      | 中级     | 1800    | 1.8     |
| 5       | 8条        | 9-16片      | 中高级   | 2500    | 2.2     |
| 6       | 10条       | 11-20片     | 高级     | 3500    | 2.8     |
| 7       | 12条       | 13-24片     | 专家     | 5000    | 3.5     |
| 8       | 15条       | 16-30片     | 大师     | 8000    | 5.0     |

### 难度配置详情

```typescript
// 来自 cutGeneratorConfig.ts 的实际配置
const DIFFICULTY_SETTINGS = {
  1: {
    targetCuts: 2,              // 2条切割线
    centerProbability: 0.9,     // 90% 概率经过中心
    useCenter: true,            // 使用中心策略
    label: '入门难度',
    pieceRange: { min: 3, max: 4 },
    baseScore: 500
  },
  2: {
    targetCuts: 3,              // 3条切割线
    centerProbability: 0.8,
    useCenter: true,
    label: '简单难度',
    pieceRange: { min: 4, max: 6 },
    baseScore: 800
  },
  // ... 其他难度级别
}
```

### 切割类型系数

```typescript
// 切割类型难度系数
const CUT_TYPE_MULTIPLIER = {
  straight: 1.0,  // 直线切割：标准难度
  diagonal: 1.2   // 斜线切割：增加20%难度
}
```

### 形状难度系数

```typescript
// 形状难度系数
const SHAPE_MULTIPLIER = {
  polygon: 1.0,   // 多边形：标准难度
  cloud: 1.1,     // 云朵形：增加10%难度
  jagged: 1.2     // 锯齿形：增加20%难度
}
```

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

**示例计算**：
- 难度5 + 斜线切割 + 移动端 + 锯齿形 = 2.2 × 1.2 × 1.1 × 1.2 = 3.485

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

### 2. 速度奖励系统

基于完成时间的固定阈值奖励：

| 时间阈值 | 奖励分数 | 描述 |
|---------|---------|------|
| ≤ 10秒  | +600分  | 10秒内完成 |
| ≤ 30秒  | +400分  | 30秒内完成 |
| ≤ 60秒  | +300分  | 60秒内完成 |
| ≤ 90秒  | +200分  | 1分30秒内完成 |
| ≤ 120秒 | +100分  | 2分钟内完成 |
| > 120秒 | +0分    | 超过2分钟 |

**特点**：
- 简单明了：基于时间阈值，用户容易理解
- 鼓励效率：时间越短奖励越高
- 平衡设计：避免过度追求速度而忽略策略

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
- ✅ 速度奖励机制
- ✅ 效率评分激励

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

## 🔗 技术实现参考

### 核心文件
- `utils/score/ScoreCalculator.ts` - 分数计算引擎（包含形状系数）
- `utils/score/RotationEfficiencyCalculator.ts` - 旋转效率计算
- `utils/puzzle/cutGeneratorConfig.ts` - 难度配置系统
- `utils/puzzle/cutGeneratorController.ts` - 切割生成控制器
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

**文档版本**: v3.1  
**创建日期**: 2025/09/09  
**最新更新**: 2025/09/28 (版本标识同步)  
**基准代码**: utils/score/ScoreCalculator.ts + utils/puzzle/cutGeneratorConfig.ts  
**一致性状态**: ✅ 完全一致  
**权威性**: 🔒 唯一权威规则文档  
**维护原则**: 代码先行，文档跟随，保持同步更新
