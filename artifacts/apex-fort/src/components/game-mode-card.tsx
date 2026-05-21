import type { GameMode } from "@workspace/api-client-react";
import { Users, Map, CheckCircle2 } from "lucide-react";

export function GameModeCard({ mode }: { mode: GameMode }) {
  return (
    <div className="border border-border bg-card p-6 rounded-lg relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10"></div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Mission Briefing</div>
          <h3 className="font-display text-2xl font-bold uppercase tracking-wide">{mode.name}</h3>
        </div>
        {mode.hasBuilding && (
          <span className="px-2 py-1 bg-accent/20 text-accent border border-accent/30 text-[10px] uppercase font-mono rounded">
            Building Enabled
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-6 flex-1">
        {mode.description}
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground">{mode.playerCount} Players</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <Map className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground">{mode.mapSize} Map</span>
        </div>
      </div>

      <div className="pt-4 border-t border-border/50">
        <div className="text-[10px] font-mono text-muted-foreground uppercase mb-3">Key Features</div>
        <ul className="space-y-2">
          {mode.features.map(feature => (
            <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}