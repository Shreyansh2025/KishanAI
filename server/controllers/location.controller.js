// controllers/location.controller.js
// HuggingFace AI + OpenWeather + Location profiles
const axios  = require("axios");
const { getWeatherByCoords }   = require("../services/weather.service");
const { buildLocationContext } = require("../services/location.service");
const { success }              = require("../utils/responseHandler");

const getLocationSummary = async (req, res) => {
  const { lat, lon, state } = req.location;
  const locCtx  = buildLocationContext(lat, lon, state);
  const weather = await getWeatherByCoords(lat, lon);
  const key     = process.env.HUGGINGFACE_API_KEY;

  let aiSummary = null;

  if (key && key !== "your_huggingface_api_key_here") {
    try {
      const prompt = `You are an expert agricultural advisor for Indian farmers. Based on location and weather data, give a 3-line farming summary in simple Hindi with today's key advice.

State: ${locCtx.state}
Zone: ${locCtx.zone}
Soil: ${locCtx.soil}
Dominant crops: ${locCtx.dominantCrops.join(", ")}
Temperature: ${weather.temperature}°C
Humidity: ${weather.humidity}%
Weather: ${weather.condition}

Give today's farming summary:`;

      const { data } = await axios.post(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          inputs: `[INST] ${prompt} [/INST]`,
          parameters: { max_new_tokens: 150, temperature: 0.5, return_full_text: false },
        },
        { headers: { Authorization: `Bearer ${key}` }, timeout: 20000 }
      );

      aiSummary = data[0]?.generated_text?.trim() || null;
    } catch (err) {
      console.warn("AI location summary failed:", err.message);
    }
  }

  return success(res, "Location summary ready", {
    location: { lat, lon, state: locCtx.state, zone: locCtx.zone },
    soil:     { type: locCtx.soil, phRange: locCtx.phRange },
    weather:  { temperature: weather.temperature, humidity: weather.humidity, condition: weather.condition, windSpeed: weather.windSpeed, isMock: weather.isMock },
    dominantCrops:    locCtx.dominantCrops,
    topRecommendation: pickTopCrop(locCtx.dominantCrops, weather.temperature, weather.humidity),
    aiSummary,
    basicTip:  basicTip(weather),
    modelUsed: aiSummary ? "Mistral-7B (HuggingFace)" : "Rule-based",
  });
};

const pickTopCrop = (crops, temp, hum) => {
  if (temp > 30 && hum > 70) return crops.find((c) => /rice|sugarcane|jute/i.test(c)) || crops[0];
  if (temp < 15)             return crops.find((c) => /wheat|mustard|potato/i.test(c)) || crops[0];
  return crops[0];
};

const basicTip = (w) => {
  if (w.rainLastHr > 10) return "Baarish ho rahi hai — fertilizer application rok do, drainage check karo.";
  if (w.temperature > 38) return "Bahut garmi — subah ya shaam ko hi sinchai karo.";
  if (w.windSpeed > 12)   return "Tez hawa — spray operations aaj band rakho.";
  if (w.humidity > 85)    return "Adhik nami — fungal disease ka dhyan rakho.";
  return "Mausam aaj farming ke liye theek hai!";
};

module.exports = { getLocationSummary };
