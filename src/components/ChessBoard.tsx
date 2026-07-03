import React, { useCallback } from 'react';
import type { Position } from '@/types/chess';
import { useGameStore } from '@/store/gameStore';
import { ChessPiece } from './ChessPiece';
import { posEq } from '@/engine/board';

const CELL = 62;
const PAD = 44;
const RADIUS = 26;
const W = 8 * CELL + 2 * PAD;
const H = 9 * CELL + 2 * PAD;

function cx(col: number) { return PAD + col * CELL; }
function cy(row: number) { return PAD + row * CELL; }

export function ChessBoard() {
  const { board, selected, legalMoves, lastMove, hintMove, showHint, status, selectSquare } = useGameStore();

  const handleSquareClick = useCallback((pos: Position) => {
    if (status !== 'playing') return;
    selectSquare(pos);
  }, [status, selectSquare]);

  return (
    <div className="select-none">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
      >
        {/* Board background */}
        <rect width={W} height={H} rx={12} fill="#f0c060" />
        <rect x={4} y={4} width={W-8} height={H-8} rx={9} fill="#e8b84b" />

        {/* Grid lines */}
        <BoardLines />

        {/* River decoration */}
        <RiverDecoration />

        {/* Palace diagonals */}
        <PalaceLines />

        {/* Soldier position marks */}
        <SoldierMarks />

        {/* Legal move targets */}
        {legalMoves.map((m, i) => {
          const hasCapture = !!board[m.to.row][m.to.col];
          return (
            <g key={i} onClick={() => handleSquareClick(m.to)} className="cursor-pointer">
              {hasCapture ? (
                // Capture indicator: corner marks
                <>
                  {[[-1,-1],[-1,1],[1,-1],[1,1]].map(([dr,dc], j) => (
                    <path
                      key={j}
                      d={`M ${cx(m.to.col)+dc*RADIUS} ${cy(m.to.row)+dr*(RADIUS-8)} L ${cx(m.to.col)+dc*RADIUS} ${cy(m.to.row)+dr*RADIUS} L ${cx(m.to.col)+dc*(RADIUS-8)} ${cy(m.to.row)+dr*RADIUS}`}
                      stroke="rgba(251,191,36,0.9)"
                      strokeWidth={3}
                      fill="none"
                      strokeLinecap="round"
                    />
                  ))}
                </>
              ) : (
                <circle
                  cx={cx(m.to.col)}
                  cy={cy(m.to.row)}
                  r={10}
                  fill="rgba(251,191,36,0.5)"
                  stroke="rgba(251,191,36,0.7)"
                  strokeWidth={1.5}
                />
              )}
            </g>
          );
        })}

        {/* Hint move highlight */}
        {showHint && hintMove && (
          <>
            <circle cx={cx(hintMove.from.col)} cy={cy(hintMove.from.row)} r={RADIUS + 4}
              fill="none" stroke="rgba(74,222,128,0.7)" strokeWidth={3} strokeDasharray="6 3" />
            <circle cx={cx(hintMove.to.col)} cy={cy(hintMove.to.row)} r={12}
              fill="rgba(74,222,128,0.4)" stroke="rgba(74,222,128,0.7)" strokeWidth={2} />
          </>
        )}

        {/* Last move highlight */}
        {lastMove && (
          <>
            <circle cx={cx(lastMove.from.col)} cy={cy(lastMove.from.row)} r={RADIUS + 2}
              fill="rgba(96,165,250,0.12)" stroke="rgba(96,165,250,0.4)" strokeWidth={1.5} />
            <circle cx={cx(lastMove.to.col)} cy={cy(lastMove.to.row)} r={RADIUS + 2}
              fill="rgba(96,165,250,0.12)" stroke="rgba(96,165,250,0.4)" strokeWidth={1.5} />
          </>
        )}

        {/* Pieces */}
        {board.map((row, r) =>
          row.map((piece, c) => {
            if (!piece) return null;
            const pos = { row: r, col: c };
            const isSel = selected ? posEq(selected, pos) : false;
            const isHintPiece = showHint && hintMove ? posEq(hintMove.from, pos) : false;
            const isLastPiece = lastMove ? posEq(lastMove.to, pos) : false;
            return (
              <ChessPiece
                key={`${r}-${c}`}
                piece={piece}
                cx={cx(c)}
                cy={cy(r)}
                radius={RADIUS}
                isSelected={isSel}
                isHint={isHintPiece && !isSel}
                isLast={isLastPiece && !isSel}
                onClick={() => handleSquareClick(pos)}
              />
            );
          })
        )}

        {/* Click zones for empty squares */}
        {Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 9 }, (_, c) => {
            if (board[r][c]) return null;
            return (
              <rect
                key={`z-${r}-${c}`}
                x={cx(c) - CELL / 2}
                y={cy(r) - CELL / 2}
                width={CELL}
                height={CELL}
                fill="transparent"
                onClick={() => handleSquareClick({ row: r, col: c })}
                className="cursor-pointer"
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

function BoardLines() {
  const lines: React.JSX.Element[] = [];
  // Horizontal lines (10)
  for (let r = 0; r < 10; r++) {
    lines.push(
      <line key={`h${r}`} x1={cx(0)} y1={cy(r)} x2={cx(8)} y2={cy(r)}
        stroke="#8B5E1A" strokeWidth={r === 0 || r === 9 ? 2.5 : 1.2} />
    );
  }
  // Vertical lines (9), with river gap in middle
  for (let c = 0; c < 9; c++) {
    if (c === 0 || c === 8) {
      lines.push(
        <line key={`v${c}`} x1={cx(c)} y1={cy(0)} x2={cx(c)} y2={cy(9)}
          stroke="#8B5E1A" strokeWidth={2.5} />
      );
    } else {
      // Top half (rows 0-4)
      lines.push(
        <line key={`v${c}t`} x1={cx(c)} y1={cy(0)} x2={cx(c)} y2={cy(4)}
          stroke="#8B5E1A" strokeWidth={1.2} />
      );
      // Bottom half (rows 5-9)
      lines.push(
        <line key={`v${c}b`} x1={cx(c)} y1={cy(5)} x2={cx(c)} y2={cy(9)}
          stroke="#8B5E1A" strokeWidth={1.2} />
      );
    }
  }
  return <>{lines}</>;
}

function RiverDecoration() {
  const riverY = (cy(4) + cy(5)) / 2;
  return (
    <>
      <text x={W / 2 - 80} y={riverY + 7} textAnchor="middle"
        fontSize={20} fontFamily="'Noto Serif SC', serif" fill="#7a4f1a" opacity={0.7} letterSpacing={4}>
        楚
      </text>
      <text x={W / 2 - 20} y={riverY + 7} textAnchor="middle"
        fontSize={20} fontFamily="'Noto Serif SC', serif" fill="#7a4f1a" opacity={0.7} letterSpacing={4}>
        河
      </text>
      <text x={W / 2 + 40} y={riverY + 7} textAnchor="middle"
        fontSize={20} fontFamily="'Noto Serif SC', serif" fill="#7a4f1a" opacity={0.7} letterSpacing={4}>
        汉
      </text>
      <text x={W / 2 + 100} y={riverY + 7} textAnchor="middle"
        fontSize={20} fontFamily="'Noto Serif SC', serif" fill="#7a4f1a" opacity={0.7} letterSpacing={4}>
        界
      </text>
    </>
  );
}

function PalaceLines() {
  const diags: { r1:number; c1:number; r2:number; c2:number }[] = [
    // Black palace (rows 0-2, cols 3-5)
    { r1:0, c1:3, r2:2, c2:5 }, { r1:0, c1:5, r2:2, c2:3 },
    // Red palace (rows 7-9, cols 3-5)
    { r1:7, c1:3, r2:9, c2:5 }, { r1:7, c1:5, r2:9, c2:3 },
  ];
  return (
    <>
      {diags.map((d, i) => (
        <line key={i}
          x1={cx(d.c1)} y1={cy(d.r1)} x2={cx(d.c2)} y2={cy(d.r2)}
          stroke="#8B5E1A" strokeWidth={1.2} />
      ))}
    </>
  );
}

function SoldierMarks() {
  // Soldier positions: rows 3,6, cols 0,2,4,6,8 and rows 2,7 cols 1,7
  const positions = [
    // Red soldiers row 6
    ...[0,2,4,6,8].map(c => ({ r: 6, c })),
    // Black soldiers row 3
    ...[0,2,4,6,8].map(c => ({ r: 3, c })),
    // Cannon positions row 2 and 7
    ...[1,7].map(c => ({ r: 2, c })),
    ...[1,7].map(c => ({ r: 7, c })),
  ];

  const Mark = ({ x, y }: { x: number; y: number }) => {
    const s = 7;
    const marks = [];
    for (const [sr, sc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      const ix = x + sc * (s + 3);
      const iy = y + sr * (s + 3);
      // Only draw the outside arms
      marks.push(
        <path key={`${ix}${iy}`}
          d={`M ${ix} ${iy - sr*s} L ${ix} ${iy} L ${ix - sc*s} ${iy}`}
          stroke="#8B5E1A" strokeWidth={1.2} fill="none" opacity={0.7} strokeLinecap="round" />
      );
    }
    return <>{marks}</>;
  };

  return (
    <>
      {positions.map((p, i) => (
        <Mark key={i} x={cx(p.c)} y={cy(p.r)} />
      ))}
    </>
  );
}
