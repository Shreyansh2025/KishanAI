// controllers/chatbot.controller.js
// Mistral-7B chatbot + MyMemory translation
const { getChatbotResponse } = require("../services/chatbot.service");
const { translateText }      = require("../services/bhashini.service");
const { success, error, validationError } = require("../utils/responseHandler");

const chat = async (req, res) => {
  let userText = (req.body.text || req.body.message || "").trim();
  const lang   = req.body.language || "en";
  const { state } = req.location;

  if (!userText) return validationError(res, "text field required hai.");

  // ✅ Fixed: safely parse history whether it arrives as string or array
  let history = [];
  try {
    const raw = req.body.history;
    if (Array.isArray(raw))        history = raw;
    else if (typeof raw === "string") history = JSON.parse(raw);
  } catch {
    history = []; // invalid history — just start fresh
  }

  // Hindi/regional → English
  let englishText = userText;
  if (lang !== "en") englishText = await translateText(userText, lang, "en");

  // Location context
  const enriched = state ? `[Farmer from ${state}] ${englishText}` : englishText;

  // AI response
  let botEnglish;
  try {
    botEnglish = await getChatbotResponse(enriched, history);
  } catch (e) {
    return error(res, `Chatbot error: ${e.message}`, 503);
  }

  // English → User language
  let botText = botEnglish;
  if (lang !== "en") botText = await translateText(botEnglish, "en", lang);

  return success(res, "Chat response ready", {
    user_text:    userText,
    bot_text:     botText,
    bot_text_en:  lang !== "en" ? botEnglish : undefined,
    audio_output: null,
    meta: {
      language:         lang,
      locationEnriched: !!state,
      model:            "Mistral-7B-Instruct (HuggingFace)",
      translation:      "MyMemory API (Free)",
    },
  });
};

const getLanguages = async (_req, res) =>
  success(res, "Supported languages", {
    languages: [
      { code: "en", name: "English",  native: "English"  },
      { code: "hi", name: "Hindi",    native: "हिंदी"    },
      { code: "mr", name: "Marathi",  native: "मराठी"    },
      { code: "te", name: "Telugu",   native: "తెలుగు"   },
      { code: "ta", name: "Tamil",    native: "தமிழ்"    },
      { code: "kn", name: "Kannada",  native: "ಕನ್ನಡ"   },
      { code: "bn", name: "Bengali",  native: "বাংলা"    },
      { code: "gu", name: "Gujarati", native: "ગુજરાતી"  },
      { code: "pa", name: "Punjabi",  native: "ਪੰਜਾਬੀ"   },
    ],
  });

module.exports = { chat, getLanguages };