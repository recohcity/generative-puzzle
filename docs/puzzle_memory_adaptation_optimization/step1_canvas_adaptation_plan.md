# 步骤1：全局画布适配——方案与优化任务清单

## 目标
- 以**右侧可视画布为主角**，在不同终端下最大化利用空间，保证画布为正方形，适配规则如下：
  - 桌面端：画布正方形，最大化利用浏览器窗口高度，上下各留40px边距，左侧面板高度与画布一致。
  - 移动端竖屏：上下结构，正方形画布居上，tab面板居下，画布上下左右各10px边距。
  - 移动端横屏：左右结构，tab面板居左，正方形画布居右，画布上下左右各10px边距。

## 关键实现路径与细节

### 1. 画布与面板的自适应布局规则
- **桌面端**：
  - 画布边长 = min(window.innerHeight - 80, window.innerWidth - 面板宽度 - 40)
  - 画布容器：margin-top/bottom: 40px，居右，正方形
  - 左侧面板高度 = 画布高度
- **移动端竖屏**：
  - 画布边长 = min(window.innerWidth - 20, window.innerHeight - 面板高度 - 20)
  - 画布容器：margin: 10px auto 0 auto，正方形
  - tab面板居下，宽度100%
- **移动端横屏**：
  - 画布边长 = min(window.innerHeight - 20, window.innerWidth - 面板宽度 - 20)
  - 画布容器：margin: 10px，正方形
  - tab面板居左，高度=画布高度
- **所有端**：
  - 画布和面板的边距、间隔、圆角、阴影等均用固定px，保证像素级一致性。

### 2. 状态集中管理与驱动
- 画布尺寸、scale、orientation、previousCanvasSize 等状态全部集中存储于 GameContext。
- PuzzleCanvas 只需 100% 适配父容器，所有自适应逻辑交由父容器处理。
- 画布状态变化后，自动驱动下游适配（如目标形状、拼图块等）。

### 3. 响应式监听与原子更新
- 监听 window.resize、orientationchange、ResizeObserver。
- 用 requestAnimationFrame 节流，防止高频重绘。
- 每次变化时，先记录 previousCanvasSize，再原子性更新所有画布相关状态。
- 画布变化后，拼图块、目标形状等内容同步适配，无历史问题复现。

### 4. 桌面端/移动端的边界条件与切换阈值
- 桌面端面板和画布的极限最小高度定为 **560px**，小于560px时自动切换为移动端适配排版。
- 极端小屏/超窄屏下，画布和面板自动收缩，优先保证安全区和内容可见。
- 面板宽度有最小值（如280px），画布边长有最小值（如320px）。

### 5. 主要实现流程图（Mermaid）

```mermaid
flowchart TD
    A[窗口尺寸变化/初始化] --> B{判断终端类型}
    B -- 桌面端 --> C[计算面板宽度]
    C --> D[计算画布最大边长]
    D --> E[主容器设置四周安全区]
    E --> F[面板高度与画布同步]
    F --> G[画布容器设置宽高]
    G --> H[PuzzleCanvas 100%适配父容器]
    B -- 移动端 --> I[切换为上下结构/Tab面板]
    I --> J[画布边长=min(宽-边距, 高-面板-边距)]
    J --> K[主容器设置10px安全区]
    K --> L[画布/面板自适应]
```

### 6. 典型代码片段说明

#### 桌面端极致适配
```tsx
const minEdgeMargin = 10;           // 顶部/左/右安全区
const bottomSafeMargin = 60;        // 底部安全区（可调）
const panelWidth = 350;             // 面板固定宽度
const canvasPanelGap = 10;          // 面板与画布间距

const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

// 计算可用宽高
let availableWidth = windowWidth - 2 * minEdgeMargin - panelWidth - canvasPanelGap;
let availableHeight = windowHeight - minEdgeMargin - bottomSafeMargin;

// 画布边长极限适配
const canvasSizeFinal = Math.max(320, Math.min(availableHeight, availableWidth));

// 面板高度与画布同步
const panelHeight = canvasSizeFinal;
```

#### 移动端竖屏/横屏适配
```tsx
// 竖屏
const canvasSize = Math.min(window.innerWidth - 20, window.innerHeight - panelHeight - 20);
// 横屏
const canvasSize = Math.min(window.innerHeight - 20, window.innerWidth - panelWidth - 20);
```

#### PuzzleCanvas 只需100%适配父容器
```tsx
<div style={{ width: canvasSizeFinal, height: canvasSizeFinal }}>
  <PuzzleCanvas />
</div>
```

#### GameContext 集中管理画布状态
```ts
const initialState: GameState = {
  ...
  canvasWidth: 0,
  canvasHeight: 0,
  scale: 1,
  orientation: 'portrait',
  previousCanvasSize: { width: 0, height: 0 },
  ...
}
```

#### 监听与驱动
```ts
useEffect(() => {
  const handleResize = () => {
    // 计算新尺寸，dispatch 更新 GameContext
  };
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  };
}, []);
```

---

### 7. 移动端 Tab 面板的集中管理与适配

