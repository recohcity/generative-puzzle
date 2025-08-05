/**
 * 画布适配统一参数配置
 * 根据 step1_canvas_adaptation_plan.md 规范定义所有适配相关的常量
 */

// ==================== 桌面端适配参数 ====================
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

// ==================== 移动端适配参数 ====================
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
        CANVAS_MARGIN: 6,             // 画布上下左右边距（增加以适应iPhone 16 Pro）
        PANEL_MARGIN: 10,              // 面板边距
        SAFE_AREA_TOP: 6,             // 顶部安全区（横屏模式较小）
        SAFE_AREA_BOTTOM: 6,          // 底部安全区
        MIN_PANEL_WIDTH: 240,          // 横屏面板最小宽度（增加以适应iPhone 16 Pro）
        MAX_PANEL_WIDTH: 350,          // 横屏面板最大宽度（减少以确保画布有足够空间）
    },

    // 通用设置
    MIN_CANVAS_SIZE: 240,            // 移动端画布最小边长（增加以适应高分辨率屏幕）
    MAX_CANVAS_SIZE: 380,            // 移动端画布最大边长（针对iPhone 16 Pro竖屏宽度402px优化）
} as const;

// ==================== 设备检测阈值 ====================
export const DEVICE_THRESHOLDS = {
    DESKTOP_MIN_WIDTH: 1024,         // 桌面端最小宽度
    TABLET_MIN_WIDTH: 640,           // 平板最小宽度
    PHONE_MAX_WIDTH: 639,            // 手机最大宽度
    DESKTOP_MOBILE_HEIGHT: 560,      // 桌面端/移动端高度切换阈值
} as const;

// ==================== 计算函数 ====================

/**
 * 计算桌面端画布尺寸
 * 按照用户反馈：正方形画布边长 = 屏幕窗口高度 - (顶部安全距离 + 底部安全距离)
 */
export function calculateDesktopCanvasSize(windowWidth: number, windowHeight: number) {
    const { TOP_BOTTOM_MARGIN, LEFT_RIGHT_MARGIN, CANVAS_PANEL_GAP, PANEL_WIDTH, MIN_CANVAS_SIZE, MAX_CANVAS_SIZE } = DESKTOP_ADAPTATION;

    // 定义最小安全边距（确保不贴边）
    const MIN_SAFE_MARGIN = 30; // 增加到30px，确保有足够的安全距离

    // 计算可用高度（减去上下安全边距）
    const availableHeight = windowHeight - TOP_BOTTOM_MARGIN * 2;

    // 计算可用宽度时，使用更大的安全边距
    const safeLeftRightMargin = Math.max(LEFT_RIGHT_MARGIN, MIN_SAFE_MARGIN);
    const availableWidth = windowWidth - safeLeftRightMargin * 2 - PANEL_WIDTH - CANVAS_PANEL_GAP;

    // 画布尺寸取两者的最小值，确保不会超出任何一个维度
    let canvasSize = Math.min(availableHeight, availableWidth);

    // 应用最小值和最大值限制
    canvasSize = Math.max(MIN_CANVAS_SIZE, Math.min(canvasSize, MAX_CANVAS_SIZE));

    // 计算实际需要的左右边距（确保居中且不小于最小安全边距）
    const contentWidth = PANEL_WIDTH + CANVAS_PANEL_GAP + canvasSize;
    const requiredTotalWidth = contentWidth + MIN_SAFE_MARGIN * 2;

    let actualLeftRightMargin = MIN_SAFE_MARGIN;
    if (windowWidth > requiredTotalWidth) {
        // 如果窗口足够宽，计算居中所需的边距
        actualLeftRightMargin = Math.max(MIN_SAFE_MARGIN, (windowWidth - contentWidth) / 2);
    }

    return {
        canvasSize,
        panelHeight: canvasSize,
        actualPanelWidth: PANEL_WIDTH,
        actualLeftRightMargin, // 返回计算出的实际边距
        // 调试信息
        debug: {
            availableHeight,
            availableWidth,
            contentWidth,
            requiredTotalWidth,
            safeLeftRightMargin,
            minSafeMargin: MIN_SAFE_MARGIN,
            isHeightLimited: availableHeight <= availableWidth,
            isWidthLimited: availableWidth < availableHeight,
            adaptationStrategy: windowWidth > requiredTotalWidth ? '居中模式' : '安全边距模式',
        }
    };
}

/**
 * 计算移动端竖屏画布尺寸
 * 针对iPhone 16全系列优化
 */
