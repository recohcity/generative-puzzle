# Debug Log 分段记录功能

## 功能概述

新的 debug log 系统现在支持按屏幕分辨率和画布尺寸变化自动分段记录拼图的坐标和角度变化。这个功能可以帮助开发者分析分辨率变化后拼图是否发生角度变化。

## 使用方法

1. **启用 Debug 模式**: 按 F10 键启用 debug 模式，此时会显示拼图序号和边界
2. **自动分段**: 当屏幕分辨率或画布尺寸发生变化时，系统会自动创建新的记录分段
3. **导出日志**: 点击右上角的"导出 debuglog"按钮导出完整的分段日志

## 导出数据结构

导出的 JSON 文件包含以下结构：

```json
{
  "exportTime": "2025-01-24T10:30:00.000Z",
  "summary": {
    "totalEvents": 150,
    "totalSegments": 3,
    "segmentsSummary": [
      {
        "id": "segment_1737715800000_abc123def",
        "startTime": "2025-01-24T10:30:00.000Z",
        "endTime": "2025-01-24T10:32:15.000Z",
        "duration": "135s",
        "screenResolution": { "width": 1920, "height": 1080 },
        "canvasSize": { "width": 800, "height": 600 },
        "eventsCount": 45,
        "finalPuzzleState": [
          {
            "index": 1,
            "center": { "x": 400, "y": 300 },
            "rotation": 90,
            "completed": false,
            "interactionStatus": "有交互未完成",
            "rotationChanges": 2
          }
        ],
        "pieceRotationSummary": {
          "1": { 
            "initialRotation": 0, 
            "finalRotation": 90, 
            "changes": 2,
            "userInteractions": 2,
            "interactionStatus": "有交互未完成",
            "completed": false
          }
        }
      }
    ]
  },
  "segmentsFinalStates": [...], // 每个分段的最终状态（推荐使用）
  "detailedSegments": [...] // 详细的事件数据（用于深度分析）
}
```

## 分段触发条件

系统会在以下情况下自动创建新的分段：

1. **屏幕分辨率变化**: 当 `screen.width` 或 `screen.height` 发生变化时
2. **画布尺寸变化**: 当画布的 `width` 或 `height` 发生变化时
3. **首次记录**: 第一次记录 debug 事件时

## 角度变化分析

每个分段都会自动分析拼图块的角度变化：

- `initialRotation`: 该分段中拼图块的初始角度
- `finalRotation`: 该分段中拼图块的最终角度  
- `changes`: 该分段中拼图块角度变化的次数（包括系统自动旋转）
- `userInteractions`: 真实用户交互次数（不包括系统自动旋转）
- `interactionStatus`: 交互状态标记（基于 `userInteractions` 判断）
  - `"无交互"`: 拼图块没有用户交互（`userInteractions = 0`）
  - `"有交互未完成"`: 拼图块有用户交互但未完成拼接（`userInteractions > 0`）
  - `"已完成"`: 拼图块已成功完成拼接
- `completed`: 是否已完成拼接

## 推荐使用的数据结构

建议主要使用 `segmentsFinalStates` 数据，它包含每个分段的最终状态，格式清晰简洁：

```json
{
  "segmentsFinalStates": [
    {
      "id": "segment_xxx",
      "startTime": "2025-01-24T10:30:00.000Z",
      "endTime": "2025-01-24T10:32:15.000Z",
      "screenResolution": { "width": 1920, "height": 1080 },
      "canvasSize": { "width": 800, "height": 600 },
      "gameState": {
        "totalPieces": 5,
        "completed": 2,
        "isScattered": false,
        "isCompleted": false
      },
      "finalPuzzleState": [
        {
          "index": 1,
          "center": { "x": 400, "y": 300 },
          "rotation": 90,
          "completed": true,
          "interactionStatus": "已完成",
          "rotationChanges": 3,
          "userInteractions": 3
        }
      ]
    }
  ]
}
```

## 实际应用场景

1. **分辨率适配测试**: 通过对比不同分段的 `finalPuzzleState`，验证分辨率变化后拼图角度是否保持一致
2. **响应式布局验证**: 验证画布尺寸变化时拼图的适配效果
3. **交互行为分析**: 通过 `interactionStatus` 和 `rotationChanges` 了解用户操作模式
4. **完成度追踪**: 监控拼图完成进度在不同分辨率下的变化

## 注意事项

- Debug 模式需要按 F10 键启用
- 只有在 debug 模式下才会记录和导出日志
- 分段会在屏幕或画布尺寸变化时自动创建，无需手动操作
- 导出的文件名包含时间戳，格式为 `debugLog-YYYYMMDDHHMMSS.json`
## 数据
分析示例

### 分辨率适配验证

通过对比不同分段的拼图状态，可以验证分辨率变化是否影响拼图角度：

```javascript
// 分析角度是否在分辨率变化后保持一致
function analyzeRotationConsistency(segmentsFinalStates) {
  const pieceRotations = {};
  
  segmentsFinalStates.forEach(segment => {
    segment.finalPuzzleState.forEach(piece => {
      if (!pieceRotations[piece.index]) {
        pieceRotations[piece.index] = [];
      }
      pieceRotations[piece.index].push({
        segmentId: segment.id,
        resolution: segment.screenResolution,
        rotation: piece.rotation,
        interactionStatus: piece.interactionStatus
      });
    });
  });
  
  return pieceRotations;
}
```

### 交互状态统计

```javascript
// 统计不同交互状态的拼图数量
function analyzeInteractionStatus(segmentsFinalStates) {
  return segmentsFinalStates.map(segment => ({
    segmentId: segment.id,
    resolution: segment.screenResolution,
    stats: {
      无交互: segment.finalPuzzleState.filter(p => p.interactionStatus === '无交互').length,
      有交互未完成: segment.finalPuzzleState.filter(p => p.interactionStatus === '有交互未完成').length,
      已完成: segment.finalPuzzleState.filter(p => p.interactionStatus === '已完成').length
    }
  }));
}
```

## 交互状态判断逻辑

系统现在能够区分系统自动旋转和用户真实交互：

- **系统自动旋转**：游戏开始时散开拼图的自动旋转，通常只有1次变化
  - `rotationChanges: 1`, `userInteractions: 0`, `interactionStatus: "无交互"`
  
- **用户真实交互**：用户点击旋转按钮或拖拽操作，通常有多次变化
  - `rotationChanges > 1`, `userInteractions > 0`, `interactionStatus: "有交互未完成"`

- **已完成拼图**：无论旋转次数多少，都标记为已完成
  - `interactionStatus: "已完成"`

## 注意事项

- Debug 模式需要按 F10 键启用
- 只有在 debug 模式下才会记录和导出日志
- `rotationChanges` 包括所有角度变化（系统自动 + 用户交互）
- `userInteractions` 只包括用户真实交互次数
- 交互状态基于 `userInteractions` 判断，能准确区分系统行为和用户行为
- 分段会在屏幕或画布尺寸变化时自动创建，无需手动操作
- 导出的文件名包含时间戳，格式为 `debugLog-YYYYMMDDHHMMSS.json`
- 推荐使用 `segmentsFinalStates` 进行分析，数据结构更清晰简洁