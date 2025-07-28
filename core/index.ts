/**
 * Core system exports
 * Unified entry point for all core managers
 */

export { DeviceManager } from './DeviceManager';
export { CanvasManager } from './CanvasManager';
export { EventManager } from './EventManager';
export { AdaptationEngine } from './AdaptationEngine';

// Re-export types for convenience
export type { Point, PuzzlePiece } from '@/types/puzzleTypes';