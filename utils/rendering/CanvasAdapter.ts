import { GameState, CanvasSize } from "@generative-puzzle/game-core";
import { adaptAllElements } from "@/utils/SimpleAdapter";
import { textureCache } from "@/utils/rendering/TextureCache";

export const handleCanvasResize = (
  state: GameState,
  newCanvasSize: CanvasSize,
  skipAdaptation: boolean = false,
  forceUpdate: boolean = false
): GameState => {
  if (skipAdaptation) {
    return { ...state, canvasSize: newCanvasSize };
  }

  const aspectRatio = newCanvasSize.width / newCanvasSize.height;
  const isExtremeRatio = aspectRatio > 3 || aspectRatio < 0.3;
  const currentSize = state.canvasSize;
  const hasSignificantChange =
    !currentSize ||
    Math.abs(newCanvasSize.width - currentSize.width) > 100 ||
    Math.abs(newCanvasSize.height - currentSize.height) > 100;

  const needsProtection = (isExtremeRatio || hasSignificantChange) && !forceUpdate;

  if (needsProtection) {
    return { ...state, canvasSize: newCanvasSize };
  }

  // 关键：当发生有效的尺寸变化导致需要重新适配时，清理拼图纹理缓存
  // 因为缩放会导致原有的离屏位图失真或尺寸不符
  textureCache.clear();

  if (
    currentSize &&
    currentSize.width === newCanvasSize.width &&
    currentSize.height === newCanvasSize.height
  ) {
    return state;
  }

  if (!state.originalShape || state.originalShape.length === 0) {
    return { ...state, canvasSize: newCanvasSize };
  }

  const fromSize = currentSize || state.baseCanvasSize || { width: 640, height: 640 };
  const toSize = newCanvasSize;

  const isSameSize = fromSize.width === toSize.width && fromSize.height === toSize.height;
  const isInitialCall = !currentSize;

  if (!isSameSize && !isInitialCall && fromSize.width > 0 && fromSize.height > 0) {
    const adaptedOriginalShape = adaptAllElements(state.originalShape, fromSize, toSize);
    const adaptedPuzzle = state.puzzle
      ? adaptAllElements(state.puzzle, fromSize, toSize)
      : state.puzzle;
    const adaptedOriginalPositions = state.originalPositions
      ? adaptAllElements(state.originalPositions, fromSize, toSize)
      : state.originalPositions;

    return {
      ...state,
      canvasSize: newCanvasSize,
      originalShape: adaptedOriginalShape,
      puzzle: adaptedPuzzle as any,
      originalPositions: adaptedOriginalPositions as any,
    };
  } else {
    return { ...state, canvasSize: newCanvasSize };
  }
};
