"use client"
// import { GameProvider, useGame } from "@/contexts/GameContext" // useGame is called in child components now
import { GameProvider } from "@/contexts/GameContext"
import DynamicTitle from "@/components/DynamicTitle"
// Removed custom ThemeProvider/useTheme import
// import { ThemeProvider, useTheme } from "@/contexts/ThemeContext"
import PuzzleCanvas from "@/components/PuzzleCanvas"
// import PuzzleControls from "@/components/PuzzleControls" // Not used directly for layout
import ShapeControls from "@/components/ShapeControls"
import PuzzleControlsCutType from "@/components/PuzzleControlsCutType"
import PuzzleControlsCutCount from "@/components/PuzzleControlsCutCount"
import PuzzleControlsScatter from "@/components/PuzzleControlsScatter"
import PuzzleControlsGamepad from "@/components/PuzzleControlsGamepad"
import ActionButtons from "@/components/ActionButtons"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Maximize, Minimize, RefreshCw } from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  initBackgroundMusic,
  toggleBackgroundMusic,
  getBackgroundMusicStatus,
  playButtonClickSound, // Still needed here for other buttons
  preloadAllSoundEffects
} from "@/utils/rendering/soundEffects"
import DesktopPuzzleSettings from "./DesktopPuzzleSettings"; // <-- Import the new component
import { BubbleBackground } from '../components/animate-ui/backgrounds/bubble';
import ResponsiveBackground from "@/components/ResponsiveBackground";

// --- Create Inner Component for Desktop Puzzle Settings ---
// import { useGame } from "@/contexts/GameContext"; // No longer needed here

// interface DesktopPuzzleSettingsProps { ... } // Remove interface definition

// const DesktopPuzzleSettings: React.FC<DesktopPuzzleSettingsProps> = ({ goToNextTab }) => { ... } // Remove component definition
// --- End Inner Component ---

