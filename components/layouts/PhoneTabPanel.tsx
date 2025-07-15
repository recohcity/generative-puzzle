import React from 'react';
import ShapeControls from "@/components/ShapeControls";
import PuzzleControlsCutType from "@/components/PuzzleControlsCutType";
import PuzzleControlsCutCount from "@/components/PuzzleControlsCutCount";
import PuzzleControlsScatter from "@/components/PuzzleControlsScatter";
import PuzzleControlsGamepad from "@/components/PuzzleControlsGamepad";
import GlobalUtilityButtons from "@/components/GlobalUtilityButtons";
import RestartButton from "@/components/RestartButton";
import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/GameContext";

interface PhoneTabPanelProps {
  activeTab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls';
  onTabChange: (tab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls') => void;
  goToNextTab: () => void;
  goToFirstTab: () => void;
  isMusicPlaying: boolean;
  isFullscreen: boolean;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  style?: React.CSSProperties;
  isLandscape?: boolean; // 新增横竖屏标志
}

const tabLabels: Record<string, string> = {
  shape: '形状',
  puzzle: '类型',
  cut: '次数',
  scatter: '散开',
  controls: '控制',
};

// 主标题样式
const TITLE_CLASS = "font-bold text-[#FFB17A] text-lg md:text-xl leading-tight"; // 主标题字号、颜色、粗细

// 分区标题样式
const SECTION_TITLE_CLASS = "font-semibold text-[#FFD5AB] text-md mb-2 leading-snug "; // 分区标题字号、颜色、粗细、下边距

