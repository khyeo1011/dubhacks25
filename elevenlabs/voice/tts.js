// tts.js
// Fetches an audio/mpeg from your backend (e.g., POST /api/tts) and plays it.
// Also supports optional direct ElevenLabs mode for quick demos (NOT for prod).

/**
 * Speak text by calling a server endpoint that returns audio/mpeg.
 * @param {string} text
 * @param {Object} [opts]
 * @param {string} [opts.ttsUrl='http://localhost:3010/api/tts'] - Backend endpoint.
 * @param {boolean} [opts.autoPlay=true]                          - Auto play audio.
 * @returns {Promise<{audio: HTMLAudioElement, blob: Blob, url: string}>}
 */
export async function speakViaServer(text, opts = {}) {
  const ttsUrl = opts.ttsUrl ?? "http://localhost:3010/api/tts";
  const autoPlay = opts.autoPlay ?? true;

  const res = await fetch(ttsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`TTS error ${res.status}: ${msg}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  if (autoPlay) await audio.play();
  return { audio, blob, url };
}

/* -------- Optional: direct ElevenLabs client mode (not recommended for prod) --------
   Use only for local experiments. Exposes your API key to the browser.
*/
export async function speakViaElevenLabs(text, {
  apiKey,
  voiceId = "21m00Tcm4TlvDq8ikWAM",
  modelId = "eleven_multilingual_v2",
  autoPlay = true,
} = {}) {
  if (!apiKey) throw new Error("Missing ElevenLabs apiKey (client mode).");
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: { stability: 0.4, similarity_boost: 0.7 },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio(objectUrl);
  if (autoPlay) await audio.play();
  return { audio, blob, url: objectUrl };
}
