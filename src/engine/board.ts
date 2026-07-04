import type { Board, Color, Piece, PieceType, Position, Move } from '@/types/chess';

// ── FEN ─────────────────────────────────────────────────────────────────────

const FEN_MAP: Record<string, { type: PieceType; color: Color }> = {
  K: { type: 'K', color: 'red' },
  A: { type: 'A', color: 'red' },
  E: { type: 'E', color: 'red' },
  H: { type: 'H', color: 'red' },
  R: { type: 'R', color: 'red' },
  C: { type: 'C', color: 'red' },
  P: { type: 'P', color: 'red' },
  k: { type: 'K', color: 'black' },
  a: { type: 'A', color: 'black' },
  e: { type: 'E', color: 'black' },
  h: { type: 'H', color: 'black' },
  r: { type: 'R', color: 'black' },
  c: { type: 'C', color: 'black' },
  p: { type: 'P', color: 'black' },
  // Elephant/bishop alias (standard xiangqi FEN uses B/b for 相/象)
  B: { type: 'E', color: 'red' },
  b: { type: 'E', color: 'black' },
};

export function parseFen(fen: string): Board {
  const rows = fen.split('/');
  const board: Board = Array.from({ length: 10 }, () => Array(9).fill(null));
  for (let r = 0; r < 10; r++) {
    let c = 0;
    for (const ch of rows[r] ?? '') {
      if (/\d/.test(ch)) { c += parseInt(ch); continue; }
      const p = FEN_MAP[ch];
      if (p) board[r][c++] = { ...p };
    }
  }
  return board;
}

export function boardToFen(board: Board): string {
  const revMap: Record<string, string> = {};
  for (const [ch, p] of Object.entries(FEN_MAP)) revMap[`${p.type}${p.color}`] = ch;

  return board.map(row => {
    let str = ''; let empty = 0;
    for (const cell of row) {
      if (!cell) { empty++; continue; }
      if (empty) { str += empty; empty = 0; }
      str += revMap[`${cell.type}${cell.color}`] ?? '?';
    }
    if (empty) str += empty;
    return str;
  }).join('/');
}

// ── Board helpers ────────────────────────────────────────────────────────────

export function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row <= 9 && col >= 0 && col <= 8;
}

export function pieceAt(board: Board, pos: Position): Piece | null {
  return board[pos.row]?.[pos.col] ?? null;
}

export function posEq(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function findKing(board: Board, color: Color): Position | null {
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c]?.type === 'K' && board[r][c]?.color === color)
        return { row: r, col: c };
  return null;
}

// Apply move, return new board (immutable)
export function applyMove(board: Board, move: Move): Board {
  const next = cloneBoard(board);
  next[move.to.row][move.to.col] = next[move.from.row][move.from.col];
  next[move.from.row][move.from.col] = null;
  return next;
}

// Check if the two kings face each other with no pieces between them
function kingsFacing(board: Board): boolean {
  const rk = findKing(board, 'red');
  const bk = findKing(board, 'black');
  if (!rk || !bk || rk.col !== bk.col) return false;
  for (let r = bk.row + 1; r < rk.row; r++)
    if (board[r][rk.col]) return false;
  return true;
}

// ── Move generation ──────────────────────────────────────────────────────────

function inPalace(row: number, col: number, color: Color): boolean {
  const rows = color === 'red' ? [7, 8, 9] : [0, 1, 2];
  return rows.includes(row) && col >= 3 && col <= 5;
}

function orthogonalScan(board: Board, row: number, col: number, color: Color): Position[] {
  const dests: Position[] = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color !== color) dests.push({ row: r, col: c });
        break;
      }
      dests.push({ row: r, col: c });
      r += dr; c += dc;
    }
  }
  return dests;
}

function getRawMoves(board: Board, pos: Position, piece: Piece): Position[] {
  const { row, col } = pos;
  const { type, color } = piece;
  const dests: Position[] = [];

  const add = (r: number, c: number) => {
    if (!inBounds(r, c)) return;
    const t = board[r][c];
    if (!t || t.color !== color) dests.push({ row: r, col: c });
  };

  switch (type) {
    case 'K':
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const r = row + dr, c = col + dc;
        if (inPalace(r, c, color)) add(r, c);
      }
      break;

    case 'A':
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        const r = row + dr, c = col + dc;
        if (inPalace(r, c, color)) add(r, c);
      }
      break;

    case 'E': {
      // Cannot cross river
      const maxRow = color === 'red' ? 9 : 4;
      const minRow = color === 'red' ? 5 : 0;
      for (const [dr, dc] of [[-2,-2],[-2,2],[2,-2],[2,2]]) {
        const r = row + dr, c = col + dc;
        if (!inBounds(r, c)) continue;
        if (r < minRow || r > maxRow) continue;
        // Elephant eye (blocker)
        if (board[row + dr/2][col + dc/2]) continue;
        add(r, c);
      }
      break;
    }

    case 'H': {
      for (const [dr, dc] of [[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[-1,2],[1,-2],[1,2]]) {
        const r = row + dr, c = col + dc;
        if (!inBounds(r, c)) continue;
        // Horse leg (blocker)
        const legR = row + (Math.abs(dr) === 2 ? dr/2 : 0);
        const legC = col + (Math.abs(dc) === 2 ? dc/2 : 0);
        if (board[legR][legC]) continue;
        add(r, c);
      }
      break;
    }

    case 'R':
      return orthogonalScan(board, row, col, color);

    case 'C': {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        let r = row + dr, c = col + dc;
        let jumped = false;
        while (inBounds(r, c)) {
          const p = board[r][c];
          if (!jumped) {
            if (!p) { dests.push({ row: r, col: c }); }
            else { jumped = true; }
          } else {
            if (p) {
              if (p.color !== color) dests.push({ row: r, col: c });
              break;
            }
          }
          r += dr; c += dc;
        }
      }
      break;
    }

    case 'P': {
      const forward = color === 'red' ? -1 : 1;
      const crossedRiver = color === 'red' ? row <= 4 : row >= 5;
      add(row + forward, col);
      if (crossedRiver) {
        add(row, col - 1);
        add(row, col + 1);
      }
      break;
    }
  }

  return dests;
}

// Filter moves that leave own king in check or cause kings to face
export function getLegalMoves(board: Board, pos: Position): Move[] {
  const piece = pieceAt(board, pos);
  if (!piece) return [];
  const raw = getRawMoves(board, pos, piece);
  return raw
    .map(to => ({ from: pos, to, captured: board[to.row][to.col] ?? undefined }))
    .filter(move => {
      const next = applyMove(board, move);
      if (isKingInCheck(next, piece.color)) return false;
      if (kingsFacing(next)) return false;
      return true;
    });
}

export function getAllLegalMoves(board: Board, color: Color): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p?.color === color) moves.push(...getLegalMoves(board, { row: r, col: c }));
    }
  return moves;
}

// ── Check / Checkmate ────────────────────────────────────────────────────────

export function isKingInCheck(board: Board, color: Color): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return true;
  const opp: Color = color === 'red' ? 'black' : 'red';
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p?.color !== opp) continue;
      const raw = getRawMoves(board, { row: r, col: c }, p);
      if (raw.some(pos => posEq(pos, kingPos))) return true;
    }
  // Also check kings facing
  if (kingsFacing(board)) return true;
  return false;
}

export function isCheckmate(board: Board, color: Color): boolean {
  return getAllLegalMoves(board, color).length === 0 && isKingInCheck(board, color);
}

export function isStalemate(board: Board, color: Color): boolean {
  return getAllLegalMoves(board, color).length === 0 && !isKingInCheck(board, color);
}
