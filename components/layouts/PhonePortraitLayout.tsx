"use client";

import React from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import ShapeControls from "@/components/ShapeControls";
import PuzzleControlsCutType from "@/components/PuzzleControlsCutType";
import PuzzleControlsCutCount from "@/components/PuzzleControlsCutCount";
import PuzzleControlsScatter from "@/components/PuzzleControlsScatter";
import PuzzleControlsGamepad from "@/components/PuzzleControlsGamepad";
import GlobalUtilityButtons from "@/components/GlobalUtilityButtons";

interface PhonePortraitLayoutProps {
  isMusicPlaying: boolean;
  isFullscreen: boolean;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  activeTab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls';
  onTabChange: (tab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls') => void;
  goToNextTab: () => void;
  goToFirstTab: () => void;
}

const PhonePortraitLayout: React.FC<PhonePortraitLayoutProps> = ({
  isMusicPlaying,
  isFullscreen,
  onToggleMusic,
  onToggleFullscreen,
  activeTab,
  onTabChange,
  goToNextTab,
  goToFirstTab,
}) => {
  return (
    <div className="max-w-[1400px] w-full h-[calc(100vh-32px)] mx-auto relative flex flex-col gap-6">
      {/* Title and Global Controls */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#FFB17A]">生成式拼图游戏</h1>
          <GlobalUtilityButtons 
            isMusicPlaying={isMusicPlaying}
            isFullscreen={isFullscreen}
            onToggleMusic={onToggleMusic}
            onToggleFullscreen={onToggleFullscreen}
          />
        </div>
      </div>

      {/* Control Panel (Bottom for Portrait) */}
      <div className="w-full h-[50vh] order-2 flex-shrink-0">
        <div className="bg-[#36323E] rounded-3xl border-2 border-[#463E50] h-full flex flex-col shadow-[0_10px_25px_rgba(0,0,0,0.3)] overflow-hidden p-4 lg:p-6">
          {/* Tabs */}
          <div className="flex justify-center bg-[#2A283E] rounded-xl mb-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
            {(['shape', 'puzzle', 'cut', 'scatter', 'controls'] as const).map((tab) => (
              <button
                key={tab}
                className={`min-w-[65px] px-1 py-1 text-[12px] font-medium transition-colors
                  ${activeTab === tab 
                    ? 'bg-[#F68E5F] text-white' 
                    : 'text-[#FFD5AB] hover:bg-[#463E50]'}`}
                onClick={() => onTabChange(tab)}
              >
                {tab === 'shape' ? '形状' : 
                 tab === 'puzzle' ? '切割类型' : 
                 tab === 'cut' ? '切割次数' : 
                 tab === 'scatter' ? '散开' : '控制'}
              </button>
            ))}
          </div>
          {/* Panel Content */}
          <div className="space-y-1 flex-1 overflow-y-auto pr-1 -mr-1 max-h-[calc(100vh-180px)]">
            {activeTab === 'shape' && (
              <div className="p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">生成形状</h3>
                <ShapeControls goToNextTab={goToNextTab} />
              </div>
            )}
            {activeTab === 'puzzle' && (
              <div className="p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">选择切割类型</h3>
                <PuzzleControlsCutType goToNextTab={goToNextTab} />
              </div>
            )}
            {activeTab === 'cut' && (
              <div className="p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">选择切割次数</h3>
                <PuzzleControlsCutCount goToNextTab={goToNextTab} />
              </div>
            )}
            {activeTab === 'scatter' && (
              <div className="p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">散开拼图</h3>
                <PuzzleControlsScatter goToNextTab={goToNextTab} />
              </div>
            )}
            {activeTab === 'controls' && (
              <div className="p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">游戏控制</h3>
                <PuzzleControlsGamepad goToFirstTab={goToFirstTab} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Area (Top for Portrait) */}
      <div className="w-full h-[50vh] order-1 relative bg-white/20 backdrop-blur-sm rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] border-2 border-white/30 flex justify-center items-center overflow-hidden">
        <PuzzleCanvas />
      </div>
      
      {/* Optional: Layout Switch Button - This might be better handled in GameInterface or removed if not essential for this specific layout component 
      <button
        className="fixed bottom-4 right-4 z-50 bg-[#F26419] text-white rounded-full p-3 shadow-lg"
        // onClick={() => { ... }} // This logic would need to be passed up or handled differently
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
          <line x1="4" y1="12" x2="20" y2="12"></line>
        </svg>
      </button>
      */}
    </div>
  );
};

export default PhonePortraitLayout; 