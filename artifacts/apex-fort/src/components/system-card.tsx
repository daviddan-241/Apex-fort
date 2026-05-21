import type { GameSystem } from "@workspace/api-client-react";
import { ChevronDown, Code, Wrench } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export function SystemCard({ system }: { system: GameSystem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border bg-card rounded-lg overflow-hidden flex flex-col group">
      <div className="p-5 border-b border-border/50 bg-background/50 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">
            {system.category} System
          </span>
          <h3 className="font-display text-xl font-bold uppercase tracking-wide">
            {system.name}
          </h3>
        </div>
        <Link href={`/systems/${system.id}`} className="text-xs font-mono text-primary hover:underline uppercase tracking-wider">
          View Details
        </Link>
      </div>

      <div className="p-5">
        <p className="text-sm text-muted-foreground mb-4">
          {system.overview}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {system.components.slice(0, 2).map((comp, idx) => (
            <div key={idx} className="border border-border/50 bg-background/30 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                <h4 className="text-xs font-bold uppercase">{comp.name}</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{comp.description}</p>
            </div>
          ))}
          {system.components.length > 2 && (
            <div className="text-[10px] font-mono text-muted-foreground flex items-center pt-2">
              + {system.components.length - 2} more components
            </div>
          )}
        </div>

        {system.codeSnippet && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors w-full p-2 bg-background border border-border rounded">
              <Code className="w-4 h-4" />
              <span>{isOpen ? 'Hide Implementation Details' : 'Show Implementation Details'}</span>
              <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", isOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="relative">
                <div className="absolute top-0 right-0 px-2 py-1 bg-background border-b border-l border-border rounded-bl text-[10px] font-mono text-muted-foreground uppercase">
                  {system.language || 'Code'}
                </div>
                <pre className="p-4 bg-[#0d1117] text-[#c9d1d9] rounded border border-border/50 overflow-x-auto text-xs font-mono leading-relaxed">
                  <code>{system.codeSnippet}</code>
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}