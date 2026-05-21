import { useGetSystem, getGetSystemQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useParams, Link } from "wouter";
import { ChevronLeft, Code, Wrench, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function SystemDetail() {
  const params = useParams();
  const id = params.id as string;
  
  const { data: system, isLoading } = useGetSystem(id, { 
    query: { enabled: !!id, queryKey: getGetSystemQueryKey(id) } 
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8 max-w-6xl mx-auto">
          <div className="h-8 w-32 bg-card rounded"></div>
          <div className="h-32 bg-card rounded-lg"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-card rounded-lg"></div>
            <div className="h-96 bg-card rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!system) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-display font-bold uppercase text-muted-foreground">System not found</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <Link href="/systems" className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Systems
        </Link>

        {/* Header */}
        <div className="border border-border bg-card rounded-lg p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="px-3 py-1 bg-background border border-border text-xs font-mono uppercase tracking-widest rounded text-primary">
              {system.category}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-wider text-foreground mb-4">
            {system.name}
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            {system.overview}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Components */}
            <section className="space-y-4">
              <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                <Wrench className="w-6 h-6 text-primary" />
                Sub-Components
              </h2>
              
              <div className="grid gap-4">
                {system.components.map((comp, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx} 
                    className="border border-border bg-card p-6 rounded-lg"
                  >
                    <h3 className="font-display font-bold text-xl uppercase tracking-wide mb-2 text-primary">{comp.name}</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-4">{comp.description}</p>
                    
                    {comp.details && comp.details.length > 0 && (
                      <ul className="space-y-2 mt-4 pt-4 border-t border-border/50">
                        {comp.details.map((detail, dIdx) => (
                          <li key={dIdx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5 opacity-50">&gt;</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
            
            {/* Implementation Details */}
            {system.codeSnippet && (
              <section className="space-y-4">
                <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <Code className="w-6 h-6 text-primary" />
                  Reference Implementation
                </h2>
                <div className="relative border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center">
                    <span className="text-xs font-mono uppercase text-muted-foreground">{system.language || 'Code'}</span>
                  </div>
                  <pre className="p-6 bg-[#0d1117] text-[#c9d1d9] overflow-x-auto text-sm font-mono leading-relaxed">
                    <code>{system.codeSnippet}</code>
                  </pre>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-8">
            {/* Technical Notes Sidebar */}
            {system.technicalNotes && system.technicalNotes.length > 0 && (
              <section className="border border-border bg-card rounded-lg p-6 sticky top-8">
                <h2 className="text-lg font-display font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Technical Notes
                </h2>
                <div className="space-y-4">
                  {system.technicalNotes.map((note, idx) => (
                    <div key={idx} className="bg-background border border-border p-4 rounded text-sm text-muted-foreground leading-relaxed">
                      {note}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}