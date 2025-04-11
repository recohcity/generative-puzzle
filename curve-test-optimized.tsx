"use client"
import ShapeControls from "@/components/ShapeControls"
import PuzzleControls from "@/components/PuzzleControls"
import PuzzleCanvas from "@/components/PuzzleCanvas"
import { GameProvider } from "@/contexts/GameContext"
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

// 添加主题切换按钮组件
function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      className="absolute top-4 right-4"
      aria-label={isDarkMode ? "切换到亮色模式" : "切换到暗色模式"}
    >
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}

export default function CurveTestOptimized() {
  return (
    <ThemeProvider>
      <GameProvider>
        <div className="flex flex-col items-center p-4 max-w-5xl mx-auto relative">
          <ThemeToggle />

          <h1 className="text-2xl font-bold mb-6">智能拼图游戏</h1>

          <div className="w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden mb-6 transition-colors duration-200">
            <div className="p-4 bg-slate-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 transition-colors duration-200">
              <h2 className="text-lg font-medium">游戏控制</h2>
            </div>
            <div className="p-4">
              <div className="grid md:grid-cols-2 gap-6">
                <ShapeControls />
                <PuzzleControls />
              </div>
            </div>
          </div>

          <PuzzleCanvas />

          <div className="mt-4 text-sm text-slate-500 dark:text-slate-400 transition-colors duration-200">
            提示: 点击拼图片段以选择，然后拖动它们到正确的位置。点击"提示"可以查看当前选中拼图在完成图案中的位置。
          </div>
        </div>
      </GameProvider>
    </ThemeProvider>
  )
}

