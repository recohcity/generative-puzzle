import { useState, useEffect } from 'react';
import { DeviceManager } from '../core/DeviceManager';
import { type DeviceState } from '../src/config/deviceConfig';

export interface DeviceDetectionState extends DeviceState {
  isMobileBrowser: boolean;
  isTouchDevice: boolean;
  isIPad: boolean;
  isWeChat: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  screenWidth: number;
  screenHeight: number;
  deviceType: 'phone' | 'tablet' | 'desktop';
  layoutMode: 'portrait' | 'landscape' | 'desktop';
  forceRotation?: boolean;
  forceReason?: string;
}

/**
 * useDeviceDetection - 设备检测Hook
 * 
 * 现已重构为基于 DeviceManager 单例的订阅模式，实现逻辑统一。
 */
export function useDeviceDetection(): DeviceDetectionState {
  const deviceManager = DeviceManager.getInstance();

  const [deviceState, setDeviceState] = useState<DeviceDetectionState>(() => {
    const state = deviceManager.getState();
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    
    return {
      ...state,
      isMobileBrowser: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
      isTouchDevice: typeof window !== 'undefined' ? ('ontouchstart' in window || navigator.maxTouchPoints > 0) : false,
      isIPad: /iPad/i.test(ua) || (state.isIOS && state.screenWidth >= 768) || 
              (typeof window !== 'undefined' && 'ontouchend' in document && /Macintosh/i.test(ua)),
      isWeChat: /MicroMessenger/i.test(ua) || /wxwork/i.test(ua)
    };
  });

  useEffect(() => {
    const updateInternalState = (newState: DeviceState) => {
      const ua = navigator.userAgent;
      const isPortrait = newState.screenHeight > newState.screenWidth;
      
      const enrichedState: DeviceDetectionState = {
        ...newState,
        isPortrait,
        isMobileBrowser: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isIPad: /iPad/i.test(ua) || (newState.isIOS && newState.screenWidth >= 768) || 
                ('ontouchend' in document && /Macintosh/i.test(ua)),
        isWeChat: /MicroMessenger/i.test(ua) || /wxwork/i.test(ua)
      };

      setDeviceState(enrichedState);

      // 如果是屏幕旋转，触发自定义事件通知其他组件
      const previousOrientation = deviceState.isPortrait ? 'portrait' : 'landscape';
      const currentOrientation = isPortrait ? 'portrait' : 'landscape';
      if (previousOrientation !== currentOrientation) {
        const orientationChangeEvent = new CustomEvent('deviceOrientationChange', {
          detail: {
            from: previousOrientation,
            to: currentOrientation,
            deviceState: enrichedState
          }
        });
        window.dispatchEvent(orientationChangeEvent);
      }
    };

    // 订阅 DeviceManager 状态变化
    const unsubscribe = deviceManager.subscribe(updateInternalState);

    const handleResize = () => {
      // 安卓适配：输入框聚焦(软键盘弹出)或拖拽拼图时，跳过设备状态更新
      // 防止 visualViewport 变化触发画布尺寸重算导致的界面跳动/闪烁
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      const isDragging = document.querySelector('.dragging-active');
      if (isInputFocused || isDragging) return;

      requestAnimationFrame(() => {
        deviceManager.updateState();
      });
    };

    const handleOrientationChange = () => {
      // 屏幕方向改变时，使用多重延迟确保浏览器完成所有布局调整
      setTimeout(() => {
        requestAnimationFrame(() => deviceManager.updateState());
      }, 50);
      setTimeout(() => {
        requestAnimationFrame(() => deviceManager.updateState());
      }, 150);
      setTimeout(() => {
        requestAnimationFrame(() => deviceManager.updateState());
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // 安卓适配：完全禁用 visualViewport resize 监听
    // 安卓上 visualViewport 在触摸、软键盘、地址栏变化时频繁触发，
    // 导致画布尺寸重算和界面跳动。window.resize 已足够覆盖真实布局变化。
    const isAndroid = /android/i.test(navigator.userAgent);
    if (window.visualViewport && !isAndroid) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport && !isAndroid) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [deviceState.isPortrait]);

  return deviceState;
}