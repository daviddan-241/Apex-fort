import type { Weapon } from "@workspace/api-client-react";
import { RarityBadge } from "./rarity-badge";
import { StatBar } from "./stat-bar";
import { cn } from "@/lib/utils";

export function WeaponCard({ weapon }: { weapon: Weapon }) {
  const rarityColors: Record<string, string> = {
    Mythic: "hover:border-fuchsia-500/50 hover:shadow-[0_0_20px_rgba(232,121,249,0.15)]",
    Legendary: "hover:border-yellow-500/50 hover:shadow-[0_0_20px_rgba(250,204,21,0.15)]",
    Epic: "hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(192,132,252,0.15)]",
    Rare: "hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(96,165,250,0.15)]",
    Common: "hover:border-gray-500/50",
  };

  return (
    <div className={cn(
      "border border-border bg-card p-5 rounded-lg flex flex-col gap-4 transition-all duration-300 group",
      rarityColors[weapon.rarity] || rarityColors.Common
    )}>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-display text-xl font-bold uppercase tracking-wide">{weapon.name}</h3>
          <span className="text-xs font-mono text-muted-foreground uppercase">{weapon.type}</span>
        </div>
        <RarityBadge rarity={weapon.rarity} />
      </div>

      <p className="text-sm text-muted-foreground flex-1">
        {weapon.description}
      </p>

      <div className="space-y-3">
        <StatBar label="Damage" value={weapon.damage} color="bg-red-500" />
        <StatBar label="Fire Rate" value={weapon.fireRate} color="bg-orange-500" />
        <StatBar label="Magazine" value={weapon.magazineSize} color="bg-yellow-500" />
      </div>
      
      {weapon.attachments && weapon.attachments.length > 0 && (
        <div className="pt-4 border-t border-border/50 mt-2">
          <div className="text-[10px] text-muted-foreground font-mono uppercase mb-2">Compatible Attachments</div>
          <div className="flex flex-wrap gap-1.5">
            {weapon.attachments.map(att => (
              <span key={att} className="text-[10px] border border-border bg-background px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                {att}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}