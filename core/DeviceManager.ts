/**
 * DeviceManager - Unified device detection system
 * Consolidates all device detection logic from multiple conflicting implementations
 */

interface DeviceState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  deviceType: 'phone' | 'tablet' | 'desktop';
  layoutMode: 'portrait' | 'landscape' | 'desktop';
}

interface iPhone16Detection {
  detected: boolean;
  model: string | null;
  orientation: 'portrait' | 'landscape' | null;
  exact: boolean;
}

export class DeviceManager {
  private static instance: DeviceManager;
  private currentState: DeviceState;
  private listeners: Set<(state: DeviceState) => void> = new Set();

  // Constants from canvasAdaptation.ts
  private readonly MOBILE_BREAKPOINT = 768;
  private readonly DESKTOP_MIN_WIDTH = 1024;
  private readonly TABLET_MIN_WIDTH = 640;

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
    const isAndroid = /Android/i.test(ua);
    const isIPhone = /iPhone/i.test(ua);
    const isIPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && 'ontouchend' in document);
    const isIOS = isIPhone || isIPad;
    const isMobileUserAgent = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    // Screen dimension analysis
    const isPortrait = screenHeight > screenWidth;
    const aspectRatio = Math.max(screenWidth, screenHeight) / Math.min(screenWidth, screenHeight);
    const isLongScreen = aspectRatio > 1.8 && screenWidth < 2000;

    // 触摸设备检测 - 增强移动设备识别
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileLikeScreen = (screenWidth <= 768) || (isLongScreen && screenWidth < 1200);

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

      console.log('📱 用户代理检测为移动设备:', {
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

      console.log('📱 iPhone 16系列检测:', {
        model: iPhone16Detection.model,
        orientation: iPhone16Detection.orientation,
        exact: iPhone16Detection.exact,
        screenSize: `${screenWidth}x${screenHeight}`
      });
    }
    // Large desktop screen detection
    else if (screenWidth >= 1920 && screenHeight >= 900 ||
      screenWidth >= 2560 && screenHeight >= 800 ||
      screenWidth >= 3000) {
      deviceType = 'desktop';
      layoutMode = 'desktop';
      isMobile = false;
      isTablet = false;
      isDesktop = true;
    }
    // Mobile detection - 综合判断移动设备
    else if (isMobileUserAgent ||
      (isTouchDevice && isMobileLikeScreen) ||
      (isLongScreen && screenWidth < 1200) ||
      screenWidth < this.MOBILE_BREAKPOINT) {
      deviceType = 'phone';
      layoutMode = isPortrait ? 'portrait' : 'landscape';
      isMobile = true;
      isTablet = false;
      isDesktop = false;

      console.log('📱 综合检测为移动设备:', {
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
    else if (screenWidth >= this.TABLET_MIN_WIDTH && screenWidth < this.DESKTOP_MIN_WIDTH) {
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

    for (const [modelName, dimensions] of Object.entries(iPhone16Models)) {
      const { portrait, landscape } = dimensions;

      // Exact match
      if ((windowWidth === portrait.width && windowHeight === portrait.height) ||
        (windowWidth === landscape.width && windowHeight === landscape.height)) {
        return {
          detected: true,
          model: modelName,
          orientation: windowWidth > windowHeight ? 'landscape' : 'portrait',
          exact: true
        };
      }

      // Range match (±10px tolerance)
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

    console.log('🔍 设备状态检测:', {
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
      this.currentState = newState;
      this.notifyListeners();
    }
  }

  // 强制更新状态（用于页面刷新等场景）
  public forceUpdateState(): void {
    const newState = this.detectDevice();
    this.currentState = newState;
    this.notifyListeners();

    console.log('🔄 强制更新设备状态:', {
      deviceType: newState.deviceType,
      layoutMode: newState.layoutMode,
      screenSize: `${newState.screenWidth}x${newState.screenHeight}`
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentState));
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
}