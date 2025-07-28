/**
 * Performance Configuration
 * Settings for optimization, timing, and resource management
 */

// Event handling and timing configuration
export const EVENT_CONFIG = {
  // ResizeObserver settings
  RESIZE_DEBOUNCE_MS: 100,         // ResizeObserver防抖延时
  RESIZE_THROTTLE_MS: 50,          // ResizeObserver节流延时
  
  // Device state update timing
  DEVICE_UPDATE_DEBOUNCE_MS: 150,  // 设备状态更新防抖
  ORIENTATION_CHANGE_DELAY_MS: 200, // 屏幕方向变化延时
  
  // Canvas adaptation timing
  ADAPTATION_DEBOUNCE_MS: 100,     // 适配计算防抖
  CANVAS_UPDATE_THROTTLE_MS: 16,   // 画布更新节流 (60fps)
  
  // Legacy setTimeout values (to be replaced)
  LEGACY_TIMEOUT_1: 300,           // 第一级延时
  LEGACY_TIMEOUT_2: 600,           // 第二级延时
  LEGACY_TIMEOUT_3: 1000,          // 第三级延时
} as const;

// Memory and resource management
export const MEMORY_CONFIG = {
  // Event listener limits
  MAX_EVENT_LISTENERS: 100,        // 最大事件监听器数量
  LISTENER_CLEANUP_INTERVAL: 30000, // 监听器清理间隔 (30秒)
  
  // Cache settings
  DEVICE_STATE_CACHE_TTL: 5000,    // 设备状态缓存TTL (5秒)
  ADAPTATION_CACHE_SIZE: 50,       // 适配结果缓存大小
  
  // Garbage collection hints
  GC_TRIGGER_THRESHOLD: 1000,      // 触发垃圾回收的阈值
  MEMORY_PRESSURE_THRESHOLD: 0.8,  // 内存压力阈值
} as const;

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  // Response time limits
  MAX_ADAPTATION_TIME_MS: 100,     // 最大适配计算时间
  MAX_DEVICE_DETECTION_TIME_MS: 50, // 最大设备检测时间
  MAX_CANVAS_UPDATE_TIME_MS: 16,   // 最大画布更新时间 (60fps)
  
  // Frame rate targets
  TARGET_FPS: 60,                  // 目标帧率
  MIN_ACCEPTABLE_FPS: 30,          // 最低可接受帧率
  
  // Memory usage limits
  MAX_MEMORY_USAGE_MB: 100,        // 最大内存使用量 (MB)
  MEMORY_WARNING_THRESHOLD_MB: 80, // 内存警告阈值 (MB)
} as const;

// Optimization flags
export const OPTIMIZATION_FLAGS = {
  // Feature toggles
  ENABLE_RESIZE_OBSERVER: true,    // 启用ResizeObserver
  ENABLE_DEBOUNCING: true,         // 启用防抖
  ENABLE_THROTTLING: true,         // 启用节流
  ENABLE_CACHING: true,            // 启用缓存
  
  // Debug and development
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
  ENABLE_MEMORY_PROFILING: process.env.NODE_ENV === 'development',
  ENABLE_DETAILED_LOGGING: process.env.NODE_ENV === 'development',
  
  // Fallback mechanisms
  ENABLE_LEGACY_TIMEOUT_FALLBACK: false, // 启用setTimeout回退机制
  ENABLE_GRACEFUL_DEGRADATION: true,     // 启用优雅降级
} as const;

// Browser compatibility settings
export const BROWSER_SUPPORT = {
  // Feature detection
  SUPPORTS_RESIZE_OBSERVER: typeof ResizeObserver !== 'undefined',
  SUPPORTS_INTERSECTION_OBSERVER: typeof IntersectionObserver !== 'undefined',
  SUPPORTS_PERFORMANCE_OBSERVER: typeof PerformanceObserver !== 'undefined',
  
  // Fallback strategies
  FALLBACK_TO_WINDOW_RESIZE: true, // 回退到window.resize事件
  FALLBACK_TO_POLLING: false,      // 回退到轮询检测
  
  // Browser-specific optimizations
  SAFARI_OPTIMIZATIONS: /Safari/.test(navigator.userAgent || ''),
  CHROME_OPTIMIZATIONS: /Chrome/.test(navigator.userAgent || ''),
  FIREFOX_OPTIMIZATIONS: /Firefox/.test(navigator.userAgent || ''),
} as const;

// Error handling and recovery
export const ERROR_HANDLING = {
  // Retry configuration
  MAX_RETRY_ATTEMPTS: 3,           // 最大重试次数
  RETRY_DELAY_MS: 1000,            // 重试延时
  EXPONENTIAL_BACKOFF: true,       // 指数退避
  
  // Error thresholds
  MAX_CONSECUTIVE_ERRORS: 5,       // 最大连续错误数
  ERROR_RATE_THRESHOLD: 0.1,       // 错误率阈值 (10%)
  
  // Recovery strategies
  ENABLE_AUTO_RECOVERY: true,      // 启用自动恢复
  RECOVERY_TIMEOUT_MS: 5000,       // 恢复超时时间
  FALLBACK_TO_DEFAULT_STATE: true, // 回退到默认状态
} as const;

// Logging and monitoring configuration
export const LOGGING_CONFIG = {
  // Log levels
  DEFAULT_LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  
  // Performance logging
  LOG_PERFORMANCE_METRICS: process.env.NODE_ENV === 'development',
  LOG_MEMORY_USAGE: process.env.NODE_ENV === 'development',
  LOG_EVENT_TIMING: process.env.NODE_ENV === 'development',
  
  // Error logging
  LOG_ALL_ERRORS: true,
  LOG_STACK_TRACES: process.env.NODE_ENV === 'development',
  
  // Debug logging
  LOG_DEVICE_DETECTION: process.env.NODE_ENV === 'development',
  LOG_ADAPTATION_DETAILS: process.env.NODE_ENV === 'development',
  LOG_CANVAS_UPDATES: false, // 通常太频繁，默认关闭
} as const;

// Performance monitoring interfaces
export interface PerformanceMetrics {
  adaptationTime: number;
  deviceDetectionTime: number;
  canvasUpdateTime: number;
  memoryUsage: number;
  frameRate: number;
  errorRate: number;
}

export interface PerformanceThresholds {
  maxAdaptationTime: number;
  maxDeviceDetectionTime: number;
  maxCanvasUpdateTime: number;
  maxMemoryUsage: number;
  minFrameRate: number;
  maxErrorRate: number;
}

// Event timing configuration
export interface EventTimingConfig {
  debounceMs: number;
  throttleMs: number;
  maxWaitMs: number;
  immediate: boolean;
}