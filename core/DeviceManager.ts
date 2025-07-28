/**
 * DeviceManager - Unified device detection system
 * Consolidates all device detection logic from multiple conflicting implementations
 */

import {
  DEVICE_THRESHOLDS,
  IPHONE16_MODELS,
  DETECTION_CONFIG,
  LARGE_SCREEN_THRESHOLDS,
  USER_AGENT_PATTERNS,
  type DeviceState,
  type iPhone16Detection,
  type DeviceLayoutInfo
} from '../src/config/deviceConfig';
import { deviceLogger } from '../utils/logger';

// Interfaces now imported from deviceConfig.ts

export class DeviceManager {
  private static instance: DeviceManager;
  private currentState: DeviceState;
  private listeners: Set<(state: DeviceState) => void> = new Set();

  // Constants now imported from unified configuration

  private constructor() {
    this.currentState = this.detectDevice();
  }

  public static getInstance(): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }
    return DeviceManager.instance;
  }

  private detectDevice(): DeviceState {
    if (typeof window === 'undefined') {
      return this.getDefaultState();
    }

    const ua = navigator.userAgent;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // User agent detection - 优先使用用户代理检测
    const isAndroid = USER_AGENT_PATTERNS.ANDROID.test(ua);
    const isIPhone = USER_AGENT_PATTERNS.IPHONE.test(ua);
    const isIPad = USER_AGENT_PATTERNS.IPAD.test(ua) || (USER_AGENT_PATTERNS.MACINTOSH_TOUCH.test(ua) && 'ontouchend' in document);
    const isIOS = isIPhone || isIPad;
    const isMobileUserAgent = USER_AGENT_PATTERNS.MOBILE.test(ua);

    // Screen dimension analysis
    const isPortrait = screenHeight > screenWidth;
    const aspectRatio = Math.max(screenWidth, screenHeight) / Math.min(screenWidth, screenHeight);
    const isLongScreen = aspectRatio > DETECTION_CONFIG.ASPECT_RATIO_THRESHOLD && screenWidth < DETECTION_CONFIG.LARGE_SCREEN_WIDTH;

    // 触摸设备检测 - 增强移动设备识别
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileLikeScreen = (screenWidth <= DEVICE_THRESHOLDS.MOBILE_BREAKPOINT) || (isLongScreen && screenWidth < DETECTION_CONFIG.TOUCH_DEVICE_MAX_WIDTH);

    // iPhone 16 series detection
    const iPhone16Detection = this.detectiPhone16Series(screenWidth, screenHeight);

    // Device type determination with unified logic
    let deviceType: 'phone' | 'tablet' | 'desktop';
    let layoutMode: 'portrait' | 'landscape' | 'desktop';
    let isMobile: boolean;
    let isTablet: boolean;
    let isDesktop: boolean;

    // 优先使用用户代理检测 - 修复横屏问题
    if (isIOS || isAndroid) {
      deviceType = 'phone';
      layoutMode = isPortrait ? 'portrait' : 'landscape';
      isMobile = true;
      isTablet = false;
      isDesktop = false;

      deviceLogger.debug('用户代理检测为移动设备', {
        isIOS,
        isAndroid,
        deviceType,
        layoutMode,
        screenSize: `${screenWidth}x${screenHeight}`
      });
    }
    // Force mobile for iPhone 16 series
    else if (iPhone16Detection.detected) {
      deviceType = 'phone';
      layoutMode = iPhone16Detection.orientation as 'portrait' | 'landscape';
      isMobile = true;
      isTablet = false;
      isDesktop = false;

      deviceLogger.debug('iPhone 16系列检测', {
        model: iPhone16Detection.model,
        orientation: iPhone16Detection.orientation,
        exact: iPhone16Detection.exact,
        screenSize: `${screenWidth}x${screenHeight}`
      });
    }
    // Large desktop screen detection
    else if (screenWidth >= LARGE_SCREEN_THRESHOLDS.STANDARD_LARGE.width && screenHeight >= LARGE_SCREEN_THRESHOLDS.STANDARD_LARGE.height ||
      screenWidth >= LARGE_SCREEN_THRESHOLDS.ULTRAWIDE.width && screenHeight >= LARGE_SCREEN_THRESHOLDS.ULTRAWIDE.height ||
      screenWidth >= LARGE_SCREEN_THRESHOLDS.SUPER_WIDE.width) {
      deviceType = 'desktop';
      layoutMode = 'desktop';
      isMobile = false;
      isTablet = false;
      isDesktop = true;
    }
    // Mobile detection - 综合判断移动设备
    else if (isMobileUserAgent ||
      (isTouchDevice && isMobileLikeScreen) ||
      (isLongScreen && screenWidth < DETECTION_CONFIG.TOUCH_DEVICE_MAX_WIDTH) ||
      screenWidth < DEVICE_THRESHOLDS.MOBILE_BREAKPOINT) {
      deviceType = 'phone';
      layoutMode = isPortrait ? 'portrait' : 'landscape';
      isMobile = true;
      isTablet = false;
      isDesktop = false;

      deviceLogger.debug('综合检测为移动设备', {
        isMobileUserAgent,
        isTouchDevice,
        isMobileLikeScreen,
        isLongScreen,
        screenWidth,
        layoutMode,
        screenSize: `${screenWidth}x${screenHeight}`
      });
    }
    // Tablet detection
    else if (screenWidth >= DEVICE_THRESHOLDS.TABLET_MIN_WIDTH && screenWidth < DEVICE_THRESHOLDS.DESKTOP_MIN_WIDTH) {
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
      isMobile,
      isTablet,
      isDesktop,
      isPortrait,
      isAndroid,
      isIOS,
      screenWidth,
      screenHeight,
      userAgent: ua,
      deviceType,
      layoutMode
    };
  }

  private detectiPhone16Series(windowWidth: number, windowHeight: number): iPhone16Detection {
    // 委托给DeviceLayoutManager处理iPhone 16检测
    const { DeviceLayoutManager } = require('./DeviceLayoutManager');
    const layoutManager = DeviceLayoutManager.getInstance();
    return layoutManager.getiPhone16Detection(windowWidth, windowHeight);
  }

  private getDefaultState(): DeviceState {
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
  }

  public getState(): DeviceState {
    return { ...this.currentState };
  }

  public subscribe(listener: (state: DeviceState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public updateState(): void {
    const newState = this.detectDevice();
    const hasChanged = JSON.stringify(newState) !== JSON.stringify(this.currentState);

    deviceLogger.debug('设备状态检测', {
      previous: {
        deviceType: this.currentState.deviceType,
        layoutMode: this.currentState.layoutMode,
        screenSize: `${this.currentState.screenWidth}x${this.currentState.screenHeight}`
      },
      current: {
        deviceType: newState.deviceType,
        layoutMode: newState.layoutMode,
        screenSize: `${newState.screenWidth}x${newState.screenHeight}`
      },
      hasChanged
    });

    if (hasChanged) {
      const previousState = { ...this.currentState };
      const changes = this.getStateChanges(previousState, newState);
      
      this.currentState = newState;
      this.notifyListeners();
      
      // 发射设备状态变化事件
      this.emitDeviceStateChangeEvent(previousState, newState, changes);
    }
  }

  // 强制更新状态（用于页面刷新等场景）
  public forceUpdateState(): void {
    const previousState = { ...this.currentState };
    const newState = this.detectDevice();
    const changes = this.getStateChanges(previousState, newState);
    
    this.currentState = newState;
    this.notifyListeners();

    deviceLogger.info('强制更新设备状态', {
      deviceType: newState.deviceType,
      layoutMode: newState.layoutMode,
      screenSize: `${newState.screenWidth}x${newState.screenHeight}`
    });
    
    // 发射设备状态变化事件
    this.emitDeviceStateChangeEvent(previousState, newState, changes);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  /**
   * 获取状态变化的具体字段
   */
  private getStateChanges(previousState: DeviceState, currentState: DeviceState): string[] {
    const changes: string[] = [];
    
    if (previousState.deviceType !== currentState.deviceType) {
      changes.push('deviceType');
    }
    if (previousState.layoutMode !== currentState.layoutMode) {
      changes.push('layoutMode');
    }
    if (previousState.screenWidth !== currentState.screenWidth) {
      changes.push('screenWidth');
    }
    if (previousState.screenHeight !== currentState.screenHeight) {
      changes.push('screenHeight');
    }
    if (previousState.isPortrait !== currentState.isPortrait) {
      changes.push('isPortrait');
    }
    if (previousState.isMobile !== currentState.isMobile) {
      changes.push('isMobile');
    }
    if (previousState.isTablet !== currentState.isTablet) {
      changes.push('isTablet');
    }
    if (previousState.isDesktop !== currentState.isDesktop) {
      changes.push('isDesktop');
    }
    
    return changes;
  }

  /**
   * 发射设备状态变化事件
   */
  private emitDeviceStateChangeEvent(previousState: DeviceState, currentState: DeviceState, changes: string[]): void {
    if (changes.length === 0) return;
    
    try {
      // 动态导入EventManager避免循环依赖
      const { EventManager } = require('./EventManager');
      const eventManager = EventManager.getInstance();
      
      eventManager.emitDeviceStateChange(
        previousState,
        currentState,
        changes
      );
      
      deviceLogger.debug('发射设备状态变化事件', {
        changes,
        previousType: previousState.deviceType,
        currentType: currentState.deviceType
      });
    } catch (error) {
      deviceLogger.warn('Failed to emit device state change event', error as Error);
    }
  }

  // Utility methods for backward compatibility
  public isMobile(): boolean {
    return this.currentState.isMobile;
  }

  public isTablet(): boolean {
    return this.currentState.isTablet;
  }

  public isDesktop(): boolean {
    return this.currentState.isDesktop;
  }

  public isPortrait(): boolean {
    return this.currentState.isPortrait;
  }

  public getScreenDimensions(): { width: number; height: number } {
    return {
      width: this.currentState.screenWidth,
      height: this.currentState.screenHeight
    };
  }

  /**
   * @deprecated Use DeviceLayoutManager.getInstance().getDeviceLayoutMode() instead
   * This method is kept for backward compatibility only
   */
  public getDeviceLayoutMode(windowWidth?: number, windowHeight?: number): DeviceLayoutInfo {
    deviceLogger.warn('DeviceManager.getDeviceLayoutMode() is deprecated. Use DeviceLayoutManager.getInstance().getDeviceLayoutMode() instead.');
    
    // 委托给专门的布局管理器
    const { DeviceLayoutManager } = require('./DeviceLayoutManager');
    const layoutManager = DeviceLayoutManager.getInstance();
    return layoutManager.getDeviceLayoutMode(windowWidth, windowHeight);
  }

  /**
   * 获取设备信息摘要
   */
  public getDeviceSummary(): {
    type: string;
    layout: string;
    screen: string;
    userAgent: string;
    capabilities: string[];
  } {
    const state = this.currentState;
    const capabilities: string[] = [];
    
    if (state.isAndroid) capabilities.push('Android');
    if (state.isIOS) capabilities.push('iOS');
    if ('ontouchstart' in window) capabilities.push('Touch');
    if (navigator.maxTouchPoints > 0) capabilities.push('MultiTouch');
    
    return {
      type: state.deviceType,
      layout: state.layoutMode,
      screen: `${state.screenWidth}×${state.screenHeight}`,
      userAgent: state.userAgent.substring(0, 50) + '...',
      capabilities
    };
  }

  /**
   * 检查设备是否支持特定功能
   */
  public supportsFeature(feature: 'touch' | 'orientation' | 'vibration' | 'geolocation'): boolean {
    switch (feature) {
      case 'touch':
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      case 'orientation':
        return 'orientation' in window || 'onorientationchange' in window;
      case 'vibration':
        return 'vibrate' in navigator;
      case 'geolocation':
        return 'geolocation' in navigator;
      default:
        return false;
    }
  }

  /**
   * 获取设备性能等级估算
   */
  public getPerformanceLevel(): 'low' | 'medium' | 'high' {
    const { screenWidth, screenHeight, deviceType } = this.currentState;
    const totalPixels = screenWidth * screenHeight;
    
    // 基于设备类型和屏幕分辨率估算性能
    if (deviceType === 'desktop') {
      return totalPixels > 2073600 ? 'high' : 'medium'; // 1920x1080 = 2073600
    } else if (deviceType === 'tablet') {
      return 'medium';
    } else {
      // 手机设备
      if (totalPixels > 1000000) { // 高分辨率手机
        return 'medium';
      } else {
        return 'low';
      }
    }
  }

  /**
   * 检查是否为特定的iPhone型号
   */
  public isiPhone16Series(): boolean {
    const iPhone16Detection = this.detectiPhone16Series(
      this.currentState.screenWidth,
      this.currentState.screenHeight
    );
    return iPhone16Detection.detected;
  }

  /**
   * 获取详细的iPhone 16检测信息
   */
  public getiPhone16Info(): iPhone16Detection {
    return this.detectiPhone16Series(
      this.currentState.screenWidth,
      this.currentState.screenHeight
    );
  }
}