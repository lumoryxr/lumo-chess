import type { Board, Color, Move } from '@/types/chess';
import {
  getAllLegalMoves, applyMove, isKingInCheck, findKing,
} from './board';

// ── Material values (kings handled via mate scores, not material) ─────────────

const PIECE_VALUE: Record<string, number> = {
  K: 0, R: 1200, H: 600, C: 600, A: 150, E: 150, P: 100,
};

const MATE = 100000;

// ── Piece-square tables (red's perspective; row 0 = black back rank/top) ──────
// Higher = better square for a RED piece there. Black pieces mirror row → 9-r.
// Magnitudes kept small so material stays dominant; these only break ties.

const ROOK_PST: number[][] = [
  [14,14,12,18,16,18,12,14,14],
  [16,20,18,24,26,24,18,20,16],
  [12,12,12,18,18,18,12,12,12],
  [12,18,16,22,22,22,16,18,12],
  [12,14,12,18,18,18,12,14,12],
  [12,16,14,20,20,20,14,16,12],
  [ 6,10, 8,14,14,14, 8,10, 6],
  [ 4, 8, 6,14,12,14, 6, 8, 4],
  [ 8, 4, 8,16, 8,16, 8, 4, 8],
  [-2,10, 6,14,12,14, 6,10,-2],
];

const HORSE_PST: number[][] = [
  [ 4, 8,16,12, 4,12,16, 8, 4],
  [ 4,10,28,16, 8,16,28,10, 4],
  [12,14,16,20,18,20,16,14,12],
  [ 8,24,18,24,20,24,18,24, 8],
  [ 6,16,14,18,16,18,14,16, 6],
  [ 4,12,16,14,12,14,16,12, 4],
  [ 2, 6, 8, 6,10, 6, 8, 6, 2],
  [ 4, 2, 8, 8, 4, 8, 8, 2, 4],
  [ 0, 2, 4, 4,-2, 4, 4, 2, 0],
  [ 0,-4, 0, 0, 0, 0, 0,-4, 0],
];

const CANNON_PST: number[][] = [
  [ 6, 4, 0,-10,-12,-10, 0, 4, 6],
  [ 2, 2, 0, -4, -6, -4, 0, 2, 2],
  [ 2, 2, 0, -8, -6, -8, 0, 2, 2],
  [ 0, 0, 2,  6,  6,  6, 2, 0, 0],
  [ 0, 0, 4,  6,  8,  6, 4, 0, 0],
  [ 0, 2, 4,  6,  8,  6, 4, 2, 0],
  [ 0, 0, 2,  4,  6,  4, 2, 0, 0],
  [ 2, 2, 2,  4,  4,  4, 2, 2, 2],
  [ 4, 4, 4,  6,  8,  6, 4, 4, 4],
  [ 2, 4, 4,  6,  6,  6, 4, 4, 2],
];

const PAWN_PST: number[][] = [
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [16,20,24,28,32,28,24,20,16],
  [16,20,24,28,32,28,24,20,16],
  [14,18,20,24,26,24,20,18,14],
  [10,14,16,20,22,20,16,14,10],
  [ 4, 0, 8, 0, 8, 0, 8, 0, 4],
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const PST: Record<string, number[][] | undefined> = {
  R: ROOK_PST, H: HORSE_PST, C: CANNON_PST, P: PAWN_PST,
};

// ── Mate / king-hunt heuristic ────────────────────────────────────────────────
// The key term that makes single-rook (and similar) endgames winnable: reward
// driving the enemy king toward its back rank & the palace corners, shrinking
// its mobility, and keeping it in check.

function kingMobility(board: Board, kingR: number, kingC: number, color: Color): number {
  let n = 0;
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const r = kingR + dr, c = kingC + dc;
    const inPalace = c >= 3 && c <= 5 && (color === 'red' ? r >= 7 && r <= 9 : r >= 0 && r <= 2);
    if (!inPalace) continue;
    const t = board[r][c];
    if (!t || t.color !== color) n++;
  }
  return n;
}

