import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const REMOTE_WAMP_API_URL = (process.env.VITE_WAMP_API_URL || process.env.WAMP_API_URL || "").replace(/\/$/, "");
const USE_REMOTE_WAMP_API = REMOTE_WAMP_API_URL !== "" && /^(https?:\/\/)/i.test(REMOTE_WAMP_API_URL);

// ── JSON-file database (works on Replit, local, everywhere) ──────────────
const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface DbUser {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}
interface DbSession {
  userId: number;
  token: string;
  expiresAt: string;
}
interface DbOrder {
  id: number;
  userId: number | null;
  guestToken: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderNumber: string;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentStatus: string;
  status: string;
  createdAt: string;
  items: { artworkId: string; quantity: number; frameType: string; unitPrice: number }[];
}
interface DbNewsletter {
  email: string;
  language: string;
  subscribedAt: string;
}
interface Database {
  users: DbUser[];
  sessions: DbSession[];
  orders: DbOrder[];
  newsletter: DbNewsletter[];
  nextUserId: number;
  nextOrderId: number;
}

function loadDb(): Database {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load db.json, starting fresh:", e);
  }
  return { users: [], sessions: [], orders: [], newsletter: [], nextUserId: 1, nextOrderId: 1 };
}

function saveDb(db: Database) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getUserFromToken(db: Database, authHeader?: string): DbUser | null {
  if (!authHeader) return null;
  const match = authHeader.match(/Bearer\s+(\S+)/i);
  if (!match) return null;
  const token = match[1];
  const session = db.sessions.find(
    (s) => s.token === token && new Date(s.expiresAt) > new Date()
  );
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) || null;
}

// ── Security Headers ─────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

if (USE_REMOTE_WAMP_API) {
  app.all("/wamp-api/*", express.raw({ type: "*/*", limit: "5mb" }), async (req, res) => {
    try {
      const proxyPath = req.originalUrl.replace(/^\/wamp-api/, "");
      const targetUrl = `${REMOTE_WAMP_API_URL}${proxyPath}`;
      const headers = { ...req.headers } as Record<string, string>;
      delete headers.host;

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
        redirect: "manual",
      };

      const response = await fetch(targetUrl, fetchOptions);
      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (['transfer-encoding', 'content-encoding', 'connection', 'keep-alive'].includes(key.toLowerCase())) return;
        res.setHeader(key, value);
      });
      const body = await response.arrayBuffer();
      return res.send(Buffer.from(body));
    } catch (error) {
      console.error("Remote WAMP API proxy error:", error);
      return res.status(502).json({ ok: false, error: "proxy_error", message: String(error) });
    }
  });
}

// ── Gemini AI ────────────────────────────────────────────────────────────
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });
    console.log("Gemini API initialized successfully on the server.");
  } else {
    console.warn("GEMINI_API_KEY is not set. Falling back to decorative simulations.");
  }
} catch (error) {
  console.error("Failed to initialize Gemini API:", error);
}

