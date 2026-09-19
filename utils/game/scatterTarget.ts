/**
 * 打散拼图时的目标形状限制计算（从 GameContext 抽出，纯函数）
 *
 * 输入：原始形状多边形
 * 输出：{ center, radius } —— 碎片散开时的目标圆域
 */
import type { Point } from "@generative-puzzle/game-core";

export const calculateScatterTarget = (originalShape: Point[] | null) => {
  if (!originalShape || originalShape.length === 0) return null;

  const bounds = originalShape.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxX: Math.max(acc.maxX, point.x),
      maxY: Math.max(acc.maxY, point.y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const radius = Math.max((bounds.maxX - bounds.minX) / 2, (bounds.maxY - bounds.minY) / 2) * 1.2;

  return {
    center: { x: centerX, y: centerY },
    radius: radius,
  };
};
