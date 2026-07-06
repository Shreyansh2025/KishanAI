// controllers/disease.controller.js
// Groq Vision (llama-4-scout) — free, fast, works everywhere

const fs   = require("fs");
const axios = require("axios");
const { success, validationError, error } = require("../utils/responseHandler");

async function analyzeWithGroq(imgPath, mimetype, language = "Hindi") {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY || GROQ_KEY === "your_groq_key_here") {
    throw new Error("GROQ_API_KEY not set in .env — get free key at console.groq.com");
  }

  const imageBase64 = fs.readFileSync(imgPath).toString("base64");
  const mimeType    = mimetype === "image/jpg" ? "image/jpeg" : mimetype;

  const prompt = `You are an expert plant pathologist. Analyze this crop/plant leaf image.

Respond ONLY with a valid JSON object (no markdown, no extra text):
{
  "isPlant": true,
  "isHealthy": false,
  "disease": "Disease name here",
  "confidence": 88,
  "severity": "High",
  "cause": "One line cause",
  "chemical": "Chemical treatment with dosage in ${language}",
  "organic": "Organic treatment in ${language}",
  "prevention": "Prevention measure in ${language}",
  "status": "Short status in ${language}"
}

Rules:
- If NOT a plant/leaf → isPlant: false, disease: "Not a Plant"
- If healthy → isHealthy: true, disease: "Healthy Plant", severity: "None"
- severity: None / Low / Medium / High / Critical
- confidence: number 0-100`;

  const { data } = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens:  500,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    }
  );

  const raw   = data?.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("Empty response from Groq");

  const clean = raw.replace(/```json|```/g, "").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in Groq response");

  return JSON.parse(match[0]);
}

// ─────────────────────────────────────────────────────────────────────────────

const detectDisease = async (req, res) => {
  if (!req.file) return validationError(res, "Plant ki photo upload karo (JPEG ya PNG).");

  const { path: filePath, size, mimetype, filename } = req.file;

  if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(mimetype)) {
    fs.unlink(filePath, () => {});
    return validationError(res, "Sirf JPEG/PNG/WEBP images accepted hain.");
  }
  if (size > 5 * 1024 * 1024) {
    fs.unlink(filePath, () => {});
    return validationError(res, "Image 5MB se chhoti honi chahiye.");
  }

  try {
    const language = req.body?.language || req.query?.language || "Hindi";
    const result   = await analyzeWithGroq(filePath, mimetype, language);

    // Not a plant
    if (!result.isPlant) {
      return success(res, "Disease analysis complete", {
        image:    { filename, size: `${(size / 1024).toFixed(1)} KB` },
        diagnosis: {
          name: "Not a Plant", confidence: `${result.confidence || 95}%`,
          severity: "None", isHealthy: false,
          status: "❌ Yeh paudhe ki photo nahi hai. Kripya crop/patte ki photo upload karein.",
          cause: null,
        },
        treatment: { chemical: "—", organic: "—", prevention: "Crop ya patte ki photo upload karein" },
        model: "Groq Vision (Llama-4)",
      });
    }

    // Healthy
    if (result.isHealthy) {
      return success(res, "Disease analysis complete", {
        image:    { filename, size: `${(size / 1024).toFixed(1)} KB` },
        diagnosis: {
          name: "Healthy Plant", confidence: `${result.confidence || 92}%`,
          severity: "None", isHealthy: true,
          status: result.status || "✅ Aapka paudha bilkul swasth hai!",
          cause: null,
        },
        treatment: {
          chemical:   "Koi treatment ki zaroorat nahi",
          organic:    result.organic    || "Compost ya FYM apply karo",
          prevention: result.prevention || "Regular monitoring jari rakho",
        },
        model: "Groq Vision (Llama-4)",
      });
    }

    // Disease detected
    return success(res, "Disease analysis complete", {
      image:    { filename, size: `${(size / 1024).toFixed(1)} KB` },
      diagnosis: {
        name:       result.disease,
        confidence: `${result.confidence || 85}%`,
        severity:   result.severity || "High",
        isHealthy:  false,
        status:     result.status || "⚠️ Bimari detected! Turant treatment karo.",
        cause:      result.cause || null,
      },
      treatment: {
        chemical:   result.chemical,
        organic:    result.organic,
        prevention: result.prevention,
      },
      model: "Groq Vision (Llama-4)",
    });

  } catch (err) {
    console.error("Disease detection error:", err.message);
    return error(res, `Disease detection failed: ${err.message}`, 500);
  } finally {
    fs.unlink(filePath, () => {});
  }
};

module.exports = { detectDisease };