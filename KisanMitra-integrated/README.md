# 🌾 KisanMitra — Fully Integrated (Frontend + Backend)

React frontend fully wired to your agri-backend Express server.

---

## 📁 Complete Structure

```
KisanMitra-integrated/
│
├── src/                              ← React frontend
│   ├── api/
│   │   ├── config.js                 ⭐ CHANGE BACKEND URL + MODEL HERE
│   │   ├── agriBackend.js            ← All backend API call functions
│   │   └── claude.js                 ← Claude AI fallback
│   ├── hooks/
│   │   ├── useLocation.js            ← GPS → state name → sessionStorage
│   │   └── useVoice.js               ← Web Speech API
│   ├── pages/
│   │   ├── CropRecPage.jsx           ← POST /api/crop
│   │   ├── VegPlannerPage.jsx        ← Claude AI only
│   │   ├── DiseaseDetectPage.jsx     ← POST /api/disease
│   │   ├── FertilizerPage.jsx        ← GET  /api/fertilizer
│   │   ├── WeatherIrrigationProfitMarket.jsx  ← 4 pages
│   │   └── ChatbotPage.jsx           ← POST /api/chat
│   └── utils/geoUtils.js             ← Local state bounding-box lookup
│
├── backend/                          ← Your agri-backend (unchanged)
│   ├── server.js + app.js
│   ├── controllers/  (10 files)
│   ├── routes/       (10 files)
│   ├── services/     (weather, location, market, chatbot, bhashini)
│   ├── middleware/   (location, error)
│   └── .env.example
│
├── vite.config.js                    ← /api/* proxied to :5000
└── package.json
```

---

## 🚀 Quick Start

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env   # fill in MONGO_URI + API keys
npm install
npm run dev            # http://localhost:5000/health

# Terminal 2 — Frontend
npm install            # from project root
npm run dev            # http://localhost:3000
```

---

## ⚙️ config.js — the only file you ever need to touch

```js
// Backend URL
export const BACKEND_URL = "http://localhost:5000";

// Feature routing: true = real backend, false = Claude AI
export const USE_BACKEND = {
  crop: true, disease: true, fertilizer: true,
  weather: true, irrigation: true, profit: true,
  market: true, chatbot: true, vegPlan: false,
};

// Claude model (for vegPlan and when USE_BACKEND.X = false)
export const AI_CONFIG = {
  model: "claude-sonnet-4-20250514",
  // or: "claude-opus-4-5" / "claude-haiku-4-5-20251001"
};
```

---

## 🌐 Frontend ↔ Backend Map

| Page | Endpoint | What backend does |
|---|---|---|
| Crop Rec | POST /api/crop | Scores 15 crops with N/P/K/pH + live weather |
| Disease | POST /api/disease | Image upload → disease + treatment |
| Fertilizer | GET /api/fertilizer?crop= | Stage-wise NPK schedule table |
| Weather | GET /api/weather?lat=&lon= | OpenWeatherMap + farming insights |
| Irrigation | POST /api/irrigation | ET0 calculator → urgency + tips |
| Profit | POST /api/profit | ROI + benchmarks + govt schemes |
| Market | GET /api/market?crop= | MongoDB prices filtered by your GPS state |
| Chatbot | POST /api/chat | HuggingFace + Bhashini STT/TTS |

---

## 📍 Location Flow

GPS is captured once via browser, stored in sessionStorage,
and sent automatically with every backend call:

- POST requests → body: { lat, lon, state }
- GET requests  → query: ?lat=&lon=&state=
- All requests  → headers: x-latitude / x-longitude / x-state

The backend location.middleware.js reads whichever it finds first.

---

## 🔑 Backend .env Keys

```
MONGO_URI=mongodb://localhost:27017/agri_advisor
OPENWEATHER_API_KEY=    # free at openweathermap.org
HUGGINGFACE_API_KEY=    # free at huggingface.co
BHASHINI_API_KEY=       # bhashini.gov.in
```
