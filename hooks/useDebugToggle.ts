import { useEffect, useState } from 'react';

/**
 * 用于切换调试模式（如显示画布边界、拼图ID等）的 Hook。
 * 监听 F10 键，切换 showDebugElements 状态。
 */
export function useDebugToggle(): [boolean, (v: boolean) => void] {
  const [showDebugElements, setShowDebugElements] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10' || e.keyCode === 121) {
        e.preventDefault();
        setShowDebugElements(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return [showDebugElements, setShowDebugElements];
} 