"use client"
import { GameProvider } from "@/contexts/GameContext"
// Removed custom ThemeProvider/useTheme import
// import { ThemeProvider, useTheme } from "@/contexts/ThemeContext"
import PuzzleCanvas from "@/components/PuzzleCanvas"
import PuzzleControls from "@/components/PuzzleControls"
import ShapeControls from "@/components/ShapeControls"
import PuzzleControlsCutType from "@/components/PuzzleControlsCutType"
import PuzzleControlsCutCount from "@/components/PuzzleControlsCutCount"
import PuzzleControlsScatter from "@/components/PuzzleControlsScatter"
import PuzzleControlsGamepad from "@/components/PuzzleControlsGamepad"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Maximize, Minimize } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { 
  initBackgroundMusic, 
  toggleBackgroundMusic, 
  getBackgroundMusicStatus, 
  playButtonClickSound 
} from "@/utils/rendering/soundEffects"

export default function CurveTestOptimized() {
  // 添加背景音乐状态
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  // 添加全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 添加ref用于全屏元素
  const gameContainerRef = useRef<HTMLDivElement>(null);
  // 添加设备类型检测状态
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'phone'>('desktop');
  // 添加手机模式状态，用于区分横竖屏
  const [phoneMode, setPhoneMode] = useState<'portrait' | 'landscape'>('portrait');
  // 添加控制面板选项卡状态（仅用于手机模式）
  const [activeTab, setActiveTab] = useState<'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls'>('shape');

  // 检测设备类型
  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortrait = height > width;
      
      // 检测是否为iPhone
      const isIPhone = /iPhone/i.test(ua);
      
      // 检测是否为Android手机
      const isAndroid = /Android/i.test(ua);
      
      // 检测是否为iPad
      const isIPad = /iPad/i.test(ua) || 
                   (/Macintosh/i.test(ua) && 'ontouchend' in document);
      
      const isMobile = isIPhone || isAndroid;
      
      // 更新手机屏幕方向状态
      if (isMobile) {
        setPhoneMode(isPortrait ? 'portrait' : 'landscape');
        console.log(`手机方向: ${isPortrait ? '竖屏' : '横屏'}`);
      }
      
      // 根据屏幕宽度和设备类型确定最终设备类型
      if (isIPhone || isAndroid || width < 640) {
        setDeviceType('phone');
      } else if (isIPad || (width >= 640 && width < 1024)) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
      
      console.log(`设备类型: ${deviceType}, 手机模式: ${phoneMode}, 屏幕: ${width}x${height}, iPhone: ${isIPhone}, Android: ${isAndroid}, iPad: ${isIPad}`);
    };
    
    // 初始化检测
    detectDevice();
    
    // 在窗口大小变化时重新检测
    window.addEventListener('resize', detectDevice);
    
    // 特别监听方向变化事件
    window.addEventListener('orientationchange', () => {
      console.log("方向变化检测到");
      setTimeout(detectDevice, 300); // 延迟检测，确保浏览器已完成方向变化
    });
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, [deviceType, phoneMode]);

  // 初始化背景音乐
  useEffect(() => {
    // 只在客户端运行
    if (typeof window !== 'undefined') {
      initBackgroundMusic();
      // 获取初始状态
      setIsMusicPlaying(getBackgroundMusicStatus());
    }
  }, []);
  
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
        console.log(`全屏状态变化: ${isInFullscreen ? '进入全屏' : '退出全屏'}`);
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
  }, []);
  
  // 设置全屏模式下的特殊触摸事件处理
  const setupFullscreenTouchHandlers = () => {
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
        
        // 如果是按钮，不阻止默认行为
        if (isButton) {
          return;
        }
      }
      
      // 记录所有触摸开始的Y坐标
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
      
      // 阻止iOS上可能导致退出全屏的触摸开始行为
      if (/(iPad|iPhone|iPod)/i.test(navigator.userAgent)) {
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
        
        // 如果是按钮，不阻止默认行为
        if (isButton) {
          return;
        }
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
          if (/(iPad|iPhone|iPod)/i.test(navigator.userAgent)) {
            // 重置touch位置，避免累积滑动效果
            touchStartY = currentTouchY;
          }
        }
      }
    };
    
    // 处理触摸结束事件
    const handleTouchEnd = (e: TouchEvent) => {
      // 重置触摸开始位置
      touchStartY = 0;
      
      // 阻止某些可能触发退出全屏的结束事件
      if (/(iPad|iPhone|iPod)/i.test(navigator.userAgent)) {
        e.preventDefault();
      }
    };
    
    // 只监听可能导致退出全屏的手势
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 锁定屏幕方向（如果支持）
    if (window.screen.orientation && 'lock' in window.screen.orientation) {
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
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
  };
  
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

  // 处理音乐切换
  const handleToggleMusic = () => {
    playButtonClickSound();
    const newStatus = toggleBackgroundMusic();
    setIsMusicPlaying(newStatus);
  };
  
  // 全屏切换函数
  const toggleFullscreen = () => {
    playButtonClickSound();
    
    // 检测设备类型
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    const isInWebView = /(.*WebView|.*FBIOS|.*Twitter)/.test(navigator.userAgent);
    
    console.log(`设备检测: iOS=${isIOS}, Android=${isAndroid}, 移动=${isMobile}, WebView=${isInWebView}`);
    
    if (!isFullscreen) {
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
          if (window.innerWidth > window.innerHeight) {
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
          if (window.innerWidth > window.innerHeight) {
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
        if (gameContainer.requestFullscreen) {
          gameContainer.requestFullscreen();
        } else if ((gameContainer as any).webkitRequestFullscreen) {
          (gameContainer as any).webkitRequestFullscreen();
        } else if ((gameContainer as any).mozRequestFullScreen) {
          (gameContainer as any).mozRequestFullScreen();
        } else if ((gameContainer as any).msRequestFullscreen) {
          (gameContainer as any).msRequestFullscreen();
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
        // 桌面设备标准退出全屏
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
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

  return (
    // Removed custom ThemeProvider wrapper
    <GameProvider>
      <div 
        ref={gameContainerRef}
        className="min-h-screen w-full p-4 lg:p-6 flex items-center justify-center"
        style={{
          backgroundImage: "url('/bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* 根据设备类型应用不同的布局类名 */}
        <div className={`
          max-w-[1400px] w-full h-[calc(100vh-32px)] mx-auto relative 
          ${deviceType === 'phone' && phoneMode === 'portrait' ? 'flex flex-col gap-6' : 
            deviceType === 'phone' && phoneMode === 'landscape' ? 'flex flex-row gap-2 justify-center items-center p-1' : 
            'flex flex-row gap-6 justify-center items-center'}
        `}>
          {/* 手机竖屏布局时的标题和控制按钮 */}
          {deviceType === 'phone' && phoneMode === 'portrait' && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-[#FFB17A]">生成式拼图游戏</h1>
                
                <div className="flex items-center space-x-2">
                  {/* 音乐控制按钮 */}
                  <Button
                    onClick={handleToggleMusic}
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-8 h-8 text-[#FFB17A] hover:text-[#F26419] hover:bg-[#463E50] transition-colors"
                    aria-label={isMusicPlaying ? "关闭背景音乐" : "开启背景音乐"}
                    title={isMusicPlaying ? "关闭背景音乐" : "开启背景音乐"}
                  >
                    {isMusicPlaying ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <VolumeX className="h-5 w-5" />
                    )}
                  </Button>
                  
                  {/* 全屏切换按钮 */}
                  <Button
                    onClick={toggleFullscreen}
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-8 h-8 text-[#FFB17A] hover:text-[#F26419] hover:bg-[#463E50] transition-colors"
                    aria-label={isFullscreen ? "退出全屏" : "进入全屏"}
                    title={isFullscreen ? "退出全屏" : "进入全屏"}
                  >
                    {isFullscreen ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 左侧控制面板 */}
          <div className={`
            ${deviceType === 'phone' && phoneMode === 'portrait' ? 'w-full h-[50vh] order-2' : 
              deviceType === 'phone' && phoneMode === 'landscape' ? 'w-[300px] min-w-[300px] h-full' : 
              'w-[350px] min-w-[350px] h-full'} 
            flex-shrink-0
          `}>
            {/* 面板背景和样式 */}
            <div className={`bg-[#36323E] rounded-3xl border-2 border-[#463E50] h-full flex flex-col shadow-[0_10px_25px_rgba(0,0,0,0.3)] overflow-hidden
              ${deviceType === 'phone' && phoneMode === 'landscape' ? 'p-2' : 'p-4 lg:p-6'}`}>
              {/* 手机横屏或非手机设备显示的标题和控制按钮 */}
              {(deviceType !== 'phone' || (deviceType === 'phone' && phoneMode === 'landscape')) && (
                <div className="flex flex-col mb-1 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h1 className={`${deviceType === 'phone' && phoneMode === 'landscape' ? 'text-sm' : 'text-xl'} font-bold text-[#FFB17A]`}>生成式拼图游戏</h1>
                    
                    <div className="flex items-center space-x-2">
                      {/* 音乐控制按钮 */}
                      <Button
                        onClick={handleToggleMusic}
                        variant="ghost"
                        size="icon"
                        className={`rounded-full ${deviceType === 'phone' && phoneMode === 'landscape' ? 'w-6 h-6' : 'w-8 h-8'} text-[#FFB17A] hover:text-[#F26419] hover:bg-[#463E50] transition-colors`}
                        aria-label={isMusicPlaying ? "关闭背景音乐" : "开启背景音乐"}
                        title={isMusicPlaying ? "关闭背景音乐" : "开启背景音乐"}
                      >
                        {isMusicPlaying ? (
                          <Volume2 className={`${deviceType === 'phone' && phoneMode === 'landscape' ? 'h-4 w-4' : 'h-5 w-5'}`} />
                        ) : (
                          <VolumeX className={`${deviceType === 'phone' && phoneMode === 'landscape' ? 'h-4 w-4' : 'h-5 w-5'}`} />
                        )}
                      </Button>
                      
                      {/* 全屏切换按钮 */}
                      <Button
                        onClick={toggleFullscreen}
                        variant="ghost"
                        size="icon"
                        className={`rounded-full ${deviceType === 'phone' && phoneMode === 'landscape' ? 'w-6 h-6' : 'w-8 h-8'} text-[#FFB17A] hover:text-[#F26419] hover:bg-[#463E50] transition-colors`}
                        aria-label={isFullscreen ? "退出全屏" : "进入全屏"}
                        title={isFullscreen ? "退出全屏" : "进入全屏"}
                      >
                        {isFullscreen ? (
                          <Minimize className={`${deviceType === 'phone' && phoneMode === 'landscape' ? 'h-4 w-4' : 'h-5 w-5'}`} />
                        ) : (
                          <Maximize className={`${deviceType === 'phone' && phoneMode === 'landscape' ? 'h-4 w-4' : 'h-5 w-5'}`} />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 手机设备显示的选项卡切换 */}
              {deviceType === 'phone' && (
                <div className={`flex ${phoneMode === 'landscape' ? 'flex-row justify-between' : 'justify-center'} bg-[#2A283E] rounded-xl mb-1 overflow-x-auto whitespace-nowrap scrollbar-hide`}>
                  <button
                    className={`${phoneMode === 'landscape' ? 'py-1 px-1.5 text-[12px] flex-1' : 'min-w-[65px] px-1 py-1 text-[12px]'} font-medium transition-colors
                      ${activeTab === 'shape' 
                        ? 'bg-[#F68E5F] text-white' 
                        : 'text-[#FFD5AB] hover:bg-[#463E50]'}`}
                    onClick={() => handleTabChange('shape')}
                  >
                    形状
                  </button>
                  <button
                    className={`${phoneMode === 'landscape' ? 'py-1 px-1.5 text-[12px] flex-1' : 'min-w-[65px] px-1 py-1 text-[12px]'} font-medium transition-colors
                      ${activeTab === 'puzzle' 
                        ? 'bg-[#F68E5F] text-white' 
                        : 'text-[#FFD5AB] hover:bg-[#463E50]'}`}
                    onClick={() => handleTabChange('puzzle')}
                  >
                    切割类型
                  </button>
                  <button
                    className={`${phoneMode === 'landscape' ? 'py-1 px-1.5 text-[12px] flex-1' : 'min-w-[65px] px-1 py-1 text-[12px]'} font-medium transition-colors
                      ${activeTab === 'cut' 
                        ? 'bg-[#F68E5F] text-white' 
                        : 'text-[#FFD5AB] hover:bg-[#463E50]'}`}
                    onClick={() => handleTabChange('cut')}
                  >
                    切割次数
                  </button>
                  <button
                    className={`${phoneMode === 'landscape' ? 'py-1 px-1.5 text-[12px] flex-1' : 'min-w-[65px] px-1 py-1 text-[12px]'} font-medium transition-colors
                      ${activeTab === 'scatter' 
                        ? 'bg-[#F68E5F] text-white' 
                        : 'text-[#FFD5AB] hover:bg-[#463E50]'}`}
                    onClick={() => handleTabChange('scatter')}
                  >
                    散开
                  </button>
                  <button
                    className={`${phoneMode === 'landscape' ? 'py-1 px-1.5 text-[12px] flex-1' : 'min-w-[65px] px-1 py-1 text-[12px]'} font-medium transition-colors
                      ${activeTab === 'controls' 
                        ? 'bg-[#F68E5F] text-white' 
                        : 'text-[#FFD5AB] hover:bg-[#463E50]'}`}
                    onClick={() => handleTabChange('controls')}
                  >
                    控制
                  </button>
                </div>
              )}
              
              {/* 面板内容区域 */}
              <div className={`space-y-1 flex-1 overflow-y-auto pr-1 -mr-1 ${deviceType === 'phone' && phoneMode === 'landscape' ? 'max-h-[calc(100vh-60px)]' : deviceType === 'phone' ? 'max-h-[calc(100vh-180px)]' : ''}`}> 
                {/* 根据选项卡显示内容 */}
                {deviceType !== 'phone' && (
                  <>
                    <div className="p-3 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                      <h3 className="text-sm font-medium mb-2 text-[#FFD5AB]">生成形状</h3>
                      <ShapeControls goToNextTab={goToNextTab} />
                    </div>
                    <div className="p-3 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                      <h3 className="text-sm font-medium mb-2 text-[#FFD5AB]">拼图设置</h3>
                      <PuzzleControls goToNextTab={goToNextTab} goToFirstTab={goToFirstTab} />
                    </div>
                  </>
                )}
                
                {/* 手机模式下根据activeTab显示不同内容 */}
                {deviceType === 'phone' && (
                  <>
                    {activeTab === 'shape' && (
                      <div className={`p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] ${phoneMode === 'landscape' ? 'p-2' : ''}`}>
                        <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">生成形状</h3>
                        <ShapeControls goToNextTab={goToNextTab} />
                      </div>
                    )}
                    
                    {activeTab === 'puzzle' && (
                      <div className={`p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] ${phoneMode === 'landscape' ? 'p-2' : ''}`}>
                        <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">选择切割类型</h3>
                        <PuzzleControlsCutType goToNextTab={goToNextTab} />
                      </div>
                    )}

                    {activeTab === 'cut' && (
                      <div className={`p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] ${phoneMode === 'landscape' ? 'p-2' : ''}`}>
                        <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">选择切割次数</h3>
                        <PuzzleControlsCutCount goToNextTab={goToNextTab} />
                      </div>
                    )}

                    {activeTab === 'scatter' && (
                      <div className={`p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] ${phoneMode === 'landscape' ? 'p-2' : ''}`}>
                        <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">散开拼图</h3>
                        <PuzzleControlsScatter goToNextTab={goToNextTab} />
                      </div>
                    )}

                    {activeTab === 'controls' && (
                      <div className={`p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] ${phoneMode === 'landscape' ? 'p-2' : ''}`}>
                        <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">游戏控制</h3>
                        <PuzzleControlsGamepad goToFirstTab={goToFirstTab} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 右侧游戏区域 */}
          <div className={`
            ${deviceType === 'phone' && phoneMode === 'portrait' ? 'w-full h-[50vh] order-1' : 
              deviceType === 'phone' && phoneMode === 'landscape' ? 'flex-1 h-full' : 
              'flex-1 h-full'} 
            relative bg-white/20 backdrop-blur-sm rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] border-2 border-white/30 flex justify-center items-center overflow-hidden
          `}>
            {/* 游戏画布 */}
            <PuzzleCanvas />
          </div>
        </div>

        {/* 手机竖屏布局切换按钮 */}
        {deviceType === 'phone' && (
          <button
            className="fixed bottom-4 right-4 z-50 bg-[#F26419] text-white rounded-full p-3 shadow-lg"
            onClick={() => {
              const container = document.querySelector('.flex-col');
              if (container) {
                container.classList.toggle('order-swap');
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
              <line x1="4" y1="12" x2="20" y2="12"></line>
            </svg>
          </button>
        )}
      </div>
    </GameProvider>
  )
}

