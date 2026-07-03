import type { Board, Color, Move } from '@/types/chess';
import {
  getAllLegalMoves, applyMove, isKingInCheck, isCheckmate,
} from './board';

// ── Piece values ─────────────────────────────────────────────────────────────

const PIECE_VALUE: Record<string, number> = {
  K: 10000, A: 120, E: 120, H: 400, R: 900, C: 450, P: 100,
};

// Positional bonuses — indexed [row][col] from red's perspective
const PAWN_TABLE_RED: number[][] = [
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [2,0,4,0,4,0,4,0,2],
  [6,10,15,18,20,18,15,10,6],
  [8,12,18,22,24,22,18,12,8],
  [4,6,8,10,12,10,8,6,4],
  [0,0,0,0,0,0,0,0,0],
];

function evaluate(board: Board, forColor: Color): number {
  let score = 0;
  const sign = forColor === 'red' ? 1 : -1;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = PIECE_VALUE[p.type] ?? 0;
      let positional = 0;
      if (p.type === 'P') {
        const row = p.color === 'red' ? r : 9 - r;
        positional = PAWN_TABLE_RED[row]?.[c] ?? 0;
      }
      score += (val + positional) * (p.color === 'red' ? sign : -sign);
    }
  }
  return score;
}

// ── Negamax with alpha-beta ──────────────────────────────────────────────────

function negamax(
  board: Board,
  color: Color,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (depth === 0) return evaluate(board, color);

  const opp: Color = color === 'red' ? 'black' : 'red';
  const moves = getAllLegalMoves(board, color);

  if (moves.length === 0) {
    if (isKingInCheck(board, color)) return -10000 + (5 - depth) * 100; // checkmate
    return 0; // stalemate
  }

  // Move ordering: captures first
  moves.sort((a, b) => {
    const ca = a.captured ? (PIECE_VALUE[a.captured.type] ?? 0) : 0;
    const cb = b.captured ? (PIECE_VALUE[b.captured.type] ?? 0) : 0;
    return cb - ca;
  });

  let best = -Infinity;
  for (const move of moves) {
    const next = applyMove(board, move);
    const score = -negamax(next, opp, depth - 1, -beta, -alpha);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

export function getBestMove(board: Board, color: Color, depth = 4): Move | null {
  const moves = getAllLegalMoves(board, color);
  if (moves.length === 0) return null;

  const opp: Color = color === 'red' ? 'black' : 'red';
  let bestMove: Move | null = null;
  let bestScore = -Infinity;

  // Check capture → checkmate first (instant win detection)
  for (const move of moves) {
    if (isCheckmate(applyMove(board, move), opp)) return move;
  }

  // Move ordering
  moves.sort((a, b) => {
    const ca = a.captured ? (PIECE_VALUE[a.captured.type] ?? 0) : 0;
    const cb = b.captured ? (PIECE_VALUE[b.captured.type] ?? 0) : 0;
    return cb - ca;
  });

  for (const move of moves) {
    const next = applyMove(board, move);
    const score = -negamax(next, opp, depth - 1, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

export function getHintMove(board: Board, color: Color): Move | null {
  return getBestMove(board, color, 4);
}
