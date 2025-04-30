"use client"
import { GameProvider } from "@/contexts/GameContext"
// Removed custom ThemeProvider/useTheme import
// import { ThemeProvider, useTheme } from "@/contexts/ThemeContext"
import PuzzleCanvas from "@/components/PuzzleCanvas"
import PuzzleControls from "@/components/PuzzleControls"
import ShapeControls from "@/components/ShapeControls"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"
import { useState, useEffect } from "react"
import { 
  initBackgroundMusic, 
  toggleBackgroundMusic, 
  getBackgroundMusicStatus, 
  playButtonClickSound 
} from "@/utils/rendering/soundEffects"

export default function CurveTestOptimized() {
  // 添加背景音乐状态
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  // 初始化背景音乐
  useEffect(() => {
    // 只在客户端运行
    if (typeof window !== 'undefined') {
      initBackgroundMusic();
      // 获取初始状态
      setIsMusicPlaying(getBackgroundMusicStatus());
    }
  }, []);

  // 处理音乐切换
  const handleToggleMusic = () => {
    playButtonClickSound();
    const newStatus = toggleBackgroundMusic();
    setIsMusicPlaying(newStatus);
  };

  return (
    // Removed custom ThemeProvider wrapper
    <GameProvider>
      <div 
        className="min-h-screen w-full p-4 lg:p-6 flex items-center justify-center"
        style={{
          backgroundImage: "url('/bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* 外层容器添加最大宽度和高度限制，保持横屏比例 */}
        <div className="flex flex-col lg:flex-row gap-6 max-w-[1400px] w-full max-h-[800px] h-[calc(100vh-80px)] mx-auto lg:justify-center relative">
          {/* 左侧控制面板 - 固定宽度不变 */}
          <div className="lg:w-[350px] lg:min-w-[350px] h-full flex-shrink-0">
            {/* Consistent style: bg, rounded, border, padding */}
            <div className="bg-[#36323E] rounded-3xl border-2 border-[#463E50] p-6 h-full flex flex-col shadow-[0_10px_25px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h1 className="text-xl font-bold text-[#FFB17A]">生成式拼图游戏</h1>
                
                {/* 音乐控制按钮 */}
                <Button
                  onClick={handleToggleMusic}
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-8 h-8 text-[#FFB17A] hover:text-[#F26419] hover:bg-[#463E50] transition-colors"
                  aria-label={isMusicPlaying ? "关闭背景音乐" : "开启背景音乐"}
                  title={isMusicPlaying ? "关闭背景音乐" : "开启背景音乐"}
                >
                  {isMusicPlaying ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </Button>
              </div>
              
              {/* Added overflow-y-auto to this div to allow scrolling within the background */}
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 -mr-2"> 
                <div className="p-3 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                  <h3 className="text-sm font-medium mb-2 text-[#FFD5AB]">选择形状</h3>
                  <ShapeControls />
                </div>
                <div className="p-3 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                  <h3 className="text-sm font-medium mb-2 text-[#FFD5AB]">拼图设置</h3>
                  <PuzzleControls />
                </div>
              </div>
            </div>
          </div>

          {/* 右侧画布区域 - 添加固定宽高比容器 */}
          <div className="flex-1 flex flex-col h-full">
            {/* 画布容器 - 修改为半透明背景以显示背景图 */}
            <div className="w-full h-full relative bg-white/20 backdrop-blur-sm rounded-3xl border-2 border-white/30 shadow-[0_10px_25px_rgba(255,255,255,0.2)] overflow-hidden">
              <PuzzleCanvas />
            </div>
          </div>
        </div>
      </div>
    </GameProvider>
  )
}

