# 🌾 KisanMitra — AI-Powered Smart Farming Assistant

KisanMitra is a full-stack, bilingual (English + 8 Indian languages) web app that
gives Indian farmers AI-backed advice on crop selection, disease detection,
fertilizer schedules, irrigation, profit planning, mandi (market) prices,
weather, satellite NDVI health, and a conversational farming chatbot — all
personalized by GPS location. Built as a hackathon project, packaged as a
web app (React + Vite) and also shippable as an Android/iOS app via Capacitor.

---

## ✨ Features

| Feature | What it does |
|---|---|
| 🌾 Crop Recommendation | Suggests the best crop from soil (N/P/K/pH) + live weather, via an AI model with a rule-based fallback |
| 🔬 Disease Detection | Upload a leaf photo → AI vision model diagnoses disease + treatment |
| 💊 Fertilizer Advisor | NPK schedule, organic alternatives, and warnings per crop |
| 🌦️ Weather | Live conditions + 7-day forecast + agricultural alerts |
| 💧 Irrigation Advisor | ET₀-based watering schedule and water-saving tips |
| 💰 Profit Calculator | ROI, net profit, risk, and government scheme matches |
| 📈 Market Prices | Live-style mandi prices with trends, nearby-mandi comparison |
| 🛰️ Satellite / NDVI | 5×5 field health grid with recommendations |
| 🤖 Chatbot | Multilingual farming Q&A (Gemini → HuggingFace → rule-based fallback chain) |
| 🌱 Vegetable Planner | Season-aware vegetable suggestions (Kharif/Rabi/Zaid) |
| 🔐 Auth | Phone/email + password login with JWT sessions |

---

## 🧱 Tech Stack

**Frontend** — React 18 + Vite, plain CSS-in-JS (no UI framework), Capacitor
(Android/iOS wrapper), Web Speech API for voice input.

**Backend** — Node.js + Express, MongoDB (Mongoose), JWT auth (hand-rolled,
no `jsonwebtoken` dependency), Multer for file uploads.

**External AI/data APIs** (all optional — every feature has a rule-based or
mock-data fallback if a key is missing):
Google Gemini, HuggingFace (Mistral-7B), Groq Vision (Llama-4 Scout),
OpenWeatherMap, MyMemory Translation, Nominatim (OpenStreetMap) reverse
geocoding.

---

## 📁 Project Structure

```
KisanMitra-integrated/
├── src/                          ← React frontend
│   ├── api/                      ← Backend + AI API clients (config.js = single source of truth for URLs)
│   ├── components/               ← Navbar, PageShell, shared UI (Btn, Spinner, etc.)
│   ├── context/                  ← AppContext (nav/lang), AuthContext (login state)
│   ├── hooks/                    ← useLocation (GPS), useVoice (speech-to-text)
│   ├── pages/                    ← One file per feature page
│   ├── constants/                ← Design tokens, translations, static data
│   └── styles/                   ← Global CSS (incl. responsive grid helpers)
│
├── server/                       ← Express backend
│   ├── controllers/              ← One per feature (crop, disease, weather, …)
│   ├── routes/                   ← HTTP routes
│   ├── services/                 ← External API calls + business logic
│   ├── middleware/                ← Location extraction/validation, JWT auth, error handler
│   ├── models/                   ← Mongoose schemas (User, Market)
│   └── .env.example              ← Copy to .env and fill in your keys
│
├── android/ , ios/                ← Capacitor native shells
├── vite.config.js
└── vercel.json                   ← SPA rewrite rule for Vercel deploys
```

---

## 🚀 Getting Started

### 1. Backend

```bash
cd server
cp .env.example .env      # fill in MONGO_URI at minimum; AI keys are optional
npm install
npm run dev                # http://localhost:5000/health
```

### 2. Frontend

```bash
npm install                 # from the project root
npm run dev                 # http://localhost:3000
```

The frontend talks to the backend URL set in `src/api/config.js`
(`BACKEND_URL`). For local development against your own backend, change it to
`http://localhost:5000`, or set `VITE_BACKEND_URL` in a `.env` file at the
project root (used by `AuthContext`).

