import { useEffect, useState } from 'react';

interface DeviceDetectionState {
  isMobile: boolean;
  isPortrait: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  screenWidth: number;
  screenHeight: number;
}

const getDeviceState = (): DeviceDetectionState => {
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isIPhone = /iPhone/i.test(ua);
  const isIPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && 'ontouchend' in document);
  const isIOS = isIPhone || isIPad;
  const isMobile = isAndroid || isIOS;
  const isPortrait = typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

  return {
    isMobile,
    isPortrait,
    isAndroid,
    isIOS,
    screenWidth,
    screenHeight,
  };
};

export function useDeviceDetection(): DeviceDetectionState {
  const [deviceState, setDeviceState] = useState<DeviceDetectionState>(getDeviceState);

  useEffect(() => {
    const handleResize = () => {
      setDeviceState(getDeviceState());
    };

    // Initial check and add event listeners only in the browser environment
    if (typeof window !== 'undefined') {
      setDeviceState(getDeviceState()); // Ensure state is correct on mount
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize); // orientationchange also triggers resize event on many browsers
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return deviceState;
} 