import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Users, 
  Settings, 
  Crosshair, 
  Map, 
  Trophy, 
  TerminalSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Command Center", href: "/", icon: TerminalSquare },
  { name: "Operator Roster", href: "/characters", icon: Users },
  { name: "Core Systems", href: "/systems", icon: Settings },
  { name: "Arsenal", href: "/weapons", icon: Crosshair },
  { name: "Operations", href: "/gamemodes", icon: Map },
  { name: "Progression", href: "/progression", icon: Trophy },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col relative">
        <div className="p-6">
          <div className="flex items-center gap-3 font-display tracking-widest text-2xl font-bold uppercase">
            <span className="text-primary glow-text">APEX</span>
            <span className="text-foreground">FORT</span>
          </div>
          <div className="mt-2 text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Classified Dossier
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} className="block">
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "")} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* Scanline overlay for sidebar */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50"></div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto relative">
        <main className="p-8">
          {children}
        </main>
        {/* Subtle grid background */}
        <div className="absolute inset-0 pointer-events-none opacity-20 z-[-1]" 
          style={{ backgroundImage: 'radial-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>
      </div>
    </div>
  );
}