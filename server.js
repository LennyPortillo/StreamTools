const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 3847;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "cambiar-esto";
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const DATA_FILE = path.join(__dirname, "data.json");

const MAX_ITEMS = 80;
const MAX_PENDING = 50;
const MAX_TOKENS = 25;
const MAX_MOD_TOKENS = 10;
const MAX_NAME_LEN = 24;
const SESSION_MS = 8 * 60 * 60 * 1000;
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

const adminSessions = new Map();
const rateBuckets = new Map();

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function loadData() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (!Array.isArray(data.items)) data.items = [];
    if (!Array.isArray(data.pendingItems)) data.pendingItems = [];
    if (!Array.isArray(data.editorTokens)) data.editorTokens = [];
    if (!Array.isArray(data.modTokens)) data.modTokens = [];
    if (data.moderationEnabled === undefined) data.moderationEnabled = true;
    return data;
  } catch {
    return {
      items: [],
      pendingItems: [],
      editorTokens: [],
      modTokens: [],
      moderationEnabled: true,
    };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let state = loadData();

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

function getCookie(req, name) {
  const raw = req.headers.cookie || "";
  const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setSessionCookie(res, sessionId) {
  const secure = PUBLIC_URL.startsWith("https");
  res.setHeader(
    "Set-Cookie",
    `admin_session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${secure ? "; Secure" : ""}`
  );
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "admin_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict");
}

function createSession() {
  const id = crypto.randomBytes(32).toString("hex");
  adminSessions.set(id, Date.now() + SESSION_MS);
  return id;
}

function isValidSession(id) {
  if (!id || !adminSessions.has(id)) return false;
  if (Date.now() > adminSessions.get(id)) {
    adminSessions.delete(id);
    return false;
  }
  return true;
}

function rateLimit(scope, max, windowMs) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${scope}:${ip}`;
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || now > bucket.until) {
      bucket = { count: 0, until: now + windowMs };
      rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({ error: "Demasiados intentos. Esperá un momento." });
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  const session = getCookie(req, "admin_session");
  if (!isValidSession(session)) {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
  next();
}

function isValidToken(token) {
  return typeof token === "string" && state.editorTokens.includes(token);
}

function isValidModToken(token) {
  return typeof token === "string" && state.modTokens.includes(token);
}

function emitState() {
  io.emit("state", state.items);
}

function emitPending() {
  io.emit("pending", state.pendingItems);
}

function deleteItemFile(url) {
  const filePath = safeUploadPath(path.basename(url));
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function sanitizeName(raw) {
  return String(raw || "Anónimo")
    .replace(/[<>"'&]/g, "")
    .trim()
    .slice(0, MAX_NAME_LEN) || "Anónimo";
}

function clampNum(val, min, max) {
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function safeUploadPath(filename) {
  const base = path.basename(filename);
  if (!base || base.includes("..")) return null;
  const root = path.resolve(UPLOADS_DIR);
  const resolved = path.resolve(UPLOADS_DIR, base);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

function isRealImage(buffer) {
  if (!buffer || buffer.length < 12) return false;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return true;
  if (buffer.slice(0, 4).toString("ascii") === "RIFF" && buffer.slice(8, 12).toString("ascii") === "WEBP") return true;
  return false;
}

function extFromMime(mime) {
  const map = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };
  return map[mime] || ".png";
}

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = extFromMime(file.mimetype);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!file.mimetype.startsWith("image/") || (ext && !ALLOWED_EXT.has(ext))) {
      return cb(new Error("Formato no permitido"));
    }
    cb(null, true);
  },
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e6 });

app.set("trust proxy", 1);
app.use(express.json({ limit: "32kb" }));

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use("/uploads", express.static(UPLOADS_DIR, { dotfiles: "deny", index: false }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => res.redirect("/admin.html"));

app.get("/api/state", (_req, res) => {
  res.json(state.items);
});

app.get("/api/editor/config", (req, res) => {
  const token = req.query.token;
  if (!isValidToken(token)) return res.status(403).json({ error: "Token inválido" });
  res.json({ moderationEnabled: state.moderationEnabled !== false });
});

app.post("/api/admin/login", rateLimit("login", 8, 15 * 60 * 1000), (req, res) => {
  const secret = req.body?.secret;
  if (!secret || !timingSafeEqual(secret, ADMIN_SECRET)) {
    return res.status(401).json({ error: "Clave incorrecta" });
  }
  const sessionId = createSession();
  setSessionCookie(res, sessionId);
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  const session = getCookie(req, "admin_session");
  if (session) adminSessions.delete(session);
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/admin/session", (req, res) => {
  const session = getCookie(req, "admin_session");
  res.json({ ok: isValidSession(session) });
});

app.get("/api/admin/tokens", requireAdmin, (_req, res) => {
  const isPublic = !PUBLIC_URL.includes("localhost") && !PUBLIC_URL.includes("127.0.0.1");
  res.json({
    tokens: state.editorTokens,
    modTokens: state.modTokens,
    moderationEnabled: state.moderationEnabled !== false,
    pendingCount: state.pendingItems.length,
    publicBaseUrl: PUBLIC_URL,
    obsOverlayUrl: `http://localhost:${PORT}/overlay.html`,
    overlayUrl: `${PUBLIC_URL}/overlay.html`,
    viewerLinksReady: isPublic,
    itemCount: state.items.length,
  });
});