export function calculateMobilePortraitCanvasSize(windowWidth: number, windowHeight: number, panelHeight?: number, iPhone16Detection?: { detected: boolean; model: string | null; orientation: string | null; exact: boolean }) {
    const { CANVAS_MARGIN, SAFE_AREA_TOP, SAFE_AREA_BOTTOM, PANEL_HEIGHT } = MOBILE_ADAPTATION.PORTRAIT;
    const { MIN_CANVAS_SIZE, MAX_CANVAS_SIZE } = MOBILE_ADAPTATION;

    // 使用传入的iPhone 16检测结果，或者使用DeviceManager检测
    const iPhone16Result = iPhone16Detection || (() => {
        // 如果没有传入检测结果，使用DeviceManager进行检测
        if (typeof window !== 'undefined') {
            try {
                const { DeviceManager } = require('../core/DeviceManager');
                const deviceManager = DeviceManager.getInstance();
                const layoutInfo = deviceManager.getDeviceLayoutMode(windowWidth, windowHeight);
                return {
                    detected: layoutInfo.iPhone16Model !== undefined,
                    model: layoutInfo.iPhone16Model || null,
                    orientation: layoutInfo.layoutMode === 'desktop' ? null : layoutInfo.layoutMode,
                    exact: layoutInfo.iPhone16Exact || false
                };
            } catch (error) {
                // 如果DeviceManager不可用，使用本地检测作为回退
                return detectiPhone16Series(windowWidth, windowHeight);
            }
        }
        return detectiPhone16Series(windowWidth, windowHeight);
    })();

    // 使用传入的面板高度，如果没有则使用默认值
    const actualPanelHeight = panelHeight || PANEL_HEIGHT;

    // 计算可用空间
    const availableWidth = windowWidth - CANVAS_MARGIN * 2;
    const availableHeight = windowHeight - actualPanelHeight - CANVAS_MARGIN - SAFE_AREA_TOP - SAFE_AREA_BOTTOM;

    let canvasSize: number;
    let maxCanvasSize: number = MAX_CANVAS_SIZE;

    // iPad竖屏特殊优化 - 充分利用屏幕宽度
    if (windowWidth >= 768 && windowWidth <= 1024 && windowHeight >= 1024) {
        // iPad全系列竖屏优化：标准iPad (768×1024)、iPad Pro 11" (834×1194)、iPad Pro 12.9" (1024×1366)
        canvasSize = Math.min(availableWidth, availableHeight);
        maxCanvasSize = Math.min(canvasSize, windowWidth - CANVAS_MARGIN * 2 - 20); // 预留20px安全边距
        
        // 针对不同iPad尺寸优化
        if (windowWidth >= 1000) {
            // iPad Pro 12.9" 竖屏 (1024×1366)
            maxCanvasSize = Math.min(canvasSize, 980);
        } else if (windowWidth >= 820) {
            // iPad Pro 11" 竖屏 (834×1194)
            maxCanvasSize = Math.min(canvasSize, 780);
        } else {
            // iPad 标准 竖屏 (768×1024)
            maxCanvasSize = Math.min(canvasSize, 720);
        }
    }
    // iPhone 16系列特殊优化
    else if (iPhone16Result.detected && iPhone16Result.orientation === 'portrait') {
        canvasSize = Math.min(availableWidth, availableHeight);

        // 根据不同iPhone 16机型设置不同的最大画布尺寸
        switch (iPhone16Result.model) {
            case 'iPhone 16e': // 390×844
                maxCanvasSize = Math.min(canvasSize, 355);
                break;
            case 'iPhone 16': // 393×852
                maxCanvasSize = Math.min(canvasSize, 360);
                break;
            case 'iPhone 16 Plus': // 430×932  
                maxCanvasSize = Math.min(canvasSize, 400);
                break;
            case 'iPhone 16 Pro': // 402×874
                maxCanvasSize = Math.min(canvasSize, 370);
                break;
            case 'iPhone 16 Pro Max': // 440×956
                maxCanvasSize = Math.min(canvasSize, 410);
                break;
            default:
                maxCanvasSize = Math.min(canvasSize, 380);
        }
    } else if (windowWidth <= 480 && windowHeight >= 800) {
        // 其他高分辨率手机竖屏模式（扩大范围以覆盖更多Android旗舰机型）
        canvasSize = Math.min(availableWidth, availableHeight);

        // 根据宽度范围进行更细粒度的优化，覆盖主流Android手机
        if (windowWidth >= 440) {
            // 超大屏手机 (类似iPhone 16 Pro Max, Samsung S24 Ultra等)
            maxCanvasSize = Math.min(canvasSize, 410);
        } else if (windowWidth >= 420) {
            // 大屏手机 (类似iPhone 16 Plus, Pixel 8 Pro等)
            maxCanvasSize = Math.min(canvasSize, 400);
        } else if (windowWidth >= 400) {
            // 中大屏手机 (类似iPhone 16 Pro, Xiaomi 14等)
            maxCanvasSize = Math.min(canvasSize, 380);
        } else if (windowWidth >= 390) {
            // 中等屏幕手机 (类似iPhone 16, Pixel 8, Galaxy S24等)
            maxCanvasSize = Math.min(canvasSize, 370);
        } else {
            // 标准尺寸手机 (覆盖其他Android中端机型)
            maxCanvasSize = Math.min(canvasSize, 340);
        }
    } else {
        // 其他设备使用标准计算
        canvasSize = Math.min(availableWidth, availableHeight);
        maxCanvasSize = MAX_CANVAS_SIZE;
    }

    // 应用最小值和最大值限制
    canvasSize = Math.max(MIN_CANVAS_SIZE, Math.min(canvasSize, maxCanvasSize));

    return {
        canvasSize,
        canvasMargin: CANVAS_MARGIN,
        safeAreaTop: SAFE_AREA_TOP,
        safeAreaBottom: SAFE_AREA_BOTTOM,
        // 调试信息
        debug: {
            windowSize: `${windowWidth}x${windowHeight}`,
            availableWidth,
            availableHeight,
            actualPanelHeight,
            iPhone16Model: iPhone16Result.model,
            iPhone16Detected: iPhone16Result.detected,
            maxCanvasSize,
            isHighResolutionPhone: windowWidth <= 460 && windowHeight >= 800,
            isIPadPortrait: windowWidth >= 768 && windowWidth <= 1024 && windowHeight >= 1024,
            iPadOptimization: windowWidth >= 768 && windowWidth <= 1024 && windowHeight >= 1024 ? '已启用' : '未启用',
        }
    };
}