app.post("/api/gemini/interpret", express.json(), async (req, res) => {
  const { phrase, language } = req.body;
  if (!phrase) return res.status(400).json({ error: "Phrase is required." });
  const isArabic = language === "ar";

  if (!ai) {
    console.log(`Simulating response for phrase: "${phrase}" because GEMINI_API_KEY is missing.`);
    const fallbackResponse = isArabic
      ? `تحليل فني لاسم "${phrase}" في الكوفي المربع:\n1. **الهندسة البنائية**: يتكون الاسم من كتل هندسية متوازنة تعبر عن التناسق التام. تم تمديد الحروف الرأسية لخلق توازن بصري يحاكي العمارة الإسلامية.\n2. **الكتلة والفراغ**: نسبة المساحات المملوءة بالحبر الذهبي مع الفراغات السوداء تعطي شعوراً باللانهاية والهدوء الداخلي.\n3. **التناظر الحركي**: تلتف الحروف يمينًا وشمالاً في انسجام رياضي يمثل تواصل الحروف والروح.\n4. **البعد الروحي**: يرمز هذا التصميم المقترح إلى الاستقرار والأصالة، حيث يلتقي التراث الكوفي الكلاسيكي مع التقنيات العصرية المستوحاة من أعمال الفنان محسن نصائيبة.`
      : `Artistic Analysis for "${phrase}" in Square Kufic Calligraphy:\n1. **Architectural Geometry**: The name "${phrase}" consists of beautifully balanced interlocking linear blocks.\n2. **Solid and Void**: The distribution of pristine gold leaf and deep obsidian spaces establishes a continuous visual rhythm.\n3. **Symmetry & Balance**: Every horizontal stroke matches a corresponding spatial negative area.\n4. **Spiritual Essence**: This customized design reflects stability and visual meditation.`;
    return res.json({ analysis: fallbackResponse, simulated: true });
  }

  try {
    const prompt = isArabic
      ? `أنت مؤرخ فني وناقد متخصص في أعمال الخطاط التونسي محسن نصائيبة وفن "الخط الكوفي المربع" (Square Kufic).\nيرجى توفير تحليل إبداعي وفني وروحي عميق للكلمة أو العبارة التالية المرسومة بالخط الكوفي المربع: "${phrase}".\nيجب أن يحتوي ردك على الفقرات التالية (باستخدام لغة فنية راقية تليق بمعرض فني فاخر):\n1. **الهندسة البنائية والنسب**\n2. **علاقة الكتلة والفراغ (الحبر والذهب)**\n3. **البعد الروحي والفلسفي**\n4. **رؤية معرض محسن نصائيبة**\nتجنب كتابة أي مقدمات خارج السياق الاستعراضي الفخم للمتحف.`
      : `You are an art historian specializing in Tunisian master calligrapher Mohsen Nsaibia and "Square Kufic Calligraphy".\nPlease provide a deep, elegant artistic and spiritual analysis of: "${phrase}" in Square Kufic calligraphy.\nYour response must contain:\n1. **Architectural Geometry & Proportions**\n2. **The Dialogue of Substance and Space (Ink & Gold)**\n3. **Spiritual and Philosophical Dimension**\n4. **Mohsen Nsaibia Canvas Interpretation**\nWrite in premium museum-grade tone.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { temperature: 0.7 },
    });
    return res.json({ analysis: response.text || "No response generated.", simulated: false });
  } catch (err: any) {
    console.error("Gemini invocation error:", err);
    return res.status(500).json({ error: "Failed to generate analysis. " + err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ── NODE.JS DATABASE API (replaces PHP endpoints for online deployment) ─
// ══════════════════════════════════════════════════════════════════════════

// ── Auth: Register ───────────────────────────────────────────────────────
app.post("/wamp-api/auth/register.php", express.json(), (req, res) => {
  const db = loadDb();
  const name = (req.body.name || "").trim();
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";

  if (!name || !email || password.length < 6) {
    return res.status(400).json({ ok: false, error: "invalid_input" });
  }

  if (db.users.some((u) => u.email === email)) {
    return res.status(409).json({ ok: false, error: "email_exists" });
  }

  const user: DbUser = {
    id: db.nextUserId++,
    name,
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);

  const token = generateToken();
  db.sessions.push({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  saveDb(db);
  console.log(`[DB] User registered: ${email} (id=${user.id})`);
  return res.json({ ok: true, user: { name: user.name, email: user.email }, token });
});

// ── Auth: Login ──────────────────────────────────────────────────────────
app.post("/wamp-api/auth/login.php", express.json(), (req, res) => {
  const db = loadDb();
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";

  const user = db.users.find((u) => u.email === email && u.passwordHash === hashPassword(password));
  if (!user) {
    return res.status(401).json({ ok: false, error: "invalid" });
  }

  const token = generateToken();
  db.sessions.push({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  saveDb(db);

  console.log(`[DB] User logged in: ${email}`);
  return res.json({ ok: true, user: { name: user.name, email: user.email }, token });
});

// ── Auth: Me (session check) ─────────────────────────────────────────────
app.get("/wamp-api/auth/me.php", (req, res) => {
  const db = loadDb();
  const user = getUserFromToken(db, req.headers.authorization);
  if (!user) {
    return res.json({ ok: true, user: null });
  }
  return res.json({ ok: true, user: { name: user.name, email: user.email } });
});

// ── Auth: Logout ─────────────────────────────────────────────────────────
app.post("/wamp-api/auth/logout.php", express.json(), (req, res) => {
  const db = loadDb();
  const match = (req.headers.authorization || "").match(/Bearer\s+(\S+)/i);
  if (match) {
    db.sessions = db.sessions.filter((s) => s.token !== match[1]);
    saveDb(db);
  }
  return res.json({ ok: true });
});

// ── Orders: Create ───────────────────────────────────────────────────────
app.post("/wamp-api/orders/create.php", express.json(), (req, res) => {
  const db = loadDb();
  const user = getUserFromToken(db, req.headers.authorization);

  const customerName = (req.body.customerName || "").trim();
  const customerPhone = (req.body.customerPhone || "").trim();
  const customerEmail = (req.body.customerEmail || "").trim().toLowerCase();
  const shippingAddress = (req.body.shippingAddress || "").trim();
  const paymentMethod = (req.body.paymentMethod || "").trim() || null;
  const paymentReference = (req.body.paymentReference || "").trim() || null;
  const guestToken = (req.body.guest_token || "").trim() || null;
  const items = req.body.items;

  if (!customerName || !customerPhone || !shippingAddress || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, error: "invalid_input" });
  }

  let total = 0;
  const normalizedItems: DbOrder["items"] = [];
  for (const item of items) {
    const artworkId = String(item.artworkId || "");
    const quantity = Math.max(1, parseInt(item.quantity) || 1);
    const frameType = String(item.frameType || "museum_gold");
    const unitPrice = parseFloat(item.unitPrice) || 0;
    if (!artworkId || unitPrice <= 0) {
      return res.status(400).json({ ok: false, error: "invalid_item" });
    }
    total += unitPrice * quantity;
    normalizedItems.push({ artworkId, quantity, frameType, unitPrice });
  }

  const orderId = db.nextOrderId++;
  const orderNumber = `ORD-${new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14)}-${Math.floor(10000 + Math.random() * 90000)}`;

  const order: DbOrder = {
    id: orderId,
    userId: user ? user.id : null,
    guestToken,
    customerName,
    customerEmail: customerEmail || "",
    customerPhone,
    orderNumber,
    totalAmount: total,
    shippingAddress,
    paymentMethod,
    paymentReference,
    paymentStatus: "pending",
    status: "pending",
    createdAt: new Date().toISOString(),
    items: normalizedItems,
  };

  db.orders.push(order);
  saveDb(db);

  console.log(`[DB] Order created: #${orderId} (${orderNumber}) by ${customerName}, total=${total}`);
  return res.json({ ok: true, orderId, orderNumber, total });
});

