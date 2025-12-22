import { Point } from "@/types/puzzleTypes";
import { Graph } from "./Graph";
import { BezierCurve, createRadialCurve, Bounds } from "./BezierCurve";

interface Segment {
    p1: Point;
    p2: Point;
    isCurve: boolean;
}

interface Intersection {
    x: number;
    y: number;
    t: number;
}

export class NetworkCutter {

    static generate(shape: Point[], count: number, shapeType?: string): Point[][] {
        const actualShape = (shapeType !== "polygon")
            ? this.discretizeShape(shape)
            : shape;

        const bounds = this.getBounds(actualShape);
        const center = this.getCentroid(actualShape);
        const originalArea = Math.abs(this.getSignedArea(actualShape));

        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        const radialCount = count * 2;

        // 🛡️ 自动重试机制
        const MAX_RETRIES = 20;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const result = this.generateOneShot(actualShape, center, bounds, radialCount);

            let totalResultArea = 0;
            for (const s of result.shapes) {
                totalResultArea += Math.abs(this.getSignedArea(s));
            }

            const areaRatio = totalResultArea / originalArea;
            const piecesCount = result.shapes.length;

            // 成功条件加强版：
            // 1. 面积完整 (99%+)
            // 2. 碎片数量达标 (90%+)：防止粘连。如果 16 条线切完只剩 10 块，说明有 6 块粘连了，必须重试。
            //    注意：对于极其复杂的凹多边形，偶尔可能会少一两块，所以留 10% 的余量。
            if (areaRatio > 0.99 && areaRatio < 1.01 && piecesCount >= radialCount * 0.9) {
                // Success
                return result.shapes;
            }
        }

