/**
 * DeviceLayoutManager - 设备布局管理器
 * 从DeviceManager中分离出来的布局相关逻辑
 * 专门处理设备布局模式的判断和计算
 */

import {
  DEVICE_THRESHOLDS,
  IPHONE16_MODELS,
  DETECTION_CONFIG,
  LARGE_SCREEN_THRESHOLDS,
  USER_AGENT_PATTERNS,
  type DeviceLayoutInfo,
  type iPhone16Detection
} from '../src/config/deviceConfig';

export class DeviceLayoutManager {
  private static instance: DeviceLayoutManager;

  private constructor() {}

  public static getInstance(): DeviceLayoutManager {
    if (!DeviceLayoutManager.instance) {
      DeviceLayoutManager.instance = new DeviceLayoutManager();
    }
    return DeviceLayoutManager.instance;
  }

  /**
   * 获取设备布局模式信息
   * 这是从DeviceManager.getDeviceLayoutMode移过来的逻辑
   */
  public getDeviceLayoutMode(windowWidth?: number, windowHeight?: number): DeviceLayoutInfo {
    // 使用提供的尺寸或当前屏幕尺寸
    const width = windowWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const height = windowHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 720);

    // 首先检测iPhone 16系列
    const iPhone16Detection = this.detectiPhone16Series(width, height);
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
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    
    // 长宽比大于1.8通常是手机屏幕，但超宽屏桌面显示器也可能有较大的宽高比
    // 因此，我们需要额外检查屏幕尺寸，排除大屏幕显示器
    const isLongScreen = aspectRatio > DETECTION_CONFIG.ASPECT_RATIO_THRESHOLD && width < DETECTION_CONFIG.LARGE_SCREEN_WIDTH;

