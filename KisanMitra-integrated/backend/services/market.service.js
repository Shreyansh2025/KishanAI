// services/market.service.js
// Manages market price data — MongoDB seeding and filtered retrieval.
const Market = require("../models/Market");

// ─── Seed dataset (simulates Agmarknet / eNAM data) ──────────────────────────
const SEED_DATA = [
  // Madhya Pradesh
  { crop:"wheat",    variety:"Lokwan",    market:"Indore Mandi",     state:"Madhya Pradesh", minPrice:2100, maxPrice:2250, modalPrice:2180, trend:"stable" },
  { crop:"soybean",  variety:"JS-335",    market:"Ujjain Mandi",     state:"Madhya Pradesh", minPrice:4000, maxPrice:4400, modalPrice:4200, trend:"up"     },
  { crop:"chickpea", variety:"Desi",      market:"Sehore Mandi",     state:"Madhya Pradesh", minPrice:4600, maxPrice:5000, modalPrice:4800, trend:"stable" },
  { crop:"maize",    variety:"Hybrid",    market:"Chhindwara Mandi", state:"Madhya Pradesh", minPrice:1450, maxPrice:1650, modalPrice:1550, trend:"stable" },
  // Maharashtra
  { crop:"cotton",   variety:"MCU-7",     market:"Akola Mandi",      state:"Maharashtra",    minPrice:5800, maxPrice:6200, modalPrice:6000, trend:"stable" },
  { crop:"onion",    variety:"Red",       market:"Lasalgaon Mandi",  state:"Maharashtra",    minPrice:800,  maxPrice:1500, modalPrice:1100, trend:"up"     },
  { crop:"soybean",  variety:"MAUS-47",   market:"Latur Mandi",      state:"Maharashtra",    minPrice:3900, maxPrice:4300, modalPrice:4100, trend:"up"     },
  { crop:"sugarcane",variety:"Co-86032",  market:"Kolhapur Mandi",   state:"Maharashtra",    minPrice:350,  maxPrice:400,  modalPrice:375,  trend:"stable", unit:"tonne" },
  // Haryana / Punjab
  { crop:"wheat",    variety:"HD-2967",   market:"Karnal Mandi",     state:"Haryana",        minPrice:2150, maxPrice:2280, modalPrice:2210, trend:"stable" },
  { crop:"rice",     variety:"Basmati",   market:"Karnal Mandi",     state:"Haryana",        minPrice:3200, maxPrice:3800, modalPrice:3500, trend:"up"     },
  { crop:"mustard",  variety:"RH-30",     market:"Sirsa Mandi",      state:"Haryana",        minPrice:4800, maxPrice:5200, modalPrice:5000, trend:"up"     },
  { crop:"wheat",    variety:"PBW-550",   market:"Amritsar Mandi",   state:"Punjab",         minPrice:2130, maxPrice:2260, modalPrice:2200, trend:"stable" },
  { crop:"rice",     variety:"PR-126",    market:"Ludhiana Mandi",   state:"Punjab",         minPrice:1800, maxPrice:2000, modalPrice:1900, trend:"stable" },
  // Rajasthan
  { crop:"mustard",  variety:"RH-30",     market:"Alwar Mandi",      state:"Rajasthan",      minPrice:4850, maxPrice:5300, modalPrice:5080, trend:"up"     },
  { crop:"chickpea", variety:"Kabuli",    market:"Bikaner Mandi",    state:"Rajasthan",      minPrice:5200, maxPrice:5700, modalPrice:5450, trend:"stable" },
  // Uttar Pradesh
  { crop:"potato",   variety:"Kufri Jyoti", market:"Agra Mandi",    state:"Uttar Pradesh",  minPrice:700,  maxPrice:950,  modalPrice:820,  trend:"down"   },
  { crop:"sugarcane",variety:"Co-0238",   market:"Muzaffarnagar",    state:"Uttar Pradesh",  minPrice:340,  maxPrice:390,  modalPrice:360,  trend:"stable", unit:"tonne" },
  { crop:"wheat",    variety:"K-307",     market:"Lucknow Mandi",    state:"Uttar Pradesh",  minPrice:2090, maxPrice:2240, modalPrice:2160, trend:"stable" },
  // Gujarat
  { crop:"groundnut",variety:"Bold",      market:"Junagadh Mandi",   state:"Gujarat",        minPrice:4500, maxPrice:5200, modalPrice:4850, trend:"stable" },
  { crop:"cotton",   variety:"Shankar-6", market:"Rajkot Mandi",     state:"Gujarat",        minPrice:5900, maxPrice:6300, modalPrice:6100, trend:"up"     },
  // Karnataka
  { crop:"maize",    variety:"Hybrid",    market:"Davangere Mandi",  state:"Karnataka",      minPrice:1400, maxPrice:1620, modalPrice:1510, trend:"stable" },
  { crop:"rice",     variety:"Sona Masoori", market:"Hassan Mandi",  state:"Karnataka",      minPrice:2200, maxPrice:2600, modalPrice:2400, trend:"stable" },
  // Andhra Pradesh / Telangana
  { crop:"rice",     variety:"BPT-5204",  market:"Nellore Mandi",    state:"Andhra Pradesh", minPrice:2300, maxPrice:2700, modalPrice:2500, trend:"up"     },
  { crop:"turmeric", variety:"Nizamabad", market:"Nizamabad Mandi",  state:"Telangana",      minPrice:6500, maxPrice:7500, modalPrice:7000, trend:"up"     },
  { crop:"chilli",   variety:"Teja",      market:"Guntur Mandi",     state:"Andhra Pradesh", minPrice:8000, maxPrice:12000,modalPrice:10000,trend:"up"     },
  // Tamil Nadu / Kerala
  { crop:"rice",     variety:"ADT-36",    market:"Thanjavur Mandi",  state:"Tamil Nadu",     minPrice:2100, maxPrice:2500, modalPrice:2300, trend:"stable" },
  { crop:"coconut",  variety:"Tall",      market:"Pollachi Mandi",   state:"Tamil Nadu",     minPrice:1400, maxPrice:1800, modalPrice:1600, unit:"100 nuts",trend:"stable" },
  // West Bengal
  { crop:"rice",     variety:"MTU-7029",  market:"Burdwan Mandi",    state:"West Bengal",    minPrice:2000, maxPrice:2350, modalPrice:2180, trend:"stable" },
  { crop:"jute",     variety:"JRO-524",   market:"Kolkata Mandi",    state:"West Bengal",    minPrice:4500, maxPrice:5000, modalPrice:4750, trend:"up"     },
];

/** Seed MongoDB only if the collection is empty. */
const seedMarketData = async () => {
  const count = await Market.countDocuments();
  if (count === 0) {
    await Market.insertMany(SEED_DATA);
    console.log(`🌾  Seeded ${SEED_DATA.length} market price records`);
  }
};

/**
 * Query market prices with optional filters.
 * @param {Object} filters — { crop, state, district }
 */
const getMarketPrices = async (filters = {}) => {
  const query = {};
  if (filters.crop)     query.crop  = filters.crop.toLowerCase().trim();
  if (filters.state)    query.state = new RegExp(filters.state, "i");
  if (filters.district) query.district = new RegExp(filters.district, "i");
  return Market.find(query).sort({ date: -1 }).limit(60).lean();
};

const addMarketPrice = async (data) => new Market(data).save();

module.exports = { seedMarketData, getMarketPrices, addMarketPrice };
