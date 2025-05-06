"use client";

import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import PuzzleControlsCutType from "./PuzzleControlsCutType";
import PuzzleControlsCutCount from "./PuzzleControlsCutCount";
import PuzzleControlsScatter from "./PuzzleControlsScatter";
import ActionButtons from "./ActionButtons";

interface DesktopPuzzleSettingsProps {
  goToNextTab: () => void;
  // goToFirstTab?: () => void; // Not typically needed for desktop puzzle settings directly
}

const DesktopPuzzleSettings: React.FC<DesktopPuzzleSettingsProps> = ({ goToNextTab }) => {
  const { resetGame } = useGame(); 

  const handleDesktopResetGame = () => {
    playButtonClickSound();
    resetGame();
  };

  return (
    <div className="p-3 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] space-y-3">
      <h3 className="text-sm font-medium mb-2 text-[#FFD5AB]">拼图设置</h3>
      <PuzzleControlsCutType goToNextTab={goToNextTab} />
      <PuzzleControlsCutCount goToNextTab={goToNextTab} />
      <PuzzleControlsScatter goToNextTab={goToNextTab} />
      <ActionButtons layout="desktop" />
      <Button
        onClick={handleDesktopResetGame}
        className={`w-full h-12 text-base 
                  bg-[#1E1A2A] text-white border-2 border-[#504C67] rounded-xl shadow-md 
                  hover:bg-[#141022] hover:text-white hover:border-[#706B89] 
                  active:bg-[#2A283E] active:text-white active:border-[#463E50]`}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        重新开始
      </Button>
    </div>
  );
};

export default DesktopPuzzleSettings; 