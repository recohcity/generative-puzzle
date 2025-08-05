/**
 * Core system exports
 * Unified entry point for all core managers
 * 
 * 🎯 监督指令合规：删除复杂的AdaptationEngine，使用SimpleAdapter
 */

export { DeviceManager } from './DeviceManager';
export { CanvasManager } from './CanvasManager';
export { EventManager } from './EventManager';

// Re-export types for convenience
export type { Point, PuzzlePiece } from '@/types/puzzleTypes';