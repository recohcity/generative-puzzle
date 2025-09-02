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
  useEffect(() => {
    let timer: NodeJS.Timeout;
    timer = setInterval(() => {
      setDisplayProgress(prev => {
        if (!resourceLoaded && prev < 99) {
          return Math.min(prev + 1, 99); // 匀速递增
        }
        if (resourceLoaded && prev < 100) {
          return 100; // 资源加载完成后直接补到100%
        }
        return prev;
      });
    }, 16); // 约60fps
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
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-6xl font-bold text-white mb-8 md:text-6xl text-4xl sm:text-center text-left w-full px-6">
          Generative<br className="md:hidden" /> Puzzle
        </h1>
        <div className="w-80 h-3 bg-white/30 rounded-full overflow-hidden border-2 border-white">
          <div
            className="h-full bg-white transition-[width] duration-300 ease-out"
            style={{ width: `${done ? 100 : displayProgress}%`, willChange: 'width', transform: 'translateZ(0)' }}
          />
        </div>
        <p className="mt-3 text-white font-medium">
          {done ? '100% 加载完成！' : `${Math.floor(displayProgress)}% ${displayProgress >= 100 ? '加载完成！' : '加载中...'}`}
        </p>
      </div>

      {/* 版权信息 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <div className="text-white text-xs text-center leading-relaxed">
          <div>recoh AI project | V{process.env.APP_VERSION || '1.3.51'} | <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors">粤ICP备18028701号</a></div>
        </div>
      </div>
    </div>
  )
} 