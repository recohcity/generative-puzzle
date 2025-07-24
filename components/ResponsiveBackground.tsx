import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useDevice } from "@/providers/hooks";

const PORTRAIT = "/bg-mobile-portrait.png";
const LANDSCAPE = "/bg-mobile-landscape.png";

export default function ResponsiveBackground({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  // SSR 阶段默认竖图，保证一致性
  const [bgSrc, setBgSrc] = useState(PORTRAIT);
  const device = useDevice();

  useEffect(() => {
    // 使用统一设备检测系统
    const isMobile = device.deviceType === 'phone';
    const isLandscape = device.layoutMode === 'landscape';
    if (!isMobile || isLandscape) {
      // 桌面端 或 移动横屏
      setBgSrc(LANDSCAPE);
    } else {
      // 移动竖屏
      setBgSrc(PORTRAIT);
    }
  }, [device]);

  return (
    <div className={`absolute inset-0 w-full h-full z-0 pointer-events-none select-none ${className}`} style={{ ...style, overflow: "hidden" }}>
      <Image
        src={bgSrc}
        alt="background"
        fill
        priority
        style={{ objectFit: "cover", zIndex: 0, pointerEvents: "none", userSelect: "none" }}
        sizes="100vw"
      />
    </div>
  );
} 