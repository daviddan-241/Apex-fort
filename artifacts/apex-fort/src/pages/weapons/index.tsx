import { useListWeapons } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { WeaponCard } from "@/components/weapon-card";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function WeaponsIndex() {
  const { data: weapons, isLoading } = useListWeapons();
  const [filterType, setFilterType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const types = useMemo(() => {
    if (!weapons) return ["All"];
    const uniqueTypes = Array.from(new Set(weapons.map(w => w.type)));
    return ["All", ...uniqueTypes];
  }, [weapons]);

  const filteredWeapons = useMemo(() => {
    if (!weapons) return [];
    return weapons.filter(w => {
      const matchesType = filterType === "All" || w.type === filterType;
      const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            w.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [weapons, filterType, searchQuery]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-widest text-foreground">
            Weapons <span className="text-primary">Arsenal</span>
          </h1>
          <p className="text-muted-foreground font-mono uppercase tracking-wider text-sm max-w-2xl">
            Complete database of available firearms, explosives, and melee weapons.
          </p>
        </header>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card border border-border p-4 rounded-lg">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-colors ${
                  filterType === type 
                    ? "bg-primary text-primary-foreground font-bold" 
                    : "bg-background border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search weapons..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-80 bg-card border border-border rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : filteredWeapons.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <h3 className="text-lg font-mono text-muted-foreground uppercase">No weapons found matching criteria</h3>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredWeapons.map(weapon => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={weapon.id}
              >
                <WeaponCard weapon={weapon} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}