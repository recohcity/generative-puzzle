import { useCallback } from 'react';
import { PuzzlePiece, PieceBounds, Point, CanvasSize } from '@generative-puzzle/game-core';

export function usePhysicsBounds(
  canvasSize: CanvasSize | null,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const calculatePieceBounds = useCallback((piece: PuzzlePiece): PieceBounds => {
    if (!piece.points || piece.points.length === 0) {
      return {
        minX: 0, maxX: 0, minY: 0, maxY: 0,
        width: 0, height: 0, centerX: 0, centerY: 0,
      };
    }
    const center = {
      x: piece.points.reduce((sum: number, p: Point) => sum + p.x, 0) / piece.points.length,
      y: piece.points.reduce((sum: number, p: Point) => sum + p.y, 0) / piece.points.length,
    };

    if (piece.rotation !== 0) {
      const rotatedPoints = piece.points.map((point) => {
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        const angleRadians = (piece.rotation * Math.PI) / 180;
        const rotatedDx = dx * Math.cos(angleRadians) - dy * Math.sin(angleRadians);
        const rotatedDy = dx * Math.sin(angleRadians) + dy * Math.cos(angleRadians);
        return {
          x: center.x + rotatedDx,
          y: center.y + rotatedDy,
        };
      });
      const minX = Math.min(...rotatedPoints.map((p) => p.x));
      const maxX = Math.max(...rotatedPoints.map((p) => p.x));
      const minY = Math.min(...rotatedPoints.map((p) => p.y));
      const maxY = Math.max(...rotatedPoints.map((p) => p.y));
      const width = maxX - minX;
      const height = maxY - minY;

      return {
        minX, maxX, minY, maxY, width, height, centerX: center.x, centerY: center.y,
      };
    }

    const minX = Math.min(...piece.points.map((p) => p.x));
    const maxX = Math.max(...piece.points.map((p) => p.x));
    const minY = Math.min(...piece.points.map((p) => p.y));
    const maxY = Math.max(...piece.points.map((p) => p.y));
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return { minX, maxX, minY, maxY, width, height, centerX, centerY };
  }, []);

  const ensurePieceInBounds = useCallback(
    (piece: PuzzlePiece, dx: number, dy: number, safeMargin: number = 1) => {
      let canvasW = canvasRef.current?.width;
      let canvasH = canvasRef.current?.height;
      if (!canvasW || !canvasH) {
        canvasW = canvasSize ? canvasSize.width : 0;
        canvasH = canvasSize ? canvasSize.height : 0;
      }
      if (!canvasW || !canvasH) {
        console.warn("Canvas size not available for boundary check.");
        return { constrainedDx: dx, constrainedDy: dy, hitBoundary: false };
      }

      const currentBounds = calculatePieceBounds(piece);
      const potentialMinX = currentBounds.minX + dx;
      const potentialMaxX = currentBounds.maxX + dx;
      const potentialMinY = currentBounds.minY + dy;
      const potentialMaxY = currentBounds.maxY + dy;

      let constrainedDx = dx;
      let constrainedDy = dy;
      let hitBoundary = false; 

      const bounceBackFactor = 0.4;
      const pieceSizeBasedBounce = Math.max(currentBounds.width, currentBounds.height) * 0.3;
      const maxBounceDistance = Math.min(Math.max(pieceSizeBasedBounce, 30), 80);

      let correctionX = 0;
      let correctionY = 0;

      if (potentialMinX < safeMargin) {
        const boundaryViolation = safeMargin - potentialMinX;
        if (boundaryViolation > 0.1) {
          correctionX = boundaryViolation;
          hitBoundary = true;
        }
      } else if (potentialMaxX > canvasW - safeMargin) {
        const boundaryViolation = potentialMaxX - (canvasW - safeMargin);
        if (boundaryViolation > 0.1) {
          correctionX = -boundaryViolation;
          hitBoundary = true;
        }
      }

      if (potentialMinY < safeMargin) {
        const boundaryViolation = safeMargin - potentialMinY;
        if (boundaryViolation > 0.1) {
          correctionY = boundaryViolation;
          hitBoundary = true;
        }
      } else if (potentialMaxY > canvasH - safeMargin) {
        const boundaryViolation = potentialMaxY - (canvasH - safeMargin);
        if (boundaryViolation > 0.1) {
          correctionY = -boundaryViolation;
          hitBoundary = true;
        }
      }

      if (hitBoundary) {
        constrainedDx = dx + correctionX;
        constrainedDy = dy + correctionY;

        const bounceX = Math.abs(correctionX) > 0
          ? -Math.sign(correctionX) * Math.min(Math.abs(correctionX) * bounceBackFactor, maxBounceDistance)
          : 0;
        const bounceY = Math.abs(correctionY) > 0
          ? -Math.sign(correctionY) * Math.min(Math.abs(correctionY) * bounceBackFactor, maxBounceDistance)
          : 0;

        constrainedDx += bounceX;
        constrainedDy += bounceY;

        const finalMinX = currentBounds.minX + constrainedDx;
        const finalMaxX = currentBounds.maxX + constrainedDx;
        const finalMinY = currentBounds.minY + constrainedDx; 
        const finalMaxY = currentBounds.maxY + constrainedDy; 

        if (finalMinX < safeMargin) {
          constrainedDx += (safeMargin - finalMinX);
        } else if (finalMaxX > canvasW - safeMargin) {
          constrainedDx -= (finalMaxX - (canvasW - safeMargin));
        }

        if (finalMinY < safeMargin) {
          constrainedDy += (safeMargin - finalMinY);
        } else if (finalMaxY > canvasH - safeMargin) {
          constrainedDy -= (finalMaxY - (canvasH - safeMargin));
        }

        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator1 = audioContext.createOscillator();
          const gainNode1 = audioContext.createGain();
          oscillator1.type = "sine";
          oscillator1.frequency.setValueAtTime(120, audioContext.currentTime); 
          gainNode1.gain.setValueAtTime(0.4, audioContext.currentTime);
          gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          oscillator1.connect(gainNode1);
          gainNode1.connect(audioContext.destination);

          const oscillator2 = audioContext.createOscillator();
          const gainNode2 = audioContext.createGain();
          oscillator2.type = "sine";
          oscillator2.frequency.setValueAtTime(240, audioContext.currentTime); 
          gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator2.connect(gainNode2);
          gainNode2.connect(audioContext.destination);

          oscillator1.start();
          oscillator2.start();
          oscillator1.stop(audioContext.currentTime + 0.15);
          oscillator2.stop(audioContext.currentTime + 0.1);
        } catch (e) {
          // Ignore audio errors
        }
      }

      return { constrainedDx, constrainedDy, hitBoundary };
    },
    [canvasRef, canvasSize, calculatePieceBounds]
  );

  return { calculatePieceBounds, ensurePieceInBounds };
}
