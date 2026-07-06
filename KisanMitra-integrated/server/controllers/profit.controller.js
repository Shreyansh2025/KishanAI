// controllers/profit.controller.js
// HuggingFace Mistral-7B — AI profit analysis + recommendations
const axios  = require("axios");
const { success, validationError } = require("../utils/responseHandler");

const BENCHMARKS = {
  rice:{inv:18000,rev:28000,profit:10000}, wheat:{inv:15000,rev:24000,profit:9000},
  maize:{inv:12000,rev:20000,profit:8000}, cotton:{inv:25000,rev:45000,profit:20000},
  soybean:{inv:10000,rev:18000,profit:8000}, tomato:{inv:35000,rev:80000,profit:45000},
  onion:{inv:25000,rev:50000,profit:25000}, sugarcane:{inv:30000,rev:55000,profit:25000},
  mustard:{inv:8000,rev:15000,profit:7000}, groundnut:{inv:18000,rev:30000,profit:12000},
  potato:{inv:20000,rev:35000,profit:15000},
};

const calculateProfit = async (req, res) => {
  const { investment, expectedRevenue, area=1, crop } = req.body;
  const { state } = req.location;

  if (investment == null || expectedRevenue == null)
    return validationError(res, "investment aur expectedRevenue required hain.");

  const inv   = +investment, rev = +expectedRevenue, acres = +area || 1;
  if (isNaN(inv) || isNaN(rev)) return validationError(res, "Valid numbers do.");
  if (inv < 0 || rev < 0)       return validationError(res, "Negative values nahi chalenge.");

  const net    = rev - inv;
  const roi    = inv > 0 ? (net/inv)*100 : 0;
  const margin = rev > 0 ? (net/rev)*100 : 0;
  const status = net > 0 ? "PROFIT" : net === 0 ? "BREAKEVEN" : "LOSS";
  const bench  = BENCHMARKS[(crop||"").toLowerCase()] ?? null;

  const key = process.env.HUGGINGFACE_API_KEY;
  let aiRecommendations = null;

  if (key && key !== "your_huggingface_api_key_here") {
    try {
      const prompt = `You are an agricultural finance advisor for Indian farmers. Analyze this farm business data and give 3-4 specific actionable recommendations in simple Hindi to improve profitability.

Crop: ${crop || "Not specified"}
State: ${state || "India"}
Investment: ₹${inv.toLocaleString()}
Revenue: ₹${rev.toLocaleString()}
Net Profit/Loss: ₹${net.toLocaleString()}
ROI: ${roi.toFixed(1)}%
Status: ${status}
${bench ? `Industry Average Profit: ₹${bench.profit.toLocaleString()}/acre` : ""}

Give practical recommendations:`;

      const { data } = await axios.post(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          inputs: `[INST] ${prompt} [/INST]`,
          parameters: { max_new_tokens: 250, temperature: 0.5, return_full_text: false },
        },
        { headers: { Authorization: `Bearer ${key}` }, timeout: 20000 }
      );

      aiRecommendations = data[0]?.generated_text?.trim() || null;
    } catch (err) {
      console.warn("AI profit advice failed:", err.message);
    }
  }

  return success(res, `Profit analysis: ${status}`, {
    location:   { state },
    summary:    { status, emoji: net>0?"✅":net===0?"⚠️":"❌", netProfit: Math.round(net) },
    financials: {
      totalInvestment:  Math.round(inv),
      totalRevenue:     Math.round(rev),
      netProfit:        Math.round(net),
      roi:              `${roi.toFixed(1)}%`,
      grossMargin:      `${margin.toFixed(1)}%`,
      breakEven:        Math.round(inv),
    },
    perAcre: {
      area:       `${acres} acre(s)`,
      investment: Math.round(inv/acres),
      revenue:    Math.round(rev/acres),
      profit:     Math.round(net/acres),
    },
    riskLevel: riskLabel(roi),
    benchmark: bench ? {
      crop,
      avgInvestment: bench.inv,
      avgRevenue:    bench.rev,
      avgProfit:     bench.profit,
      vsAverage:     net > bench.profit ? "✅ Average se better!" : "⚠️ Average se kam",
    } : null,
    aiRecommendations,
    fallbackRecs: aiRecommendations ? null : defaultRecs(net, roi),
    modelUsed:    aiRecommendations ? "Mistral-7B (HuggingFace)" : "Rule-based",
    schemes: ["PM-KISAN (₹6,000/saal)","Fasal Bima Yojana (insurance)","Kisan Credit Card (4% loan)"],
  });
};

const riskLabel = (roi) => {
  if (roi >= 40) return { level:"Low Risk",      color:"green",  msg:"Excellent returns!" };
  if (roi >= 20) return { level:"Moderate Risk", color:"yellow", msg:"Theek hai, improve karo." };
  if (roi >= 0)  return { level:"High Risk",     color:"orange", msg:"Marginal returns — cost kam karo." };
  return           { level:"Very High Risk",     color:"red",    msg:"Loss — turant action lo!" };
};

const defaultRecs = (net, roi) => {
  if (roi < 10)  return ["Cost audit karo", "FPO join karo", "Value addition karo (processing)"];
  if (roi < 30)  return ["Precision farming use karo", "eNAM pe register karo", "KCC loan lo"];
  return               ["High-value crops mein diversify karo", "Agri-tech platforms try karo"];
};

module.exports = { calculateProfit };