        console.error("[NetworkCutter] 重试失败，返回兜底结果");
        // 如果多次尝试都无法分开，可能是形状太小或者 count 太大，只能返回最后一次结果
        return this.generateOneShot(actualShape, center, bounds, radialCount).shapes;
    }

    private static generateOneShot(actualShape: Point[], center: Point, bounds: Bounds, radialCount: number): { shapes: Point[][], curves: BezierCurve[] } {
        const curves: BezierCurve[] = [];
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;

        // 30% 偏移范围
        const offsetRange = Math.min(width, height) * 0.3;

        // 🚫 移除 Jitter，回归绝对单点
        // 确保所有曲线起点在数学上完全一致 (引用相同值)
        const hubCenter = {
            x: center.x + (Math.random() - 0.5) * offsetRange,
            y: center.y + (Math.random() - 0.5) * offsetRange
        };

        const randomRotation = Math.random() * Math.PI * 2;

        for (let i = 0; i < radialCount; i++) {
            const angle = (i / radialCount) * Math.PI * 2 + randomRotation;

            // 直接传递 hubCenter，不加任何随机数
            // 这保证了星型拓扑的根结点是唯一的
            curves.push(createRadialCurve(bounds, hubCenter, angle, 0));
        }
        return this.cutShapeWithCurvesNetwork(actualShape, curves);
    }

    private static discretizeShape(shape: Point[]): Point[] {
        if (shape.length < 3) return shape;
        const result: Point[] = [];
        const STEPS = 40;

        for (let i = 0; i < shape.length; i++) {
            const p0 = shape[i];
            const p1 = shape[(i + 1) % shape.length];
            const p2 = shape[(i + 2) % shape.length];

            const startX = (p0.x + p1.x) / 2;
            const startY = (p0.y + p1.y) / 2;
            const endX = (p1.x + p2.x) / 2;
            const endY = (p1.y + p2.y) / 2;

            for (let t = 0; t <= STEPS; t++) {
                if (t === STEPS && i < shape.length - 1) continue;

                const ratio = t / STEPS;
                const inv = 1 - ratio;
                const x = inv * inv * startX + 2 * inv * ratio * p1.x + ratio * ratio * endX;
                const y = inv * inv * startY + 2 * inv * ratio * p1.y + ratio * ratio * endY;

                if (result.length > 0) {
                    const last = result[result.length - 1];
                    if (Math.hypot(x - last.x, y - last.y) < 0.01) continue;
                }
                result.push({ x, y });
            }
        }
        return result;
    }

    static cutShapeWithCurvesNetwork(shape: Point[], curves: BezierCurve[]): { shapes: Point[][], curves: BezierCurve[] } {
        const graph = new Graph();
        const segments: Segment[] = [];

        for (let i = 0; i < shape.length; i++) {
            const p1 = shape[i];
            const p2 = shape[(i + 1) % shape.length];
            segments.push({ p1, p2, isCurve: false });
        }

        for (const curve of curves) {
            // 高精度 250
            const points = curve.getPoints(250);
            for (let i = 0; i < points.length - 1; i++) {
                segments.push({
                    p1: points[i],
                    p2: points[i + 1],
                    isCurve: true
                });
            }
        }

        const splitSegments = this.computeArrangement(segments);
        for (const seg of splitSegments) {
            graph.addEdge(seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y, seg.isCurve);
        }

        const faces = graph.extractFaces();
        const validShapes: Point[][] = [];
        const originalSignedArea = this.getSignedArea(shape);
        const isOriginalPositive = originalSignedArea >= 0;

        const bounds = this.getBounds(shape);
        const OVERFLOW_MARGIN = 20;

        for (const face of faces) {
            const faceSignedArea = this.getSignedArea(face);
            const isFacePositive = faceSignedArea >= 0;

            if (isFacePositive !== isOriginalPositive) continue;

            const area = Math.abs(faceSignedArea);
            if (area < 2) continue;

            const faceCenter = this.getCentroid(face);
            if (!this.isPointInPolygon(faceCenter, shape, 5.0)) continue;

            // Overflow Check
            let isOverflow = false;
            for (const p of face) {
                if (p.x < bounds.minX - OVERFLOW_MARGIN ||
                    p.x > bounds.maxX + OVERFLOW_MARGIN ||
                    p.y < bounds.minY - OVERFLOW_MARGIN ||
                    p.y > bounds.maxY + OVERFLOW_MARGIN) {
                    isOverflow = true;
                    break;
                }
            }
            if (isOverflow) continue;

            const markedFace = face.map(p => ({ ...p, isOriginal: false }));
            validShapes.push(markedFace);
        }

        if (validShapes.length === 0) {
            return { shapes: [shape], curves: curves };
        }

        return { shapes: validShapes, curves: curves };
    }

    // ... computeArrangement (不变)
    static computeArrangement(segments: Segment[]): Segment[] {
        const PRECISION = 1000000;
        const snap = (v: number) => Math.round(v * PRECISION) / PRECISION;

        const cutsMap = new Map<number, Intersection[]>();
        for (let i = 0; i < segments.length; i++) cutsMap.set(i, []);

        for (let i = 0; i < segments.length; i++) {
            const segA = segments[i];
            for (let j = i + 1; j < segments.length; j++) {
                const segB = segments[j];

                if (Math.max(segA.p1.x, segA.p2.x) < Math.min(segB.p1.x, segB.p2.x) - 1 ||
                    Math.min(segA.p1.x, segA.p2.x) > Math.max(segB.p1.x, segB.p2.x) + 1 ||
                    Math.max(segA.p1.y, segA.p2.y) < Math.min(segB.p1.y, segB.p2.y) - 1 ||
                    Math.min(segA.p1.y, segA.p2.y) > Math.max(segB.p1.y, segB.p2.y) + 1) {
                    continue;
                }

                const intersection = this.lineSegmentIntersection(segA.p1, segA.p2, segB.p1, segB.p2);
                if (intersection) {
                    const EPS = 1e-6;
                    if (intersection.t1 >= -EPS && intersection.t1 <= 1 + EPS &&
                        intersection.t2 >= -EPS && intersection.t2 <= 1 + EPS) {

                        const snapedX = snap(intersection.x);
                        const snapedY = snap(intersection.y);

                        if (intersection.t1 > EPS && intersection.t1 < 1 - EPS) {
                            cutsMap.get(i)!.push({ x: snapedX, y: snapedY, t: intersection.t1 });
                        }
                        if (intersection.t2 > EPS && intersection.t2 < 1 - EPS) {
                            cutsMap.get(j)!.push({ x: snapedX, y: snapedY, t: intersection.t2 });
                        }
                    }
                }
            }
        }

        const resultSegments: Segment[] = [];
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const cuts = cutsMap.get(i)!;
            const p1 = { x: snap(seg.p1.x), y: snap(seg.p1.y) };
            const p2 = { x: snap(seg.p2.x), y: snap(seg.p2.y) };

            const allPoints = [{ x: p1.x, y: p1.y, t: 0 }, ...cuts, { x: p2.x, y: p2.y, t: 1 }];
            allPoints.sort((a, b) => a.t - b.t);

            const uniquePoints: typeof allPoints = [];
            if (allPoints.length > 0) {
                uniquePoints.push(allPoints[0]);
                for (let k = 1; k < allPoints.length; k++) {
                    const lp = uniquePoints[uniquePoints.length - 1];
                    const cp = allPoints[k];
                    if (Math.abs(cp.x - lp.x) > 0.001 || Math.abs(cp.y - lp.y) > 0.001) {
                        uniquePoints.push(cp);
                    }
                }
            }

            for (let k = 0; k < uniquePoints.length - 1; k++) {
                resultSegments.push({
                    p1: { x: uniquePoints[k].x, y: uniquePoints[k].y },
                    p2: { x: uniquePoints[k + 1].x, y: uniquePoints[k + 1].y },
                    isCurve: seg.isCurve
                });
            }
        }
        return resultSegments;
    }

    static lineSegmentIntersection(p1: Point, p2: Point, p3: Point, p4: Point): { x: number, y: number, t1: number, t2: number } | null {
        const d1x = p2.x - p1.x;
        const d1y = p2.y - p1.y;
        const d2x = p4.x - p3.x;
        const d2y = p4.y - p3.y;
        const cross = d1x * d2y - d1y * d2x;
        if (Math.abs(cross) < 1e-10) return null;
        const dx = p3.x - p1.x;
        const dy = p3.y - p1.y;
        const t1 = (dx * d2y - dy * d2x) / cross;
        const t2 = (dx * d1y - dy * d1x) / cross;
        return { x: p1.x + t1 * d1x, y: p1.y + t1 * d1y, t1, t2 };
    }

    static getSignedArea(points: Point[]): number {
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return area / 2;
    }

    static getCentroid(points: Point[]): Point {
        let area = 0, cx = 0, cy = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            const cross = points[i].x * points[j].y - points[j].x * points[i].y;
            area += cross;
            cx += (points[i].x + points[j].x) * cross;
            cy += (points[i].y + points[j].y) * cross;
        }
        area *= 0.5;
        if (Math.abs(area) < 1e-6) return points[0];
        return { x: cx / (6 * area), y: cy / (6 * area) };
    }

    static isPointInPolygon(point: Point, polygon: Point[], tolerance: number = 0): boolean {
        let inside = false;
        const { x, y } = point;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        if (!inside && tolerance > 0) {
            for (let i = 0; i < polygon.length; i++) {
                const p1 = polygon[i];
                const p2 = polygon[(i + 1) % polygon.length];
                if (this.pointToSegmentDistance(point, p1, p2) <= tolerance) {
                    return true;
                }
            }
        }
        return inside;
    }

    private static pointToSegmentDistance(p: Point, a: Point, b: Point): number {
        const l2 = Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2);
        if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
        let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
    }

    static getBounds(points: Point[]): Bounds {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        return { minX, minY, maxX, maxY };
    }
}
