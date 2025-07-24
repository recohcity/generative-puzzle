import { usePuzzleAdaptation as useUnifiedPuzzleAdaptation } from '@/providers/hooks';

/**
 * usePuzzleAdaptation - 迁移到统一适配系统
 * 
 * ✅ 现在使用统一的适配系统，提供向后兼容性
 * 这个Hook现在是统一适配系统的包装器，保持API兼容性
 */
export const usePuzzleAdaptation = (canvasSize: { width: number; height: number } | null) => {
  console.log('✅ [usePuzzleAdaptation] 使用统一适配系统');
  
  // 这个Hook现在只是一个占位符，实际的适配逻辑已经移到统一系统中
  // 为了向后兼容，我们保留这个接口，但不执行任何操作
  // 因为统一适配系统会在PuzzleCanvas中自动处理所有适配逻辑
  
  console.log('✅ [usePuzzleAdaptation] 适配逻辑已由统一系统处理，无需额外操作');
}; 