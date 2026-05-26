import { Link, useLocation } from "wouter";
import { Gamepad2, Trophy, Settings, Users, Hammer } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/",            label: "Play",    icon: Gamepad2 },
    { href: "/creator",     label: "Create",  icon: Hammer   },
    { href: "/lobby",       label: "Lobby",   icon: Users    },
    { href: "/leaderboard", label: "Scores",  icon: Trophy   },
    { href: "/settings",    label: "Settings",icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-[#0a0a14]/90 backdrop-blur-md border-b border-white/10 z-50 flex items-center px-4">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 bg-[#00b4ff] rounded-lg flex items-center justify-center" style={{ boxShadow: '0 0 12px #00b4ff66' }}>
          <Gamepad2 className="w-4 h-4 text-black" />
        </div>
        <span className="font-black text-sm tracking-widest text-white hidden sm:inline">APEX-FORT</span>
      </div>
      <div className="flex items-center gap-0.5 flex-1 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#00b4ff]/15 text-[#00b4ff]"
                    : "text-white/45 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
