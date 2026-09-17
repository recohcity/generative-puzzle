"use client";

import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';

interface LeaderboardButtonProps {
  onClick: () => void;
  className?: string;
}

const LeaderboardButton: React.FC<LeaderboardButtonProps> = ({ onClick, className = "" }) => {
  const { t } = useTranslation();

  const handleClick = () => {
    playButtonClickSound();
    onClick();
  };

  return (
    <Button
      onClick={handleClick}
      className={`w-full h-12 text-base 
                bg-[#F68E5F] text-white border-2 border-[#F47B42] rounded-xl shadow-md 
                hover:bg-[#F47B42] hover:text-white hover:border-[#E15A0F] 
                active:bg-[#E15A0F] active:text-white active:border-[#D14A00] ${className}`}
    >
      <Trophy className="w-4 h-4 mr-2" />
      {t('leaderboard.button')}
    </Button>
  );
};

export default LeaderboardButton;