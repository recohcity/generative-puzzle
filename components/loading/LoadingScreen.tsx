"use client"

import { useEffect, useState, useRef } from "react"

interface LoadingScreenProps {
  onLoadComplete: () => void
}

export default function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(15) // 从15%开始，与静态加载页面保持一致
  const [puzzlePieces, setPuzzlePieces] = useState<any[]>([])
  const loadingCompleted = useRef(false)
  const startTime = useRef(Date.now())
  const preloadStarted = useRef(false)
  
  // 在移动设备上尝试自动进入全屏
  useEffect(() => {
    // 检测是否为移动设备
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // 设置延迟，确保在用户交互后尝试全屏
      const tryFullscreen = () => {
        // 获取根元素
        const docElement = document.documentElement;
        
        if (docElement.requestFullscreen) {
          docElement.requestFullscreen().catch(err => {
            console.log('全屏请求被拒绝:', err);
          });
        } else if ((docElement as any).webkitRequestFullscreen) {
          (docElement as any).webkitRequestFullscreen().catch(err => {
            console.log('WebKit全屏请求被拒绝:', err);
          });
        } else if ((docElement as any).msRequestFullscreen) {
          (docElement as any).msRequestFullscreen().catch(err => {
            console.log('MS全屏请求被拒绝:', err);
          });
        }
      };
      
      // 监听用户交互，以便能够请求全屏
      const handleUserAction = () => {
        // 移除所有事件监听器
        document.removeEventListener('click', handleUserAction);
        document.removeEventListener('touchstart', handleUserAction);
        
        // 尝试进入全屏
        tryFullscreen();
      };
      
      // 添加事件监听器，等待用户交互
      document.addEventListener('click', handleUserAction);
      document.addEventListener('touchstart', handleUserAction);
      
      return () => {
        // 清理事件监听器
        document.removeEventListener('click', handleUserAction);
        document.removeEventListener('touchstart', handleUserAction);
      };
    }
  }, []);
  
  // 预加载主要资源
  useEffect(() => {
    if (preloadStarted.current) return;
    preloadStarted.current = true;

    // 预加载CurveTestOptimized组件
    const preloadMainComponent = async () => {
      try {
        // 使用Promise.race来限制初始加载时间
        const timeoutPromise = new Promise(resolve => {
          // 如果1.5秒内没有完成加载，就继续进行
          setTimeout(resolve, 1500, { timeout: true });
        });
        
        const importPromise = import('@/curve-test-optimized');
        
        // 更平滑地增加进度条，提高用户感知的速度
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev < 80) return prev + (80 - prev) * 0.15;
            return prev;
          });
        }, 80);
        
        // 等待组件加载或超时
        const result = await Promise.race([importPromise, timeoutPromise]);
        
        // 清除进度条定时器
        clearInterval(progressInterval);
        
        // 计算已经过去的时间
        const elapsed = Date.now() - startTime.current;
        console.log(`组件加载用时: ${elapsed}ms`);
        
        // 设置最小加载时间，确保平滑过渡
        const remainingTime = Math.max(0, 500 - elapsed);
        
        // 如果是超时结果，继续尝试导入
        if (result && (result as any).timeout) {
          console.log('加载超时，继续在后台加载');
          // 在后台继续加载
          importPromise.catch(e => console.error('后台加载出错:', e));
        }
        
        // 平滑完成进度条
        setProgress(95);
        setTimeout(() => {
          setProgress(100);
          
          // 标记加载已完成
          loadingCompleted.current = true;
          
          // 加载完成后延迟适当时间再进入游戏
          setTimeout(() => {
            onLoadComplete();
          }, 800); // 给用户一点时间看到100%加载完成的状态
        }, 200);
      } catch (error) {
        console.error('加载游戏组件失败:', error);
        // 出错时也显示100%并进入游戏
        setProgress(100);
        loadingCompleted.current = true;
        
        // 延迟后进入游戏
        setTimeout(() => {
          onLoadComplete();
        }, 800);
      }
    };
    
    // 添加短暂延迟再开始加载，确保UI已经稳定
    setTimeout(preloadMainComponent, 100);
    
    // 添加超时保护，确保无论如何都会完成加载
    const timeoutId = setTimeout(() => {
      if (!loadingCompleted.current) {
        console.log('触发加载超时保护');
        setProgress(100);
        loadingCompleted.current = true;
        
        // 超时后进入游戏
        onLoadComplete();
      }
    }, 4000); // 4秒超时保护
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [onLoadComplete]);
  
  // 在客户端渲染时生成拼图碎片，保持与静态版本位置一致
  useEffect(() => {
    // 创建与静态加载屏幕相同位置的拼图碎片
    const pieces = [
      {
        id: 0,
        top: "20%",
        left: "15%",
        size: 50,
        rotation: 45,
        animationClass: "float-1",
      },
      {
        id: 1,
        top: "60%",
        left: "80%",
        size: 70,
        rotation: 120,
        animationClass: "float-2",
      },
      {
        id: 2,
        top: "80%",
        left: "30%",
        size: 60,
        rotation: 200,
        animationClass: "float-3",
      },
      {
        id: 3,
        top: "30%",
        left: "70%",
        size: 55,
        rotation: 300,
        animationClass: "float-4",
      },
      // 添加两个额外的碎片
      {
        id: 4,
        top: "50%",
        left: "20%",
        size: 65,
        rotation: 150,
        animationClass: "float-2",
      },
      {
        id: 5,
        top: "15%",
        left: "40%",
        size: 45,
        rotation: 225,
        animationClass: "float-3",
      },
    ];
    
    setPuzzlePieces(pieces);
  }, []);
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#2A2835] to-[#1F1D2B] overflow-hidden">
      {/* 装饰性拼图碎片 */}
      {puzzlePieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute opacity-10 bg-[#F68E5F] ${piece.animationClass}`}
          style={{
            top: piece.top,
            left: piece.left,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
      
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F68E5F] to-[#F26419] mb-8 animate-pulse md:text-6xl text-4xl sm:text-center text-left w-full px-6">
          Generative<br className="md:hidden" /> Puzzle
        </h1>
        
        <div className="w-80 h-3 bg-[#3D3852] rounded-full overflow-hidden border-2 border-[#504C67]">
          <div 
            className={`h-full bg-gradient-to-r from-[#F68E5F] to-[#F26419] transition-all duration-300 ease-out ${progress < 100 && !loadingCompleted.current ? 'animate-pulse' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="mt-3 text-[#FFD5AB] font-medium">
          {Math.floor(progress)}% {progress >= 100 ? '加载完成！' : '加载中...'}
        </p>
      </div>
    </div>
  )
} 