// Pressure that `attacker` applies to `defender`'s king. Only meaningful when the
// attacker actually has mating material and the defender has no rook of its own.
function matePressure(board: Board, attacker: Color, defender: Color): number {
  // Require a rook (or two heavy pieces) to bother hunting the king.
  let attackerRooks = 0, attackerHeavy = 0, defenderRook = 0;
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) {
    const p = board[r][c];
    if (!p) continue;
    if (p.color === attacker) {
      if (p.type === 'R') attackerRooks++;
      if (p.type === 'R' || p.type === 'H' || p.type === 'C') attackerHeavy++;
    } else if (p.color === defender && p.type === 'R') defenderRook++;
  }
  if (defenderRook > 0) return 0;
  if (attackerRooks === 0 && attackerHeavy < 2) return 0;

  const dk = findKing(board, defender);
  if (!dk) return 0;

  // Push toward own back rank: black back rank = row 0, red = row 9.
  const backRankDist = defender === 'red' ? 9 - dk.row : dk.row; // 0 when on back rank
  const pushToBack = (2 - Math.min(backRankDist, 2)) * 10;       // 0..20
  const sideward = Math.abs(dk.col - 4) * 6;                     // corners of palace worse for defender
  const mobility = kingMobility(board, dk.row, dk.col, defender);
  const confine = (4 - mobility) * 9;                            // fewer king escapes = better
  const inCheck = isKingInCheck(board, defender) ? 14 : 0;

  // Bring short-range attackers (马/炮) toward the enemy king — without this the
  // engine confines the king but never marches its pieces in to finish (e.g. 马后炮).
  let proximity = 0;
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) {
    const p = board[r][c];
    if (p && p.color === attacker && (p.type === 'H' || p.type === 'C')) {
      proximity += 13 - (Math.abs(r - dk.row) + Math.abs(c - dk.col));
    }
  }

  return pushToBack + sideward + confine + inCheck + proximity * 2;
}

// ── Evaluation (advantage for `forColor`, positive = good) ────────────────────

function evaluate(board: Board, forColor: Color): number {
  let score = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p) continue;
      const material = PIECE_VALUE[p.type] ?? 0;
      const table = PST[p.type];
      const positional = table ? (p.color === 'red' ? table[r][c] : table[9 - r][c]) : 0;
      const val = material + positional;
      score += p.color === forColor ? val : -val;
    }
  }
  const opp: Color = forColor === 'red' ? 'black' : 'red';
  score += matePressure(board, forColor, opp);
  score -= matePressure(board, opp, forColor);
  return score;
}

// ── Transposition table ───────────────────────────────────────────────────────

type TTFlag = 'exact' | 'lower' | 'upper';
interface TTEntry { depth: number; score: number; flag: TTFlag; move: Move | null; }
const tt = new Map<string, TTEntry>();

function boardKey(board: Board, color: Color): string {
  let s = color === 'red' ? 'r' : 'b';
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      s += p ? (p.color === 'red' ? p.type : p.type.toLowerCase()) : '.';
    }
  }
  return s;
}

// ── Move ordering ─────────────────────────────────────────────────────────────

function mvvLva(m: Move): number {
  if (!m.captured) return 0;
  return (PIECE_VALUE[m.captured.type] ?? 0) * 10;
}

function orderMoves(moves: Move[], ttMove: Move | null): Move[] {
  return moves.sort((a, b) => {
    const at = ttMove && sameMove(a, ttMove) ? 1_000_000 : 0;
    const bt = ttMove && sameMove(b, ttMove) ? 1_000_000 : 0;
    return (bt + mvvLva(b)) - (at + mvvLva(a));
  });
}

function sameMove(a: Move, b: Move): boolean {
  return a.from.row === b.from.row && a.from.col === b.from.col
    && a.to.row === b.to.row && a.to.col === b.to.col;
}

// ── Search ────────────────────────────────────────────────────────────────────

let deadline = 0;
let nodes = 0;
let aborted = false;

function timeUp(): boolean {
  if (aborted) return true;
  if ((nodes & 1023) === 0 && Date.now() > deadline) aborted = true;
  return aborted;
}

