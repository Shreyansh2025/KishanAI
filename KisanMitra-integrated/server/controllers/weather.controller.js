// controllers/weather.controller.js
// OpenWeather + HuggingFace AI farming advice
const axios  = require("axios");
const { getWeatherByCoords } = require("../services/weather.service");
const { success }            = require("../utils/responseHandler");

const getWeather = async (req, res) => {
  const { lat, lon, state } = req.location;
  const weather = await getWeatherByCoords(lat, lon);
  const key     = process.env.HUGGINGFACE_API_KEY;

  let aiAdvice = null;

  if (key && key !== "your_huggingface_api_key_here") {
    try {
      const prompt = `You are an agricultural weather advisor for Indian farmers. Based on current weather, give 3 specific farming tips in simple Hindi (3 lines max).

Weather at ${state || "farmer's location"}:
Temperature: ${weather.temperature}°C
Humidity: ${weather.humidity}%
Condition: ${weather.condition}
Wind Speed: ${weather.windSpeed} m/s
Rain last hour: ${weather.rainLastHr} mm

Give practical farming advice for today:`;

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
      console.warn("AI weather advice failed:", err.message);
    }
  }

  return success(res, `Weather data ready for (${lat}, ${lon})`, {
    weather,
    basicInsights: basicInsights(weather),
    aiAdvice,
    modelUsed: aiAdvice ? "Mistral-7B (HuggingFace)" : "Rule-based",
  });
};

const basicInsights = (w) => {
  const tips=[];
  if(w.temperature>38)   tips.push("🌡️ Bahut garmi — subah ya shaam ko sinchai karo");
  else if(w.temperature<8) tips.push("❄️ Frost risk — nursery beds cover karo");
  if(w.humidity>85)      tips.push("💧 High humidity — fungal disease ka risk, drainage check karo");
  if(w.windSpeed>10)     tips.push("💨 Tez hawa — spray operations band karo");
  if(w.rainLastHr>10)    tips.push("🌧️ Baarish — fertilizer application rok do");
  if(!tips.length)       tips.push("✅ Mausam theek hai — field operations ke liye sahi din");
  return {
    tips,
    sprayingOk:     w.windSpeed<8 && w.humidity<80 && w.rainLastHr===0,
    irrigationNeeded: w.temperature>30 && w.humidity<50,
    fieldWorkOk:    w.rainLastHr===0 && w.windSpeed<15,
  };
};

module.exports = { getWeather };
