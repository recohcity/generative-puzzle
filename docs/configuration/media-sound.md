# 媒体资源与音效配置

> 修订日期：2025-01-22 (v1.3.58)

本文档详细说明媒体资源和音效系统的配置参数，包括背景音乐、交互音效、静态资源等核心配置。

---

## 1. 背景音乐配置

### backgroundMusic
- **作用**：背景音乐开关与音量控制
- **文件路径**：`/public/bgm.mp3`
- **取值范围**：布尔（开关）+ 0~1（音量）
- **默认值**：true（开启），0.5（音量）
- **循环播放**：启用，提供连续背景音乐体验
- **影响点**：用户体验、沉浸感
- **配置/代码位置**：`utils/rendering/soundEffects.ts`、`components/GlobalUtilityButtons.tsx`

### musicToggleButton
- **作用**：音乐开关按钮配置
- **按钮样式**：24px图标，统一风格
- **状态显示**：音乐开启/关闭状态图标切换
- **默认值**：开启状态
- **影响点**：用户控制便利性
- **配置/代码位置**：`components/GlobalUtilityButtons.tsx`

### audioContext
- **作用**：Web Audio API上下文配置
- **创建策略**：用户首次交互后创建
- **默认值**：延迟创建
- **影响点**：音频播放兼容性
- **配置/代码位置**：`utils/rendering/soundEffects.ts`

---

## 2. 交互音效配置

### 程序生成音效

#### pieceSelectSound
- **作用**：拼图块选中音效
- **音频参数**：
  - 频率：600Hz
  - 持续时间：0.1s
  - 波形：正弦波
  - 音量：0.3
- **默认值**：如上所示
- **影响点**：交互反馈
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（playPieceSelectSound函数）

#### pieceSnapSound
- **作用**：拼图块吸附音效
- **音频参数**：
  - 频率：880Hz → 440Hz（指数衰减）
  - 持续时间：0.3s
  - 波形：三角波
  - 音量：0.4
- **默认值**：如上所示
- **影响点**：成功反馈
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（playPieceSnapSound函数）

#### rotateSound
- **作用**：拼图块旋转音效
- **音频参数**：
  - 频率：400Hz → 450Hz
  - 持续时间：0.12s
  - 波形：三角波
  - 音量：0.25
- **默认值**：如上所示
- **影响点**：操作反馈
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（playRotateSound函数）

#### buttonClickSound
- **作用**：通用按钮点击音效
- **音频参数**：
  - 频率：440Hz → 220Hz（指数衰减）
  - 持续时间：0.2s
  - 波形：正弦波
  - 音量：0.3
- **默认值**：如上所示
- **影响点**：按钮交互反馈
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（playButtonClickSound函数）


### 真实音频文件音效

#### cutSound
- **作用**：切割形状生成拼图音效
- **文件路径**：`/public/split.mp3`
- **音频参数**：
  - 音量：1.0
  - 播放方式：HTML5 Audio API直接播放
- **优势**：
  - 真实质感：专业录制的切割音效
  - 高品质：比程序生成音效更自然
  - 一致性：每次播放完全相同
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（playCutSound函数）

#### scatterSound
- **作用**：散开拼图音效
- **文件路径**：`/public/scatter.mp3`
- **音频参数**：
  - 音量：1.0
  - 播放方式：HTML5 Audio API直接播放
- **优势**：
  - 真实质感：专业录制的散开音效
  - 高品质：比程序生成音效更自然
  - 一致性：每次播放完全相同
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（playScatterSound函数）

#### finishSound
- **作用**：拼图完成音效（真实音频）
- **文件路径**：`/public/finish.mp3`
- **音频参数**：
  - 音量：0.8
  - 播放方式：HTML5 Audio API直接播放
- **优势**：
  - 真实质感：专业录制的完成音效
  - 高品质：比程序生成音效更自然
  - 一致性：每次播放完全相同
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（playFinishSound函数）

---

## 3. 静态资源配置

### backgroundImage
- **作用**：游戏背景图片配置
- **文件路径**：`public/bg.jpg`
- **图片规格**：高分辨率，支持多种屏幕尺寸
- **加载策略**：预加载，缓存优化
- **默认值**：启用背景图片
- **影响点**：视觉体验、加载性能
- **配置/代码位置**：`public/bg.jpg`、CSS背景配置

### audioFiles
- **作用**：游戏音效文件配置
- **文件列表**：
  - `public/bgm.mp3` - 背景音乐
  - `public/split.mp3` - 切割音效
  - `public/scatter.mp3` - 散开音效
  - `public/finish.mp3` - 完成音效
- **文件格式**：MP3格式，兼容性好
- **文件大小**：优化压缩，平衡质量和大小
- **默认值**：启用所有音效文件
- **影响点**：音效质量、加载速度
- **配置/代码位置**：`public/` 目录

### textureFile
- **作用**：瓷砖气孔材质纹理配置
- **文件路径**：`public/texture-tile.png`
- **用途**：拼图块和目标形状的美术填充
- **图片规格**：PNG格式，支持透明度
- **默认值**：启用材质纹理
- **影响点**：视觉质感、美术效果
- **配置/代码位置**：`public/texture-tile.png`、`utils/rendering/puzzleDrawing.ts`

---

## 4. 音效播放控制配置

### soundEnabled
- **作用**：全局音效开关配置
- **控制范围**：所有交互音效和背景音乐
- **存储方式**：本地存储，记住用户偏好
- **默认值**：true（默认开启）
- **影响点**：用户体验、性能优化
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（全局开关）

### volumeControl
- **作用**：音量控制配置
- **音量范围**：0.0~1.0
- **音量分级**：
  - 背景音乐：0.5
  - 程序生成音效：0.25~0.5
  - 真实音频文件：0.8~1.0
