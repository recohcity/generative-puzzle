/**
 * 切割 Worker 封装：浏览器侧异步切割 API。
 *
 * - 优先走 Web Worker（主线程不阻塞）；
 * - 抢占式：新切割请求到达时终止旧 Worker 并立即拒绝旧请求（连点/切换切割类型
 *   立即响应最新一次，不再被慢切割（如放射）排队阻塞）；
 * - Worker 不可用（SSR/无 Worker 支持/异常/超时）时自动降级为同步调用，
 *   保证切割功能任何环境下都不挂。
 * - Node 端（verify 脚本等）不依赖本文件，继续直接调用同步核心。
 */
import { PuzzleGenerator } from "./PuzzleGenerator";
import { CutType } from "@generative-puzzle/game-core";
import type { PuzzlePiece } from "@generative-puzzle/game-core";
import type { CutWorkerRequest, CutWorkerResponse } from "./cutWorker";

export interface CutResult {
  pieces: PuzzlePiece[];
  originalPositions: PuzzlePiece[];
}

let worker: Worker | null = null;
let workerBusy = false; // Worker 是否正在执行切割（忙时才需要抢占 terminate）
let requestSeq = 1;
let activeReject: ((err: Error) => void) | null = null;

// 20s：手机端首次冷启时 Worker 脚本编译可达数秒，8s 超时会导致超时→同步降级
// （主线程重算更卡，用户感知为"放射 6 秒才出"）。预创建 Worker 后冷启只在首帧。
const WORKER_TIMEOUT_MS = 20000;
export const CUT_SUPERSEDED_ERROR = "cut superseded by newer request";

function getWorker(): Worker | null {
  if (typeof window === "undefined") return null; // SSR 安全
  if (typeof Worker === "undefined") return null; // 环境无 Worker
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./cutWorker.ts", import.meta.url), { type: "module" });
    worker.onerror = () => {
      // worker 全局错误：标记失效，下次调用走降级
      workerBusy = false;
      worker = null;
    };
    return worker;
  } catch {
    worker = null;
    return null;
  }
}

function resetWorker(): void {
  // 抢占：仅当旧 Worker 仍在计算（busy）时才 terminate 并拒绝旧请求（调用方应忽略该错误）。
  // 空闲 Worker 直接复用——每次切割都重建 Worker 在移动端代价大（脚本编译/初始化），
  // 是"放射比旧版本慢很多"的主因之一。
  // 注意：被抢占的请求绝不再降级到同步（否则慢切割会同步卡死主线程）。
  if (workerBusy && worker) {
    try {
      worker.terminate();
    } catch {
      /* noop */
    }
    worker = null;
  }
  workerBusy = false;
  if (activeReject) {
    const reject = activeReject;
    activeReject = null;
    reject(new Error(CUT_SUPERSEDED_ERROR));
  }
}

function cutSync(
  shape: { x: number; y: number }[],
  cutType: CutType,
  cutCount: number,
  shapeType?: string,
): CutResult {
  const res = PuzzleGenerator.generatePuzzle(shape, cutType, cutCount, shapeType);
  return { pieces: res.pieces, originalPositions: res.originalPositions };
}

/**
 * 预创建 Worker：页面加载即触发脚本编译/初始化，让首次切割点击不再等冷启。
 * 应在应用入口（useEffect）调用一次；Worker 空闲时被复用，无额外开销。
 */
export function prewarmWorker(): void {
  if (typeof window === "undefined") return;
  getWorker();
}

export async function cutPuzzleInWorker(
  shape: { x: number; y: number }[],
  cutType: CutType,
  cutCount: number,
  shapeType?: string,
): Promise<CutResult> {
  // 抢占旧请求（连点 / 切换切割类型立即响应最新一次）
  resetWorker();

  const w = getWorker();
  if (!w) return cutSync(shape, cutType, cutCount, shapeType);

  const requestId = requestSeq++;
  const req: CutWorkerRequest = { requestId, shape, cutType, cutCount, shapeType };

  return await new Promise<CutResult>((resolve, reject) => {
    activeReject = reject;

    workerBusy = true; // 标记忙碌（供下一次请求判断是否需要抢占）

    const timeoutId = setTimeout(() => {
      cleanup();
      workerBusy = false;
      if (activeReject === reject) activeReject = null;
      reject(new Error("cut worker timeout"));
    }, WORKER_TIMEOUT_MS);

    const onMessage = (e: MessageEvent<CutWorkerResponse>) => {
      if (e.data?.requestId !== requestId) return;
      cleanup();
      workerBusy = false;
      if (activeReject === reject) activeReject = null;
      if (e.data.ok && e.data.pieces && e.data.originalPositions) {
        resolve({
          pieces: e.data.pieces as PuzzlePiece[],
          originalPositions: e.data.originalPositions as PuzzlePiece[],
        });
      } else {
        reject(new Error(e.data?.error || "cut worker error"));
      }
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      w.removeEventListener("message", onMessage);
    };

    w.addEventListener("message", onMessage);
    try {
      w.postMessage(req);
    } catch (err) {
      cleanup();
      workerBusy = false;
      if (activeReject === reject) activeReject = null;
      reject(err);
    }
  }).catch((err) => {
    // 被抢占：旧请求已被新请求取代，直接抛给调用方静默忽略（不降级同步）
    if (err instanceof Error && err.message === CUT_SUPERSEDED_ERROR) {
      throw err;
    }
    // 其他 Worker 失败 → 同步降级（保证功能）
    console.warn("[cut] worker failed, fallback to sync:", err);
    return cutSync(shape, cutType, cutCount, shapeType);
  });
}
