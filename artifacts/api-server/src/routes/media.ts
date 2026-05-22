import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import Ffmpeg from "fluent-ffmpeg";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const PROCESSED_DIR = path.join(process.cwd(), "processed");

for (const dir of [UPLOADS_DIR, PROCESSED_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// ─── Image processing ────────────────────────────────────────────────────────

// POST /api/media/image/upload
router.post(
  "/media/image/upload",
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No image uploaded" });
      return;
    }
    try {
      const meta = await sharp(req.file.path).metadata();
      res.json({
        id: path.basename(req.file.path),
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        width: meta.width,
        height: meta.height,
        format: meta.format,
        size: req.file.size,
        url: `/api/media/file/${req.file.filename}`,
      });
    } catch (err) {
      logger.error({ err }, "Image upload failed");
      res.status(500).json({ error: "Image upload failed" });
    }
  }
);

// POST /api/media/image/process
router.post("/media/image/process", async (req: Request, res: Response): Promise<void> => {
  const {
    filename,
    operations,
  }: {
    filename: string;
    operations: {
      crop?: { left: number; top: number; width: number; height: number };
      resize?: { width?: number; height?: number; fit?: string };
      rotate?: number;
      flip?: boolean;
      flop?: boolean;
      grayscale?: boolean;
      brightness?: number;
      saturation?: number;
      hue?: number;
      blur?: number;
      sharpen?: boolean;
      gamma?: number;
      negate?: boolean;
      sepia?: boolean;
      tint?: string;
      texts?: Array<{
        text: string;
        x: number;
        y: number;
        fontSize: number;
        color: string;
        fontFamily?: string;
        bold?: boolean;
        italic?: boolean;
      }>;
      drawings?: Array<{
        type: "rect" | "circle" | "line";
        x: number;
        y: number;
        width?: number;
        height?: number;
        radius?: number;
        color: string;
        strokeWidth: number;
        fill?: boolean;
      }>;
      outputFormat?: "jpeg" | "png" | "webp";
      quality?: number;
    };
  } = req.body;

  const inputPath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(inputPath)) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  try {
    const fmt = operations.outputFormat || "jpeg";
    const outFilename = `processed_${uuidv4()}.${fmt}`;
    const outputPath = path.join(PROCESSED_DIR, outFilename);

    const meta = await sharp(inputPath).metadata();
    const imgW = meta.width || 800;
    const imgH = meta.height || 600;

    let pipeline = sharp(inputPath);

    if (operations.rotate) pipeline = pipeline.rotate(operations.rotate);
    if (operations.flip) pipeline = pipeline.flip();
    if (operations.flop) pipeline = pipeline.flop();

    if (operations.crop) {
      const c = operations.crop;
      pipeline = pipeline.extract({
        left: Math.max(0, Math.round(c.left)),
        top: Math.max(0, Math.round(c.top)),
        width: Math.max(1, Math.round(c.width)),
        height: Math.max(1, Math.round(c.height)),
      });
    }

    if (operations.resize) {
      const r = operations.resize;
      pipeline = pipeline.resize(r.width, r.height, {
        fit: (r.fit as sharp.FitEnum[keyof sharp.FitEnum]) || "inside",
        withoutEnlargement: true,
      });
    }

    if (operations.grayscale) pipeline = pipeline.grayscale();
    if (operations.negate) pipeline = pipeline.negate();
    if (operations.gamma) pipeline = pipeline.gamma(operations.gamma);

    if (operations.sepia) {
      pipeline = pipeline.recomb([
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131],
      ]);
    }

    const hasMod = operations.brightness !== undefined || operations.saturation !== undefined || operations.hue !== undefined;
    if (hasMod) {
      pipeline = pipeline.modulate({
        brightness: operations.brightness !== undefined ? operations.brightness / 100 : 1,
        saturation: operations.saturation !== undefined ? operations.saturation / 100 : 1,
        hue: operations.hue ?? 0,
      });
    }

    if (operations.blur && operations.blur > 0) {
      pipeline = pipeline.blur(Math.min(operations.blur, 100));
    }

    if (operations.sharpen) {
      pipeline = pipeline.sharpen({ sigma: 1.5, m1: 1.5, m2: 0.7, x1: 2, y2: 10, y3: 20 });
    }

    if (operations.tint) {
      const hex = operations.tint.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      pipeline = pipeline.tint({ r, g, b });
    }

    // Text and drawing overlays via SVG compositing
    const overlays: sharp.OverlayOptions[] = [];

    if (operations.texts && operations.texts.length > 0) {
      for (const t of operations.texts) {
        const weight = t.bold ? "bold" : "normal";
        const style = t.italic ? "italic" : "normal";
        const svgText = `<svg width="${imgW}" height="${imgH}">
          <text x="${t.x}" y="${t.y}"
            font-size="${t.fontSize}"
            font-family="${t.fontFamily || "Arial, sans-serif"}"
            font-weight="${weight}"
            font-style="${style}"
            fill="${t.color}"
            stroke="rgba(0,0,0,0.4)"
            stroke-width="1"
            paint-order="stroke">${escapeXml(t.text)}</text>
        </svg>`;
        overlays.push({ input: Buffer.from(svgText), blend: "over" });
      }
    }

    if (operations.drawings && operations.drawings.length > 0) {
      let svgShapes = `<svg width="${imgW}" height="${imgH}">`;
      for (const d of operations.drawings) {
        const stroke = d.fill ? "none" : d.color;
        const fill = d.fill ? d.color : "none";
        if (d.type === "rect" && d.width && d.height) {
          svgShapes += `<rect x="${d.x}" y="${d.y}" width="${d.width}" height="${d.height}" stroke="${stroke}" fill="${fill}" stroke-width="${d.strokeWidth}" />`;
        } else if (d.type === "circle" && d.radius) {
          svgShapes += `<circle cx="${d.x}" cy="${d.y}" r="${d.radius}" stroke="${stroke}" fill="${fill}" stroke-width="${d.strokeWidth}" />`;
        }
      }
      svgShapes += "</svg>";
      overlays.push({ input: Buffer.from(svgShapes), blend: "over" });
    }

    if (overlays.length > 0) pipeline = pipeline.composite(overlays);

    if (fmt === "jpeg") pipeline = pipeline.jpeg({ quality: operations.quality || 90 });
    else if (fmt === "png") pipeline = pipeline.png({ compressionLevel: 7 });
    else if (fmt === "webp") pipeline = pipeline.webp({ quality: operations.quality || 85 });

    await pipeline.toFile(outputPath);
    const stat = fs.statSync(outputPath);

    res.json({
      filename: outFilename,
      url: `/api/media/file/${outFilename}?dir=processed`,
      size: stat.size,
      format: fmt,
    });
  } catch (err) {
    logger.error({ err }, "Image processing failed");
    res.status(500).json({ error: "Image processing failed: " + (err instanceof Error ? err.message : String(err)) });
  }
});

