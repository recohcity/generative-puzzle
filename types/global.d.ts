import { Point, PuzzlePiece } from './puzzleTypes';

declare global {
  interface Window {
    testAPI: {
      generateShape: (shapeType: 'polygon' | 'curve' | 'irregular') => void;
      generatePuzzle: (cutCount: number) => void;
      scatterPuzzle: () => void;
      movePiece: (pieceIndex: number, x: number, y: number) => void;
      snapPiece: (pieceIndex: number) => void;
      getPieceCenter: (pieceIndex: number) => Point;
      getPieceTargetCenter: (pieceIndex: number) => Point;
    };
    // Eslint-disable-next-line no-var
    var __gameStateForTests__: any;
  }
}

// This is needed to make the file a module, which is required for global declarations.
export {}; 