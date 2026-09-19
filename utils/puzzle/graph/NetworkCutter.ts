import { Point } from "@generative-puzzle/game-core";
import { Graph } from "./Graph";
import { BezierCurve, createRadialCurve, Bounds } from "./BezierCurve";
import { DIFFICULTY_SETTINGS } from "../cutGeneratorConfig";

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

    static generate(shape: Point[], difficultyLevel: number, shapeType?: string): Point[][] {
        const actualShape = (shapeType !== "polygon")
            ? this.discretizeShape(shape)
            : shape;

        const bounds = this.getBounds(actualShape);
        const center = this.getCentroid(actualShape);
        const originalArea = Math.abs(this.getSignedArea(actualShape));

        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        
        // 🔧 修复：曲线切割的放射线数量应该等于期望的拼图数量，而不是切割线数量
        // 原因：直线/斜线的切割线会互相交叉，n条线产生约2n块拼图
        //      但放射状曲线从中心发出不交叉，n条线只产生约n块扇形拼图
        // 解决：使用 pieceRange.max 作为放射线数量，确保产生足够的拼图
        const settings = DIFFICULTY_SETTINGS[difficultyLevel as keyof typeof DIFFICULTY_SETTINGS];
        const pieceRange = settings?.pieceRange || { min: difficultyLevel * 2, max: difficultyLevel * 4 };
        
        // 放射线数量 = 期望拼图数量的上限（pieceRange.max）
        // 这样难度8时：pieceRange.max=30 → radialCount=30，产生约30块拼图
        const radialCount = pieceRange.max;
        
        console.log(`[NetworkCutter] 难度级别: ${difficultyLevel}, 期望拼图范围: ${pieceRange.min}-${pieceRange.max}, 放射线数量: ${radialCount}`);

        // 🛡️ 自动重试机制
        const MAX_RETRIES = 20;
        
        // 期望的最小拼图数量（pieceRange.min 或放射线数量的80%）
        const minExpectedPieces = Math.max(pieceRange.min, Math.floor(radialCount * 0.8));

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
            // 2. 碎片数量达标：使用 pieceRange 的最小值或 radialCount 的 80%
            if (areaRatio > 0.99 && areaRatio < 1.01 && piecesCount >= minExpectedPieces) {
                console.log(`[NetworkCutter] 成功: 生成 ${piecesCount} 块拼图 (期望最少 ${minExpectedPieces} 块)`);
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
        // 🔧 顺序分割优先（轻量）：利用放射"单点发射、互不交叉"结构直接构扇区，
        // 手机端由最慢变秒切；失败（出口缺失/面积不守恒）回退平面图路径。
        const seqShapes = this.generateSequentialRadial(actualShape, curves);
        if (seqShapes) {
            return { shapes: seqShapes, curves };
        }
        return this.cutShapeWithCurvesNetwork(actualShape, curves);
    }

    private static discretizeShape(shape: Point[]): Point[] {
        if (shape.length < 3) return shape;
        const result: Point[] = [];
        const STEPS = 20; // 从40降低到20

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

    /**
     * 🔧 顺序分割（轻量放射）：利用放射曲线的特殊结构（全部从 hub 出发、互不交叉、到达边界），
     * 直接把相邻两条曲线之间的区域构造成扇区碎片——跳过平面图求交+面提取（O(S²) 全段求交），
     * 复杂度从最重降为 O(曲线数 × 采样段)。手机端放射由"最慢"变"与其它切割同量级"。
     * 失败（出口缺失/面积不守恒）返回 null，调用方回退平面图路径。
     */
    private static generateSequentialRadial(shape: Point[], curves: BezierCurve[]): Point[][] | null {
        const SAMPLES = 20;
        interface Exit { pos: number; edgeIdx: number; t: number; exit: Point; curvePts: Point[]; }
        const exits: Exit[] = [];

        // 1. 每条曲线：从 hub 向外找与形状边界的第一个出口交点
        for (const curve of curves) {
            const pts = curve.getPoints(SAMPLES);
            let found: { exit: Point; edgeIdx: number; t: number; segIdx: number } | null = null;
            for (let seg = 0; seg < pts.length - 1; seg++) {
                const a = pts[seg], b = pts[seg + 1];
                for (let e = 0; e < shape.length; e++) {
                    const p1 = shape[e], p2 = shape[(e + 1) % shape.length];
                    const inter = this.lineSegmentIntersection(a, b, p1, p2);
                    if (inter && inter.t1 >= 0 && inter.t1 <= 1 && inter.t2 >= 0 && inter.t2 <= 1) {
                        found = { exit: { x: inter.x, y: inter.y }, edgeIdx: e, t: inter.t2, segIdx: seg };
                        break;
                    }
                }
                if (found) break;
            }
            if (!found) continue; // 无出口（曲线未达边界）→ 跳过

            // 曲线内部点序列：hub → 出口（含交点）
            const inner: Point[] = [];
            for (let i = 0; i <= found.segIdx; i++) inner.push(pts[i]);
            inner.push(found.exit);

            // 边界位置：edgeIdx + t（用于排序与短弧选择）
            const pos = found.edgeIdx + Math.min(Math.max(found.t, 0), 0.999999);
            exits.push({ pos, edgeIdx: found.edgeIdx, t: found.t, exit: found.exit, curvePts: inner });
        }

        const n = exits.length;
        if (n < 2) return null;

        // 2. 按边界位置排序（保证相邻曲线在边界上相邻）
        exits.sort((a, b) => a.pos - b.pos);
        const total = shape.length; // 边数即位置单位（每边 1 单位）

        // 3. 构扇区：曲线A(hub→exitA) + 边界短弧(exitA→exitB) + 曲线B反向(exitB→hub)
        const pieces: Point[][] = [];
        for (let k = 0; k < n; k++) {
            const A = exits[k];
            const B = exits[(k + 1) % n];
            // 短弧方向：正向长度 vs 反向长度（跨 n 回绕）
            let lenF = (B.pos - A.pos + total) % total;
            if (lenF === 0) lenF = total; // 同点 → 全周（不应发生，防御）
            const lenB = total - lenF;
            const arc: Point[] = [A.exit];
            if (lenF <= lenB) {
                // 正向：边索引递增
                let e = A.edgeIdx;
                while (true) {
                    e = (e + 1) % shape.length;
                    if (e === B.edgeIdx) break;
                    arc.push(shape[e]);
                }
                arc.push(B.exit);
            } else {
                // 反向：边索引递减
                let e = A.edgeIdx;
                while (true) {
                    e = (e - 1 + shape.length) % shape.length;
                    if (e === B.edgeIdx) break;
                    arc.push(shape[e]);
                }
                arc.push(B.exit);
            }
            // 扇区 = 曲线A + 边界弧 + 曲线B反向
            const piece: Point[] = [...A.curvePts, ...arc, ...B.curvePts.slice().reverse()];
            pieces.push(piece);
        }

        // 4. 面积守恒验证（±2%）
        const shapeArea = Math.abs(this.getSignedArea(shape));
        if (shapeArea <= 0) return null;
        let totalArea = 0;
        for (const p of pieces) {
            if (p.length < 3) return null;
            totalArea += Math.abs(this.getSignedArea(p));
        }
        const ratio = totalArea / shapeArea;
        if (ratio < 0.98 || ratio > 1.02) return null;
        return pieces;
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
            // 采样自适应：直线曲线（控制点在中点）1 段即可，弯曲曲线 100 段
            // 蜂巢边为直线表示，旧实现每条采 100 点 → 4 万段 → O(S²) 求交数百毫秒卡顿
            const isStraight = Math.hypot(
                curve.p1.x - (curve.p0.x + curve.p2.x) / 2,
                curve.p1.y - (curve.p0.y + curve.p2.y) / 2,
            ) < 1e-6;
            const points = curve.getPoints(isStraight ? 1 : 20);
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

            // 形状边界原始顶点标记 isOriginal:true（渲染走曲线平滑），
            // 网格交点/边界交点标记 isOriginal:false（渲染走直线）
            const shapeVertexSet = new Set(
                shape.map(v => `${v.x.toFixed(2)},${v.y.toFixed(2)}`)
            );
            const markedFace = face.map(p => {
                const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
                const isBoundary = shapeVertexSet.has(key);
                return { ...p, isOriginal: isBoundary ? true : false };
            });
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

        // 🔧 性能优化：网格空间索引替代全对 O(S²) 求交。
        // 高难度放射（30 曲线 × 100 段 ≈ 3000 段）全对比较 ≈ 900 万次，是手机端
        // "放射明显比其他切割慢"的根源。网格索引只对共享网格单元的段对求交，
        // 复杂度降至近 O(S·k)（k = 网格内段数），结果与全对比较完全一致
        // （bbox 不重叠的段对必不共享网格，共享网格的段对才可能相交）。
        const CELL = 48; // 网格单元大小（px），约为曲线段的典型长度
        const grid = new Map<string, number[]>();
        const cellKeys = (seg: Segment): string[] => {
            const gx0 = Math.floor(Math.min(seg.p1.x, seg.p2.x) / CELL);
            const gx1 = Math.floor(Math.max(seg.p1.x, seg.p2.x) / CELL);
            const gy0 = Math.floor(Math.min(seg.p1.y, seg.p2.y) / CELL);
            const gy1 = Math.floor(Math.max(seg.p1.y, seg.p2.y) / CELL);
            const keys: string[] = [];
            for (let gx = gx0; gx <= gx1; gx++)
                for (let gy = gy0; gy <= gy1; gy++) keys.push(gx + ":" + gy);
            return keys;
        };
        for (let i = 0; i < segments.length; i++) {
            for (const key of cellKeys(segments[i])) {
                const arr = grid.get(key);
                if (arr) arr.push(i); else grid.set(key, [i]);
            }
        }

        const checked = new Set<string>(); // 段对去重
        const EPS = 1e-6;
        for (let i = 0; i < segments.length; i++) {
            const segA = segments[i];
            for (const key of cellKeys(segA)) {
                const bucket = grid.get(key);
                if (!bucket) continue;
                for (const j of bucket) {
                    if (j <= i) continue;
                    const pairKey = i + ":" + j;
                    if (checked.has(pairKey)) continue;
                    checked.add(pairKey);

                    const segB = segments[j];
                    if (Math.max(segA.p1.x, segA.p2.x) < Math.min(segB.p1.x, segB.p2.x) - 1 ||
                        Math.min(segA.p1.x, segA.p2.x) > Math.max(segB.p1.x, segB.p2.x) + 1 ||
                        Math.max(segA.p1.y, segA.p2.y) < Math.min(segB.p1.y, segB.p2.y) - 1 ||
                        Math.min(segA.p1.y, segA.p2.y) > Math.max(segB.p1.y, segB.p2.y) + 1) {
                        continue;
                    }

                    const intersection = this.lineSegmentIntersection(segA.p1, segA.p2, segB.p1, segB.p2);
                    if (intersection) {
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