app.post("/api/admin/tokens", requireAdmin, (_req, res) => {
  if (state.editorTokens.length >= MAX_TOKENS) {
    return res.status(400).json({ error: `Máximo ${MAX_TOKENS} links activos` });
  }
  const token = crypto.randomBytes(16).toString("hex");
  state.editorTokens.push(token);
  saveData(state);
  res.json({ token, url: `${PUBLIC_URL}/editor.html?token=${token}` });
});

app.delete("/api/admin/tokens/:token", requireAdmin, (req, res) => {
  const idx = state.editorTokens.indexOf(req.params.token);
  if (idx === -1) return res.status(404).json({ error: "Token no encontrado" });
  state.editorTokens.splice(idx, 1);
  saveData(state);
  res.json({ ok: true });
});

app.post("/api/admin/mod-tokens", requireAdmin, (_req, res) => {
  if (state.modTokens.length >= MAX_MOD_TOKENS) {
    return res.status(400).json({ error: `Máximo ${MAX_MOD_TOKENS} links de mod activos` });
  }
  const token = crypto.randomBytes(16).toString("hex");
  state.modTokens.push(token);
  saveData(state);
  res.json({ token, url: `${PUBLIC_URL}/mod.html?token=${token}` });
});

app.delete("/api/admin/mod-tokens/:token", requireAdmin, (req, res) => {
  const idx = state.modTokens.indexOf(req.params.token);
  if (idx === -1) return res.status(404).json({ error: "Token no encontrado" });
  state.modTokens.splice(idx, 1);
  saveData(state);
  res.json({ ok: true });
});

app.put("/api/admin/moderation", requireAdmin, (req, res) => {
  if (typeof req.body?.enabled !== "boolean") {
    return res.status(400).json({ error: "Parámetro inválido" });
  }
  state.moderationEnabled = req.body.enabled;
  saveData(state);
  res.json({ moderationEnabled: state.moderationEnabled });
});

app.delete("/api/admin/clear", requireAdmin, (_req, res) => {
  for (const item of state.items) deleteItemFile(item.url);
  for (const item of state.pendingItems) deleteItemFile(item.url);
  state.items = [];
  state.pendingItems = [];
  saveData(state);
  emitState();
  emitPending();
  res.json({ ok: true });
});

app.post("/api/upload", rateLimit("upload", 30, 60 * 1000), upload.single("image"), (req, res) => {
  const token = req.body?.token;
  if (!isValidToken(token)) return res.status(403).json({ error: "Token inválido" });

  if (!req.file) return res.status(400).json({ error: "Sin archivo" });

  if (state.moderationEnabled !== false) {
    if (state.pendingItems.length >= MAX_PENDING) {
      return res.status(400).json({ error: "Cola de moderación llena" });
    }
  } else if (state.items.length >= MAX_ITEMS) {
    return res.status(400).json({ error: "Overlay lleno" });
  }

  const filePath = safeUploadPath(req.file.filename);
  if (!filePath) return res.status(400).json({ error: "Archivo inválido" });

  const buf = fs.readFileSync(filePath);
  if (!isRealImage(buf)) {
    fs.unlinkSync(filePath);
    return res.status(400).json({ error: "No es una imagen válida" });
  }

  const item = {
    id: uuidv4(),
    url: `/uploads/${req.file.filename}`,
    x: 100,
    y: 100,
    width: 300,
    height: 300,
    rotation: 0,
    author: sanitizeName(req.body.name),
    createdAt: Date.now(),
  };

  if (state.moderationEnabled !== false) {
    state.pendingItems.push(item);
    saveData(state);
    emitPending();
    return res.json({ ...item, pending: true });
  }

  state.items.push(item);
  saveData(state);
  emitState();
  res.json(item);
});

app.put("/api/items/:id", rateLimit("edit", 120, 60 * 1000), (req, res) => {
  const token = req.body?.token;
  if (!isValidToken(token)) return res.status(403).json({ error: "Token inválido" });

  const idx = state.items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "No encontrado" });

  const { x, y, width, height, rotation } = req.body;
  if (x !== undefined) {
    const v = clampNum(x, -500, 2500);
    if (v === null) return res.status(400).json({ error: "Coordenada inválida" });
    state.items[idx].x = v;
  }
  if (y !== undefined) {
    const v = clampNum(y, -500, 1500);
    if (v === null) return res.status(400).json({ error: "Coordenada inválida" });
    state.items[idx].y = v;
  }
  if (width !== undefined) {
    const v = clampNum(width, 20, 1920);
    if (v === null) return res.status(400).json({ error: "Tamaño inválido" });
    state.items[idx].width = v;
  }
  if (height !== undefined) {
    const v = clampNum(height, 20, 1080);
    if (v === null) return res.status(400).json({ error: "Tamaño inválido" });
    state.items[idx].height = v;
  }
  if (rotation !== undefined) {
    const v = clampNum(rotation, -360, 360);
    if (v === null) return res.status(400).json({ error: "Rotación inválida" });
    state.items[idx].rotation = v;
  }

  saveData(state);
  emitState();
  res.json(state.items[idx]);
});

