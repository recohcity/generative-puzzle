# 媒体资源与音效配置

> 修订日期：2025-07-24 (v1.3.36)

本文档详细说明媒体资源和音效系统的配置参数，包括背景音乐、交互音效、静态资源等核心配置。

---

## 1. 背景音乐配置

### backgroundMusic
- **作用**：背景音乐开关与音量控制
- **取值范围**：布尔（开关）+ 0~1（音量）
- **默认值**：false（静音），0.3（音量）
- **影响点**：用户体验、沉浸感
- **配置/代码位置**：`utils/rendering/soundEffects.ts`、`components/GlobalUtilityButtons.tsx`

### musicToggleButton
- **作用**：音乐开关按钮配置
- **按钮样式**：24px图标，统一风格
- **状态显示**：音乐开启/关闭状态图标切换
- **默认值**：关闭状态
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

### pieceSelectSound
- **作用**：拼图块选中音效
- **音频参数**：
  - 频率：660Hz
  - 持续时间：0.15s
  - 波形：正弦波
  - 音量：0.3
- **默认值**：如上所示
- **影响点**：交互反馈
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（playPieceSelectSound函数）

### pieceSnapSound
- **作用**：拼图块吸附音效
- **音频参数**：
  - 频率：1320Hz
  - 持续时间：0.3s
  - 波形：正弦波
  - 音量：0.4
- **默认值**：如上所示
- **影响点**：成功反馈
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（playPieceSnapSound函数）

### rotateSound
- **作用**：拼图块旋转音效
- **音频参数**：
  - 频率：380Hz
  - 持续时间：0.12s
  - 波形：正弦波
  - 音量：0.25
- **默认值**：如上所示
- **影响点**：操作反馈
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（playRotateSound函数）

### collisionSound
- **作用**：边界碰撞音效（双音调）
- **音频参数**：
  - 低音：120Hz，持续0.15s
  - 高音：240Hz，持续0.1s
  - 波形：正弦波
  - 音量：0.2
- **默认值**：如上所示
- **影响点**：边界反馈
- **配置/代码位置**：`contexts/GameContext.tsx`（边界检测逻辑）

---

## 3. 完成庆祝音效配置

### puzzleCompletedSound
- **作用**：拼图完成音效（音阶序列）
- **音阶配置**：
  - C5：523.25Hz
  - E5：659.25Hz
  - G5：783.99Hz
  - C6：1046.5Hz
- **播放参数**：
  - 间隔：0.1s
  - 持续时间：每个音符0.4s
  - 音量：0.5
- **默认值**：如上所示
- **影响点**：完成庆祝体验
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（playPuzzleCompletedSound函数）

### celebrationSequence
- **作用**：庆祝音效播放序列配置
- **播放策略**：依次播放音阶，创造上升感
- **错误处理**：单个音符失败不影响整体序列
- **默认值**：启用完整序列
- **影响点**：庆祝效果的完整性
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（音阶播放逻辑）

---

## 4. 静态资源配置

### backgroundImage
- **作用**：游戏背景图片配置
- **文件路径**：`public/bg.jpg`
- **图片规格**：高分辨率，支持多种屏幕尺寸
- **加载策略**：预加载，缓存优化
- **默认值**：启用背景图片
- **影响点**：视觉体验、加载性能
- **配置/代码位置**：`public/bg.jpg`、CSS背景配置

### audioFile
- **作用**：游戏音效文件配置
- **文件路径**：`public/puzzle-pieces.mp3`
- **文件格式**：MP3格式，兼容性好
- **文件大小**：优化压缩，平衡质量和大小
- **默认值**：启用音效文件
- **影响点**：音效质量、加载速度
- **配置/代码位置**：`public/puzzle-pieces.mp3`

### textureFile
- **作用**：瓷砖气孔材质纹理配置
- **文件路径**：`public/texture-tile.png`
- **用途**：拼图块和目标形状的美术填充
- **图片规格**：PNG格式，支持透明度
- **默认值**：启用材质纹理
- **影响点**：视觉质感、美术效果
- **配置/代码位置**：`public/texture-tile.png`、`utils/rendering/puzzleDrawing.ts`

---

## 5. 音效播放控制配置

### soundEnabled
- **作用**：全局音效开关配置
- **控制范围**：所有交互音效和背景音乐
- **存储方式**：本地存储，记住用户偏好
- **默认值**：false（默认静音）
- **影响点**：用户体验、性能优化
- **配置/代码位置**：`utils/rendering/soundEffects.ts`（全局开关）

### volumeControl
- **作用**：音量控制配置
- **音量范围**：0.0~1.0
- **音量分级**：
  - 背景音乐：0.3
  - 交互音效：0.2~0.5
  - 庆祝音效：0.5
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

## 6. 设备适配配置

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

## 7. 性能优化配置

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

## 8. 错误处理配置

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

## 9. 配置示例

### 基础音效配置示例
```typescript
// 音效配置示例
const soundConfig = {
  enabled: false,
  volume: {
    background: 0.3,
    interaction: 0.3,
    celebration: 0.5
  },
  frequencies: {
    select: 660,
    snap: 1320,
    rotate: 380,
    collision: [120, 240]
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

---

## 10. 故障排除

### 常见问题
1. **音效无法播放**：检查音频上下文是否已创建
2. **移动端静音**：确认触摸解锁已触发
3. **音效延迟**：检查音频预加载配置
4. **内存泄漏**：验证音频资源释放逻辑

### 调试方法
- 检查音频上下文状态
- 监控音效播放日志
- 验证用户交互触发
- 测试不同设备兼容性

---

> 📖 **相关文档**
> - [视觉与主题配置](./14-visual-theme.md)
> - [触摸事件与交互配置](./18-touch-interaction.md)
> - [性能测试与报告配置](./16-performance-test.md)