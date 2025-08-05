import { useState, useEffect } from 'react';

interface DeviceDetectionState {
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
  // 新增设备检测
  isIPad?: boolean;
  isWeChat?: boolean;
  isMobileBrowser?: boolean;
  isTouchDevice?: boolean;
}

/**
 * 检测设备类型的增强函数
 * 专门处理微信浏览器等特殊环境
 */
function detectDeviceType(userAgent: string, screenWidth: number, screenHeight: number) {
  // 微信浏览器检测
  const isWeChat = /MicroMessenger/i.test(userAgent);
  const isWeChatWork = /wxwork/i.test(userAgent);
  
  // 移动端浏览器检测（更全面）
  const isMobileBrowser = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // 操作系统检测
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  
  // 触摸设备检测
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // 屏幕尺寸检测
  const isSmallScreen = screenWidth <= 768;
  const isMediumScreen = screenWidth > 768 && screenWidth <= 1024;
  const isLargeScreen = screenWidth > 1024;
  
  // 综合判断设备类型
  let deviceType: 'phone' | 'tablet' | 'desktop' = 'desktop';
  let isMobile = false;
  let isTablet = false;
  let isDesktop = false;
  
  // iPad检测（更精确，兼容现代iPad Safari）
  const isIPad = /iPad/i.test(userAgent) || 
    (isIOS && screenWidth >= 768) ||
    // 现代iPad Safari可能显示为桌面版，通过屏幕尺寸和触摸检测
    (isTouchDevice && screenWidth >= 768 && screenWidth <= 1366 && 
     (screenHeight >= 1024 || (screenWidth >= 1024 && screenHeight >= 768)));
  
  // 优先级1: iPad设备统一处理（无论是否微信）
  if (isIPad) {
    const isPortrait = screenHeight > screenWidth;
    if (!isPortrait && screenWidth >= 1024) {
      // iPad横屏：使用桌面布局
      deviceType = 'desktop';
      isDesktop = true;
    } else {
      // iPad竖屏：使用平板布局（移动端布局）
      deviceType = 'tablet';
      isTablet = true;
    }
  }
  // 优先级2: 微信浏览器（非iPad）
  else if (isWeChat || isWeChatWork) {
    if (isSmallScreen || screenWidth <= 900) {
      // 手机微信浏览器
      deviceType = 'phone';
      isMobile = true;
    } else {
      // 其他大屏微信浏览器
      deviceType = 'tablet';
      isTablet = true;
    }
  }
  // 优先级2: 移动端浏览器User-Agent
  else if (isMobileBrowser || isAndroid || isIOS) {
    if (isSmallScreen) {
      deviceType = 'phone';
      isMobile = true;
    } else if (isMediumScreen) {
      deviceType = 'tablet';
      isTablet = true;
    } else {
      // 即使屏幕大，但如果是移动端浏览器，仍可能是手机横屏
      deviceType = 'phone';
      isMobile = true;
    }
  }
  // 优先级3: 触摸设备检测
  else if (isTouchDevice && (isSmallScreen || isMediumScreen)) {
    if (isSmallScreen) {
      deviceType = 'phone';
      isMobile = true;
    } else {
      deviceType = 'tablet';
      isTablet = true;
    }
  }
  // 优先级4: 纯屏幕尺寸判断
  else {
    if (isSmallScreen) {
      deviceType = 'phone';
      isMobile = true;
    } else if (isMediumScreen) {
      deviceType = 'tablet';
      isTablet = true;
    } else {
      deviceType = 'desktop';
      isDesktop = true;
    }
  }
  
  return {
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isAndroid,
    isIOS,
    isIPad,
    isWeChat,
    isMobileBrowser,
    isTouchDevice
  };
}

/**
 * useDeviceDetection - 设备检测Hook
 * 
 * 提供设备类型和屏幕信息检测，专门优化微信浏览器支持
 */
export function useDeviceDetection(): DeviceDetectionState {
  const [deviceState, setDeviceState] = useState<DeviceDetectionState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isPortrait: false,
        isAndroid: false,
        isIOS: false,
        screenWidth: 1024,
        screenHeight: 768,
        deviceType: 'desktop',
        layoutMode: 'desktop',
        isIPad: false,
        isWeChat: false,
        isMobileBrowser: false,
        isTouchDevice: false
      };
    }

    const userAgent = navigator.userAgent;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isPortrait = screenHeight > screenWidth;
    
    // 使用增强的设备检测
    const detection = detectDeviceType(userAgent, screenWidth, screenHeight);
    
    let layoutMode: 'portrait' | 'landscape' | 'desktop' = 'desktop';
    if (detection.isMobile) {
      layoutMode = isPortrait ? 'portrait' : 'landscape';
    } else if (detection.isTablet) {
      // 平板也使用移动端布局
      layoutMode = isPortrait ? 'portrait' : 'landscape';
    }

    // 调试输出已移除

    return {
      isMobile: detection.isMobile,
      isTablet: detection.isTablet,
      isDesktop: detection.isDesktop,
      isPortrait,
      isAndroid: detection.isAndroid,
      isIOS: detection.isIOS,
      screenWidth,
      screenHeight,
      deviceType: detection.deviceType,
      layoutMode,
      isIPad: detection.isIPad,
      isWeChat: detection.isWeChat,
      isMobileBrowser: detection.isMobileBrowser,
      isTouchDevice: detection.isTouchDevice
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const isPortrait = screenHeight > screenWidth;
      
      // 使用增强的设备检测
      const detection = detectDeviceType(userAgent, screenWidth, screenHeight);
      
      let layoutMode: 'portrait' | 'landscape' | 'desktop' = 'desktop';
      if (detection.isMobile) {
        layoutMode = isPortrait ? 'portrait' : 'landscape';
      } else if (detection.isTablet) {
        // 平板也使用移动端布局
        layoutMode = isPortrait ? 'portrait' : 'landscape';
      }

      // 调试输出已移除

      setDeviceState({
        isMobile: detection.isMobile,
        isTablet: detection.isTablet,
        isDesktop: detection.isDesktop,
        isPortrait,
        isAndroid: detection.isAndroid,
        isIOS: detection.isIOS,
        screenWidth,
        screenHeight,
        deviceType: detection.deviceType,
        layoutMode,
        isIPad: detection.isIPad,
        isWeChat: detection.isWeChat,
        isMobileBrowser: detection.isMobileBrowser,
        isTouchDevice: detection.isTouchDevice
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceState;
} 