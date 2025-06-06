import { calculateCenter, isPointInPolygon, rotatePoint, calculateAngle, Point } from '../puzzleGeometry';

describe('puzzleGeometry', () => {
  describe('calculateCenter', () => {
    test('should correctly calculate the center of a square', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];
      const center = calculateCenter(points);
      expect(center.x).toBeCloseTo(5);
      expect(center.y).toBeCloseTo(5);
    });

    test('should correctly calculate the center of a triangle', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 6, y: 0 },
        { x: 3, y: 9 },
      ];
      const center = calculateCenter(points);
      expect(center.x).toBeCloseTo(3);
      expect(center.y).toBeCloseTo(3);
    });

    test('should return { x: 0, y: 0 } for an empty array', () => {
      const points: Point[] = [];
      const center = calculateCenter(points);
      expect(center.x).toBe(0);
      expect(center.y).toBe(0);
    });
  });

  describe('isPointInPolygon', () => {
    const square: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];

    test('should return true for a point inside the polygon', () => {
      expect(isPointInPolygon(5, 5, square)).toBe(true);
    });

    test('should return false for a point outside the polygon', () => {
      expect(isPointInPolygon(15, 5, square)).toBe(false);
      expect(isPointInPolygon(-5, 5, square)).toBe(false);
    });

    test('should return true for a point on the edge', () => {
      expect(isPointInPolygon(5, 0, square)).toBe(true);
      expect(isPointInPolygon(0, 5, square)).toBe(true);
    });

    test('should return true for a vertex point', () => {
      expect(isPointInPolygon(0, 0, square)).toBe(true);
      expect(isPointInPolygon(10, 10, square)).toBe(true);
    });

    const triangle: Point[] = [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 3, y: 9 },
    ];
    test('should correctly identify points in a triangle', () => {
      expect(isPointInPolygon(3, 3, triangle)).toBe(true);
      expect(isPointInPolygon(1, 1, triangle)).toBe(true);
      expect(isPointInPolygon(0, 0, triangle)).toBe(true);
      expect(isPointInPolygon(6, 0, triangle)).toBe(true);
      expect(isPointInPolygon(3, 9, triangle)).toBe(true);
      expect(isPointInPolygon(0, 1, triangle)).toBe(false);
      expect(isPointInPolygon(7, 1, triangle)).toBe(false);
    });
  });

  describe('rotatePoint', () => {
    test('should rotate a point 90 degrees clockwise around origin', () => {
      const rotated = rotatePoint(1, 0, 0, 0, 90);
      expect(rotated.x).toBeCloseTo(0);
      expect(rotated.y).toBeCloseTo(1);
    });

    test('should rotate a point 180 degrees around a custom center', () => {
      const rotated = rotatePoint(10, 0, 5, 5, 180);
      expect(rotated.x).toBeCloseTo(0);
      expect(rotated.y).toBeCloseTo(10);
    });

    test('should return the same point for 0 degree rotation', () => {
      const rotated = rotatePoint(5, 5, 0, 0, 0);
      expect(rotated.x).toBe(5);
      expect(rotated.y).toBe(5);
    });
  });

  describe('calculateAngle', () => {
    test('should calculate 0 degrees for horizontal line to the right', () => {
      expect(calculateAngle(0, 0, 10, 0)).toBeCloseTo(0);
    });

    test('should calculate 90 degrees for vertical line upwards', () => {
      expect(calculateAngle(0, 0, 0, 10)).toBeCloseTo(90);
    });

    test('should calculate 180 degrees for horizontal line to the left', () => {
      expect(calculateAngle(0, 0, -10, 0)).toBeCloseTo(180);
    });

    test('should calculate -90 degrees for vertical line downwards', () => {
      expect(calculateAngle(0, 0, 0, -10)).toBeCloseTo(-90);
    });

    test('should calculate 45 degrees for a diagonal line', () => {
      expect(calculateAngle(0, 0, 10, 10)).toBeCloseTo(45);
    });
  });
}); 