/**
 * useDevice - Unified device detection hook
 * Replaces useDeviceDetection.ts and use-mobile.tsx
 */

import { useState, useEffect } from 'react';
import { useSystem } from '../SystemProvider';

interface DeviceState {
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
}

export const useDevice = (): DeviceState => {
  const { deviceManager } = useSystem();
  const [deviceState, setDeviceState] = useState<DeviceState>(() => deviceManager.getState());

  useEffect(() => {
    const unsubscribe = deviceManager.subscribe((newState) => {
      setDeviceState(newState);
    });

    // Ensure we have the latest state
    setDeviceState(deviceManager.getState());

    return unsubscribe;
  }, [deviceManager]);

  return deviceState;
};

// Backward compatibility exports
export const useDeviceDetection = useDevice;
export const useIsMobile = (): boolean => {
  const { isMobile } = useDevice();
  return isMobile;
};