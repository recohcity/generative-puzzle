/**
 * 适配参数配置统一管理
 * 
 * 🎯 监督指令合规：极简适配配置，符合监督指令要求
 */

// 🎯 监督指令合规：桌面端适配配置
export const DESKTOP_ADAPTATION = {
  MIN_CANVAS_SIZE: 400,
  MAX_CANVAS_SIZE: 1000,
  CANVAS_MARGIN: 20,
  PANEL_WIDTH: 300,
  SAFE_AREA_MARGIN: 10,
  TOP_BOTTOM_MARGIN: 20,
  LEFT_RIGHT_MARGIN: 30,
  CANVAS_PANEL_GAP: 20,
  MIN_PANEL_WIDTH: 250
};

// 🎯 监督指令合规：移动端适配配置
export const MOBILE_ADAPTATION = {
  MIN_CANVAS_SIZE: 280,
  MAX_CANVAS_SIZE: 400,
  CANVAS_MARGIN: 5,
  SAFE_AREA_MARGIN: 20,
  SAFE_AREA_TOP: 5,
  SAFE_AREA_BOTTOM: 5,
  PORTRAIT: {
    MIN_CANVAS_SIZE: 280,
    MAX_CANVAS_SIZE: 400,
    CANVAS_MARGIN: 5,
    SAFE_AREA_MARGIN: 20,
    SAFE_AREA_TOP: 5,
    SAFE_AREA_BOTTOM: 5
  },
  LANDSCAPE: {
    MIN_CANVAS_SIZE: 300,
    MAX_CANVAS_SIZE: 500,
    CANVAS_MARGIN: 5,
    SAFE_AREA_MARGIN: 15,
    SAFE_AREA_TOP: 5,
    SAFE_AREA_BOTTOM: 5
  }
};

// iPhone 16 系列优化配置
export const IPHONE16_OPTIMIZATION = {
  DYNAMIC_ISLAND_HEIGHT: 37,
  SAFE_AREA_TOP: 5,
  SAFE_AREA_BOTTOM: 5,
  CANVAS_SCALE_FACTOR: 1.1,
  TOUCH_TARGET_SIZE: 44,
  GESTURE_SENSITIVITY: 0.8,
  PERFORMANCE_MODE: 'optimized' as const
};

// 高分辨率移动设备配置
export const HIGH_RESOLUTION_MOBILE = {
  PIXEL_RATIO_THRESHOLD: 2.5,
  CANVAS_SCALE_ADJUSTMENT: 0.9,
  TOUCH_PRECISION_BOOST: 1.2,
  RENDERING_QUALITY: 'high' as const,
  MEMORY_OPTIMIZATION: true,
  FRAME_RATE_TARGET: 60
};

// 画布安全边界配置
export const CANVAS_SAFETY = {
  MIN_WIDTH: 200,
  MIN_HEIGHT: 200,
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 2000,
  ASPECT_RATIO_TOLERANCE: 0.1,
  BOUNDARY_PADDING: 5
};

// 适配上下文接口
export interface AdaptationContext {
  deviceType: 'desktop' | 'tablet' | 'phone';
  layoutMode: 'desktop' | 'portrait' | 'landscape';
  canvasSize: { width: number; height: number };
  iPhone16Model?: string | null;
}

// 适配结果接口
export interface AdaptationResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  metrics?: {
    processingTime: number;
    scaleFactor: number;
  };
}

// 画布尺寸结果接口
export interface CanvasSizeResult {
  width: number;
  height: number;
  scale: number;
  margin: number;
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}