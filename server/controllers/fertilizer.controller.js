// controllers/fertilizer.controller.js
// HuggingFace Mistral-7B — AI fertilizer recommendation
const axios  = require("axios");
const { buildLocationContext } = require("../services/location.service");
const { success, validationError, notFound } = require("../utils/responseHandler");

// Base fertilizer database
const FERTILIZER_DB = {
  rice:      { crop:"Rice",       season:"Kharif",     npk:{N:"100 kg/ha",P:"50 kg/ha",K:"50 kg/ha"}, schedule:[{stage:"Basal (transplanting)",urea:"55 kg/ac",dap:"25 kg/ac",mop:"16 kg/ac"},{stage:"Tillering (21 DAT)",urea:"55 kg/ac",dap:"-",mop:"-"},{stage:"Panicle (45 DAT)",urea:"27 kg/ac",dap:"-",mop:"16 kg/ac"}], micro:["Zinc Sulphate 25 kg/ha","Boron 1 kg/ha"], organic:["FYM 5 t/ha","Azolla biofertilizer"] },
  wheat:     { crop:"Wheat",      season:"Rabi",       npk:{N:"120 kg/ha",P:"60 kg/ha",K:"40 kg/ha"}, schedule:[{stage:"Basal",urea:"55 kg/ac",dap:"30 kg/ac",mop:"13 kg/ac"},{stage:"Crown Root (21 DAS)",urea:"55 kg/ac",dap:"-",mop:"-"},{stage:"Tillering (42 DAS)",urea:"55 kg/ac",dap:"-",mop:"-"}], micro:["Zinc Sulphate 25 kg/ha","Sulphur 20 kg/ha"], organic:["FYM 10 t/ha","Crop residue"] },
  maize:     { crop:"Maize",      season:"Kharif",     npk:{N:"150 kg/ha",P:"75 kg/ha",K:"75 kg/ha"}, schedule:[{stage:"Basal",urea:"54 kg/ac",dap:"38 kg/ac",mop:"25 kg/ac"},{stage:"Knee-High (30 DAS)",urea:"54 kg/ac",dap:"-",mop:"-"},{stage:"Pre-Tasseling (50 DAS)",urea:"54 kg/ac",dap:"-",mop:"25 kg/ac"}], micro:["Zinc Sulphate 25 kg/ha"], organic:["Vermicompost 2.5 t/ha"] },
  soybean:   { crop:"Soybean",    season:"Kharif",     npk:{N:"20 kg/ha",P:"80 kg/ha",K:"40 kg/ha"},  schedule:[{stage:"Basal (full dose)",urea:"9 kg/ac",dap:"40 kg/ac",mop:"13 kg/ac"}], micro:["Molybdenum 1 kg/ha","Zinc if deficient"], organic:["Rhizobium + PSB seed treatment","FYM 5 t/ha"] },
  cotton:    { crop:"Cotton",     season:"Kharif",     npk:{N:"150 kg/ha",P:"60 kg/ha",K:"60 kg/ha"}, schedule:[{stage:"Basal",urea:"36 kg/ac",dap:"30 kg/ac",mop:"20 kg/ac"},{stage:"Squaring (45 DAS)",urea:"36 kg/ac",dap:"-",mop:"20 kg/ac"},{stage:"Boll Formation",urea:"36 kg/ac",dap:"-",mop:"-"}], micro:["Boron 0.2% foliar","Zinc 0.5% foliar"], organic:["FYM 5 t/ha","Neem cake 200 kg/ha"] },
  mustard:   { crop:"Mustard",    season:"Rabi",       npk:{N:"60 kg/ha",P:"30 kg/ha",K:"30 kg/ha"},  schedule:[{stage:"Basal",urea:"27 kg/ac",dap:"15 kg/ac",mop:"10 kg/ac"},{stage:"1st Irrigation (20 DAS)",urea:"27 kg/ac",dap:"-",mop:"-"}], micro:["Sulphur 20-30 kg/ha (critical)"], organic:["FYM 5 t/ha"] },
  chickpea:  { crop:"Chickpea",   season:"Rabi",       npk:{N:"20 kg/ha",P:"60 kg/ha",K:"30 kg/ha"},  schedule:[{stage:"Basal (full dose)",urea:"9 kg/ac",dap:"30 kg/ac",mop:"10 kg/ac"}], micro:["Molybdenum seed treatment"], organic:["Rhizobium + PSB","FYM 5 t/ha"] },
  groundnut: { crop:"Groundnut",  season:"Kharif",     npk:{N:"25 kg/ha",P:"50 kg/ha",K:"75 kg/ha"},  schedule:[{stage:"Basal (full dose)",urea:"11 kg/ac",dap:"25 kg/ac",mop:"25 kg/ac"}], micro:["Gypsum 400 kg/ha at pegging (critical!)","Boron 0.2% foliar"], organic:["FYM 5 t/ha","Neem cake"] },
  tomato:    { crop:"Tomato",     season:"Year-round", npk:{N:"120 kg/ha",P:"60 kg/ha",K:"80 kg/ha"}, schedule:[{stage:"Basal",urea:"-",dap:"30 kg/ac",mop:"26 kg/ac"},{stage:"15 DAT",urea:"27 kg/ac",dap:"-",mop:"-"},{stage:"Flowering",urea:"27 kg/ac",dap:"-",mop:"13 kg/ac"},{stage:"Fruit Dev",urea:"27 kg/ac",dap:"-",mop:"13 kg/ac"}], micro:["Calcium nitrate 0.5% foliar","Boron 0.1%"], organic:["FYM 25 t/ha","Vermicompost 5 t/ha"] },
  onion:     { crop:"Onion",      season:"Rabi",       npk:{N:"100 kg/ha",P:"50 kg/ha",K:"100 kg/ha"},schedule:[{stage:"Basal",urea:"22 kg/ac",dap:"25 kg/ac",mop:"33 kg/ac"},{stage:"30 DAT",urea:"22 kg/ac",dap:"-",mop:"-"},{stage:"45 DAT",urea:"22 kg/ac",dap:"-",mop:"33 kg/ac"}], micro:["Sulphur 30 kg/ha","Boron 0.2%"], organic:["FYM 20 t/ha"] },
  potato:    { crop:"Potato",     season:"Rabi",       npk:{N:"150 kg/ha",P:"60 kg/ha",K:"100 kg/ha"},schedule:[{stage:"Basal",urea:"54 kg/ac",dap:"30 kg/ac",mop:"33 kg/ac"},{stage:"Earthing up (30 DAS)",urea:"54 kg/ac",dap:"-",mop:"-"}], micro:["Zinc Sulphate 25 kg/ha"], organic:["FYM 20 t/ha","Vermicompost"] },
  sugarcane: { crop:"Sugarcane",  season:"Annual",     npk:{N:"250 kg/ha",P:"60 kg/ha",K:"120 kg/ha"},schedule:[{stage:"Basal",urea:"54 kg/ac",dap:"30 kg/ac",mop:"40 kg/ac"},{stage:"3 months",urea:"54 kg/ac",dap:"-",mop:"-"},{stage:"6 months",urea:"54 kg/ac",dap:"-",mop:"40 kg/ac"}], micro:["Zinc Sulphate 25 kg/ha","Iron Sulphate if needed"], organic:["Filter cake 5 t/ha","Trash mulching"] },
};

