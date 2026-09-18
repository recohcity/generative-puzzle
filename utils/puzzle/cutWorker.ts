/**
 * 切割 Web Worker：把 PuzzleGenerator 的同步切割计算移出主线程，
 * 避免高难度（蜂巢/碎裂/曲线等）切割时阻塞 UI 渲染与交互。
 *
 * 核心（PuzzleGenerator 及全部生成器族）保持纯计算、同步可测，
 * 本文件只是"浏览器执行壳"——Node 端 verify 脚本继续直接调用同步核心。
 */
/// <reference lib="webworker" />
import { PuzzleGenerator } from "./PuzzleGenerator";
import { CutType } from "@generative-puzzle/game-core";

export interface CutWorkerRequest {
  requestId: number;
  shape: { x: number; y: number; isOriginal?: boolean }[];
  cutType: CutType;
  cutCount: number;
  shapeType?: string;
}

export interface CutWorkerResponse {
  requestId: number;
  ok: boolean;
  pieces?: unknown[];
  originalPositions?: unknown[];
  error?: string;
}

self.onmessage = (e: MessageEvent<CutWorkerRequest>) => {
  const { requestId, shape, cutType, cutCount, shapeType } = e.data;
  try {
    const result = PuzzleGenerator.generatePuzzle(shape, cutType, cutCount, shapeType);
    const res: CutWorkerResponse = {
      requestId,
      ok: true,
      pieces: result.pieces,
      originalPositions: result.originalPositions,
    };
    (self as unknown as { postMessage: (msg: CutWorkerResponse) => void }).postMessage(res);
  } catch (err) {
    const res: CutWorkerResponse = {
      requestId,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    (self as unknown as { postMessage: (msg: CutWorkerResponse) => void }).postMessage(res);
  }
};
