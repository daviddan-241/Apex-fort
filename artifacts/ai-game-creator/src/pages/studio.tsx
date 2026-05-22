import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useParams } from "wouter";
import { 
  useGetProject, 
  useGetProjectLogs, 
  useGetProjectFiles,
  useDownloadProject,
  useUploadFile,
  useAnalyzeFile,
  getGetProjectQueryKey,
  getGetProjectLogsQueryKey,
  getGetProjectFilesQueryKey
} from "@workspace/api-client-react";
const GamePreview3D = lazy(() => import("@/components/game-preview-3d"));
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
  Terminal, 
  Activity, 
  Download, 
  Box, 
  FileCode2, 
  Image as ImageIcon,
  FolderTree,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Cpu,
  BrainCircuit,
  UploadCloud,
  FileText,
  Search,
  Gamepad2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

// Component to render progress ring
function ProgressRing({ progress, status }: { progress: number, status: string }) {
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isComplete = status === 'completed';
  const isFailed = status === 'failed';
  
  const color = isComplete ? 'var(--color-primary)' : isFailed ? 'var(--color-destructive)' : 'var(--color-accent)';

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="hsl(var(--muted))"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={`hsl(${color})`}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center font-mono">
        {isComplete ? (
          <CheckCircle2 className="w-10 h-10 text-primary mb-1" />
        ) : isFailed ? (
          <AlertCircle className="w-10 h-10 text-destructive mb-1" />
        ) : (
          <span className="text-3xl font-bold">{Math.round(progress)}%</span>
        )}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{status}</span>
      </div>
    </div>
  );
}

// Component for Log Entry
function LogEntry({ log }: { log: any }) {
  const levelColors = {
    info: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    success: "text-green-400 bg-green-400/10 border-green-400/20",
    warning: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    error: "text-red-400 bg-red-400/10 border-red-400/20"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-3 text-sm py-2 border-b border-border/30 last:border-0"
    >
      <div className="w-16 shrink-0 text-xs text-muted-foreground font-mono pt-0.5">
        {format(new Date(log.timestamp), 'HH:mm:ss')}
      </div>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Cpu className="w-3 h-3" />
            {log.agentName}
          </span>
          {log.phase && (
            <span className="text-[10px] uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              {log.phase}
            </span>
          )}
        </div>
        <p className="text-muted-foreground break-words font-mono text-xs">{log.message}</p>
      </div>
    </motion.div>
  );
}

