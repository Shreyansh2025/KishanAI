// controllers/crop.controller.js
// HuggingFace Mistral-7B — AI crop recommendation
const axios  = require("axios");
const { getWeatherByCoords }   = require("../services/weather.service");
const { buildLocationContext } = require("../services/location.service");
const { success, validationError } = require("../utils/responseHandler");

// Fallback rule-based scoring
const CROP_RULES = [
  { crop:"Rice",       n:[80,120],p:[30,60], k:[30,60],  temp:[22,35],hum:[70,95],ph:[5.0,7.0],rain:[150,300] },
  { crop:"Wheat",      n:[60,100],p:[40,80], k:[40,80],  temp:[10,25],hum:[40,70],ph:[6.0,7.5],rain:[50,150]  },
  { crop:"Maize",      n:[60,100],p:[40,70], k:[40,70],  temp:[18,35],hum:[50,80],ph:[5.5,7.5],rain:[80,180]  },
  { crop:"Soybean",    n:[20,50], p:[50,90], k:[30,60],  temp:[20,30],hum:[60,80],ph:[6.0,7.0],rain:[70,150]  },
  { crop:"Cotton",     n:[80,130],p:[30,60], k:[40,70],  temp:[25,40],hum:[50,75],ph:[6.0,8.0],rain:[60,120]  },
  { crop:"Sugarcane",  n:[100,150],p:[40,80],k:[80,120], temp:[20,35],hum:[65,85],ph:[6.0,7.5],rain:[150,250] },
  { crop:"Mustard",    n:[40,80], p:[20,50], k:[20,40],  temp:[8,25], hum:[40,65],ph:[6.0,7.5],rain:[30,80]   },
  { crop:"Chickpea",   n:[20,40], p:[40,70], k:[20,40],  temp:[10,30],hum:[30,60],ph:[6.0,8.0],rain:[30,90]   },
  { crop:"Groundnut",  n:[20,40], p:[40,70], k:[60,100], temp:[25,35],hum:[50,75],ph:[5.5,7.0],rain:[60,150]  },
  { crop:"Potato",     n:[100,150],p:[50,90],k:[100,150],temp:[10,25],hum:[70,90],ph:[5.0,6.5],rain:[75,150]  },
  { crop:"Tomato",     n:[80,120],p:[40,80], k:[60,100], temp:[20,30],hum:[60,80],ph:[5.5,7.0],rain:[50,120]  },
  { crop:"Onion",      n:[60,100],p:[30,60], k:[60,100], temp:[13,35],hum:[50,70],ph:[6.0,7.5],rain:[35,100]  },
  { crop:"Lentil",     n:[20,40], p:[30,60], k:[20,40],  temp:[10,25],hum:[40,65],ph:[6.5,8.0],rain:[25,75]   },
  { crop:"Bajra",      n:[40,80], p:[20,40], k:[20,40],  temp:[25,38],hum:[40,70],ph:[5.5,8.0],rain:[40,100]  },
  { crop:"Banana",     n:[100,150],p:[30,60],k:[100,200],temp:[24,35],hum:[70,90],ph:[5.5,7.0],rain:[150,250] },
];

const inRange = (v,[lo,hi]) => v >= lo && v <= hi;

const ruleScore = (params) =>
  CROP_RULES.map((r) => {
    let s = 0;
    if (inRange(params.N,    r.n))    s++;
    if (inRange(params.P,    r.p))    s++;
    if (inRange(params.K,    r.k))    s++;
    if (inRange(params.temp, r.temp)) s++;
    if (inRange(params.hum,  r.hum))  s++;
    if (inRange(params.ph,   r.ph))   s++;
    if (inRange(params.rain, r.rain)) s++;
    return { crop: r.crop, score: s, confidence: `${Math.round((s/7)*100)}%` };
  }).sort((a,b) => b.score - a.score);

