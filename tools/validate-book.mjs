// Validate the solution book with the app's OWN move logic (no engine):
// from each puzzle, at red nodes play the book move; at black nodes try EVERY
// legal reply. Assert every red node has a book move and every line ends in
// black being mated. Proves the book keys match runtime and all lines win.
import { ENDGAMES } from '../src/data/endgames.ts';
import { parseFen, applyMove, getAllLegalMoves, boardToFen, isCheckmate, isStalemate } from '../src/engine/board.ts';
import { SOLUTIONS } from '../src/data/solutions.ts';

function bookMove(board) {
  const c = SOLUTIONS[boardToFen(board)];
  return c ? { from: { row: +c[0], col: +c[1] }, to: { row: +c[2], col: +c[3] } } : null;
}

let allOK = true;
for (const e of ENDGAMES) {
  const seen = new Set();
  let miss = 0, leaves = 0, maxDepth = 0, badLeaf = 0;
  // DFS over the solution tree (red = book, black = all replies)
  function dfs(board, depth) {
    maxDepth = Math.max(maxDepth, depth);
    const key = boardToFen(board);
    if (seen.has(key)) return;
    seen.add(key);
    const mv = bookMove(board);
    if (!mv) { miss++; return; }
    // validate it's a legal red move
    const legal = getAllLegalMoves(board, 'red').some(m =>
      m.from.row === mv.from.row && m.from.col === mv.from.col && m.to.row === mv.to.row && m.to.col === mv.to.col);
    if (!legal) { miss++; return; }
    const afterRed = applyMove(board, mv);
    const blackMoves = getAllLegalMoves(afterRed, 'black');
    if (blackMoves.length === 0) {
      leaves++;
      // must be black mated (checkmate or stalemate = loss in xiangqi)
      if (!(isCheckmate(afterRed, 'black') || isStalemate(afterRed, 'black'))) badLeaf++;
      return;
    }
    for (const bm of blackMoves) dfs(applyMove(afterRed, bm), depth + 1);
  }
  dfs(parseFen(e.fen), 0);
  const ok = miss === 0 && badLeaf === 0 && leaves > 0;
  if (!ok) allOK = false;
  console.log(`${ok ? '✅' : '❌'} ${e.id} ${e.title.padEnd(12)} 局面${String(seen.size).padStart(4)} 杀着叶${String(leaves).padStart(3)} 深${maxDepth}${miss ? ` 缺书${miss}` : ''}${badLeaf ? ` 坏叶${badLeaf}` : ''}`);
}
console.log(allOK ? '\n>>> 题库完整且每条线都必杀 <<<' : '\n>>> 存在缺口 <<<');
process.exit(allOK ? 0 : 1);
