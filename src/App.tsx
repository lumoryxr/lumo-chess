import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { EndgameLibrary } from '@/components/EndgameLibrary';
import { GameView } from '@/pages/GameView';

export default function App() {
  const view = useGameStore(s => s.view);

  return (
    <AnimatePresence mode="wait">
      {view === 'library' ? (
        <motion.div
          key="library"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <EndgameLibrary />
        </motion.div>
      ) : (
        <motion.div
          key="game"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <GameView />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
