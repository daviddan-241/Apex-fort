import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useListSessions, useCreateSession, useGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

export default function LobbyPage() {
  const { data: sessions, isLoading: sessionsLoading } = useListSessions();
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const createSession = useCreateSession();
  const [, setLocation] = useLocation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionMode, setNewSessionMode] = useState<"battle_royale" | "deathmatch" | "sandbox">("deathmatch");
  const [newSessionMaxPlayers, setNewSessionMaxPlayers] = useState(16);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    createSession.mutate(
      {
        data: {
          name: newSessionName || "New Session",
          gameMode: newSessionMode,
          maxPlayers: newSessionMaxPlayers,
        },
      },
      {
        onSuccess: (data) => {
          setIsDialogOpen(false);
          setLocation("/");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background pt-14 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Game Lobby</h1>
            <p className="text-muted-foreground">Find a match or start your own server.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="font-bold">HOST GAME</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Session</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSession} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Session Name</Label>
                  <Input 
                    id="name" 
                    value={newSessionName} 
                    onChange={(e) => setNewSessionName(e.target.value)} 
                    placeholder="My Awesome Server" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mode">Game Mode</Label>
                  <Select value={newSessionMode} onValueChange={(v: any) => setNewSessionMode(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deathmatch">Deathmatch</SelectItem>
                      <SelectItem value="battle_royale">Battle Royale</SelectItem>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="players">Max Players</Label>
                  <Input 
                    id="players" 
                    type="number" 
                    min={2} 
                    max={100} 
                    value={newSessionMaxPlayers} 
                    onChange={(e) => setNewSessionMaxPlayers(parseInt(e.target.value))} 
                  />
                </div>
                <Button type="submit" className="w-full mt-4" disabled={createSession.isPending}>
                  {createSession.isPending ? "Creating..." : "Start Server"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Active Players</div>
              <div className="text-3xl font-bold text-white">
                {statsLoading ? "-" : stats?.activePlayers || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Total Sessions</div>
              <div className="text-3xl font-bold text-white">
                {statsLoading ? "-" : stats?.totalSessions || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Total Kills</div>
              <div className="text-3xl font-bold text-white">
                {statsLoading ? "-" : stats?.totalKills || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Top Score</div>
              <div className="text-3xl font-bold text-white">
                {statsLoading ? "-" : stats?.topScore || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Active Servers</h2>
          
          {sessionsLoading ? (
            <div className="text-muted-foreground">Loading servers...</div>
          ) : sessions && sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <Card key={session.id} className="bg-card hover:bg-accent/5 transition-colors border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg truncate">{session.name}</CardTitle>
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-bold">
                        {session.gameMode.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-end mt-4">
                      <div className="text-sm text-muted-foreground">
                        <span className="text-white font-medium">{session.playerCount}</span>
                        <span> / {session.maxPlayers} players</span>
                      </div>
                      <Button onClick={() => setLocation("/")} variant="secondary" size="sm">
                        JOIN
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 border-border/50 border-dashed p-12 text-center">
              <div className="text-muted-foreground">No active servers found. Create one to start playing!</div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
