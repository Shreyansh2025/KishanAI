// controllers/satellite.controller.js
// Fixed: field names now match what SatellitePage.jsx reads
const axios  = require("axios");
const { buildLocationContext } = require("../services/location.service");
const { success }              = require("../utils/responseHandler");

const getSatelliteData = async (req, res) => {
  const { lat, lon, state } = req.location;
  const ctx     = buildLocationContext(lat, lon, state);
  const nasaKey = process.env.NASA_API_KEY || "DEMO_KEY";
  const hfKey   = process.env.HUGGINGFACE_API_KEY;

  // ── NASA imagery (optional, non-blocking) ─────────────────────────────────
  let nasaImagery = null;
  try {
    const { data } = await axios.get("https://api.nasa.gov/planetary/earth/assets", {
      params: { lon, lat, dim: 0.1, date: recentDate(), api_key: nasaKey },
      timeout: 10000,
    });
    nasaImagery = { url: data.url, date: data.date, source: "NASA Landsat" };
  } catch (err) {
    console.warn("NASA API failed:", err.message);
  }

  // ── NDVI grid ─────────────────────────────────────────────────────────────
  const ndviGrid = generateNDVI(lat, lon);
  const summary  = summarise(ndviGrid);

  // ── AI recommendations ────────────────────────────────────────────────────
  let recommendations = null;

  if (hfKey && hfKey !== "your_huggingface_api_key_here") {
    try {
      const prompt = `You are a satellite imagery analyst for Indian agriculture. Based on NDVI field health data below, give 3 specific recommendations in simple Hindi for the farmer.

Location: ${ctx.state} (${ctx.zone})
Field Health: ${summary.overallHealth}
Healthy zones: ${summary.counts.healthy}/25
Stressed zones: ${summary.counts.stressed}/25
Dry zones: ${summary.counts.dry}/25
Moderate zones: ${summary.counts.moderate}/25

Give 3 farming recommendations (one per line, start each with an emoji):`;

      const { data } = await axios.post(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          inputs: `[INST] ${prompt} [/INST]`,
          parameters: { max_new_tokens: 200, temperature: 0.4, return_full_text: false },
        },
        { headers: { Authorization: `Bearer ${hfKey}` }, timeout: 20000 }
      );

      const text = data[0]?.generated_text?.trim();
      if (text) {
        // Split into individual lines, filter blanks
        recommendations = text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 5)
          .slice(0, 4);
      }
    } catch (err) {
      console.warn("AI satellite analysis failed:", err.message);
    }
  }

  // Fall back to rule-based recs
  if (!recommendations || recommendations.length === 0) {
    recommendations = basicRecs(summary);
  }

  // ── Return — field names match SatellitePage.jsx exactly ──────────────────
  return success(res, "Satellite data ready", {
    // ← these two were missing; page shows them in the health banner
    satellite:  nasaImagery ? "NASA Landsat" : "Sentinel-2 (simulated)",
    resolution: "10m/pixel",

    location: { lat, lon, state: ctx.state, zone: ctx.zone },
    timestamp: new Date().toISOString(),

    nasaImagery,

    // ← page reads result.ndviGrid  (not result.ndvi.grid)
    ndviGrid: ndviGrid,

    // ← page reads result.summary  (not result.ndvi.summary)
    summary,

    // ← page reads result.legend   (not result.ndvi.legend)
    legend: {
      healthy:  "NDVI 0.6-1.0 — Healthy fasal",
      moderate: "NDVI 0.3-0.6 — Moderate fasal",
      stressed: "NDVI 0.1-0.3 — Stress mein fasal",
      dry:      "NDVI < 0.1  — Sukhi zameen",
    },

    // ← page reads result.recommendations (array of strings)
    recommendations,

    disclaimer: "NDVI data simulated hai. Real ke liye Sentinel Hub ya ISRO Bhuvan API use karo.",
  });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const recentDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split("T")[0];
};

const generateNDVI = (lat, lon) => {
  const STATUS = ["healthy", "healthy", "moderate", "stressed", "dry"];
  return Array.from({ length: 25 }, (_, i) => {
    const r = Math.floor(i / 5), c = i % 5;
    const seed = Math.abs(Math.sin((lat * 1000 + r) * (lon * 1000 + c)) * 99999);
    const idx  = Math.floor(seed % STATUS.length);
    const ndvi = ndviVal(STATUS[idx], seed);
    return {
      id:     `Z${r}${c}`,
      row:    r + 1,
      col:    c + 1,
      lat:    +(lat + (r - 2) * 0.01).toFixed(5),
      lon:    +(lon + (c - 2) * 0.01).toFixed(5),
      status: STATUS[idx],
      ndvi:   +ndvi.toFixed(3),
    };
  });
};

const ndviVal = (s, seed) => {
  const r = (seed % 100) / 1000;
  if (s === "healthy")  return 0.60 + r;
  if (s === "moderate") return 0.30 + r;
  if (s === "stressed") return 0.10 + r;
  return 0.05 + r * 0.5;
};

const summarise = (zones) => {
  const counts = { healthy: 0, moderate: 0, stressed: 0, dry: 0 };
  zones.forEach((z) => counts[z.status]++);
  const total = zones.length;
  return {
    totalZones: total,
    counts,
    percentages: Object.fromEntries(
      Object.entries(counts).map(([k, v]) => [k, `${Math.round((v / total) * 100)}%`])
    ),
    overallHealth:
      counts.healthy / total > 0.6
        ? "Good"
        : (counts.stressed + counts.dry) / total > 0.4
        ? "Poor"
        : "Moderate",
  };
};

const basicRecs = (s) => {
  const r = [];
  if (s.counts.stressed > 3) r.push("⚠️ Stressed zones mein irrigation aur nutrients check karo");
  if (s.counts.dry > 2)      r.push("🏜️ Dry zones hain — turant sinchai karo");
  if (s.counts.healthy > 15) r.push("✅ Field healthy hai — current management continue karo");
  if (s.counts.moderate > 5) r.push("🌱 Moderate zones ke liye NPK balanced fertilizer use karo");
  if (r.length === 0)        r.push("✅ Field theek hai — regular monitoring karo");
  return r;
};

module.exports = { getSatelliteData };