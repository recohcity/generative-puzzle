# 生成式拼图游戏 - 智能分数统计系统设计方案

## 📋 实现状态

**当前版本**: v2.1 (已实现核心功能)  
**最后更新**: 2025/09/01  
**实现进度**: 核心计分系统 ✅ | UI展示系统 🚧 | 排行榜系统 📋

### ✅ 已实现功能
- **基础分数系统**：基于拼图数量的分级基础分数
- **速度奖励系统**：基于完成时间的阈值奖励（10秒内+400分等）
- **旋转效率评分**：基于最优解的旋转操作评分
- **提示平衡机制**：统一3次提示赠送，零提示+300分奖励
- **难度系数加成**：综合拼图数量、切割类型、设备的系数计算
- **完整测试覆盖**：14个单元测试用例，覆盖所有核心逻辑

### 🚧 开发中功能
- UI展示系统集成
- 实时分数显示
- 游戏完成统计面板

### 📋 计划功能
- 排行榜系统
- 本地存储方案
- 跨平台UI适配

## 概述

基于现有难度设计系统，设计完整的智能分数统计、计算和展示方案。该系统采用基于最优解的旋转效率评分机制和简化的时间奖励系统，鼓励玩家追求完美操作和零错误挑战。完全遵循最高级别监督指令，实现零破坏性集成。

## 设计原则

### 🛡️ 监督指令合规性
- **适配系统保护**：不触及UPDATE_CANVAS_SIZE、100ms冻结机制等核心适配逻辑
- **性能标准维护**：保持60fps渲染，统计功能异步处理
- **架构完整性**：通过GameContext统一状态管理，符合现有模式
- **零破坏性扩展**：完全基于现有系统扩展，不修改核心逻辑

### 🎯 智能评分理念
- **基于最优解**：旋转评分基于数学最优解，鼓励策略思考
- **难度平衡**：提示次数基于难度赠送，公平合理
- **竞争激励**：时间奖励基于排行榜表现，动态竞争
- **教育意义**：显示最优解和效率，帮助玩家提升

### 📊 基于现有难度系统
- 完全基于`docs/difficulty-design.md`中定义的难度级别
- 复用现有的切割次数、拼图数量映射关系
- 集成现有的设备适配和旋转系统
- 保持与现有UI布局的一致性

## 智能评分系统架构

### 核心评分组件

1. **基础分数系统**：基于难度级别的基础分数
2. **时间排行榜奖励**：基于同难度Top5排名的动态时间奖励
3. **旋转效率评分**：基于最优解的旋转操作评分
4. **提示平衡机制**：基于难度赠送的提示使用评分
5. **难度系数加成**：综合难度、切割类型、设备的系数加成

### 基础难度映射

基于现有难度设计文档中的精确数据（已实现）：

| 切割次数 | 实际拼图数 | 难度级别 | 基础分数 | 难度系数 | 赠送提示 |
|---------|-----------|---------|---------|---------|---------|
| 1       | 2片       | 简单     | 800     | 1.0     | 3次     |
| 2       | 3片       | 简单     | 900     | 1.1     | 3次     |
| 3       | 4片       | 简单     | 1000    | 1.2     | 3次     |
| 4       | 5片       | 中等     | 1200    | 1.4     | 3次     |
| 5       | 7片       | 中等     | 1400    | 1.6     | 3次     |
| 6       | 9片       | 中等     | 1600    | 1.8     | 3次     |
| 7       | 12片      | 困难     | 1800    | 2.2     | 3次     |
| 8       | 14片      | 极难     | 2000    | 2.5     | 3次     |

### 切割类型与设备系数

```typescript
// 切割类型系数
const cutTypeMultiplier = {
  straight: 1.0,  // 直线切割：标准难度
  diagonal: 1.2   // 斜线切割：增加20%难度
};

// 设备适配系数
const deviceMultiplier = {
  desktop: 1.0,           // 桌面端：标准难度
  mobile: 1.1,            // 移动端（横屏和竖屏）：统一难度
  ipad: 1.0               // iPad：标准难度
};
```

### 最终难度系数公式

```typescript
finalMultiplier = baseDifficultyMultiplier × cutTypeMultiplier × deviceMultiplier
```

## 速度奖励系统

### 设计理念

基于完成时间给予奖励分数，鼓励玩家提高操作效率。采用固定时间阈值，简单明了，避免复杂的排名计算。

