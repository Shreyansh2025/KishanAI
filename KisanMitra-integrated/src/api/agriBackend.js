// ╔══════════════════════════════════════════════════════════════════╗
// ║      🌾 KisanMitra — Agri Backend API Client                     ║
// ║  Wraps every agri-backend endpoint in one clean module.          ║
// ║  All functions throw on failure — callers handle errors.         ║
// ╚══════════════════════════════════════════════════════════════════╝

import { BACKEND_URL } from "./config";

// ── Base fetch with consistent error handling ─────────────────────────────────
async function apiFetch(path, options = {}) {
  const url = `${BACKEND_URL}${path}`;
  const resp = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const json = await resp.json();
  if (json.status === "error") throw new Error(json.message || "Backend error");
  return json.data; // Always return the data payload
}

// ── Location helpers ──────────────────────────────────────────────────────────
/**
 * Append location headers to any request.
 * The agri-backend location middleware reads x-latitude / x-longitude / x-state.
 */
function locationHeaders(loc = {}) {
  const h = {};
  if (loc.lat) h["x-latitude"]  = String(loc.lat);
  if (loc.lon) h["x-longitude"] = String(loc.lon);
  if (loc.state) h["x-state"]   = loc.state;
  return h;
}

// ─────────────────────────────────────────────────────────────────────────────
// 📍 LOCATION SUMMARY
// GET /api/location-summary?lat=&lon=
// Returns: weather + soil profile + top crop recommendation
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchLocationSummary({ lat, lon, state = "" }) {
  const params = new URLSearchParams({ lat, lon, ...(state && { state }) });
  return apiFetch(`/api/location-summary?${params}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🌾 CROP RECOMMENDATION
// POST /api/crop
// Body: { lat, lon, state, N, P, K, ph, rainfall }
// Returns: recommended crop + alternatives + reasoning
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchCropRecommendation({ lat, lon, state = "", N, P, K, ph, rainfall }) {
  return apiFetch("/api/crop", {
    method: "POST",
    body: JSON.stringify({ lat, lon, state, N, P, K, ph, rainfall }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔬 DISEASE DETECTION
// POST /api/disease  (multipart/form-data, field: "image")
// Optional: lat, lon, state in form fields
// Returns: diagnosis + treatment + prevention
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchDiseaseDetection({ imageFile, loc = {} }) {
  const form = new FormData();
  form.append("image", imageFile);
  if (loc.lat) { form.append("lat", loc.lat); form.append("lon", loc.lon); }
  if (loc.state) form.append("state", loc.state);

  const resp = await fetch(`${BACKEND_URL}/api/disease`, {
    method: "POST",
    body: form,
  });
  const json = await resp.json();
  if (json.status === "error") throw new Error(json.message);
  return json.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// 💊 FERTILIZER RECOMMENDATION
// GET /api/fertilizer?crop=rice
// Optional headers: x-latitude, x-longitude, x-state
// Returns: NPK schedule + micronutrients + organic options + warnings
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchFertilizer({ crop, loc = {} }) {
  const params = new URLSearchParams({ crop });
  return apiFetch(`/api/fertilizer?${params}`, {
    headers: locationHeaders(loc),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🌦️ WEATHER
// GET /api/weather?lat=&lon=
// Returns: current conditions + agricultural insights
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchWeather({ lat, lon, state = "" }) {
  const params = new URLSearchParams({ lat, lon, ...(state && { state }) });
  return apiFetch(`/api/weather?${params}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 💧 IRRIGATION ADVICE
// POST /api/irrigation
// Body: { lat, lon, state, temperature, soilMoisture, crop?, cropStage?, humidity?, windSpeed? }
// Returns: irrigation decision + schedule + water-saving tips
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchIrrigation({ lat, lon, state = "", temperature, soilMoisture, crop, cropStage, humidity, windSpeed }) {
  return apiFetch("/api/irrigation", {
    method: "POST",
    body: JSON.stringify({ lat, lon, state, temperature, soilMoisture, crop, cropStage, humidity, windSpeed }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 💰 PROFIT CALCULATOR
// POST /api/profit
// Body: { lat, lon, state, investment, expectedRevenue, area?, crop? }
// Returns: net profit + ROI + risk + govt scheme recommendations
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchProfit({ lat, lon, state = "", investment, expectedRevenue, area = 1, crop }) {
  return apiFetch("/api/profit", {
    method: "POST",
    body: JSON.stringify({ lat, lon, state, investment, expectedRevenue, area, crop }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 📈 MARKET PRICES
// GET /api/market?crop=&state=
// OR inject state via x-state header automatically from location
// Returns: mandi prices + stats + trending info
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchMarketPrices({ crop, state, loc = {} }) {
  const params = new URLSearchParams();
  if (crop)  params.set("crop",  crop.toLowerCase());
  if (state) params.set("state", state);
  return apiFetch(`/api/market?${params}`, {
    headers: locationHeaders(loc),
  });
}

export async function fetchMarketTrending({ loc = {} }) {
  return apiFetch("/api/market/trending", {
    headers: locationHeaders(loc),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🤖 CHATBOT
// POST /api/chat
// Body (text): { text, language, history? }
// Body (audio): FormData with field "audio" + "language"
// Returns: bot_text + optional audio_output + translation metadata
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchChat({ text, language = "en", history = [], loc = {} }) {
  const resp = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...locationHeaders(loc),
    },
    body: JSON.stringify({ text, language, history: JSON.stringify(history) }),
  });
  const json = await resp.json();
  if (json.status === "error") throw new Error(json.message);
  return json.data;
}

export async function fetchChatAudio({ audioBlob, language = "hi", loc = {} }) {
  const form = new FormData();
  form.append("audio", audioBlob, "voice.wav");
  form.append("language", language);

  const resp = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: locationHeaders(loc),
    body: form,
  });
  const json = await resp.json();
  if (json.status === "error") throw new Error(json.message);
  return json.data;
}

export async function fetchChatLanguages() {
  return apiFetch("/api/chat/languages");
}

// ─────────────────────────────────────────────────────────────────────────────
// 🛰️ SATELLITE / NDVI
// GET /api/satellite?lat=&lon=
// Returns: 5×5 NDVI grid + health summary + recommendations
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchSatellite({ lat, lon, state = "" }) {
  const params = new URLSearchParams({ lat, lon, ...(state && { state }) });
  return apiFetch(`/api/satellite?${params}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ❤️ HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────
export async function checkBackendHealth() {
  try {
    const resp = await fetch(`${BACKEND_URL}/health`);
    return resp.ok;
  } catch {
    return false;
  }
}
