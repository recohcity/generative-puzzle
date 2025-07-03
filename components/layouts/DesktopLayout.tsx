"use client";

import React from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import ShapeControls from "@/components/ShapeControls";
import GlobalUtilityButtons from "@/components/GlobalUtilityButtons";
import PuzzleControlsCutType from "@/components/PuzzleControlsCutType";
import PuzzleControlsCutCount from "@/components/PuzzleControlsCutCount";
import PuzzleControlsScatter from "@/components/PuzzleControlsScatter";
import ActionButtons from "@/components/ActionButtons";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";

interface DesktopLayoutProps {
  isMusicPlaying: boolean;
  isFullscreen: boolean;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  goToNextTab: () => void; // For ShapeControls and DesktopPuzzleSettings
  // deviceType: string; // Potentially needed for minor variations if tablet also uses this
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  isMusicPlaying,
  isFullscreen,
  onToggleMusic,
  onToggleFullscreen,
  goToNextTab,
  // deviceType
}) => {
  // const titleSizeClass = deviceType === 'tablet' ? 'text-lg' : 'text-xl'; // Example if tablet uses this with variation
  const titleSizeClass = 'text-xl'; // Assuming desktop for now
  
  // 从GameContext获取state和resetGame函数
  const { state, resetGame } = useGame();
  
  // 计算拼图完成进度
  const totalPieces = (state.puzzle ?? []).length;
  const completedPiecesCount = (state.completedPieces ?? []).length;
  const puzzleProgressText = totalPieces > 0 ? `${completedPiecesCount} / ${totalPieces} 块拼图已完成` : '';
  
  // 处理重新开始按钮点击
  const handleDesktopResetGame = () => {
    playButtonClickSound();
    resetGame();
  };

  return (
    <div className="max-w-[1400px] w-full h-[calc(100vh-32px)] mx-auto relative flex flex-row gap-6 justify-center items-center">
      {/* Left Control Panel */}
      <div className="w-[350px] min-w-[350px] h-full flex-shrink-0">
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl border-2 border-white/30 h-full flex flex-col shadow-[0_10px_25px_rgba(0,0,0,0.3)] overflow-hidden p-4 lg:p-6">
          <div className="flex flex-col mb-1 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h1 className={`${titleSizeClass} font-bold text-[#FFB17A]`}>生成式拼图游戏</h1>
              <GlobalUtilityButtons 
                isMusicPlaying={isMusicPlaying}
                isFullscreen={isFullscreen}
                onToggleMusic={onToggleMusic}
                onToggleFullscreen={onToggleFullscreen}
              />
            </div>
            <h3 className="text-sm font-medium mt-4 mb-1 text-[#FFD5AB]">拼图设置</h3>
          </div>
          <div className="space-y-4 flex-1 pr-1 -mr-1">
            <ShapeControls goToNextTab={goToNextTab} /> 
            <PuzzleControlsCutType goToNextTab={goToNextTab} />
            <PuzzleControlsCutCount goToNextTab={goToNextTab} />
            <PuzzleControlsScatter goToNextTab={goToNextTab} />
            <h3 className="text-sm font-medium mt-4 mb-1 text-[#FFD5AB]">游戏控制</h3>
            <ActionButtons layout="desktop" />
            <Button
              onClick={handleDesktopResetGame}
              className={`w-full h-12 text-base bg-[#1E1A2A] text-white rounded-xl shadow-md hover:bg-[#141022] hover:text-white hover:border-[#706B89] active:bg-[#2A283E] active:text-white active:border-[#463E50]`}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重新开始
            </Button>
          </div>
        </div>
      </div>

      {/* Right Game Area */}
      <div className="flex-1 h-full relative bg-white/20 backdrop-blur-sm rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] border-2 border-white/30 flex flex-col justify-center items-center overflow-hidden">
        {/* Puzzle Count Display */}
        {totalPieces > 0 && (
          <div className="absolute top-4 text-white text-lg font-bold bg-black/30 px-4 py-2 rounded-full z-10">
            {puzzleProgressText}
          </div>
        )}
        <PuzzleCanvas />
      </div>
    </div>
  );
};

export default DesktopLayout; 