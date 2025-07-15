# 画布与拼图状态记忆机制总结报告

## 一、当前实现的机制

1. **状态集中管理**  
   所有拼图块状态、原始目标点位、画布尺寸等均集中存储在 `GameContext`，实现单一数据源。
2. **画布尺寸变化的记忆与适配**  
   画布尺寸变化时，`updateCanvasSize` 会记录当前尺寸为 `previousCanvasSize`，新尺寸写入 `canvasWidth/canvasHeight`。
   `usePuzzleAdaptation` 监听尺寸变化，自动计算所有拼图块在新画布下的正确位置和旋转，实现状态的“记忆”与“恢复”。
3. **适配逻辑**  
   - 已完成块：查找 originalPositions，按归一化点位和新尺寸缩放恢复。
   - 未完成块：以当前中心点归一化（相对于旧尺寸），再反归一化到新尺寸，保持相对位置。
4. **批量状态更新**  
   适配后通过 `UPDATE_ADAPTED_PUZZLE_STATE` action 批量更新 puzzle 状态和 previousCanvasSize。

## 二、存在的问题

1. **action payload 字段不一致**  
   `usePuzzleAdaptation` dispatch 的 payload 字段为 `puzzle`，而 reducer 期望 `newPuzzleData`，导致适配结果无法正确写入 state。
2. **originalPositions 归一化假设未强制保证**  
   已完成块的适配假设 originalPositions 的点为归一化坐标，若生成逻辑未保证，适配会有偏差。
3. **未完成块的 normalizedX/Y 未持久化**  
   适配时每次临时计算 normalizedX/Y，未在拖拽/移动时同步写入 state，导致多次适配可能出现误差累积。
4. **注释不够完善**  
   关键流程、数据结构、适配假设等注释不够详细，影响后续维护和协作。

## 三、待完善内容

1. **修正 action payload 字段一致性**  
   统一 `UPDATE_ADAPTED_PUZZLE_STATE` 的 payload 字段名，确保适配结果能正确写入 state。
2. **保证 originalPositions 归一化**  
   明确 originalPositions 生成时为归一化点位，或适配逻辑根据实际点位类型调整缩放方式。
3. **持久化 normalizedX/Y 字段**  
   在拼图块拖拽、移动等操作后，同步更新 normalizedX/Y 字段，提升适配精度。
4. **补充详细注释和文档**  
   对关键数据结构、适配流程、假设条件等补充注释，便于团队理解和维护。

---

> 本文档用于团队成员快速了解和排查画布与拼图状态记忆机制的实现现状、遗留问题及优化建议。 