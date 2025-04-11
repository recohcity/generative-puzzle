"use client"
import { GameProvider } from "@/contexts/GameContext"
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext"
import PuzzleCanvas from "@/components/PuzzleCanvas"
import PuzzleControls from "@/components/PuzzleControls"
import ShapeControls from "@/components/ShapeControls"
import { Button } from "@/components/ui/button"
import { HelpCircle, BarChart } from "lucide-react"
import { useState } from "react"

// 使用说明组件
function Instructions({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#2A2835] rounded-3xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border-4 border-[#3D3852]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#FFB17A]">使用说明</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-[#3D3852] hover:bg-[#504C67] text-[#FFB17A]">
              ✕
            </Button>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-lg text-[#FFB17A]">基本步骤</h3>
              <ol className="list-decimal ml-5 space-y-2 text-[#FFD5AB]">
                <li>选择形状类型（多边形、曲线形状或不规则形状）</li>
                <li>点击"生成形状"按钮创建基础形状</li>
                <li>设置切割次数（1-5次）和切割类型（直线或斜线）</li>
                <li>点击"生成拼图"将形状切割成拼图块</li>
                <li>点击"散开拼图"开始游戏</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-lg text-[#FFB17A]">游戏操作</h3>
              <ul className="list-disc ml-5 space-y-2 text-[#FFD5AB]">
                <li>用鼠标拖动拼图块移动位置</li>
                <li>使用旋转按钮调整拼图块角度</li>
                <li>点击提示按钮可以查看当前选中拼图块的正确位置</li>
                <li>将拼图块放到正确位置和角度时会自动吸附</li>
                <li>所有拼图块都放对位置后游戏完成</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-lg text-[#FFB17A]">提示</h3>
              <ul className="list-disc ml-5 space-y-2 text-[#FFD5AB]">
                <li>切割次数越多，难度越大</li>
                <li>斜线切割比直线切割更具挑战性</li>
                <li>不规则形状通常比规则形状更难完成</li>
                <li>可以随时点击"重置游戏"重新开始</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CurveTestOptimized({ showAnalysis }: { showAnalysis: () => void }) {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <ThemeProvider>
      <GameProvider>
        <div className="min-h-screen bg-gradient-to-b from-[#2A2835] to-[#1F1D2B] p-4 lg:p-6 pt-16">
          {/* 顶部工具栏 */}
          <div className="fixed top-4 right-4 flex items-center gap-2 z-40">
            <Button
              variant="ghost"
              size="icon"
              onClick={showAnalysis}
              className="w-10 h-10 rounded-full bg-[#3D3852] hover:bg-[#504C67] shadow-md"
              title="查看项目分析"
            >
              <BarChart className="h-5 w-5 text-[#FFB17A]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInstructions(true)}
              className="w-10 h-10 rounded-full bg-[#3D3852] hover:bg-[#504C67] shadow-md"
              title="查看使用说明"
            >
              <HelpCircle className="h-5 w-5 text-[#FFB17A]" />
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto h-[calc(100vh-100px)]">
            {/* 左侧控制面板 */}
            <div className="lg:w-[350px] lg:min-w-[350px] h-full">
              <div className="bg-[#36323E] rounded-3xl p-6 shadow-lg border-4 border-[#3D3852] h-full">
                <h1 className="text-2xl font-bold mb-6 text-center text-[#FFB17A]">拼图游戏</h1>
                <div className="space-y-6 h-[calc(100%-60px)] overflow-y-auto">
                  <div className="p-4 bg-[#463E50] rounded-2xl">
                    <h3 className="text-sm font-medium mb-3 text-[#FFD5AB]">形状设置</h3>
                    <ShapeControls />
                  </div>
                  <div className="p-4 bg-[#463E50] rounded-2xl">
                    <h3 className="text-sm font-medium mb-3 text-[#FFD5AB]">拼图设置</h3>
                    <PuzzleControls />
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧画布区域 */}
            <div className="flex-1 h-full">
              <div className="bg-[#36323E] rounded-3xl p-2 shadow-lg border-4 border-[#3D3852] h-full">
                <PuzzleCanvas />
              </div>
            </div>
          </div>

          {/* 使用说明弹窗 */}
          <Instructions isOpen={showInstructions} onClose={() => setShowInstructions(false)} />
        </div>
      </GameProvider>
    </ThemeProvider>
  )
}

