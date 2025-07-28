"use strict";
/**
 * Device Detection Configuration
 * Consolidated from DeviceManager.ts and canvasAdaptation.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_AGENT_PATTERNS = exports.LARGE_SCREEN_THRESHOLDS = exports.DETECTION_CONFIG = exports.IPHONE16_MODELS = exports.DEVICE_THRESHOLDS = void 0;
// Device detection thresholds (migrated from DeviceManager.ts:32-35)
exports.DEVICE_THRESHOLDS = {
    DESKTOP_MIN_WIDTH: 1024, // 桌面端最小宽度
    TABLET_MIN_WIDTH: 640, // 平板最小宽度
    PHONE_MAX_WIDTH: 639, // 手机最大宽度
    DESKTOP_MOBILE_HEIGHT: 560, // 桌面端/移动端高度切换阈值
    MOBILE_BREAKPOINT: 768, // 移动端断点 (from DeviceManager.ts)
};
// iPhone 16 series specifications
exports.IPHONE16_MODELS = {
    'iPhone 16e': {
        portrait: { width: 390, height: 844 },
        landscape: { width: 844, height: 390 }
    },
    'iPhone 16': {
        portrait: { width: 393, height: 852 },
        landscape: { width: 852, height: 393 }
    },
    'iPhone 16 Plus': {
        portrait: { width: 430, height: 932 },
        landscape: { width: 932, height: 430 }
    },
    'iPhone 16 Pro': {
        portrait: { width: 402, height: 874 },
        landscape: { width: 874, height: 402 }
    },
    'iPhone 16 Pro Max': {
        portrait: { width: 440, height: 956 },
        landscape: { width: 956, height: 440 }
    }
};
// Device detection tolerance
exports.DETECTION_CONFIG = {
    IPHONE16_TOLERANCE: 10, // iPhone 16检测容差范围 (±10px)
    ASPECT_RATIO_THRESHOLD: 1.8, // 长屏幕宽高比阈值
    LARGE_SCREEN_WIDTH: 2000, // 大屏幕宽度阈值
    TOUCH_DEVICE_MAX_WIDTH: 1200, // 触摸设备最大宽度
};
// Large desktop screen detection thresholds
exports.LARGE_SCREEN_THRESHOLDS = {
    STANDARD_LARGE: { width: 1920, height: 900 }, // 标准大屏幕
    ULTRAWIDE: { width: 2560, height: 800 }, // 超宽屏
    SUPER_WIDE: { width: 3000, height: 0 }, // 超级宽屏
    HIGH_RESOLUTION: { width: 1600, height: 800 }, // 高分辨率屏幕
    PIXEL_THRESHOLD: 2500000, // 总像素数阈值
};
// User agent patterns for mobile detection
exports.USER_AGENT_PATTERNS = {
    MOBILE: /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i,
    ANDROID: /Android/i,
    IPHONE: /iPhone/i,
    IPAD: /iPad/i,
    MACINTOSH_TOUCH: /Macintosh/i, // Used with touch detection for iPad
};
