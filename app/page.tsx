"use client"

import LoadingScreen from "@/components/loading/LoadingScreen";
import dynamic from "next/dynamic";
import { useState } from "react";

const GameInterfaceComponent = dynamic(() => import("@/components/GameInterface"), { ssr: false });

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadComplete = () => setIsLoading(false);

  return (
    <main className="flex items-center justify-center min-h-screen">
      {isLoading ? (
        <LoadingScreen onLoadComplete={handleLoadComplete} />
      ) : (
        <GameInterfaceComponent />
      )}
    </main>
  );
}

