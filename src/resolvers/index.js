import Resolver from '@forge/resolver';
import { analyzePrompt } from './geminiClient.js';
import { getIssuesCsvString } from './export-issues.js';

const resolver = new Resolver();


resolver.define('getText', (req) => {
  console.log(req);
  return 'Different response';
});

resolver.define('sendData', async (req) => {
  console.log('Data received:', req);

  const csvString = await getIssuesCsvString();

  return await analyzePrompt({
    userPrompt: req.payload.query,
    fileText: csvString,
  });
});

resolver.define('getTTS', async (req) => {
  console.log('TTS request received:', req.payload.text);
  const text = (req.payload.text || "").trim();
  if (!text) throw new Error("Missing text.");

  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
  });

  if (!r.ok) throw new Error(await r.text());

  const buf = Buffer.from(await r.arrayBuffer());
  return buf.toString("base64"); // Forge must return serializable data
});

export const handler = resolver.getDefinitions();
