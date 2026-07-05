import { appToUciFen, uciMoveToApp, appMoveToUci } from './fen.mjs';

let ok = true;
const eq = (a, b, n) => {
  const p = JSON.stringify(a) === JSON.stringify(b);
  if (!p) { ok = false; console.log('❌', n, 'got', JSON.stringify(a), 'want', JSON.stringify(b)); }
  else console.log('✅', n);
};

eq(appToUciFen('2eakae2/9/9/9/9/9/9/9/9/3K1R3', 'red'), '2bakab2/9/9/9/9/9/9/9/9/3K1R3 w - - 0 1', 'FEN 象 e->b + red');
eq(appToUciFen('4k4/9/9/9/9/9/9/4H4/9/4K4', 'black'), '4k4/9/9/9/9/9/9/4N4/9/4K4 b - - 0 1', 'FEN 马 H->N + black');
eq(uciMoveToApp('c1e1'), { from: { row: 8, col: 2 }, to: { row: 8, col: 4 } }, 'move c1e1');
eq(uciMoveToApp('a0a9'), { from: { row: 9, col: 0 }, to: { row: 0, col: 0 } }, 'move a0a9');
const m = { from: { row: 9, col: 5 }, to: { row: 0, col: 5 } };
eq(appMoveToUci(m), 'f0f9', 'app->uci f0f9');
eq(uciMoveToApp(appMoveToUci(m)), m, 'round-trip');

console.log(ok ? '\n>>> FEN/着法转换全部正确 <<<' : '\n>>> 有错 <<<');
process.exit(ok ? 0 : 1);
