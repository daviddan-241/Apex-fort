import React from 'react';
import { useGameStore } from './store';
import { Button } from '@/components/ui/button';

export function Menu() {
  const { setGameState, setGameMode, gameMode, startGame } = useGameStore();

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white backdrop-blur-sm">
      <div className="text-center mb-12">
        <h1 className="text-7xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary" style={{ fontFamily: 'Space Mono' }}>
          APEX STORM
        </h1>
        <p className="text-xl text-muted-foreground uppercase tracking-widest">Next-Gen Browser Battle Royale</p>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-md bg-card/50 p-8 rounded-xl border border-white/10 backdrop-blur-md">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Mode</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['solo', 'duo', 'squad', 'bot-deathmatch'] as const).map((mode) => (
              <Button
                key={mode}
                variant={gameMode === mode ? 'default' : 'outline'}
                onClick={() => setGameMode(mode)}
                className={`uppercase tracking-widest ${gameMode === mode ? 'bg-primary text-primary-foreground border-primary' : 'border-white/20 hover:bg-white/10 hover:border-white/40'}`}
              >
                {mode.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>

        <Button 
          onClick={() => startGame()}
          className="w-full h-16 text-xl uppercase tracking-[0.2em] font-bold bg-primary hover:bg-primary/90 text-primary-foreground mt-4 shadow-[0_0_20px_rgba(0,200,255,0.4)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,200,255,0.6)]"
        >
          Deploy
        </Button>
      </div>

      <div className="absolute bottom-8 text-xs text-muted-foreground uppercase tracking-widest opacity-50">
        WASD to move • Mouse to aim/shoot • Space to jump • R to reload • B for build mode
      </div>
    </div>
  );
}
