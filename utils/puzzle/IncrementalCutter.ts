// 业务层兼容 re-export：几何核心（增量顺序切割器）已迁入
// @generative-puzzle/game-core，作为单一事实来源；此处仅转发类型与类，
// 保持 utils/puzzle/ 既有引用路径不变。
export {
  IncrementalCutter,
  type ThroughCurve,
  type CutPathKind,
  type IncrementalCutLog,
  type IncrementalCutResult,
} from "@generative-puzzle/game-core";