// ── Orders: My orders ────────────────────────────────────────────────────
app.get("/wamp-api/orders/mine.php", (req, res) => {
  const db = loadDb();
  const user = getUserFromToken(db, req.headers.authorization);
  const guestToken = (req.query.guest_token as string) || req.headers["x-guest-token"] as string || "";

  let myOrders: DbOrder[] = [];
  if (user) {
    myOrders = db.orders.filter((o) => o.userId === user.id);
  }
  if (guestToken) {
    const guestOrders = db.orders.filter((o) => o.guestToken === guestToken && !myOrders.some((m) => m.id === o.id));
    myOrders = [...myOrders, ...guestOrders];
  }

  myOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ ok: true, orders: myOrders });
});

// ── Orders: All (admin) ──────────────────────────────────────────────────
app.get("/wamp-api/orders/index.php", (req, res) => {
  const db = loadDb();
  const user = getUserFromToken(db, req.headers.authorization);

  // If an ID query param, return single order
  const orderId = req.query.id;
  if (orderId) {
    const numId = parseInt(String(orderId).replace(/^ORD-/, ""));
    const order = db.orders.find((o) => o.id === numId || o.orderNumber === String(orderId));
    if (!order) return res.json({ ok: false });
    return res.json({ ok: true, order });
  }

  // Admin: return all orders
  if (user && user.email === "admin@nsaibia.com") {
    const orders = [...db.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ ok: true, orders });
  }

  return res.json({ ok: false, error: "unauthorized" });
});

// ── Orders: Update status ────────────────────────────────────────────────
app.post("/wamp-api/orders/update_status.php", express.json(), (req, res) => {
  const db = loadDb();
  const user = getUserFromToken(db, req.headers.authorization);
  if (!user || user.email !== "admin@nsaibia.com") {
    return res.status(403).json({ ok: false, error: "unauthorized" });
  }

  const orderId = parseInt(String(req.body.orderId).replace(/^ORD-/, "")) || 0;
  const status = req.body.status || "";
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return res.json({ ok: false, error: "not_found" });

  order.status = status;
  saveDb(db);
  console.log(`[DB] Order #${orderId} status updated to: ${status}`);
  return res.json({ ok: true });
});

// ── Orders: Webhook ──────────────────────────────────────────────────────
app.post("/wamp-api/orders/webhook.php", express.json(), (req, res) => {
  return res.json({ ok: true, message: "Webhook received" });
});

// ── Newsletter ───────────────────────────────────────────────────────────
app.post("/wamp-api/newsletter/subscribe.php", express.json(), (req, res) => {
  const db = loadDb();
  const email = (req.body.email || "").trim().toLowerCase();
  const language = req.body.language || "ar";

  if (!email) return res.status(400).json({ ok: false });

  if (!db.newsletter.some((n) => n.email === email)) {
    db.newsletter.push({ email, language, subscribedAt: new Date().toISOString() });
    saveDb(db);
    console.log(`[DB] Newsletter subscriber: ${email}`);
  }
  return res.json({ ok: true });
});

// ── API health check ─────────────────────────────────────────────────────
app.get("/wamp-api/index.php", (_req, res) => {
  const db = loadDb();
  res.json({
    ok: true,
    message: "Mohsen Nsaibia Gallery API",
    database: {
      name: "json-file-db",
      status: "Connected Successfully",
      users: db.users.length,
      orders: db.orders.length,
      error: null,
    },
  });
});
app.get("/wamp-api/", (_req, res) => {
  const db = loadDb();
  res.json({
    ok: true,
    message: "Mohsen Nsaibia Gallery API",
    database: {
      name: "json-file-db",
      status: "Connected Successfully",
      users: db.users.length,
      orders: db.orders.length,
      error: null,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════
// ── Serve frontend assets ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted on Express.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
    console.log(`Database API endpoints active at /wamp-api/*`);
  });
}

startServer();
