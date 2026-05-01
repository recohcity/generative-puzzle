"use client";

import React, { useRef, useMemo } from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import PhoneTabPanel from "./PhoneTabPanel";
import MobileSmartHints from "@/components/MobileSmartHints";
import { MOBILE_ADAPTATION } from '@/src/config/adaptationConfig';
import { calculateMobileLandscapeCanvasSize } from '@/constants/canvasAdaptation';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

import { cn } from "@/lib/utils";
import { useGame } from "@/contexts/GameContext";

interface PhoneLandscapeLayoutProps {
  isMusicPlaying: boolean;
  isFullscreen: boolean;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  activeTab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls';
  onTabChange: (tab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls') => void;
  goToNextTab: () => void;
  goToFirstTab: () => void;
  supportsFullscreen?: boolean;
}

const PhoneLandscapeLayout: React.FC<PhoneLandscapeLayoutProps> = ({
  isMusicPlaying,
  isFullscreen,
  onToggleMusic,
  onToggleFullscreen,
  activeTab,
  onTabChange,
  goToNextTab,
  goToFirstTab,
  supportsFullscreen,
}) => {
  // 使用统一的设备检测和画布管理系统
  const device = useDeviceDetection();
  const { state } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);

  // 直接使用适配常量计算画布尺寸，不依赖useCanvas
  // 使用 useMemo 确保屏幕旋转时能够重新计算
  const { canvasSizeValue, canvasMargin, panelWidth } = useMemo(() => {
    const landscapeResult = calculateMobileLandscapeCanvasSize(
      device.screenWidth, 
      device.screenHeight, 
      undefined,
      { isSafari: device.isSafari, isChrome: device.isChrome, isWeChat: device.isWeChat }
    );
    const canvasSizeValue = landscapeResult.canvasSize;
    const canvasMargin = MOBILE_ADAPTATION.LANDSCAPE.CANVAS_MARGIN;

    // 直接使用 canvasAdaptation.ts 中精心计算的面板宽度（320-340px）
    // 不再使用画布尺寸作为面板宽度，避免内容被截断
    const panelWidth = landscapeResult.panelWidth;

    return { canvasSizeValue, canvasMargin, panelWidth };
  }, [device.screenWidth, device.screenHeight, device.isSafari, device.isChrome, device.isWeChat]);

  // 横屏画布尺寸计算调试输出已移除

  return (
    <div 
      className={cn(
        "no-scroll-container flex flex-row items-center justify-center",
        state.draggingPiece ? "dragging-active" : ""
      )}
      style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100dvh', // 使用 dynamic viewport height，精准适配移动工具栏
      width: '100%', // 使用 100% 代替 vw 以获得更稳健的 WebView 兼容性
      maxWidth: '100vw',
      margin: '0 auto', // 🎯 极致对齐：强制居中
      // 🎯 微信专项优化：横屏下强制靠顶对齐，解决顶部留空过多问题；其他浏览器维持垂直居中
      alignItems: device.isWeChat ? 'flex-start' : 'center', 
      justifyContent: 'center', // 🎯 极致居中
      overflow: 'hidden', // 网页端严防滚动条
      position: 'relative',
      
      // 🎯 2026 移动全能力探测优化：使用平衡安全区变量防止刘海偏移，确保视觉绝对居中
      paddingLeft: 'max(env(safe-area-inset-left), env(safe-area-inset-right), 12px)',
      paddingRight: 'max(env(safe-area-inset-left), env(safe-area-inset-right), 12px)',
      // 🎯 微信专项优化：横屏顶置模式下，增加 4px 极小边距防止紧贴顶栏
      paddingTop: device.isWeChat ? '4px' : 'env(safe-area-inset-top, 4px)',
      paddingBottom: 'env(safe-area-inset-bottom, 4px)',
      gap: 10, // 🎯 优化：左右面板间距从 12 降至 10
    }}>
      {/* 🎯 优化：左侧区域不再强行撑开，改为紧凑排列 */}
      <div
        style={{
          height: '100%',
          display: 'flex',
          // 🎯 微信专项优化：左侧包装容器也需同步靠顶对齐，确保与右侧面板基准线一致
          alignItems: device.isWeChat ? 'flex-start' : 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          ref={containerRef}
          style={{
            width: canvasSizeValue,
            height: canvasSizeValue,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 24,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* 智能提示区域 - 使用统一覆盖元素样式 */}
          <div className="overlay-element smart-hints-overlay top-2">
            <MobileSmartHints />
          </div>
          <PuzzleCanvas />
        </div>
      </div>

      {/* 🎯 优化：控制面板宽度严格受控 */}
      <div
        id="panel-container"
        style={{
          width: panelWidth,
          minWidth: panelWidth,
          maxWidth: panelWidth,
          height: canvasSizeValue, // 面板高度对齐画布高度
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <PhoneTabPanel
          activeTab={activeTab}
          onTabChange={onTabChange}
          goToNextTab={goToNextTab}
          goToFirstTab={goToFirstTab}
          isMusicPlaying={isMusicPlaying}
          isFullscreen={isFullscreen}
          onToggleMusic={onToggleMusic}
          onToggleFullscreen={onToggleFullscreen}
          supportsFullscreen={supportsFullscreen}
          style={{ height: '100%', width: '100%' }}
          isLandscape={true}
        />
      </div>
    </div>
  );
};

export default PhoneLandscapeLayout;