// POST /api/media/image/info — get dimensions for a filename
router.post("/media/image/info", async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.body as { filename: string };
  const inputPath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(inputPath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  try {
    const meta = await sharp(inputPath).metadata();
    res.json({ width: meta.width, height: meta.height, format: meta.format });
  } catch (err) {
    res.status(500).json({ error: "Failed to read image info" });
  }
});

// ─── Video processing ─────────────────────────────────────────────────────────

// POST /api/media/video/upload
router.post(
  "/media/video/upload",
  upload.single("video"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No video uploaded" });
      return;
    }
    try {
      const info = await probeVideo(req.file.path);
      res.json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        url: `/api/media/file/${req.file.filename}`,
        ...info,
      });
    } catch (err) {
      logger.error({ err }, "Video upload failed");
      res.status(500).json({ error: "Video upload/probe failed" });
    }
  }
);

// POST /api/media/video/process
router.post("/media/video/process", async (req: Request, res: Response): Promise<void> => {
  const {
    filename,
    operations,
  }: {
    filename: string;
    operations: {
      trim?: { start: number; end: number };
      resize?: { width: number; height: number };
      rotate?: 0 | 90 | 180 | 270;
      mute?: boolean;
      brightness?: number;
      contrast?: number;
      saturation?: number;
      blur?: number;
      grayscale?: boolean;
      sepia?: boolean;
      speed?: number;
      texts?: Array<{
        text: string;
        x: string;
        y: string;
        fontSize: number;
        color: string;
        startTime?: number;
        endTime?: number;
        bold?: boolean;
      }>;
      watermark?: { text: string; position: "tl" | "tr" | "bl" | "br" | "center" };
      outputFormat?: "mp4" | "webm" | "mov";
      quality?: "low" | "medium" | "high" | "lossless";
    };
  } = req.body;

  const inputPath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(inputPath)) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  try {
    const fmt = operations.outputFormat || "mp4";
    const outFilename = `processed_${uuidv4()}.${fmt}`;
    const outputPath = path.join(PROCESSED_DIR, outFilename);

    await processVideo(inputPath, outputPath, operations, fmt);

    const stat = fs.statSync(outputPath);
    res.json({
      filename: outFilename,
      url: `/api/media/file/${outFilename}?dir=processed`,
      size: stat.size,
      format: fmt,
    });
  } catch (err) {
    logger.error({ err }, "Video processing failed");
    res.status(500).json({ error: "Video processing failed: " + (err instanceof Error ? err.message : String(err)) });
  }
});

