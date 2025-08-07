"use client"
// import { GameProvider, useGame } from "@/contexts/GameContext" // useGame is called in child components now
import { GameProvider } from "@/contexts/GameContext"
import { I18nProvider } from "@/contexts/I18nContext"
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
  playButtonClickSound // Still needed here for other buttons
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
  
  // 添加控制面板选项卡状态（仅用于手机模式）
  const [activeTab, setActiveTab] = useState<'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls'>('shape');

  // 设备检测调试输出已移除

  // 初始化背景音乐
  useEffect(() => {
    // 只在客户端运行
    if (typeof window !== 'undefined') {
      initBackgroundMusic();
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
      if (device.isIOS) {
        e.preventDefault();
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
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
      
      // 🔧 修复：对于多指触摸（双指旋转），不进行全屏手势检测
      if (e.touches.length >= 2) {
        return; // 让双指触摸事件正常传递给画布
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
      
      // 阻止某些可能触发退出全屏的结束事件
      if (device.isIOS) {
        e.preventDefault();
      }
    };
    
    // 只监听可能导致退出全屏的手势
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 锁定屏幕方向（如果支持）
    if (window.screen.orientation && 'lock' in window.screen.orientation) {
      const orientation = device.screenWidth > device.screenHeight ? 'landscape' : 'portrait';
      console.log(`尝试锁定屏幕方向为: ${orientation}`);
      
      (window.screen.orientation as any).lock(orientation)
        .catch((error: any) => console.log('无法锁定屏幕方向:', error));
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
        console.log(`全屏状态变化: ${isInFullscreen ? '进入全屏' : '退出全屏'} (点击次数: ${fullscreenClickCount})`);
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
  
  // 全屏切换函数
  const toggleFullscreen = () => {
    playButtonClickSound();
    
    // 增加点击计数器
    const newClickCount = fullscreenClickCount + 1;
    setFullscreenClickCount(newClickCount);
    
    // 使用统一设备检测系统
    const isIOS = device.isIOS;
    const isAndroid = device.isAndroid;
    const isMobile = device.isMobile;
    const isInWebView = typeof navigator !== 'undefined' && /(.*WebView|.*FBIOS|.*Twitter)/.test(navigator.userAgent);
    
    console.log(`全屏操作: 点击次数=${newClickCount}, 当前状态=${isFullscreen}, 设备检测: iOS=${isIOS}, Android=${isAndroid}, 移动=${isMobile}`);
    
    // 检查是否真正处于全屏状态
    const checkFullscreenState = () => {
      return !!(document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement);
    };
    
    // 获取当前实际全屏状态
    const actualFullscreenState = checkFullscreenState();
    console.log(`全屏状态检查: 界面状态=${isFullscreen}, 实际状态=${actualFullscreenState}`);
    
    // 如果状态不一致，强制同步
    if (isFullscreen !== actualFullscreenState) {
      console.log(`全屏状态不一致，强制同步到 ${actualFullscreenState}`);
      setIsFullscreen(actualFullscreenState);
      // 如果状态不一致，先同步状态，然后在下一次点击处理切换
      return;
    }

    // 基于实际状态(actualFullscreenState)决定操作，而不是基于React状态
    if (!actualFullscreenState) {
      // 进入全屏
      const gameContainer = gameContainerRef.current;
      if (!gameContainer) return;
      
      // 对于iOS设备，使用一种特殊处理方式，因为iOS不完全支持标准fullscreen API
      if (isIOS) {
        console.log("iOS设备使用替代全屏方法");
        // 1. 存储原始样式
        const originalStyles = {
          position: gameContainer.style.position,
          top: gameContainer.style.top,
          left: gameContainer.style.left,
          width: gameContainer.style.width,
          height: gameContainer.style.height,
          zIndex: gameContainer.style.zIndex
        };
        
        // 2. 将元素样式设置为全屏
        (gameContainer as any)._originalStyles = originalStyles;
        gameContainer.style.position = 'fixed';
        gameContainer.style.top = '0';
        gameContainer.style.left = '0';
        gameContainer.style.width = '100vw';
        gameContainer.style.height = '100vh';
        gameContainer.style.zIndex = '9999';
        
        // 3. 修改滚动行为
        document.body.style.overflow = 'hidden';
        window.scrollTo(0, 0);
        
        // 4. 应用带有安全区域的填充
        gameContainer.style.paddingTop = 'env(safe-area-inset-top)';
        gameContainer.style.paddingBottom = 'env(safe-area-inset-bottom)';
        
        // 5. 强制设置状态
        setIsFullscreen(true);
        
        // 6. 尝试锁定屏幕方向（这在iOS上可能不起作用，但在某些情况下可能有用）
        try {
          if (device.screenWidth > device.screenHeight) {
            // 请求横屏锁定
            if (window.screen.orientation && 'lock' in window.screen.orientation) {
              (window.screen.orientation as any).lock('landscape').catch((err: any) => {
                console.log("无法锁定屏幕方向:", err);
              });
            }
          }
        } catch (error) {
          console.log("锁定屏幕方向出错:", error);
        }
      } 
      // 对于Android设备
      else if (isAndroid) {
        // 先尝试锁定方向，然后请求全屏
        try {
          if (device.screenWidth > device.screenHeight) {
            if (window.screen.orientation && 'lock' in window.screen.orientation) {
              (window.screen.orientation as any).lock('landscape').catch((err: any) => {
                console.log("Android设备无法锁定横屏:", err);
              });
            }
          }
        } catch (err) {
          console.log("Android设备方向锁定出错:", err);
        }
        
        // 尝试使用标准全屏API
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
        } catch (error) {
          console.log("全屏请求失败:", error);
          // 如果标准方法失败，尝试iOS类似的备用方法
          const originalStyles = {
            position: gameContainer.style.position,
            top: gameContainer.style.top,
            left: gameContainer.style.left,
            width: gameContainer.style.width,
            height: gameContainer.style.height,
            zIndex: gameContainer.style.zIndex
          };
          
          (gameContainer as any)._originalStyles = originalStyles;
          gameContainer.style.position = 'fixed';
          gameContainer.style.top = '0';
          gameContainer.style.left = '0';
          gameContainer.style.width = '100vw';
          gameContainer.style.height = '100vh';
          gameContainer.style.zIndex = '9999';
          document.body.style.overflow = 'hidden';
          setIsFullscreen(true);
        }
      }
      // 对于桌面设备，使用标准全屏API
      else {
        try {
          console.log("桌面设备进入全屏");
        if (gameContainer.requestFullscreen) {
          gameContainer.requestFullscreen();
        } else if ((gameContainer as any).webkitRequestFullscreen) {
          (gameContainer as any).webkitRequestFullscreen();
        } else if ((gameContainer as any).mozRequestFullScreen) {
          (gameContainer as any).mozRequestFullScreen();
        } else if ((gameContainer as any).msRequestFullscreen) {
          (gameContainer as any).msRequestFullscreen();
          }
          // 切换按钮状态 - 如果直接调用没有触发fullscreenchange事件，手动更新状态
          // 使用更长的延迟，确保全屏状态稳定后再更新
          setTimeout(() => {
            try {
              const isFullscreenNow = checkFullscreenState();
              if (isFullscreenNow !== isFullscreen) {
                console.log(`全屏状态不一致，从 ${isFullscreen} 更新为 ${isFullscreenNow}`);
                setIsFullscreen(isFullscreenNow);
              }
            } catch (error) {
              console.error("检查全屏状态时出错:", error);
            }
          }, 500);
        } catch (error) {
          console.log("请求进入全屏出错:", error);
        }
      }
    } else {
      // 退出全屏
      if (isIOS) {
        // 恢复原始样式
        const gameContainer = gameContainerRef.current;
        if (gameContainer && (gameContainer as any)._originalStyles) {
          const originalStyles = (gameContainer as any)._originalStyles;
          gameContainer.style.position = originalStyles.position;
          gameContainer.style.top = originalStyles.top;
          gameContainer.style.left = originalStyles.left;
          gameContainer.style.width = originalStyles.width;
          gameContainer.style.height = originalStyles.height;
          gameContainer.style.zIndex = originalStyles.zIndex;
          gameContainer.style.paddingTop = '';
          gameContainer.style.paddingBottom = '';
          document.body.style.overflow = '';
          
          // 释放屏幕方向锁定
          try {
            if (window.screen.orientation && 'unlock' in window.screen.orientation) {
              (window.screen.orientation as any).unlock();
            }
          } catch (error) {
            console.log("释放屏幕方向锁定出错:", error);
          }
          
          setIsFullscreen(false);
        }
      } else if (isAndroid) {
        // 增强Android退出全屏的健壮性
        const actuallyInFullscreen = checkFullscreenState();
        
        // 如果实际上不在全屏状态，但状态显示在全屏中，直接更新状态
        if (!actuallyInFullscreen) {
          console.log("检测到状态不一致：UI显示全屏但实际没有全屏");
          setIsFullscreen(false);
          return;
        }
        // 先尝试标准API退出全屏
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
          
          // 释放屏幕方向锁定
          try {
            if (window.screen.orientation && 'unlock' in window.screen.orientation) {
              (window.screen.orientation as any).unlock();
            }
          } catch (error) {
            console.log("释放Android屏幕方向锁定出错:", error);
          }
        } catch (error) {
          console.log("退出全屏出错:", error);
          // 如果使用了备用方法，恢复原始样式
          const gameContainer = gameContainerRef.current;
          if (gameContainer && (gameContainer as any)._originalStyles) {
            const originalStyles = (gameContainer as any)._originalStyles;
            gameContainer.style.position = originalStyles.position;
            gameContainer.style.top = originalStyles.top;
            gameContainer.style.left = originalStyles.left;
            gameContainer.style.width = originalStyles.width;
            gameContainer.style.height = originalStyles.height;
            gameContainer.style.zIndex = originalStyles.zIndex;
            document.body.style.overflow = '';
            setIsFullscreen(false);
          }
        }
      } else {
        // 桌面设备标准退出全屏 - 提高健壮性
        
        // 检查是否实际上处于全屏状态
        const actuallyInFullscreen = checkFullscreenState();
        
        // 如果实际上不在全屏状态，但状态显示在全屏中，直接更新状态
        if (!actuallyInFullscreen) {
          console.log("检测到状态不一致：UI显示全屏但实际没有全屏");
          setIsFullscreen(false);
          return;
        }
        
        console.log("桌面设备退出全屏");
        // 使用简化的退出全屏逻辑
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
          
          // 切换按钮状态 - 如果直接调用没有触发fullscreenchange事件，手动更新状态
          setTimeout(() => {
            if (!checkFullscreenState() && isFullscreen) {
              console.log("全屏已退出但状态未更新，手动更新");
              setIsFullscreen(false);
            }
          }, 300);
        } catch (error) {
          console.log("退出全屏时出错:", error);
          // 强制更新状态
          setIsFullscreen(false);
        }
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
    // deviceType and phoneMode are used by GameInterface to pick the layout,
    // but individual layouts might not need them if their structure is fixed.
  };

  let layoutToRender;
  // 🎯 智能布局选择：所有桌面设备（包括iPad横屏）使用桌面布局
  const shouldUseDesktopLayout = deviceType === 'desktop';
  
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
    <I18nProvider>
      <GameProvider>
      <div 
        ref={gameContainerRef}
        className="min-h-screen w-full relative overflow-hidden"
        style={{
          // 移除默认的padding和flex居中，让子布局完全控制
          padding: 0,
          display: 'block', // 改为block，不使用flex
        }}
      >
        
        {/* 🎯 性能优化：iPad设备使用静态背景，避免动态背景导致的卡顿 */}
        {(deviceType === 'desktop' && !device.isIPad) ? (
          <BubbleBackground interactive className="absolute inset-0 w-full h-full" />
        ) : (
          <ResponsiveBackground />
        )}
        <DynamicTitle />
        {layoutToRender}
      </div>
      </GameProvider>
    </I18nProvider>
  )
}

