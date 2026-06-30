"use client"

import LoadingScreen from "@/components/loading/LoadingScreen";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { GameDataManager } from "@/utils/data/GameDataManager";

const GameInterfaceComponent = dynamic(() => import("@/components/GameInterface"), { ssr: false });

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 追踪访客进入
    GameDataManager.trackVisitor();

    // 🎯 iOS PWA 视口校准：在应用启动的最早时刻，通过切换 viewport meta 标签参数
    // 强迫 iOS WebKit 重新计算视口几何尺寸。这复制了登录成功时消除黑边的确切机制：
    // 先临时锁死缩放（maximum-scale=1, user-scalable=no），迫使 iOS 重新测量，
    // 300ms 后恢复正常参数。在 LoadingScreen 阶段即完成，GameInterface 挂载时视口已正确。
    if (typeof window !== 'undefined') {
      const isPWA = !!(window.navigator as any).standalone ||
        window.matchMedia('(display-mode: standalone)').matches;
      if (isPWA) {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          // Step 1: 临时切换为严格模式 → 触发 iOS 视口重算
          viewportMeta.setAttribute('content',
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
          // Step 2: 恢复正常参数
          setTimeout(() => {
            viewportMeta.setAttribute('content',
              'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover');
          }, 300);
        }
      }
    }
  }, []);

  const handleLoadComplete = () => setIsLoading(false);

  return (
    <main className="flex flex-col items-center justify-start min-h-full no-scroll-container game-root">
      {isLoading ? (
        <LoadingScreen onLoadComplete={handleLoadComplete} />
      ) : (
        <GameInterfaceComponent />
      )}
    </main>
  );
}