/**
 * 计算移动端横屏画布尺寸
 * 针对iPhone 16全系列横屏优化
 * 重点：充分利用屏幕空间，让画布尽可能大
 */
export function calculateMobileLandscapeCanvasSize(windowWidth: number, windowHeight: number, iPhone16Detection?: { detected: boolean; model: string | null; orientation: string | null; exact: boolean }) {
    const { CANVAS_MARGIN, SAFE_AREA_TOP, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH } = MOBILE_ADAPTATION.LANDSCAPE;
    const { MIN_CANVAS_SIZE, MAX_CANVAS_SIZE } = MOBILE_ADAPTATION;

    // 使用传入的iPhone 16检测结果，或者使用DeviceManager检测
    const iPhone16Result = iPhone16Detection || (() => {
        // 如果没有传入检测结果，使用DeviceManager进行检测
        if (typeof window !== 'undefined') {
            try {
                const { DeviceManager } = require('../core/DeviceManager');
                const deviceManager = DeviceManager.getInstance();
                const layoutInfo = deviceManager.getDeviceLayoutMode(windowWidth, windowHeight);
                return {
                    detected: layoutInfo.iPhone16Model !== undefined,
                    model: layoutInfo.iPhone16Model || null,
                    orientation: layoutInfo.layoutMode === 'desktop' ? null : layoutInfo.layoutMode,
                    exact: layoutInfo.iPhone16Exact || false
                };
            } catch (error) {
                // 如果DeviceManager不可用，使用本地检测作为回退
                return detectiPhone16Series(windowWidth, windowHeight);
            }
        }
        return detectiPhone16Series(windowWidth, windowHeight);
    })();

    // 计算可用高度（这通常是限制因素）
    const availableHeight = windowHeight - CANVAS_MARGIN * 2 - SAFE_AREA_TOP;

    let panelWidth: number = MIN_PANEL_WIDTH;
    let canvasSize: number;
    let maxCanvasSize: number = 400;

    // iPhone 16系列特殊优化
    if (iPhone16Result.detected && iPhone16Result.orientation === 'landscape') {
        // 根据不同iPhone 16机型优化面板宽度和画布尺寸
        // 优化策略：较小屏幕需要更宽的面板以容纳tab按钮，较大屏幕可以适当减少面板宽度给画布更多空间
        switch (iPhone16Result.model) {
            case 'iPhone 16e': // 844×390 (最小屏幕，需要足够的面板宽度)
                panelWidth = 270; // 增加面板宽度确保tab按钮舒适显示
                maxCanvasSize = 350; // 适配较小的高度
                break;
            case 'iPhone 16': // 852×393 (小屏幕，需要较宽面板)
                panelWidth = 270; // 与16e保持一致，确保tab按钮显示良好
                maxCanvasSize = 360; // 相应调整画布尺寸
                break;
            case 'iPhone 16 Plus': // 932×430 (大屏幕，可以平衡面板和画布)
                panelWidth = 250; // 适中的面板宽度
                maxCanvasSize = 410; // 充分利用大屏空间
                break;
            case 'iPhone 16 Pro': // 874×402 (中等屏幕)
                panelWidth = 260; // 适中的面板宽度
                maxCanvasSize = 380; // 平衡面板和画布
                break;
            case 'iPhone 16 Pro Max': // 956×440 (最大屏幕，可以给画布更多空间)
                panelWidth = 260; // 适中的面板宽度，给画布更多空间
                maxCanvasSize = 420; // 充分利用超大屏空间
                break;
            default:
                panelWidth = 260; // 统一默认值，确保兼容性
                maxCanvasSize = 380;
        }

        const availableWidth = windowWidth - panelWidth - CANVAS_MARGIN * 2;
        canvasSize = Math.min(availableHeight, availableWidth);
        canvasSize = Math.min(canvasSize, maxCanvasSize);

    } else if (windowWidth >= 800 && windowHeight <= 480) {
        // 其他高分辨率手机横屏模式（扩大范围以覆盖更多Android旗舰机型）

        // 根据屏幕宽度动态调整，提供更细粒度的适配以支持各品牌手机
        if (windowWidth >= 950) {
            // 超大屏手机横屏 (类似iPhone 16 Pro Max, Samsung S24 Ultra等)
            panelWidth = 260;
            maxCanvasSize = 420;
        } else if (windowWidth >= 920) {
            // 大屏手机横屏 (类似iPhone 16 Plus, Pixel 8 Pro等)
            panelWidth = 250;
            maxCanvasSize = 410;
        } else if (windowWidth >= 870) {
            // 中大屏手机横屏 (类似iPhone 16 Pro, Xiaomi 14等)
            panelWidth = 260;
            maxCanvasSize = 380;
        } else if (windowWidth >= 850) {
            // 中等屏幕手机横屏 (类似iPhone 16, Pixel 8, Galaxy S24等)
            panelWidth = 270;
            maxCanvasSize = 360;
        } else {
            // 标准尺寸手机横屏 (覆盖其他Android中端机型)
            panelWidth = 270;
            maxCanvasSize = 350;
        }

        const availableWidth = windowWidth - panelWidth - CANVAS_MARGIN * 2;
        canvasSize = Math.min(availableHeight, availableWidth);
        canvasSize = Math.min(canvasSize, maxCanvasSize);

    } else {
        // 标准设备使用原有逻辑
        const availableWidth = windowWidth - MIN_PANEL_WIDTH - CANVAS_MARGIN * 2;
        canvasSize = Math.min(availableHeight, availableWidth);
        panelWidth = MIN_PANEL_WIDTH;
        maxCanvasSize = MAX_CANVAS_SIZE;
    }

    // 应用最小值和最大值限制
    canvasSize = Math.max(MIN_CANVAS_SIZE, Math.min(canvasSize, maxCanvasSize));
    panelWidth = Math.max(MIN_PANEL_WIDTH, Math.min(panelWidth, MAX_PANEL_WIDTH));

    return {
        canvasSize,
        panelWidth,
        canvasMargin: CANVAS_MARGIN,
        safeAreaTop: SAFE_AREA_TOP,
        // 调试信息
        debug: {
            windowSize: `${windowWidth}x${windowHeight}`,
            availableHeight,
            availableWidth: windowWidth - panelWidth - CANVAS_MARGIN * 2,
            iPhone16Model: iPhone16Result.model,
            iPhone16Detected: iPhone16Result.detected,
            maxCanvasSize,
            isHighResolutionLandscape: windowWidth >= 800 && windowHeight <= 460,
            spaceUtilization: `画布${canvasSize}px vs 可用高度${availableHeight}px`,
        }
    };
}

