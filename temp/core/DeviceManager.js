"use strict";
/**
 * DeviceManager - Unified device detection system
 * Consolidates all device detection logic from multiple conflicting implementations
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceManager = void 0;
var deviceConfig_1 = require("../src/config/deviceConfig");
// Interfaces now imported from deviceConfig.ts
var DeviceManager = /** @class */ (function () {
    // Constants now imported from unified configuration
    function DeviceManager() {
        this.listeners = new Set();
        this.currentState = this.detectDevice();
    }
    DeviceManager.getInstance = function () {
        if (!DeviceManager.instance) {
            DeviceManager.instance = new DeviceManager();
        }
        return DeviceManager.instance;
    };
    DeviceManager.prototype.detectDevice = function () {
        if (typeof window === 'undefined') {
            return this.getDefaultState();
        }
        var ua = navigator.userAgent;
        var screenWidth = window.innerWidth;
        var screenHeight = window.innerHeight;
        // User agent detection - 优先使用用户代理检测
        var isAndroid = deviceConfig_1.USER_AGENT_PATTERNS.ANDROID.test(ua);
        var isIPhone = deviceConfig_1.USER_AGENT_PATTERNS.IPHONE.test(ua);
        var isIPad = deviceConfig_1.USER_AGENT_PATTERNS.IPAD.test(ua) || (deviceConfig_1.USER_AGENT_PATTERNS.MACINTOSH_TOUCH.test(ua) && 'ontouchend' in document);
        var isIOS = isIPhone || isIPad;
        var isMobileUserAgent = deviceConfig_1.USER_AGENT_PATTERNS.MOBILE.test(ua);
        // Screen dimension analysis
        var isPortrait = screenHeight > screenWidth;
        var aspectRatio = Math.max(screenWidth, screenHeight) / Math.min(screenWidth, screenHeight);
        var isLongScreen = aspectRatio > deviceConfig_1.DETECTION_CONFIG.ASPECT_RATIO_THRESHOLD && screenWidth < deviceConfig_1.DETECTION_CONFIG.LARGE_SCREEN_WIDTH;
        // 触摸设备检测 - 增强移动设备识别
        var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        var isMobileLikeScreen = (screenWidth <= deviceConfig_1.DEVICE_THRESHOLDS.MOBILE_BREAKPOINT) || (isLongScreen && screenWidth < deviceConfig_1.DETECTION_CONFIG.TOUCH_DEVICE_MAX_WIDTH);
        // iPhone 16 series detection
        var iPhone16Detection = this.detectiPhone16Series(screenWidth, screenHeight);
        // Device type determination with unified logic
        var deviceType;
        var layoutMode;
        var isMobile;
        var isTablet;
        var isDesktop;
        // 优先使用用户代理检测 - 修复横屏问题
        if (isIOS || isAndroid) {
            deviceType = 'phone';
            layoutMode = isPortrait ? 'portrait' : 'landscape';
            isMobile = true;
            isTablet = false;
            isDesktop = false;
            console.log('📱 用户代理检测为移动设备:', {
                isIOS: isIOS,
                isAndroid: isAndroid,
                deviceType: deviceType,
                layoutMode: layoutMode,
                screenSize: "".concat(screenWidth, "x").concat(screenHeight)
            });
        }
        // Force mobile for iPhone 16 series
        else if (iPhone16Detection.detected) {
            deviceType = 'phone';
            layoutMode = iPhone16Detection.orientation;
            isMobile = true;
            isTablet = false;
            isDesktop = false;
            console.log('📱 iPhone 16系列检测:', {
                model: iPhone16Detection.model,
                orientation: iPhone16Detection.orientation,
                exact: iPhone16Detection.exact,
                screenSize: "".concat(screenWidth, "x").concat(screenHeight)
            });
        }
        // Large desktop screen detection
        else if (screenWidth >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.STANDARD_LARGE.width && screenHeight >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.STANDARD_LARGE.height ||
            screenWidth >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.ULTRAWIDE.width && screenHeight >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.ULTRAWIDE.height ||
            screenWidth >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.SUPER_WIDE.width) {
            deviceType = 'desktop';
            layoutMode = 'desktop';
            isMobile = false;
            isTablet = false;
            isDesktop = true;
        }
        // Mobile detection - 综合判断移动设备
        else if (isMobileUserAgent ||
            (isTouchDevice && isMobileLikeScreen) ||
            (isLongScreen && screenWidth < deviceConfig_1.DETECTION_CONFIG.TOUCH_DEVICE_MAX_WIDTH) ||
            screenWidth < deviceConfig_1.DEVICE_THRESHOLDS.MOBILE_BREAKPOINT) {
            deviceType = 'phone';
            layoutMode = isPortrait ? 'portrait' : 'landscape';
            isMobile = true;
            isTablet = false;
            isDesktop = false;
            console.log('📱 综合检测为移动设备:', {
                isMobileUserAgent: isMobileUserAgent,
                isTouchDevice: isTouchDevice,
                isMobileLikeScreen: isMobileLikeScreen,
                isLongScreen: isLongScreen,
                screenWidth: screenWidth,
                layoutMode: layoutMode,
                screenSize: "".concat(screenWidth, "x").concat(screenHeight)
            });
        }
        // Tablet detection
        else if (screenWidth >= deviceConfig_1.DEVICE_THRESHOLDS.TABLET_MIN_WIDTH && screenWidth < deviceConfig_1.DEVICE_THRESHOLDS.DESKTOP_MIN_WIDTH) {
            deviceType = 'tablet';
            layoutMode = 'desktop'; // Tablets use desktop layout
            isMobile = false;
            isTablet = true;
            isDesktop = false;
        }
        // Desktop detection
        else {
            deviceType = 'desktop';
            layoutMode = 'desktop';
            isMobile = false;
            isTablet = false;
            isDesktop = true;
        }
        return {
            isMobile: isMobile,
            isTablet: isTablet,
            isDesktop: isDesktop,
            isPortrait: isPortrait,
            isAndroid: isAndroid,
            isIOS: isIOS,
            screenWidth: screenWidth,
            screenHeight: screenHeight,
            userAgent: ua,
            deviceType: deviceType,
            layoutMode: layoutMode
        };
    };
    DeviceManager.prototype.detectiPhone16Series = function (windowWidth, windowHeight) {
        // iPhone 16 models now imported from unified configuration
        for (var _i = 0, _a = Object.entries(deviceConfig_1.IPHONE16_MODELS); _i < _a.length; _i++) {
            var _b = _a[_i], modelName = _b[0], dimensions = _b[1];
            var portrait = dimensions.portrait, landscape = dimensions.landscape;
            // Exact match
            if ((windowWidth === portrait.width && windowHeight === portrait.height) ||
                (windowWidth === landscape.width && windowHeight === landscape.height)) {
                return {
                    detected: true,
                    model: modelName,
                    orientation: windowWidth > windowHeight ? 'landscape' : 'portrait',
                    exact: true
                };
            }
            // Range match (tolerance from configuration)
            var tolerance = deviceConfig_1.DETECTION_CONFIG.IPHONE16_TOLERANCE;
            var isPortraitRange = Math.abs(windowWidth - portrait.width) <= tolerance &&
                Math.abs(windowHeight - portrait.height) <= tolerance;
            var isLandscapeRange = Math.abs(windowWidth - landscape.width) <= tolerance &&
                Math.abs(windowHeight - landscape.height) <= tolerance;
            if (isPortraitRange || isLandscapeRange) {
                return {
                    detected: true,
                    model: modelName,
                    orientation: windowWidth > windowHeight ? 'landscape' : 'portrait',
                    exact: false
                };
            }
        }
        return {
            detected: false,
            model: null,
            orientation: null,
            exact: false
        };
    };
    DeviceManager.prototype.getDefaultState = function () {
        return {
            isMobile: false,
            isTablet: false,
            isDesktop: true,
            isPortrait: false,
            isAndroid: false,
            isIOS: false,
            screenWidth: 1280,
            screenHeight: 720,
            userAgent: '',
            deviceType: 'desktop',
            layoutMode: 'desktop'
        };
    };
    DeviceManager.prototype.getState = function () {
        return __assign({}, this.currentState);
    };
    DeviceManager.prototype.subscribe = function (listener) {
        var _this = this;
        this.listeners.add(listener);
        return function () { return _this.listeners.delete(listener); };
    };
    DeviceManager.prototype.updateState = function () {
        var newState = this.detectDevice();
        var hasChanged = JSON.stringify(newState) !== JSON.stringify(this.currentState);
        console.log('🔍 设备状态检测:', {
            previous: {
                deviceType: this.currentState.deviceType,
                layoutMode: this.currentState.layoutMode,
                screenSize: "".concat(this.currentState.screenWidth, "x").concat(this.currentState.screenHeight)
            },
            current: {
                deviceType: newState.deviceType,
                layoutMode: newState.layoutMode,
                screenSize: "".concat(newState.screenWidth, "x").concat(newState.screenHeight)
            },
            hasChanged: hasChanged
        });
        if (hasChanged) {
            this.currentState = newState;
            this.notifyListeners();
        }
    };
    // 强制更新状态（用于页面刷新等场景）
    DeviceManager.prototype.forceUpdateState = function () {
        var newState = this.detectDevice();
        this.currentState = newState;
        this.notifyListeners();
        console.log('🔄 强制更新设备状态:', {
            deviceType: newState.deviceType,
            layoutMode: newState.layoutMode,
            screenSize: "".concat(newState.screenWidth, "x").concat(newState.screenHeight)
        });
    };
    DeviceManager.prototype.notifyListeners = function () {
        var _this = this;
        this.listeners.forEach(function (listener) { return listener(_this.currentState); });
    };
    // Utility methods for backward compatibility
    DeviceManager.prototype.isMobile = function () {
        return this.currentState.isMobile;
    };
    DeviceManager.prototype.isTablet = function () {
        return this.currentState.isTablet;
    };
    DeviceManager.prototype.isDesktop = function () {
        return this.currentState.isDesktop;
    };
    DeviceManager.prototype.isPortrait = function () {
        return this.currentState.isPortrait;
    };
    DeviceManager.prototype.getScreenDimensions = function () {
        return {
            width: this.currentState.screenWidth,
            height: this.currentState.screenHeight
        };
    };
    // Enhanced device layout detection (integrates functionality from canvasAdaptation.ts getDeviceLayoutMode)
    DeviceManager.prototype.getDeviceLayoutMode = function (windowWidth, windowHeight) {
        // Use provided dimensions or current screen dimensions
        var width = windowWidth !== null && windowWidth !== void 0 ? windowWidth : this.currentState.screenWidth;
        var height = windowHeight !== null && windowHeight !== void 0 ? windowHeight : this.currentState.screenHeight;
        // 首先检测iPhone 16系列
        var iPhone16Detection = this.detectiPhone16Series(width, height);
        if (iPhone16Detection.detected) {
            return {
                deviceType: 'phone',
                layoutMode: iPhone16Detection.orientation,
                forceReason: 'iphone16_series',
                iPhone16Model: iPhone16Detection.model,
                iPhone16Exact: iPhone16Detection.exact
            };
        }
        // 计算宽高比，用于识别移动设备的长条形屏幕
        var aspectRatio = Math.max(width, height) / Math.min(width, height);
        // 长宽比大于1.8通常是手机屏幕，但超宽屏桌面显示器也可能有较大的宽高比
        // 因此，我们需要额外检查屏幕尺寸，排除大屏幕显示器
        var isLongScreen = aspectRatio > deviceConfig_1.DETECTION_CONFIG.ASPECT_RATIO_THRESHOLD && width < deviceConfig_1.DETECTION_CONFIG.LARGE_SCREEN_WIDTH;
        // 检测用户代理（如果在浏览器环境中）
        var isMobileUserAgent = false;
        if (typeof navigator !== 'undefined') {
            var ua = navigator.userAgent;
            isMobileUserAgent = deviceConfig_1.USER_AGENT_PATTERNS.MOBILE.test(ua);
        }
        // 高分辨率移动设备检测：宽高比很大的屏幕通常是手机
        // 但需要排除桌面端的大屏幕显示器
        var isHighResolutionMobile = isLongScreen && ((width > 1000 && height > 2000) || // 竖屏高分辨率手机
            (height > 1000 && width > 2000) // 横屏高分辨率手机
        );
        // 检测是否是桌面大屏幕 - 更强的检测逻辑，支持超宽屏
        var isLargeDesktopScreen = (width >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.STANDARD_LARGE.width && height >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.STANDARD_LARGE.height) || // 标准大屏幕
            (width >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.ULTRAWIDE.width && height >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.ULTRAWIDE.height) || // 超宽屏
            (width >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.SUPER_WIDE.width); // 任何超过3000px宽的屏幕都视为桌面
        // 强制桌面模式的条件
        var forceDesktop = isLargeDesktopScreen ||
            (width >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.HIGH_RESOLUTION.width && height >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.HIGH_RESOLUTION.height) || // 宽屏桌面
            (width * height >= deviceConfig_1.LARGE_SCREEN_THRESHOLDS.PIXEL_THRESHOLD); // 总像素数超过250万的大屏幕
        // 强制移动端判断条件 - 排除桌面大屏幕
        var forceMobile = (isMobileUserAgent || isHighResolutionMobile || height < deviceConfig_1.DEVICE_THRESHOLDS.DESKTOP_MOBILE_HEIGHT) && !forceDesktop;
        if (forceMobile) {
            return {
                deviceType: 'phone',
                layoutMode: width > height ? 'landscape' : 'portrait',
                forceReason: isMobileUserAgent ? 'user_agent' :
                    isHighResolutionMobile ? 'high_resolution_mobile' :
                        'height_threshold'
            };
        }
        // 强制桌面模式优先判断
        if (forceDesktop) {
            return {
                deviceType: 'desktop',
                layoutMode: 'desktop',
                forceReason: 'large_screen'
            };
        }
        // 传统的宽度判断（用于真正的桌面/平板设备）
        if (width >= deviceConfig_1.DEVICE_THRESHOLDS.DESKTOP_MIN_WIDTH && (!isLongScreen || width >= deviceConfig_1.DETECTION_CONFIG.LARGE_SCREEN_WIDTH)) {
            return {
                deviceType: 'desktop',
                layoutMode: 'desktop',
            };
        }
        else if (width >= deviceConfig_1.DEVICE_THRESHOLDS.TABLET_MIN_WIDTH && (!isLongScreen || width >= deviceConfig_1.DETECTION_CONFIG.TOUCH_DEVICE_MAX_WIDTH)) {
            return {
                deviceType: 'tablet',
                layoutMode: 'desktop', // 平板使用桌面布局
            };
        }
        else {
            return {
                deviceType: 'phone',
                layoutMode: width > height ? 'landscape' : 'portrait',
            };
        }
    };
    return DeviceManager;
}());
exports.DeviceManager = DeviceManager;
