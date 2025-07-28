/**
 * Adaptation Parameters Configuration
 * Consolidated from canvasAdaptation.ts and AdaptationEngine.ts
 */

// Desktop adaptation parameters
export const DESKTOP_ADAPTATION = {
  // 边距设置（按方案要求）
  TOP_BOTTOM_MARGIN: 40,           // 桌面端上下边距
  LEFT_RIGHT_MARGIN: 20,           // 桌面端左右最小边距
  CANVAS_PANEL_GAP: 10,            // 面板与画布间距

  // 面板设置
  PANEL_WIDTH: 350,                // 面板固定宽度
  MIN_PANEL_WIDTH: 280,            // 面板最小宽度

  // 画布设置
  MIN_CANVAS_SIZE: 320,            // 画布最小边长
  MAX_CANVAS_SIZE: 2560,           // 画布最大边长（防止溢出）

  // 切换阈值
  MIN_HEIGHT_THRESHOLD: 560,       // 小于此高度时切换为移动端布局
} as const;

// Mobile adaptation parameters
export const MOBILE_ADAPTATION = {
  // 竖屏模式边距
  PORTRAIT: {
    CANVAS_MARGIN: 10,             // 画布上下左右边距（增加以适应iPhone 16 Pro）
    PANEL_MARGIN: 10,              // 面板边距
    SAFE_AREA_TOP: 10,             // 顶部安全区（避免与状态栏重叠）
    SAFE_AREA_BOTTOM: 30,          // 底部安全区（增加以适应iPhone 16 Pro的底部安全区）
    PANEL_HEIGHT: 180,             // 面板固定高度（为iPhone 16 Pro优化）
  },

  // 横屏模式边距
  LANDSCAPE: {
    CANVAS_MARGIN: 6,              // 画布上下左右边距（增加以适应iPhone 16 Pro）
    PANEL_MARGIN: 10,              // 面板边距
    SAFE_AREA_TOP: 6,              // 顶部安全区（横屏模式较小）
    SAFE_AREA_BOTTOM: 6,           // 底部安全区
    MIN_PANEL_WIDTH: 240,          // 横屏面板最小宽度（增加以适应iPhone 16 Pro）
    MAX_PANEL_WIDTH: 350,          // 横屏面板最大宽度（减少以确保画布有足够空间）
  },

  // 通用设置
  MIN_CANVAS_SIZE: 240,            // 移动端画布最小边长（增加以适应高分辨率屏幕）
  MAX_CANVAS_SIZE: 380,            // 移动端画布最大边长（针对iPhone 16 Pro竖屏宽度402px优化）
} as const;

// iPhone 16 series optimization parameters
export const IPHONE16_OPTIMIZATION = {
  // Portrait mode canvas size limits
  PORTRAIT_LIMITS: {
    'iPhone 16e': 355,      // 390×844
    'iPhone 16': 360,       // 393×852
    'iPhone 16 Plus': 400,  // 430×932
    'iPhone 16 Pro': 370,   // 402×874
    'iPhone 16 Pro Max': 410, // 440×956
  },
  
  // Landscape mode canvas size limits
  LANDSCAPE_LIMITS: {
    'iPhone 16e': 350,      // 844×390
    'iPhone 16': 360,       // 852×393
    'iPhone 16 Plus': 410,  // 932×430
    'iPhone 16 Pro': 380,   // 874×402
    'iPhone 16 Pro Max': 420, // 956×440
  },
  
  // Landscape mode panel widths
  LANDSCAPE_PANEL_WIDTHS: {
    'iPhone 16e': 270,      // 最小屏幕，需要足够的面板宽度
    'iPhone 16': 270,       // 与16e保持一致，确保tab按钮显示良好
    'iPhone 16 Plus': 250,  // 大屏幕，可以平衡面板和画布
    'iPhone 16 Pro': 260,   // 中等屏幕
    'iPhone 16 Pro Max': 260, // 最大屏幕，给画布更多空间
  },
} as const;

// High resolution mobile device optimization
export const HIGH_RESOLUTION_MOBILE = {
  // Portrait mode optimization by width ranges (扩大范围以覆盖更多Android旗舰机型)
  PORTRAIT_OPTIMIZATION: {
    ULTRA_LARGE_PHONE: { minWidth: 440, maxCanvasSize: 410 },  // iPhone 16 Pro Max, Samsung S24 Ultra等
    LARGE_PHONE: { minWidth: 420, maxCanvasSize: 400 },        // iPhone 16 Plus, Pixel 8 Pro等
    MEDIUM_LARGE_PHONE: { minWidth: 400, maxCanvasSize: 380 }, // iPhone 16 Pro, Xiaomi 14等
    MEDIUM_PHONE: { minWidth: 390, maxCanvasSize: 370 },       // iPhone 16, Pixel 8, Galaxy S24等
    STANDARD_PHONE: { minWidth: 0, maxCanvasSize: 340 },       // 其他Android中端机型
  },
  
  // Landscape mode optimization by width ranges (扩大范围以覆盖更多Android旗舰机型)
  LANDSCAPE_OPTIMIZATION: {
    SUPER_WIDE: { minWidth: 950, panelWidth: 260, maxCanvasSize: 420 },   // iPhone 16 Pro Max, Samsung S24 Ultra等
    LARGE_WIDE: { minWidth: 920, panelWidth: 250, maxCanvasSize: 410 },   // iPhone 16 Plus, Pixel 8 Pro等
    MEDIUM_LARGE_WIDE: { minWidth: 870, panelWidth: 260, maxCanvasSize: 380 }, // iPhone 16 Pro, Xiaomi 14等
    MEDIUM_WIDE: { minWidth: 850, panelWidth: 270, maxCanvasSize: 360 },  // iPhone 16, Pixel 8, Galaxy S24等
    STANDARD_WIDE: { minWidth: 0, panelWidth: 270, maxCanvasSize: 350 },  // 其他Android中端机型
  },
  
  // Detection thresholds (扩大检测范围)
  THRESHOLDS: {
    MAX_WIDTH: 480,         // 高分辨率手机最大宽度 (从460扩大到480)
    MIN_HEIGHT: 800,        // 高分辨率手机最小高度
    LANDSCAPE_MIN_WIDTH: 800, // 横屏模式最小宽度
    LANDSCAPE_MAX_HEIGHT: 480, // 横屏模式最大高度 (从460扩大到480)
  },
} as const;

// Canvas size calculation safety margins
export const CANVAS_SAFETY = {
  MIN_SAFE_MARGIN: 30,      // 最小安全边距（确保不贴边）
  TOLERANCE: 10,            // 计算容差
  FORCE_RECALCULATION_THRESHOLD: 0.001, // 强制重新计算的缩放比例阈值
} as const;

// Adaptation context interface
export interface AdaptationContext {
  deviceType: 'desktop' | 'tablet' | 'phone';
  layoutMode: 'desktop' | 'portrait' | 'landscape';
  canvasSize: { width: number; height: number };
  previousCanvasSize?: { width: number; height: number };
  iPhone16Model?: string | null;
}

// Adaptation result interface
export interface AdaptationResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  metadata?: {
    scaleRatio: number;
    offset: { x: number; y: number };
    bounds: { minX: number; minY: number; maxX: number; maxY: number };
  };
}

// Canvas size calculation result interface
export interface CanvasSizeResult {
  canvasSize: number;
  panelHeight?: number;
  panelWidth?: number;
  actualPanelWidth?: number;
  actualLeftRightMargin?: number;
  canvasMargin?: number;
  safeAreaTop?: number;
  safeAreaBottom?: number;
  debug?: {
    [key: string]: any;
  };
}