import type { Board, Move } from '@/types/chess';
import { boardToFen } from './board';
import { SOLUTIONS } from '@/data/solutions';

/**
 * Look up the Pikafish-verified winning move for a red-to-move position.
 * Returns null if the position isn't in the offline solution book (caller
 * should then fall back to the live engine search).
 */
export function getBookMove(board: Board): Move | null {
  const code = SOLUTIONS[boardToFen(board)];
  if (!code || code.length !== 4) return null;
  return {
    from: { row: Number(code[0]), col: Number(code[1]) },
    to: { row: Number(code[2]), col: Number(code[3]) },
  };
}
