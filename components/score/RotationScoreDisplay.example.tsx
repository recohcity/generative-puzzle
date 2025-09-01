import React, { useState } from 'react';
import { RotationScoreDisplay, SimpleRotationScoreDisplay, RotationScoreCard, DisplayMode } from './RotationScoreDisplay';
import { I18nProvider } from '@/contexts/I18nContext';

/**
 * 旋转评分显示组件使用示例
 * 展示不同显示模式和使用场景
 */
export const RotationScoreDisplayExample: React.FC = () => {
  const [actualRotations, setActualRotations] = useState(15);
  const [minRotations, setMinRotations] = useState(10);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('desktop');

  return (
    <I18nProvider>
      <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            旋转评分显示组件示例
          </h1>

          {/* 控制面板 */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-4">控制面板</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  实际旋转次数: {actualRotations}
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={actualRotations}
                  onChange={(e) => setActualRotations(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最小旋转次数: {minRotations}
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={minRotations}
                  onChange={(e) => setMinRotations(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  显示模式
                </label>
                <select
                  value={displayMode}
                  onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="desktop">桌面端</option>
                  <option value="mobile">移动端</option>
                  <option value="compact">紧凑</option>
                </select>
              </div>
            </div>
          </div>

          {/* 主要组件展示 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">主要组件 - {displayMode}模式</h2>
              <RotationScoreDisplay
                actualRotations={actualRotations}
                minRotations={minRotations}
                displayMode={displayMode}
              />
            </div>

            {/* 所有显示模式对比 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">显示模式对比</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">桌面端模式</h3>
                  <RotationScoreDisplay
                    actualRotations={actualRotations}
                    minRotations={minRotations}
                    displayMode="desktop"
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">移动端模式</h3>
                  <RotationScoreDisplay
                    actualRotations={actualRotations}
                    minRotations={minRotations}
                    displayMode="mobile"
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">紧凑模式</h3>
                  <RotationScoreDisplay
                    actualRotations={actualRotations}
                    minRotations={minRotations}
                    displayMode="compact"
                  />
                </div>
              </div>
            </div>

            {/* 简化组件 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">简化组件</h2>
              <SimpleRotationScoreDisplay
                actualRotations={actualRotations}
                minRotations={minRotations}
              />
            </div>

            {/* 卡片组件 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">卡片组件</h2>
              <div className="max-w-sm">
                <RotationScoreCard
                  actualRotations={actualRotations}
                  minRotations={minRotations}
                />
              </div>
            </div>

            {/* 不同场景示例 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">不同场景示例</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 完美旋转 */}
                <div className="space-y-2">
                  <h3 className="font-medium text-green-700">完美旋转</h3>
                  <RotationScoreDisplay
                    actualRotations={10}
                    minRotations={10}
                    displayMode="desktop"
                  />
                </div>

                {/* 轻微超出 */}
                <div className="space-y-2">
                  <h3 className="font-medium text-orange-700">轻微超出</h3>
                  <RotationScoreDisplay
                    actualRotations={12}
                    minRotations={10}
                    displayMode="desktop"
                  />
                </div>

                {/* 严重超出 */}
                <div className="space-y-2">
                  <h3 className="font-medium text-red-700">严重超出</h3>
                  <RotationScoreDisplay
                    actualRotations={20}
                    minRotations={10}
                    displayMode="desktop"
                  />
                </div>

                {/* 零旋转完美 */}
                <div className="space-y-2">
                  <h3 className="font-medium text-blue-700">零旋转完美</h3>
                  <RotationScoreDisplay
                    actualRotations={0}
                    minRotations={0}
                    displayMode="desktop"
                  />
                </div>

                {/* 不需要旋转但旋转了 */}
                <div className="space-y-2">
                  <h3 className="font-medium text-purple-700">不必要旋转</h3>
                  <RotationScoreDisplay
                    actualRotations={5}
                    minRotations={0}
                    displayMode="desktop"
                  />
                </div>

                {/* 大数值 */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700">大数值</h3>
                  <RotationScoreDisplay
                    actualRotations={50}
                    minRotations={30}
                    displayMode="desktop"
                  />
                </div>
              </div>
            </div>

            {/* 选项展示 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">显示选项</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">隐藏图标</h3>
                  <RotationScoreDisplay
                    actualRotations={actualRotations}
                    minRotations={minRotations}
                    displayMode="desktop"
                    showIcon={false}
                  />
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">隐藏分数</h3>
                  <RotationScoreDisplay
                    actualRotations={actualRotations}
                    minRotations={minRotations}
                    displayMode="desktop"
                    showScore={false}
                  />
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">自定义样式</h3>
                  <RotationScoreDisplay
                    actualRotations={actualRotations}
                    minRotations={minRotations}
                    displayMode="desktop"
                    className="border-2 border-blue-500 shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* 集成示例 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">集成示例 - 游戏统计面板</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <RotationScoreCard
                    actualRotations={actualRotations}
                    minRotations={minRotations}
                  />
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">时间奖励</h3>
                    <div className="text-lg font-bold text-blue-600">+200</div>
                    <div className="text-xs text-gray-600">30秒内完成</div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">提示使用</h3>
                    <div className="text-lg font-bold text-green-600">+0</div>
                    <div className="text-xs text-gray-600">未使用提示</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">旋转评分详情：</span>
                    <SimpleRotationScoreDisplay
                      actualRotations={actualRotations}
                      minRotations={minRotations}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 使用说明 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">使用说明</h2>
              <div className="prose prose-sm max-w-none">
                <h3>基本用法</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { RotationScoreDisplay } from '@/components/score/RotationScoreDisplay';

<RotationScoreDisplay
  actualRotations={15}
  minRotations={10}
  displayMode="desktop"
/>`}
                </pre>

                <h3>显示模式</h3>
                <ul>
                  <li><strong>desktop</strong>: 完整的桌面端显示，包含图标、详细文本和分数</li>
                  <li><strong>mobile</strong>: 移动端优化显示，使用简化标签和图标</li>
                  <li><strong>compact</strong>: 紧凑模式，最小化显示，适合嵌入其他组件</li>
                </ul>

                <h3>组件变体</h3>
                <ul>
                  <li><strong>RotationScoreDisplay</strong>: 主要组件，支持所有显示模式和选项</li>
                  <li><strong>SimpleRotationScoreDisplay</strong>: 简化版本，自动使用紧凑模式</li>
                  <li><strong>RotationScoreCard</strong>: 卡片版本，适合统计面板</li>
                </ul>

                <h3>颜色方案</h3>
                <ul>
                  <li><strong>完美旋转</strong>: 金色主题 (yellow-*)</li>
                  <li><strong>超出旋转</strong>: 红色主题 (red-*)</li>
                  <li><strong>错误状态</strong>: 灰色主题 (gray-*)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </I18nProvider>
  );
};

export default RotationScoreDisplayExample;