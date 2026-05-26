import { Navbar } from "@/components/layout/Navbar";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Award } from "lucide-react";

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  return (
    <div className="min-h-screen bg-background pt-14 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-5xl mx-auto p-6 space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4 flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-primary" />
            Hall of Fame
          </h1>
          <p className="text-muted-foreground text-lg">Top performers across all game modes.</p>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-accent/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px] text-center">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Kills</TableHead>
                <TableHead className="text-right">Deaths</TableHead>
                <TableHead className="text-right">K/D</TableHead>
                <TableHead className="text-right">Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Loading rankings...
                  </TableCell>
                </TableRow>
              ) : leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((entry, idx) => {
                  const kd = entry.deaths === 0 ? entry.kills : (entry.kills / entry.deaths).toFixed(2);
                  return (
                    <TableRow key={entry.id} className="hover:bg-accent/20 transition-colors">
                      <TableCell className="font-medium text-center">
                        {idx === 0 && <Trophy className="w-5 h-5 mx-auto text-yellow-500" />}
                        {idx === 1 && <Medal className="w-5 h-5 mx-auto text-gray-400" />}
                        {idx === 2 && <Award className="w-5 h-5 mx-auto text-amber-700" />}
                        {idx > 2 && <span className="text-muted-foreground">{idx + 1}</span>}
                      </TableCell>
                      <TableCell className="font-bold text-white">{entry.playerName}</TableCell>
                      <TableCell className="text-right font-mono text-primary">{entry.score.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-400">{entry.kills}</TableCell>
                      <TableCell className="text-right text-red-400">{entry.deaths}</TableCell>
                      <TableCell className="text-right font-mono text-white">{kd}</TableCell>
                      <TableCell className="text-right">
                        <span className="px-2 py-1 bg-accent rounded text-xs uppercase tracking-wider text-muted-foreground">
                          {entry.gameMode.replace('_', ' ')}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No scores recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
