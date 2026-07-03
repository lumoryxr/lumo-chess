import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

const difficultyColor: Record<string, string> = {
  '入门': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  '初级': 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  '中级': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  '高级': 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  '大师': 'text-red-400 bg-red-400/10 border-red-400/30',
};

export function GamePanel() {
  const {
    currentEndgame, status, winner, turn, moveHistory,
    requestHint, undoMove, resetGame, openLibrary, isThinking,
  } = useGameStore();

  if (!currentEndgame) return null;

  const isGameOver = status !== 'playing';

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Puzzle info card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">{currentEndgame.title}</h2>
            <p className="text-sm text-white/50 mt-0.5">{currentEndgame.subtitle}</p>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${difficultyColor[currentEndgame.difficulty] ?? ''}`}>
            {currentEndgame.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/60 mb-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            {currentEndgame.category}
          </span>
          <span>·</span>
          <span>目标 {currentEndgame.targetMoves} 步内</span>
          <span>·</span>
          <span className="text-amber-300 font-medium">{currentEndgame.goal}</span>
        </div>
        <p className="text-sm text-white/50 leading-relaxed">{currentEndgame.description}</p>
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        {isGameOver ? (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-2xl p-5 border text-center ${
              status === 'solved'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : status === 'checkmate' && winner !== currentEndgame.turn
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            {status === 'solved' && (
              <>
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-emerald-400 font-bold text-lg">残局破解！</div>
                <div className="text-white/50 text-sm mt-1">共走 {moveHistory.length} 步</div>
              </>
            )}
            {status === 'checkmate' && winner !== currentEndgame.turn && (
              <>
                <div className="text-4xl mb-2">😔</div>
                <div className="text-red-400 font-bold text-lg">被将死了</div>
                <div className="text-white/50 text-sm mt-1">再想想其他路线</div>
              </>
            )}
            {status === 'checkmate' && winner === currentEndgame.turn && (
              <>
                <div className="text-4xl mb-2">✓</div>
                <div className="text-amber-400 font-bold text-lg">将死对方</div>
              </>
            )}
            {status === 'stalemate' && (
              <>
                <div className="text-4xl mb-2">🤝</div>
                <div className="text-white/70 font-bold text-lg">逼和</div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${turn === 'red' ? 'bg-red-500' : 'bg-white/60'} ${isThinking ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium text-white/80">
                {isThinking ? '对方思考中…' : turn === 'red' ? '红方走棋' : '黑方走棋'}
              </span>
            </div>
            <span className="text-xs text-white/40">第 {Math.ceil((moveHistory.length + 1) / 2)} 回合</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={requestHint}
          disabled={isGameOver || turn !== 'red' || isThinking}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          提示
        </button>

        <button
          onClick={undoMove}
          disabled={moveHistory.length === 0 || isThinking}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
          </svg>
          悔棋
        </button>

        <button
          onClick={resetGame}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-6.3 2.52M3 12a9 9 0 0 0 9 9 9 9 0 0 0 6.3-2.52"/>
            <path d="M3 3v5h5M21 21v-5h-5"/>
          </svg>
          重置
        </button>

        <button
          onClick={openLibrary}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          残局库
        </button>
      </div>

      {/* Move history */}
      {moveHistory.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-xs font-medium text-white/40 mb-3 uppercase tracking-wider">走棋记录</div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {moveHistory.map((m, i) => {
              const cols = 'abcdefghi';
              const from = `${cols[m.from.col]}${10 - m.from.row}`;
              const to = `${cols[m.to.col]}${10 - m.to.row}`;
              const isRed = i % 2 === 0;
              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-mono ${
                    isRed ? 'bg-red-500/10 text-red-300' : 'bg-white/5 text-white/50'
                  }`}
                >
                  {Math.floor(i / 2) + 1}.{isRed ? '' : '.'} {from}→{to}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
