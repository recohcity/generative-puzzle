"use client"
import { useGame } from "@/contexts/GameContext"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PuzzleIcon, ScatterChart, Lightbulb, RotateCcw, RotateCw, RefreshCw, Check } from "lucide-react"
import { CutType } from "@/types/types"
import { playButtonClickSound, playRotateSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"

interface PuzzleControlsProps {
  goToNextTab?: () => void;
  goToFirstTab?: () => void;
}

// 修改PuzzleControls组件，添加canvasRef引用
export default function PuzzleControls({ goToNextTab, goToFirstTab }: PuzzleControlsProps) {
  const {
    state,
    dispatch,
    generatePuzzle,
    scatterPuzzle,
    rotatePiece,
    showHintOutline,
    resetGame,
    canvasRef,
    backgroundCanvasRef,
  } = useGame()
  
  // 检查是否已生成形状
  const isShapeGenerated = state.originalShape.length > 0
  // 检查是否可以修改拼图设置
  const canModifySettings = isShapeGenerated && !state.isScattered

  const handleCutCountChange = (value: number[]) => {
    if (!canModifySettings) return
    playButtonClickSound()
    dispatch({ type: "SET_CUT_COUNT", payload: value[0] })
  }

  const handleCutTypeChange = (value: string) => {
    if (!canModifySettings) return
    playButtonClickSound()
    dispatch({
      type: "SET_CUT_TYPE",
      payload: value as CutType.Straight | CutType.Diagonal,
    })
  }

  const handleResetGame = () => {
    playButtonClickSound()
    resetGame()
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
    if (backgroundCanvasRef.current) {
      const bgCtx = backgroundCanvasRef.current.getContext("2d")
      if (bgCtx) {
        bgCtx.clearRect(0, 0, backgroundCanvasRef.current.width, backgroundCanvasRef.current.height)
      }
    }
    
    // 重置游戏后自动跳转到第一个Tab
    if (goToFirstTab) {
      setTimeout(() => {
        goToFirstTab()
      }, 300)
    }
  }

  // 所有按钮共用的禁用样式类
  const disabledClass = "opacity-30 pointer-events-none";

  // 添加声音效果的包装函数
  const handleGeneratePuzzle = () => {
    playButtonClickSound()
    generatePuzzle()
    
    // 生成拼图后自动跳转到下一个Tab
    if (goToNextTab) {
      setTimeout(() => {
        goToNextTab()
      }, 300)
    }
  }

  const handleScatterPuzzle = () => {
    playButtonClickSound()
    scatterPuzzle()
    
    // 散开拼图后自动跳转到下一个Tab
    if (goToNextTab) {
      setTimeout(() => {
        goToNextTab()
      }, 300)
    }
  }

  const handleShowHint = () => {
    playButtonClickSound()
    showHintOutline()
  }

  const handleRotatePiece = (clockwise: boolean) => {
    playRotateSound()
    rotatePiece(clockwise)
  }

  return (
    <div className="space-y-6 relative">
      {/* 切割设置 */}
      <div className="space-y-4">
        {/* 1. 先显示切割类型 */}
        <div>
          <Label className="text-sm font-medium block mb-3 text-[#FFD5AB]">选择切割类型</Label>
          <RadioGroup 
            value={state.cutType} 
            onValueChange={canModifySettings ? handleCutTypeChange : undefined} 
            className="grid grid-cols-2 gap-2"
            disabled={!canModifySettings}
          >
            <div className="relative">
              <RadioGroupItem
                value={CutType.Straight}
                id="straight"
                className="peer sr-only"
                disabled={!canModifySettings}
              />
              <Label
                htmlFor="straight"
                className={`flex items-center justify-center p-2 border-2 rounded-lg transition-all shadow-sm 
                  ${state.cutType === CutType.Straight 
                  ? "bg-[#F68E5F] text-white border-[#F26419] hover:bg-[#F47B42] hover:border-[#E15A0F] active:bg-[#E15A0F]" 
                  : "bg-[#3D3852] text-white border-transparent hover:border-[#504C67] hover:bg-[#4D4862] active:bg-[#302B45]"}
                  ${!canModifySettings ? disabledClass : "cursor-pointer"}
                `}
              >
                直线
              </Label>
            </div>
            <div className="relative">
              <RadioGroupItem
                value={CutType.Diagonal}
                id="diagonal"
                className="peer sr-only"
                disabled={!canModifySettings}
              />
              <Label
                htmlFor="diagonal"
                className={`flex items-center justify-center p-2 border-2 rounded-lg transition-all shadow-sm 
                  ${state.cutType === CutType.Diagonal 
                  ? "bg-[#F68E5F] text-white border-[#F26419] hover:bg-[#F47B42] hover:border-[#E15A0F] active:bg-[#E15A0F]" 
                  : "bg-[#3D3852] text-white border-transparent hover:border-[#504C67] hover:bg-[#4D4862] active:bg-[#302B45]"}
                  ${!canModifySettings ? disabledClass : "cursor-pointer"}
                `}
              >
                斜线
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* 2. 然后显示切割次数 */}
        <div>
          <Label htmlFor="cutCount" className="text-sm font-medium mb-3 block text-[#FFD5AB]">
            选择切割次数
          </Label>
          <div className="flex justify-between w-full gap-2 mb-1">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => canModifySettings && handleCutCountChange([num])}
                className={`
                  flex-1 aspect-square rounded-lg flex items-center justify-center text-lg transition-all duration-200 border-2 shadow-sm
                  ${state.cutCount === num 
                    ? "bg-[#F68E5F] text-white border-[#F26419] hover:bg-[#F47B42] hover:border-[#E15A0F] active:bg-[#E15A0F]" 
                    : "bg-[#3D3852] text-white border-transparent hover:border-[#504C67] hover:bg-[#4D4862] active:bg-[#302B45]"}
                  ${!canModifySettings ? disabledClass : ""}
                `}
                aria-label={`选择切割${num}次`}
                disabled={!canModifySettings}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-[#F26419] px-1 mt-1">
            <span>简单</span>
            <span>困难</span>
          </div>
        </div>
      </div>

      {/* 游戏控制按钮 */}
      <div className="space-y-3">
        {/* 3. 最后显示切割形状按钮 */}
        <Button 
          onClick={handleGeneratePuzzle} 
          disabled={!isShapeGenerated || state.isScattered} 
          className={`w-full bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md ${(!isShapeGenerated || state.isScattered) ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
        >
          <PuzzleIcon className="w-4 h-4 mr-2" />
          切割形状
        </Button>

        <Button
          onClick={handleScatterPuzzle}
          disabled={!state.puzzle || state.isScattered}
          className={`w-full bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md ${(!state.puzzle || state.isScattered) ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
          variant="ghost"
        >
          <ScatterChart className="w-4 h-4 mr-2" />
          {state.isScattered ? "拼图已散开" : "散开拼图"}
        </Button>

        <Button 
          onClick={handleResetGame} 
          variant="outline" 
          className="w-full bg-[#1E1A2A] hover:bg-[#141022] text-white border-2 border-[#504C67] hover:border-[#706B89] active:bg-[#0F0B19] rounded-xl shadow-md"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          重新开始
        </Button>
      </div>

      {/* 操作控制按钮 */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={handleShowHint}
            disabled={
              !state.isScattered ||
              state.selectedPiece === null ||
              state.completedPieces.includes(state.selectedPiece || -1)
            }
            className={`w-full h-10 px-0 bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md 
              ${!state.isScattered || state.selectedPiece === null || 
                state.completedPieces.includes(state.selectedPiece || -1) 
                ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
            title="显示提示"
            variant="ghost"
          >
            <Lightbulb className="w-4 h-4 text-white" />
          </Button>

          <Button
            onClick={() => handleRotatePiece(false)}
            disabled={!state.isScattered || state.selectedPiece === null}
            className={`w-full h-10 px-0 bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md 
              ${!state.isScattered || state.selectedPiece === null ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
            title="逆时针旋转"
            variant="ghost"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </Button>

          <Button
            onClick={() => handleRotatePiece(true)}
            disabled={!state.isScattered || state.selectedPiece === null}
            className={`w-full h-10 px-0 bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md 
              ${!state.isScattered || state.selectedPiece === null ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
            title="顺时针旋转"
            variant="ghost"
          >
            <RotateCw className="w-4 h-4 text-white" />
          </Button>
        </div>
        
        {state.selectedPiece !== null && state.puzzle && (
          <div className="text-center text-sm">
            <div className="text-[#FFD5AB] font-medium">
              当前角度: {Math.round(state.puzzle[state.selectedPiece].rotation)}°
            </div>
            <div className="text-xs text-[#F68E5F] mt-1 font-medium">
              (旋转角度需与目标角度匹配才能放置)
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