### 奖励机制（已实现）

```typescript
// 基于完成时间的速度奖励
const TIME_BONUS_THRESHOLDS = [
  { maxTime: 10, bonus: 400, description: '10秒内完成' },   // +400分
  { maxTime: 30, bonus: 200, description: '30秒内完成' },   // +200分
  { maxTime: 60, bonus: 100, description: '60秒内完成' },   // +100分
  { maxTime: 90, bonus: 50, description: '1分30秒内完成' }, // +50分
  { maxTime: 120, bonus: 10, description: '2分钟内完成' },  // +10分
  // 超过2分钟：0分
];
```

### 特点

- **简单明了**：基于时间阈值，用户容易理解
- **鼓励效率**：时间越短奖励越高
- **平衡设计**：避免过度追求速度而忽略策略

## 旋转效率评分系统（v2.1 - 新算法）

### 🆕 新算法设计理念

基于用户反馈和游戏体验优化，采用全新的"完美旋转奖励 + 超出旋转惩罚"算法，更加直观和公平：

- **完美旋转**：实际旋转次数 = 最小旋转次数，获得 **+500分** 奖励
- **超出旋转**：每超出1次旋转，扣除 **10分**
- **零旋转完美**：不需要旋转且没有旋转，获得 **+500分** 奖励

### 最优解计算（保持不变）

```typescript
// 计算每个拼图的最小旋转次数
const calculateMinimumRotations = (pieces: PuzzlePiece[]): number => {
  return pieces.reduce((total, piece) => {
    const currentAngle = piece.rotation;
    const targetAngle = piece.targetRotation || 0;
    
    // 计算角度差（考虑360度循环）
    let angleDiff = Math.abs(targetAngle - currentAngle);
    if (angleDiff > 180) {
      angleDiff = 360 - angleDiff;
    }
    
    // 每次旋转15度，计算最小次数
    const minRotations = Math.ceil(angleDiff / 15);
    return total + minRotations;
  }, 0);
};
```

### 🆕 新评分算法（已实现）

```typescript
// 新的旋转效率计算算法
const calculateNewRotationScore = (actualRotations: number, minRotations: number): number => {
  if (actualRotations === minRotations) {
    // 完美旋转：+500分
    return 500;
  } else {
    // 超出旋转：每次-10分
    const excessRotations = actualRotations - minRotations;
    return -excessRotations * 10;
  }
};
```

### 🆕 新评分标准

| 情况 | 分数计算 | 示例 | 描述 |
|------|---------|------|------|
| 完美旋转 | +500分 | 10/10次 → +500分 | 实际旋转 = 最小旋转 |
| 超出1次 | -10分 | 11/10次 → -10分 | 每超出1次扣10分 |
| 超出5次 | -50分 | 15/10次 → -50分 | 5次超出 × 10分 |
| 零旋转完美 | +500分 | 0/0次 → +500分 | 不需要旋转且没有旋转 |
| 不必要旋转 | 负分 | 3/0次 → -30分 | 不需要旋转但进行了旋转 |

### 🔄 算法升级优势

1. **更加直观**：分数计算简单明了，用户容易理解
2. **激励完美**：完美旋转获得高额奖励（+500分）
3. **精确惩罚**：超出旋转按次数精确扣分
4. **平衡设计**：避免过度惩罚，保持游戏乐趣
5. **降级兼容**：新算法失败时自动回退到旧算法

## 提示平衡机制

### 统一赠送系统（已简化）

所有难度级别统一提供3次提示，简化用户理解，鼓励自律使用：

```typescript
// 统一的提示赠送次数
const HINT_ALLOWANCES_BY_CUT_COUNT: Record<number, number> = {
  1: 3,  // 1次切割 -> 3次提示
  2: 3,  // 2次切割 -> 3次提示
  3: 3,  // 3次切割 -> 3次提示
  4: 3,  // 4次切割 -> 3次提示
  5: 3,  // 5次切割 -> 3次提示
  6: 3,  // 6次切割 -> 3次提示
  7: 3,  // 7次切割 -> 3次提示
  8: 3   // 8次切割 -> 3次提示
};
```

### 提示评分机制（已实现）

