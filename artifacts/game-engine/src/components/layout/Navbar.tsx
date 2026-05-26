import { Link, useLocation } from "wouter";
import { Hammer, Users, Trophy, Settings, Gamepad2 } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { href:"/",            label:"Create",   icon:Hammer   },
    { href:"/lobby",       label:"Lobby",    icon:Users    },
    { href:"/leaderboard", label:"Scores",   icon:Trophy   },
    { href:"/settings",    label:"Settings", icon:Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-[#07080f]/92 backdrop-blur-md border-b border-white/8 z-50 flex items-center px-4">
      {/* Brand */}
      <Link href="/">
        <div className="flex items-center gap-2 mr-5 cursor-pointer">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background:'linear-gradient(135deg,#00b4ff,#0077cc)', boxShadow:'0 0 14px #00b4ff55' }}>
            <Gamepad2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-sm tracking-widest text-white hidden sm:block">APEX-FORT</span>
        </div>
      </Link>

      {/* Nav items */}
      <div className="flex items-center gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href || (href==='/studio' && location.startsWith('/studio'));
          return (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? "bg-[#00b4ff]/12 text-[#00b4ff]"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Play button */}
      <div className="ml-auto">
        <Link href="/play">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer"
            style={{ background:'linear-gradient(135deg,#00b4ff22,#a855f722)', border:'1px solid rgba(0,180,255,0.3)', color:'#00b4ff' }}>
            <Gamepad2 className="w-3.5 h-3.5" /> Play
          </div>
        </Link>
      </div>
    </nav>
  );
}
