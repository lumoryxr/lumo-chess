import type { Piece } from '@/types/chess';

const PIECE_CHARS: Record<string, { red: string; black: string }> = {
  K: { red: '帅', black: '将' },
  A: { red: '仕', black: '士' },
  E: { red: '相', black: '象' },
  H: { red: '马', black: '马' },
  R: { red: '车', black: '车' },
  C: { red: '炮', black: '炮' },
  P: { red: '兵', black: '卒' },
};

interface ChessPieceProps {
  piece: Piece;
  cx: number;
  cy: number;
  radius: number;
  isSelected?: boolean;
  isHint?: boolean;
  isLast?: boolean;
  onClick?: () => void;
}

export function ChessPiece({ piece, cx, cy, radius, isSelected, isHint, isLast, onClick }: ChessPieceProps) {
  const isRed = piece.color === 'red';
  const char = PIECE_CHARS[piece.type]?.[piece.color] ?? '?';
  const fontSize = radius * 0.82;

  // Colors
  const bgColor = isRed ? '#c0392b' : '#1c1c1e';
  const borderColor = isRed ? '#e74c3c' : '#4a4a4e';
  const innerBorderColor = isRed ? '#f5a39a' : '#6a6a6e';
  const textColor = isRed ? '#fff5e0' : '#f0f0f0';

  let glowClass = '';
  if (isSelected) glowClass = 'piece-glow-selected';
  else if (isHint) glowClass = 'piece-glow-hint';
  else if (isLast) glowClass = 'piece-glow-last';

  return (
    <g
      className={`cursor-pointer ${glowClass}`}
      onClick={onClick}
      style={{ transition: 'filter 0.15s' }}
    >
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={radius} fill={borderColor} />
      {/* Inner background */}
      <circle cx={cx} cy={cy} r={radius - 2.5} fill={bgColor} />
      {/* Inner decorative ring */}
      <circle cx={cx} cy={cy} r={radius - 5} fill="none" stroke={innerBorderColor} strokeWidth={1} opacity={0.6} />
      {/* Piece character */}
      <text
        x={cx}
        y={cy}
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={fontSize}
        fontFamily="'Noto Serif SC', 'SimSun', serif"
        fontWeight="600"
        fill={textColor}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {char}
      </text>
      {/* Selection highlight overlay */}
      {isSelected && (
        <circle cx={cx} cy={cy} r={radius} fill="rgba(251,191,36,0.15)" stroke="rgba(251,191,36,0.8)" strokeWidth={2.5} />
      )}
    </g>
  );
}
