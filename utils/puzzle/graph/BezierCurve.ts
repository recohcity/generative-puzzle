import { Point } from "@/types/puzzleTypes";

export class BezierCurve {
    p0: Point;
    p1: Point;
    p2: Point;

    constructor(p0: Point, p1: Point, p2: Point) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
    }

    /**
     * 计算曲线上t参数对应的点
     * @param t 参数 [0, 1]
     */
    getPoint(t: number): Point {
        const { p0, p1, p2 } = this;
        const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
        const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
        return { x, y };
    }

    /**
     * 获取曲线上的一系列点
     * @param segments 分段数
     */
    getPoints(segments: number = 100): Point[] {
        const points: Point[] = [];
        for (let i = 0; i <= segments; i++) {
            points.push(this.getPoint(i / segments));
        }
        return points;
    }
}

/**
 * Bounds type
 */
export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/**
 * 创建优化的切割曲线
 * 实现了“锚点系统”，确保曲线不会孤立悬浮
 * 
 * @param bounds 边界框
 * @param shapeCenter 形状重心 (可选，用于花瓣/辐条生成)
 * @param count 总切割数 (可选，用于调整策略)
 * @returns BezierCurve
 */
export function createOptimizedCurve(bounds: Bounds, shapeCenter?: Point, count: number = 2): BezierCurve {
    const { minX, minY, maxX, maxY } = bounds;
    const width = maxX - minX;
    const height = maxY - minY;

    // 默认重心
    const cx = shapeCenter ? shapeCenter.x : (minX + width / 2);
    const cy = shapeCenter ? shapeCenter.y : (minY + height / 2);

    // 扩展边界，确保点在外部 (安全区稍微收紧，增加曲率灵敏度)
    const extension = Math.max(width, height) * 0.5;

    // 辅助：获取外部随机点
    const getOuterPoint = () => {
        const angle = Math.random() * Math.PI * 2;
        // 点刚好在边界外一点点，这样曲线在形状内部的弧度更明显
        const dist = Math.max(width, height) * 0.8 + Math.random() * extension;
        return {
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist
        };
    };

    // 统一中心点 (虽然此时 Through Cut 不直接用它作为端点，但作为中心参考)
    const getHubPoint = () => ({
        x: cx,
        y: cy
    });

    // 策略锁定：强制执行 Through Cut (贯穿切割)
    // 🛡️ 弃用 Spoke 和 Petal 模式，因为它们在非闭合图中容易产生死端
    let type = 0;

    let p0: Point, p1: Point, p2: Point;

    // [Through] 贯穿
    // 起点和终点都在外，且尽量在对侧
    p0 = getOuterPoint();

    // 终点: 取 p0 的反向角度 + 随机偏移，确保横跨形状
    const angle0 = Math.atan2(p0.y - cy, p0.x - cx);
    const angle2 = angle0 + Math.PI + (Math.random() - 0.5) * (Math.PI / 2);
    const dist2 = Math.max(width, height) * 0.8 + Math.random() * extension;

    p2 = {
        x: cx + Math.cos(angle2) * dist2,
        y: cy + Math.sin(angle2) * dist2
    };

    // 控制点：增加垂直偏移，产生明显但自然的弧度
    const midX = (p0.x + p2.x) / 2;
    const midY = (p0.y + p2.y) / 2;
    const dx = p2.x - p0.x;
    const dy = p2.y - p0.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;

    // 偏移量控制在 max(w,h) 的 25%~45% (之前是 20%~40%)
    // 增加最小弧度保证，同时限制最大弧度避免过度扭曲
    const offsetDist = (Math.random() > 0.5 ? 1 : -1) * (0.25 + Math.random() * 0.2) * Math.max(width, height);

    p1 = {
        x: midX + nx * offsetDist,
        y: midY + ny * offsetDist
    };

    return new BezierCurve(p0, p1, p2);
}

/**
 * 创建从中心向外发射的切割曲线
 * 🌟 只有这样才能确保所有曲线精确交汇于同一点
 * 
 * @param bounds 边界框
 * @param startPoint 起点 (球心)
 * @param angle 发射角度
 * @returns BezierCurve
 */
export function createRadialCurve(bounds: Bounds, startPoint: Point, angle: number, hubRadius: number = 0): BezierCurve {
    const { minX, minY, maxX, maxY } = bounds;
    const width = maxX - minX;
    const height = maxY - minY;

    // 半径大于形状尺寸，确保延伸到外部
    const radius = Math.max(width, height) * 2.0;

    // 起点：精确的球心 (hubRadius 被忽略，因为我们回归单点发射)
    const p0 = startPoint;

    // ✋ 核心修正：单点发射防交叉策略
    // 强制 P0 -> P1 的方向（起点切线）严格等于传入的 angle。
    // 这保证了所有曲线在根部是完全径向分离的。

    // P1 (控制点)：位于 angle 方向上，半径的一半处
    // 这样曲线的前半段几乎是直的
    const p1Dist = radius * 0.5;
    const p1: Point = {
        x: p0.x + Math.cos(angle) * p1Dist,
        y: p0.y + Math.sin(angle) * p1Dist
    };

    // P2 (终点)：位于 angle + swirlAngle 方向上
    // 统一顺时针弯曲 30 度 (PI/6)，产生柔和的风车效果
    const swirlAngle = Math.PI / 6;
    const p2: Point = {
        x: p0.x + Math.cos(angle + swirlAngle) * radius,
        y: p0.y + Math.sin(angle + swirlAngle) * radius
    };

    return new BezierCurve(p0, p1, p2);
}

// 兼容旧接口，但实际不会再用到
export function createOptimizedCurveWithAngle(bounds: Bounds, shapeCenter: Point, baseAngle: number): BezierCurve {
    return createRadialCurve(bounds, shapeCenter, baseAngle);
}
