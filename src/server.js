import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME || "NickoChat App";
const MAX_MESSAGE_LENGTH = Number(process.env.MAX_MESSAGE_LENGTH || 180);

const users = new Map();
const recentMessages = [];

app.use(express.static(path.join(__dirname, "../public")));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: APP_NAME,
    usersOnline: users.size,
    messagesStored: recentMessages.length,
    timestamp: new Date().toISOString()
  });
});

io.on("connection", (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.on("user:join", (username) => {
    const cleanName = String(username || "").trim().slice(0, 20);

    if (cleanName.length < 2) {
      socket.emit("system:error", "El nombre debe tener al menos 2 caracteres.");
      return;
    }

    users.set(socket.id, cleanName);

    socket.emit("chat:history", recentMessages);

    io.emit("users:update", Array.from(users.values()));

    io.emit("system:message", {
      text: `${cleanName} se conectó.`,
      time: getTime()
    });

    console.log(`${cleanName} se conectó.`);
  });

  socket.on("chat:message", (message) => {
    const username = users.get(socket.id);

    if (!username) {
      socket.emit("system:error", "Primero tenés que ingresar con un nombre.");
      return;
    }

    const cleanMessage = String(message || "").trim().slice(0, MAX_MESSAGE_LENGTH);

    if (!cleanMessage) {
      socket.emit("system:error", "El mensaje no puede estar vacío.");
      return;
    }

    const chatMessage = {
      user: username,
      text: cleanMessage,
      time: getTime()
    };

    recentMessages.push(chatMessage);

    if (recentMessages.length > 30) {
      recentMessages.shift();
    }

    io.emit("chat:message", chatMessage);

    console.log(`${username}: ${cleanMessage}`);
  });

  socket.on("disconnect", () => {
    const username = users.get(socket.id);

    if (!username) return;

    users.delete(socket.id);

    io.emit("users:update", Array.from(users.values()));

    io.emit("system:message", {
      text: `${username} se desconectó.`,
      time: getTime()
    });

    console.log(`${username} se desconectó.`);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`${APP_NAME} escuchando en puerto ${PORT}`);
});

function getTime() {
  return new Date().toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}