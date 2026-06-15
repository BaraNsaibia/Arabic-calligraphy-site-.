import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { spawn } from "child_process";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;


// Basic Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// PHP API Handler for wamp-api
app.use("/wamp-api", express.json(), express.urlencoded({ extended: true }), (req, res) => {
  const phpPath = path.join(process.cwd(), "wamp-api");
  const requestPath = req.path.substring(1); // Remove leading slash
  const filePath = path.join(phpPath, requestPath);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }

  // Prepare PHP environment variables that PHP expects for $_SERVER
  const env = {
    ...process.env,
    REQUEST_METHOD: req.method,
    CONTENT_TYPE: req.get("Content-Type") || "",
    CONTENT_LENGTH: req.get("Content-Length") || "",
    QUERY_STRING: new URLSearchParams(req.query as any).toString(),
    HTTP_AUTHORIZATION: req.get("Authorization") || "",
    REDIRECT_HTTP_AUTHORIZATION: req.get("Authorization") || "",
    HTTP_X_GUEST_TOKEN: req.get("X-Guest-Token") || "",
    REQUEST_URI: req.originalUrl,
    SCRIPT_NAME: "/wamp-api/" + requestPath,
    SCRIPT_FILENAME: filePath,
    PHP_SELF: "/wamp-api/" + requestPath,
    SERVER_NAME: req.hostname,
    SERVER_PORT: String(PORT),
    SERVER_PROTOCOL: "HTTP/1.1",
  };

  // Execute PHP file with proper HTTP context
  const php = spawn("php", [filePath], {
    env,
    cwd: phpPath,
  });

  let stdout = "";
  let stderr = "";

  php.stdout.on("data", (data) => {
    stdout += data.toString();
  });

  php.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  php.on("close", (code) => {
    if (code !== 0) {
      console.error(`PHP execution error (exit code ${code}): ${stderr}`);
      return res.status(500).json({ ok: false, error: "PHP execution failed", details: stderr });
    }

    if (stderr) {
      console.error(`PHP stderr: ${stderr}`);
    }

    // Try to parse as JSON, otherwise return as text
    try {
      const jsonOutput = JSON.parse(stdout);
      res.json(jsonOutput);
    } catch {
      res.setHeader("Content-Type", "text/html");
      res.send(stdout);
    }
  });

  // Send POST data to PHP stdin if present
  if (req.method === "POST" && (req.body || Object.keys(req.body as any).length > 0)) {
    php.stdin.write(JSON.stringify(req.body));
    php.stdin.end();
  } else {
    php.stdin.end();
  }
});

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API initialized successfully on the server.");
  } else {
    console.warn("GEMINI_API_KEY is not set in environment or is empty. Falling back to decorative simulations.");
  }
} catch (error) {
  console.error("Failed to initialize Gemini API:", error);
}

// REST Endpoints
app.post("/api/gemini/interpret", express.json(), async (req, res) => {
  const { phrase, language } = req.body;

  if (!phrase) {
    return res.status(400).json({ error: "Phrase is required." });
  }

  const isArabic = language === "ar";

  if (!ai) {
    // Elegant simulation if API key is not present, ensuring user experience is still outstanding in local preview.
    console.log(`Simulating response for phrase: "${phrase}" because GEMINI_API_KEY is missing.`);
    const fallbackResponse = isArabic
      ? `تحليل فني لاسم "${phrase}" في الكوفي المربع:
1. **الهندسة البنائية**: يتكون الاسم من كتل هندسية متوازنة تعبر عن التناسق التام. تم تمديد الحروف الرأسية لخلق توازن بصري يحاكي العمارة الإسلامية.
2. **الكتلة والفراغ**: نسبة المساحات المملوءة بالحبر الذهبي مع الفراغات السوداء تعطي شعوراً باللانهاية والهدوء الداخلي.
3. **التناظر الحركي**: تلتف الحروف يمينًا وشمالاً في انسجام رياضي يمثل تواصل الحروف والروح.
4. **البعد الروحي**: يرمز هذا التصميم المقترح إلى الاستقرار والأصالة، حيث يلتقي التراث الكوفي الكلاسيكي مع التقنيات العصرية المستوحاة من أعمال الفنان محسن نصائيبة.`
      : `Artistic Analysis for "${phrase}" in Square Kufic Calligraphy:
1. **Architectural Geometry**: The name "${phrase}" consists of beautifully balanced interlocking linear blocks. Vertical lines are elongated to form majestic, column-like structures.
2. **Solid and Void**: The distribution of pristine gold leaf and deep obsidian spaces establishes a continuous visual rhythm.
3. **Symmetry & Balance**: Every horizontal stroke matches a corresponding spatial negative area, honoring the mathematical laws of original Arabic lettering.
4. **Spiritual Essence**: This customized design reflects stability and visual meditation, representing the dialogue between ink, gold, and structure.`;
    return res.json({ analysis: fallbackResponse, simulated: true });
  }

  try {
    const prompt = isArabic
      ? `أنت مؤرخ فني وناقد متخصص في أعمال الخطاط التونسي محسن نصائيبة وفن "الخط الكوفي المربع" (Square Kufic).
يرجى توفير تحليل إبداعي وفني وروحي عميق للكلمة أو العبارة التالية المرسومة بالخط الكوفي المربع: "${phrase}".
يجب أن يحتوي ردك على الفقرات التالية (باستخدام لغة فنية راقية تليق بمعرض فني فاخر):
1. **الهندسة البنائية والنسب**: كيف تتوزع الحروف وتتشابك هندسياً في المربع.
2. **علاقة الكتلة والفراغ (الحبر والذهب)**: التوازن البصري بين الأجزاء الممتلئة والأجزاء الفارغة.
3. **البعد الروحي والفلسفي**: القيمة الجمالية والروحية لهذا الاسم أو العبارة في الثقافة العربية الإسلامية.
4. **رؤية معرض محسن نصائيبة**: كيف يمكن تجسيد هذا الاسم في لوحة كوفية معاصرة باستخدام الذهب والأسود والبلور الواقي.
تجنب كتابة أي مقدمات خارج السياق الاستعراضي الفخم للمتحف.`
      : `You are an art historian and design critic specializing in the works of Tunisian master calligrapher Mohsen Nsaibia and "Square Kufic Calligraphy" (الخط الكوفي المربع).
Please provide a deep, highly elegant, artistic and spiritual analysis of the following word or phrase if rendered in Square Kufic calligraphy: "${phrase}".
Your response must contain the following sections (written in luxury, museum-grade English):
1. **Architectural Geometry & Proportions**: How the letters align and lock together in mathematical grids.
2. **The Dialogue of Substance and Space (Ink & Gold)**: The interaction of solid gold leaf lines and deep obsidian negative space.
3. **Spiritual and Philosophical Dimension**: The inner beauty and spiritual resonance of this text.
4. **Mohsen Nsaibia Canvas Interpretation**: How this can be rendered in a custom physical canvas with detailed gilding, glass protection, and textured wood.
Do not write generic conversational prefixes; write it in a premium tone suitable for an art gallery display.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return res.json({ analysis: response.text || "No response generated.", simulated: false });
  } catch (err: any) {
    console.error("Gemini invocation error:", err);
    return res.status(500).json({ error: "Failed to generate analysis. " + err.message });
  }
});

// Serve frontend assets
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
  });
}

startServer();
