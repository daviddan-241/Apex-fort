import type { Ability } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Shield, Zap, Crosshair } from "lucide-react";

export function AbilityCard({ ability }: { ability: Ability }) {
  const isPassive = ability.type === "passive";
  const isTactical = ability.type === "tactical";
  const isUltimate = ability.type === "ultimate";

  const Icon = isPassive ? Shield : isTactical ? Zap : Crosshair;

  return (
    <div className={cn(
      "border border-border bg-card/50 p-4 rounded-lg relative overflow-hidden flex flex-col gap-3 group",
      isPassive && "border-l-4 border-l-gray-400",
      isTactical && "border-l-4 border-l-blue-500",
      isUltimate && "border-l-4 border-l-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
    )}>
      {isUltimate && (
        <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      )}
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded bg-background border",
          isPassive && "text-gray-400 border-gray-500/30",
          isTactical && "text-blue-400 border-blue-500/30",
          isUltimate && "text-orange-500 border-orange-500/30"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-display font-bold text-lg leading-none uppercase tracking-wide">
            {ability.name}
          </h4>
          <span className={cn(
            "text-[10px] font-mono uppercase tracking-widest",
            isPassive && "text-gray-400",
            isTactical && "text-blue-400",
            isUltimate && "text-orange-500 glow-text"
          )}>
            {ability.type}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        {ability.description}
      </p>
      
      {(ability.cooldown || ability.damage || ability.range) && (
        <div className="grid grid-cols-3 gap-2 mt-2 border-t border-border/50 pt-3">
          {ability.cooldown && (
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Cooldown</span>
              <span className="text-xs font-mono text-foreground">{ability.cooldown}</span>
            </div>
          )}
          {ability.damage && (
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Damage</span>
              <span className="text-xs font-mono text-foreground">{ability.damage}</span>
            </div>
          )}
          {ability.range && (
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Range</span>
              <span className="text-xs font-mono text-foreground">{ability.range}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}