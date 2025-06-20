"use client"
import { useGame } from "@/contexts/GameContext"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CutType } from "@/types/puzzleTypes"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"

interface PuzzleControlsCutTypeProps {
  goToNextTab?: () => void;
}

export default function PuzzleControlsCutType({ goToNextTab }: PuzzleControlsCutTypeProps) {
  const { state, dispatch } = useGame()
  // 添加本地状态，初始值为空字符串，表示未选择
  const [localCutType, setLocalCutType] = useState<string>("")
  
  // 同步全局状态到本地状态，但仅当本地状态为空且全局状态有值时才同步
  useEffect(() => {
    if (state.cutType && localCutType === "") {
      setLocalCutType(state.cutType);
    }
  }, [state.cutType, localCutType]);
  
  // 监听游戏重置事件，当原始形状被清空（即游戏重置）时，清除本地选择状态
  useEffect(() => {
    if (state.originalShape.length === 0 && localCutType !== "") {
      console.log("游戏已重置，清除切割类型选择");
      setLocalCutType("");
    }
  }, [state.originalShape.length, localCutType]);
  
  // 检测设备类型
  const [isPhone, setIsPhone] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  
  // 设备检测
  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent;
      const isMobile = /iPhone|Android/i.test(ua);
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPhone(isMobile);
      setIsLandscape(isMobile && !isPortrait);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkDevice, 300);
    });
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);
  
  // 检查是否已生成形状
  const isShapeGenerated = state.originalShape.length > 0
  // 检查是否可以修改拼图设置
  const canModifySettings = isShapeGenerated && !state.isScattered
  // 是否已选择切割类型
  const hasSelectedCutType = localCutType !== ""
  
  // 所有按钮共用的禁用样式类
  const disabledClass = "opacity-30 pointer-events-none";

  const handleCutTypeChange = (value: string) => {
    if (!canModifySettings) return
    playButtonClickSound()
    // 更新本地状态
    setLocalCutType(value)
    // 更新全局状态
    dispatch({
      type: "SET_CUT_TYPE",
      payload: value as CutType.Straight | CutType.Diagonal,
    })
    
    // 自动跳转到下一个Tab
    if (goToNextTab) {
      setTimeout(() => {
        goToNextTab()
      }, 300)
    }
  }

  return (
    <div className="space-y-4">
      {/* 添加切割类型标签 - 仅在非手机设备上显示 */}
      {!isPhone && !isLandscape && (
        <div className="text-xs text-[#FFD5AB] mb-1">
          选择切割类型
          {canModifySettings && !hasSelectedCutType && (
            <span className="text-[#F26419] ml-1">*必选</span>
          )}
        </div>
      )}
      <div>
        <RadioGroup 
          value={localCutType} 
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
              className={`flex items-center justify-center ${isLandscape ? 'p-1 text-[12px]' : isPhone ? 'p-1.5 text-[12px]' : 'p-2'} border-2 rounded-lg transition-all shadow-sm 
                ${localCutType === CutType.Straight 
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
              className={`flex items-center justify-center ${isLandscape ? 'p-1 text-[12px]' : isPhone ? 'p-1.5 text-[12px]' : 'p-2'} border-2 rounded-lg transition-all shadow-sm 
                ${localCutType === CutType.Diagonal 
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
    </div>
  )
} 