"use client";

import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import PuzzleControlsCutType from "./PuzzleControlsCutType";
import PuzzleControlsCutCount from "./PuzzleControlsCutCount";
import PuzzleControlsScatter from "./PuzzleControlsScatter";
import ActionButtons from "./ActionButtons";
import LeaderboardButton from "./LeaderboardButton";
import LeaderboardPanel from "./LeaderboardPanel";
import GameRecordDetails from "./GameRecordDetails";
import RecentGameDetails from "./RecentGameDetails";
import { useTranslation } from '@/contexts/I18nContext';
import { usePanelState } from '@/hooks/usePanelState';

interface DesktopPuzzleSettingsProps {
  goToNextTab: () => void;
  // goToFirstTab?: () => void; // Not typically needed for desktop puzzle settings directly
}

const DesktopPuzzleSettings: React.FC<DesktopPuzzleSettingsProps> = ({ goToNextTab }) => {
  const { resetGame } = useGame();
  const { t } = useTranslation();
  const { panelState, showGamePanel, showLeaderboard, showRecordDetails, showRecentGameDetails } = usePanelState();

  const handleDesktopResetGame = () => {
    playButtonClickSound();
    resetGame();
  };

  // 游戏控制面板
  const GameControlPanel = () => (
    <div className="p-3 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] space-y-3">
      {/* 榜单按钮 */}
      <LeaderboardButton onClick={showLeaderboard} />

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
        {t('game.controls.restart')}
      </Button>
    </div>
  );

  // 根据当前面板状态渲染不同内容
  console.log('[DesktopPuzzleSettings] 当前面板状态:', panelState.currentView);
  switch (panelState.currentView) {
    case 'leaderboard':
      return (
        <LeaderboardPanel
          key={`desktop-old-leaderboard-${t('game.leaderboard.title')}`}
          onBack={showGamePanel}
          onViewDetails={showRecordDetails}
          onViewRecentGame={showRecentGameDetails}
        />
      );
    case 'details':
      return panelState.selectedRecord ? (
        <GameRecordDetails
          record={panelState.selectedRecord}
          onBack={showLeaderboard}
        />
      ) : (
        <GameControlPanel />
      );
    case 'recent-game':
      return panelState.selectedRecord ? (
        <RecentGameDetails
          record={panelState.selectedRecord}
          onBack={showLeaderboard}
        />
      ) : (
        <GameControlPanel />
      );
    default:
      return <GameControlPanel />;
  }
};

export default DesktopPuzzleSettings; 