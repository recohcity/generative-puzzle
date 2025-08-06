# 音效系统文档

本项目包含一个完整的音效系统，为用户交互提供音频反馈。

## 音效类型

### 1. 背景音乐
- **文件**: `/public/puzzle-pieces.mp3`
- **功能**: 循环播放的背景音乐
- **控制**: 可通过右上角音乐按钮开关

### 2. 交互音效（程序生成）

#### 通用按钮点击音效 (`playButtonClickSound`)
- **触发**: 大部分按钮点击
- **特征**: 简短的正弦波音效，440Hz快速衰减到220Hz
- **持续时间**: 0.2秒

#### 拼图块选择音效 (`playPieceSelectSound`)
- **触发**: 选择拼图块时
- **特征**: 600Hz正弦波，快速衰减
- **持续时间**: 0.1秒

#### 拼图块吸附音效 (`playPieceSnapSound`)
- **触发**: 拼图块正确放置时
- **特征**: 三角波，880Hz衰减到440Hz
- **持续时间**: 0.3秒

#### 拼图完成音效 (`playPuzzleCompletedSound`)
- **触发**: 完成整个拼图时
- **特征**: 双音符和弦 (C5 + E5)
- **持续时间**: 0.75秒

#### 旋转音效 (`playRotateSound`)
- **触发**: 旋转拼图块时
- **特征**: 三角波，400Hz上升到450Hz
- **持续时间**: 0.12秒

#### 🆕 切割音效 (`playCutSound`)
- **触发**: 切割形状生成拼图时
- **特征**: 清晰简单的"咔嚓"切割音效
  - 锯齿波振荡器 - 产生锐利的切割声
  - 频率扫描 (300Hz → 1200Hz → 200Hz) - 模拟刀片切割过程
  - 瞬间攻击和快速衰减 - 模拟切割的瞬间性
- **音量**: 0.5（音量确保清晰可听）
- **持续时间**: 0.08秒（短促有力）

## 使用方法

### 在组件中使用音效

```tsx
import { 
  playButtonClickSound, 
  playCutSound, 
  playRotateSound 
} from '@/utils/rendering/soundEffects';

// 按钮点击
const handleClick = () => {
  playButtonClickSound();
  // 其他逻辑
};

// 切割操作
const handleCut = () => {
  playCutSound();
  generatePuzzle();
};

// 旋转操作
const handleRotate = () => {
  playRotateSound();
  rotatePiece();
};
```

### 背景音乐控制

```tsx
import { 
  initBackgroundMusic, 
  toggleBackgroundMusic, 
  getBackgroundMusicStatus 
} from '@/utils/rendering/soundEffects';

// 初始化背景音乐
useEffect(() => {
  initBackgroundMusic();
}, []);

// 切换背景音乐
const handleToggleMusic = async () => {
  const isPlaying = await toggleBackgroundMusic();
  setMusicPlaying(isPlaying);
};
```

## 技术实现

### Web Audio API
- 使用 `AudioContext` 创建程序化音效
- 支持多个振荡器叠加创建复杂音效
- 使用增益节点控制音量包络
- 使用滤波器节点优化音质

### 音频上下文管理
- 自动处理浏览器音频策略限制
- 支持音频上下文的暂停和恢复
- 错误处理和降级方案

### 测试支持
- 提供测试钩子 `soundPlayedForTest`
- 支持 Playwright 自动化测试
- 音效播放事件可被测试捕获

## 音效设计原则

1. **反馈性**: 每个重要的用户交互都有对应的音效反馈
2. **区分性**: 不同类型的操作使用不同特征的音效
3. **适度性**: 音效音量适中，不会干扰用户体验
4. **一致性**: 相同类型的操作使用相同的音效
5. **性能**: 使用轻量级的程序生成音效，避免大文件加载

## 浏览器兼容性

- 支持现代浏览器的 Web Audio API
- 自动处理 Safari 和移动端的音频限制
- 提供优雅的降级处理

## 测试

运行音效测试：
```bash
npx playwright test e2e/cut-sound-effect.spec.ts
```

测试覆盖：
- 切割音效播放验证
- 不同设备端音效一致性
- 音效与操作的正确对应关系