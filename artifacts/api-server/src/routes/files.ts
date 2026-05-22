import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import { uploadedFilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AnalyzeFileParams } from "@workspace/api-zod";
import { openai } from "../lib/openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

// POST /api/files/upload
router.post("/files/upload", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const id = uuidv4();
    const projectId = req.body.projectId || null;

    await db.insert(uploadedFilesTable).values({
      id,
      projectId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.path,
    });

    res.json({
      id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/api/files/${id}/view`,
    });
  } catch (err) {
    logger.error({ err }, "File upload failed");
    res.status(500).json({ error: "Upload failed" });
  }
});

// POST /api/files/:id/analyze
router.post("/files/:id/analyze", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = AnalyzeFileParams.parse(req.params);

    const file = await db
      .select()
      .from(uploadedFilesTable)
      .where(eq(uploadedFilesTable.id, id))
      .then((r) => r[0]);

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const isImage = file.mimeType.startsWith("image/");
    const isVideo = file.mimeType.startsWith("video/");
    const isZip = file.mimeType === "application/zip" || file.originalName.endsWith(".zip");

    let analysis;

    if (isImage) {
      analysis = await analyzeImageWithAI(file.storagePath, file.originalName);
    } else if (isVideo) {
      analysis = await analyzeVideoFile(file.originalName, file.size);
    } else if (isZip) {
      analysis = await analyzeZipFile(file.storagePath, file.originalName);
    } else {
      analysis = await analyzeGenericFile(file.originalName, file.mimeType, file.size);
    }

    // Save analysis result
    await db.update(uploadedFilesTable)
      .set({ analysisResult: analysis })
      .where(eq(uploadedFilesTable.id, id));

    res.json({
      fileId: id,
      ...analysis,
    });
  } catch (err) {
    logger.error({ err }, "File analysis failed");
    res.status(500).json({ error: "Analysis failed" });
  }
});

async function analyzeImageWithAI(filePath: string, fileName: string) {
  try {
    const imageData = fs.readFileSync(filePath);
    const base64 = imageData.toString("base64");
    const ext = path.extname(fileName).slice(1).toLowerCase();
    const mediaType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mediaType};base64,${base64}` },
            },
            {
              type: "text",
              text: `Analyze this image for use in a video game. Return a JSON object with:
- summary: 2-sentence description of what's in the image
- suggestions: array of 3-5 suggestions for how to use this as a game asset
- detectedObjects: array of key objects/elements detected
- gameElements: array of game-relevant elements (e.g., "character design", "environment texture", "weapon reference", "UI element")`,
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch {
    return {
      summary: `Image file: ${fileName}. Ready to use as a game reference asset.`,
      suggestions: [
        "Use as character concept art reference",
        "Extract color palette for environment design",
        "Use as texture source for 3D models",
      ],
      detectedObjects: ["image", "visual asset"],
      gameElements: ["reference art", "concept design"],
    };
  }
}

async function analyzeVideoFile(fileName: string, size: number) {
  const sizeInMB = (size / (1024 * 1024)).toFixed(1);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `A user uploaded a video file for a UE5 game project: "${fileName}" (${sizeInMB}MB).
Return JSON with: summary, suggestions (3-4 items), detectedObjects, gameElements.
Focus on how this video could be used in a game project.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
    });
    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch {
    return {
      summary: `Video file "${fileName}" (${sizeInMB}MB). Can be used as a cinematic cutscene or gameplay reference.`,
      suggestions: [
        "Use as a cinematic intro/outro cutscene",
        "Reference for animation timing and style",
        "Extract frames for texture atlas creation",
      ],
      detectedObjects: ["video", "footage"],
      gameElements: ["cutscene reference", "animation guide"],
    };
  }
}

async function analyzeZipFile(filePath: string, fileName: string) {
  let fileList: string[] = [];
  try {
    const AdmZip = (await import("adm-zip")).default;
    const zip = new AdmZip(filePath);
    fileList = zip.getEntries().map((e) => e.entryName).slice(0, 20);
  } catch {
    // ignore
  }

  const fileListStr = fileList.length > 0 ? fileList.join(", ") : "unknown contents";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `A user uploaded a zip file for their UE5 game: "${fileName}". Contents include: ${fileListStr}. Return JSON with: summary, suggestions (3-4), detectedObjects, gameElements.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
    });
    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch {
    return {
      summary: `Archive "${fileName}" containing ${fileList.length} files. Assets ready for integration.`,
      suggestions: [
        "Extract and import meshes into UE5 Content Browser",
        "Use texture files for material creation",
        "Review folder structure for organization tips",
      ],
      detectedObjects: fileList.slice(0, 5),
      gameElements: ["asset pack", "project files"],
    };
  }
}

async function analyzeGenericFile(fileName: string, mimeType: string, size: number) {
  return {
    summary: `File "${fileName}" (${mimeType}, ${(size / 1024).toFixed(1)}KB). Ready to incorporate into your UE5 project.`,
    suggestions: [
      "Review file format compatibility with UE5",
      "Import directly into Content Browser if supported",
      "Use as reference material for AI generation",
    ],
    detectedObjects: [mimeType],
    gameElements: ["project asset", "reference file"],
  };
}

export default router;
