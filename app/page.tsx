"use client"

import LoadingScreen from "@/components/loading/LoadingScreen";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { GameDataManager } from "@/utils/data/GameDataManager";

const GameInterfaceComponent = dynamic(() => import("@/components/GameInterface"), { ssr: false });

export default function HomePage() {
  const [isGameReady, setIsGameReady] = useState(false);

  useEffect(() => {
    // 追踪访客进入
    GameDataManager.trackVisitor();

    // iOS PWA 启动时固定 viewport-fit 和缩放参数，避免首屏布局使用错误的视口尺寸。
    if (typeof window !== 'undefined') {
      const isPWA = !!(window.navigator as any).standalone ||
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches;
      const isChromeBrowser = /Chrome|CriOS/i.test(window.navigator.userAgent) && !isPWA;
      const root = document.documentElement;

      root.classList.toggle('chrome-browser', isChromeBrowser);

      const visualViewport = isChromeBrowser ? window.visualViewport : null;
      const syncChromeViewport = () => {
        if (!visualViewport) return;
        root.style.setProperty('--chrome-viewport-height', `${Math.round(visualViewport.height)}px`);
      };

      syncChromeViewport();
      visualViewport?.addEventListener('resize', syncChromeViewport);

      document.documentElement.classList.toggle('pwa-standalone', isPWA);
      if (isPWA) {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          // 🎯 锁定全屏铺满：保持 viewport-fit=cover 且禁止缩放，防止 iOS WebKit PWA 退出全景模式产生底部黑边
          viewportMeta.setAttribute('content',
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        }
      }

      return () => {
        visualViewport?.removeEventListener('resize', syncChromeViewport);
        root.classList.remove('chrome-browser');
        root.style.removeProperty('--chrome-viewport-height');
      };
    }
  }, []);

  const handleGameReady = useCallback(() => setIsGameReady(true), []);

  return (
    <main className="flex flex-col items-center justify-start min-h-full no-scroll-container game-root">
      <GameInterfaceComponent onReady={handleGameReady} />
      {!isGameReady && <LoadingScreen onLoadComplete={() => undefined} />}
    </main>
  );
}
