"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { Check, Hexagon, Circle, CloudyIcon as BlobIcon } from "lucide-react"
import { ShapeType } from "@/types/types"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"

export default function ShapeControls() {
  const { state, dispatch, generateShape } = useGame()

  // 获取当前活跃的形状类型（无论是实际使用的还是待使用的）
  const activeShapeType = state.pendingShapeType || state.shapeType

  const handleShapeTypeChange = (value: string) => {
    playButtonClickSound()
    
    // 只有在尚未生成形状时才允许更改形状类型直接生效
    // 或者当已经有拼图时禁用形状切换
    if (state.originalShape.length === 0 || state.puzzle !== null) {
    dispatch({
      type: "SET_SHAPE_TYPE",
      payload: value as ShapeType.Polygon | ShapeType.Curve | ShapeType.Circle,
    })
    } else {
      // 如果已经生成了形状但没有拼图，只更改类型但不立即重新生成
      dispatch({
        type: "SET_SHAPE_TYPE_WITHOUT_REGENERATE",
        payload: value as ShapeType.Polygon | ShapeType.Curve | ShapeType.Circle,
      })
    }
  }

  const handleGenerateShape = () => {
    playButtonClickSound()
    generateShape()
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="ghost"
            className={`
              flex flex-col items-center justify-center py-3 h-auto gap-2 rounded-lg border-2 shadow-sm transition-all duration-200
              ${activeShapeType === ShapeType.Polygon 
                ? "bg-[#F68E5F] text-white border-[#F26419] hover:bg-[#F47B42] hover:border-[#E15A0F] active:bg-[#E15A0F]" 
                : "bg-[#3D3852] text-white border-transparent hover:border-[#504C67] hover:bg-[#4D4862] active:bg-[#302B45]"}
              ${state.puzzle ? "opacity-30 cursor-not-allowed" : ""}
            `}
            onClick={() => !state.puzzle && handleShapeTypeChange(ShapeType.Polygon)}
            disabled={state.puzzle !== null}
          >
            <Hexagon
              className="w-6 h-6 text-white"
            />
            <span className="text-xs">多边形</span>
          </Button>

          <Button
            variant="ghost"
            className={`
              flex flex-col items-center justify-center py-3 h-auto gap-2 rounded-lg border-2 shadow-sm transition-all duration-200
              ${activeShapeType === ShapeType.Curve 
                ? "bg-[#F68E5F] text-white border-[#F26419] hover:bg-[#F47B42] hover:border-[#E15A0F] active:bg-[#E15A0F]" 
                : "bg-[#3D3852] text-white border-transparent hover:border-[#504C67] hover:bg-[#4D4862] active:bg-[#302B45]"}
              ${state.puzzle ? "opacity-30 cursor-not-allowed" : ""}
            `}
            onClick={() => !state.puzzle && handleShapeTypeChange(ShapeType.Curve)}
            disabled={state.puzzle !== null}
          >
            <Circle
              className="w-6 h-6 text-white"
            />
            <span className="text-xs">曲凸形状</span>
          </Button>

          <Button
            variant="ghost"
            className={`
              flex flex-col items-center justify-center py-3 h-auto gap-2 rounded-lg border-2 shadow-sm transition-all duration-200
              ${activeShapeType === ShapeType.Circle 
                ? "bg-[#F68E5F] text-white border-[#F26419] hover:bg-[#F47B42] hover:border-[#E15A0F] active:bg-[#E15A0F]" 
                : "bg-[#3D3852] text-white border-transparent hover:border-[#504C67] hover:bg-[#4D4862] active:bg-[#302B45]"}
              ${state.puzzle ? "opacity-30 cursor-not-allowed" : ""}
            `}
            onClick={() => !state.puzzle && handleShapeTypeChange(ShapeType.Circle)}
            disabled={state.puzzle !== null}
          >
            <BlobIcon
              className="w-6 h-6 text-white"
            />
            <span className="text-xs">云朵形状</span>
          </Button>
        </div>
      </div>

      <Button 
        onClick={handleGenerateShape} 
        className="w-full bg-[#36B37E] hover:bg-[#00875A] text-white border-2 border-[#00875A] rounded-xl shadow-md font-medium disabled:opacity-30 disabled:hover:bg-[#36B37E] active:bg-[#00734D]"
        disabled={state.puzzle !== null}
      >
        {state.originalShape.length > 0 ? "重新生成形状" : "生成形状"}
      </Button>
    </div>
  )
}