// POST /api/media/video/probe — get video metadata
router.post("/media/video/probe", async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.body as { filename: string };
  const inputPath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(inputPath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  try {
    const info = await probeVideo(inputPath);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: "Failed to probe video" });
  }
});

// GET /api/media/file/:filename — serve processed or uploaded file
router.get("/media/file/:filename", (req: Request, res: Response): void => {
  const filename = String(req.params.filename);
  const dir = req.query.dir === "processed" ? PROCESSED_DIR : UPLOADS_DIR;
  const filePath = path.join(dir, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const ext = path.extname(String(filename)).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
  };
  const mime = mimeMap[ext] || "application/octet-stream";

  res.setHeader("Content-Type", mime);
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-cache");

  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  if (range && mime.startsWith("video/")) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = end - start + 1;
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Length", chunksize);
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.setHeader("Content-Length", stat.size);
    fs.createReadStream(filePath).pipe(res);
  }
});

// GET /api/media/download/:filename — force download
router.get("/media/download/:filename", (req: Request, res: Response): void => {
  const filename = String(req.params.filename);
  const dir = req.query.dir === "processed" ? PROCESSED_DIR : UPLOADS_DIR;
  const filePath = path.join(dir, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.download(filePath);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function probeVideo(filePath: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    Ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      const vStream = data.streams.find((s) => s.codec_type === "video");
      const aStream = data.streams.find((s) => s.codec_type === "audio");
      const fps = vStream?.r_frame_rate
        ? evalFraction(vStream.r_frame_rate as string)
        : 30;
      resolve({
        duration: data.format.duration ?? 0,
        width: vStream?.width ?? 0,
        height: vStream?.height ?? 0,
        fps: Math.round(fps * 100) / 100,
        codec: vStream?.codec_name ?? "unknown",
        audioCodec: aStream?.codec_name ?? null,
        bitrate: data.format.bit_rate ? Math.round(Number(data.format.bit_rate) / 1000) : 0,
        size: data.format.size ?? 0,
        formatName: data.format.format_name,
      });
    });
  });
}

function evalFraction(frac: string): number {
  const [num, den] = frac.split("/").map(Number);
  return den ? num / den : num;
}

