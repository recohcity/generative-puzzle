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

    // 🎯 移动端特殊场景处理
    this.handleMobileSpecificScenarios(previousState, newState);
  }

  /**
   * 🎯 处理移动端特殊场景
   * 基于真实的设备状态变化进行相应处理
   */
  private handleMobileSpecificScenarios(previousState: DeviceState, currentState: DeviceState): void {
    // 1. 设备旋转场景处理
    if (previousState.isPortrait !== currentState.isPortrait) {
      this.handleOrientationChange(previousState, currentState);
    }

    // 2. 设备类型变化处理（如iPad在不同模式下的识别）
    if (previousState.deviceType !== currentState.deviceType) {
      this.handleDeviceTypeChange(previousState, currentState);
    }

    // 3. 屏幕尺寸显著变化处理（可能是外接显示器或分屏模式）
    const sizeChangeThreshold = 100; // 100px的变化阈值
    if (Math.abs(previousState.screenWidth - currentState.screenWidth) > sizeChangeThreshold ||
        Math.abs(previousState.screenHeight - currentState.screenHeight) > sizeChangeThreshold) {
      this.handleSignificantSizeChange(previousState, currentState);
    }
  }

  /**
   * 🎯 处理设备旋转变化
   */
  private handleOrientationChange(previousState: DeviceState, currentState: DeviceState): void {
    deviceLogger.info('设备旋转检测', {
      from: previousState.isPortrait ? 'portrait' : 'landscape',
      to: currentState.isPortrait ? 'portrait' : 'landscape',
      screenSize: `${currentState.screenWidth}x${currentState.screenHeight}`
    });

    // 发射旋转事件给EventManager
    try {
      const { EventManager } = require('./EventManager');
      const eventManager = EventManager.getInstance();
      
      eventManager.emit('devicerotation', {
        from: {
          orientation: previousState.isPortrait ? 'portrait' : 'landscape',
          width: previousState.screenWidth,
          height: previousState.screenHeight
        },
        to: {
          orientation: currentState.isPortrait ? 'portrait' : 'landscape',
          width: currentState.screenWidth,
          height: currentState.screenHeight
        },
        timestamp: Date.now()
      }, 'DeviceManager');
    } catch (error) {
      deviceLogger.warn('Failed to emit device rotation event', error as Error);
    }
  }

  /**
   * 🎯 处理设备类型变化
   */
  private handleDeviceTypeChange(previousState: DeviceState, currentState: DeviceState): void {
    deviceLogger.info('设备类型变化检测', {
      from: previousState.deviceType,
      to: currentState.deviceType,
      reason: this.getDeviceTypeChangeReason(previousState, currentState)
    });

    // 可能的原因：iPad在不同模式下的识别、外接键盘等
    if (currentState.isIOS && previousState.deviceType !== currentState.deviceType) {
      deviceLogger.info('iOS设备模式变化', {
        possibleCause: 'iPad键盘连接/断开或分屏模式变化'
      });
    }
  }

  /**
   * 🎯 处理显著的屏幕尺寸变化
   */
  private handleSignificantSizeChange(previousState: DeviceState, currentState: DeviceState): void {
    const widthChange = currentState.screenWidth - previousState.screenWidth;
    const heightChange = currentState.screenHeight - previousState.screenHeight;

    deviceLogger.info('显著屏幕尺寸变化', {
      widthChange,
      heightChange,
      from: `${previousState.screenWidth}x${previousState.screenHeight}`,
      to: `${currentState.screenWidth}x${currentState.screenHeight}`,
      possibleCause: this.analyzeSizeChangeReason(widthChange, heightChange)
    });
  }

  /**
   * 🎯 分析设备类型变化原因
   */
  private getDeviceTypeChangeReason(previousState: DeviceState, currentState: DeviceState): string {
    if (previousState.isIOS && currentState.isIOS) {
      if (previousState.deviceType === 'phone' && currentState.deviceType === 'tablet') {
        return 'iPad可能连接了外接键盘';
      }
      if (previousState.deviceType === 'tablet' && currentState.deviceType === 'phone') {
        return 'iPad可能断开了外接键盘或进入分屏模式';
      }
    }
    
    return '屏幕尺寸或用户代理变化';
  }

  /**
   * 🎯 分析屏幕尺寸变化原因
   */
  private analyzeSizeChangeReason(widthChange: number, heightChange: number): string {
    if (Math.abs(widthChange) > Math.abs(heightChange)) {
      return widthChange > 0 ? '可能连接了外接显示器' : '可能断开了外接显示器';
    } else {
      if (heightChange < -200) {
        return '可能是虚拟键盘弹出';
      } else if (heightChange > 200) {
        return '可能是虚拟键盘收起或地址栏隐藏';
      }
    }
    
    return '未知原因的尺寸变化';
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