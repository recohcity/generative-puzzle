"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { Check, Hexagon, Circle, CloudyIcon as BlobIcon } from "lucide-react"
import { ShapeType } from "@/types/types"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"

export default function ShapeControls() {
  const { state, dispatch, generateShape } = useGame()

  const handleShapeTypeChange = (value: string) => {
    playButtonClickSound()
    dispatch({
      type: "SET_SHAPE_TYPE",
      payload: value as ShapeType.Polygon | ShapeType.Curve | ShapeType.Circle,
    })
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
              ${state.shapeType === ShapeType.Polygon 
                ? "bg-[#F68E5F] text-white border-[#F26419]" 
                : "bg-[#3D3852] text-white border-transparent hover:border-[#504C67]"}
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
              ${state.shapeType === ShapeType.Curve 
                ? "bg-[#F68E5F] text-white border-[#F26419]" 
                : "bg-[#3D3852] text-white border-transparent hover:border-[#504C67]"}
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
              ${state.shapeType === ShapeType.Circle 
                ? "bg-[#F68E5F] text-white border-[#F26419]" 
                : "bg-[#3D3852] text-white border-transparent hover:border-[#504C67]"}
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
        className="w-full bg-[#36B37E] hover:bg-[#00875A] text-white border-2 border-[#00875A] rounded-xl shadow-md font-medium disabled:opacity-30 disabled:hover:bg-[#36B37E]"
        disabled={state.puzzle !== null}
      >
        生成形状
      </Button>
    </div>
  )
}

