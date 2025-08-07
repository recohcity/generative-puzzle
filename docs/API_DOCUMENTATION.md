# 📚 API 文档

## 📋 文档概述

**文档版本**: v2.1  
**更新时间**: 2025年8月7日  
**API总数**: 151个  
**文档覆盖率**: 21.2% (基于最新扫描结果)  

本文档基于最新API扫描结果更新，涵盖项目中所有导出的API接口。

---

## 🚀 快速导航

### 📖 按分类浏览
- **[配置管理API](#配置管理api)** - 39个API
- **[核心管理器API](#核心管理器api)** - 26个API  
- **[React Hooks API](#react-hooks-api)** - 18个API
- **[工具函数API](#工具函数api)** - 67个API

### 🔍 按功能搜索
- **设备检测**: `DeviceManager`, `IPHONE16_MODELS`, `DeviceState`, `useDeviceType`
- **适配系统**: `DESKTOP_ADAPTATION`, `MOBILE_ADAPTATION`, `useMobileAdaptation`, `centerShapeInCanvas`
- **画布管理**: `CanvasManager`, `useCanvasLogger`, `drawCanvasBorderLine`
- **拼图逻辑**: `PuzzleGenerator`, `ScatterPuzzle`, `splitPieceWithLine`, `usePuzzleInteractions`
- **渲染系统**: `drawPuzzle`, `RenderOptimizer`, `drawShape`, `drawHintOutline`
- **音效系统**: `playPieceSelectSound`, `playPuzzleCompletedSound`, `playRotateSound`
- **日志系统**: `LoggingService`, `adaptationLogger`, `puzzleLogger`, `debugLogger`
- **错误处理**: `ErrorHandlingService`, `ErrorMonitoringService`, `ValidationService`

---

## 🔧 配置管理API

### 性能配置
```typescript
// 事件配置
export const EVENT_CONFIG: {
  debounceDelay: number;
  throttleDelay: number;
  maxEventQueue: number;
}

// 内存配置  
export const MEMORY_CONFIG: {
  maxCacheSize: number;
  gcThreshold: number;
  cleanupInterval: number;
}

// 性能阈值
export const PERFORMANCE_THRESHOLDS: {
  maxRenderTime: number;
  maxMemoryUsage: number;
  minFPS: number;
}

// 优化标志
export const OPTIMIZATION_FLAGS: {
  enableBatching: boolean;
  enableCaching: boolean;
  enableCompression: boolean;
}

// 浏览器支持配置
export const BROWSER_SUPPORT: {
  minChrome: number;
  minFirefox: number;
  minSafari: number;
}
```

### 设备配置
```typescript
// iPhone 16 系列配置
export const IPHONE16_MODELS: {
  'iPhone16': { width: number; height: number };
  'iPhone16Plus': { width: number; height: number };
  'iPhone16Pro': { width: number; height: number };
  'iPhone16ProMax': { width: number; height: number };
}

// 检测配置
export const DETECTION_CONFIG: {
  enableUserAgentDetection: boolean;
  enableScreenSizeDetection: boolean;
  enableTouchDetection: boolean;
}

// 大屏幕阈值
export const LARGE_SCREEN_THRESHOLDS: {
  width: number;
  height: number;
  aspectRatio: number;
}

// 设备类型定义
export type LayoutMode = 'desktop' | 'portrait' | 'landscape';
export type iPhone16Model = keyof typeof IPHONE16_MODELS;

// 设备状态接口
export interface DeviceState {
  type: 'desktop' | 'tablet' | 'mobile';
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}
```

### 适配配置
```typescript
// 桌面端适配配置
export const DESKTOP_ADAPTATION: {
  MIN_CANVAS_SIZE: number;
  MAX_CANVAS_SIZE: number;
  CANVAS_MARGIN: number;
  PANEL_WIDTH: number;
}

// 移动端适配配置
export const MOBILE_ADAPTATION: {
  MIN_CANVAS_SIZE: number;
  MAX_CANVAS_SIZE: number;
  TOUCH_PADDING: number;
  SAFE_AREA_MARGIN: number;
}

// iPhone 16 优化配置
export const IPHONE16_OPTIMIZATION: {
  DYNAMIC_ISLAND_HEIGHT: number;
  SAFE_AREA_TOP: number;
  SAFE_AREA_BOTTOM: number;
}

// 高分辨率移动设备配置
export const HIGH_RESOLUTION_MOBILE: {
  PIXEL_RATIO_THRESHOLD: number;
  SCALE_FACTOR: number;
}

// 画布安全配置
export const CANVAS_SAFETY: {
  MIN_SIZE: number;
  MAX_SIZE: number;
  MARGIN: number;
}
export const IPHONE16_OPTIMIZATION: {
  dynamicViewport: boolean;
  safeAreaInsets: boolean;
  highRefreshRate: boolean;
}
```

### 日志配置
```typescript
// 开发环境日志配置
export const DEVELOPMENT_LOGGING_CONFIG: LoggingConfig;

// 生产环境日志配置  
export const PRODUCTION_LOGGING_CONFIG: LoggingConfig;

// 获取当前日志配置
export function getLoggingConfig(): LoggingConfig;
```

---

## ⚙️ 核心管理器API

### 验证服务
```typescript
// 验证规则接口
export interface ValidationRule<T = any> {
  name: string;
  validate: (value: T) => boolean;
  message: string;
}

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

### 错误处理服务
```typescript
// 错误上下文接口
export interface ErrorContext {
  component: string;
  action: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

// 错误报告接口
export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recovered: boolean;
}
```

### 事件调度器
```typescript
// 事件调度器类
export class EventScheduler {
  schedule(callback: () => void, delay: number): string;
  cancel(id: string): boolean;
  clear(): void;
}
```

### 尺寸观察器管理器
```typescript
// 尺寸观察器管理器类
export class ResizeObserverManager {
  observe(element: Element, callback: ResizeObserverCallback): void;
  unobserve(element: Element): void;
  disconnect(): void;
}
```

---

## ⚛️ React Hooks API

### 设备检测Hook
```typescript
// 设备检测Hook
export function useDeviceDetection(): DeviceDetectionState;

interface DeviceDetectionState {
  deviceType: DeviceType;
  layoutMode: LayoutMode;
  isMobile: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
  isIOS: boolean;
  isAndroid: boolean;
}
```

### 移动端适配Hook
```typescript
// 移动端适配Hook
export function useMobileAdaptation(
  options: UseMobileAdaptationOptions = {}
): MobileAdaptationHookResult;

interface MobileAdaptationHookResult {
  deviceInfo: DeviceDetectionState;
  enhancements: MobileEnhancementState;
  isKeyboardVisible: boolean;
  networkStatus: 'online' | 'offline';
}
```

### 画布交互Hook
```typescript
// 拼图交互Hook
export function usePuzzleInteractions({
  canvasRef,
  pieces,
  onPieceMove,
  onPieceRotate,
  onPieceSnap
}: PuzzleInteractionOptions): PuzzleInteractionHandlers;
```

### 响应式画布尺寸Hook
```typescript
// 响应式画布尺寸Hook
export function useResponsiveCanvasSizing({
  containerRef,
  aspectRatio,
  minSize,
  maxSize
}: ResponsiveCanvasOptions): CanvasSizeResult;
```

### 移动端增强Hook
```typescript
// 移动端增强Hook
export function useMobileEnhancements(
  callbacks: MobileEnhancementCallbacks = {}
): MobileEnhancementState;

// 键盘检测Hook
export function useKeyboardDetection(): boolean;

// 网络状态Hook
export function useNetworkStatus(): 'online' | 'offline';

// 设备旋转Hook
export function useDeviceRotation(callbacks?: {
  onRotate?: (orientation: string) => void;
}): string;
```

### 调试工具Hook
```typescript
// 调试开关Hook
export function useDebugToggle(): [boolean, (v: boolean) => void];
```

---

## 🛠️ 工具函数API

### 几何计算
```typescript
// 点接口定义
export interface Point {
  x: number;
  y: number;
  isOriginal?: boolean;
}

// 计算中心点
export const calculateCenter: (points: Point[]) => Point;

// 点在多边形内判断
export function isPointInPolygon(
  x: number, 
  y: number, 
  polygon: Point[]
): boolean;

// 旋转点
export function rotatePoint(
  x: number, y: number, 
  cx: number, cy: number, 
  angle: number
): Point;

// 计算角度
export function calculateAngle(
  x1: number, y1: number, 
  x2: number, y2: number
): number;

// 计算拼图块边界
export function calculatePieceBounds(piece: { points: Point[] }): {
  minX: number; maxX: number; minY: number; maxY: number;
  width: number; height: number;
  centerX: number; centerY: number;
};
```

### 形状适配工具
```typescript
// 画布尺寸接口
export interface CanvasSize {
  width: number;
  height: number;
}

// 适配选项接口
export interface AdaptationOptions {
  preserveAspectRatio?: boolean;
  centerShape?: boolean;
  scaleToFit?: boolean;
}

// 形状适配到画布
export function adaptShapeToCanvas(
  originalShape: Point[],
  oldSize: CanvasSize,
  newSize: CanvasSize,
  options: AdaptationOptions = {}
): Point[];

// 检查形状是否在边界内
export function isShapeInBounds(
  shape: Point[],
  canvasSize: CanvasSize,
  margin: number = 0
): boolean;
```

### 拼图生成器
```typescript
// 拼图生成器类
export class PuzzleGenerator {
  constructor(config: PuzzleConfig);
  generatePuzzle(shape: Point[], difficulty: number): PuzzlePiece[];
  generateCuts(shape: Point[], count: number): CutLine[];
}

// 散布拼图类
export class ScatterPuzzle {
  constructor(pieces: PuzzlePiece[], canvasSize: CanvasSize);
  scatter(options: ScatterOptions): PuzzlePiece[];
  checkCollisions(): boolean;
}
```

### 渲染工具
```typescript
// 拼图块接口
export interface PuzzlePiece {
  id: string;
  points: Point[];
  position: Point;
  rotation: number;
  isPlaced: boolean;
  originalPosition: Point;
}

// 绘制形状
export const drawShape: (
  ctx: CanvasRenderingContext2D,
  shape: Point[],
  shapeType: string
) => void;

// 绘制拼图块
export const drawPiece: (
  ctx: CanvasRenderingContext2D,
  piece: PuzzlePiece,
  options: DrawOptions
) => void;

// 绘制完整拼图
export const drawPuzzle: (
  ctx: CanvasRenderingContext2D,
  pieces: PuzzlePiece[],
  options: PuzzleDrawOptions
) => void;

// 渲染优化器
export const renderOptimizer: RenderOptimizer;
```

### 音效系统
```typescript
// 初始化背景音乐
export const initBackgroundMusic: () => void;

// 切换背景音乐
export const toggleBackgroundMusic: () => Promise<boolean>;

// 获取背景音乐状态
export const getBackgroundMusicStatus: () => boolean;

// 播放按钮点击音效
export const playButtonClickSound: () => Promise<void>;

// 播放拼图块选择音效
export const playPieceSelectSound: () => Promise<void>;

// 播放拼图块吸附音效
export const playPieceSnapSound: () => Promise<void>;

// 播放拼图完成音效
export const playPuzzleCompletedSound: () => Promise<void>;

// 播放旋转音效
export const playRotateSound: () => Promise<void>;
```

### 日志系统
```typescript
// 设备日志器
export const deviceLogger: Logger;

// 适配日志器
export const adaptationLogger: Logger;

// 拼图日志器
export const puzzleLogger: Logger;

// 画布日志器
export const canvasLogger: Logger;

// 事件日志器
export const eventLogger: Logger;

// 性能日志器
export const performanceLogger: {
  startTiming: (label: string) => void;
  endTiming: (label: string) => number;
  logMemoryUsage: () => void;
  logFPS: (fps: number) => void;
};

// 调试日志器
export const debugLogger: {
  log: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: Error) => void;
};

// 错误日志器
export const errorLogger: {
  logError: (error: Error, context?: any) => void;
  logWarning: (message: string, context?: any) => void;
  logInfo: (message: string, context?: any) => void;
};
```

### 常量定义
```typescript
// 屏幕尺寸常量
export const MIN_SCREEN_WIDTH: number;
export const MIN_SCREEN_HEIGHT: number;

// 形状尺寸常量
export const MIN_SHAPE_DIAMETER: number;
export const MAX_SHAPE_DIAMETER: number;
export const MIN_SHAPE_AREA: number;
```

---

## 📊 使用示例

### 基础设备检测
```typescript
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

function MyComponent() {
  const device = useDeviceDetection();
  
  return (
    <div>
      <p>设备类型: {device.deviceType}</p>
      <p>是否移动端: {device.isMobile ? '是' : '否'}</p>
      <p>屏幕尺寸: {device.screenWidth}×{device.screenHeight}</p>
    </div>
  );
}
```

### 移动端适配
```typescript
import { useMobileAdaptation } from '@/hooks/useMobileAdaptation';

function PuzzleComponent() {
  const { deviceInfo, enhancements, isKeyboardVisible } = useMobileAdaptation({
    onOrientationChange: (orientation) => {
      console.log('设备方向变化:', orientation);
    },
    onKeyboardToggle: (visible) => {
      console.log('键盘状态:', visible ? '显示' : '隐藏');
    }
  });
  
  return (
    <div style={{
      padding: enhancements.safeAreaInsets ? '20px' : '10px',
      fontSize: deviceInfo.isMobile ? '14px' : '16px'
    }}>
      {/* 拼图内容 */}
    </div>
  );
}
```

### 画布交互处理
```typescript
import { usePuzzleInteractions } from '@/hooks/usePuzzleInteractions';

function PuzzleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  
  const interactions = usePuzzleInteractions({
    canvasRef,
    pieces,
    onPieceMove: (pieceId, newPosition) => {
      setPieces(prev => prev.map(piece => 
        piece.id === pieceId 
          ? { ...piece, position: newPosition }
          : piece
      ));
    },
    onPieceRotate: (pieceId, rotation) => {
      setPieces(prev => prev.map(piece => 
        piece.id === pieceId 
          ? { ...piece, rotation }
          : piece
      ));
    }
  });
  
  return <canvas ref={canvasRef} {...interactions} />;
}
```

### 形状适配
```typescript
import { adaptShapeToCanvas } from '@/utils/shape/shapeAdaptationUtils';

function adaptPuzzleShape(originalShape: Point[], newCanvasSize: CanvasSize) {
  const adaptedShape = adaptShapeToCanvas(
    originalShape,
    { width: 800, height: 600 }, // 原始尺寸
    newCanvasSize,
    {
      preserveAspectRatio: true,
      centerShape: true,
      scaleToFit: true
    }
  );
  
  return adaptedShape;
}
```

### 音效控制
```typescript
import { 
  toggleBackgroundMusic, 
  playPieceSnapSound,
  playPuzzleCompletedSound 
} from '@/utils/rendering/soundEffects';

function GameControls() {
  const handleMusicToggle = async () => {
    const isPlaying = await toggleBackgroundMusic();
    console.log('背景音乐:', isPlaying ? '播放中' : '已暂停');
  };
  
  const handlePieceSnap = async () => {
    await playPieceSnapSound();
  };
  
  const handlePuzzleComplete = async () => {
    await playPuzzleCompletedSound();
  };
  
  return (
    <div>
      <button onClick={handleMusicToggle}>切换背景音乐</button>
      <button onClick={handlePieceSnap}>播放吸附音效</button>
      <button onClick={handlePuzzleComplete}>播放完成音效</button>
    </div>
  );
}
```

---

## 🔧 配置使用

### 适配配置
```typescript
import { MOBILE_ADAPTATION, DESKTOP_ADAPTATION } from '@/src/config/adaptationConfig';

// 根据设备类型获取适配配置
function getAdaptationConfig(deviceType: DeviceType) {
  return deviceType === 'mobile' 
    ? MOBILE_ADAPTATION 
    : DESKTOP_ADAPTATION;
}
```

### 性能配置
```typescript
import { PERFORMANCE_THRESHOLDS, EVENT_CONFIG } from '@/src/config/performanceConfig';

// 检查性能是否达标
function checkPerformance(renderTime: number, memoryUsage: number) {
  return {
    renderOK: renderTime <= PERFORMANCE_THRESHOLDS.maxRenderTime,
    memoryOK: memoryUsage <= PERFORMANCE_THRESHOLDS.maxMemoryUsage
  };
}
```

---

## 🐛 故障排除

### 常见问题

#### 1. 设备检测不准确
```typescript
// 检查设备检测配置
import { DEVICE_THRESHOLDS } from '@/src/config/deviceConfig';
console.log('设备检测阈值:', DEVICE_THRESHOLDS);
```

#### 2. 适配效果不理想
```typescript
// 调整适配参数
import { MOBILE_ADAPTATION } from '@/src/config/adaptationConfig';
const customConfig = {
  ...MOBILE_ADAPTATION,
  canvasScale: 0.85, // 调整画布缩放比例
  minPieceSize: 50   // 调整最小拼图块尺寸
};
```

#### 3. 性能问题
```typescript
// 启用性能监控
import { performanceLogger } from '@/utils/logger';

performanceLogger.startTiming('render');
// 渲染代码
const renderTime = performanceLogger.endTiming('render');
performanceLogger.logFPS(60);
```

---

## 📈 版本历史

### v1.0 (2025-08-04)
- ✅ 初始版本发布
- ✅ 涵盖148个API接口
- ✅ 完整的分类和示例
- ✅ 基于自动扫描生成

---

## 📚 相关文档

- **[当前适配系统](./CURRENT_ADAPTATION_SYSTEM.md)** - 适配系统技术方案
- **[项目结构](./project_structure.md)** - 完整的项目架构
- **[配置指南](./configuration/)** - 详细配置说明
- **[快速开始](./GETTING_STARTED.md)** - 项目上手指南

---

*📝 文档维护: 本文档基于自动API扫描生成，定期更新*  
*🔄 最后更新: 2025年18月4日*  
*📊 API覆盖率: 100% (148/148)*
### 日
志配置
```typescript
// 开发环境日志配置
export const DEVELOPMENT_LOGGING_CONFIG: LoggingConfig;

// 生产环境日志配置
export const PRODUCTION_LOGGING_CONFIG: LoggingConfig;

// 测试环境日志配置
export const TESTING_LOGGING_CONFIG: LoggingConfig;

// 获取日志配置
export function getLoggingConfig(): LoggingConfig;

// 组件上下文
export const COMPONENT_CONTEXTS: {
  ADAPTATION_ENGINE: string;
  PUZZLE_SERVICE: string;
  CANVAS_MANAGER: string;
  EVENT_MANAGER: string;
}

// 日志模式
export const LOG_PATTERNS: {
  ERROR: RegExp;
  WARNING: RegExp;
  INFO: RegExp;
  DEBUG: RegExp;
}
```

### 统一配置
```typescript
// 统一配置对象
export const UNIFIED_CONFIG: {
  performance: typeof PERFORMANCE_THRESHOLDS;
  device: typeof DETECTION_CONFIG;
  adaptation: typeof DESKTOP_ADAPTATION;
  logging: LoggingConfig;
}

// 配置验证
export function validateConfig(): boolean;

// 配置信息获取
export function getConfigInfo(): {
  version: string;
  environment: string;
  features: string[];
}
```

---

## 🏗️ 核心管理器API

### 设备管理器
```typescript
export class DeviceManager {
  // 获取设备信息
  static getDeviceInfo(): DeviceState;
  
  // 检测设备类型
  static detectDeviceType(): 'desktop' | 'tablet' | 'mobile';
  
  // 检测iPhone 16系列
  static detectiPhone16(): iPhone16Detection;
  
  // 获取屏幕信息
  static getScreenInfo(): {
    width: number;
    height: number;
    pixelRatio: number;
  }
}

export class DeviceLayoutManager {
  // 计算布局模式
  static calculateLayoutMode(deviceState: DeviceState): LayoutMode;
  
  // 获取安全区域
  static getSafeArea(deviceState: DeviceState): {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }
  
  // 计算画布尺寸
  static calculateCanvasSize(deviceState: DeviceState): {
    width: number;
    height: number;
  }
}
```

### 画布管理器
```typescript
export class CanvasManager {
  // 创建画布上下文
  static createCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D;
  
  // 设置画布尺寸
  static setCanvasSize(canvas: HTMLCanvasElement, width: number, height: number): void;
  
  // 清理画布
  static clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void;
  
  // 优化画布性能
  static optimizeCanvas(canvas: HTMLCanvasElement): void;
}
```

### 错误处理服务
```typescript
export class ErrorHandlingService {
  // 处理错误
  static handleError(error: Error, context: ErrorContext): void;
  
  // 生成错误报告
  static generateErrorReport(error: Error): ErrorReport;
  
  // 执行恢复策略
  static executeRecoveryStrategy(strategy: ErrorRecoveryStrategy): Promise<boolean>;
}

export class ErrorMonitoringService {
  // 开始监控
  static startMonitoring(config: MonitoringConfig): void;
  
  // 停止监控
  static stopMonitoring(): void;
  
  // 获取错误指标
  static getErrorMetrics(): ErrorMetrics;
  
  // 检查告警条件
  static checkAlertConditions(): MonitoringAlert[];
}
```

### 验证服务
```typescript
export class ValidationService {
  // 添加验证规则
  static addRule<T>(name: string, rule: ValidationRule<T>): void;
  
  // 验证数据
  static validate<T>(data: T, schema: ValidationSchema): ValidationResult;
  
  // 批量验证
  static validateBatch<T>(items: T[], schema: ValidationSchema): ValidationResult[];
}
```

### 日志服务
```typescript
export class LoggingService {
  // 创建日志器
  createLogger(context: string): Logger;
  
  // 记录日志
  log(level: LogLevel, message: string, context: LogContext): void;
  
  // 获取日志历史
  getLogHistory(filter?: LogFilter): LogEntry[];
}
```

### 事件管理器
```typescript
export class EventManager {
  // 注册事件监听器
  static addEventListener(event: string, handler: EventHandler): void;
  
  // 移除事件监听器
  static removeEventListener(event: string, handler: EventHandler): void;
  
  // 触发事件
  static emit(event: string, data?: any): void;
  
  // 批量处理事件
  static processBatch(events: Event[]): void;
}

export class EventScheduler {
  // 调度事件
  static schedule(event: ScheduledEvent): void;
  
  // 取消调度
  static cancel(eventId: string): void;
  
  // 获取调度状态
  static getScheduleStatus(): ScheduleStatus;
}
```

### 尺寸观察器管理器
```typescript
export class ResizeObserverManager {
  // 观察元素尺寸变化
  static observe(element: Element, callback: ResizeCallback): void;
  
  // 停止观察
  static unobserve(element: Element): void;
  
  // 获取观察状态
  static getObserverStatus(): ObserverStatus;
}
```

---

## ⚛️ React Hooks API

### 拼图交互Hook
```typescript
export function usePuzzleInteractions(props: UsePuzzleInteractionsProps): {
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseMove: (event: React.MouseEvent) => void;
  handleMouseUp: (event: React.MouseEvent) => void;
  handleTouchStart: (event: React.TouchEvent) => void;
  handleTouchMove: (event: React.TouchEvent) => void;
  handleTouchEnd: (event: React.TouchEvent) => void;
}
```

### 移动端增强Hook
```typescript
export interface MobileEnhancementState {
  isKeyboardVisible: boolean;
  networkStatus: 'online' | 'offline';
  deviceOrientation: 'portrait' | 'landscape';
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface MobileEnhancementCallbacks {
  onKeyboardShow?: () => void;
  onKeyboardHide?: () => void;
  onNetworkChange?: (status: 'online' | 'offline') => void;
  onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
}

export function useMobileEnhancements(callbacks?: MobileEnhancementCallbacks): MobileEnhancementState;

// 专用Hook
export function useKeyboardDetection(): boolean;
export function useNetworkStatus(): 'online' | 'offline';
export function useDeviceRotation(callbacks?: {
  onRotationStart?: () => void;
  onRotationEnd?: () => void;
}): 'portrait' | 'landscape';
```

### 移动端适配Hook
```typescript
export interface UseMobileAdaptationOptions extends MobileEnhancementCallbacks {
  enableAutoRotation?: boolean;
  enableKeyboardAdjustment?: boolean;
  enableNetworkOptimization?: boolean;
}

export interface MobileAdaptationHookResult {
  deviceType: 'desktop' | 'tablet' | 'mobile';
  orientation: 'portrait' | 'landscape';
  isKeyboardVisible: boolean;
  networkStatus: 'online' | 'offline';
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export function useMobileAdaptationProvider(): MobileAdaptationHookResult;

// 专用Hook
export function useDeviceType(): 'desktop' | 'tablet' | 'mobile';
export function useOrientation(): 'portrait' | 'landscape';
export function useKeyboard(): {
  isVisible: boolean;
  height: number;
};
```

### 调试Hook
```typescript
export function useDebugToggle(): [boolean, (value: boolean) => void];
```

### Toast Hook
```typescript
export const reducer: (state: State, action: Action) => State;
```

---

## 🛠️ 工具函数API

### 日志工具
```typescript
// 专用日志器
export const adaptationLogger: Logger;
export const puzzleLogger: Logger;
export const canvasLogger: Logger;
export const eventLogger: Logger;
export const useCanvasLogger: Logger;
export const useCanvasSizeLogger: Logger;
export const useCanvasRefsLogger: Logger;
export const useCanvasEventsLogger: Logger;

// 日志器集合
export const loggers: {
  adaptation: Logger;
  puzzle: Logger;
  canvas: Logger;
  event: Logger;
}

// 调试日志器
export const debugLogger: {
  log: (message: string, data?: any) => void;
  error: (message: string, error?: Error) => void;
  warn: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
}

// 错误日志器
export const errorLogger: {
  logError: (error: Error, context?: string) => void;
  logWarning: (message: string, context?: string) => void;
  getErrorHistory: () => ErrorLog[];
}

// 日志统计
export const loggingStats: {
  getTotalLogs: () => number;
  getLogsByLevel: (level: LogLevel) => number;
  getLogsByContext: (context: string) => number;
}
```

### 几何工具
```typescript
// 中心点计算
export const calculateCenter: (points: Point[]) => Point;

// 点在多边形内检测
export function isPointInPolygon(x: number, y: number, polygon: Point[]): boolean;

// 点旋转
export function rotatePoint(x: number, y: number, cx: number, cy: number, angle: number): {x: number, y: number};

// 角度计算
export function calculateAngle(x1: number, y1: number, x2: number, y2: number): number;

// 拼图块边界计算
export function calculatePieceBounds(piece: { points: Point[] }): {
  minX: number; maxX: number; minY: number; maxY: number;
  width: number; height: number; centerX: number; centerY: number;
};

// 多边形面积计算
export const calculatePolygonArea: (vertices: Point[]) => number;

// 边界计算
export const calculateBounds: (points: Point[]) => Bounds;

// 安全区域创建
export const createSafeZone: (shape: Point[]) => Bounds;

// 线段交点
export const lineIntersection: (p1: Point, p2: Point, p3: Point, p4: Point) => Point | null;

// 点到线距离
export const distanceToLine: (point: Point, line: CutLine) => number;

// 点是否靠近线段
export const isPointNearLine: (point: Point, line: CutLine, threshold: number) => boolean;
```

### 常量定义
```typescript
export const MIN_SCREEN_WIDTH: number;
export const MIN_SCREEN_HEIGHT: number;
export const MIN_SHAPE_DIAMETER: number;
export const MAX_SHAPE_DIAMETER: number;
export const MIN_SHAPE_AREA: number;
```

### 形状适配工具
```typescript
export interface AdaptationOptions {
  debug?: boolean;
  forceExactCenter?: boolean;
  preserveAspectRatio?: boolean;
}

// 形状居中
export function centerShapeInCanvas(
  shape: Point[], 
  canvasSize: CanvasSize, 
  options?: AdaptationOptions
): Point[];

// 形状缩放
export function scaleShapeToSize(
  shape: Point[], 
  targetSize: number, 
  canvasSize: CanvasSize
): Point[];

// 边界检查
export function isShapeInBounds(
  shape: Point[], 
  canvasSize: CanvasSize, 
  margin?: number
): boolean;
```

### 形状生成器
```typescript
export class ShapeGenerator {
  // 生成形状
  static generateShape(type: ShapeType): Point[];
  
  // 生成圆形
  static generateCircle(radius: number, segments: number): Point[];
  
  // 生成多边形
  static generatePolygon(sides: number, radius: number): Point[];
  
  // 生成曲线
  static generateCurve(controlPoints: Point[]): Point[];
}
```

### 音效工具
```typescript
// 测试音效播放
export const soundPlayedForTest: (soundName: string) => void;

// 背景音乐
export const initBackgroundMusic: () => void;
export const getBackgroundMusicStatus: () => boolean;

// 音效播放
export const playButtonClickSound: () => Promise<void>;
export const playPieceSelectSound: () => Promise<void>;
export const playPuzzleCompletedSound: () => Promise<void>;
export const playRotateSound: () => Promise<void>;
```

### 渲染工具
```typescript
// 拼图块接口
export interface PuzzlePiece {
  points: Point[];
  x: number;
  y: number;
  rotation: number;
  color: string;
  isCompleted?: boolean;
}

// 点接口
export interface Point {
  x: number;
  y: number;
  isOriginal?: boolean;
}

// 绘制函数
export const drawPiece: (
  ctx: CanvasRenderingContext2D,
  piece: PuzzlePiece,
  isSelected: boolean,
  isCompleted: boolean
) => void;

export const drawHintOutline: (
  ctx: CanvasRenderingContext2D,
  piece: PuzzlePiece,
  shapeType: string
) => void;

export const drawCompletionEffect: (
  ctx: CanvasRenderingContext2D,
  piece: PuzzlePiece
) => void;

export const drawCanvasBorderLine: (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  showDebug: boolean
) => void;

export const drawDistributionArea: (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  showDebug: boolean
) => void;

export const drawCanvasCenter: (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => void;

export const drawShapeCenter: (
  ctx: CanvasRenderingContext2D,
  shape: Point[]
) => void;
```

### 颜色工具
```typescript
// 添加透明度
export function appendAlpha(color: string, alpha?: number): string;
```

### 渲染优化器
```typescript
export const renderOptimizer: RenderOptimizer;
```

### 拼图工具
```typescript
// 拼图块分割
export const splitPieceWithLine: (
  piece: Point[], 
  cut: CutLine, 
  recursionDepth?: number
) => Point[][];

// 拼图块验证
export const isValidPiece: (piece: Point[]) => boolean;

// 矩形重叠检查
export const checkRectOverlap: (
  rect1: { x: number, y: number, width: number, height: number }, 
  rect2: { x: number, y: number, width: number, height: number }
) => boolean;

// 切割生成
export const generateCuts: (
  shape: Point[], 
  count: number, 
  type: "straight" | "diagonal"
) => CutLine[];
```

---

## 📊 API统计信息

### 按分类统计
- **配置管理API**: 39个 (26.0%)
- **核心管理器API**: 26个 (17.3%)
- **React Hooks API**: 18个 (12.0%)
- **工具函数API**: 67个 (44.7%)

### 文档覆盖率
- **已文档化**: 131个API
- **待文档化**: 19个API
- **覆盖率**: 87.3%

### 最近更新
- **新增API**: 131个
- **删除API**: 1个 (v1)
- **修改API**: 0个

---

## 🔄 更新日志

### v2.0 (2025-08-05)
- ✅ 新增配置管理API 39个
- ✅ 新增核心管理器API 26个
- ✅ 新增React Hooks API 18个
- ✅ 新增工具函数API 67个
- ✅ 删除过时API 1个
- ✅ 更新文档覆盖率至87.3%

### v1.0 (2025-08-04)
- 🎉 初始版本发布
- 📚 基础API文档建立

---

**📝 注意**: 本文档基于自动API扫描生成，如发现遗漏或错误，请运行 `npm run scan-api-changes` 重新扫描更新。