function processVideo(
  inputPath: string,
  outputPath: string,
  ops: Record<string, unknown>,
  fmt: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    let cmd = Ffmpeg(inputPath);

    // Trim
    const trim = ops.trim as { start: number; end: number } | undefined;
    if (trim) {
      cmd = cmd.seekInput(trim.start).duration(trim.end - trim.start);
    }

    // Video filters
    const vFilters: string[] = [];

    const brightness = ops.brightness as number | undefined;
    const contrast = ops.contrast as number | undefined;
    const saturation = ops.saturation as number | undefined;

    if (brightness !== undefined || contrast !== undefined || saturation !== undefined) {
      const b = brightness !== undefined ? (brightness - 100) / 100 : 0;
      const c = contrast !== undefined ? contrast / 100 : 1;
      const s = saturation !== undefined ? saturation / 100 : 1;
      vFilters.push(`eq=brightness=${b}:contrast=${c}:saturation=${s}`);
    }

    const blur = ops.blur as number | undefined;
    if (blur && blur > 0) {
      vFilters.push(`boxblur=${Math.round(blur / 10)}`);
    }

    if (ops.grayscale) {
      vFilters.push("hue=s=0");
    }

    if (ops.sepia) {
      vFilters.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131");
    }

    const resize = ops.resize as { width: number; height: number } | undefined;
    if (resize) {
      vFilters.push(`scale=${resize.width}:${resize.height}`);
    }

    const rotate = ops.rotate as number | undefined;
    if (rotate) {
      const transposeMap: Record<number, string> = {
        90: "transpose=1",
        180: "transpose=2,transpose=2",
        270: "transpose=2",
      };
      if (transposeMap[rotate]) vFilters.push(transposeMap[rotate]);
    }

    const speed = ops.speed as number | undefined;
    if (speed && speed !== 1) {
      vFilters.push(`setpts=${1 / speed}*PTS`);
    }

    // Text overlays
    const texts = ops.texts as Array<{
      text: string; x: string; y: string; fontSize: number;
      color: string; startTime?: number; endTime?: number; bold?: boolean;
    }> | undefined;

    if (texts && texts.length > 0) {
      for (const t of texts) {
        const safeText = t.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
        const color = t.color.replace("#", "0x");
        let filter = `drawtext=text='${safeText}':x=${t.x}:y=${t.y}:fontsize=${t.fontSize}:fontcolor=${color}:shadowcolor=black:shadowx=2:shadowy=2`;
        if (t.bold) filter += ":font=bold";
        if (t.startTime !== undefined && t.endTime !== undefined) {
          filter += `:enable='between(t,${t.startTime},${t.endTime})'`;
        }
        vFilters.push(filter);
      }
    }

    const watermark = ops.watermark as { text: string; position: string } | undefined;
    if (watermark) {
      const posMap: Record<string, string> = {
        tl: "x=20:y=20",
        tr: "x=w-tw-20:y=20",
        bl: "x=20:y=h-th-20",
        br: "x=w-tw-20:y=h-th-20",
        center: "x=(w-tw)/2:y=(h-th)/2",
      };
      const pos = posMap[watermark.position] || posMap.br;
      vFilters.push(`drawtext=text='${watermark.text.replace(/'/g, "\\'")}':${pos}:fontsize=32:fontcolor=white@0.7:shadowcolor=black:shadowx=2:shadowy=2`);
    }

    if (vFilters.length > 0) {
      cmd = cmd.videoFilter(vFilters);
    }

    // Audio
    if (ops.mute) cmd = cmd.noAudio();

    if (speed && speed !== 1 && !ops.mute) {
      cmd = cmd.audioFilter(`atempo=${Math.min(2, Math.max(0.5, speed))}`);
    }

    // Output format
    if (fmt === "mp4") {
      cmd = cmd.outputOptions(["-c:v libx264", "-preset fast", "-crf 23", "-movflags +faststart"]);
      if (!ops.mute) cmd = cmd.outputOptions(["-c:a aac", "-b:a 128k"]);
    } else if (fmt === "webm") {
      cmd = cmd.outputOptions(["-c:v libvpx-vp9", "-crf 30", "-b:v 0"]);
      if (!ops.mute) cmd = cmd.outputOptions(["-c:a libopus"]);
    }

    cmd
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

export default router;
