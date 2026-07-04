/// <reference lib="webworker" />
import type { Board, Color, Move } from '@/types/chess';
import { getBestMove } from './ai';

export interface AIRequest {
  id: number;
  board: Board;
  color: Color;
  timeMs: number;
}
export interface AIResponse {
  id: number;
  move: Move | null;
}

// Run the (blocking) search off the main thread so the UI stays responsive and
// the engine can afford to think much longer.
self.onmessage = (e: MessageEvent<AIRequest>) => {
  const { id, board, color, timeMs } = e.data;
  const move = getBestMove(board, color, { timeMs });
  const res: AIResponse = { id, move };
  (self as unknown as Worker).postMessage(res);
};
