"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { ScatterChart } from "lucide-react"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"

interface PuzzleControlsScatterProps {
  goToNextTab?: () => void;
}

export default function PuzzleControlsScatter({ goToNextTab }: PuzzleControlsScatterProps) {
  const { 
    state,
    scatterPuzzle 
  } = useGame()
  
  // 检查是否已生成拼图
  const isPuzzleGenerated = state.puzzle !== null
  
  // 所有按钮共用的禁用样式类
  const disabledClass = "opacity-30 pointer-events-none";

  const handleScatterPuzzle = () => {
    playButtonClickSound()
    scatterPuzzle()
    
    // 散开拼图后自动跳转到下一个tab
    if (goToNextTab) {
      setTimeout(() => {
        goToNextTab()
      }, 300)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4 text-sm text-[#FFD5AB]">
        {isPuzzleGenerated 
          ? "拼图已准备好，点击下方按钮散开拼图开始游戏" 
          : "请先生成形状并切割形状"
        }
      </div>

      <Button
        onClick={handleScatterPuzzle}
        disabled={!isPuzzleGenerated || state.isScattered}
        className={`w-full bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md ${(!isPuzzleGenerated || state.isScattered) ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
        variant="ghost"
      >
        <ScatterChart className="w-4 h-4 mr-2" />
        {state.isScattered ? "拼图已散开" : "散开拼图"}
      </Button>

      <div className="text-center mt-2 text-xs text-[#FFD5AB]">
        {state.isScattered 
          ? "游戏已开始，拖动拼图碎片到正确位置" 
          : "散开拼图后将无法修改拼图设置"
        }
      </div>
    </div>
  )
} 