// Import new layout components
import DesktopLayout from "./layouts/DesktopLayout";
import PhonePortraitLayout from "./layouts/PhonePortraitLayout";
import PhoneLandscapeLayout from "./layouts/PhoneLandscapeLayout";
import { cn } from "@/lib/utils";
// 使用统一的设备检测系统
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export default function CurveTestOptimized() {
  // --- Remove useGame hook call from top level --- 
  // const gameContext = useGame(); 
  // const resetGame = gameContext.resetGame; 
  // --- End Remove useGame hook call ---

  // 添加背景音乐状态
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  // 添加全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 添加全屏点击计数器，用于调试
  const [fullscreenClickCount, setFullscreenClickCount] = useState(0);
  // 添加ref用于全屏元素
  const gameContainerRef = useRef<HTMLDivElement>(null);
  // 使用统一的设备检测系统
  const device = useDeviceDetection();
  const deviceType = device.deviceType;
  const phoneMode = device.layoutMode as 'portrait' | 'landscape';
  const supportsFullscreen = device.supportsFullscreen;

  // 添加控制面板选项卡状态（仅用于手机模式）
  const [activeTab, setActiveTab] = useState<'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls'>('shape');

  // 设备检测调试输出已移除

  // 初始化背景音乐
  useEffect(() => {
    // 只在客户端运行
    if (typeof window !== 'undefined') {
      initBackgroundMusic();
      // 预加载真实音效，确保首次触发无卡顿
      preloadAllSoundEffects();
      // 获取初始状态
      setIsMusicPlaying(getBackgroundMusicStatus());
    }
  }, []);

  // 设置全屏模式下的特殊触摸事件处理
  const setupFullscreenTouchHandlers = useCallback(() => {
    const gameContainer = gameContainerRef.current;
    if (!gameContainer) return;

    // 保存触摸开始位置的引用
    let touchStartY = 0;

    // 阻止向下滑动触发浏览器退出全屏手势
    const handleTouchStart = (e: TouchEvent) => {
      // 检查是否是按钮或可点击元素
      if (e.target instanceof Element) {
        // 检查目标元素是否是按钮或其子元素
        const isButton = e.target.tagName === 'BUTTON' ||
          e.target.closest('button') ||
          e.target.hasAttribute('role') && e.target.getAttribute('role') === 'button' ||
          e.target.classList.contains('cursor-pointer');

        // 🔧 修复：检查是否是画布元素
        const isCanvas = e.target.tagName === 'CANVAS' ||
          e.target.id === 'puzzle-canvas' ||
          e.target.closest('canvas');

        // 如果是按钮或画布，不阻止默认行为
        if (isButton || isCanvas) {
          return;
        }
      }

      // 记录所有触摸开始的Y坐标
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }

      // 阻止iOS上可能导致退出全屏的触摸开始行为
      // if (device.isIOS) {
      //   e.preventDefault();
      // }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // 🔧 修复：对于多指触摸（双指旋转），不进行全屏手势检测
      if (e.touches.length >= 2) {
        return; // 让双指触摸事件正常传递给画布
      }

      // 防止iOS橡皮筋效果，但允许内部可滚动区域（如果有）
      // 检查是否是canvas，如果是则不阻止，交给Canvas处理
      const isCanvas = e.target instanceof Element && (e.target.tagName === 'CANVAS' || e.target.closest('canvas'));
      if (isCanvas) return;

      // 对于其他非滚动区域，阻止默认滚动
      if (e.cancelable) {
        e.preventDefault();
      }

      // 确保是单指触摸
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const currentTouchY = touch.clientY;

        // 计算垂直移动距离
        const deltaY = currentTouchY - touchStartY;

        // 检测是否是向下滑动（deltaY > 0）
        if (deltaY > 0) {
          // 阻止所有向下滑动，无论距离大小
          e.preventDefault();
          e.stopPropagation();

          // 适用于Safari，防止iOS退出全屏的手势被触发
          if (device.isIOS) {
            // 重置touch位置，避免累积滑动效果
            touchStartY = currentTouchY;
          }
        }
      }
    };

    // 处理触摸结束事件
    const handleTouchEnd = (e: TouchEvent) => {
      // 🔧 修复：检查是否是画布元素
      if (e.target instanceof Element) {
        const isCanvas = e.target.tagName === 'CANVAS' ||
          e.target.id === 'puzzle-canvas' ||
          e.target.closest('canvas');

        // 如果是画布，不阻止默认行为
        if (isCanvas) {
          return;
        }
      }

      // 重置触摸开始位置
      touchStartY = 0;

      // 🔧 移除：不再在 touchend 阻止默认行为，以恢复点击能力
      // if (device.isIOS) {
      //   e.preventDefault();
      // }
    };

    // 只监听可能导致退出全屏的手势
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // 锁定屏幕方向（如果支持）
    if (window.screen.orientation && 'lock' in window.screen.orientation) {
      const orientation = device.screenWidth > device.screenHeight ? 'landscape' : 'portrait';

      (window.screen.orientation as any).lock(orientation)
        .catch((error: any) => {});
    }

    // 保存事件处理函数引用，用于后续移除
    (window as any).__fullscreenTouchHandlers = {
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd
    };
  }, [device]);

  // 移除全屏模式下的触摸事件处理
  const removeFullscreenTouchHandlers = () => {
    // 从保存的引用中获取事件处理函数
    const handlers = (window as any).__fullscreenTouchHandlers;

    if (handlers) {
      document.removeEventListener('touchstart', handlers.handleTouchStart);
      document.removeEventListener('touchmove', handlers.handleTouchMove);
      document.removeEventListener('touchend', handlers.handleTouchEnd);

      // 清除引用
      delete (window as any).__fullscreenTouchHandlers;
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      // 检查标准全屏API的状态
      const isInFullscreen = !!(document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement);

      // 如果使用了标准全屏API，更新状态
      if (isInFullscreen !== isFullscreen) {
        setIsFullscreen(isInFullscreen);
      }

      // 在全屏状态改变时设置特定的触摸事件处理
      if (isInFullscreen) {
        setupFullscreenTouchHandlers();
      } else {
        removeFullscreenTouchHandlers();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isFullscreen, fullscreenClickCount, setupFullscreenTouchHandlers]);

  // 处理音乐切换
  const handleToggleMusic = async () => {
    playButtonClickSound();
    const newStatus = await toggleBackgroundMusic();
    setIsMusicPlaying(newStatus);
  };

  // 全屏切换函数（仅在 supportsFullscreen=true 时被调用）
  const toggleFullscreen = () => {
    playButtonClickSound();

    const newClickCount = fullscreenClickCount + 1;
    setFullscreenClickCount(newClickCount);

    const checkFullscreenState = () => {
      return !!(document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement);
    };

    const actualFullscreenState = checkFullscreenState();

    // 修正状态不一致
    if (isFullscreen !== actualFullscreenState) {
      setIsFullscreen(actualFullscreenState);
      return;
    }

    const gameContainer = gameContainerRef.current;
    if (!gameContainer) return;

    if (!actualFullscreenState) {
      // 进入全屏 — 统一使用原生 Fullscreen API
      try {
        if (gameContainer.requestFullscreen) {
          gameContainer.requestFullscreen();
        } else if ((gameContainer as any).webkitRequestFullscreen) {
          (gameContainer as any).webkitRequestFullscreen();
        } else if ((gameContainer as any).mozRequestFullScreen) {
          (gameContainer as any).mozRequestFullScreen();
        } else if ((gameContainer as any).msRequestFullscreen) {
          (gameContainer as any).msRequestFullscreen();
        }
        // fullscreenchange 事件会更新 isFullscreen 状态
      } catch (error) {}
    } else {
      // 退出全屏 — 统一使用原生 API
      const actuallyInFullscreen = checkFullscreenState();
      if (!actuallyInFullscreen) {
        setIsFullscreen(false);
        return;
      }
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        // 兜底：500ms 后若 fullscreenchange 未触发则手动同步状态
        setTimeout(() => {
          if (!checkFullscreenState() && isFullscreen) {
            setIsFullscreen(false);
          }
        }, 500);
      } catch (error) {
        setIsFullscreen(false);
      }
    }
  };

  // 修改handleTabChange函数以支持5个tab
  const handleTabChange = (tab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls') => {
    playButtonClickSound();
    setActiveTab(tab);
  };

  // 添加自动切换到下一个tab的函数
  const goToNextTab = () => {
    if (activeTab === 'shape') setActiveTab('puzzle');
    else if (activeTab === 'puzzle') setActiveTab('cut');
    else if (activeTab === 'cut') setActiveTab('scatter');
    else if (activeTab === 'scatter') setActiveTab('controls');
  };

  // 返回到第一个tab的函数
  const goToFirstTab = () => {
    setActiveTab('shape');
  };

  const commonLayoutProps = {
    isMusicPlaying,
    isFullscreen,
    onToggleMusic: handleToggleMusic,
    onToggleFullscreen: toggleFullscreen,
    goToNextTab,
    goToFirstTab,
    activeTab,
    onTabChange: handleTabChange,
    supportsFullscreen,
  };

  let layoutToRender;
  // 🎯 智能布局选择：所有桌面端和平板设备（如 iPad）均优先使用桌面端双列布局
  const shouldUseDesktopLayout = deviceType === 'desktop' || deviceType === 'tablet';

  if (shouldUseDesktopLayout) {
    layoutToRender = <DesktopLayout {...commonLayoutProps} goToNextTab={goToNextTab} />;
  } else {
    // 手机、平板竖屏、小屏设备使用移动端布局
    if (phoneMode === 'portrait') {
      layoutToRender = <PhonePortraitLayout {...commonLayoutProps} />;
    } else { // landscape
      layoutToRender = <PhoneLandscapeLayout {...commonLayoutProps} />;
    }
  }

  return (
    <GameProvider>
      <div
        ref={gameContainerRef}
        className="min-h-dvh w-full relative overflow-hidden"
        style={{
          // 移除默认的padding和flex居中，让子布局完全控制
          padding: 0,
          display: 'block', // 改为block，不使用flex
        }}
      >

        {/* 🎯 极致锁定：使用 fixed 定位确保背景强制铺满视口，不受任何布局偏移影响 */}
        <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none">
          {(deviceType === 'desktop' && !device.isIPad) ? (
            <BubbleBackground interactive className="w-full h-full" />
          ) : (
            <ResponsiveBackground />
          )}
        </div>
        <DynamicTitle />
        {layoutToRender}

      </div>
    </GameProvider>
  )
}
