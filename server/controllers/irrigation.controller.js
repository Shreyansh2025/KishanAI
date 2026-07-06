// controllers/irrigation.controller.js
// HuggingFace Mistral-7B — AI irrigation advice
const axios  = require("axios");
const { success, validationError } = require("../utils/responseHandler");

const getIrrigationAdvice = async (req, res) => {
  const { temperature, soilMoisture, crop, cropStage, humidity, windSpeed } = req.body;
  const { lat, lon, state } = req.location;

  if (temperature == null || soilMoisture == null)
    return validationError(res, "temperature aur soilMoisture required hain.");

  const temp  = +temperature;
  const moist = +soilMoisture;
  if (isNaN(temp) || isNaN(moist)) return validationError(res, "Numbers hone chahiye.");
  if (moist < 0 || moist > 100)   return validationError(res, "soilMoisture 0-100% hona chahiye.");

  const hum  = +(humidity  ?? 60);
  const wind = +(windSpeed ?? 2);
  const et0  = calcET0(temp, hum, wind);
  const base = baseDecision(moist, temp, et0);

  const key  = process.env.HUGGINGFACE_API_KEY;
  let aiAdvice = null;

  if (key && key !== "your_huggingface_api_key_here" && crop) {
    try {
      const prompt = `You are an irrigation expert for Indian farmers. Give specific irrigation advice in simple Hindi (3-4 lines max).

Crop: ${crop}
Stage: ${cropStage || "Not specified"}
Soil Moisture: ${moist}%
Temperature: ${temp}°C
Humidity: ${hum}%
State: ${state || "India"}

Give practical irrigation advice:`;

      const { data } = await axios.post(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          inputs: `[INST] ${prompt} [/INST]`,
          parameters: { max_new_tokens: 150, temperature: 0.4, return_full_text: false },
        },
        { headers: { Authorization: `Bearer ${key}` }, timeout: 20000 }
      );

      aiAdvice = data[0]?.generated_text?.trim() || null;
    } catch (err) {
      console.warn("AI irrigation failed:", err.message);
    }
  }

  return success(res, "Irrigation advice ready", {
    location:            { lat, lon, state },
    inputs:              { temperature: temp, soilMoisture: `${moist}%`, crop: crop || "General" },
    decision:            base,
    evapotranspiration:  { estimated: `${et0.toFixed(2)} mm/day`, level: etLevel(et0) },
    aiAdvice:            aiAdvice || cropHints(crop),
    modelUsed:           aiAdvice ? "Mistral-7B (HuggingFace)" : "Rule-based",
    conservationTips: [
      "Mulching se 30-50% paani bachta hai",
      "Subah 5-7 baje ya shaam 6-8 baje sinchai karo",
      "Drip irrigation lagwao — PMKSY subsidy milti hai",
      "Soil moisture sensor lagao precision ke liye",
    ],
  });
};

const calcET0 = (t,h,w) => Math.max(0, 0.0023*(t+17.8)*Math.sqrt(Math.abs(t-0.5))*((100-h)/100)*(1+0.1*w)*2.5);
const etLevel = (e) => e < 2 ? "Low" : e < 4 ? "Moderate" : e < 6 ? "High" : "Very High";

const baseDecision = (moist, temp, et0) => {
  let action, urgency, amount, next;
  if (moist < 25)      { action="🚨 ABHI SINCHAI KAR0 — Fasal stress mein hai!"; urgency="Critical"; amount=`${Math.round((60-moist)*0.4)} mm`; next="2-3 din"; }
  else if (moist < 40) { action="💧 24 ghante mein sinchai karo";               urgency="High";     amount=`${Math.round((60-moist)*0.3)} mm`; next="3-5 din"; }
  else if (moist < 60) { action="✅ 2-3 din mein sinchai karo";                  urgency="Moderate"; amount=`${Math.round((60-moist)*0.2)} mm`; next="5-7 din"; }
  else if (moist < 80) { action="✅ Moisture theek hai — abhi zaroorat nahi";    urgency="Low";      amount="0 mm"; next="7-10 din"; }
  else                 { action="⛔ Zameen bhar gayi — drainage check karo";     urgency="None";     amount="0 mm"; next="10+ din"; }
  if (temp > 35 && urgency !== "None") { action += " (garmi zyada hai!)"; next="1-2 din kam karo"; }
  return { action, urgency, amount, nextIn: next, bestTime: "Subah 5-7 AM ya Shaam 6-8 PM" };
};

const cropHints = (crop) => {
  const h = {
    rice:      "2-5 cm khada paani rakho. AWD method se 30% paani bachao.",
    wheat:     "6-8 sinchai lagti hain. Crown root stage (21 DAS) ki sinchai zaruri hai.",
    cotton:    "Drip irrigation best hai. Waterlogging se bolo rot hoti hai.",
    tomato:    "Drip + mulching se 40-50% paani bachta hai.",
    sugarcane: "Drip fertigation se 50% paani bachta hai.",
    potato:    "Consistent moisture rakho tuber bulking ke liye.",
    onion:     "Harvest se 2 hafte pehle sinchai band kar do.",
  };
  return h[(crop||"").toLowerCase()] || "Soil moisture 50% field capacity se neeche aaye tab sinchai karo.";
};

module.exports = { getIrrigationAdvice };
