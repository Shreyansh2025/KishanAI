// services/chatbot.service.js
// Gemini 1.5 Flash — Fast & free AI for farmers
// Fallback: HuggingFace → Rule-based
const axios = require("axios");

const SYSTEM = `You are KrishiMitra, an expert AI agriculture advisor for Indian farmers.
Give practical, simple advice on crops, soil, irrigation, fertilizers, pest control, weather, and government schemes.
If the user writes in Hindi, always reply in Hindi. Keep replies concise, friendly, and helpful.
Use emojis to make answers easy to read.`;

const getChatbotResponse = async (message, history = []) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const hfKey     = process.env.HUGGINGFACE_API_KEY;

  // ── 1. Try Gemini first (fast, reliable, free tier) ──────────────────────
  if (geminiKey && geminiKey !== "your_gemini_key_here") {
    try {
      // Build conversation history for Gemini
      const geminiHistory = history.slice(-6).map((m) => ({
        role:  m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const body = {
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: [
          ...geminiHistory,
          { role: "user", parts: [{ text: message }] },
        ],
        generationConfig: {
          temperature:     0.7,
          maxOutputTokens: 400,
          topP:            0.95,
        },
      };

      const { data } = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        body,
        { headers: { "Content-Type": "application/json" }, timeout: 15000 }
      );

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    } catch (err) {
      console.warn("Gemini error:", err.response?.data?.error?.message || err.message);
    }
  }

  // ── 2. Fallback: HuggingFace Mistral-7B ──────────────────────────────────
  if (hfKey && hfKey !== "your_huggingface_api_key_here") {
    try {
      const historyText = history
        .slice(-4)
        .map((m) => m.role === "user" ? `[INST] ${m.content} [/INST]` : `${m.content}`)
        .join("\n");

      const prompt = `<s>[INST] ${SYSTEM} [/INST]</s>\n${historyText}\n[INST] ${message} [/INST]`;

      const { data } = await axios.post(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          inputs: prompt,
          parameters: { max_new_tokens: 300, temperature: 0.7, top_p: 0.95, return_full_text: false },
        },
        {
          headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
          timeout: 25000,
        }
      );

      const text = Array.isArray(data) && data[0]?.generated_text
        ? data[0].generated_text.trim()
        : null;
      if (text) return text;
    } catch (err) {
      console.warn("HuggingFace error:", err.message);
    }
  }

  // ── 3. Final fallback: rule-based ─────────────────────────────────────────
  return ruleBasedResponse(message);
};

const ruleBasedResponse = (msg) => {
  const m = msg.toLowerCase();
  if (/pest|कीट|insect|bug|aphid|locust/.test(m))
    return "🌿 Neem oil 5ml/L paani mein milao aur spray karo. Zyada infestation ke liye KVK se contact karo — Helpline: 1800-180-1551";
  if (/soil|mitti|मिट्टी|ph|clay|sandy/.test(m))
    return "🌱 Soil pH 6.0–7.5 ideal hota hai. Soil test zaroor karwao. pH badhane ke liye chuna, ghatane ke liye sulphur use karo.";
  if (/water|irrigat|sinchai|drip|sprinkler/.test(m))
    return "💧 Drip irrigation se 40–50% paani bachta hai. Subah 5–7 baje ya shaam ko sinchai karo. Soil moisture 50% se neeche aane par paani do.";
  if (/fertilizer|khad|खाद|urea|npk|dap/.test(m))
    return "🌾 Soil test ke baad NPK use karo. Urea 3 baar mein do — baai, side-dress, aur top-dress. DAP seedbed mein best hai.";
  if (/scheme|yojana|subsidy|pm.kisan|insurance|loan/.test(m))
    return "🏛️ Kisan schemes:\n• PM-KISAN: ₹6000/saal\n• Fasal Bima Yojana: crop insurance\n• KCC Loan: 4% interest\n• PM-KUSUM: solar pump subsidy\nHelpline: 1800-180-1551";
  if (/market|price|mandi|bhav|sell|rate/.test(m))
    return "📊 eNAM portal (enam.gov.in) pe register karo. AGMARKNET pe live mandi prices dekho. FPO join karo better prices ke liye.";
  if (/disease|blight|rust|wilt|rot|fungal|बीमारी/.test(m))
    return "🔬 Disease ke liye:\n• Fungal: Mancozeb 2.5g/L spray karo\n• Bacterial: Copper oxychloride 3g/L\n• Plant image upload karke Disease Detect feature use karo.";
  if (/weather|rain|monsoon|temperature|frost/.test(m))
    return "🌦️ Weather ke liye app ka Weather section use karo. IMD (imd.gov.in) pe live forecast dekho. Frost alert ke liye light irrigation karo.";
  if (/seed|beej|variety|hybrid|germination/.test(m))
    return "🌱 Certified seeds NSC (indiaseeds.gov.in) se lo. Hybrid variety zyada yield deti hai lekin costly hoti hai. Seed treatment zaroor karo.";
  if (/hello|hi|namaste|नमस्ते|kisan|farmer/.test(m))
    return "🙏 Namaste Kisan Bhai! Main KrishiMitra hoon — aapka AI farming advisor.\nFasal, bimari, sinchai, khaad, mandi bhav — kuch bhi pucho! 🌾";
  return "🌾 Aapka sawaal samajh aa gaya. Thodi aur detail denge to sahi salah de sakta hoon:\n• Kaun si fasal hai?\n• Kya problem ho rahi hai?\n• Aapka state/location?\n\nHelpline: 1800-180-1551";
};

module.exports = { getChatbotResponse };