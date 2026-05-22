import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetProjectStats, useListAgents } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Terminal, Cpu, Layers, Zap, Code, FileCode2 } from "lucide-react";
import { useState as useReactState } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useReactState("");
  
  const { data: stats, isLoading: statsLoading } = useGetProjectStats();
  const { data: agents, isLoading: agentsLoading } = useListAgents();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      setLocation(`/new?prompt=${encodeURIComponent(prompt)}`);
    } else {
      setLocation("/new");
    }
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="relative w-full py-24 lg:py-32 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
        
        <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary shadow-sm backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
            System v2.4.1 Online — Ready for prompts
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter max-w-4xl"
          >
            Generate Unreal Engine 5 games <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              with an army of AI agents
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl"
          >
            Mission control for AI game creation. Describe your vision, upload reference assets, and watch 10+ specialized agents architect, code, and build your game in real-time.
          </motion.p>
          
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={handleStart} 
            className="w-full max-w-2xl flex flex-col sm:flex-row gap-3 mt-4"
          >
            <Input
              type="text"
              placeholder="A dark fantasy RPG set in a cybernetic cathedral..."
              className="h-14 px-6 text-lg bg-card/50 border-primary/20 focus-visible:ring-primary backdrop-blur-sm font-mono placeholder:text-muted-foreground/50"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button type="submit" size="lg" className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(0,255,255,0.3)]">
              Initialize Build
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.form>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground pt-4"
          >
            <span>Presets:</span>
            <button onClick={() => setPrompt("First-person sci-fi shooter with neon lighting")} className="hover:text-primary transition-colors border border-border px-3 py-1 rounded-full hover:border-primary/50">Sci-Fi FPS</button>
            <button onClick={() => setPrompt("Cozy farming simulator with low-poly graphics")} className="hover:text-primary transition-colors border border-border px-3 py-1 rounded-full hover:border-primary/50">Farming Sim</button>
            <button onClick={() => setPrompt("Fast-paced 2D platformer with grappling hook mechanics")} className="hover:text-primary transition-colors border border-border px-3 py-1 rounded-full hover:border-primary/50">2D Platformer</button>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="w-full py-8 border-y border-border/50 bg-card/30 backdrop-blur-md">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border/50">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-4xl font-bold text-foreground font-mono">
                {statsLoading ? "—" : stats?.total || 0}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Projects</div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-4xl font-bold text-primary font-mono">
                {statsLoading ? "—" : stats?.completed || 0}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Completed Games</div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-4xl font-bold text-accent font-mono">
                {statsLoading ? "—" : stats?.inProgress || 0}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">In Progress</div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-4xl font-bold text-foreground font-mono">
                {statsLoading ? "—" : stats?.totalFiles?.toLocaleString() || 0}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Files Generated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Agents Section */}
      <section className="w-full py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Meet Your Swarm</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
              Our architecture splits the massive task of game creation into specialized AI agents. They collaborate, critique each other, and write code in parallel.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-card/50 border border-border/50 animate-pulse" />
              ))
            ) : agents && agents.length > 0 ? (
              agents.map((agent, i) => (
                <motion.div 
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="group relative flex flex-col p-6 bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agent.color }} />
                      <h3 className="font-bold text-lg font-mono">{agent.name}</h3>
                    </div>
                    <Terminal className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground relative z-10">
                    {agent.role}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground py-12">No agents found. System offline.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