```typescript
const calculateHintScore = (actualHints: number, allowance: number): number => {
  if (actualHints === 0) {
    return 300;  // 零提示完成：+300分奖励（提升刺激性）
  }
  
  if (actualHints <= allowance) {
    return 0;    // 在赠送范围内：无惩罚
  }
  
  // 超出赠送次数：每次扣25分
  const excessHints = actualHints - allowance;
  return -excessHints * 25;
};
```

### 设计优势

- **简化理解**：所有难度都是3次，用户无需记忆复杂规则
- **平衡体验**：3次提示既能帮助新手，又保持挑战性
- **鼓励自律**：让玩家自己控制使用，培养解谜技巧
- **高额奖励**：零提示完成+300分，强烈刺激挑战欲望

## 最终分数计算公式

```typescript
const calculateFinalScore = (
  stats: GameStats, 
  pieces: PuzzlePiece[], 
  currentLeaderboard: GameRecord[]
): ScoreBreakdown => {
  // 1. 基础分数
  const baseScore = getBaseScore(stats.difficulty.difficultyLevel);
  
  // 2. 速度奖励
  const timeBonus = calculateTimeBonus(stats).timeBonus;
  
  // 3. 旋转效率评分
  const minRotations = calculateMinimumRotations(pieces);
  const rotationEfficiency = minRotations / stats.totalRotations;
  const rotationScore = calculateRotationScore(rotationEfficiency);
  
  // 4. 提示使用评分
  const hintAllowance = getHintAllowanceByCutCount(stats.difficulty.cutCount);
  const hintScore = calculateHintScore(stats.hintUsageCount, hintAllowance);
  
  // 5. 拖拽操作惩罚
  const excessDrags = Math.max(0, stats.dragOperations - (stats.difficulty.actualPieces * 2));
  const dragPenalty = excessDrags * 1;
  
  // 6. 难度系数
  const difficultyMultiplier = calculateDifficultyMultiplier(stats.difficulty);
  
  // 7. 最终分数
  const finalScore = Math.max(100, Math.round(
    (baseScore + timeBonus + rotationScore + hintScore - dragPenalty) * 
    difficultyMultiplier
  ));
  
  return {
    baseScore,
    timeBonus,
    timeBonusRank: 0, // 当前版本不基于排名
    isTimeRecord: false, // 当前版本不判断记录
    rotationScore,
    rotationEfficiency,
    minRotations,
    hintScore,
    hintAllowance,
    difficultyMultiplier,
    finalScore
  };
};
```