// Upload Panel Component
function UploadPanel({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const uploadFile = useUploadFile();
  const analyzeFile = useAnalyzeFile();
  const [uploadedRefs, setUploadedRefs] = useState<any[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleUpload(droppedFiles);
  };

  const handleUpload = async (newFiles: File[]) => {
    for (const file of newFiles) {
      try {
        const result = await uploadFile.mutateAsync({
          data: { file: file as unknown as Blob, projectId },
        });
        setUploadedRefs(prev => [...prev, { ...result, isAnalyzing: false, analysis: null }]);
        toast({ title: "File uploaded", description: `${file.name} uploaded successfully.` });
      } catch {
        toast({ title: "Upload failed", description: `Failed to upload ${file.name}`, variant: "destructive" });
      }
    }
  };

  const triggerAnalysis = async (fileId: string, idx: number) => {
    setUploadedRefs(prev => prev.map((f, i) => i === idx ? { ...f, isAnalyzing: true } : f));
    try {
      const result = await analyzeFile.mutateAsync({ id: fileId });
      setUploadedRefs(prev => prev.map((f, i) => i === idx ? { ...f, isAnalyzing: false, analysis: result } : f));
      toast({ title: "Analysis complete", description: "AI agents have processed the reference file." });
    } catch (error) {
      setUploadedRefs(prev => prev.map((f, i) => i === idx ? { ...f, isAnalyzing: false } : f));
      toast({ title: "Analysis failed", description: "Failed to analyze file.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full h-[600px] border border-border rounded-xl bg-card overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
        <UploadCloud className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm uppercase tracking-wider">Feed The Swarm</h3>
      </div>
      
      <div className="flex-1 flex flex-col p-4 overflow-hidden gap-4">
        <div 
          className="shrink-0 border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center bg-background/50 hover:bg-muted/50 hover:border-primary/50 transition-colors cursor-pointer"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('panel-upload')?.click()}
        >
          <input 
            id="panel-upload" 
            type="file" 
            className="hidden" 
            multiple 
            onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))} 
          />
          <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Drop assets here</p>
          <p className="text-xs text-muted-foreground mt-1">Provide reference material mid-build</p>
        </div>

        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="flex flex-col gap-3">
            {uploadedRefs.map((file, idx) => (
              <Card key={file.id || idx} className="bg-background border-border shadow-none overflow-hidden">
                <div className="p-3 flex items-center justify-between gap-2 bg-muted/20 border-b border-border/50">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">{file.originalName}</span>
                  </div>
                  {!file.analysis && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 text-xs h-7 hover:bg-primary/20 hover:text-primary"
                      onClick={() => triggerAnalysis(file.id, idx)}
                      disabled={file.isAnalyzing}
                    >
                      {file.isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <BrainCircuit className="w-3 h-3 mr-1" />}
                      Analyze
                    </Button>
                  )}
                </div>
                {file.analysis && (
                  <div className="p-3 bg-primary/5 text-xs">
                    <div className="flex items-start gap-2 text-primary mb-2">
                      <Search className="w-3 h-3 mt-0.5 shrink-0" />
                      <p className="font-mono leading-relaxed">{file.analysis.summary}</p>
                    </div>
                    {file.analysis.gameElements && file.analysis.gameElements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {file.analysis.gameElements.map((el: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 bg-background/50 border-primary/20 text-foreground/80">
                            {el}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
            {uploadedRefs.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8">
                No reference files uploaded yet.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default function Studio() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Poll while not completed/failed
  const { data: project, isLoading: projectLoading } = useGetProject(id, {
    query: { 
      enabled: !!id, 
      queryKey: getGetProjectQueryKey(id),
      refetchInterval: () => {
        if (project?.status === 'completed' || project?.status === 'failed') return false;
        return 2000;
      }
    }
  });

  const { data: logs, isLoading: logsLoading } = useGetProjectLogs(id, {
    query: { 
      enabled: !!id, 
      queryKey: getGetProjectLogsQueryKey(id),
      refetchInterval: (data) => {
        if (project?.status === 'completed' || project?.status === 'failed') return false;
        return 2000;
      }
    }
  });

  const { data: files, isLoading: filesLoading } = useGetProjectFiles(id, {
    query: { 
      enabled: !!id && project?.status === 'completed', 
      queryKey: getGetProjectFilesQueryKey(id)
    }
  });

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  const handleDownload = () => {
    if (project?.status === 'completed') {
      window.open(`/api/projects/${id}/download`, '_blank');
      toast({
        title: "Download Started",
        description: "Your Unreal Engine 5 project is downloading.",
      });
    }
  };

  if (projectLoading && !project) {
    return (
      <div className="flex-1 w-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-primary">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="font-mono uppercase tracking-widest text-sm">Connecting to Studio...</p>
        </div>
      </div>
    );
  }

  if (!project) return <div className="p-8 text-center text-destructive">Project not found.</div>;

  const isComplete = project.status === 'completed';
  const isFailed = project.status === 'failed';
  const isWorking = !isComplete && !isFailed;

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col gap-6">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-mono truncate max-w-lg">{project.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3"/> UE5</span>
              <span>•</span>
              <span>{project.platform || "PC"}</span>
              <span>•</span>
              <span className="font-mono">{format(new Date(project.createdAt), 'MMM d, HH:mm')}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className={`px-3 py-1 font-mono uppercase tracking-wider text-xs ${isWorking ? 'animate-pulse border-primary text-primary' : isComplete ? 'border-green-500 text-green-500' : 'border-destructive text-destructive'}`}>
            Status: {project.status}
          </Badge>
          <Button 
            onClick={handleDownload} 
            disabled={!isComplete}
            className={`font-bold shadow-lg ${isComplete ? 'shadow-primary/30' : ''}`}
          >
            <Download className="w-4 h-4 mr-2" />
            Download ZIP
          </Button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
        
        {/* Left Col: Activity Log */}
        <div className="col-span-1 lg:col-span-3 flex flex-col border border-border rounded-xl bg-card overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Agent Swarm Log
            </h3>
            {isWorking && <Activity className="w-4 h-4 text-primary animate-pulse" />}
          </div>
          <div className="flex-1 relative bg-black/40">
            <div className="absolute inset-0 p-4 overflow-y-auto" ref={scrollRef}>
              <div className="flex flex-col">
                {logs && logs.length > 0 ? (
                  logs.map((log) => <LogEntry key={log.id} log={log} />)
                ) : (
                  <div className="text-muted-foreground text-xs font-mono text-center mt-10">Awaiting agent initialization...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center Col: Visualizer / Progress */}
        <div className="col-span-1 lg:col-span-6 flex flex-col gap-6">
          {/* Progress Card */}
          <div className="border border-border rounded-xl bg-card p-8 flex flex-col items-center justify-center relative overflow-hidden h-[300px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
            
            <ProgressRing progress={project.progress} status={project.status} />
            
            <div className="mt-8 text-center max-w-md z-10">
              <h4 className="font-bold text-lg mb-2">{isComplete ? "Build Successful" : isFailed ? "Build Failed" : "Compiling Environment..."}</h4>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {project.prompt}
              </p>
            </div>
          </div>

          {/* Details / File Tree */}
          <div className="border border-border rounded-xl bg-card flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="overview" className="flex flex-col h-full">
              <div className="border-b border-border px-4 py-2 bg-muted/20">
                <TabsList className="bg-transparent h-8 p-0 space-x-4">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2">Overview</TabsTrigger>
                  <TabsTrigger value="preview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5" /> 3D Preview
                  </TabsTrigger>
                  <TabsTrigger value="files" disabled={!isComplete} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5" /> File Tree
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="overview" className="flex-1 p-6 m-0 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">System Prompt</h4>
                    <div className="p-4 rounded-lg bg-background border border-border font-mono text-sm leading-relaxed">
                      {project.prompt}
                    </div>
                  </div>
                  {project.features && project.features.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Active Modules</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.features.map(f => (
                          <Badge key={f} variant="secondary" className="bg-secondary/50 font-mono text-xs">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.gameDesign && (
                    <div>
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Architectural Blueprint</h4>
                      <div className="p-4 rounded-lg bg-background border border-border text-sm whitespace-pre-wrap">
                        {project.gameDesign}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="flex-1 m-0 p-0 min-h-[380px]">
                <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground text-sm"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading 3D engine...</div>}>
                  <GamePreview3D
                    genre={project.genre || "default"}
                    gameType={(project.gameDesign ? (() => { try { return JSON.parse(project.gameDesign as string).gameType; } catch { return undefined; } })() : undefined)}
                    title={project.name}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="files" className="flex-1 p-0 m-0 overflow-y-auto bg-black/40">
                <div className="p-4 font-mono text-sm">
                  {files && files.length > 0 ? (
                    <div className="space-y-1">
                      {files.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 py-1.5 px-2 hover:bg-white/5 rounded cursor-default">
                          {file.type === 'directory' ? 
                            <FolderTree className="w-4 h-4 text-accent shrink-0" /> : 
                            <FileCode2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          }
                          <span className={`${file.type === 'directory' ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>{file.path}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground/50">{file.size}B</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">No files generated yet.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Col: Context / Uploads */}
        <div className="col-span-1 lg:col-span-3 h-full">
          <UploadPanel projectId={id} />
        </div>

      </div>
    </div>
  );
}
