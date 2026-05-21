import { useGetCharacter, getGetCharacterQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { RarityBadge } from "@/components/rarity-badge";
import { AbilityCard } from "@/components/ability-card";
import { StatBar } from "@/components/stat-bar";
import { useParams, Link } from "wouter";
import { ChevronLeft } from "lucide-react";

export default function CharacterDetail() {
  const params = useParams();
  const id = params.id as string;
  
  const { data: character, isLoading } = useGetCharacter(id, { 
    query: { enabled: !!id, queryKey: getGetCharacterQueryKey(id) } 
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-32 bg-card rounded"></div>
          <div className="h-32 bg-card rounded-lg"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-card rounded-lg"></div>
            <div className="h-96 bg-card rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!character) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-display font-bold uppercase text-muted-foreground">Operator not found</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <Link href="/characters" className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Roster
        </Link>

        {/* Header Hero */}
        <div className="relative border border-border bg-card rounded-lg overflow-hidden flex flex-col md:flex-row min-h-[300px]">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0)_100%)] z-10"></div>
          
          <div className="relative z-20 p-8 flex flex-col justify-end flex-1">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-background border border-border text-xs font-mono uppercase tracking-widest rounded">
                {character.role}
              </span>
              <RarityBadge rarity={character.rarity} />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-wider text-white drop-shadow-md mb-2">
              {character.name}
            </h1>
            <p className="text-lg font-mono text-primary uppercase tracking-widest">
              {character.archetype}
            </p>
          </div>
          
          <div className="hidden md:block w-1/3 bg-background relative overflow-hidden border-l border-border">
            {/* Abstract portrait placeholder */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
               <span className="text-[20rem] font-display font-bold text-foreground leading-none select-none">
                 {character.name.charAt(0)}
               </span>
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Dossier info */}
            <div className="space-y-6">
              <section>
                <h2 className="text-lg font-display font-bold uppercase tracking-widest text-primary border-b border-border/50 pb-2 mb-4">
                  Background
                </h2>
                <div className="bg-card border border-border p-6 rounded-lg text-sm text-foreground/80 leading-relaxed font-sans">
                  {character.backstory}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-display font-bold uppercase tracking-widest text-primary border-b border-border/50 pb-2 mb-4">
                  Playstyle & Tactical Notes
                </h2>
                <div className="bg-card border border-border p-6 rounded-lg text-sm text-foreground/80 leading-relaxed font-sans">
                  {character.playstyle}
                </div>
              </section>
            </div>

            {/* Abilities */}
            <section>
              <h2 className="text-lg font-display font-bold uppercase tracking-widest text-primary border-b border-border/50 pb-2 mb-4">
                Ability Kit
              </h2>
              <div className="grid gap-4">
                {character.abilities.map((ability, idx) => (
                  <AbilityCard key={idx} ability={ability} />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-8">
            <section className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-display font-bold uppercase tracking-widest text-primary mb-6 text-center">
                Combat Ratings
              </h2>
              <div className="space-y-6">
                <StatBar label="Health Base" value={character.stats.health} color="bg-green-500" />
                <StatBar label="Armor Base" value={character.stats.armor} color="bg-blue-500" />
                <StatBar label="Mobility" value={character.stats.speed} color="bg-yellow-500" />
                <StatBar label="Ability Power" value={character.stats.ability_power} color="bg-purple-500" />
                <StatBar label="Weapon Handling" value={character.stats.weapon_accuracy} color="bg-red-500" />
              </div>
            </section>

            <section className="bg-background border border-border rounded-lg p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 border-t-2 border-r-2 border-primary/30 rounded-tr-xl"></div>
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Innate Bonus
              </h2>
              <p className="text-sm font-medium text-foreground">
                {character.passiveBonus}
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}