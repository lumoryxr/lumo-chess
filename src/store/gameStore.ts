import { create } from 'zustand';
import type { Board, Color, GameStatus, Move, Position } from '@/types/chess';
import type { Endgame } from '@/types/chess';
import { parseFen, getLegalMoves, applyMove, isCheckmate, isStalemate, isInsufficientMaterial, posEq } from '@/engine/board';
import { findBestMove } from '@/engine/aiClient';

// Think-time budgets (ms). The search runs in a Web Worker, so longer budgets
// make the engine much stronger without freezing the UI.
const AI_THINK_MS = 1500;
const HINT_THINK_MS = 3000;

interface GameStore {
  // Navigation
  view: 'library' | 'game';
  currentEndgame: Endgame | null;

  // Game state
  board: Board;
  turn: Color;
  moveHistory: Move[];
  status: GameStatus;
  winner?: Color;

  // UI state
  selected: Position | null;
  legalMoves: Move[];
  lastMove: Move | null;
  hintMove: Move | null;
  showHint: boolean;
  isThinking: boolean;
  isHinting: boolean;
  solvedIds: Set<string>;

  // Actions
  openLibrary: () => void;
  startGame: (endgame: Endgame) => void;
  selectSquare: (pos: Position) => void;
  makeMove: (move: Move) => void;
  requestHint: () => void;
  undoMove: () => void;
  resetGame: () => void;
  triggerAI: () => void;
}

const INITIAL_BOARD: Board = Array.from({ length: 10 }, () => Array(9).fill(null));

export const useGameStore = create<GameStore>((set, get) => ({
  view: 'library',
  currentEndgame: null,

  board: INITIAL_BOARD,
  turn: 'red',
  moveHistory: [],
  status: 'playing',
  winner: undefined,

  selected: null,
  legalMoves: [],
  lastMove: null,
  hintMove: null,
  showHint: false,
  isThinking: false,
  isHinting: false,
  solvedIds: new Set(),

  openLibrary: () => set({ view: 'library', selected: null, legalMoves: [], showHint: false }),

  startGame: (endgame) => {
    const board = parseFen(endgame.fen);
    set({
      view: 'game',
      currentEndgame: endgame,
      board,
      turn: endgame.turn,
      moveHistory: [],
      status: 'playing',
      winner: undefined,
      selected: null,
      legalMoves: [],
      lastMove: null,
      hintMove: null,
      showHint: false,
      isThinking: false,
      isHinting: false,
    });
  },

  selectSquare: (pos) => {
    const { board, turn, status, selected, legalMoves } = get();
    if (status !== 'playing') return;

    // Try to execute a move to this square
    if (selected) {
      const move = legalMoves.find(m => posEq(m.to, pos));
      if (move) {
        get().makeMove(move);
        return;
      }
    }

    // Select a piece
    const piece = board[pos.row][pos.col];
    if (piece?.color === turn) {
      const moves = getLegalMoves(board, pos);
      set({ selected: pos, legalMoves: moves, showHint: false });
    } else {
      set({ selected: null, legalMoves: [] });
    }
  },

  makeMove: (move) => {
    const { board, turn, moveHistory, currentEndgame, solvedIds } = get();
    const nextBoard = applyMove(board, move);
    const nextTurn: Color = turn === 'red' ? 'black' : 'red';
    const history = [...moveHistory, move];

    let status: GameStatus = 'playing';
    let winner: Color | undefined;

    // In xiangqi, a side with no legal move loses — whether by checkmate (将死)
    // or stalemate (困毙). Both count as a win for the side that just moved.
    if (isCheckmate(nextBoard, nextTurn) || isStalemate(nextBoard, nextTurn)) {
      status = 'checkmate';
      winner = turn;
      if (currentEndgame && turn === currentEndgame.turn) {
        status = 'solved';
        solvedIds.add(currentEndgame.id);
      }
    } else if (isInsufficientMaterial(nextBoard)) {
      // Neither side has a piece able to force mate → dead draw (和棋).
      status = 'draw';
    }

    set({
      board: nextBoard,
      turn: nextTurn,
      moveHistory: history,
      status,
      winner,
      selected: null,
      legalMoves: [],
      lastMove: move,
      hintMove: null,
      showHint: false,
      solvedIds: new Set(solvedIds),
    });

    // Trigger AI for black's response (if game still ongoing)
    if (status === 'playing' && nextTurn === 'black') {
      setTimeout(() => get().triggerAI(), 300);
    }
  },

  triggerAI: () => {
    const { board, turn, status } = get();
    if (status !== 'playing' || turn !== 'black') return;
    set({ isThinking: true });
    // Search off the main thread; guard against reset/undo while thinking.
    findBestMove(board, 'black', AI_THINK_MS).then(move => {
      const s = get();
      if (s.board !== board || s.status !== 'playing' || s.turn !== 'black') {
        set({ isThinking: false });
        return;
      }
      set({ isThinking: false });
      if (move) get().makeMove(move);
    });
  },

  requestHint: () => {
    const { board, turn, status, isHinting } = get();
    if (status !== 'playing' || turn !== 'red' || isHinting) return;
    set({ isHinting: true, showHint: false });
    findBestMove(board, 'red', HINT_THINK_MS).then(move => {
      // Ignore a stale hint if the board changed while computing.
      if (get().board !== board) { set({ isHinting: false }); return; }
      set({ hintMove: move, showHint: !!move, isHinting: false });
    });
  },

  undoMove: () => {
    const { moveHistory, currentEndgame } = get();
    // Undo two moves (player + AI)
    const undoCount = moveHistory.length >= 2 ? 2 : moveHistory.length;
    if (undoCount === 0 || !currentEndgame) return;

    const history = moveHistory.slice(0, moveHistory.length - undoCount);
    let board = parseFen(currentEndgame.fen);
    for (const m of history) board = applyMove(board, m);

    set({
      board,
      turn: currentEndgame.turn,
      moveHistory: history,
      status: 'playing',
      winner: undefined,
      selected: null,
      legalMoves: [],
      lastMove: history[history.length - 1] ?? null,
      hintMove: null,
      showHint: false,
    });

    // Re-align turn
    const newTurn: Color = history.length % 2 === 0 ? currentEndgame.turn : (currentEndgame.turn === 'red' ? 'black' : 'red');
    set({ turn: newTurn });
  },

  resetGame: () => {
    const { currentEndgame } = get();
    if (!currentEndgame) return;
    get().startGame(currentEndgame);
  },
}));
