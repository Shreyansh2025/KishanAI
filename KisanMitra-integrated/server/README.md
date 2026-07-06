# 🌾 AI Agriculture Advisor — Backend v2.0

Production-ready Node.js + Express + MongoDB backend.
Every API is **location-aware** — pass `lat`, `lon`, and optionally `state`
and the system auto-enriches responses with live weather, regional soil data,
and state-filtered market prices.

---

## 📁 Project Structure

```
backend/
├── config/db.js                    # MongoDB connection
├── models/Market.js                # Mongoose schema for mandi prices
├── routes/                         # HTTP path + method binding (10 files)
├── controllers/                    # Request handlers — one per domain (10 files)
├── services/                       # External APIs & data logic (5 files)
│   ├── weather.service.js          # OpenWeather via lat/lon
│   ├── location.service.js         # Soil & zone profiles per Indian state
│   ├── market.service.js           # MongoDB seed + filtered queries
│   ├── chatbot.service.js          # HuggingFace + rule-based fallback
│   └── bhashini.service.js         # STT / TTS / Translation
├── middleware/
│   ├── location.middleware.js      # ⭐ Extracts & validates lat/lon/state
│   └── error.middleware.js         # Global error handler
├── utils/responseHandler.js        # Consistent { status, message, data }
├── uploads/                        # Multer storage
├── .env
├── app.js
└── server.js
```

---

## ⚙️ Setup

```bash
cd backend
npm install       # install all dependencies
npm run dev       # start with nodemon (auto-reload)
# or
npm start         # production start
```

Health check → http://localhost:5000/health

Configure `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/agri_advisor
OPENWEATHER_API_KEY=your_key      # mock data if absent
HUGGINGFACE_API_KEY=your_key      # rule-based fallback if absent
BHASHINI_API_KEY=your_key         # mock STT/TTS if absent
```

---

## 🌍 Location Middleware

Location is read from three sources (first wins):

| Priority | Source | Example |
|----------|--------|---------|
| 1 | Request **body** | `{ "lat": 22.7, "lon": 75.8 }` |
| 2 | **Query** string | `?lat=22.7&lon=75.8&state=Madhya Pradesh` |
| 3 | HTTP **headers** | `x-latitude: 22.7` / `x-longitude: 75.8` |

Attaches `req.location = { lat, lon, state }` to every request.
`requireLocation` — rejects 400 if missing.
`optionalLocation` — allows null coords.

---

## 📡 API Endpoints

| Method | Path | Location | Description |
|--------|------|----------|-------------|
| GET  | `/api/location-summary` | Required | Weather + soil + top crop |
| POST | `/api/crop`             | Required | Crop recommendation |
| GET  | `/api/weather`          | Required | Live OpenWeather data |
| POST | `/api/disease`          | Optional | Image upload → disease |
| GET  | `/api/fertilizer`       | Optional | NPK schedule for crop |
| POST | `/api/irrigation`       | Optional | Irrigation advice |
| POST | `/api/profit`           | Optional | Profit/loss calculator |
| GET  | `/api/market`           | Optional | State-filtered mandi prices |
| GET  | `/api/market/trending`  | Optional | Price trend analysis |
| POST | `/api/chat`             | Optional | Multilingual AI chatbot |
| GET  | `/api/satellite`        | Required | NDVI zone monitoring |

---

## ⚛️ React Integration

### 1. Get & store location
```js
navigator.geolocation.getCurrentPosition(({ coords }) => {
  const loc = { lat: coords.latitude, lon: coords.longitude };
  localStorage.setItem("userLocation", JSON.stringify(loc));
});
```

### 2. Axios instance — auto-injects location headers
```js
// api/axiosInstance.js
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000/api" });

api.interceptors.request.use((config) => {
  const loc = JSON.parse(localStorage.getItem("userLocation") || "{}");
  if (loc.lat) {
    config.headers["x-latitude"]  = loc.lat;
    config.headers["x-longitude"] = loc.lon;
    config.headers["x-state"]     = loc.state || "";
  }
  return config;
});

export default api;
```

### 3. API service calls
```js
// Location summary (on app load)
const { data } = await api.get("/location-summary", { params: { lat, lon } });

// Crop recommendation (body method)
const { data } = await api.post("/crop", { lat, lon, state, N, P, K, ph, rainfall });

// Disease detection (FormData)
const form = new FormData();
form.append("image", imageFile);
form.append("lat", lat);
form.append("lon", lon);
const { data } = await api.post("/disease", form);

// Market prices — state auto-injected via x-state header
const { data } = await api.get("/market");

// Chat (text)
const { data } = await api.post("/chat", { text: "पानी कब दें?", language: "hi" });

// Chat (audio)
const form = new FormData();
form.append("audio", audioBlob, "voice.wav");
form.append("language", "hi");
const { data } = await api.post("/chat", form);
// data.audio_output.data = base64 WAV — play with new Audio("data:audio/wav;base64,...")
```

### 4. Response format (always consistent)
```json
{
  "status":  "success",
  "message": "Crop recommendation generated",
  "data":    { ... }
}
```

---

## 🏗️ MVC Flow

```
Request
  │
  ▼
Location Middleware  → validates + attaches req.location
  │
  ▼
Route  →  Controller  →  Service(s)  →  External APIs / MongoDB
                │
                ▼
          responseHandler  →  { status, message, data }
```

Unhandled errors bubble to `error.middleware.js` — no per-route try/catch needed.