const getCropRecommendation = async (req, res) => {
  const { lat, lon, state } = req.location;
  const { N, P, K, ph, rainfall } = req.body;

  const missing = ["N","P","K","ph","rainfall"].filter((k) => req.body[k] == null || req.body[k] === "");
  if (missing.length) return validationError(res, `Missing fields: ${missing.join(", ")}`);

  const params = { N:+N, P:+P, K:+K, ph:+ph, rain:+rainfall };
  if (Object.values(params).some(isNaN)) return validationError(res, "Sab values numbers honi chahiye.");

  // Live weather fetch
  const weather = await getWeatherByCoords(lat, lon);
  params.temp   = weather.temperature;
  params.hum    = weather.humidity;

  const locCtx  = buildLocationContext(lat, lon, state);
  const key     = process.env.HUGGINGFACE_API_KEY;
  const ranked  = ruleScore(params);

  let recommended, alternatives, modelUsed, reasoning;

  if (key && key !== "your_huggingface_api_key_here") {
    try {
      const prompt = `You are an expert agronomist for Indian farmers. Based on the soil and weather data below, recommend ONLY ONE best crop name (single word or two words max). Do not explain, just give the crop name.

Soil Data:
- Nitrogen (N): ${N} kg/ha
- Phosphorus (P): ${P} kg/ha
- Potassium (K): ${K} kg/ha
- pH: ${ph}
- Rainfall: ${rainfall} mm/year

Weather (Live):
- Temperature: ${weather.temperature}°C
- Humidity: ${weather.humidity}%

Location:
- State: ${locCtx.state}
- Soil Type: ${locCtx.soil}
- Zone: ${locCtx.zone}

Reply with ONLY the crop name:`;

      const { data } = await axios.post(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          inputs: `[INST] ${prompt} [/INST]`,
          parameters: {
            max_new_tokens:  15,
            temperature:     0.2,
            return_full_text: false,
          },
        },
        {
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          timeout: 30000,
        }
      );

      const aiCrop = data[0]?.generated_text?.trim().split(/[\n,.]/)[0].trim();

      recommended = {
        crop:       aiCrop || ranked[0].crop,
        confidence: "AI Powered",
        method:     "Mistral-7B AI Model",
      };
      alternatives = ranked.slice(0, 4).map((c) => ({
        crop: c.crop, confidence: c.confidence, method: "Rule-based"
      }));
      modelUsed = "mistralai/Mistral-7B-Instruct-v0.2";
      reasoning = `AI ne ${locCtx.state} ki ${locCtx.soil} mitti, ${weather.temperature}°C temperature, aur N:${N}/P:${P}/K:${K} soil values ke basis par ${aiCrop || ranked[0].crop} recommend kiya.`;

    } catch (err) {
      console.warn("AI crop failed, using rules:", err.message);
      recommended  = { crop: ranked[0].crop, confidence: ranked[0].confidence, method: "Rule-based fallback" };
      alternatives = ranked.slice(1, 4).map((c) => ({ crop: c.crop, confidence: c.confidence }));
      modelUsed    = "Rule-based (AI unavailable)";
      reasoning    = `Soil parameters aur weather ke basis par ${ranked[0].crop} sabse suitable hai.`;
    }
  } else {
    recommended  = { crop: ranked[0].crop, confidence: ranked[0].confidence, method: "Rule-based" };
    alternatives = ranked.slice(1, 4).map((c) => ({ crop: c.crop, confidence: c.confidence }));
    modelUsed    = "Rule-based scoring (HuggingFace key add karo AI ke liye)";
    reasoning    = `Soil parameters aur weather ke basis par ${ranked[0].crop} sabse suitable hai.`;
  }

  return success(res, "Crop recommendation ready", {
    location:    { lat, lon, state: locCtx.state, zone: locCtx.zone },
    weather:     { temperature: weather.temperature, humidity: weather.humidity, condition: weather.condition },
    soil:        { N, P, K, ph, rainfall, type: locCtx.soil },
    recommended,
    alternatives,
    reasoning,
    modelUsed,
  });
};

module.exports = { getCropRecommendation };