  // 卡片内小标题样式
  const CARD_TITLE_CLASS = "text-xs font-medium mb-3 text-[#FFD5AB] leading-tight text-center"; // 卡片内小标题字号、颜色、粗细、下边距、居中

// tab按钮样式
const TAB_BUTTON_CLASS = "flex-1 px-0 py-1 text-sm font-medium mx-0 transition-colors text-center"; // flex-1 让按钮均分

// 卡片容器样式
const CARD_CLASS = "p-2 bg-[#463E50] rounded-4xl shadow-md w-full mb-2"; // 卡片padding、背景、圆角、阴影、下边距

// 分区容器样式
const SECTION_CLASS = "mb-1"; // 分区下边距

// 面板根容器样式
const PANEL_CLASS = "bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/30 h-full w-full flex flex-col p-6 gap-4"; // 整体背景、圆角、阴影、边框、内边距、分区间距

// 新增：可调内容区水平padding参数
const CONTENT_HORIZONTAL_PADDING = 0; // 可根据需要调整

// 新增：移动端/桌面端各类按钮高度常量
const TAB_BUTTON_HEIGHT = 36; // tab按钮
const TAB_BUTTON_FONT_SIZE = 12; // tab按钮字体大小
const SHAPE_BUTTON_HEIGHT = 60; // 形状按钮
const MOBILE_SHAPE_BUTTON_FONT_SIZE = 14; // 形状按钮文字字号（移动端）
const CUT_TYPE_BUTTON_HEIGHT = 36; // 直线/斜线按钮
const NUMBER_BUTTON_HEIGHT = 30; // 数字按钮
const ACTION_BUTTON_HEIGHT = 36; // 切割形状、散开拼图
// 新增：独立控制按钮高度
const MOBILE_CONTROL_BUTTON_HEIGHT = 36; // 控制按钮高度（更矮）
const MOBILE_CONTROL_BUTTON_FONT_SIZE = 14; // 控制按钮字号
const MOBILE_RESTART_BUTTON_HEIGHT = 36; // 重新开始按钮高度（更矮）
const MOBILE_RESTART_BUTTON_FONT_SIZE = 14; // 重新开始按钮字号
const MOBILE_RESTART_ICON_SIZE = 18; // 重新开始按钮图标
const DESKTOP_CONTROL_BUTTON_HEIGHT = 36; // 提示/左转/右转（桌面端）
const DESKTOP_RESTART_BUTTON_HEIGHT = 36; // 重新开始（桌面端）

// 移除：移动端按钮统一高度
// const MOBILE_BUTTON_HEIGHT = 40; // px，可根据需求调整

const PhoneTabPanel: React.FC<PhoneTabPanelProps> = ({
  activeTab,
  onTabChange,
  goToNextTab,
  goToFirstTab,
  isMusicPlaying,
  isFullscreen,
  onToggleMusic,
  onToggleFullscreen,
  style,
  isLandscape = false
}) => {
  // 新增：引入游戏核心逻辑
  const { state, rotatePiece, showHintOutline, resetGame } = useGame();

  // 按照 ActionButtons 的禁用逻辑
  const isHintDisabled = !state.isScattered || state.selectedPiece === null || state.completedPieces.includes(state.selectedPiece ?? -1);
  const isRotateDisabled = !state.isScattered || state.selectedPiece === null || state.isCompleted;

  // 按钮点击事件
  const handleShowHint = () => {
    showHintOutline();
  };
  const handleRotateLeft = () => {
    rotatePiece(false);
  };
  const handleRotateRight = () => {
    rotatePiece(true);
  };
  const handleRestart = () => {
    resetGame();
    if (goToFirstTab) goToFirstTab();
  };

  return (
    <div
      className={PANEL_CLASS}
      style={style}
    >
      {/* 顶部标题和全局按钮 */}
      <div className="flex items-center justify-between mb-0">
        <h1 className={TITLE_CLASS}>生成式拼图游戏</h1>
        <GlobalUtilityButtons 
          isMusicPlaying={isMusicPlaying}
          isFullscreen={isFullscreen}
          onToggleMusic={onToggleMusic}
          onToggleFullscreen={onToggleFullscreen}
        />
      </div>
      {/* Tab按钮与内容区间距最小化 */}
      <div className="mb-0" style={{paddingLeft: CONTENT_HORIZONTAL_PADDING, paddingRight: CONTENT_HORIZONTAL_PADDING}}>
        <div
          className="flex w-full bg-[#2A283E] rounded-xl overflow-x-hidden whitespace-nowrap scrollbar-hide"
          style={{
            height: TAB_BUTTON_HEIGHT,
            minHeight: TAB_BUTTON_HEIGHT,
            maxHeight: TAB_BUTTON_HEIGHT,
          }}
        >
          {(['shape', 'puzzle', 'cut', 'scatter', 'controls'] as const).map((tab) => (
            <button
              key={tab}
              className={
                TAB_BUTTON_CLASS +
                (activeTab === tab
                  ? ' bg-[#F68E5F] text-white shadow'
                  : ' text-[#FFD5AB] hover:bg-[#463E50]')
              }
              onClick={() => onTabChange(tab)}
              style={{
                outline: 'none',
                border: 'none',
                height: '100%',
                minHeight: 0,
                maxHeight: '100%',
                borderRadius: 0,
                padding: 0,
                fontSize: TAB_BUTTON_FONT_SIZE,
                fontWeight: 500,
                lineHeight: 1,
                overflow: 'hidden',
              }}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>
      {/* 拼图设置分区内容，应用可调padding */}
      <div style={{paddingLeft: CONTENT_HORIZONTAL_PADDING, paddingRight: CONTENT_HORIZONTAL_PADDING, width: '100%', marginTop: 0}}>
        {(activeTab === 'shape' || activeTab === 'puzzle' || activeTab === 'cut' || activeTab === 'scatter') && (
          <div className={SECTION_CLASS + ' mt-0'}>
            {/* 分区标题已上移，这里不再渲染 */}
            {activeTab === 'shape' && (
              <div>
                <h4 className={CARD_TITLE_CLASS}>选择形状类型</h4>
                <ShapeControls goToNextTab={goToNextTab} buttonHeight={SHAPE_BUTTON_HEIGHT} fontSize={MOBILE_SHAPE_BUTTON_FONT_SIZE} />
              </div>
            )}
            {activeTab === 'puzzle' && (
              <div>
                <h4 className={CARD_TITLE_CLASS}>选择切割类型</h4>
                <PuzzleControlsCutType goToNextTab={goToNextTab} buttonHeight={CUT_TYPE_BUTTON_HEIGHT} />
              </div>
            )}
            {activeTab === 'cut' && (
              <div className="px-3">
                <h4 className={CARD_TITLE_CLASS}>选择切割次数</h4>
                <div className="max-w-[290px] w-full mx-auto">
                  <PuzzleControlsCutCount goToNextTab={goToNextTab} buttonHeight={NUMBER_BUTTON_HEIGHT} actionButtonHeight={ACTION_BUTTON_HEIGHT} />
                </div>
              </div>
            )}
            {activeTab === 'scatter' && (
              <div>
                <h4 className={CARD_TITLE_CLASS}>散开拼图</h4>
                <PuzzleControlsScatter goToNextTab={goToNextTab} buttonHeight={ACTION_BUTTON_HEIGHT} />
              </div>
            )}
          </div>
        )}
        {/* 游戏控制分区 */}
        {activeTab === 'controls' && (
          <div className={SECTION_CLASS + ' mt-0'}>
            <div>
              {/* 控制按钮组（移动端专用，样式与散开拼图一致） */}
              <div className="flex gap-2 mb-2">
                <Button
                  style={{
                    height: MOBILE_CONTROL_BUTTON_HEIGHT,
                    minHeight: 0,
                    fontSize: MOBILE_CONTROL_BUTTON_FONT_SIZE,
                    borderRadius: 14,
                    padding: 0,
                    lineHeight: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    flex: 1, // 保证等宽并排
                  }}
                  className={
                    `bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md min-h-0 p-0 leading-none w-full` +
                    ` disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-[#F68E5F]`
                  }
                  variant="ghost"
                  onClick={handleShowHint}
                  disabled={isHintDisabled}
                >
                  <span style={{lineHeight: 1}}>提示</span>
                </Button>
                <Button
                  style={{
                    height: MOBILE_CONTROL_BUTTON_HEIGHT,
                    minHeight: 0,
                    fontSize: MOBILE_CONTROL_BUTTON_FONT_SIZE,
                    borderRadius: 14,
                    padding: 0,
                    lineHeight: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    flex: 1,
                  }}
                  className={
                    `bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md min-h-0 p-0 leading-none w-full` +
                    ` disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-[#F68E5F]`
                  }
                  variant="ghost"
                  onClick={handleRotateLeft}
                  disabled={isRotateDisabled}
                >
                  <span style={{lineHeight: 1}}>左转</span>
                </Button>
                <Button
                  style={{
                    height: MOBILE_CONTROL_BUTTON_HEIGHT,
                    minHeight: 0,
                    fontSize: MOBILE_CONTROL_BUTTON_FONT_SIZE,
                    borderRadius: 14,
                    padding: 0,
                    lineHeight: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    flex: 1,
                  }}
                  className={
                    `bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md min-h-0 p-0 leading-none w-full` +
                    ` disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-[#F68E5F]`
                  }
                  variant="ghost"
                  onClick={handleRotateRight}
                  disabled={isRotateDisabled}
                >
                  <span style={{lineHeight: 1}}>右转</span>
                </Button>
              </div>
              
              {/* 拼图角度提示信息 */}
              {state.selectedPiece !== null && state.puzzle && (
                <div style={{ textAlign: 'center', fontSize: '14px', marginTop: '10px', color: '#FFD5AB', fontWeight: 500 }}>
                  <div>
                    当前角度: {Math.round(state.puzzle[state.selectedPiece].rotation)}°
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '2px', marginBottom: '10px', color: '#FFD5AB', fontWeight: 500 }}>
                    可以使用2只手指旋转拼图
                  </div>
                </div>
              )}
             
              {/* 重新开始按钮（移动端专用） */}
              <RestartButton
                onClick={handleRestart}
                height={MOBILE_RESTART_BUTTON_HEIGHT}
                fontSize={MOBILE_RESTART_BUTTON_FONT_SIZE}
                iconSize={MOBILE_RESTART_ICON_SIZE}
                style={{ width: '100%', minHeight: 0, paddingTop: 0, paddingBottom: 0, lineHeight: 1 }}
                className="min-h-0 p-0 leading-none"
              />

            </div>
          </div>
        )}
        {/* 统一传递给 RestartButton，onClick 用 goToFirstTab 或 goToNextTab 或 () => {} 占位 */}
        {/* <RestartButton onClick={goToFirstTab} height={MOBILE_BUTTON_HEIGHT} /> */}
      </div>
    </div>
  );
};

export default PhoneTabPanel; 