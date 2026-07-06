// Verify every puzzle's true game-theoretic result with Pikafish.
// Usage: PIKAFISH_BIN=... PIKAFISH_DIR=... node tools/verify.mjs
import { ENDGAMES } from '../src/data/endgames.ts';
import { appToUciFen } from './lib/fen.mjs';
import { createEngine } from './lib/uci.mjs';

const eng = createEngine();
await eng.init({ Threads: 4, Hash: 256 });

console.log('id  标题              目标  Pikafish判定');
for (const e of ENDGAMES) {
  const uci = appToUciFen(e.fen, e.turn);
  const { scoreType, score } = await eng.analyse(uci, { movetime: 2500 });
  let verdict;
  if (scoreType === 'mate') verdict = score > 0 ? `✅红胜 杀${score}步` : `❌红负 被杀${-score}步`;
  else if (scoreType === 'cp') verdict = Math.abs(score) < 60 ? `⚠️和棋 (cp ${score})` : `${score > 0 ? '红优' : '黑优'} cp ${score}`;
  else verdict = '未知';
  console.log(`${e.id}  ${e.title.padEnd(12)}  ${String(e.targetMoves).padStart(3)}步  ${verdict}`);
}
eng.quit();
