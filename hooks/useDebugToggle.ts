import { useEffect, useState } from 'react';

/**
 * 用于切换调试模式（如显示画布边界、拼图ID等）的 Hook。
 * 监听 F10 键，切换 showDebugElements 状态。
 * 🔑 修复：使用localStorage持久化状态，防止极端分辨率变化时状态丢失
 */
export function useDebugToggle(): [boolean, (v: boolean) => void] {
  // 🔑 关键修复：从localStorage读取初始状态，防止组件重新挂载时丢失
  const [showDebugElements, setShowDebugElements] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('debug-mode-enabled');
      return saved === 'true';
    }
    return false;
  });

  // 🔑 关键修复：同步状态到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('debug-mode-enabled', showDebugElements.toString());
      console.log(`[F10调试] 状态已保存: ${showDebugElements}`);
    }
  }, [showDebugElements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        setShowDebugElements(prev => {
          const newValue = !prev;
          console.log(`[F10调试] 状态切换: ${prev} -> ${newValue}`);
          return newValue;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return [showDebugElements, setShowDebugElements];
} 