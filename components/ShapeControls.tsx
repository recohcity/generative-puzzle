"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { Check, Hexagon, Circle, CloudyIcon as BlobIcon } from "lucide-react"

export default function ShapeControls() {
  const { state, dispatch, generateShape } = useGame()

  const handleShapeTypeChange = (value: string) => {
    dispatch({
      type: "SET_SHAPE_TYPE",
      payload: value as "polygon" | "curve" | "irregular",
    })
  }

  const handleGenerateShape = () => {
    generateShape()
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">形状类型</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={state.shapeType === "polygon" ? "default" : "outline"}
            className="flex flex-col items-center justify-center py-3 h-auto gap-2"
            onClick={() => handleShapeTypeChange("polygon")}
          >
            <Hexagon
              className={`w-6 h-6 ${state.shapeType === "polygon" ? "text-primary-foreground" : "text-muted-foreground"}`}
            />
            <span className="text-xs">多边形</span>
            {state.shapeType === "polygon" && (
              <Check className="w-4 h-4 absolute top-1 right-1 text-primary-foreground" />
            )}
          </Button>

          <Button
            variant={state.shapeType === "curve" ? "default" : "outline"}
            className="flex flex-col items-center justify-center py-3 h-auto gap-2"
            onClick={() => handleShapeTypeChange("curve")}
          >
            <Circle
              className={`w-6 h-6 ${state.shapeType === "curve" ? "text-primary-foreground" : "text-muted-foreground"}`}
            />
            <span className="text-xs">曲线形状</span>
            {state.shapeType === "curve" && (
              <Check className="w-4 h-4 absolute top-1 right-1 text-primary-foreground" />
            )}
          </Button>

          <Button
            variant={state.shapeType === "irregular" ? "default" : "outline"}
            className="flex flex-col items-center justify-center py-3 h-auto gap-2"
            onClick={() => handleShapeTypeChange("irregular")}
          >
            <BlobIcon
              className={`w-6 h-6 ${state.shapeType === "irregular" ? "text-primary-foreground" : "text-muted-foreground"}`}
            />
            <span className="text-xs">不规则形状</span>
            {state.shapeType === "irregular" && (
              <Check className="w-4 h-4 absolute top-1 right-1 text-primary-foreground" />
            )}
          </Button>
        </div>
      </div>

      <Button onClick={handleGenerateShape} className="w-full bg-green-600 hover:bg-green-700 text-white">
        生成形状
      </Button>
    </div>
  )
}

