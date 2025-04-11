"use client"
import { useGame } from "@/contexts/GameContext"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PuzzleIcon, ScatterChart, Lightbulb, RotateCcw, RotateCw, RefreshCw } from "lucide-react"

// 修改PuzzleControls组件，添加canvasRef引用
export default function PuzzleControls() {
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
  const handleCutCountChange = (value: number[]) => {
    dispatch({ type: "SET_CUT_COUNT", payload: value[0] })
  }

  const handleCutTypeChange = (value: string) => {
    dispatch({
      type: "SET_CUT_TYPE",
      payload: value as "straight" | "diagonal",
    })
  }

  const handleResetGame = () => {
    resetGame()

    // 清除画布
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
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="cutCount" className="text-sm font-medium">
            切割次数: {state.cutCount}
          </Label>
        </div>

        <Slider
          id="cutCount"
          min={1}
          max={5}
          step={1}
          value={[state.cutCount]}
          onValueChange={handleCutCountChange}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">切割类型</Label>
        <RadioGroup value={state.cutType} onValueChange={handleCutTypeChange} className="flex gap-4 mt-1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="straight" id="straight" />
            <Label htmlFor="straight" className="cursor-pointer">
              直线切割
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="diagonal" id="diagonal" />
            <Label htmlFor="diagonal" className="cursor-pointer">
              斜线切割
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={generatePuzzle} disabled={!state.originalShape} className="w-full">
          <PuzzleIcon className="w-4 h-4 mr-2" />
          生成拼图
        </Button>

        <Button
          onClick={scatterPuzzle}
          disabled={!state.puzzle || state.isScattered}
          variant="secondary"
          className="w-full"
        >
          <ScatterChart className="w-4 h-4 mr-2" />
          {state.isScattered ? "拼图已散开" : "散开拼图"}
        </Button>

        <Button onClick={handleResetGame} variant="outline" className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          重置游戏
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={showHintOutline}
            disabled={
              !state.isScattered ||
              state.selectedPiece === null ||
              state.completedPieces.includes(state.selectedPiece || -1)
            }
            variant="outline"
            className="w-full"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            提示
          </Button>

          <Button
            onClick={() => rotatePiece(false)}
            disabled={state.selectedPiece === null}
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => rotatePiece(true)}
            disabled={state.selectedPiece === null}
            variant="outline"
            className="w-full"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
        
        {state.selectedPiece !== null && state.puzzle && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
            当前角度: {Math.round(state.puzzle[state.selectedPiece].rotation)}°
            <div className="text-xs mt-1">
              (旋转角度需与目标角度匹配才能放置)
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