const getFertilizerRecommendation = async (req, res) => {
  const { crop } = req.query;
  if (!crop) return validationError(res, "Crop naam do. Example: /api/fertilizer?crop=rice", { available: Object.keys(FERTILIZER_DB) });

  const cropKey = crop.trim().toLowerCase();
  const baseData = FERTILIZER_DB[cropKey];
  if (!baseData) return notFound(res, `"${crop}" ka data nahi hai. Available: ${Object.keys(FERTILIZER_DB).join(", ")}`);

  const key    = process.env.HUGGINGFACE_API_KEY;
  const locCtx = req.location?.lat ? buildLocationContext(req.location.lat, req.location.lon, req.location.state) : null;

  let aiAdvice = null;

  // AI se extra personalized advice lo
  if (key && key !== "your_huggingface_api_key_here" && locCtx) {
    try {
      const prompt = `Give 3 specific fertilizer tips for ${baseData.crop} crop in ${locCtx.state}, India. Soil type: ${locCtx.soil}, pH range: ${locCtx.phRange[0]}-${locCtx.phRange[1]}. Be concise, practical advice for farmers. Reply in simple Hindi.`;

      const { data } = await axios.post(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          inputs: `[INST] ${prompt} [/INST]`,
          parameters: { max_new_tokens: 200, temperature: 0.5, return_full_text: false },
        },
        { headers: { Authorization: `Bearer ${key}` }, timeout: 20000 }
      );

      aiAdvice = data[0]?.generated_text?.trim() || null;
    } catch (err) {
      console.warn("AI fertilizer advice failed:", err.message);
    }
  }

  return success(res, `${baseData.crop} ke liye fertilizer recommendation`, {
    ...baseData,
    locationContext: locCtx ? {
      state:   locCtx.state,
      soil:    locCtx.soil,
      phRange: locCtx.phRange,
      note:    `${locCtx.state} ki ${locCtx.soil} ke liye adjust karo`,
    } : null,
    aiPersonalizedAdvice: aiAdvice,
    modelUsed: aiAdvice ? "Mistral-7B (HuggingFace)" : "Database only",
    disclaimer: "Soil test karwao precise recommendation ke liye.",
  });
};

module.exports = { getFertilizerRecommendation };
