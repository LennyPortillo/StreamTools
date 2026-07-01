const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 3847;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "cambiar-esto";
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const DATA_FILE = path.join(__dirname, "data.json");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { items: [], editorTokens: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let state = loadData();

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo imágenes"));
  },
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, "public")));

function isValidToken(token) {
  return state.editorTokens.includes(token);
}

app.get("/", (_req, res) => {
  res.redirect("/admin.html");
});

app.get("/api/state", (_req, res) => {
  res.json(state.items);
});

app.post("/api/upload", upload.single("image"), (req, res) => {
  const token = req.body.token;
  if (!isValidToken(token)) return res.status(403).json({ error: "Token inválido" });

  const item = {
    id: uuidv4(),
    url: `/uploads/${req.file.filename}`,
    x: 100,
    y: 100,
    width: 300,
    height: 300,
    rotation: 0,
    author: req.body.name || "Anónimo",
    createdAt: Date.now(),
  };

  state.items.push(item);
  saveData(state);
  io.emit("state", state.items);
  res.json(item);
});

app.put("/api/items/:id", (req, res) => {
  const token = req.body.token;
  if (!isValidToken(token)) return res.status(403).json({ error: "Token inválido" });

  const idx = state.items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "No encontrado" });

  const { x, y, width, height, rotation } = req.body;
  if (x !== undefined) state.items[idx].x = x;
  if (y !== undefined) state.items[idx].y = y;
  if (width !== undefined) state.items[idx].width = width;
  if (height !== undefined) state.items[idx].height = height;
  if (rotation !== undefined) state.items[idx].rotation = rotation;

  saveData(state);
  io.emit("state", state.items);
  res.json(state.items[idx]);
});

app.delete("/api/items/:id", (req, res) => {
  const token = req.query.token;
  if (!isValidToken(token)) return res.status(403).json({ error: "Token inválido" });

  const idx = state.items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "No encontrado" });

  const item = state.items[idx];
  const filePath = path.join(__dirname, item.url);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  state.items.splice(idx, 1);
  saveData(state);
  io.emit("state", state.items);
  res.json({ ok: true });
});

app.post("/api/admin/tokens", (req, res) => {
  if (req.body.secret !== ADMIN_SECRET) return res.status(403).json({ error: "Secret incorrecto" });

  const token = uuidv4().slice(0, 8);
  state.editorTokens.push(token);
  saveData(state);
  res.json({ token, url: `${PUBLIC_URL}/editor.html?token=${token}` });
});

app.get("/api/admin/tokens", (req, res) => {
  if (req.query.secret !== ADMIN_SECRET) return res.status(403).json({ error: "Secret incorrecto" });
  res.json({
    tokens: state.editorTokens,
    overlayUrl: `${PUBLIC_URL}/overlay.html`,
    itemCount: state.items.length,
  });
});

app.delete("/api/admin/clear", (req, res) => {
  if (req.body.secret !== ADMIN_SECRET) return res.status(403).json({ error: "Secret incorrecto" });

  for (const item of state.items) {
    const filePath = path.join(__dirname, item.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  state.items = [];
  saveData(state);
  io.emit("state", state.items);
  res.json({ ok: true });
});

io.on("connection", (socket) => {
  socket.emit("state", state.items);
});

server.listen(PORT, () => {
  console.log(`\n  PENMA Overlay → ${PUBLIC_URL}`);
  console.log(`  OBS Browser Source → ${PUBLIC_URL}/overlay.html`);
  console.log(`  Admin → ${PUBLIC_URL}/admin.html`);
  console.log(`  (local) → http://localhost:${PORT}`);
  console.log(`  ADMIN_SECRET: ${ADMIN_SECRET}\n`);
});
