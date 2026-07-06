import type { Board, Color, Move } from '@/types/chess';
import { getBestMove } from './ai';
import type { AIRequest, AIResponse } from './ai.worker';

// Lazily-created singleton worker. Falls back to a synchronous search if Web
// Workers aren't available (e.g. during SSR or in a test environment).
let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, (move: Move | null) => void>();

function ensureWorker(): Worker | null {
  if (worker) return worker;
  if (typeof Worker === 'undefined') return null;
  try {
    worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<AIResponse>) => {
      const resolve = pending.get(e.data.id);
      if (resolve) {
        pending.delete(e.data.id);
        resolve(e.data.move);
      }
    };
    worker.onerror = () => {
      // On worker failure, reject everything so callers can fall back.
      for (const [, resolve] of pending) resolve(null);
      pending.clear();
      worker = null;
    };
    return worker;
  } catch {
    return null;
  }
}

/** Search for the best move off the main thread (keeps the UI responsive). */
export function findBestMove(board: Board, color: Color, timeMs: number): Promise<Move | null> {
  const w = ensureWorker();
  if (!w) {
    // Synchronous fallback (blocks, but keeps the game playable).
    return Promise.resolve(getBestMove(board, color, { timeMs }));
  }
  const id = nextId++;
  const req: AIRequest = { id, board, color, timeMs };
  return new Promise<Move | null>((resolve) => {
    pending.set(id, resolve);
    w.postMessage(req);
  });
}