// ==================== iPhone 16 系列检测 ====================
// iPhone 16 detection logic moved to DeviceManager.ts for unified detection

/**
 * @deprecated Use DeviceManager.getInstance().getDeviceLayoutMode() instead
 * This function is kept for backward compatibility only
 */
function detectiPhone16Series(windowWidth: number, windowHeight: number) {
    // Try to use DeviceManager for detection
    if (typeof window !== 'undefined') {
        try {
            const { DeviceManager } = require('../core/DeviceManager');
            const deviceManager = DeviceManager.getInstance();
            const layoutInfo = deviceManager.getDeviceLayoutMode(windowWidth, windowHeight);
            return {
                detected: layoutInfo.iPhone16Model !== undefined,
                model: layoutInfo.iPhone16Model || null,
                orientation: layoutInfo.layoutMode === 'desktop' ? null : layoutInfo.layoutMode,
                exact: layoutInfo.iPhone16Exact || false
            };
        } catch (error) {
            console.warn('DeviceManager not available, iPhone 16 detection disabled');
        }
    }
    
    // Fallback: no detection
    return {
        detected: false,
        model: null,
        orientation: null,
        exact: false
    };
}

// ==================== 类型导出 ====================
// Device detection types moved to src/config/deviceConfig.ts
export type DeviceType = 'desktop' | 'tablet' | 'phone';
export type LayoutMode = 'desktop' | 'portrait' | 'landscape';