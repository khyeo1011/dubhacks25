// server.js
// Voice Agent — STT (browser) → Gemini (REST) → TTS (ElevenLabs)

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

// fetch fallback for Node < 18
let _fetch = global.fetch;
if (!_fetch) _fetch = (...a) => import("node-fetch").then(({ default: f }) => f(...a));

const app = express();
app.use(bodyParser.json());

// ✅ allow requests from VS Code Live Server (127.0.0.1:5500)
app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ["GET", "POST"],
  })
);

/* ---------------- Gemini (REST v1) ----------------
   Uses stable, widely-available model by default (can override in .env):
   GEMINI_API_VERSION=v1
   GEMINI_MODEL=gemini-2.0-pro-exp   (recommended)
   You can also set GEMINI_MODEL=gemini-2.5-pro if your key supports it.
*/
async function callGeminiEnv({ prompt }) {
  const version = process.env.GEMINI_API_VERSION || "v1";
  const model = process.env.GEMINI_MODEL || "gemini-2.0-pro-exp";
  const key = process.env.GOOGLE_API_KEY;
  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
  };

  const r = await _fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const txt = await r.text();
  if (!r.ok) {
    // Return readable error to the client for debugging
    throw new Error(`Gemini ${r.status}: ${txt}`);
  }

  let data;
  try {
    data = JSON.parse(txt);
  } catch {
    return { text: "Parsing error from Gemini.", model: `${version}/${model}` };
  }

  // Extract text safely; provide a gentle fallback instead of empty string
  const ai =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join(" ")
      .trim() || "Hmm, I couldn’t think of an answer right now.";

  return { text: ai, model: `${version}/${model}` };
}

/* ---------------- ElevenLabs TTS ---------------- */
app.post("/api/tts", async (req, res) => {
  try {
    const text = (req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "Missing 'text'." });

    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    const r = await _fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.4, similarity_boost: 0.7 },
        }),
      }
    );

    if (!r.ok) return res.status(r.status).json({ error: await r.text() });

    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

/* ---------------- Chat (STT text → Gemini → text) ---------------- */
app.post("/api/chat", async (req, res) => {
  try {
    const userText = (req.body?.text || "").trim();
    if (!userText) return res.status(400).json({ error: "Missing 'text'." });

    const system =
      req.body?.system ||
      "You are a concise, helpful voice assistant for a hackathon project.";

    const prompt = `${system}\n\nUser: ${userText}\nAssistant:`;
    const out = await callGeminiEnv({ prompt });
    res.json(out); // { text, model }
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

/* ---------------- Health ---------------- */
app.get("/", (_req, res) =>
  res.send("Voice Server OK. Try POST /api/chat or /api/tts.")
);
app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    port: Number(process.env.PORT) || 3010,
    model: process.env.GEMINI_MODEL || "gemini-2.0-pro-exp",
    version: process.env.GEMINI_API_VERSION || "v1",
  })
);

const PORT = Number(process.env.PORT) || 3010;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
