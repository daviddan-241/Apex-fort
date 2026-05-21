import { useListGameModes } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { GameModeCard } from "@/components/game-mode-card";
import { motion } from "framer-motion";

export default function GameModesIndex() {
  const { data: modes, isLoading } = useListGameModes();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-4 mb-10 pb-8 border-b border-border relative">
          <div className="absolute right-0 top-0 text-9xl font-display font-bold text-muted/20 pointer-events-none select-none -translate-y-1/4">OPS</div>
          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-widest text-foreground relative z-10">
            Active <span className="text-primary">Operations</span>
          </h1>
          <p className="text-muted-foreground font-mono uppercase tracking-wider text-sm max-w-3xl relative z-10">
            Overview of all multiplayer and single-player game modes.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 bg-card border border-border rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {modes?.map(mode => (
              <motion.div key={mode.id} variants={item}>
                <GameModeCard mode={mode} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}