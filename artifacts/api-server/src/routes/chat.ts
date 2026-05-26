import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, chatMessagesTable, engineConfigTable } from "@workspace/db";
import { SendChatMessageBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface ConfigChange {
  field: string;
  value: number | boolean | string;
  description: string;
}

function serializeMessage(m: typeof chatMessagesTable.$inferSelect) {
  return { ...m, createdAt: m.createdAt.toISOString() };
}

function parseGameCommand(content: string): { response: string; changes: ConfigChange[] } {
  const lower = content.toLowerCase().trim();
  const changes: ConfigChange[] = [];
  let response = "";

  if (/increase.*jump|jump.*higher|higher.*jump|boost.*jump/.test(lower)) {
    changes.push({ field: "jumpHeight", value: 14, description: "Jump height increased to 14" });
    response = "Jump height boosted to 14! Your character will now leap much higher.";
  } else if (/decrease.*jump|lower.*jump|reduce.*jump/.test(lower)) {
    changes.push({ field: "jumpHeight", value: 5, description: "Jump height decreased to 5" });
    response = "Jump height reduced to 5. More grounded movement now.";
  } else if (/faster.*movement|speed.*up|increase.*speed|move.*faster|movement.*faster/.test(lower)) {
    changes.push({ field: "movementSpeed", value: 9, description: "Movement speed increased to 9" });
    changes.push({ field: "sprintMultiplier", value: 2.2, description: "Sprint multiplier increased to 2.2" });
    response = "Movement speed cranked up to 9 with 2.2x sprint! You'll be blazing across the map.";
  } else if (/slower.*movement|slow.*down|decrease.*speed/.test(lower)) {
    changes.push({ field: "movementSpeed", value: 3, description: "Movement speed decreased to 3" });
    response = "Movement slowed to 3. Tactical pace engaged.";
  } else if (/normal.*speed|default.*speed|reset.*speed/.test(lower)) {
    changes.push({ field: "movementSpeed", value: 5, description: "Movement speed reset to 5" });
    changes.push({ field: "sprintMultiplier", value: 1.8, description: "Sprint multiplier reset to 1.8" });
    response = "Movement speed reset to defaults (5 / 1.8x sprint).";
  } else if (/add.*fog|enable.*fog|turn.*on.*fog|more.*fog/.test(lower)) {
    changes.push({ field: "fogEnabled", value: true, description: "Fog enabled" });
    changes.push({ field: "fogDensity", value: 0.025, description: "Fog density set to 0.025" });
    response = "Dense fog rolling in. Visibility reduced — watch your flanks.";
  } else if (/remove.*fog|disable.*fog|turn.*off.*fog|no.*fog|less.*fog/.test(lower)) {
    changes.push({ field: "fogEnabled", value: false, description: "Fog disabled" });
    response = "Fog cleared. Crystal-clear visibility across the entire map.";
  } else if (/brighter|more.*light|increase.*light|lighter/.test(lower)) {
    changes.push({ field: "ambientLight", value: 0.9, description: "Ambient light increased to 0.9" });
    changes.push({ field: "bloomEnabled", value: true, description: "Bloom enabled" });
    changes.push({ field: "bloomIntensity", value: 1.2, description: "Bloom intensity increased to 1.2" });
    response = "Scene flooded with light. Ambient 0.9, bloom at 1.2 intensity.";
  } else if (/darker|less.*light|decrease.*light/.test(lower)) {
    changes.push({ field: "ambientLight", value: 0.15, description: "Ambient light decreased to 0.15" });
    changes.push({ field: "bloomEnabled", value: false, description: "Bloom disabled" });
    response = "Scene darkened to ambient 0.15. Nighttime atmosphere engaged.";
  } else if (/fps.*camera|first.*person|switch.*fps/.test(lower)) {
    changes.push({ field: "cameraMode", value: "first_person", description: "Camera switched to first-person" });
    response = "Camera switched to first-person. You're now looking through the character's eyes.";
  } else if (/third.*person|tps.*camera|switch.*tps/.test(lower)) {
    changes.push({ field: "cameraMode", value: "third_person", description: "Camera switched to third-person" });
    response = "Camera switched to third-person. Classic Fortnite-style view engaged.";
  } else if (/shoulder|ads.*cam|aim.*cam/.test(lower)) {
    changes.push({ field: "cameraMode", value: "shoulder", description: "Camera switched to shoulder mode" });
    response = "Shoulder camera mode engaged. Perfect for precision aiming.";
  } else if (/more.*damage|increase.*damage|stronger.*gun|powerful.*gun/.test(lower)) {
    changes.push({ field: "bulletDamage", value: 50, description: "Bullet damage increased to 50" });
    response = "Bullet damage doubled to 50. Every shot hits like a truck.";
  } else if (/less.*damage|decrease.*damage|weaker.*gun/.test(lower)) {
    changes.push({ field: "bulletDamage", value: 10, description: "Bullet damage decreased to 10" });
    response = "Bullet damage reduced to 10. More survivable gunfights ahead.";
  } else if (/faster.*reload|quick.*reload|speed.*reload|reload.*faster/.test(lower)) {
    changes.push({ field: "reloadTime", value: 0.8, description: "Reload time reduced to 0.8s" });
    response = "Reload speed at 0.8s. Barely any downtime between magazines.";
  } else if (/slower.*reload|longer.*reload/.test(lower)) {
    changes.push({ field: "reloadTime", value: 4, description: "Reload time increased to 4s" });
    response = "Reload time at 4 seconds. Make every shot count!";
  } else if (/more.*gravity|heavier|increase.*gravity/.test(lower)) {
    changes.push({ field: "gravity", value: 35, description: "Gravity increased to 35" });
    response = "Gravity cranked to 35. Heavy-footed combat mode.";
  } else if (/less.*gravity|lighter|decrease.*gravity|low.*gravity/.test(lower)) {
    changes.push({ field: "gravity", value: 6, description: "Gravity decreased to 6" });
    response = "Low gravity! Characters float and drift — great for aerial combat.";
  } else if (/enable.*bloom|add.*bloom|turn.*on.*bloom/.test(lower)) {
    changes.push({ field: "bloomEnabled", value: true, description: "Bloom enabled" });
    changes.push({ field: "bloomIntensity", value: 0.8, description: "Bloom intensity set to 0.8" });
    response = "Bloom enabled at 0.8 intensity. Light sources now glow cinematically.";
  } else if (/disable.*bloom|remove.*bloom|no.*bloom/.test(lower)) {
    changes.push({ field: "bloomEnabled", value: false, description: "Bloom disabled" });
    response = "Bloom disabled. Sharp, clean rendering.";
  } else if (/enable.*shadow|add.*shadow|turn.*on.*shadow/.test(lower)) {
    changes.push({ field: "shadowsEnabled", value: true, description: "Shadows enabled" });
    response = "Real-time dynamic shadows enabled.";
  } else if (/disable.*shadow|remove.*shadow|no.*shadow/.test(lower)) {
    changes.push({ field: "shadowsEnabled", value: false, description: "Shadows disabled" });
    response = "Shadows disabled. Performance boost achieved.";
  } else if (/increase.*fov|wider.*fov|more.*fov|fov.*up/.test(lower)) {
    changes.push({ field: "fov", value: 100, description: "FOV increased to 100" });
    response = "FOV widened to 100°. Much more of the battlefield visible.";
  } else if (/decrease.*fov|narrow.*fov|less.*fov/.test(lower)) {
    changes.push({ field: "fov", value: 60, description: "FOV decreased to 60" });
    response = "FOV narrowed to 60°. Sniper-style precision view.";
  } else if (/enable.*particle|add.*particle|turn.*on.*particle/.test(lower)) {
    changes.push({ field: "particlesEnabled", value: true, description: "Particles enabled" });
    response = "Particle effects enabled! Explosions and muzzle flashes now render.";
  } else if (/disable.*particle|remove.*particle|no.*particle/.test(lower)) {
    changes.push({ field: "particlesEnabled", value: false, description: "Particles disabled" });
    response = "Particles disabled. Maximum performance mode.";
  } else if (/reset|default|restore.*default/.test(lower)) {
    changes.push({ field: "movementSpeed", value: 5, description: "Movement speed reset" });
    changes.push({ field: "jumpHeight", value: 8, description: "Jump height reset" });
    changes.push({ field: "gravity", value: 20, description: "Gravity reset" });
    changes.push({ field: "fogEnabled", value: true, description: "Fog enabled" });
    changes.push({ field: "fogDensity", value: 0.01, description: "Fog density reset" });
    changes.push({ field: "bloomEnabled", value: true, description: "Bloom enabled" });
    changes.push({ field: "cameraMode", value: "third_person", description: "Camera reset" });
    changes.push({ field: "bulletDamage", value: 25, description: "Bullet damage reset" });
    changes.push({ field: "fov", value: 75, description: "FOV reset" });
    response = "All engine settings restored to default values. Clean slate!";
  } else {
    response = `Command understood. Try: "increase jump height", "add fog", "switch to FPS camera", "faster movement", "more gravity", "brighter", "increase damage", "faster reload", "enable bloom", "wider FOV", or "reset to defaults".`;
  }

  return { response, changes };
}

router.get("/chat", async (_req, res): Promise<void> => {
  const messages = await db.select().from(chatMessagesTable).orderBy(desc(chatMessagesTable.createdAt)).limit(50);
  res.json(messages.reverse().map(serializeMessage));
});

router.post("/chat", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.insert(chatMessagesTable).values({ role: "user", content: parsed.data.content });

  const { response, changes } = parseGameCommand(parsed.data.content);

  if (changes.length > 0) {
    const [currentConfig] = await db.select().from(engineConfigTable).limit(1);
    if (!currentConfig) {
      await db.insert(engineConfigTable).values({});
    }
    const [cfg] = await db.select().from(engineConfigTable).limit(1);
    if (cfg) {
      const updateData: Record<string, number | boolean | string | Date> = { updatedAt: new Date() };
      for (const change of changes) {
        updateData[change.field] = change.value;
      }
      await db.update(engineConfigTable).set(updateData).where(eq(engineConfigTable.id, cfg.id));
    }
  }

  const configChangesJson = changes.length > 0 ? JSON.stringify(changes) : null;
  const [assistantMsg] = await db.insert(chatMessagesTable).values({
    role: "assistant",
    content: response,
    configChanges: configChangesJson,
  }).returning();

  logger.info({ changesApplied: changes.length }, "AI chat command processed");
  res.json(serializeMessage(assistantMsg));
});

export default router;
