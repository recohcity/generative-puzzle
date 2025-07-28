import { useDevice } from '@/providers/hooks';

interface DeviceDetectionState {
  isMobile: boolean;
  isPortrait: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  screenWidth: number;
  screenHeight: number;
}

/**
 * useDeviceDetection - 迁移到统一设备检测系统
 * 
 * ✅ 现在使用统一的设备检测系统，提供向后兼容性
 * 这个Hook现在是useDevice的包装器，保持API兼容性
 */
export function useDeviceDetection(): DeviceDetectionState {
  const device = useDevice();
  
  // 转换为旧的API格式，保持向后兼容
  return {
    isMobile: device.isMobile,
    isPortrait: device.isPortrait,
    isAndroid: device.isAndroid,
    isIOS: device.isIOS,
    screenWidth: device.screenWidth,
    screenHeight: device.screenHeight,
  };
} 