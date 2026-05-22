import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Download, RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
  Crop, Type, Square, Circle, Minus, Pencil, Eraser, Trash2, Undo,
  Redo, ZoomIn, ZoomOut, Maximize2, ImageIcon, Loader2, Check, SlidersHorizontal,
  ChevronRight, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Tool = "select" | "crop" | "draw" | "text" | "rect" | "circle" | "line" | "eraser";
type FabricCanvas = {
  dispose(): void;
  on(event: string, cb: (e: unknown) => void): void;
  add(...objects: unknown[]): void;
  remove(obj: unknown): void;
  setActiveObject(obj: unknown): void;
  getActiveObject(): unknown;
  getObjects(): unknown[];
  clear(): void;
  renderAll(): void;
  toDataURL(opts: { format: string; quality: number }): string;
  setWidth(w: number): void;
  setHeight(h: number): void;
  isDrawingMode: boolean;
  selection: boolean;
  backgroundColor: string;
  freeDrawingBrush: { color: string; width: number };
  setZoom(zoom: number): void;
  getZoom(): number;
  viewportTransform: number[];
  setViewportTransform(vt: number[]): void;
  loadFromJSON(json: string, cb: () => void): void;
  toJSON(): object;
};

type FabricLib = {
  Canvas: new (el: HTMLCanvasElement, opts?: object) => FabricCanvas;
  Image: { fromURL(url: string, cb: (img: unknown) => void): void };
  Rect: new (opts: object) => unknown;
  Circle: new (opts: object) => unknown;
  Line: new (points: number[], opts: object) => unknown;
  IText: new (text: string, opts: object) => unknown;
  PencilBrush: new (canvas: FabricCanvas) => { color: string; width: number };
  EraserBrush?: new (canvas: FabricCanvas) => { width: number };
};

