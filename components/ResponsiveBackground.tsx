import React from "react";
import Image from "next/image";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

// 统一使用竖屏背景图
const PORTRAIT_BG = "/bg-mobile-portrait.webp";

/**
 * 响应式背景组件 - 行业标准优化版本
 * 
 * 优化策略：
 * 1. 使用单张背景图 + CSS object-position 实现响应式适配
 * 2. 避免复杂的旋转变换，使用标准的图片裁剪定位
 * 3. 利用 CSS 媒体查询和 object-fit 的组合
 * 4. 性能优化：减少 JavaScript 计算，更多依赖 CSS
 */
export default function ResponsiveBackground({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const device = useDeviceDetection();

  // 判断是否为移动端横屏
  const isMobileLandscape = device.deviceType === 'phone' && device.layoutMode === 'landscape';

  return (
    <div
      className={`absolute inset-0 w-full h-full z-0 pointer-events-none select-none ${className}`}
      style={{
        ...style,
        overflow: "hidden",
        // 🔧 修复：增加占位背景色，确保在图片加载完成前不会出现白屏
        background: "linear-gradient(to bottom right, #4c1d95, #1e3a8a)" // 匹配 violet-900 to blue-900
      }}
    >
      <Image
        src={PORTRAIT_BG}
        alt="background"
        fill
        priority
        style={{
          // 核心优化：使用 object-position 和 object-fit 组合
          objectFit: "cover",
          objectPosition: isMobileLandscape
            ? "center center" // 横屏时居中显示，让图片自然适配
            : "center center", // 竖屏时也居中显示
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
          // 横屏时的额外优化：通过 transform 微调
          transform: isMobileLandscape ? "scale(1.2)" : "scale(1)",
          transformOrigin: "center center",
          transition: "transform 0.3s ease-in-out", // 平滑过渡
        }}
        sizes="100vw"
      />

      {/* 开发环境调试信息 - 已隐藏 */}
      {/* 
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          fontSize: '11px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          zIndex: 1000,
          lineHeight: 1.2
        }}>
          <div>Device: {device.deviceType}</div>
          <div>Layout: {device.layoutMode}</div>
          <div>Size: {device.screenWidth}×{device.screenHeight}</div>
          <div>Mode: {isMobileLandscape ? 'Landscape' : 'Portrait'}</div>
        </div>
      )}
      */}
    </div>
  );
} 