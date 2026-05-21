import { cn } from "@/lib/utils";

interface RarityBadgeProps {
  rarity: "Mythic" | "Legendary" | "Epic" | "Rare" | "Common" | string;
  className?: string;
}

export function RarityBadge({ rarity, className }: RarityBadgeProps) {
  const colors: Record<string, string> = {
    Mythic: "text-fuchsia-400 border-fuchsia-400/50 bg-fuchsia-400/10 shadow-[0_0_10px_rgba(232,121,249,0.2)]",
    Legendary: "text-yellow-400 border-yellow-400/50 bg-yellow-400/10 shadow-[0_0_10px_rgba(250,204,21,0.2)]",
    Epic: "text-purple-400 border-purple-400/50 bg-purple-400/10 shadow-[0_0_10px_rgba(192,132,252,0.2)]",
    Rare: "text-blue-400 border-blue-400/50 bg-blue-400/10 shadow-[0_0_10px_rgba(96,165,250,0.2)]",
    Common: "text-gray-400 border-gray-400/50 bg-gray-400/10",
  };

  const defaultColor = colors.Common;
  const colorClass = colors[rarity] || defaultColor;

  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-xs font-mono font-medium border uppercase tracking-wider",
      colorClass,
      className
    )}>
      {rarity}
    </span>
  );
}