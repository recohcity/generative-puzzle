/**
 * SystemProvider - Top-level system integration
 * Provides unified access to all core managers
 */

"use client";

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { DeviceManager, CanvasManager, EventManager, AdaptationEngine } from '@/core';

interface SystemContextValue {
  deviceManager: DeviceManager;
  canvasManager: CanvasManager;
  eventManager: EventManager;
  adaptationEngine: AdaptationEngine;
}

const SystemContext = createContext<SystemContextValue | null>(null);

interface SystemProviderProps {
  children: ReactNode;
}

export const SystemProvider: React.FC<SystemProviderProps> = ({ children }) => {
  const managersRef = useRef<SystemContextValue | null>(null);

  // Initialize managers once
  if (!managersRef.current) {
    managersRef.current = {
      deviceManager: DeviceManager.getInstance(),
      canvasManager: CanvasManager.getInstance(),
      eventManager: EventManager.getInstance(),
      adaptationEngine: AdaptationEngine.getInstance()
    };
  }

  const managers = managersRef.current;

  // Set up system-wide event coordination
  useEffect(() => {
    const { deviceManager, canvasManager, eventManager } = managers;

    // 页面加载时强制更新设备状态 - 修复横屏刷新问题
    deviceManager.forceUpdateState();

    // Coordinate device detection with canvas sizing
    const unsubscribeResize = eventManager.onResize(() => {
      deviceManager.updateState();
    }, 10); // High priority for device detection

    // Coordinate orientation changes
    const unsubscribeOrientation = eventManager.onOrientationChange(() => {
      deviceManager.updateState();
    }, 10);

    // 监听页面可见性变化
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📄 页面重新可见，强制更新设备状态');
        setTimeout(() => {
          deviceManager.forceUpdateState();
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribeResize();
      unsubscribeOrientation();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [managers]);

  return (
    <SystemContext.Provider value={managers}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = (): SystemContextValue => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};