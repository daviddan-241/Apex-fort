import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Download, Play, Pause, Volume2, VolumeX, Scissors,
  SkipBack, SkipForward, Film, Loader2, Type, RotateCw,
  SlidersHorizontal, Wand2, ChevronDown, ChevronRight, RefreshCw,
  AlertCircle, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface VideoInfo {
  filename: string;
  originalName: string;
  url: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  audioCodec: string | null;
  bitrate: number;
  size: number;
}

interface TextOverlay {
  id: string;
  text: string;
  x: string;
  y: string;
  fontSize: number;
  color: string;
  startTime: number;
  endTime: number;
  bold: boolean;
}

export default function VideoEditor() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number>(0);

  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Trim
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const isDraggingTrimRef = useRef<"start" | "end" | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    brightness: 100, contrast: 100, saturation: 100,
    blur: 0, grayscale: false, sepia: false,
  });
  const [speed, setSpeed] = useState(1);
  const [muteAudio, setMuteAudio] = useState(false);
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);

  // Text overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [newText, setNewText] = useState({ text: "", x: "(w-tw)/2", y: "h-th-40", fontSize: 40, color: "#ffffff", bold: false });

  // Watermark
  const [watermark, setWatermark] = useState<{ enabled: boolean; text: string; position: "tl" | "tr" | "bl" | "br" | "center" }>({ enabled: false, text: "AI Game Creator", position: "br" });

  // Output
  const [outputFormat, setOutputFormat] = useState<"mp4" | "webm">("mp4");

  // Panel state
  const [activePanel, setActivePanel] = useState<"filters" | "text" | "watermark" | "settings">("filters");

  // Compute preview filter CSS
  const previewFilter = [
    filters.brightness !== 100 ? `brightness(${filters.brightness / 100})` : "",
    filters.contrast !== 100 ? `contrast(${filters.contrast / 100})` : "",
    filters.saturation !== 100 ? `saturate(${filters.saturation / 100})` : "",
    filters.blur > 0 ? `blur(${filters.blur / 10}px)` : "",
    filters.grayscale ? "grayscale(1)" : "",
    filters.sepia ? "sepia(1)" : "",
  ].filter(Boolean).join(" ");

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|mov|webm|avi|mkv)$/i)) {
      toast({ title: "Invalid file", description: "Please upload a video file (MP4, MOV, WebM, etc.)", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("video", file);
      const res = await fetch(`${BASE}/api/media/video/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data: VideoInfo = await res.json();
      setVideoInfo(data);
      setTrimStart(0);
      setTrimEnd(data.duration);
      setDuration(data.duration);
      toast({ title: "Video loaded", description: `${data.width}×${data.height} · ${data.fps}fps · ${formatTime(data.duration)}` });
    } catch {
      toast({ title: "Upload failed", description: "Could not upload video.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
    } else {
      if (currentTime >= trimEnd) video.currentTime = trimStart;
      video.play();
      setIsPlaying(true);
      const tick = () => {
        if (!videoRef.current) return;
        const t = videoRef.current.currentTime;
        setCurrentTime(t);
        if (t >= trimEnd) {
          videoRef.current.pause();
          videoRef.current.currentTime = trimStart;
          setIsPlaying(false);
          return;
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    }
  };

  const seekTo = (t: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(trimStart, Math.min(trimEnd, t));
    video.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seekTo(pct * duration);
  }, [duration, trimStart, trimEnd]);

  const handleTrimDrag = useCallback((type: "start" | "end") => (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingTrimRef.current = type;
    const handleMove = (ev: MouseEvent) => {
      if (!timelineRef.current || !duration) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const t = pct * duration;
      if (type === "start") setTrimStart(Math.min(t, trimEnd - 0.5));
      else setTrimEnd(Math.max(t, trimStart + 0.5));
    };
    const handleUp = () => {
      isDraggingTrimRef.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, [duration, trimStart, trimEnd]);

  const addTextOverlay = () => {
    if (!newText.text.trim()) return;
    setTextOverlays((prev) => [...prev, {
      ...newText,
      id: Date.now().toString(),
      startTime: trimStart,
      endTime: trimEnd,
    }]);
    setNewText((t) => ({ ...t, text: "" }));
  };

  const handleProcess = async () => {
    if (!videoInfo) return;
    setIsProcessing(true);
    try {
      const operations: Record<string, unknown> = {
        outputFormat,
        trim: { start: trimStart, end: trimEnd },
      };
      if (muteAudio) operations.mute = true;
      if (speed !== 1) operations.speed = speed;
      if (rotate !== 0) operations.rotate = rotate;
      if (filters.brightness !== 100) operations.brightness = filters.brightness;
      if (filters.contrast !== 100) operations.contrast = filters.contrast;
      if (filters.saturation !== 100) operations.saturation = filters.saturation;
      if (filters.blur > 0) operations.blur = filters.blur;
      if (filters.grayscale) operations.grayscale = true;
      if (filters.sepia) operations.sepia = true;
      if (textOverlays.length > 0) {
        operations.texts = textOverlays.map((t) => ({
          text: t.text, x: t.x, y: t.y, fontSize: t.fontSize,
          color: t.color, startTime: t.startTime, endTime: t.endTime, bold: t.bold,
        }));
      }
      if (watermark.enabled) {
        operations.watermark = { text: watermark.text, position: watermark.position };
      }

      const res = await fetch(`${BASE}/api/media/video/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: videoInfo.filename, operations }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Processing failed");
      }

      const data = await res.json();
      const link = document.createElement("a");
      link.href = `${BASE}/api/media/download/${data.filename}?dir=processed`;
      link.download = `edited_${videoInfo.originalName.replace(/\.[^.]+$/, "")}.${outputFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Video exported!", description: `${(data.size / (1024 * 1024)).toFixed(1)} MB` });
    } catch (err) {
      toast({ title: "Export failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const trimDuration = trimEnd - trimStart;

  return (
    <div className="flex flex-col h-full min-h-screen bg-background text-foreground">
      {/* Header toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-card/30 backdrop-blur">
        <Film className="w-5 h-5 text-[#a855f7]" />
        <span className="font-bold font-mono text-sm">VIDEO EDITOR</span>
        {videoInfo && (
          <div className="flex items-center gap-2 ml-2">
            <Badge variant="secondary" className="font-mono text-xs">{videoInfo.width}×{videoInfo.height}</Badge>
            <Badge variant="outline" className="font-mono text-xs">{videoInfo.fps}fps</Badge>
            <Badge variant="outline" className="font-mono text-xs">{videoInfo.codec}</Badge>
          </div>
        )}
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
          <Upload className="w-4 h-4" /> Load Video
        </Button>
        <input ref={fileInputRef} type="file" accept="video/*,.mp4,.mov,.webm,.avi,.mkv"
          className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
        <Separator orientation="vertical" className="h-6" />
        <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as "mp4" | "webm")}>
          <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mp4">MP4 (H.264)</SelectItem>
            <SelectItem value="webm">WebM (VP9)</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="gap-2 bg-[#a855f7] hover:bg-[#9333ea] text-white"
          onClick={handleProcess}
          disabled={!videoInfo || isProcessing}
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isProcessing ? "Processing..." : "Export"}
        </Button>
      </div>

      {!videoInfo && !isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-border flex items-center justify-center">
            <Film className="w-14 h-14 text-[#a855f7]/50" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">Drop a video or click Load Video</p>
            <p className="text-muted-foreground mt-1">Supports MP4, MOV, WebM, AVI, MKV — up to 500MB</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/40 px-4 py-2 rounded-full border border-border/50">
            <Info className="w-3.5 h-3.5" />
            Trim, filter, add text overlays and watermarks — powered by FFmpeg 6
          </div>
        </motion.div>
      )}

      {isUploading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#a855f7]" />
          <p className="text-muted-foreground font-mono">Uploading and analyzing video...</p>
        </div>
      )}

      {videoInfo && !isUploading && (
        <div className="flex flex-1 overflow-hidden">
          {/* Video preview */}
          <div className="flex-1 flex flex-col bg-black overflow-hidden">
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                src={`${BASE}${videoInfo.url}`}
                className="max-h-full max-w-full"
                style={{
                  filter: previewFilter || "none",
                  transform: rotate ? `rotate(${rotate}deg)` : "none",
                  transition: "filter 0.2s, transform 0.3s",
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                    setTrimEnd(videoRef.current.duration);
                  }
                }}
                muted={muted}
                onVolumeChange={() => {}}
                preload="auto"
              />
            </div>

            {/* Playback controls */}
            <div className="px-4 py-3 bg-black/80 border-t border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <Button size="sm" variant="ghost" onClick={() => seekTo(trimStart)}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => seekTo(trimEnd)}>
                  <SkipForward className="w-4 h-4" />
                </Button>

                <span className="text-xs font-mono text-muted-foreground ml-1">
                  {formatTime(currentTime)} / {formatTime(trimEnd)}
                </span>

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setMuted(!muted)}>
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Slider
                    className="w-20"
                    value={[volume * 100]}
                    min={0} max={100}
                    onValueChange={([v]) => {
                      setVolume(v / 100);
                      if (videoRef.current) videoRef.current.volume = v / 100;
                    }}
                  />
                </div>

                <Select value={String(speed)} onValueChange={(v) => {
                  const s = parseFloat(v);
                  setSpeed(s);
                  if (videoRef.current) videoRef.current.playbackRate = s;
                }}>
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <SelectItem key={s} value={String(s)}>{s}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timeline */}
              <div className="relative" ref={timelineRef} onClick={handleTimelineClick}>
                {/* Background track */}
                <div className="h-10 bg-white/5 rounded-lg relative cursor-pointer overflow-hidden">
                  {/* Trimmed region (active) */}
                  <div
                    className="absolute top-0 bottom-0 bg-[#a855f7]/20 border-y border-[#a855f7]/40"
                    style={{
                      left: `${(trimStart / duration) * 100}%`,
                      width: `${((trimEnd - trimStart) / duration) * 100}%`,
                    }}
                  />
                  {/* Playhead */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-0.5" />
                  </div>

                  {/* Time ticks */}
                  {Array.from({ length: Math.min(10, Math.ceil(duration)) }).map((_, i) => {
                    const t = (i / Math.min(10, Math.ceil(duration))) * duration;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-white/10 flex items-end pb-1"
                        style={{ left: `${(t / duration) * 100}%` }}
                      >
                        <span className="text-[9px] font-mono text-white/30 ml-1">{formatTime(t)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Trim handle — start */}
                <div
                  className="absolute top-0 bottom-0 w-3 bg-[#a855f7] rounded-l cursor-ew-resize z-30 flex items-center justify-center"
                  style={{ left: `calc(${(trimStart / duration) * 100}% - 6px)` }}
                  onMouseDown={handleTrimDrag("start")}
                >
                  <Scissors className="w-2 h-2 text-white rotate-180" />
                </div>

                {/* Trim handle — end */}
                <div
                  className="absolute top-0 bottom-0 w-3 bg-[#a855f7] rounded-r cursor-ew-resize z-30 flex items-center justify-center"
                  style={{ left: `calc(${(trimEnd / duration) * 100}% - 6px)` }}
                  onMouseDown={handleTrimDrag("end")}
                >
                  <Scissors className="w-2 h-2 text-white" />
                </div>
              </div>

              {/* Trim info */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <Scissors className="w-3 h-3 text-[#a855f7]" />
                  <span className="text-muted-foreground">Trim:</span>
                  <span>{formatTime(trimStart)}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{formatTime(trimEnd)}</span>
                  <span className="text-muted-foreground ml-1">({formatTime(trimDuration)})</span>
                </div>
                <Button
                  size="sm" variant="ghost" className="h-6 text-xs"
                  onClick={() => { setTrimStart(0); setTrimEnd(duration); }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Reset
                </Button>
                <div className="flex-1" />
                <div className="text-xs text-muted-foreground font-mono">
                  In: <input
                    className="bg-transparent border-b border-border w-14 text-center outline-none"
                    value={formatTime(trimStart)}
                    onChange={(e) => {
                      const t = parseTimeInput(e.target.value);
                      if (!isNaN(t)) setTrimStart(Math.max(0, Math.min(trimEnd - 0.5, t)));
                    }}
                  />
                  {" "} Out: <input
                    className="bg-transparent border-b border-border w-14 text-center outline-none"
                    value={formatTime(trimEnd)}
                    onChange={(e) => {
                      const t = parseTimeInput(e.target.value);
                      if (!isNaN(t)) setTrimEnd(Math.min(duration, Math.max(trimStart + 0.5, t)));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-72 border-l border-border/50 bg-card/20 flex flex-col overflow-hidden">
            {/* Panel tabs */}
            <div className="flex border-b border-border/50">
              {([
                ["filters", <SlidersHorizontal className="w-3.5 h-3.5" key="f" />, "Filters"],
                ["text", <Type className="w-3.5 h-3.5" key="t" />, "Text"],
                ["watermark", <Wand2 className="w-3.5 h-3.5" key="w" />, "Mark"],
                ["settings", <RotateCw className="w-3.5 h-3.5" key="s" />, "Video"],
              ] as [typeof activePanel, React.ReactNode, string][]).map(([id, icon, label]) => (
                <button
                  key={id}
                  onClick={() => setActivePanel(id)}
                  className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs border-b-2 transition-colors ${
                    activePanel === id
                      ? "border-[#a855f7] text-[#a855f7]"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Filters panel */}
              {activePanel === "filters" && (
                <div className="space-y-3">
                  {([
                    ["brightness", "Brightness", 0, 200],
                    ["contrast", "Contrast", 0, 200],
                    ["saturation", "Saturation", 0, 200],
                    ["blur", "Blur", 0, 50],
                  ] as [keyof typeof filters, string, number, number][]).map(([key, label, min, max]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <Label className="text-xs text-muted-foreground">{label}</Label>
                        <span className="text-xs font-mono">{filters[key] as number}</span>
                      </div>
                      <Slider value={[filters[key] as number]} min={min} max={max}
                        onValueChange={([v]) => setFilters((f) => ({ ...f, [key]: v }))} />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2">
                    {([["grayscale", "Grayscale"], ["sepia", "Sepia"]] as [keyof typeof filters, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setFilters((f) => ({ ...f, [key]: !f[key] }))}
                        className={`text-xs py-1.5 px-2 rounded border font-mono transition-colors ${
                          filters[key] ? "bg-[#a855f7]/20 border-[#a855f7] text-[#a855f7]" : "border-border text-muted-foreground"
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-xs"
                    onClick={() => setFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: false, sepia: false })}>
                    Reset
                  </Button>
                </div>
              )}

              {/* Text panel */}
              {activePanel === "text" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Text</Label>
                    <Input value={newText.text} onChange={(e) => setNewText((t) => ({ ...t, text: e.target.value }))}
                      placeholder="Enter overlay text..." className="mt-1 h-8 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">X Position</Label>
                      <Select value={newText.x} onValueChange={(v) => setNewText((t) => ({ ...t, x: v }))}>
                        <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">Left</SelectItem>
                          <SelectItem value="(w-tw)/2">Center</SelectItem>
                          <SelectItem value="w-tw-20">Right</SelectItem>
                          <SelectItem value="20">Custom (20px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Y Position</Label>
                      <Select value={newText.y} onValueChange={(v) => setNewText((t) => ({ ...t, y: v }))}>
                        <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="40">Top</SelectItem>
                          <SelectItem value="(h-th)/2">Middle</SelectItem>
                          <SelectItem value="h-th-40">Bottom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Color</Label>
                      <div className="flex items-center gap-1.5 mt-1">
                        <input type="color" value={newText.color} onChange={(e) => setNewText((t) => ({ ...t, color: e.target.value }))}
                          className="w-8 h-7 rounded border border-border cursor-pointer bg-transparent" />
                        <span className="text-xs font-mono text-muted-foreground">{newText.color}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Size</Label>
                      <Slider className="mt-3" value={[newText.fontSize]} min={12} max={120}
                        onValueChange={([v]) => setNewText((t) => ({ ...t, fontSize: v }))} />
                      <span className="text-xs font-mono text-muted-foreground">{newText.fontSize}px</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <Label className="text-xs">Start (s)</Label>
                      <Input type="number" min={0} max={trimEnd} step={0.1}
                        defaultValue={trimStart}
                        className="h-7 text-xs mt-1"
                        onChange={(e) => setNewText((t) => ({ ...t }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End (s)</Label>
                      <Input type="number" min={0} max={trimEnd} step={0.1}
                        defaultValue={trimEnd}
                        className="h-7 text-xs mt-1"
                      />
                    </div>
                  </div>
                  <Button size="sm" className="w-full" onClick={addTextOverlay}
                    disabled={!newText.text.trim()}>
                    Add Text Overlay
                  </Button>

                  {textOverlays.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground font-mono">Added overlays:</p>
                      {textOverlays.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 bg-card/40 rounded border border-border/40">
                          <span className="text-xs truncate flex-1">{t.text}</span>
                          <button onClick={() => setTextOverlays((p) => p.filter((o) => o.id !== t.id))}
                            className="text-destructive/70 hover:text-destructive text-xs ml-2">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Watermark panel */}
              {activePanel === "watermark" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Watermark</Label>
                    <button
                      onClick={() => setWatermark((w) => ({ ...w, enabled: !w.enabled }))}
                      className={`w-10 h-5 rounded-full transition-colors relative ${watermark.enabled ? "bg-[#a855f7]" : "bg-muted"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${watermark.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  <div>
                    <Label className="text-xs">Text</Label>
                    <Input value={watermark.text} onChange={(e) => setWatermark((w) => ({ ...w, text: e.target.value }))}
                      className="mt-1 h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Position</Label>
                    <Select value={watermark.position} onValueChange={(v) => setWatermark((w) => ({ ...w, position: v as "tl" | "tr" | "bl" | "br" | "center" }))}>
                      <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tl">Top Left</SelectItem>
                        <SelectItem value="tr">Top Right</SelectItem>
                        <SelectItem value="bl">Bottom Left</SelectItem>
                        <SelectItem value="br">Bottom Right</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Video settings panel */}
              {activePanel === "settings" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Rotation</Label>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {([0, 90, 180, 270] as const).map((r) => (
                        <button key={r} onClick={() => setRotate(r)}
                          className={`py-1 text-xs rounded border font-mono transition-colors ${rotate === r ? "bg-[#a855f7]/20 border-[#a855f7] text-[#a855f7]" : "border-border text-muted-foreground"}`}>
                          {r}°
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Mute Audio</Label>
                    <button onClick={() => setMuteAudio(!muteAudio)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${muteAudio ? "bg-[#a855f7]" : "bg-muted"}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${muteAudio ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  <div className="p-3 bg-card/40 rounded border border-border/40 text-xs font-mono space-y-1 text-muted-foreground">
                    <p className="text-foreground font-bold mb-1">Source Info</p>
                    <p>Size: {(videoInfo!.size / (1024 * 1024)).toFixed(1)} MB</p>
                    <p>Duration: {formatTime(videoInfo!.duration)}</p>
                    <p>Resolution: {videoInfo!.width}×{videoInfo!.height}</p>
                    <p>FPS: {videoInfo!.fps}</p>
                    <p>Codec: {videoInfo!.codec}</p>
                    <p>Audio: {videoInfo!.audioCodec || "none"}</p>
                    <p>Bitrate: {videoInfo!.bitrate} kbps</p>
                    <Separator className="my-2" />
                    <p className="text-foreground font-bold">Export Preview</p>
                    <p>Trim: {formatTime(trimDuration)}</p>
                    <p>Format: {outputFormat.toUpperCase()}</p>
                    {speed !== 1 && <p>Speed: {speed}x</p>}
                    {rotate !== 0 && <p>Rotation: {rotate}°</p>}
                    {muteAudio && <p className="text-yellow-400">Audio: muted</p>}
                    {textOverlays.length > 0 && <p>Text overlays: {textOverlays.length}</p>}
                    {watermark.enabled && <p>Watermark: enabled</p>}
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-400">Processing time varies with video length and effects. Large files may take a few minutes.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00.0";
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
}

function parseTimeInput(str: string): number {
  const parts = str.split(":");
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(str);
}
