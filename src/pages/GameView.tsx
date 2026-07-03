import { motion } from 'framer-motion';
import { ChessBoard } from '@/components/ChessBoard';
import { GamePanel } from '@/components/GamePanel';
import { useGameStore } from '@/store/gameStore';

export function GameView() {
  const { currentEndgame, openLibrary } = useGameStore();

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-white/8">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={openLibrary}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            残局库
          </button>
          <div className="w-px h-4 bg-white/15" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <span className="text-red-400 font-bold text-xs">象</span>
            </div>
            <span className="text-sm font-semibold text-white">{currentEndgame?.title}</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex items-start justify-center gap-6 px-4 py-6 max-w-6xl mx-auto w-full">
        {/* Board */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="shrink-0 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 border border-amber-900/30"
          style={{ background: '#f0c060' }}
        >
          <ChessBoard />
        </motion.div>

        {/* Side panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="w-72 shrink-0"
        >
          <GamePanel />
        </motion.div>
      </div>
    </div>
  );
}