    // 检测用户代理（如果在浏览器环境中）
    let isMobileUserAgent = false;
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      isMobileUserAgent = USER_AGENT_PATTERNS.MOBILE.test(ua);
    }

    // 高分辨率移动设备检测：宽高比很大的屏幕通常是手机
    // 但需要排除桌面端的大屏幕显示器
    const isHighResolutionMobile = isLongScreen && (
      (width > 1000 && height > 2000) || // 竖屏高分辨率手机
      (height > 1000 && width > 2000)    // 横屏高分辨率手机
    );
    
    // 检测是否是桌面大屏幕 - 更强的检测逻辑，支持超宽屏
    const isLargeDesktopScreen = (width >= LARGE_SCREEN_THRESHOLDS.STANDARD_LARGE.width && height >= LARGE_SCREEN_THRESHOLDS.STANDARD_LARGE.height) || // 标准大屏幕
                                (width >= LARGE_SCREEN_THRESHOLDS.ULTRAWIDE.width && height >= LARGE_SCREEN_THRESHOLDS.ULTRAWIDE.height) || // 超宽屏
                                (width >= LARGE_SCREEN_THRESHOLDS.SUPER_WIDE.width); // 任何超过3000px宽的屏幕都视为桌面
    
    // 强制桌面模式的条件
    const forceDesktop = isLargeDesktopScreen || 
                        (width >= LARGE_SCREEN_THRESHOLDS.HIGH_RESOLUTION.width && height >= LARGE_SCREEN_THRESHOLDS.HIGH_RESOLUTION.height) || // 宽屏桌面
                        (width * height >= LARGE_SCREEN_THRESHOLDS.PIXEL_THRESHOLD); // 总像素数超过250万的大屏幕
    
    // 强制移动端判断条件 - 排除桌面大屏幕
    const forceMobile = (isMobileUserAgent || isHighResolutionMobile || height < DEVICE_THRESHOLDS.DESKTOP_MOBILE_HEIGHT) && !forceDesktop;

    if (forceMobile) {
      return {
        deviceType: 'phone' as const,
        layoutMode: width > height ? 'landscape' : 'portrait' as const,
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
    if (width >= DEVICE_THRESHOLDS.DESKTOP_MIN_WIDTH && (!isLongScreen || width >= DETECTION_CONFIG.LARGE_SCREEN_WIDTH)) {
      return {
        deviceType: 'desktop' as const,
        layoutMode: 'desktop' as const,
      };
    } else if (width >= DEVICE_THRESHOLDS.TABLET_MIN_WIDTH && (!isLongScreen || width >= DETECTION_CONFIG.TOUCH_DEVICE_MAX_WIDTH)) {
      return {
        deviceType: 'tablet' as const,
        layoutMode: 'desktop' as const, // 平板使用桌面布局
      };
    } else {
      return {
        deviceType: 'phone' as const,
        layoutMode: width > height ? 'landscape' : 'portrait' as const,
      };
    }
  }

  /**
   * iPhone 16系列检测
   * 从DeviceManager中移过来的逻辑
   */
  private detectiPhone16Series(windowWidth: number, windowHeight: number): iPhone16Detection {
    // First pass: Look for exact matches (highest priority)
    for (const [modelName, dimensions] of Object.entries(IPHONE16_MODELS)) {
      const { portrait, landscape } = dimensions;

      if ((windowWidth === portrait.width && windowHeight === portrait.height) ||
        (windowWidth === landscape.width && windowHeight === landscape.height)) {
        return {
          detected: true,
          model: modelName,
          orientation: windowWidth > windowHeight ? 'landscape' : 'portrait',
          exact: true
        };
      }
    }

    // Second pass: Look for closest match within tolerance (prioritize smaller distance)
    const tolerance = DETECTION_CONFIG.IPHONE16_TOLERANCE;
    let bestMatch: { model: string; distance: number; orientation: string; exact: boolean } | null = null;

    for (const [modelName, dimensions] of Object.entries(IPHONE16_MODELS)) {
      const { portrait, landscape } = dimensions;

      // Check portrait orientation
      const portraitDistance = Math.sqrt(
        Math.pow(windowWidth - portrait.width, 2) + 
        Math.pow(windowHeight - portrait.height, 2)
      );
      
      if (portraitDistance <= tolerance * Math.sqrt(2)) { // Diagonal tolerance
        if (!bestMatch || portraitDistance < bestMatch.distance) {
          bestMatch = {
            model: modelName,
            distance: portraitDistance,
            orientation: 'portrait',
            exact: false
          };
        }
      }

      // Check landscape orientation
      const landscapeDistance = Math.sqrt(
        Math.pow(windowWidth - landscape.width, 2) + 
        Math.pow(windowHeight - landscape.height, 2)
      );
      
      if (landscapeDistance <= tolerance * Math.sqrt(2)) { // Diagonal tolerance
        if (!bestMatch || landscapeDistance < bestMatch.distance) {
          bestMatch = {
            model: modelName,
            distance: landscapeDistance,
            orientation: 'landscape',
            exact: false
          };
        }
      }
    }

    if (bestMatch) {
      return {
        detected: true,
        model: bestMatch.model,
        orientation: bestMatch.orientation as 'portrait' | 'landscape',
        exact: bestMatch.exact
      };
    }

    return {
      detected: false,
      model: null,
      orientation: null,
      exact: false
    };
  }

  /**
   * 检查是否为移动设备布局
   */
  public isMobileLayout(width?: number, height?: number): boolean {
    const layoutInfo = this.getDeviceLayoutMode(width, height);
    return layoutInfo.deviceType === 'phone';
  }

  /**
   * 检查是否为桌面设备布局
   */
  public isDesktopLayout(width?: number, height?: number): boolean {
    const layoutInfo = this.getDeviceLayoutMode(width, height);
    return layoutInfo.deviceType === 'desktop';
  }

  /**
   * 检查是否为平板设备布局
   */
  public isTabletLayout(width?: number, height?: number): boolean {
    const layoutInfo = this.getDeviceLayoutMode(width, height);
    return layoutInfo.deviceType === 'tablet';
  }

  /**
   * 获取iPhone 16检测结果
   */
  public getiPhone16Detection(width?: number, height?: number): iPhone16Detection {
    const w = width ?? (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const h = height ?? (typeof window !== 'undefined' ? window.innerHeight : 720);
    return this.detectiPhone16Series(w, h);
  }
}