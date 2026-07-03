import { useState } from 'react';
import { motion } from 'framer-motion';
import { ENDGAMES, DIFFICULTIES } from '@/data/endgames';
import type { Endgame } from '@/types/chess';
import { useGameStore } from '@/store/gameStore';

const difficultyColor: Record<string, string> = {
  '入门': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
  '初级': 'text-sky-400 bg-sky-400/10 border-sky-400/25',
  '中级': 'text-amber-400 bg-amber-400/10 border-amber-400/25',
  '高级': 'text-orange-400 bg-orange-400/10 border-orange-400/25',
  '大师': 'text-red-400 bg-red-400/10 border-red-400/25',
};

const difficultyDot: Record<string, string> = {
  '入门': 'bg-emerald-400',
  '初级': 'bg-sky-400',
  '中级': 'bg-amber-400',
  '高级': 'bg-orange-400',
  '大师': 'bg-red-400',
};

export function EndgameLibrary() {
  const { startGame, solvedIds } = useGameStore();
  const [filter, setFilter] = useState<string>('全部');

  const filtered = filter === '全部' ? ENDGAMES : ENDGAMES.filter(e => e.difficulty === filter);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Header */}
      <div className="border-b border-white/8">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <span className="text-red-400 font-bold text-sm">象</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">象棋残局</h1>
              <p className="text-xs text-white/40 mt-0.5">LumoChess</p>
            </div>
          </div>
          <div className="text-sm text-white/40">
            已解 <span className="text-amber-400 font-medium">{solvedIds.size}</span> / {ENDGAMES.length}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white mb-2"
          >
            经典残局库
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-white/50 text-base"
          >
            从入门到大师，{ENDGAMES.length} 道精选残局，训练你的终局战术
          </motion.p>
        </div>

        {/* Difficulty filter */}
        <div className="flex items-center gap-2 mb-7 flex-wrap">
          {['全部', ...DIFFICULTIES].map(d => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                filter === d
                  ? d === '全部'
                    ? 'bg-white text-black border-white'
                    : `${difficultyColor[d]} !opacity-100`
                  : 'text-white/40 border-white/10 hover:text-white/70 hover:border-white/20'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((endgame, i) => (
            <EndgameCard
              key={endgame.id}
              endgame={endgame}
              index={i}
              solved={solvedIds.has(endgame.id)}
              onPlay={() => startGame(endgame)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface EndgameCardProps {
  endgame: Endgame;
  index: number;
  solved: boolean;
  onPlay: () => void;
}

function EndgameCard({ endgame, index, solved, onPlay }: EndgameCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onPlay}
      className="group relative bg-white/4 hover:bg-white/7 border border-white/8 hover:border-white/18 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
    >
      {/* Solved badge */}
      {solved && (
        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="text-emerald-400">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
      )}

      {/* Index */}
      <div className="text-xs font-mono text-white/20 mb-3">#{endgame.id}</div>

      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-200 transition-colors">
        {endgame.title}
      </h3>
      <p className="text-sm text-white/45 mb-4">{endgame.subtitle}</p>

      {/* Meta */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difficultyColor[endgame.difficulty]}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${difficultyDot[endgame.difficulty]}`} />
          {endgame.difficulty}
        </span>
        <span className="text-xs text-white/30">{endgame.category}</span>
        <span className="text-xs text-white/30">·</span>
        <span className="text-xs text-white/30">{endgame.targetMoves} 步</span>
        <span className="ml-auto text-xs font-medium text-amber-400/80">{endgame.goal}</span>
      </div>

      {/* Hover arrow */}
      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white/40">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </motion.div>
  );
}
