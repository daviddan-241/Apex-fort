import { useListSystems } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { SystemCard } from "@/components/system-card";
import { motion } from "framer-motion";

export default function SystemsIndex() {
  const { data: systems, isLoading } = useListSystems();

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

  // Group systems by category
  const groupedSystems = systems?.reduce((acc, sys) => {
    if (!acc[sys.category]) acc[sys.category] = [];
    acc[sys.category].push(sys);
    return acc;
  }, {} as Record<string, typeof systems>);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-4 mb-10 border-b border-border pb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-widest text-foreground">
            Core <span className="text-primary">Systems</span>
          </h1>
          <p className="text-muted-foreground font-mono uppercase tracking-wider text-sm max-w-3xl">
            Architectural documentation for APEX FORT's underlying game mechanics, AI behaviors, and physics interactions.
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-12">
            {[1, 2].map(section => (
              <div key={section} className="space-y-6">
                <div className="h-6 w-48 bg-card rounded animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map(i => (
                    <div key={i} className="h-64 bg-card border border-border rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-16">
            {groupedSystems && Object.entries(groupedSystems).map(([category, categorySystems]) => (
              <section key={category}>
                <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground mb-6 flex items-center gap-3">
                  <span className="text-primary opacity-50">/</span>
                  {category} Architecture
                </h2>
                
                <motion.div 
                  variants={container}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-50px" }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {categorySystems.map(system => (
                    <motion.div key={system.id} variants={item}>
                      <SystemCard system={system} />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}