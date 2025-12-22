import { Point } from "@/types/puzzleTypes";

/**
 * 图结构节点
 * Graph Node
 */
export class GraphNode {
    x: number;
    y: number;
    edges: GraphEdge[];
    id: string;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.edges = [];
        // 使用与 NetworkCutter.computeArrangement 完全相同的 snap 逻辑
        // 确保节点 ID 精确匹配
        const PRECISION = 1000000;
        const snapX = Math.round(x * PRECISION) / PRECISION;
        const snapY = Math.round(y * PRECISION) / PRECISION;
        this.id = `${snapX},${snapY}`;
    }

    addEdge(edge: GraphEdge) {
        this.edges.push(edge);
    }

    /**
     * 按角度排序连接到此节点的边
     * Sort edges by angle for face extraction
     */
    sortEdges() {
        this.edges.sort((a, b) => {
            const angleA = Math.atan2(a.to.y - this.y, a.to.x - this.x);
            const angleB = Math.atan2(b.to.y - this.y, b.to.x - this.x);
            return angleA - angleB;
        });
    }
}

/**
 * 图结构边 (有向)
 * Graph Edge (Directed)
 */
export class GraphEdge {
    from: GraphNode;
    to: GraphNode;
    visited: boolean;
    reverseEdge: GraphEdge | null;
    isCurve: boolean;

    constructor(from: GraphNode, to: GraphNode) {
        this.from = from;
        this.to = to;
        this.visited = false;
        this.reverseEdge = null;
        this.isCurve = false;
    }
}

/**
 * 平面图
 * Planar Graph
 */
export class Graph {
    nodes: Map<string, GraphNode>;
    edges: GraphEdge[];

    constructor() {
        this.nodes = new Map();
        this.edges = [];
    }

    addNode(x: number, y: number): GraphNode {
        // 统一使用 GraphNode 中的 ID 生成逻辑
        const tempNode = new GraphNode(x, y);
        const id = tempNode.id;

        if (!this.nodes.has(id)) {
            this.nodes.set(id, tempNode);
        }
        return this.nodes.get(id)!;
    }

    addEdge(x1: number, y1: number, x2: number, y2: number, isCurve: boolean = false) {
        // 忽略极短的边
        if (Math.hypot(x2 - x1, y2 - y1) < 1e-4) return;

        const u = this.addNode(x1, y1);
        const v = this.addNode(x2, y2);

        // 添加双向边 (两个半边)
        const e1 = new GraphEdge(u, v);
        const e2 = new GraphEdge(v, u);

        e1.isCurve = isCurve;
        e2.isCurve = isCurve;

        e1.reverseEdge = e2;
        e2.reverseEdge = e1;

        u.addEdge(e1);
        v.addEdge(e2);

        this.edges.push(e1, e2);
    }

    /**
     * 提取所有最小闭合回路 (Faces)
     * Extract all faces (closed loops) from the graph
     */
    extractFaces(): Point[][] {
        const faces: Point[][] = [];

        // 1. 为每个节点的边排序
        this.nodes.forEach(node => node.sortEdges());

        // 2. 遍历所有半边
        for (const edge of this.edges) {
            if (edge.visited) continue;

            const cycle: Point[] = [];
            let currentEdge = edge;
            let isCycleClosed = false;

            // 追踪循环
            // 防止死循环的最大步数
            let steps = 0;
            const MAX_STEPS = this.edges.length * 2;

            while (!currentEdge.visited && steps < MAX_STEPS) {
                currentEdge.visited = true;
                // 将节点转换为 Point 接口格式
                cycle.push({ x: currentEdge.from.x, y: currentEdge.from.y });

                // 找下一条边: 在目标节点处，找反向边的下一条边 (CCW)
                const node = currentEdge.to;
                const incoming = currentEdge.reverseEdge;

                if (!incoming) break; // 理论上不应该发生，因为我们总是成对添加边

                const idx = node.edges.indexOf(incoming);

                // 取逆时针方向的下一条边 (-1 因为我们是按角度排序的)
                let nextIdx = (idx - 1 + node.edges.length) % node.edges.length;
                currentEdge = node.edges[nextIdx];

                steps++;

                // 如果回到了起始边，说明闭合
                if (currentEdge === edge) {
                    isCycleClosed = true;
                    break;
                }
            }

            // 如果循环闭合且有效 (至少3个点)
            if (isCycleClosed && cycle.length > 2) {
                faces.push(cycle);
            }
        }

        return faces;
    }
}
