export default function LoadingScreenStatic() {
  // 静态加载页面，没有动态逻辑
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#2A2835] to-[#1F1D2B] overflow-hidden">
      {/* 静态装饰元素 - 保持与动态版本相同位置 */}
      <div className="absolute opacity-10 bg-[#F68E5F] float-1" 
        style={{
          top: "20%",
          left: "15%",
          width: "50px",
          height: "50px",
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          transform: 'rotate(45deg)',
        }}
      />
      <div className="absolute opacity-10 bg-[#F68E5F] float-2" 
        style={{
          top: "60%",
          left: "80%",
          width: "70px",
          height: "70px",
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          transform: 'rotate(120deg)',
        }}
      />
      <div className="absolute opacity-10 bg-[#F68E5F] float-3" 
        style={{
          top: "80%",
          left: "30%",
          width: "60px",
          height: "60px",
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          transform: 'rotate(200deg)',
        }}
      />
      <div className="absolute opacity-10 bg-[#F68E5F] float-4" 
        style={{
          top: "30%",
          left: "70%",
          width: "55px",
          height: "55px",
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          transform: 'rotate(300deg)',
        }}
      />
      <div className="absolute opacity-10 bg-[#F68E5F] float-2" 
        style={{
          top: "50%",
          left: "20%",
          width: "65px",
          height: "65px",
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          transform: 'rotate(150deg)',
        }}
      />
      <div className="absolute opacity-10 bg-[#F68E5F] float-3" 
        style={{
          top: "15%",
          left: "40%",
          width: "45px",
          height: "45px",
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          transform: 'rotate(225deg)',
        }}
      />
      
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F68E5F] to-[#F26419] mb-8 animate-pulse">
          Generative Puzzle
        </h1>
        
        <div className="w-80 h-3 bg-[#3D3852] rounded-full overflow-hidden border-2 border-[#504C67]">
          <div 
            className="h-full bg-gradient-to-r from-[#F68E5F] to-[#F26419] transition-all duration-300 ease-out animate-loading-pulse"
            style={{ width: "15%" }}
          />
        </div>
        
        <p className="mt-3 text-[#FFD5AB] font-medium">
          15% 加载中...
        </p>
      </div>
    </div>
  )
} 