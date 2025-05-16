"use client";

import React from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import ShapeControls from "@/components/ShapeControls";
import PuzzleControlsCutType from "@/components/PuzzleControlsCutType";
import PuzzleControlsCutCount from "@/components/PuzzleControlsCutCount";
import PuzzleControlsScatter from "@/components/PuzzleControlsScatter";
import PuzzleControlsGamepad from "@/components/PuzzleControlsGamepad";
import GlobalUtilityButtons from "@/components/GlobalUtilityButtons";

interface PhoneLandscapeLayoutProps {
  isMusicPlaying: boolean;
  isFullscreen: boolean;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  activeTab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls';
  onTabChange: (tab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls') => void;
  goToNextTab: () => void;
  goToFirstTab: () => void;
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
}) => {
  return (
    <div className="max-w-[1400px] w-full h-[calc(100vh-32px)] mx-auto relative flex flex-row gap-2 justify-center items-center p-1">
      {/* Left Control Panel */}
      <div className="w-[300px] min-w-[300px] h-full flex-shrink-0">
        <div className="bg-[#36323E] rounded-3xl border-2 border-[#463E50] h-full flex flex-col shadow-[0_10px_25px_rgba(0,0,0,0.3)] overflow-hidden p-2">
          <div className="flex flex-col mb-1 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-bold text-[#FFB17A]">生成式拼图游戏</h1>
              <GlobalUtilityButtons 
                isMusicPlaying={isMusicPlaying}
                isFullscreen={isFullscreen}
                onToggleMusic={onToggleMusic}
                onToggleFullscreen={onToggleFullscreen}
                buttonSize="small"
              />
            </div>
          </div>
          {/* Tabs */}
          <div className="flex flex-row justify-between bg-[#2A283E] rounded-xl mb-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
            {(['shape', 'puzzle', 'cut', 'scatter', 'controls'] as const).map((tab) => (
              <button
                key={tab}
                className={`py-1 px-1.5 text-[12px] flex-1 font-medium transition-colors
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
          <div className="space-y-1 flex-1 overflow-y-auto pr-1 -mr-1 max-h-[calc(100vh-60px)]">
            {activeTab === 'shape' && (
              <div className="p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] p-2">
                <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">选择形状类型</h3>
                <ShapeControls goToNextTab={goToNextTab} />
              </div>
            )}
            {activeTab === 'puzzle' && (
              <div className="p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] p-2">
                <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">选择切割类型</h3>
                <PuzzleControlsCutType goToNextTab={goToNextTab} />
              </div>
            )}
            {activeTab === 'cut' && (
              <div className="p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] p-2">
                <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">选择切割次数</h3>
                <PuzzleControlsCutCount goToNextTab={goToNextTab} />
              </div>
            )}
            {activeTab === 'scatter' && (
              <div className="p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] p-2">
                <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">散开拼图</h3>
                <PuzzleControlsScatter goToNextTab={goToNextTab} />
              </div>
            )}
            {activeTab === 'controls' && (
              <div className="p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] p-2">
                <h3 className="text-xs font-medium mb-1 text-[#FFD5AB]">游戏控制</h3>
                <PuzzleControlsGamepad goToFirstTab={goToFirstTab} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Game Area */}
      <div className="flex-1 h-full relative bg-white/20 backdrop-blur-sm rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] border-2 border-white/30 flex justify-center items-center overflow-hidden">
        <PuzzleCanvas />
      </div>
    </div>
  );
};

export default PhoneLandscapeLayout; 