function updatePendingTransform(idx, body) {
  const { x, y, width, height, rotation } = body;
  if (x !== undefined) {
    const v = clampNum(x, -500, 2500);
    if (v === null) return "Coordenada inválida";
    state.pendingItems[idx].x = v;
  }
  if (y !== undefined) {
    const v = clampNum(y, -500, 1500);
    if (v === null) return "Coordenada inválida";
    state.pendingItems[idx].y = v;
  }
  if (width !== undefined) {
    const v = clampNum(width, 20, 1920);
    if (v === null) return "Tamaño inválido";
    state.pendingItems[idx].width = v;
  }
  if (height !== undefined) {
    const v = clampNum(height, 20, 1080);
    if (v === null) return "Tamaño inválido";
    state.pendingItems[idx].height = v;
  }
  if (rotation !== undefined) {
    const v = clampNum(rotation, -360, 360);
    if (v === null) return "Rotación inválida";
    state.pendingItems[idx].rotation = v;
  }
  return null;
}

app.put("/api/pending/:id", rateLimit("edit", 120, 60 * 1000), (req, res) => {
  const token = req.body?.token;
  if (!isValidToken(token)) return res.status(403).json({ error: "Token inválido" });

  const idx = state.pendingItems.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "No encontrado" });

  const err = updatePendingTransform(idx, req.body);
  if (err) return res.status(400).json({ error: err });

  saveData(state);
  emitPending();
  res.json(state.pendingItems[idx]);
});

app.delete("/api/pending/:id", rateLimit("delete", 60, 60 * 1000), (req, res) => {
  const token = req.query.token;
  if (!isValidToken(token)) return res.status(403).json({ error: "Token inválido" });

  const idx = state.pendingItems.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "No encontrado" });

  deleteItemFile(state.pendingItems[idx].url);
  state.pendingItems.splice(idx, 1);
  saveData(state);
  emitPending();
  res.json({ ok: true });
});

app.get("/api/mod/pending", rateLimit("mod", 60, 60 * 1000), (req, res) => {
  const token = req.query.token;
  if (!isValidModToken(token)) return res.status(403).json({ error: "Token inválido" });
  res.json(state.pendingItems);
});

app.post("/api/mod/:id/approve", rateLimit("mod", 60, 60 * 1000), (req, res) => {
  const token = req.body?.token;
  if (!isValidModToken(token)) return res.status(403).json({ error: "Token inválido" });

  const idx = state.pendingItems.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "No encontrado" });
  if (state.items.length >= MAX_ITEMS) {
    return res.status(400).json({ error: "Overlay lleno" });
  }

  const item = state.pendingItems.splice(idx, 1)[0];
  state.items.push(item);
  saveData(state);
  emitPending();
  emitState();
  res.json(item);
});

app.post("/api/mod/:id/reject", rateLimit("mod", 60, 60 * 1000), (req, res) => {
  const token = req.body?.token;
  if (!isValidModToken(token)) return res.status(403).json({ error: "Token inválido" });

  const idx = state.pendingItems.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "No encontrado" });

  deleteItemFile(state.pendingItems[idx].url);
  state.pendingItems.splice(idx, 1);
  saveData(state);
  emitPending();
  res.json({ ok: true });
});

app.delete("/api/items/:id", rateLimit("delete", 60, 60 * 1000), (req, res) => {
  const token = req.query.token;
  if (!isValidToken(token)) return res.status(403).json({ error: "Token inválido" });

  const idx = state.items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "No encontrado" });

  deleteItemFile(state.items[idx].url);

  state.items.splice(idx, 1);
  saveData(state);
  emitState();
  res.json({ ok: true });
});

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "Archivo muy grande (máx 8MB)" : "Upload inválido" });
  }
  if (err) return res.status(400).json({ error: err.message || "Error" });
  next();
});

io.on("connection", (socket) => {
  socket.emit("state", state.items);
  socket.emit("pending", state.pendingItems);
});

server.listen(PORT, () => {
  console.log(`\n  StreamTools → ${PUBLIC_URL}`);
  console.log(`  OBS overlay → ${PUBLIC_URL}/overlay.html`);
  console.log(`  Admin       → ${PUBLIC_URL}/admin.html\n`);
  if (ADMIN_SECRET === "cambiar-esto") {
    console.warn("  ⚠️  ADMIN_SECRET por defecto. Cambialo antes de abrir el túnel.\n");
  }
});
