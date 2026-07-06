// ╔══════════════════════════════════════════════════════════════════╗
// ║          🔧 KisanMitra — Unified API Configuration               ║
// ║   ONE file to rule all API endpoints. Edit only here.            ║
// ╚══════════════════════════════════════════════════════════════════╝

// ── Backend (Express / agri-backend) ─────────────────────────────────────────
// Your real agri-backend runs here. Change this in ONE place for prod.
export const BACKEND_URL = "https://kishanai.onrender.com";

// ── Claude AI Config (used only for features backend doesn't cover) ──────────
export const AI_CONFIG = {
  // Options:
  //   "claude-haiku-4-5-20251001"   → fastest, cheapest
  //   "claude-sonnet-4-20250514"    → balanced  ← default
  //   "claude-opus-4-5"             → most powerful
  model: "claude-sonnet-4-20250514",
  endpoint: "https://api.anthropic.com/v1/messages",
  max_tokens: 1000,
  apiKey: null,      // Move to backend env for production
  provider: "anthropic",
};

// ── Feature routing: backend vs Claude fallback ───────────────────────────────
// Set false to force Claude AI for that feature
export const USE_BACKEND = {
  crop:       true,   // POST /api/crop           (scoring + live weather)
  disease:    true,   // POST /api/disease         (image upload)
  fertilizer: true,   // GET  /api/fertilizer      (NPK DB)
  weather:    true,   // GET  /api/weather         (OpenWeatherMap)
  irrigation: true,   // POST /api/irrigation      (ET0 calculator)
  profit:     true,   // POST /api/profit          (financial analysis)
  market:     true,   // GET  /api/market          (MongoDB mandi prices)
  chatbot:    true,   // POST /api/chat            (HuggingFace + Bhashini)
  vegPlan:    false,  // No backend route — always Claude AI
  satellite:  true,   // GET  /api/satellite       (NDVI zones)
};