## 数据结构设计

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

  // 最优解数据
  minRotations: number;
  rotationEfficiency: number;
  hintAllowance: number;

  // 分数计算
  baseScore: number;
  timeBonus: number;
  timeBonusRank: number;
  isTimeRecord: boolean;
  rotationScore: number;
  hintScore: number;
  dragPenalty: number;
  difficultyMultiplier: number;
  finalScore: number;

  // 设备信息
  deviceType: 'desktop' | 'mobile-portrait' | 'mobile-landscape' | 'ipad';
  canvasSize: { width: number; height: number };
}
```

### 游戏记录

```typescript
interface GameRecord {
  id: string;
  playerName: string;
  stats: GameStats;
  completedAt: Date;
  isPersonalBest: boolean;
}
```

## UI展示设计

### 响应式展示方案

考虑控制面板宽度限制和移动端适配，采用分层展示设计：

#### 桌面端展示（控制面板宽度充足）
```
时长: 04:23 (第2名🏆)     +1700
旋转: 5次 (最优3次)        +50
提示: 0次 (赠送4次)        +100 (零提示奖励)
─────────────────────────
小计: 1850  难度: ×1.6
最终得分: 2960
```

#### 移动端展示（紧凑布局）
```
⏱ 04:23 (第2名🏆) +1700
🔄 5/3次 (67%)     +50
💡 0/4次           +100
──────────────────
1850 × 1.6 = 2960
```

#### 超窄屏展示（极限适配）
```
04:23 🏆 +1700
5/3次    +50
0/4次    +100
───────────
2960分
```

### 视觉设计原则

- **正分显示**：绿色/蓝色，表示奖励和加分
- **负分显示**：红色，表示惩罚和扣分
- **完美操作**：金色，表示达到最优解
- **新记录标识**：🏆图标，突出显示时间记录
- **排名显示**：清晰标注在排行榜中的位置
- **图标简化**：移动端使用emoji图标节省空间
- **分层显示**：根据屏幕宽度智能选择展示方案

### 实时显示组件

#### 画布左上角 - 计时器
- **位置**：画布左上角，与智能提示并排
- **样式**：半透明背景，白色文字，等宽字体
- **格式**：mm:ss格式显示（如 04:23）
- **更新频率**：每秒更新一次

#### 画布右上角 - 实时分数
- **位置**：画布右上角，与智能提示并排
- **样式**：半透明背景，白色文字，等宽字体
- **格式**：数字格式化显示（千分位分隔符）
- **更新频率**：操作触发时实时更新

### 游戏完成统计面板

#### 替换控制面板内容
- **触发条件**：游戏完成时
- **显示内容**：
  - 恭喜完成标题
  - 最终得分（大号显示）
  - 并排分数详情分解
  - 重新开始按钮

### 排行榜系统

#### 排行榜按钮
- **位置**：控制面板顶部，语言切换按钮旁边
- **图标**：🏆
- **功能**：点击显示排行榜面板

#### 排行榜面板
- **替换控制面板内容**
- **分类显示**：全部、简单、中等、困难
- **显示内容**：
  - Top 5 排行榜
  - 排名、分数、玩家名、难度、完成时间
  - 回到游戏按钮

### 跨平台适配策略

#### 桌面端（宽度 > 768px）
- **完整展示**：使用标准桌面端布局
- **详细信息**：显示完整的分数计算过程
- **鼠标交互**：优化鼠标操作的统计追踪
- **面板宽度**：右侧面板标准宽度（约300px）

#### 移动端横屏（480px - 768px）
- **紧凑布局**：使用移动端展示方案
- **图标简化**：使用emoji图标节省空间
- **触摸优化**：优化触摸操作的统计追踪
- **面板适配**：控制面板占屏幕下方区域

#### 移动端竖屏（< 480px）
- **极简展示**：使用超窄屏展示方案
- **关键信息**：只显示最重要的分数信息
- **垂直布局**：统计信息垂直排列
- **滑动查看**：详细信息通过滑动查看

#### iPad端
- **智能切换**：根据屏幕方向自动选择布局
- **横屏模式**：使用桌面端布局
- **竖屏模式**：使用移动端布局
- **混合交互**：支持触摸和鼠标的混合操作

### 响应式断点设计

```typescript
const breakpoints = {
  mobile: '< 480px',      // 超窄屏展示
  tablet: '480px - 768px', // 移动端展示  
  desktop: '> 768px'       // 桌面端展示
};

const getDisplayMode = (width: number): DisplayMode => {
  if (width < 480) return 'compact';
  if (width < 768) return 'mobile';
  return 'desktop';
};
```

### UI组件实现细节

#### 智能评分面板组件
```typescript
interface ScoreDisplayProps {
  stats: GameStats;
  displayMode: 'desktop' | 'mobile' | 'compact';
  showAnimation?: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ 
  stats, 
  displayMode, 
  showAnimation = true 
}) => {
  // 根据displayMode渲染不同的布局
  switch (displayMode) {
    case 'desktop':
      return <DesktopScoreLayout stats={stats} />;
    case 'mobile':
      return <MobileScoreLayout stats={stats} />;
    case 'compact':
      return <CompactScoreLayout stats={stats} />;
  }
};
```

#### 实时分数更新机制
```typescript
const useRealTimeScore = (gameStats: GameStats | null) => {
  const [displayScore, setDisplayScore] = useState(0);
  
  useEffect(() => {
    if (!gameStats) return;
    
    // 防抖更新，避免频繁渲染
    const updateScore = debounce(() => {
      const newScore = calculateCurrentScore(gameStats);
      setDisplayScore(newScore);
    }, 100);
    
    updateScore();
  }, [gameStats?.totalRotations, gameStats?.hintUsageCount]);
  
  return displayScore;
};
```

#### 动画效果设计
- **分数变化动画**：数字滚动效果，突出分数变化
- **新记录闪烁**：🏆图标闪烁效果，庆祝新记录
- **颜色渐变**：正分绿色渐入，负分红色渐入
- **进度条动画**：效率百分比进度条动画

## 状态管理集成

### GameContext扩展

```typescript
interface GameState {
  // 现有状态保持不变...
  
