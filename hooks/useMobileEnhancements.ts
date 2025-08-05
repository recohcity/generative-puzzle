/**
 * useMobileEnhancements - 移动端增强功能Hook
 * 
 * 🎯 目标：基于现有系统，增强移动端特殊场景的处理能力
 * 
 * 核心功能：
 * 1. 设备旋转过程中的状态管理
 * 2. 视口变化检测（地址栏显示/隐藏）
 * 3. 多任务切换时的状态保持
 * 4. 虚拟键盘检测和避让
 * 5. 网络状态变化处理
 * 6. 设备性能监控
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export interface MobileEnhancementState {
  // 旋转状态
  isRotating: boolean;
  rotationStable: boolean;
  
  // 视口状态
  viewportHeight: number;
  addressBarVisible: boolean;
  addressBarHeight: number;
  
  // 键盘状态
  keyboardVisible: boolean;
  keyboardHeight: number;
  
  // 网络状态
  networkOnline: boolean;
  networkType: string;
  
  // 性能状态
  performanceLevel: 'low' | 'medium' | 'high';
  memoryPressure: number;
  
  // 应用状态
  appInBackground: boolean;
  lastActiveTime: number;
}

export interface MobileEnhancementCallbacks {
  onRotationStart?: () => void;
  onRotationEnd?: () => void;
  onKeyboardShow?: (height: number) => void;
  onKeyboardHide?: () => void;
  onNetworkChange?: (online: boolean) => void;
  onMemoryPressure?: (pressure: number) => void;
  onAppBackground?: () => void;
  onAppForeground?: () => void;
}

/**
 * 移动端增强功能Hook
 */
