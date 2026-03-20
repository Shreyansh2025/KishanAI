// ══════════════════════════════════════════════
// 📦 KisanMitra — Static Data Constants
// ══════════════════════════════════════════════

export const TIPS = [
  "Apply neem oil spray during early morning or evening to prevent leaf burn while controlling pests.",
  "Test your soil pH before every season. Most crops grow best between pH 6.0–7.0.",
  "Mulching with straw reduces water evaporation by up to 70% during hot summers.",
  "Plant marigolds between vegetable rows — they naturally repel pests and attract pollinators.",
  "Compost kitchen waste: it improves soil structure and reduces fertilizer costs by 30–40%.",
  "Water crops at root level, not leaves, to prevent fungal diseases.",
  "Rotate crops every season to break pest cycles and restore soil nutrients naturally.",
];

export const CROP_DATA = {
  Rice:      { price: 2183, prev: 2050, trend: "up",     unit: "₹/quintal" },
  Wheat:     { price: 2275, prev: 2200, trend: "up",     unit: "₹/quintal" },
  Maize:     { price: 1850, prev: 1920, trend: "down",   unit: "₹/quintal" },
  Cotton:    { price: 6620, prev: 6400, trend: "up",     unit: "₹/quintal" },
  Sugarcane: { price: 315,  prev: 315,  trend: "stable", unit: "₹/quintal" },
  Groundnut: { price: 5850, prev: 5650, trend: "up",     unit: "₹/quintal" },
  Mustard:   { price: 5450, prev: 5600, trend: "down",   unit: "₹/quintal" },
  Soybean:   { price: 4200, prev: 4050, trend: "up",     unit: "₹/quintal" },
  Tomato:    { price: 1800, prev: 1200, trend: "up",     unit: "₹/quintal" },
  Potato:    { price: 950,  prev: 1100, trend: "down",   unit: "₹/quintal" },
  Onion:     { price: 2200, prev: 1800, trend: "up",     unit: "₹/quintal" },
};

// All feature cards shown on home page
export const FEATURE_META = [
  { key: "cropRec",       icon: "🌾", color: "#052e16", accent: "#16a34a", bgLight: "#f0fdf4" },
  { key: "vegPlan",       icon: "🥕", color: "#431407", accent: "#f97316", bgLight: "#fff7ed" },
  { key: "diseaseDetect", icon: "🔬", color: "#3b0764", accent: "#9333ea", bgLight: "#fdf4ff" },
  { key: "fertilizer",    icon: "💊", color: "#1e3a5f", accent: "#2563eb", bgLight: "#eff6ff" },
  { key: "weather",       icon: "🌦️", color: "#0c4a6e", accent: "#0284c7", bgLight: "#f0f9ff" },
  { key: "irrigation",    icon: "💧", color: "#164e63", accent: "#0891b2", bgLight: "#ecfeff" },
  { key: "profitCalc",    icon: "💰", color: "#451a03", accent: "#d97706", bgLight: "#fffbeb" },
  { key: "marketPrice",   icon: "📈", color: "#450a0a", accent: "#ef4444", bgLight: "#fff1f2" },
  { key: "chatbot",       icon: "🤖", color: "#1e1b4b", accent: "#6366f1", bgLight: "#eef2ff" },
  { key: "satellite",     icon: "🛰️", color: "#0f2027", accent: "#0891b2", bgLight: "#ecfeff" },
];
