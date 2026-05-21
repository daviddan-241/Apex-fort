import { useListCharacters } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { RarityBadge } from "@/components/rarity-badge";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Shield, Zap, Crosshair } from "lucide-react";

export default function CharactersIndex() {
  const { data: characters, isLoading } = useListCharacters();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-widest text-foreground">
            Operator <span className="text-primary">Roster</span>
          </h1>
          <p className="text-muted-foreground font-mono uppercase tracking-wider text-sm max-w-2xl">
            Classified personnel files. Access restricted to level 4 clearance.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-80 bg-card border border-border rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {characters?.map(char => (
              <motion.div key={char.id} variants={item}>
                <Link href={`/characters/${char.id}`} className="block h-full">
                  <div className="border border-border bg-card rounded-lg overflow-hidden h-full flex flex-col hover:border-primary/50 hover:shadow-[0_0_20px_rgba(234,88,12,0.1)] transition-all duration-300 group cursor-pointer">
                    
                    {/* Portrait Placeholder area */}
                    <div className="h-40 bg-background relative overflow-hidden flex items-center justify-center border-b border-border">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/10 to-background"></div>
                      <div className="w-24 h-24 rounded-full bg-foreground/5 opacity-50 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
                        <span className="text-4xl font-display font-bold text-foreground/20">{char.name.charAt(0)}</span>
                      </div>
                      
                      {/* Scanline */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 shadow-[0_0_10px_rgba(249,115,22,0.5)] -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{char.role}</span>
                        <RarityBadge rarity={char.rarity} />
                      </div>
                      
                      <h3 className="font-display font-bold text-2xl uppercase tracking-wide group-hover:text-primary transition-colors">
                        {char.name}
                      </h3>
                      
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex-1">
                        {char.description}
                      </p>

                      <div className="mt-4 pt-4 border-t border-border/50 flex justify-between gap-2">
                        {char.abilities.map(ability => {
                          const Icon = ability.type === 'passive' ? Shield : ability.type === 'tactical' ? Zap : Crosshair;
                          return (
                            <div key={ability.name} className="flex flex-col items-center gap-1 group/icon" title={`${ability.type}: ${ability.name}`}>
                              <div className="p-1.5 rounded bg-background border border-border group-hover/icon:border-primary/50 transition-colors">
                                <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/icon:text-foreground" />
                              </div>
                              <span className="text-[8px] font-mono uppercase text-muted-foreground">{ability.type.substring(0,4)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}