"use client"

import { useEffect, useState, useRef } from "react"

interface LoadingScreenProps {
  onLoadComplete: () => void
}

export default function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  // 动画进度（显示用）
  const [displayProgress, setDisplayProgress] = useState(1);
  const [resourceLoaded, setResourceLoaded] = useState(false);
  const loadingCompleted = useRef<boolean>(false);
  const MIN_LOADING_TIME = 900; // 最短展示 0.9 秒
  const startTime = useRef<number>(Date.now());
  const [done, setDone] = useState(false);

  // 匀速动画进度递增到99%，资源加载完成后补到100%
  // 优化：将原本16ms的密集React渲染降频至150ms，利用CSS transition实现视觉平滑
  // 极大降低移动端主线程CPU占用，改善加载期间的TBT与INP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    timer = setInterval(() => {
      setDisplayProgress(prev => {
        if (!resourceLoaded && prev < 98) {
          return Math.min(prev + Math.random() * 8, 98); // 低频大步进，配合长CSS动画
        }
        if (resourceLoaded && prev < 100) {
          return 100; // 资源加载完成后直接补到100%
        }
        return prev;
      });
    }, 150); // 从16ms提升至150ms，大幅减少React重渲染
    return () => clearInterval(timer);
  }, [resourceLoaded]);

  // 预加载主要资源，加载完成后补到100%
  useEffect(() => {
    let finished = false;
    let timeoutId: NodeJS.Timeout;
    const preloadMainComponent = async () => {
      try {
        const importPromise = import('@/components/GameInterface');
        await importPromise;
        finished = true;
        setResourceLoaded(true);
      } catch (e) {
        finished = true;
        setResourceLoaded(true);
      }
    };
    preloadMainComponent();
    // 超时保护
    timeoutId = setTimeout(() => {
      if (!finished) {
        setResourceLoaded(true);
      }
    }, 4000);
    return () => clearTimeout(timeoutId);
  }, []);

  // 进度条和数字都到100%才切页面，且保证最短展示时长
  useEffect(() => {
    if (!loadingCompleted.current && displayProgress >= 100) {
      loadingCompleted.current = true;
      setDone(true);
      const elapsed = Date.now() - startTime.current;
      if (elapsed < MIN_LOADING_TIME) {
        setTimeout(() => {
          onLoadComplete();
        }, MIN_LOADING_TIME - elapsed);
      } else {
        onLoadComplete();
      }
    }
  }, [displayProgress, onLoadComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-violet-900 to-blue-900">
      {/* ResponsiveBackground 已移除，直接用渐变背景 */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="w-full px-6 flex sm:justify-center justify-start mb-8">
          {/* 移动端：双行排版 SVG，彻底免疫安卓大字体缩放 */}
          <svg viewBox="0 0 280 110" className="block md:hidden w-[90%] max-w-[280px] h-auto text-brand-amber filter drop-shadow-md">
            <text x="0" y="45" fill="currentColor" fontSize="46" fontWeight="900" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="-1">
              Generative
            </text>
            <text x="0" y="100" fill="currentColor" fontSize="46" fontWeight="900" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="-1">
              Puzzle
            </text>
          </svg>
          
          {/* 桌面端：单行排版 SVG */}
          <svg viewBox="0 0 500 70" className="hidden md:block w-full max-w-[500px] h-auto text-brand-amber filter drop-shadow-lg">
            <text x="50%" y="55" textAnchor="middle" fill="currentColor" fontSize="60" fontWeight="900" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="-1">
              Generative Puzzle
            </text>
          </svg>
        </div>
        <div className="w-80 h-3 bg-white/10 rounded-full overflow-hidden border border-white/20">
          <div
            className="h-full transition-[width] ease-out"
            style={{ 
              width: `${done ? 100 : displayProgress}%`, 
              backgroundColor: 'var(--brand-peach)',
              willChange: 'width', 
              transitionDuration: done ? '300ms' : '150ms', // 匹配刷新频率
              transform: 'translateZ(0)' 
            }}
          />
        </div>
        <p className="mt-4 font-medium text-zoom-lock" style={{ color: 'var(--brand-peach)' }}>
          {done ? '100% Load Complete' : `${Math.floor(displayProgress)}% ${displayProgress >= 100 ? 'Load Complete' : 'Loading...'}`}
        </p>
      </div>

      {/* 版权信息 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <div className="text-white text-xs text-center leading-relaxed">
          <div>recoh AI project 2026 | V{process.env.APP_VERSION || '1.3.51'} | <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors">粤ICP备18028701号</a></div>
        </div>
      </div>
    </div>
  )
} 