- **全局状态管理**：
  - 移动端 tab 当前激活项（如 shape/puzzle/cut/scatter/controls）由 PhoneTabPanel 组件集中管理，通常用 useState 或全局 context 存储 activeTab。
  - tab 切换时，activeTab 状态驱动内容区的切换，所有 tab 内容组件（如 ShapeControls、PuzzleControlsCutType、PuzzleControlsCutCount、PuzzleControlsScatter、控制按钮区）均为独立子组件，按需渲染。

- **像素级布局与自适应**：
  - tab 区域与内容区的左右/上下间距、按钮高度、字号、iconSize 等均用常量集中定义，保证所有 tab 内容在不同屏幕下像素级一致。
  - tab 按钮与内容区分离，tab 按钮横向等宽分布，内容区自适应宽度，最大化利用面板空间。
  - tab 区域与面板边缘的间隔（如 2px）可通过常量灵活调整。

- **tab切换与下游状态驱动**：
  - tab 切换时，相关内容组件（如形状按钮、切割类型按钮等）会自动读取全局 GameContext 状态，保证切换 tab 时状态不丢失、不残留。
  - tab 切换可触发下游逻辑（如 goToNextTab、goToFirstTab），实现流程引导和交互联动。
  - 例如，切割类型、切割次数、拼图操作等均可在 tab 切换时自动同步全局状态，避免本地 useState 造成的状态丢失。

- **tab面板与画布的联动适配**：
  - tab 面板高度、内容区布局与画布高度联动，保证竖屏/横屏下内容不溢出。
  - tab 面板与画布均为正方形自适应，tab 内容区高度可根据内容动态调整。

- **典型实现结构**：
  ```tsx
  // PhoneTabPanel.tsx
  const [activeTab, setActiveTab] = useState<'shape'|'puzzle'|'cut'|'scatter'|'controls'>('shape');
  // ...
  <div className={PANEL_CLASS}>
    <div className="tab-bar">{tab按钮}</div>
    <div className="tab-content">
      {activeTab === 'shape' && <ShapeControls ... />}
      {activeTab === 'puzzle' && <PuzzleControlsCutType ... />}
      {activeTab === 'cut' && <PuzzleControlsCutCount ... />}
      {activeTab === 'scatter' && <PuzzleControlsScatter ... />}
      {activeTab === 'controls' && <...控制按钮区... />}
    </div>
  </div>
  ```

- **交互与体验**：
  - tab 切换流畅，内容区无闪烁、无错位。
  - 所有按钮、内容区、提示信息等均与桌面端风格一致，保证体验统一。

---

## 8. 移动端按钮active卡住的彻底解决方案

- **问题现象**：移动端（如iOS/微信内嵌）在tab切换（如“重新开始”自动跳到形状tab）时，若手指未离开屏幕，浏览器会把active伪类带到新tab下同一位置的按钮，导致按钮卡住“按下”状态，只有点击其它地方才会释放。

- **原理分析**：
  - 移动端浏览器的:active伪类由touch事件驱动，blur()只能影响focus，不能影响:active。
  - tab切换时，DOM结构变化但手指未离开，active会直接作用于新tab同一位置的按钮。

- **最佳实践**：
  - 在tab切换（如goToFirstTab）后，立即将所有button的pointer-events设为none，100ms后恢复为auto。
  - 这样可彻底阻断active伪类被带到新tab按钮，防止“卡住按下”现象。

- **典型代码片段**：
  ```tsx
  // PhoneTabPanel.tsx
  const handleRestart = () => {
    resetGame();
    if (goToFirstTab) goToFirstTab();
    setTimeout(() => {
      document.querySelectorAll('button').forEach(btn => {
        btn.style.pointerEvents = 'none';
      });
      setTimeout(() => {
        document.querySelectorAll('button').forEach(btn => {
          btn.style.pointerEvents = '';
        });
      }, 100);
    }, 0);
  };
  ```

- **适用场景**：所有移动端tab切换、动态内容切换、按钮组切换等场景，均可用此法防止active卡住。

- **经验总结**：
  - 该方案兼容所有主流移动端浏览器，无副作用，不影响桌面端体验。
  - 如遇极端交互bug，优先考虑pointer-events方案屏蔽active残留。

---

## 已完成的适配内容
- [x] 桌面端正方形画布最大化适配，面板高度与画布同步。
- [x] 移动端竖屏/横屏正方形画布适配，tab面板与画布排版自适应。
- [x] 画布状态（canvasWidth、canvasHeight、scale、orientation、previousCanvasSize）集中管理于 GameContext。
- [x] 监听 window.resize、orientationchange、ResizeObserver，节流处理。
- [x] 每次尺寸/方向变化时，原子性更新所有画布相关状态。
- [x] 画布状态变化后自动驱动下游适配（如 usePuzzleAdaptation）。
- [x] 极端尺寸和方向切换场景下，画布内容始终可见、不溢出、不变形。
- [x] 桌面端/移动端临界值（560px）自动切换/适配逻辑方案已明确。
- [x] 关键流程、参数、适配假设补充详细注释，文档说明画布适配流程、归一化原则和异常处理策略。

---

> 如后续有新需求或极端场景，优先以本方案为准，持续 review 与测试。 