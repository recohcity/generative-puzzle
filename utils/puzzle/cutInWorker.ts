/**
 * 切割 Worker 封装：浏览器侧异步切割 API。
 *
 * - 优先走 Web Worker（主线程不阻塞）；
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
let requestSeq = 1;

const WORKER_TIMEOUT_MS = 8000;

function getWorker(): Worker | null {
  if (typeof window === "undefined") return null; // SSR 安全
  if (typeof Worker === "undefined") return null; // 环境无 Worker
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./cutWorker.ts", import.meta.url), { type: "module" });
    worker.onerror = () => {
      // worker 全局错误：标记失效，下次调用走降级
      worker = null;
    };
    return worker;
  } catch {
    worker = null;
    return null;
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

export async function cutPuzzleInWorker(
  shape: { x: number; y: number }[],
  cutType: CutType,
  cutCount: number,
  shapeType?: string,
): Promise<CutResult> {
  const w = getWorker();
  if (!w) return cutSync(shape, cutType, cutCount, shapeType);

  const requestId = requestSeq++;
  const req: CutWorkerRequest = { requestId, shape, cutType, cutCount, shapeType };

  return await new Promise<CutResult>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("cut worker timeout"));
    }, WORKER_TIMEOUT_MS);

    const onMessage = (e: MessageEvent<CutWorkerResponse>) => {
      if (e.data?.requestId !== requestId) return;
      cleanup();
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
      reject(err);
    }
  }).catch((err) => {
    // 任何 Worker 失败 → 同步降级（保证功能）
    console.warn("[cut] worker failed, fallback to sync:", err);
    return cutSync(shape, cutType, cutCount, shapeType);
  });
}
