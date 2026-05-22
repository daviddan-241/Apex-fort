import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const AGENTS = [
  { id: "director", name: "AI Director", role: "Orchestrator", color: "#a855f7" },
  { id: "level", name: "Level Designer", role: "Level Design", color: "#4ade80" },
  { id: "blueprint", name: "Blueprint Agent", role: "Blueprint Generation", color: "#00f0ff" },
  { id: "cpp", name: "C++ Coder", role: "C++ Programming", color: "#fb923c" },
  { id: "asset", name: "Asset Generator", role: "3D/2D Assets", color: "#ec4899" },
  { id: "ui", name: "UI Designer", role: "Interface Design", color: "#22d3ee" },
  { id: "sound", name: "Audio Engineer", role: "Sound & Music", color: "#facc15" },
  { id: "network", name: "Network Engineer", role: "Multiplayer", color: "#818cf8" },
  { id: "qa", name: "QA Tester", role: "Testing", color: "#f87171" },
  { id: "optimizer", name: "Optimizer", role: "Performance", color: "#ffd700" },
];

// GET /api/agents
router.get("/agents", (_req: Request, res: Response) => {
  res.json(
    AGENTS.map((a) => ({
      ...a,
      status: "idle",
      currentTask: null,
    }))
  );
});

export default router;
