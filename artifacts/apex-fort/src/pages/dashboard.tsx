import { useGetStatsOverview } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { AnimatedCounter } from "@/components/animated-counter";
import { Link } from "wouter";
import { Users, Crosshair, Map, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data, isLoading } = useGetStatsOverview();

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
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-widest text-foreground">
            Command <span className="text-primary">Center</span>
          </h1>
          <p className="text-muted-foreground font-mono uppercase tracking-wider text-sm max-w-2xl">
            Global status overview for APEX FORT core systems, operators, and active operations.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-card border border-border rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : data ? (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            <motion.div variants={item}>
              <AnimatedCounter value={data.totalCharacters} label="Active Operators" />
            </motion.div>
            <motion.div variants={item}>
              <AnimatedCounter value={data.totalWeapons} label="Weapons Arsenal" />
            </motion.div>
            <motion.div variants={item}>
              <AnimatedCounter value={data.totalGameModes} label="Game Modes" />
            </motion.div>
            <motion.div variants={item}>
              <AnimatedCounter value={data.totalSystems} label="Core Systems" />
            </motion.div>
          </motion.div>
        ) : null}

        <div className="pt-8 border-t border-border">
          <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary animate-pulse"></span>
            Quick Access Terminals
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/characters" className="group">
              <div className="border border-border bg-card p-6 rounded-lg hover:border-primary/50 transition-colors flex items-start gap-4">
                <div className="p-3 bg-background border border-border rounded group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg uppercase tracking-wide group-hover:text-primary transition-colors">Operator Roster</h3>
                  <p className="text-sm text-muted-foreground mt-1">Review classified files for all 8 playable characters, including abilities and base stats.</p>
                </div>
              </div>
            </Link>
            
            <Link href="/weapons" className="group">
              <div className="border border-border bg-card p-6 rounded-lg hover:border-primary/50 transition-colors flex items-start gap-4">
                <div className="p-3 bg-background border border-border rounded group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Crosshair className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg uppercase tracking-wide group-hover:text-primary transition-colors">Weapons Arsenal</h3>
                  <p className="text-sm text-muted-foreground mt-1">Browse the full armory, weapon classes, rarities, and damage profiles.</p>
                </div>
              </div>
            </Link>

            <Link href="/systems" className="group">
              <div className="border border-border bg-card p-6 rounded-lg hover:border-primary/50 transition-colors flex items-start gap-4">
                <div className="p-3 bg-background border border-border rounded group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg uppercase tracking-wide group-hover:text-primary transition-colors">Core Architecture</h3>
                  <p className="text-sm text-muted-foreground mt-1">Technical breakdowns of building mechanics, destruction systems, and AI.</p>
                </div>
              </div>
            </Link>

            <Link href="/gamemodes" className="group">
              <div className="border border-border bg-card p-6 rounded-lg hover:border-primary/50 transition-colors flex items-start gap-4">
                <div className="p-3 bg-background border border-border rounded group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Map className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg uppercase tracking-wide group-hover:text-primary transition-colors">Active Operations</h3>
                  <p className="text-sm text-muted-foreground mt-1">Details on game modes, player counts, and map configurations.</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}