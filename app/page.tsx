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
  }, []);

  const handleLoadComplete = () => setIsLoading(false);

  return (
    <main className="flex flex-col items-center justify-start min-h-screen no-scroll-container game-root">
      {isLoading ? (
        <LoadingScreen onLoadComplete={handleLoadComplete} />
      ) : (
        <GameInterfaceComponent />
      )}
    </main>
  );
}

