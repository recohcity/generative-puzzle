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
export function calculateMobilePortraitCanvasSize(windowWidth: number, windowHeight: number, panelHeight?: number) {
    const { CANVAS_MARGIN, SAFE_AREA_TOP, SAFE_AREA_BOTTOM, PANEL_HEIGHT } = MOBILE_ADAPTATION.PORTRAIT;
    const { MIN_CANVAS_SIZE, MAX_CANVAS_SIZE } = MOBILE_ADAPTATION;

    // 检测iPhone 16系列
    const iPhone16Detection = detectiPhone16Series(windowWidth, windowHeight);

    // 使用传入的面板高度，如果没有则使用默认值
    const actualPanelHeight = panelHeight || PANEL_HEIGHT;

    // 计算可用空间
    const availableWidth = windowWidth - CANVAS_MARGIN * 2;
    const availableHeight = windowHeight - actualPanelHeight - CANVAS_MARGIN - SAFE_AREA_TOP - SAFE_AREA_BOTTOM;

    let canvasSize: number;
    let maxCanvasSize: number = MAX_CANVAS_SIZE;

    // iPhone 16系列特殊优化
    if (iPhone16Detection.detected && iPhone16Detection.orientation === 'portrait') {
        canvasSize = Math.min(availableWidth, availableHeight);

        // 根据不同iPhone 16机型设置不同的最大画布尺寸
        switch (iPhone16Detection.model) {
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
    } else if (windowWidth <= 460 && windowHeight >= 800) {
        // 其他高分辨率手机竖屏模式（扩大范围以包含iPhone 16 Pro Max）
        canvasSize = Math.min(availableWidth, availableHeight);

        // 根据宽度范围进行优化
        if (windowWidth >= 430) {
            // 大屏手机 (iPhone 16 Plus, Pro Max等)
            maxCanvasSize = Math.min(canvasSize, 400);
        } else if (windowWidth >= 390) {
            // 中等屏幕手机 (iPhone 16, Pro等)
            maxCanvasSize = Math.min(canvasSize, 370);
        } else {
            // 标准尺寸手机
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
            iPhone16Model: iPhone16Detection.model,
            iPhone16Detected: iPhone16Detection.detected,
            maxCanvasSize,
            isHighResolutionPhone: windowWidth <= 460 && windowHeight >= 800,
        }
    };
}

/**
 * 计算移动端横屏画布尺寸
 * 针对iPhone 16全系列横屏优化
 * 重点：充分利用屏幕空间，让画布尽可能大
 */
export function calculateMobileLandscapeCanvasSize(windowWidth: number, windowHeight: number) {
    const { CANVAS_MARGIN, SAFE_AREA_TOP, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH } = MOBILE_ADAPTATION.LANDSCAPE;
    const { MIN_CANVAS_SIZE, MAX_CANVAS_SIZE } = MOBILE_ADAPTATION;

    // 检测iPhone 16系列
    const iPhone16Detection = detectiPhone16Series(windowWidth, windowHeight);

    // 计算可用高度（这通常是限制因素）
    const availableHeight = windowHeight - CANVAS_MARGIN * 2 - SAFE_AREA_TOP;

    let panelWidth: number = MIN_PANEL_WIDTH;
    let canvasSize: number;
    let maxCanvasSize: number = 400;

    // iPhone 16系列特殊优化
    if (iPhone16Detection.detected && iPhone16Detection.orientation === 'landscape') {
        // 根据不同iPhone 16机型优化面板宽度和画布尺寸
        // 优化策略：较小屏幕需要更宽的面板以容纳tab按钮，较大屏幕可以适当减少面板宽度给画布更多空间
        switch (iPhone16Detection.model) {
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

    } else if (windowWidth >= 800 && windowHeight <= 460) {
        // 其他高分辨率手机横屏模式（扩大范围以包含iPhone 16 Pro Max）

        // 根据屏幕宽度动态调整，与iPhone 16系列保持一致的优化策略
        if (windowWidth >= 950) {
            // 超大屏手机 (类似iPhone 16 Pro Max)
            panelWidth = 260; // 与iPhone 16 Pro Max保持一致
            maxCanvasSize = 420;
        } else if (windowWidth >= 900) {
            // 大屏手机 (类似iPhone 16 Plus)
            panelWidth = 250; // 与iPhone 16 Plus保持一致
            maxCanvasSize = 410;
        } else if (windowWidth >= 850) {
            // 中等屏幕手机 (类似iPhone 16 Pro)
            panelWidth = 260; // 与iPhone 16 Pro保持一致
            maxCanvasSize = 380;
        } else {
            // 标准尺寸手机 (类似iPhone 16)
            panelWidth = 270; // 与iPhone 16保持一致
            maxCanvasSize = 360;
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
            iPhone16Model: iPhone16Detection.model,
            iPhone16Detected: iPhone16Detection.detected,
            maxCanvasSize,
            isHighResolutionLandscape: windowWidth >= 800 && windowHeight <= 460,
            spaceUtilization: `画布${canvasSize}px vs 可用高度${availableHeight}px`,
        }
    };
}

// ==================== iPhone 16 系列检测 ====================
/**
 * 检测iPhone 16系列设备
 */
export function detectiPhone16Series(windowWidth: number, windowHeight: number) {
    // iPhone 16系列逻辑像素尺寸（5个机型）
    const iPhone16Models = {
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

    // 检测当前设备是否匹配iPhone 16系列
    for (const [modelName, dimensions] of Object.entries(iPhone16Models)) {
        const { portrait, landscape } = dimensions;

        // 精确匹配
        if ((windowWidth === portrait.width && windowHeight === portrait.height) ||
            (windowWidth === landscape.width && windowHeight === landscape.height)) {
            return {
                detected: true,
                model: modelName,
                orientation: windowWidth > windowHeight ? 'landscape' : 'portrait',
                exact: true
            };
        }

        // 范围匹配（允许±10px的误差）
        const tolerance = 10;
        const isPortraitRange = Math.abs(windowWidth - portrait.width) <= tolerance &&
            Math.abs(windowHeight - portrait.height) <= tolerance;
        const isLandscapeRange = Math.abs(windowWidth - landscape.width) <= tolerance &&
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
}

/**
 * 判断设备类型和布局模式
 * 新逻辑：综合考虑宽高比、用户代理、屏幕尺寸等因素，特别优化iPhone 16系列
 */
export function getDeviceLayoutMode(windowWidth: number, windowHeight: number) {
    const { DESKTOP_MIN_WIDTH, TABLET_MIN_WIDTH, DESKTOP_MOBILE_HEIGHT } = DEVICE_THRESHOLDS;

    // 首先检测iPhone 16系列
    const iPhone16Detection = detectiPhone16Series(windowWidth, windowHeight);
    if (iPhone16Detection.detected) {
        return {
            deviceType: 'phone' as const,
            layoutMode: iPhone16Detection.orientation as 'portrait' | 'landscape',
            forceReason: 'iphone16_series',
            iPhone16Model: iPhone16Detection.model,
            iPhone16Exact: iPhone16Detection.exact
        };
    }

    // 计算宽高比，用于识别移动设备的长条形屏幕
    const aspectRatio = Math.max(windowWidth, windowHeight) / Math.min(windowWidth, windowHeight);
    
    // 长宽比大于1.8通常是手机屏幕，但超宽屏桌面显示器也可能有较大的宽高比
    // 因此，我们需要额外检查屏幕尺寸，排除大屏幕显示器
    const isLongScreen = aspectRatio > 1.8 && windowWidth < 2000;

    // 检测用户代理（如果在浏览器环境中）
    let isMobileUserAgent = false;
    if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent;
        isMobileUserAgent = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    }

    // 高分辨率移动设备检测：宽高比很大的屏幕通常是手机
    // 但需要排除桌面端的大屏幕显示器
    const isHighResolutionMobile = isLongScreen && (
        (windowWidth > 1000 && windowHeight > 2000) || // 竖屏高分辨率手机
        (windowHeight > 1000 && windowWidth > 2000)    // 横屏高分辨率手机
    );
    
    // 检测是否是桌面大屏幕 - 更强的检测逻辑，支持超宽屏
    const isLargeDesktopScreen = (windowWidth >= 1920 && windowHeight >= 900) || // 标准大屏幕
                                (windowWidth >= 2560 && windowHeight >= 800) || // 超宽屏
                                (windowWidth >= 3000); // 任何超过3000px宽的屏幕都视为桌面
    
    // 强制桌面模式的条件
    const forceDesktop = isLargeDesktopScreen || 
                        (windowWidth >= 1600 && windowHeight >= 800) || // 宽屏桌面
                        (windowWidth * windowHeight >= 2500000); // 总像素数超过250万的大屏幕
    
    // 强制移动端判断条件 - 排除桌面大屏幕
    const forceMobile = (isMobileUserAgent || isHighResolutionMobile || windowHeight < DESKTOP_MOBILE_HEIGHT) && !forceDesktop;

    if (forceMobile) {
        return {
            deviceType: 'phone' as const,
            layoutMode: windowWidth > windowHeight ? 'landscape' : 'portrait' as const,
            forceReason: isMobileUserAgent ? 'user_agent' :
                isHighResolutionMobile ? 'high_resolution_mobile' :
                    'height_threshold'
        };
    }

    // 强制桌面模式优先判断
    if (forceDesktop) {
        return {
            deviceType: 'desktop' as const,
            layoutMode: 'desktop' as const,
            forceReason: 'large_screen'
        };
    }
    
    // 传统的宽度判断（用于真正的桌面/平板设备）
    if (windowWidth >= DESKTOP_MIN_WIDTH && (!isLongScreen || windowWidth >= 2000)) {
        return {
            deviceType: 'desktop' as const,
            layoutMode: 'desktop' as const,
        };
    } else if (windowWidth >= TABLET_MIN_WIDTH && (!isLongScreen || windowWidth >= 1200)) {
        return {
            deviceType: 'tablet' as const,
            layoutMode: 'desktop' as const, // 平板使用桌面布局
        };
    } else {
        return {
            deviceType: 'phone' as const,
            layoutMode: windowWidth > windowHeight ? 'landscape' : 'portrait' as const,
        };
    }
}

// ==================== 类型导出 ====================
export type DeviceType = 'desktop' | 'tablet' | 'phone';
export type LayoutMode = 'desktop' | 'portrait' | 'landscape';
export type DeviceLayoutInfo = ReturnType<typeof getDeviceLayoutMode>;