- **默认值**：分级音量设置
- **影响点**：音效平衡、用户体验
- **配置/代码位置**：各音效函数的音量参数

### audioContextManagement
- **作用**：音频上下文管理配置
- **创建时机**：用户首次交互后
- **生命周期**：页面会话期间保持
- **错误处理**：创建失败时的降级处理
- **默认值**：自动管理
- **影响点**：音频播放稳定性
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（上下文管理）

---

## 5. 设备适配配置

### mobileAudioOptimization
- **作用**：移动端音频优化配置
- **优化策略**：
  - 减少同时播放的音效数量
  - 优化音频文件大小
  - 处理移动端音频限制
- **默认值**：移动端启用优化
- **影响点**：移动端音效体验
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（设备检测逻辑）

### touchAudioUnlock
- **作用**：移动端触摸解锁音频配置
- **解锁策略**：首次触摸交互时解锁音频播放
- **兼容性处理**：处理iOS Safari等浏览器限制
- **默认值**：移动端启用
- **影响点**：移动端音频播放能力
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（触摸解锁逻辑）

---

## 6. 性能优化配置

### audioPreloading
- **作用**：音频预加载配置
- **预加载策略**：页面加载时预创建音频上下文
- **缓存机制**：音频缓冲区复用
- **默认值**：启用预加载
- **影响点**：音效响应速度
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（预加载逻辑）

### audioMemoryManagement
- **作用**：音频内存管理配置
- **管理策略**：
  - 及时释放不用的音频资源
  - 限制同时播放的音效数量
  - 避免音频内存泄漏
- **默认值**：启用内存管理
- **影响点**：长期使用的内存稳定性
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（内存管理）

### audioPerformanceMonitoring
- **作用**：音频性能监控配置
- **监控指标**：
  - 音效播放延迟
  - 音频上下文状态
  - 内存使用情况
- **默认值**：开发环境启用
- **影响点**：音效性能优化
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（性能监控）

---

## 7. 错误处理配置

### audioErrorHandling
- **作用**：音频错误处理配置
- **错误类型**：
  - 音频上下文创建失败
  - 音效播放失败
  - 浏览器兼容性问题
- **处理策略**：静默失败，不影响游戏功能
- **默认值**：启用错误处理
- **影响点**：系统稳定性
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（try-catch处理）

### fallbackStrategy
- **作用**：音频降级策略配置
- **降级方案**：
  - 音频不支持时禁用音效
  - 部分音效失败时继续其他音效
  - 提供视觉反馈替代音效
- **默认值**：启用降级策略
- **影响点**：兼容性和用户体验
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（降级逻辑）

---

## 8. 音效系统架构

### 音效类型分类

#### 程序生成音效
- **用途**：简单交互反馈
- **技术**：Web Audio API + 振荡器
- **优势**：轻量级、无文件加载
- **音效列表**：
  - 按钮点击音效
  - 拼图块选择音效
  - 拼图块吸附音效
  - 旋转音效
  - 拼图完成音效（程序生成版本）

#### 真实音频文件音效
- **用途**：重要操作反馈
- **技术**：HTML5 Audio API
- **优势**：高品质、真实感
- **音效列表**：
  - 切割音效
  - 散开音效
  - 完成音效（真实音频版本）

### 音效播放流程

```mermaid
graph TD
    A[用户交互] --> B{音效类型}
    B -->|程序生成| C[创建AudioContext]
    B -->|真实音频| D[创建Audio对象]
    C --> E[生成振荡器]
    D --> F[加载音频文件]
    E --> G[设置频率和音量]
    F --> H[设置播放参数]
    G --> I[播放音效]
    H --> I
    I --> J[错误处理]
    J --> K[完成]
```

---

## 9. 配置示例

### 基础音效配置示例
```typescript
// 音效配置示例
const soundConfig = {
  enabled: true,
  volume: {
    background: 0.5,
    programGenerated: 0.3,
    realAudio: 1.0
  },
  frequencies: {
    select: 600,
    snap: 880,
    rotate: 400,
    buttonClick: 440
  }
};
```

### 高级音效配置示例
```typescript
// 设备适配音效配置
const deviceAudioConfig = {
  mobile: {
    maxConcurrentSounds: 2,
    touchUnlock: true,
    optimizedFiles: true
  },
  desktop: {
    maxConcurrentSounds: 5,
    preloading: true,
    fullQuality: true
  }
};
```

### 音效使用示例
```typescript
import { 
  playButtonClickSound, 
  playCutSound, 
  playRotateSound,
  playScatterSound,
  playFinishSound
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

// 散开拼图操作
const handleScatter = () => {
  playScatterSound();
  scatterPuzzle();
};

// 完成操作
const handleComplete = () => {
  playFinishSound(); // 真实音频版本
};
```

---

## 10. 故障排除

### 常见问题
1. **音效无法播放**：检查音频上下文是否已创建
2. **移动端静音**：确认触摸解锁已触发
3. **音效延迟**：检查音频预加载配置
4. **内存泄漏**：验证音频资源释放逻辑
5. **真实音频文件无法播放**：检查文件路径和格式

### 调试方法
- 检查音频上下文状态
- 监控音效播放日志
- 验证用户交互触发
- 测试不同设备兼容性
- 检查音频文件加载状态

### 测试支持
```bash
# 音效系统测试
npm run test:unit -- --testPathPatterns=soundEffects

# 端到端音效测试
npx playwright test e2e/cut-sound-effect.spec.ts
```

---

> 📖 **相关文档**
> - [视觉与主题配置](./14-visual-theme.md)
> - [触摸事件与交互配置](./18-touch-interaction.md)
> - [性能测试与报告配置](./16-performance-test.md)