export default function ImageEditor() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const fabricLibRef = useRef<FabricLib | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef(-1);

  const [imageInfo, setImageInfo] = useState<{
    filename: string; width: number; height: number; format: string; url: string;
  } | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    brightness: 100, contrast: 100, saturation: 100, blur: 0, sharpen: false,
    grayscale: false, sepia: false, negate: false, gamma: 100,
    hue: 0, tint: "",
  });
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState({ h: false, v: false });
  const [textInput, setTextInput] = useState("Your text here");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(32);
  const [drawColor, setDrawColor] = useState("#00f0ff");
  const [drawWidth, setDrawWidth] = useState(4);
  const [outputFormat, setOutputFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
  const [outputQuality, setOutputQuality] = useState(90);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // Load fabric.js
  useEffect(() => {
    let mounted = true;
    import("fabric").then((mod) => {
      if (!mounted) return;
      fabricLibRef.current = mod as unknown as FabricLib;
    });
    return () => { mounted = false; };
  }, []);

  const initCanvas = useCallback((imgUrl: string, w: number, h: number) => {
    const lib = fabricLibRef.current;
    if (!lib || !canvasRef.current) return;
    if (fabricRef.current) fabricRef.current.dispose();

    const canvas = new lib.Canvas(canvasRef.current, {
      width: w,
      height: h,
      backgroundColor: "#1a1a2e",
      selection: true,
    });
    fabricRef.current = canvas;

    lib.Image.fromURL(imgUrl, (img: unknown) => {
      const fImg = img as { set: (opts: object) => void; scaleToWidth: (w: number) => void; scaleToHeight: (h: number) => void };
      fImg.set({ left: 0, top: 0, selectable: false, evented: false });
      canvas.add(img);
      canvas.renderAll();
      saveHistory();
    });

    canvas.on("object:added", saveHistory);
    canvas.on("object:modified", saveHistory);
    canvas.on("object:removed", saveHistory);
    canvas.on("mouse:up", () => {
      if (cropMode) {
        const objs = canvas.getObjects() as Array<{
          type: string; left: number; top: number; width: number; height: number;
          scaleX: number; scaleY: number;
        }>;
        const cropObj = objs.find((o) => o.type === "rect" && (o as { isCropRect?: boolean }).isCropRect);
        if (cropObj) {
          setCropRect({
            left: cropObj.left,
            top: cropObj.top,
            width: cropObj.width * cropObj.scaleX,
            height: cropObj.height * cropObj.scaleY,
          });
        }
      }
    });
  }, [cropMode]);

  const saveHistory = useCallback(() => {
    if (!fabricRef.current) return;
    const state = JSON.stringify(fabricRef.current.toJSON());
    const newHistory = historyRef.current.slice(0, historyIdxRef.current + 1);
    newHistory.push(state);
    if (newHistory.length > 50) newHistory.shift();
    historyRef.current = newHistory;
    historyIdxRef.current = newHistory.length - 1;
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(false);
  }, []);

  const undo = () => {
    if (historyIdxRef.current <= 0 || !fabricRef.current) return;
    historyIdxRef.current--;
    fabricRef.current.loadFromJSON(historyRef.current[historyIdxRef.current], () => {
      fabricRef.current?.renderAll();
    });
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(true);
  };

  const redo = () => {
    if (historyIdxRef.current >= historyRef.current.length - 1 || !fabricRef.current) return;
    historyIdxRef.current++;
    fabricRef.current.loadFromJSON(historyRef.current[historyIdxRef.current], () => {
      fabricRef.current?.renderAll();
    });
    setCanUndo(true);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${BASE}/api/media/image/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setImageInfo(data);

      const displayW = Math.min(data.width, 1200);
      const scale = displayW / data.width;
      const displayH = Math.round(data.height * scale);

      initCanvas(`${BASE}${data.url}`, displayW, displayH);
      toast({ title: "Image loaded", description: `${data.width}x${data.height} ${data.format?.toUpperCase()}` });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const applyTool = (tool: Tool) => {
    const canvas = fabricRef.current;
    const lib = fabricLibRef.current;
    if (!canvas || !lib) return;
    setActiveTool(tool);
    canvas.isDrawingMode = false;
    canvas.selection = true;

    if (tool === "draw") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new lib.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = drawColor;
      canvas.freeDrawingBrush.width = drawWidth;
    } else if (tool === "eraser") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new lib.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = "#1a1a2e";
      canvas.freeDrawingBrush.width = drawWidth * 3;
    } else if (tool === "text") {
      const text = new lib.IText(textInput, {
        left: 100, top: 100, fontSize: textSize, fill: textColor,
        fontFamily: "Arial",
        shadow: "rgba(0,0,0,0.5) 2px 2px 3px",
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
    } else if (tool === "rect") {
      const rect = new lib.Rect({
        left: 80, top: 80, width: 200, height: 120,
        stroke: drawColor, strokeWidth: drawWidth, fill: "transparent",
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
    } else if (tool === "circle") {
      const circle = new lib.Circle({
        left: 80, top: 80, radius: 80,
        stroke: drawColor, strokeWidth: drawWidth, fill: "transparent",
      });
      canvas.add(circle);
      canvas.setActiveObject(circle);
      canvas.renderAll();
    } else if (tool === "line") {
      const line = new lib.Line([80, 80, 280, 280], {
        stroke: drawColor, strokeWidth: drawWidth,
      });
      canvas.add(line);
      canvas.setActiveObject(line);
      canvas.renderAll();
    } else if (tool === "crop") {
      setCropMode(true);
      if (imageInfo) {
        const w = imageInfo.width;
        const h = imageInfo.height;
        const cropR = new lib.Rect({
          left: w * 0.1, top: h * 0.1,
          width: w * 0.8, height: h * 0.8,
          stroke: "#00f0ff", strokeWidth: 2,
          fill: "rgba(0,240,255,0.05)",
          strokeDashArray: [8, 4],
          isCropRect: true,
        } as object);
        canvas.add(cropR);
        canvas.setActiveObject(cropR);
        canvas.renderAll();
      }
    }
  };

  const deleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) { canvas.remove(obj); canvas.renderAll(); }
  };

  const clearAll = () => {
    const canvas = fabricRef.current;
    if (!canvas || !imageInfo) return;
    canvas.clear();
    canvas.backgroundColor = "#1a1a2e";
    const lib = fabricLibRef.current;
    if (lib) {
      lib.Image.fromURL(`${BASE}${imageInfo.url}`, (img) => {
        const fImg = img as { set: (opts: object) => void };
        fImg.set({ left: 0, top: 0, selectable: false, evented: false });
        canvas.add(img);
        canvas.renderAll();
      });
    }
  };

  const handleProcess = async () => {
    if (!imageInfo) return;
    setIsProcessing(true);
    try {
      const operations: Record<string, unknown> = { outputFormat, quality: outputQuality };
      if (rotation !== 0) operations.rotate = rotation;
      if (flip.h) operations.flop = true;
      if (flip.v) operations.flip = true;
      if (cropRect) operations.crop = cropRect;
      if (filters.brightness !== 100) operations.brightness = filters.brightness;
      if (filters.contrast !== 100) operations.contrast = filters.contrast;
      if (filters.saturation !== 100) operations.saturation = filters.saturation;
      if (filters.blur > 0) operations.blur = filters.blur;
      if (filters.sharpen) operations.sharpen = true;
      if (filters.grayscale) operations.grayscale = true;
      if (filters.sepia) operations.sepia = true;
      if (filters.negate) operations.negate = true;
      if (filters.gamma !== 100) operations.gamma = filters.gamma / 100;
      if (filters.hue !== 0) operations.hue = filters.hue;
      if (filters.tint) operations.tint = filters.tint;

      // Extract text layers from canvas
      const canvas = fabricRef.current;
      if (canvas) {
        const texts: unknown[] = [];
        const objs = canvas.getObjects() as Array<{
          type: string; text: string; left: number; top: number;
          fontSize: number; fill: string; fontFamily: string;
          fontWeight: string; fontStyle: string;
        }>;
        for (const obj of objs) {
          if (obj.type === "i-text" || obj.type === "text") {
            texts.push({
              text: obj.text,
              x: obj.left,
              y: obj.top + (obj.fontSize || 24),
              fontSize: obj.fontSize || 24,
              color: obj.fill || "#ffffff",
              fontFamily: obj.fontFamily || "Arial",
              bold: obj.fontWeight === "bold",
              italic: obj.fontStyle === "italic",
            });
          }
        }
        if (texts.length > 0) operations.texts = texts;
      }

      const res = await fetch(`${BASE}/api/media/image/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: imageInfo.filename, operations }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Processing failed");
      const data = await res.json();

      // Trigger download
      const link = document.createElement("a");
      link.href = `${BASE}/api/media/download/${data.filename}?dir=processed`;
      link.download = `edited_image.${outputFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Image processed & downloaded", description: `${(data.size / 1024).toFixed(1)} KB` });
    } catch (err) {
      toast({ title: "Processing failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const zoomIn = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const z = Math.min(canvas.getZoom() * 1.25, 5);
    canvas.setZoom(z);
    setZoom(z);
  };

  const zoomOut = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const z = Math.max(canvas.getZoom() * 0.8, 0.1);
    canvas.setZoom(z);
    setZoom(z);
  };

  const resetZoom = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setZoom(1);
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    canvas.renderAll();
    setZoom(1);
  };

  const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "select", icon: <Maximize2 className="w-4 h-4" />, label: "Select" },
    { id: "crop", icon: <Crop className="w-4 h-4" />, label: "Crop" },
    { id: "draw", icon: <Pencil className="w-4 h-4" />, label: "Draw" },
    { id: "eraser", icon: <Eraser className="w-4 h-4" />, label: "Eraser" },
    { id: "text", icon: <Type className="w-4 h-4" />, label: "Text" },
    { id: "rect", icon: <Square className="w-4 h-4" />, label: "Rectangle" },
    { id: "circle", icon: <Circle className="w-4 h-4" />, label: "Circle" },
    { id: "line", icon: <Minus className="w-4 h-4" />, label: "Line" },
  ];

  return (
    <div className="flex flex-col h-full min-h-screen bg-background text-foreground">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-card/30 backdrop-blur">
        <div className="flex items-center gap-1.5 mr-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          <span className="font-bold font-mono text-sm">IMAGE EDITOR</span>
          {imageInfo && (
            <Badge variant="secondary" className="font-mono text-xs ml-2">
              {imageInfo.width}×{imageInfo.height}
            </Badge>
          )}
        </div>
        <Separator orientation="vertical" className="h-6" />

        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
          <Upload className="w-4 h-4" /> Load Image
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />

        <Separator orientation="vertical" className="h-6" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="ghost" onClick={undo} disabled={!canUndo}>
              <Undo className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="ghost" onClick={redo} disabled={!canRedo}>
              <Redo className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        <Button size="sm" variant="ghost" onClick={() => setRotation((r) => r - 90)} title="Rotate Left">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setRotation((r) => r + 90)} title="Rotate Right">
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setFlip((f) => ({ ...f, h: !f.h }))} title="Flip H">
          <FlipHorizontal className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setFlip((f) => ({ ...f, v: !f.v }))} title="Flip V">
          <FlipVertical className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button size="sm" variant="ghost" onClick={zoomOut}><ZoomOut className="w-4 h-4" /></Button>
        <span className="text-xs font-mono text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
        <Button size="sm" variant="ghost" onClick={zoomIn}><ZoomIn className="w-4 h-4" /></Button>
        <Button size="sm" variant="ghost" onClick={resetZoom} title="Reset zoom">1:1</Button>

        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="ghost" onClick={deleteSelected}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete selected</TooltipContent>
        </Tooltip>

        <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as "jpeg" | "png" | "webp")}>
          <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="jpeg">JPEG</SelectItem>
            <SelectItem value="png">PNG</SelectItem>
            <SelectItem value="webp">WebP</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          className="gap-2 bg-primary text-primary-foreground"
          onClick={handleProcess}
          disabled={!imageInfo || isProcessing}
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Tool sidebar */}
        <div className="w-12 flex flex-col items-center gap-1 py-3 border-r border-border/50 bg-card/20">
          {TOOLS.map((t) => (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={activeTool === t.id ? "default" : "ghost"}
                  className={`w-9 h-9 p-0 ${activeTool === t.id ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(0,240,255,0.4)]" : ""}`}
                  onClick={() => applyTool(t.id)}
                  disabled={!imageInfo}
                  data-testid={`tool-${t.id}`}
                >
                  {t.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{t.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Center: Canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-[#0d0d1a] flex items-start justify-start p-4"
          style={{ minHeight: 0 }}
        >
          {!imageInfo && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground min-h-[400px] cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
                <ImageIcon className="w-10 h-10 opacity-40" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">Drop an image or click Load Image</p>
                <p className="text-sm mt-1">Supports JPG, PNG, WebP, GIF — up to 100MB</p>
              </div>
            </motion.div>
          )}
          {isLoading && (
            <div className="w-full h-full flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-mono">Loading image...</p>
              </div>
            </div>
          )}
          <div
            style={{ display: imageInfo && !isLoading ? "block" : "none" }}
            className="shadow-2xl rounded border border-border/30"
          >
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Right: Properties panel */}
        <div className="w-64 border-l border-border/50 bg-card/20 overflow-y-auto flex flex-col">
          {/* Tool options */}
          <AnimatePresence>
            {activeTool === "draw" || activeTool === "eraser" || activeTool === "rect" || activeTool === "circle" || activeTool === "line" ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 border-b border-border/40"
              >
                <p className="text-xs font-bold font-mono text-muted-foreground mb-2 uppercase tracking-wider">Brush / Stroke</p>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-xs w-12">Color</Label>
                  <input type="color" value={drawColor} onChange={(e) => {
                    setDrawColor(e.target.value);
                    if (fabricRef.current) {
                      fabricRef.current.freeDrawingBrush.color = e.target.value;
                    }
                  }} className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent" />
                  <span className="text-xs font-mono text-muted-foreground">{drawColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-12">Width</Label>
                  <Slider value={[drawWidth]} min={1} max={40} onValueChange={([v]) => {
                    setDrawWidth(v);
                    if (fabricRef.current) fabricRef.current.freeDrawingBrush.width = v;
                  }} className="flex-1" />
                  <span className="text-xs font-mono w-6">{drawWidth}</span>
                </div>
              </motion.div>
            ) : null}

            {activeTool === "text" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 border-b border-border/40 space-y-2"
              >
                <p className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider">Text Options</p>
                <div>
                  <Label className="text-xs">Content</Label>
                  <Input value={textInput} onChange={(e) => setTextInput(e.target.value)}
                    className="mt-1 h-8 text-xs" placeholder="Enter text" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-12">Color</Label>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-12">Size</Label>
                  <Slider value={[textSize]} min={8} max={200} onValueChange={([v]) => setTextSize(v)} className="flex-1" />
                  <span className="text-xs font-mono w-6">{textSize}</span>
                </div>
                <Button size="sm" className="w-full mt-1" onClick={() => applyTool("text")}>
                  Add Text
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters */}
          <div className="p-3">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center justify-between w-full text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground"
            >
              <span className="flex items-center gap-1"><SlidersHorizontal className="w-3 h-3" /> Filters & Adjustments</span>
              {filtersOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>

            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {([
                    ["brightness", "Brightness", 0, 200],
                    ["contrast", "Contrast", 0, 200],
                    ["saturation", "Saturation", 0, 200],
                    ["blur", "Blur", 0, 50],
                    ["gamma", "Gamma", 50, 300],
                    ["hue", "Hue Shift", -180, 180],
                  ] as [keyof typeof filters, string, number, number][]).map(([key, label, min, max]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <Label className="text-xs text-muted-foreground">{label}</Label>
                        <span className="text-xs font-mono">{filters[key] as number}</span>
                      </div>
                      <Slider
                        value={[filters[key] as number]}
                        min={min} max={max}
                        onValueChange={([v]) => setFilters((f) => ({ ...f, [key]: v }))}
                      />
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {([
                      ["grayscale", "Grayscale"],
                      ["sepia", "Sepia"],
                      ["negate", "Invert"],
                      ["sharpen", "Sharpen"],
                    ] as [keyof typeof filters, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setFilters((f) => ({ ...f, [key]: !f[key] }))}
                        className={`text-xs py-1.5 px-2 rounded border font-mono transition-colors ${
                          filters[key]
                            ? "bg-primary/20 border-primary text-primary"
                            : "border-border text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        {filters[key] && <Check className="w-3 h-3 inline mr-1" />}
                        {label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Tint Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={filters.tint || "#ffffff"}
                        onChange={(e) => setFilters((f) => ({ ...f, tint: e.target.value }))}
                        className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent" />
                      {filters.tint && (
                        <button onClick={() => setFilters((f) => ({ ...f, tint: "" }))}
                          className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline" size="sm" className="w-full text-xs"
                    onClick={() => setFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0, sharpen: false, grayscale: false, sepia: false, negate: false, gamma: 100, hue: 0, tint: "" })}
                  >
                    Reset Filters
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Export quality */}
          <div className="p-3 border-t border-border/40 mt-auto">
            <p className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider mb-2">Export</p>
            {outputFormat !== "png" && (
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Quality</Label>
                  <span className="text-xs font-mono">{outputQuality}%</span>
                </div>
                <Slider value={[outputQuality]} min={10} max={100}
                  onValueChange={([v]) => setOutputQuality(v)} />
              </div>
            )}
            {imageInfo && (
              <div className="text-xs text-muted-foreground font-mono mt-2 space-y-0.5">
                <p>Src: {imageInfo.width}×{imageInfo.height}</p>
                {rotation !== 0 && <p>Rotation: {rotation}°</p>}
                {(flip.h || flip.v) && <p>Flip: {flip.h ? "H" : ""}{flip.v ? "V" : ""}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