  // 新增统计相关状态
  gameStats: GameStats | null;
  isGameActive: boolean;
  isGameComplete: boolean;
  showLeaderboard: boolean;
  leaderboard: GameRecord[];
}
```

### 新增Action类型

```typescript
type StatsAction = 
  | { type: 'START_GAME_TRACKING'; payload: { difficulty: DifficultyConfig } }
  | { type: 'TRACK_ROTATION' }
  | { type: 'TRACK_HINT_USAGE' }
  | { type: 'TRACK_DRAG_OPERATION' }
  | { type: 'COMPLETE_GAME'; payload: { playerName?: string } }
  | { type: 'RESTART_GAME' }
  | { type: 'SHOW_LEADERBOARD' }
  | { type: 'HIDE_LEADERBOARD' }
  | { type: 'LOAD_LEADERBOARD' }
  | { type: 'RESET_STATS' };
```

### 统计触发点

基于现有游戏逻辑，在关键操作点添加统计追踪：

1. **游戏开始**：`START_GAME_TRACKING`
2. **拼图旋转**：`TRACK_ROTATION`
3. **使用提示**：`TRACK_HINT_USAGE`
4. **拖拽操作**：`TRACK_DRAG_OPERATION`
5. **游戏完成**：`COMPLETE_GAME`

## 本地存储方案

### 存储结构

```typescript
interface StorageData {
  leaderboard: GameRecord[];           // 排行榜数据
  personalBests: Record<string, GameRecord>; // 个人最佳记录
  gameHistory: GameRecord[];           // 游戏历史（最近50场）
  settings: {
    playerName: string;
    showRealTimeScore: boolean;
  };
}
```

### 数据管理策略

- **排行榜限制**：每个难度级别最多保存5条记录
- **历史记录**：最多保存50条游戏记录
- **自动清理**：定期清理过期数据
- **数据验证**：确保数据完整性和格式正确性
- **优雅降级**：存储失败时使用内存缓存

## 性能优化

### 计算优化

- **异步计算**：分数计算在`requestIdleCallback`中进行
- **缓存机制**：最优解计算结果缓存
- **防抖处理**：实时分数更新使用防抖

### 渲染优化

- **React.memo**：统计组件使用memo优化
- **useMemo**：复杂计算使用memo缓存
- **虚拟滚动**：排行榜长列表使用虚拟滚动

### 内存管理

- **数据限制**：严格控制存储数据量
- **定期清理**：自动清理过期和冗余数据
- **内存监控**：监控统计功能的内存使用

## 测试策略

### 单元测试
- 分数计算算法准确性测试
- 最优解计算正确性验证
- 排行榜逻辑功能测试

### 集成测试
- GameContext状态管理测试
- 组件间数据传递验证
- 本地存储功能测试

### E2E测试
- 完整游戏流程统计验证
- 跨设备兼容性测试
- 性能指标验证

## 兼容性保证

### 向后兼容
- 现有游戏逻辑完全不变
- 现有UI布局保持一致
- 现有适配机制不受影响

### 渐进增强
- 统计功能可选启用
- 降级方案：统计失败不影响游戏
- 优雅处理：存储失败时使用内存缓存

## 系统优势

### 🎯 **更加公平**
- 基于最优解的客观评分
- 排行榜竞争消除个体差异
- 难度平衡的提示机制

### 🏆 **增强竞争性**
- 实时排行榜竞争
- 新记录成就感
- 效率评分激励优化

### 📚 **教育意义**
- 显示最优解帮助学习
- 效率反馈促进改进
- 策略思维培养

### 🎮 **提升体验**
- 直观的并排展示
- 丰富的视觉反馈
- 个性化的成就系统

## 未来扩展

### 功能扩展
- 成就系统集成
- 社交分享功能
- 云端数据同步
- 多人竞技模式

### 数据分析
- 用户行为分析
- 难度平衡优化
- 性能数据收集
- A/B测试支持

---

**设计版本**: v2.1  
**创建日期**: 2025/08/22  
**最后更新**: 2025/08/29  
**基于系统**: 现有难度设计系统 v1.2.0  
**核心特性**: 智能评分 + 简化提示系统 + 最优解教育  
**合规级别**: 最高级别监督指令 - SUPREME LEVEL  
**设计原则**: 零破坏性扩展 + A+性能标准 + 简化用户体验  
**实现状态**: 核心计分逻辑已完成并通过测试验证