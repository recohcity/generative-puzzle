/**
 * DeviceLayoutManager - 设备布局管理器
 * 从DeviceManager中分离出来的布局相关逻辑
 * 专门处理设备布局模式的判断和计算
 */

import {
  DEVICE_THRESHOLDS,
  IPHONE17_MODELS,
  IPHONE16_MODELS,
  DETECTION_CONFIG,
  LARGE_SCREEN_THRESHOLDS,
  USER_AGENT_PATTERNS,
  type DeviceLayoutInfo,
  type iPhoneDetectionResult
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
   */
  public getDeviceLayoutMode(windowWidth?: number, windowHeight?: number): DeviceLayoutInfo {
    // 使用提供的尺寸或当前屏幕尺寸
    const width = windowWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const height = windowHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 720);

    // 🎯 2026 优先：首先检测 iPhone 17 系列
    const iPhone17Detection = this.detectiPhoneSeries(width, height, 17);
    if (iPhone17Detection.detected) {
      return {
        deviceType: 'phone' as const,
        layoutMode: iPhone17Detection.orientation as 'portrait' | 'landscape',
        forceReason: 'iphone17_series',
        iPhoneModel: iPhone17Detection.model,
        iPhoneExact: iPhone17Detection.exact,
        generation: 17
      };
    }

    // 其次检测 iPhone 16 系列
    const iPhone16Detection = this.detectiPhoneSeries(width, height, 16);
    if (iPhone16Detection.detected) {
      return {
        deviceType: 'phone' as const,
        layoutMode: iPhone16Detection.orientation as 'portrait' | 'landscape',
        forceReason: 'iphone16_series',
        iPhoneModel: iPhone16Detection.model,
        iPhoneExact: iPhone16Detection.exact,
        generation: 16
      };
    }

    // 计算宽高比，用于识别移动设备的长条形屏幕
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    const isLongScreen = aspectRatio > DETECTION_CONFIG.ASPECT_RATIO_THRESHOLD && width < DETECTION_CONFIG.LARGE_SCREEN_WIDTH;

    // 检测用户代理
    let isMobileUserAgent = false;
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      isMobileUserAgent = USER_AGENT_PATTERNS.MOBILE.test(ua);
    }

    // 高分辨率移动设备检测
    const isHighResolutionMobile = isLongScreen && (
      (width > 1000 && height > 2000) || 
      (height > 1000 && width > 2000)
    );
    
    // 桌面大屏幕检测
    const isLargeDesktopScreen = (width >= LARGE_SCREEN_THRESHOLDS.STANDARD_LARGE.width && height >= LARGE_SCREEN_THRESHOLDS.STANDARD_LARGE.height) || 
                                (width >= LARGE_SCREEN_THRESHOLDS.ULTRAWIDE.width && height >= LARGE_SCREEN_THRESHOLDS.ULTRAWIDE.height) ||
                                (width >= LARGE_SCREEN_THRESHOLDS.SUPER_WIDE.width);
    
    const forceDesktop = isLargeDesktopScreen || 
                        (width >= LARGE_SCREEN_THRESHOLDS.HIGH_RESOLUTION.width && height >= LARGE_SCREEN_THRESHOLDS.HIGH_RESOLUTION.height) ||
                        (width * height >= LARGE_SCREEN_THRESHOLDS.PIXEL_THRESHOLD);
    
    // 🎯 2026 iPad 专项优化：横竖屏分流方案
    const isPortrait = height > width;
    const isIPadUA = (typeof navigator !== 'undefined' && 
      (USER_AGENT_PATTERNS.IPAD.test(navigator.userAgent) || 
      (USER_AGENT_PATTERNS.MACINTOSH_TOUCH.test(navigator.userAgent) && navigator.maxTouchPoints > 0)));

    if (isIPadUA) {
      if (isPortrait) {
        // iPad 竖屏：跟随手机竖屏模式适配显示 (上下堆叠)，避免坐标错乱
        return {
          deviceType: 'phone' as const,
          layoutMode: 'portrait' as const,
          forceReason: 'ipad_portrait_to_phone_layout'
        };
      } else {
        // iPad 横屏：强行进入“微型电脑”模式 (桌面模式)
        return {
          deviceType: 'desktop' as const,
          layoutMode: 'desktop' as const,
          forceReason: 'ipad_landscape_to_desktop'
        };
      }
    }

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

    if (forceDesktop) {
      return {
        deviceType: 'desktop' as const,
        layoutMode: 'desktop' as const,
        forceReason: 'large_screen'
      };
    }
    
    // 传统的宽度判断（用于真正的桌面/笔记本设备）
    if (width >= DEVICE_THRESHOLDS.DESKTOP_MIN_WIDTH && (!isLongScreen || width >= DETECTION_CONFIG.LARGE_SCREEN_WIDTH)) {
      return {
        deviceType: 'desktop' as const,
        layoutMode: 'desktop' as const,
      };
    } else if (width >= DEVICE_THRESHOLDS.TABLET_MIN_WIDTH && (!isLongScreen || width >= DETECTION_CONFIG.TOUCH_DEVICE_MAX_WIDTH)) {
      return {
        deviceType: 'tablet' as const,
        layoutMode: 'desktop' as const, // 平板横屏依然使用桌面布局
      };
    } else {
      return {
        deviceType: 'phone' as const,
        layoutMode: width > height ? 'landscape' : 'portrait' as const,
      };
    }
  }

  /**
   * 通用 iPhone 系列检测 (支持 16/17)
   */
  private detectiPhoneSeries(windowWidth: number, windowHeight: number, generation: 16 | 17): iPhoneDetectionResult {
    const models = generation === 17 ? IPHONE17_MODELS : IPHONE16_MODELS;
    
    // First pass: Exact matches
    for (const [modelName, dimensions] of Object.entries(models)) {
      const { portrait, landscape } = dimensions;
      if ((windowWidth === portrait.width && windowHeight === portrait.height) ||
        (windowWidth === landscape.width && windowHeight === landscape.height)) {
        return {
          detected: true,
          model: modelName,
          orientation: windowWidth > windowHeight ? 'landscape' : 'portrait',
          exact: true,
          generation
        };
      }
    }

    // Second pass: Closest match
    const tolerance = DETECTION_CONFIG.IPHONE_TOLERANCE;
    let bestMatch: { model: string; distance: number; orientation: string; exact: boolean } | null = null;

    for (const [modelName, dimensions] of Object.entries(models)) {
      const { portrait, landscape } = dimensions;
      const portraitDistance = Math.sqrt(Math.pow(windowWidth - portrait.width, 2) + Math.pow(windowHeight - portrait.height, 2));
      if (portraitDistance <= tolerance * Math.sqrt(2)) {
        if (!bestMatch || portraitDistance < bestMatch.distance) {
          bestMatch = { model: modelName, distance: portraitDistance, orientation: 'portrait', exact: false };
        }
      }
      const landscapeDistance = Math.sqrt(Math.pow(windowWidth - landscape.width, 2) + Math.pow(windowHeight - landscape.height, 2));
      if (landscapeDistance <= tolerance * Math.sqrt(2)) {
        if (!bestMatch || landscapeDistance < bestMatch.distance) {
          bestMatch = { model: modelName, distance: landscapeDistance, orientation: 'landscape', exact: false };
        }
      }
    }

    if (bestMatch) {
      return {
        detected: true,
        model: bestMatch.model,
        orientation: bestMatch.orientation as 'portrait' | 'landscape',
        exact: bestMatch.exact,
        generation
      };
    }

    return { detected: false, model: null, orientation: null, exact: false, generation: null };
  }

  public isMobileLayout(width?: number, height?: number): boolean {
    return this.getDeviceLayoutMode(width, height).deviceType === 'phone';
  }

  public isDesktopLayout(width?: number, height?: number): boolean {
    return this.getDeviceLayoutMode(width, height).deviceType === 'desktop';
  }

  public isTabletLayout(width?: number, height?: number): boolean {
    return this.getDeviceLayoutMode(width, height).deviceType === 'tablet';
  }

  /**
   * 获取最新的 iPhone 检测信息 (优先 17)
   */
  public getiPhoneDetection(width?: number, height?: number): iPhoneDetectionResult {
    const w = width ?? (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const h = height ?? (typeof window !== 'undefined' ? window.innerHeight : 720);
    const det17 = this.detectiPhoneSeries(w, h, 17);
    if (det17.detected) return det17;
    return this.detectiPhoneSeries(w, h, 16);
  }

  /** @deprecated use getiPhoneDetection */
  public getiPhone16Detection(width?: number, height?: number): iPhoneDetectionResult {
    return this.detectiPhoneSeries(width ?? 1280, height ?? 720, 16);
  }
}