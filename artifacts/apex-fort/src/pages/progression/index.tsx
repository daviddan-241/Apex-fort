import { useGetProgression } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/animated-counter";
import { Trophy, Star, Gift, Coins } from "lucide-react";

export default function ProgressionIndex() {
  const { data: progression, isLoading } = useGetProgression();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-widest text-foreground">
            Progression <span className="text-primary">& Rewards</span>
          </h1>
          <p className="text-muted-foreground font-mono uppercase tracking-wider text-sm max-w-3xl">
            Player journey, battle pass structure, and economic systems.
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card rounded-lg border border-border"></div>)}
            </div>
            <div className="h-64 bg-card rounded-lg border border-border"></div>
            <div className="h-64 bg-card rounded-lg border border-border"></div>
          </div>
        ) : progression ? (
          <div className="space-y-12">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AnimatedCounter value={progression.levels} label="Max Account Level" />
              <AnimatedCounter value={progression.battlePassTiers} label="Battle Pass Tiers" />
              <AnimatedCounter value={Object.values(progression.cosmetics).reduce((a,b) => a+b, 0)} label="Total Cosmetics" />
              <AnimatedCounter value={progression.currencies.length} label="Economy Currencies" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Cosmetics Breakdown */}
              <section className="border border-border bg-card rounded-lg p-8 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Gift className="w-32 h-32 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground mb-8 relative z-10">
                  Cosmetic Inventory
                </h2>
                
                <div className="space-y-6 relative z-10">
                  {Object.entries(progression.cosmetics).map(([type, count], i) => (
                    <div key={type} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-mono uppercase">
                        <span className="text-muted-foreground">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-primary font-bold">{count} items</span>
                      </div>
                      <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / 150) * 100}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full bg-primary"
                        ></motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Economic System */}
              <section className="border border-border bg-card rounded-lg p-8">
                <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground mb-8 flex items-center gap-3">
                  <Coins className="w-6 h-6 text-primary" />
                  Economic System
                </h2>
                
                <div className="space-y-6">
                  {progression.currencies.map((currency, idx) => (
                    <div key={idx} className="border border-border/50 bg-background/50 p-5 rounded-lg">
                      <h3 className="font-display font-bold text-xl uppercase tracking-wide text-primary mb-2">{currency.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{currency.description}</p>
                      
                      <div className="pt-4 border-t border-border/50">
                        <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Acquisition Methods</div>
                        <div className="flex flex-wrap gap-2">
                          {currency.earnedBy.map(method => (
                            <span key={method} className="px-2 py-1 bg-card border border-border text-[10px] font-mono uppercase rounded text-foreground">
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            
            {/* Unlock Methods */}
            {progression.unlockMethods && (
              <section className="border border-border bg-card rounded-lg p-8">
                <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground mb-6 flex items-center gap-3">
                  <Star className="w-6 h-6 text-primary" />
                  Progression Vectors
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {progression.unlockMethods.map((method, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-background border border-border rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm font-mono text-muted-foreground uppercase">{method}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>
    </Layout>
  );
}