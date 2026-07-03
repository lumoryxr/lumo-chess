// PieceType: K=King A=Advisor E=Elephant H=Horse R=Rook C=Cannon P=Pawn
export type PieceType = 'K' | 'A' | 'E' | 'H' | 'R' | 'C' | 'P';
export type Color = 'red' | 'black';

export interface Piece {
  type: PieceType;
  color: Color;
}

export interface Position {
  row: number; // 0=top(black back rank) … 9=bottom(red back rank)
  col: number; // 0=left … 8=right
}

export interface Move {
  from: Position;
  to: Position;
  captured?: Piece;
}

// 10 rows × 9 cols
export type Board = (Piece | null)[][];

export type GameStatus = 'playing' | 'checkmate' | 'stalemate' | 'solved';

export interface GameState {
  board: Board;
  turn: Color;
  moveHistory: Move[];
  status: GameStatus;
  winner?: Color;
  hintMove?: Move;
  lastMove?: Move;
}

export type Difficulty = '入门' | '初级' | '中级' | '高级' | '大师';

export interface Endgame {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: Difficulty;
  fen: string;          // starting position (UCCI-style FEN)
  turn: Color;          // who moves first
  goal: string;         // e.g. "红先胜" / "红先和"
  targetMoves: number;  // min moves to solve
  solution: string[];   // moves in algebraic notation (for hints)
  description: string;
}