### 3. Mobile (optional)

```bash
npm run build
npx cap sync
npx cap open android   # or: npx cap open ios
```

---

## 🔑 Environment Variables (`server/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | recommended | Signs auth tokens — set a real secret in production |
| `FRONTEND_URL` | recommended | Your deployed frontend origin, for CORS |
| `GEMINI_API_KEY` | optional | Powers the chatbot |
| `HUGGINGFACE_API_KEY` | optional | Crop recommendation AI + chatbot fallback |
| `GROQ_API_KEY` | optional | Disease detection vision model |
| `OPENWEATHER_API_KEY` | optional | Live weather (falls back to demo data without it) |

---

## 🐛 Bugs found & fixed in this pass

1. **CORS silently blocked every real request.** `server.js` added a *second*
   hardcoded CORS config (`origin: "https://kishan-ai.vercel.app/"`) on top of
   the one already in `app.js`. The trailing slash meant it could never match
   a real browser `Origin` header (which never has one), so cross-origin
   requests from the deployed frontend were rejected. Removed the duplicate;
   CORS is now configured once, in `app.js`, via `FRONTEND_URL`.

2. **`.gitignore` protected the wrong folder.** It ignored `backend/.env`,
   `backend/node_modules/`, etc., but the backend folder is actually named
   `server/`. In practice this meant `.env` secrets and `node_modules` were
   never actually excluded from git. Fixed the paths.

3. **Missing `.env.example`.** The README referenced one, but it didn't exist
   in the repo — added it with every variable the backend actually reads.

4. **Passwords stored as unsalted SHA-256.** Identical passwords hashed to
   identical values, making the whole user table crackable with a rainbow
   table if it ever leaked. Replaced with per-user salted PBKDF2 (100k
   iterations) plus a constant-time comparison, using only Node's built-in
   `crypto` (no new dependency).

5. **Not responsive (the one you flagged).** Several places used fixed CSS
   grid columns that don't adapt to phone-sized screens:
   - The **navbar** packed the app name, a home button, a language dropdown
     (with full language name), a user chip, and a logout button into one
     non-wrapping row — on phones under ~380–480px this overflowed and
     forced horizontal scrolling on the *entire page*. It now collapses
     progressively: the home label hides first, then the language name,
     then the app name shrinks and truncates.
   - Several pages (weather stats, 7-day forecast, fertilizer NPK cards,
     profit/market comparisons, the mandi price table) used hardcoded
     `repeat(4,1fr)`, `repeat(7,1fr)`, or `"1fr 1fr"` grids that stayed just
     as many columns wide on a 320px phone as on a desktop, squashing text
     and icons. Added reusable responsive grid classes
     (`.stat-grid-4`, `.forecast-grid-7`, `.two-col-grid`, `.mandi-row`,
     plus the existing `.responsive-grid-3`) that collapse to fewer columns
     below set breakpoints, and applied them everywhere the fixed grids were.
   - Added `overflow-x: hidden` on `html body` as a safety net against any
     remaining edge-case overflow.

6. **Confusing/fragile mock-weather code.** `mockWeather()` computed sunrise/
   sunset into unused local variables, then separately mutated a shared
   `now` Date object in place (via `Date#setHours`, which returns a
   timestamp, not a new date) to build the actual returned values. It
   happened to produce correct output, but was easy to break on the next
   edit. Rewritten with two independent `Date` clones and no dead code.

> Not fixed (by design, worth knowing for your viva): the JWT implementation
> in `middleware/auth.middleware.js` is hand-rolled with HMAC-SHA256 rather
> than a vetted library — functionally fine for a hackathon demo, but call
> this out if asked about production hardening. Similarly, `server/models/model.h5`
> (a TensorFlow/Keras model) is present but unused — disease detection
> actually runs through the Groq vision API instead; safe to remove if you
> want to slim down the repo.

---

## 📝 License

Built for a hackathon by Shreyansh and team. Add a license of your choice
before publishing publicly (MIT is a common default for student projects).
