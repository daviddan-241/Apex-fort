import { Link, useLocation } from "wouter";
import { Gamepad2, Trophy, Settings, Users } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Play", icon: Gamepad2 },
    { href: "/lobby", label: "Lobby", icon: Users },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-sm border-b border-border z-50 flex items-center px-6">
      <div className="flex items-center gap-2 mr-8">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
          <Gamepad2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg tracking-tight">ENGINE_</span>
      </div>
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isActive ? "bg-accent text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
