import { Link, useLocation } from "wouter";
import { Gamepad2, LayoutDashboard, PlusCircle, Activity, ImageIcon, Film } from "lucide-react";
import { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col dark">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <span className="hidden font-bold sm:inline-block tracking-tight font-mono text-lg">
                AIGEN<span className="text-primary">_STUDIO</span>
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/dashboard"
                className={`transition-colors hover:text-foreground/80 flex items-center gap-2 ${
                  location.startsWith("/dashboard") ? "text-foreground" : "text-foreground/60"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/new"
                className={`transition-colors hover:text-foreground/80 flex items-center gap-2 ${
                  location === "/new" ? "text-foreground" : "text-foreground/60"
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                New Project
              </Link>
              <Link
                href="/editor/image"
                className={`transition-colors hover:text-foreground/80 flex items-center gap-2 ${
                  location.startsWith("/editor/image") ? "text-foreground" : "text-foreground/60"
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                Image Editor
              </Link>
              <Link
                href="/editor/video"
                className={`transition-colors hover:text-foreground/80 flex items-center gap-2 ${
                  location.startsWith("/editor/video") ? "text-foreground" : "text-foreground/60"
                }`}
              >
                <Film className="h-4 w-4" />
                Video Editor
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Optional search or other global controls */}
            </div>
            <nav className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs font-mono text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                <Activity className="h-3 w-3" />
                <span>SYSTEM ONLINE</span>
              </div>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
