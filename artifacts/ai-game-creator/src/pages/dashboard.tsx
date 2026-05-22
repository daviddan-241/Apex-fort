import { useListProjects, useGetProjectStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  PlusCircle, 
  Gamepad2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FolderOpen,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: projects, isLoading: projectsLoading } = useListProjects();
  const { data: stats, isLoading: statsLoading } = useGetProjectStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'pending': return <Clock className="w-4 h-4 text-muted-foreground" />;
      default: return <Loader2 className="w-4 h-4 text-accent animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return "bg-primary/10 text-primary border-primary/20";
      case 'failed': return "bg-destructive/10 text-destructive border-destructive/20";
      case 'pending': return "bg-muted text-muted-foreground border-border";
      default: return "bg-accent/10 text-accent border-accent/20";
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">Operations Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your active game generation builds.</p>
        </div>
        <Link href="/new">
          <Button className="w-full md:w-auto font-bold shadow-[0_0_15px_rgba(0,255,255,0.2)]">
            <PlusCircle className="mr-2 h-4 w-4" />
            Initialize New Build
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-between">
          <div className="text-sm font-medium text-muted-foreground mb-2">Total Builds</div>
          <div className="text-3xl font-bold font-mono">{statsLoading ? "—" : stats?.total || 0}</div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-between">
          <div className="text-sm font-medium text-primary mb-2">Completed</div>
          <div className="text-3xl font-bold font-mono">{statsLoading ? "—" : stats?.completed || 0}</div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-between">
          <div className="text-sm font-medium text-accent mb-2">In Progress</div>
          <div className="text-3xl font-bold font-mono">{statsLoading ? "—" : stats?.inProgress || 0}</div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-between">
          <div className="text-sm font-medium text-destructive mb-2">Failed</div>
          <div className="text-3xl font-bold font-mono">{statsLoading ? "—" : stats?.failed || 0}</div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight font-mono flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary" />
          Active Operations
        </h2>

        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link href={`/studio/${project.id}`}>
                  <div className="group flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(0,255,255,0.1)] cursor-pointer">
                    <div className="p-5 flex-1 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="font-bold text-lg truncate" title={project.name}>{project.name}</h3>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 font-mono">
                            <Gamepad2 className="w-3 h-3" />
                            {project.engine} • {project.platform || "PC"}
                          </div>
                        </div>
                        <Badge variant="outline" className={`capitalize flex shrink-0 items-center gap-1.5 ${getStatusColor(project.status)}`}>
                          {getStatusIcon(project.status)}
                          {project.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                        {project.prompt}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-auto">
                        {project.genre && (
                          <Badge variant="secondary" className="bg-secondary/50 hover:bg-secondary/80">
                            {project.genre}
                          </Badge>
                        )}
                        {project.fileCount ? (
                          <Badge variant="outline" className="text-xs">
                            {project.fileCount} files
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    
                    <div className="px-5 py-4 border-t border-border bg-card/50 flex flex-col gap-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-mono">
                          {format(new Date(project.createdAt), 'MMM d, yyyy HH:mm')}
                        </span>
                        <span className="font-bold font-mono text-primary group-hover:underline flex items-center">
                          Open Studio <ArrowRight className="w-3 h-3 ml-1" />
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Progress value={project.progress} className="h-1.5 flex-1 bg-muted" />
                        <span className="text-xs font-mono font-bold min-w-[3ch] text-right">
                          {Math.round(project.progress)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-card border border-border border-dashed rounded-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Gamepad2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">No operations found</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                You haven't initialized any game builds yet. Start a new project to wake up the swarm.
              </p>
            </div>
            <Link href="/new">
              <Button className="mt-2 font-bold shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                Initialize Build
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
