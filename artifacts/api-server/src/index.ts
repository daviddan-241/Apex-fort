import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/socket.io",
});

interface PlayerState {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  health: number;
}

const players = new Map<string, PlayerState>();

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Player connected");

  socket.on("player:join", (data: { name: string; color: string }) => {
    const player: PlayerState = {
      id: socket.id,
      name: data.name || `Player_${socket.id.slice(0, 4)}`,
      color: data.color || "#00b4ff",
      position: { x: 0, y: 1, z: 0 },
      rotation: 0,
      health: 100,
    };
    players.set(socket.id, player);
    socket.emit("players:init", Array.from(players.values()));
    socket.broadcast.emit("player:joined", player);
    logger.info({ name: player.name }, "Player joined game");
  });

  socket.on("player:update", (data: Partial<PlayerState>) => {
    const player = players.get(socket.id);
    if (!player) return;
    Object.assign(player, data);
    socket.broadcast.emit("player:updated", { id: socket.id, ...data });
  });

  socket.on("player:shoot", (data: { origin: { x: number; y: number; z: number }; direction: { x: number; y: number; z: number } }) => {
    socket.broadcast.emit("player:shot", { id: socket.id, ...data });
  });

  socket.on("player:hit", (data: { targetId: string; damage: number }) => {
    const target = players.get(data.targetId);
    if (!target) return;
    target.health = Math.max(0, target.health - data.damage);
    io.emit("player:damaged", { id: data.targetId, health: target.health });
    if (target.health <= 0) {
      io.emit("player:eliminated", { id: data.targetId, killerId: socket.id });
      target.health = 100;
    }
  });

  socket.on("chat:message", (data: { text: string }) => {
    const player = players.get(socket.id);
    io.emit("chat:broadcast", { playerId: socket.id, playerName: player?.name ?? "Unknown", text: data.text });
  });

  socket.on("disconnect", () => {
    const player = players.get(socket.id);
    players.delete(socket.id);
    socket.broadcast.emit("player:left", { id: socket.id, name: player?.name });
    logger.info({ socketId: socket.id }, "Player disconnected");
  });
});

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});
