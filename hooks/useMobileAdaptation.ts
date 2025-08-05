/**
 * useMobileAdaptation - 移动端适配React Hook
 * 
 * 🎯 目标：为React组件提供移动端适配功能
 * 
 * 核心功能：
 * 1. 基于现有系统的移动端适配
 * 2. 集成移动端增强功能
 * 3. 提供统一的移动端状态管理
 * 4. 自动处理组件生命周期
 */

import { useState, useEffect, useCallback } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useMobileEnhancements, MobileEnhancementCallbacks } from './useMobileEnhancements';

export interface UseMobileAdaptationOptions extends MobileEnhancementCallbacks {
  enableOrientationTracking?: boolean;
  enableViewportTracking?: boolean;
  enableKeyboardTracking?: boolean;
  enableNetworkTracking?: boolean;
  enablePerformanceMonitoring?: boolean;
}

export interface MobileAdaptationHookResult {
  // 基础设备信息
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: 'phone' | 'tablet' | 'desktop';
  
  // 设备状态
  orientation: 'portrait' | 'landscape';
  isPortrait: boolean;
  isLandscape: boolean;
  
  // 移动端增强功能状态
  isRotating: boolean;
  rotationStable: boolean;
  keyboardVisible: boolean;
  keyboardHeight: number;
  networkOnline: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
  appInBackground: boolean;
  
  // 视口信息
  viewportHeight: number;
  addressBarVisible: boolean;
  addressBarHeight: number;
  
  // 控制方法
  forceDetectKeyboard: () => void;
  getNetworkInfo: () => any;
  getMemoryInfo: () => any;
  shouldOptimizePerformance: () => boolean;
}

/**
 * 移动端适配Hook
 */
export function useMobileAdaptation(
  options: UseMobileAdaptationOptions = {}
): MobileAdaptationHookResult {
  const {
    enableOrientationTracking = true,
    enableViewportTracking = true,
    enableKeyboardTracking = true,
    enableNetworkTracking = true,
    enablePerformanceMonitoring = true,
    onRotationStart,
    onRotationEnd,
    onKeyboardShow,
    onKeyboardHide,
    onNetworkChange,
    onMemoryPressure,
    onAppBackground,
    onAppForeground
  } = options;

  // 使用现有的设备检测系统
  const device = useDeviceDetection();

  // 使用移动端增强功能
  const mobileEnhancements = useMobileEnhancements({
    onRotationStart: enableOrientationTracking ? onRotationStart : undefined,
    onRotationEnd: enableOrientationTracking ? onRotationEnd : undefined,
    onKeyboardShow: enableKeyboardTracking ? onKeyboardShow : undefined,
    onKeyboardHide: enableKeyboardTracking ? onKeyboardHide : undefined,
    onNetworkChange: enableNetworkTracking ? onNetworkChange : undefined,
    onMemoryPressure: enablePerformanceMonitoring ? onMemoryPressure : undefined,
    onAppBackground,
    onAppForeground
  });

  // 计算派生状态
  const isPortrait = device.isPortrait;
  const isLandscape = !device.isPortrait;
  const orientation = isPortrait ? 'portrait' : 'landscape';

  // 返回Hook结果
  return {
    // 基础设备信息
    isMobile: device.isMobile,
    isTablet: device.isTablet,
    isDesktop: device.isDesktop,
    deviceType: device.deviceType,
    
    // 设备状态
    orientation,
    isPortrait,
    isLandscape,
    
    // 移动端增强功能状态
    isRotating: mobileEnhancements.isRotating,
    rotationStable: mobileEnhancements.state.rotationStable,
    keyboardVisible: mobileEnhancements.keyboardVisible,
    keyboardHeight: mobileEnhancements.keyboardHeight,
    networkOnline: mobileEnhancements.networkOnline,
    performanceLevel: mobileEnhancements.performanceLevel,
    appInBackground: mobileEnhancements.appInBackground,
    
    // 视口信息
    viewportHeight: mobileEnhancements.state.viewportHeight,
    addressBarVisible: mobileEnhancements.state.addressBarVisible,
    addressBarHeight: mobileEnhancements.state.addressBarHeight,
    
    // 控制方法
    forceDetectKeyboard: mobileEnhancements.methods.forceDetectKeyboard,
    getNetworkInfo: mobileEnhancements.methods.getNetworkInfo,
    getMemoryInfo: mobileEnhancements.methods.getMemoryInfo,
    shouldOptimizePerformance: mobileEnhancements.methods.shouldOptimizePerformance
  };
}

/**
 * 🎯 移动端适配Provider Hook
 * 用于在应用根组件中初始化移动端适配
 */
export function useMobileAdaptationProvider() {
  const device = useDeviceDetection();
  const [isReady, setIsReady] = useState(true); // 基于现有系统，默认就绪

  useEffect(() => {
    // 基于现有的统一系统，无需额外初始化
    // 基于统一系统初始化完成
    setIsReady(true);
  }, []);

  return {
    isReady,
    error: null,
    deviceInfo: {
      isMobile: device.isMobile,
      deviceType: device.deviceType,
      layoutMode: device.layoutMode
    }
  };
}

/**
 * 🎯 设备类型检测Hook
 */
export function useDeviceType() {
  const device = useDeviceDetection();

  return {
    deviceType: device.deviceType,
    isMobile: device.isMobile,
    isTablet: device.isTablet,
    isDesktop: device.isDesktop
  };
}

/**
 * 🎯 方向变化Hook
 */
export function useOrientation() {
  const { orientation, isPortrait, isLandscape, isRotating } = useMobileAdaptation({
    enableOrientationTracking: true,
    enableViewportTracking: false,
    enableKeyboardTracking: false,
    enableNetworkTracking: false
  });

  return {
    orientation,
    isPortrait,
    isLandscape,
    isTransitioning: isRotating
  };
}

/**
 * 🎯 键盘状态Hook
 */
export function useKeyboard() {
  const { keyboardVisible, keyboardHeight, forceDetectKeyboard } = useMobileAdaptation({
    enableOrientationTracking: false,
    enableViewportTracking: false,
    enableKeyboardTracking: true,
    enableNetworkTracking: false
  });

  return {
    visible: keyboardVisible,
    height: keyboardHeight,
    isOpen: keyboardVisible,
    forceDetect: forceDetectKeyboard
  };
}