// Quiescence: only extend on captures so we don't stop mid-exchange.
function quiescence(board: Board, color: Color, alpha: number, beta: number, ply: number): number {
  nodes++;
  const stand = evaluate(board, color);
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;

  const opp: Color = color === 'red' ? 'black' : 'red';
  const caps = getAllLegalMoves(board, color).filter(m => m.captured);
  orderMoves(caps, null);
  for (const move of caps) {
    if (timeUp()) break;
    const score = -quiescence(applyMove(board, move), opp, -beta, -alpha, ply + 1);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(board: Board, color: Color, depth: number, alpha: number, beta: number, ply: number): number {
  nodes++;
  if (timeUp()) return alpha;

  const opp: Color = color === 'red' ? 'black' : 'red';
  const moves = getAllLegalMoves(board, color);

  // No legal moves: in xiangqi both checkmate (将死) and stalemate (困毙) lose.
  if (moves.length === 0) return -(MATE - ply);
  if (depth === 0) return quiescence(board, color, alpha, beta, ply);

  // The transposition key is costly to build, so only use it at deeper nodes —
  // near-leaf nodes (the vast majority) skip it and just search.
  const useTT = depth >= 2;
  let key = '';
  let entry: TTEntry | undefined;
  if (useTT) {
    key = boardKey(board, color);
    entry = tt.get(key);
    if (entry && entry.depth >= depth) {
      if (entry.flag === 'exact') return entry.score;
      if (entry.flag === 'lower' && entry.score > alpha) alpha = entry.score;
      else if (entry.flag === 'upper' && entry.score < beta) beta = entry.score;
      if (alpha >= beta) return entry.score;
    }
  }

  orderMoves(moves, entry?.move ?? null);

  const alphaOrig = alpha;
  let best = -Infinity;
  let bestMove: Move | null = null;
  for (const move of moves) {
    const score = -negamax(applyMove(board, move), opp, depth - 1, -beta, -alpha, ply + 1);
    if (score > best) { best = score; bestMove = move; }
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }

  if (useTT) {
    const flag: TTFlag = best <= alphaOrig ? 'upper' : best >= beta ? 'lower' : 'exact';
    tt.set(key, { depth, score: best, flag, move: bestMove });
  }
  return best;
}

interface SearchResult { move: Move | null; score: number; }

function rootSearch(board: Board, color: Color, depth: number, pvMove: Move | null): SearchResult {
  const opp: Color = color === 'red' ? 'black' : 'red';
  const moves = getAllLegalMoves(board, color);
  if (moves.length === 0) return { move: null, score: -(MATE) };
  orderMoves(moves, pvMove);

  let alpha = -Infinity;
  let bestMove: Move | null = moves[0];
  let bestScore = -Infinity;
  for (const move of moves) {
    if (timeUp()) break;
    const score = -negamax(applyMove(board, move), opp, depth - 1, -Infinity, -alpha, 1);
    if (score > bestScore) { bestScore = score; bestMove = move; }
    if (score > alpha) alpha = score;
  }
  return { move: bestMove, score: bestScore };
}

/**
 * Iterative-deepening search with a time budget. Returns the best move found.
 */
export function getBestMove(board: Board, color: Color, opts: { maxDepth?: number; timeMs?: number } = {}): Move | null {
  const timeMs = opts.timeMs ?? 700;

  // Endgames are sparse, so branching is tiny — let the search run much deeper
  // when few pieces remain (this is what lets technical mates like 马后炮 convert).
  // The time budget stays the real limiter via iterative deepening.
  let pieces = 0;
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) if (board[r][c]) pieces++;
  const depthCap = pieces <= 6 ? 24 : pieces <= 10 ? 14 : 10;
  const maxDepth = Math.min(opts.maxDepth ?? depthCap, depthCap);

  deadline = Date.now() + timeMs;
  nodes = 0;
  aborted = false;
  if (tt.size > 200_000) tt.clear();

  let best: Move | null = null;
  for (let d = 1; d <= maxDepth; d++) {
    const res = rootSearch(board, color, d, best);
    if (aborted && d > 1) break; // keep the last fully-searched depth's result
    if (res.move) { best = res.move; }
    if (Math.abs(res.score) > MATE - 1000) break; // forced mate found — no need to search deeper
  }
  return best;
}

// The opponent AI thinks a little faster; the hint is allowed to think longer.
// Depth is chosen adaptively from the piece count inside getBestMove.
export function getAIMove(board: Board, color: Color): Move | null {
  return getBestMove(board, color, { timeMs: 700 });
}

export function getHintMove(board: Board, color: Color): Move | null {
  return getBestMove(board, color, { timeMs: 1500 });
}
