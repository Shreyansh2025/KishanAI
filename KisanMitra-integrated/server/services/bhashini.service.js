// services/bhashini.service.js
// Wraps the Bhashini (ULCA / Dhruva) inference pipeline for:
//   • ASR  — audio file → text
//   • TTS  — text → base64 audio
//   • NMT  — translate between Indian languages
const axios = require("axios");
const fs    = require("fs");

const PIPELINE_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";

const authHeaders = () => ({
  Authorization: process.env.BHASHINI_API_KEY,
  "Content-Type": "application/json",
});

const isConfigured = () =>
  process.env.BHASHINI_API_KEY &&
  process.env.BHASHINI_API_KEY !== "your_bhashini_api_key_here";

// ─── Speech-to-Text ───────────────────────────────────────────────────────────
const speechToText = async (audioPath, lang = "hi") => {
  if (!isConfigured()) return "मुझे फसल सलाह चाहिए"; // mock

  const audio64 = fs.readFileSync(audioPath).toString("base64");

  const { data } = await axios.post(
    PIPELINE_URL,
    {
      pipelineTasks: [{ taskType: "asr", config: { language: { sourceLanguage: lang }, audioFormat: "wav", samplingRate: 16000 } }],
      inputData: { audio: [{ audioContent: audio64 }] },
    },
    { headers: authHeaders(), timeout: 20000 }
  );

  const text = data?.pipelineResponse?.[0]?.output?.[0]?.source;
  if (!text) throw new Error("Bhashini ASR returned empty transcript");
  return text;
};

// ─── Text-to-Speech ───────────────────────────────────────────────────────────
const textToSpeech = async (text, lang = "hi") => {
  if (!isConfigured()) return null;

  try {
    const { data } = await axios.post(
      PIPELINE_URL,
      {
        pipelineTasks: [{ taskType: "tts", config: { language: { sourceLanguage: lang }, gender: "female" } }],
        inputData: { input: [{ source: text }] },
      },
      { headers: authHeaders(), timeout: 20000 }
    );
    return data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent ?? null;
  } catch (err) {
    console.warn("Bhashini TTS failed (non-fatal):", err.message);
    return null;
  }
};

// ─── Translation ──────────────────────────────────────────────────────────────
const translateText = async (text, src = "hi", tgt = "en") => {
  if (!isConfigured() || src === tgt) return text;
  try {
    const { data } = await axios.post(
      PIPELINE_URL,
      {
        pipelineTasks: [{ taskType: "translation", config: { language: { sourceLanguage: src, targetLanguage: tgt } } }],
        inputData: { input: [{ source: text }] },
      },
      { headers: authHeaders(), timeout: 15000 }
    );
    return data?.pipelineResponse?.[0]?.output?.[0]?.target ?? text;
  } catch (err) {
    console.warn("Bhashini translation failed:", err.message);
    return text;
  }
};

module.exports = { speechToText, textToSpeech, translateText };
