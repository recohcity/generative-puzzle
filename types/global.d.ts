import { Point, PuzzlePiece } from './puzzleTypes';

declare global {
  interface Window {
    __E2E__?: {
      gameContextDispatch: (...args: any[]) => void;
      selectPieceForTest: (pieceIndex: number) => void;
      markPieceAsCompletedForTest: (pieceIndex: number) => void;
      rotatePieceForTest: (clockwise: boolean) => void;
      resetPiecePositionForTest: (pieceIndex: number) => void;
      testAPI: {
        generateShape: (shapeType: 'polygon' | 'curve' | 'irregular') => void;
        generatePuzzle: (cutCount: number) => void;
        scatterPuzzle: () => void;
        movePiece: (pieceIndex: number, x: number, y: number) => void;
        snapPiece: (pieceIndex: number) => void;
        getPieceCenter: (pieceIndex: number) => Point;
        getPieceTargetCenter: (pieceIndex: number) => Point;
      };
    };
    __gameStateForTests__?: any;
  }
}

// This is needed to make the file a module, which is required for global declarations.
export {}; 