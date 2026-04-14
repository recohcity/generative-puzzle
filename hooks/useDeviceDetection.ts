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
      requestAnimationFrame(() => {
        deviceManager.updateState();
      });
    };

    const handleOrientationChange = () => {
      // 屏幕方向改变时，使用多重延迟确保浏览器完成所有布局调整
      setTimeout(handleResize, 50);
      setTimeout(handleResize, 150);
      setTimeout(handleResize, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [deviceState.isPortrait]);

  return deviceState;
}