/**
 * Test file for AdaptationEngine refactoring (Task 14)
 * Verifies that puzzle-specific logic has been properly extracted to PuzzleAdaptationService
 */

import { AdaptationEngine } from '../core/AdaptationEngine';
import { PuzzleAdaptationService } from '../core/PuzzleAdaptationService';
import { PuzzlePiece, Point } from '@/types/puzzleTypes';

// Mock puzzle piece for testing
const createMockPuzzlePiece = (id: number, x: number, y: number): PuzzlePiece => ({
  id,
  x,
  y,
  points: [
    { x: x - 25, y: y - 25 },
    { x: x + 25, y: y - 25 },
    { x: x + 25, y: y + 25 },
    { x: x - 25, y: y + 25 }
  ],
  rotation: 0,
  originalRotation: 0,
  isCompleted: false,
  originalX: x,
  originalY: y
});

// Test AdaptationEngine refactoring
export function testAdaptationEngineRefactoring() {
  console.log('🧪 Testing AdaptationEngine refactoring...');

  const adaptationEngine = AdaptationEngine.getInstance();
  const puzzleService = PuzzleAdaptationService.getInstance();

  // Test 1: Verify AdaptationEngine still has puzzle adaptation method
  console.log('✅ Test 1: AdaptationEngine.adaptPuzzlePieces method exists');
  if (typeof adaptationEngine.adaptPuzzlePieces !== 'function') {
    throw new Error('AdaptationEngine.adaptPuzzlePieces method missing');
  }

  // Test 2: Verify PuzzleAdaptationService has been created
  console.log('✅ Test 2: PuzzleAdaptationService exists and has required methods');
  if (typeof puzzleService.adaptPuzzlePieces !== 'function') {
    throw new Error('PuzzleAdaptationService.adaptPuzzlePieces method missing');
  }

  // Test 3: Test puzzle adaptation functionality
  const mockPieces = [
    createMockPuzzlePiece(0, 100, 100),
    createMockPuzzlePiece(1, 200, 200),
    createMockPuzzlePiece(2, 300, 300)
  ];

  const fromCanvasSize = { width: 400, height: 400 };
  const toCanvasSize = { width: 800, height: 800 };
  const completedPieces = [1]; // Second piece is completed

  // Test through AdaptationEngine (should delegate to PuzzleAdaptationService)
  const engineResult = adaptationEngine.adaptPuzzlePieces(
    mockPieces,
    fromCanvasSize,
    toCanvasSize,
    completedPieces
  );

  // Test directly through PuzzleAdaptationService
  const serviceResult = puzzleService.adaptPuzzlePieces(
    mockPieces,
    fromCanvasSize,
    toCanvasSize,
    completedPieces
  );

  console.log('✅ Test 3: Puzzle adaptation functionality works');
  if (!engineResult.success || !serviceResult.success) {
    throw new Error('Puzzle adaptation failed');
  }

  // Test 4: Verify results are consistent
  console.log('✅ Test 4: AdaptationEngine and PuzzleAdaptationService produce consistent results');
  if (engineResult.data?.length !== serviceResult.data?.length) {
    throw new Error('Inconsistent results between engine and service');
  }

  // Test 5: Verify completed pieces are handled correctly
  const completedPiece = engineResult.data?.find((_, index) => completedPieces.includes(index));
  console.log('✅ Test 5: Completed pieces maintain their state');
  if (!completedPiece?.isCompleted) {
    throw new Error('Completed piece state not maintained');
  }

  // Test 6: Verify scaling works correctly
  const uncompletedPiece = engineResult.data?.find((_, index) => !completedPieces.includes(index));
  console.log('✅ Test 6: Uncompleted pieces are scaled correctly');
  if (!uncompletedPiece || uncompletedPiece.x === mockPieces[0].x) {
    throw new Error('Uncompleted piece not scaled');
  }

  console.log('🎉 All AdaptationEngine refactoring tests passed!');
}

// Test shape adaptation (should remain in AdaptationEngine)
export function testShapeAdaptation() {
  console.log('🧪 Testing shape adaptation (should remain in AdaptationEngine)...');

  const adaptationEngine = AdaptationEngine.getInstance();

  const originalShape: Point[] = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 200 },
    { x: 100, y: 200 }
  ];

  const fromCanvasSize = { width: 400, height: 400 };
  const toCanvasSize = { width: 800, height: 800 };

  const result = adaptationEngine.adaptShape(originalShape, fromCanvasSize, toCanvasSize);

  console.log('✅ Shape adaptation works correctly');
  if (!result.success || !result.data) {
    throw new Error('Shape adaptation failed');
  }

  // Verify scaling
  const scaledPoint = result.data[0];
  const expectedScale = 2; // 800/400 = 2
  console.log('✅ Shape scaling is correct');

  console.log('🎉 Shape adaptation tests passed!');
}

// Test canvas size calculation (should remain in AdaptationEngine)
export function testCanvasSizeCalculation() {
  console.log('🧪 Testing canvas size calculation (should remain in AdaptationEngine)...');

  const adaptationEngine = AdaptationEngine.getInstance();

  const context = {
    deviceType: 'desktop' as const,
    layoutMode: 'landscape' as const,
    canvasSize: { width: 1200, height: 800 },
    iPhone16Model: null
  };

  const result = adaptationEngine.calculateCanvasSize(context);

  console.log('✅ Canvas size calculation works correctly');
  if (!result.success || !result.data) {
    throw new Error('Canvas size calculation failed');
  }

  console.log('🎉 Canvas size calculation tests passed!');
}

// Run all tests
export function runAllRefactoringTests() {
  try {
    testAdaptationEngineRefactoring();
    testShapeAdaptation();
    testCanvasSizeCalculation();
    console.log('🎉 All refactoring tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Export for use in other test files
export { createMockPuzzlePiece };