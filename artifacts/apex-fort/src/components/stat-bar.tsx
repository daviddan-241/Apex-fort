import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StatBarProps {
  label: string;
  value: number; // 0 to 100
  color?: string; // Tailwind class like bg-primary
  className?: string;
}

export function StatBar({ label, value, color = "bg-primary", className }: StatBarProps) {
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setFill(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex justify-between items-center text-xs font-mono uppercase tracking-wider">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{value}</span>
      </div>
      <div className="h-2 w-full bg-muted overflow-hidden rounded-full border border-border/50">
        <div 
          className={cn("h-full transition-all duration-1000 ease-out", color)}
          style={{ width: `${fill}%` }}
        ></div>
      </div>
    </div>
  );
}