// controllers/market.controller.js
// HuggingFace Mistral-7B — AI market price analysis
const axios  = require("axios");
const { getMarketPrices, addMarketPrice } = require("../services/market.service");
const { success, validationError }        = require("../utils/responseHandler");

const getMarket = async (req, res) => {
  const { state }        = req.location;
  const { crop, market } = req.query;

  const filters = {};
  if (state)  filters.state  = state;
  if (crop)   filters.crop   = crop;
  if (market) filters.market = market;

  let prices  = await getMarketPrices(filters);
  const allIndia = prices.length === 0;
  if (allIndia) prices = await getMarketPrices({ crop, market });

  const stats = calcStats(prices);
  const key   = process.env.HUGGINGFACE_API_KEY;
  let aiInsight = null;

  // AI market insight
  if (key && key !== "your_huggingface_api_key_here" && prices.length > 0) {
    try {
      const topCrops = prices.slice(0, 5).map((p) => `${p.crop}: ₹${p.modalPrice}/quintal (${p.trend})`).join(", ");
      const prompt   = `You are an agricultural market analyst for Indian farmers. Based on these mandi prices for ${state || "India"}, give 2-3 practical selling advice tips in simple Hindi (3 lines max).

Current prices: ${topCrops}

Give market advice:`;

      const { data } = await axios.post(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          inputs: `[INST] ${prompt} [/INST]`,
          parameters: { max_new_tokens: 150, temperature: 0.4, return_full_text: false },
        },
        { headers: { Authorization: `Bearer ${key}` }, timeout: 20000 }
      );

      aiInsight = data[0]?.generated_text?.trim() || null;
    } catch (err) {
      console.warn("AI market insight failed:", err.message);
    }
  }

  return success(res, "Market prices ready", {
    filter:       { state: state || "All India", crop: crop || "All" },
    locationNote: allIndia ? "Aapke state ka data nahi — All India dikh raha hai" : `${state} ke prices dikh rahe hain`,
    totalRecords: prices.length,
    prices,
    statistics:   stats,
    aiMarketInsight: aiInsight,
    modelUsed:    aiInsight ? "Mistral-7B (HuggingFace)" : "Static data",
    lastUpdated:  new Date().toISOString(),
    tip: "eNAM portal pe register karo better prices ke liye: https://enam.gov.in",
  });
};

const addMarket = async (req, res) => {
  const { crop, market, state, minPrice, maxPrice, modalPrice, variety, unit } = req.body;
  const missing = ["crop","market","state","minPrice","maxPrice","modalPrice"].filter((k) => !req.body[k]);
  if (missing.length) return validationError(res, `Missing: ${missing.join(", ")}`);
  if (+minPrice > +maxPrice) return validationError(res, "minPrice maxPrice se zyada nahi ho sakta.");
  const record = await addMarketPrice({ crop:crop.toLowerCase(), variety, market, state, minPrice:+minPrice, maxPrice:+maxPrice, modalPrice:+modalPrice, unit:unit||"quintal" });
  return success(res, "Market price add ho gaya", record, 201);
};

const getTrending = async (req, res) => {
  const { state } = req.location;
  const prices    = await getMarketPrices(state ? { state } : {});
  return success(res, "Trending prices", {
    up:     prices.filter((p) => p.trend==="up").slice(0,6),
    down:   prices.filter((p) => p.trend==="down").slice(0,6),
    stable: prices.filter((p) => p.trend==="stable").slice(0,6),
    advice: { up:"📈 Abhi bechna faida hai", down:"📉 Roko agar storage hai", stable:"📊 Cash flow ke hisaab se becho" },
  });
};

const calcStats = (prices) => {
  if (!prices.length) return null;
  const mods = prices.map((p) => p.modalPrice);
  const avg  = mods.reduce((a,b) => a+b, 0) / mods.length;
  return {
    average: Math.round(avg),
    highest: { value:Math.max(...mods), crop:prices.find((p) => p.modalPrice===Math.max(...mods))?.crop },
    lowest:  { value:Math.min(...mods), crop:prices.find((p) => p.modalPrice===Math.min(...mods))?.crop },
    trends:  { up:prices.filter((p)=>p.trend==="up").length, down:prices.filter((p)=>p.trend==="down").length, stable:prices.filter((p)=>p.trend==="stable").length },
  };
};

module.exports = { getMarket, addMarket, getTrending };