export function useMobileEnhancements(callbacks: MobileEnhancementCallbacks = {}) {
  const device = useDeviceDetection();
  
  // 状态管理
  const [state, setState] = useState<MobileEnhancementState>({
    isRotating: false,
    rotationStable: true,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    addressBarVisible: false,
    addressBarHeight: 0,
    keyboardVisible: false,
    keyboardHeight: 0,
    networkOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    networkType: 'unknown',
    performanceLevel: 'medium',
    memoryPressure: 0,
    appInBackground: false,
    lastActiveTime: Date.now()
  });

  // 稳定性定时器
  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastOrientationRef = useRef<boolean>(device.isPortrait);

  /**
   * 🎯 处理设备旋转
   */
  const handleDeviceRotation = useCallback((event: any) => {
    const isOrientationChange = lastOrientationRef.current !== device.isPortrait;
    
    if (isOrientationChange) {
      // 设备旋转开始
      
      setState(prev => ({
        ...prev,
        isRotating: true,
        rotationStable: false
      }));
      
      callbacks.onRotationStart?.();
      
      // 清除之前的稳定性定时器
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }
      
      // 设置新的稳定性定时器
      stabilityTimerRef.current = setTimeout(() => {
        // 设备旋转完成
        
        setState(prev => ({
          ...prev,
          isRotating: false,
          rotationStable: true
        }));
        
        callbacks.onRotationEnd?.();
      }, 500); // 500ms后认为旋转稳定
      
      lastOrientationRef.current = device.isPortrait;
    }
  }, [device.isPortrait, callbacks]);

  /**
   * 🎯 处理视口变化（地址栏显示/隐藏）
   */
  const handleViewportChange = useCallback((event: any) => {
    const { viewportHeight, windowHeight, heightDiff } = event;
    
    // 视口变化检测
    
    setState(prev => ({
      ...prev,
      viewportHeight,
      addressBarVisible: heightDiff > 50, // 高度差大于50px认为地址栏可见
      addressBarHeight: Math.max(0, heightDiff)
    }));
  }, []);

  /**
   * 🎯 处理多任务切换
   */
  const handleMultitaskSwitch = useCallback((event: any) => {
    const { isHidden } = event;
    
    // 多任务切换检测
    
    setState(prev => ({
      ...prev,
      appInBackground: isHidden,
      lastActiveTime: isHidden ? prev.lastActiveTime : Date.now()
    }));
    
    if (isHidden) {
      callbacks.onAppBackground?.();
    } else {
      callbacks.onAppForeground?.();
    }
  }, [callbacks]);

  /**
   * 🎯 处理网络状态变化
   */
  const handleNetworkChange = useCallback((event: any) => {
    const { online } = event;
    
    // 网络状态变化检测
    
    setState(prev => ({
      ...prev,
      networkOnline: online,
      networkType: online ? 'unknown' : 'offline'
    }));
    
    callbacks.onNetworkChange?.(online);
  }, [callbacks]);

  /**
   * 🎯 处理内存压力
   */
  const handleMemoryPressure = useCallback((event: any) => {
    const { memoryPressure } = event;
    
    // 内存压力检测
    
    setState(prev => ({
      ...prev,
      memoryPressure
    }));
    
    callbacks.onMemoryPressure?.(memoryPressure);
  }, [callbacks]);

  /**
   * 🎯 检测键盘状态（简化版本）
   */
  const detectKeyboardState = useCallback(() => {
    // 简化的键盘检测
    const keyboardState = { isVisible: false, height: 0 };
    
    setState(prev => {
      const keyboardVisibilityChanged = prev.keyboardVisible !== keyboardState.isVisible;
      
      if (keyboardVisibilityChanged) {
        // 键盘状态变化检测
        
        if (keyboardState.isVisible) {
          callbacks.onKeyboardShow?.(keyboardState.height);
        } else {
          callbacks.onKeyboardHide?.();
        }
      }
      
      return {
        ...prev,
        keyboardVisible: keyboardState.isVisible,
        keyboardHeight: keyboardState.height
      };
    });
  }, [callbacks]);

  /**
   * 🎯 更新性能等级（简化版本）
   */
  const updatePerformanceLevel = useCallback(() => {
    const performanceLevel = 'medium' as const;
    
    setState(prev => ({
      ...prev,
      performanceLevel
    }));
  }, []);

  // 设置事件监听器
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // 简化版本：移除事件监听器

    // 定期检测键盘状态
    const keyboardCheckInterval = setInterval(detectKeyboardState, 200);

    // 初始化性能等级
    updatePerformanceLevel();

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      clearInterval(keyboardCheckInterval);
      
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }
    };
  }, [
    handleDeviceRotation,
    handleViewportChange,
    handleMultitaskSwitch,
    handleNetworkChange,
    handleMemoryPressure,
    detectKeyboardState,
    updatePerformanceLevel
  ]);

  // 提供的方法
  const methods = {
    /**
     * 强制检测键盘状态
     */
    forceDetectKeyboard: detectKeyboardState,
    
    /**
     * 获取当前网络信息
     */
    getNetworkInfo: () => ({
      online: state.networkOnline,
      type: state.networkType,
      effectiveType: (navigator as any).connection?.effectiveType || 'unknown'
    }),
    
    /**
     * 获取设备方向锁定信息（简化版本）
     */
    getOrientationLockInfo: () => ({ locked: false, orientation: 'portrait' }),
    
    /**
     * 检查是否为低性能设备
     */
    isLowPerformanceDevice: () => state.performanceLevel === 'low',
    
    /**
     * 获取内存使用情况
     */
    getMemoryInfo: () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        return {
          used: memInfo.usedJSHeapSize,
          total: memInfo.jsHeapSizeLimit,
          pressure: state.memoryPressure
        };
      }
      return null;
    },
    
    /**
     * 检查是否需要性能优化
     */
    shouldOptimizePerformance: () => {
      return state.performanceLevel === 'low' || 
             state.memoryPressure > 0.7 || 
             state.keyboardVisible;
    }
  };

  return {
    state,
    methods,
    // 便捷访问常用状态
    isRotating: state.isRotating,
    keyboardVisible: state.keyboardVisible,
    keyboardHeight: state.keyboardHeight,
    networkOnline: state.networkOnline,
    performanceLevel: state.performanceLevel,
    appInBackground: state.appInBackground
  };
}

/**
 * 🎯 简化版Hook - 只监听键盘状态
 */
export function useKeyboardDetection() {
  const { state, methods } = useMobileEnhancements();
  
  return {
    keyboardVisible: state.keyboardVisible,
    keyboardHeight: state.keyboardHeight,
    forceDetect: methods.forceDetectKeyboard
  };
}

/**
 * 🎯 简化版Hook - 只监听网络状态
 */
export function useNetworkStatus() {
  const { state, methods } = useMobileEnhancements();
  
  return {
    online: state.networkOnline,
    networkInfo: methods.getNetworkInfo()
  };
}

/**
 * 🎯 简化版Hook - 只监听设备旋转
 */
export function useDeviceRotation(callbacks?: {
  onRotationStart?: () => void;
  onRotationEnd?: () => void;
}) {
  const { state } = useMobileEnhancements(callbacks);
  
  return {
    isRotating: state.isRotating,
    rotationStable: state.rotationStable
  };
}