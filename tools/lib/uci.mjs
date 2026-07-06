import { spawn } from 'node:child_process';

// Minimal UCI driver for Pikafish. Point PIKAFISH_BIN at the binary and run
// from a cwd containing pikafish.nnue (or pass cwd).
export function createEngine(bin = process.env.PIKAFISH_BIN, cwd = process.env.PIKAFISH_DIR) {
  if (!bin) throw new Error('Set PIKAFISH_BIN to the Pikafish executable path');
  const proc = spawn(bin, [], { cwd: cwd ?? undefined });
  let buf = '';
  const lines = [];
  const waiters = [];
  proc.stdout.on('data', d => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).replace(/\r$/, '').trim();
      buf = buf.slice(i + 1);
      if (line) lines.push(line);
      for (let k = waiters.length - 1; k >= 0; k--) {
        if (waiters[k].test(line)) { const w = waiters.splice(k, 1)[0]; w.resolve(line); }
      }
    }
  });
  const send = s => proc.stdin.write(s + '\n');
  const wait = test => new Promise(res => waiters.push({ test, resolve: res }));

  return {
    async init(opts = {}) {
      send('uci'); await wait(l => l === 'uciok');
      for (const [k, v] of Object.entries(opts)) send(`setoption name ${k} value ${v}`);
      send('isready'); await wait(l => l === 'readyok');
    },
    /** @returns {Promise<{move:string, scoreType?:'mate'|'cp', score?:number}>} */
    async analyse(uciFen, { movetime, depth } = {}) {
      lines.length = 0;
      send(`position fen ${uciFen}`);
      send(depth ? `go depth ${depth}` : `go movetime ${movetime ?? 1000}`);
      const bm = await wait(l => l.startsWith('bestmove'));
      const scoreLine = [...lines].reverse().find(l => l.includes(' score '));
      const m = scoreLine?.match(/score (mate|cp) (-?\d+)/);
      return { move: bm.split(' ')[1], scoreType: m?.[1], score: m ? Number(m[2]) : undefined };
    },
    quit() { try { send('quit'); } catch { /* ignore */ } proc.kill(); },
  };
}
