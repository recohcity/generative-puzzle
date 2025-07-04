"use client"

import { BubbleBackground } from "@/components/animate-ui/backgrounds/bubble"

interface LoadingScreenProps {
  progress: number // 0~100
}

export default function LoadingScreen({ progress }: LoadingScreenProps) {
  const progressBarClass =
    "w-80 h-3 bg-white/20 backdrop-blur-xl rounded-full overflow-hidden shadow-2xl border-2 border-white/30"
  const progressIndicatorClass =
    "h-full bg-gradient-to-r from-[#F68E5F] to-[#F26419] rounded-full transition-all"

  return (
    <BubbleBackground className="fixed inset-0 z-50 flex flex-col items-center justify-center" interactive={false} colors={{
      first: '246,142,95', // #F68E5F
      second: '255,209,171', // #FFD1AB
      third: '54,179,126', // #36B37E
      fourth: '61,56,82', // #3D3852
      fifth: '242,100,25', // #F26419
      sixth: '255,177,122', // #FFB17A
    }}>
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-white font-bold mb-8 animate-pulse md:text-[8rem] text-[6.4rem] sm:text-center text-left w-full px-6">
          Generative<br className="md:hidden" /> Puzzle
        </h1>
        <div className={progressBarClass}>
          <div className={progressIndicatorClass} style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-[#FFD5AB] font-medium text-base">
          {progress >= 100 ? "100% 加载完成！" : `${Math.floor(progress)}% 加载中...`}
        </p>
      </div>
    </BubbleBackground>
  )
} 