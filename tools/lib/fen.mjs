// Translation between the app's internal notation and Pikafish/UCI xiangqi notation.
//
// Board layout is identical (row 0 = top = black back rank, uppercase = red).
// Only piece letters differ:  app 马=H/h ↔ UCI 马=N/n,  app 象=E/e ↔ UCI 象=B/b.
// Coordinates:  UCI square = <file a-i><rank 0-9>, rank 0 = bottom (app row 9).
//   app (row,col)  →  file = 'a'+col,  rank = 9-row
//   UCI  frFrToTr  →  {row: 9-rank, col: file-'a'}

const APP_TO_UCI_PIECE = { H: 'N', h: 'n', E: 'B', e: 'b' };
const UCI_TO_APP_PIECE = { N: 'H', n: 'h', B: 'E', b: 'e' };

/** app FEN board (10 rows, no side field) + turn → full UCI FEN string. */
export function appToUciFen(appFen, turn) {
  const board = appFen.split(' ')[0];
  const translated = [...board].map(ch => APP_TO_UCI_PIECE[ch] ?? ch).join('');
  return `${translated} ${turn === 'red' ? 'w' : 'b'} - - 0 1`;
}

/** UCI FEN board field → app board FEN (no side field). */
export function uciToAppFenBoard(uciFen) {
  const board = uciFen.split(' ')[0];
  return [...board].map(ch => UCI_TO_APP_PIECE[ch] ?? ch).join('');
}

/** UCI move string e.g. "c1e1" → { from:{row,col}, to:{row,col} } in app coords. */
export function uciMoveToApp(uci) {
  const f = (fileCh, rankCh) => ({ row: 9 - Number(rankCh), col: fileCh.charCodeAt(0) - 97 });
  return { from: f(uci[0], uci[1]), to: f(uci[2], uci[3]) };
}

/** app move { from:{row,col}, to:{row,col} } → UCI move string. */
export function appMoveToUci(move) {
  const sq = ({ row, col }) => `${String.fromCharCode(97 + col)}${9 - row}`;
  return sq(move.from) + sq(move.to);
}
