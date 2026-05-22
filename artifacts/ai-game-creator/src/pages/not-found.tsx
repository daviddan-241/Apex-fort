import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Gamepad2, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background text-foreground min-h-[80vh]">
      <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        <Gamepad2 className="w-12 h-12 text-primary" />
      </div>
      
      <h1 className="text-6xl font-bold font-mono tracking-tighter mb-4 text-primary drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">404</h1>
      <h2 className="text-2xl font-bold mb-4 font-mono uppercase tracking-widest">Sector Not Found</h2>
      
      <p className="text-muted-foreground max-w-md mb-8 font-mono text-sm leading-relaxed">
        The requested coordinates do not exist in the current sector. The simulation may have been purged or relocated to another server node.
      </p>
      
      <Link href="/">
        <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 py-2 shadow-[0_0_15px_rgba(0,255,255,0.2)] font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Mission Control
        </a>
      </Link>
    </div>
  );
}
