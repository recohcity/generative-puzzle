/**
 * useCanvasEvents - Specialized hook for canvas event handling
 * Extracted from useCanvas to maintain single responsibility principle
 * Handles device state changes, orientation changes, and visibility changes
 */

import { useEffect, useRef } from 'react';
import { useSystem } from '../SystemProvider';
import { EventScheduler } from '../../core/EventScheduler';
import { useCanvasEventsLogger } from '../../utils/logger';

interface UseCanvasEventsProps {
  isInitialized: () => boolean;
}

export const useCanvasEvents = ({ isInitialized }: UseCanvasEventsProps) => {
  const { canvasManager, eventManager, deviceManager } = useSystem();
  const eventScheduler = useRef<EventScheduler>(EventScheduler.getInstance());

  // Event-driven device state synchronization (replaces setTimeout chains)
  useEffect(() => {
    // Subscribe to device changes with immediate response
    const unsubscribeDevice = deviceManager.subscribe((newState) => {
      // Use CanvasManager's force refresh instead of setTimeout
      if (isInitialized()) {
        canvasManager.forceRefresh();
      }
    });

    return unsubscribeDevice;
  }, [canvasManager, deviceManager, isInitialized]);

  // Page visibility change handling - uses EventScheduler instead of setTimeout
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized()) {
        // Immediately update device state
        deviceManager.forceUpdateState();
        
        // Use EventScheduler to refresh canvas after DOM update
        eventScheduler.current.scheduleAfterDOMUpdate(
          'visibility-canvas-refresh',
          () => {
            if (isInitialized()) {
              canvasManager.forceRefresh();
            }
          },
          {
            priority: 8,
            maxRetries: 2
          }
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Clean up pending tasks
      eventScheduler.current.cancelTask('visibility-canvas-refresh');
    };
  }, [deviceManager, canvasManager, isInitialized]);

  // Orientation change handling - uses EventScheduler instead of setTimeout
  useEffect(() => {
    const unsubscribeOrientation = eventManager.onOrientationChange(() => {
      if (isInitialized()) {
        // Schedule device state update task
        eventScheduler.current.scheduleNextFrame(
          'orientation-device-update',
          () => {
            deviceManager.updateState();
          },
          {
            priority: 10, // Highest priority
            maxRetries: 3
          }
        );
        
        // Schedule canvas refresh task (depends on device state update)
        eventScheduler.current.scheduleAfterDeviceStateStable(
          'orientation-canvas-refresh',
          () => {
            if (isInitialized()) {
              canvasManager.forceRefresh();
            }
          },
          {
            priority: 8,
            dependencies: ['orientation-device-update'],
            maxRetries: 2,
            stabilityDelay: 100 // Wait for device state to stabilize
          }
        );
      }
    }, 10, 100); // High priority, 100ms debounce

    return () => {
      unsubscribeOrientation();
      // Clean up pending tasks
      eventScheduler.current.cancelTask('orientation-device-update');
      eventScheduler.current.cancelTask('orientation-canvas-refresh');
    };
  }, [eventManager, deviceManager, canvasManager, isInitialized]);

  // Performance monitoring and debug info
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const resizeStats = canvasManager.getResizeObserverStats();
        const schedulerStats = eventScheduler.current.getStats();
        
        useCanvasEventsLogger.debug('Performance stats', {
          resizeObserver: resizeStats,
          eventScheduler: schedulerStats
        });
      }, 10000); // Output stats every 10 seconds

      return () => clearInterval(interval);
    }
  }, [canvasManager]);

  // Clean up EventScheduler tasks on component unmount
  useEffect(() => {
    return () => {
      eventScheduler.current.cancelTask('visibility-canvas-refresh');
      eventScheduler.current.cancelTask('orientation-device-update');
      eventScheduler.current.cancelTask('orientation-canvas-refresh');
    };
  }, []);
};