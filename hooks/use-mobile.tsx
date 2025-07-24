import { useDevice } from "@/providers/hooks"

/**
 * useIsMobile - 迁移到统一设备检测系统
 * 
 * ✅ 现在使用统一的设备检测系统，提供向后兼容性
 * 这个Hook现在是useDevice的包装器，保持API兼容性
 */
export function useIsMobile() {
  console.log('✅ [useIsMobile] 使用统一设备检测系统');
  
  const device = useDevice();
  
  // 返回移动设备状态，保持向后兼容
  return device.isMobile;
}
