// app.js
// Builds and exports the Express application.
// Keeps server.js clean — only the HTTP server lives there.
require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");
const path    = require("path");

const errorMiddleware = require("./middleware/error.middleware");

// ── Route imports ─────────────────────────────────────────────────────────────

const authRoutes       = require("./routes/auth.routes");
const locationRoutes   = require("./routes/location.routes");
const cropRoutes       = require("./routes/crop.routes");
const diseaseRoutes    = require("./routes/disease.routes");
const weatherRoutes    = require("./routes/weather.routes");
const fertilizerRoutes = require("./routes/fertilizer.routes");
const irrigationRoutes = require("./routes/irrigation.routes");
const profitRoutes     = require("./routes/profit.routes");
const marketRoutes     = require("./routes/market.routes");
const chatbotRoutes    = require("./routes/chatbot.routes");
const satelliteRoutes  = require("./routes/satellite.routes");

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","x-latitude","x-longitude","x-state"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Static: serve uploaded files ──────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({
    status:  "ok",
    service: "Agri Advisor API",
    version: "2.0.0",
    time:    new Date().toISOString(),
  })
);

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",             authRoutes);
app.use("/api/location-summary", locationRoutes);
app.use("/api/crop",             cropRoutes);
app.use("/api/disease",          diseaseRoutes);
app.use("/api/weather",          weatherRoutes);
app.use("/api/fertilizer",       fertilizerRoutes);
app.use("/api/irrigation",       irrigationRoutes);
app.use("/api/profit",           profitRoutes);
app.use("/api/market",           marketRoutes);
app.use("/api/chat",             chatbotRoutes);
app.use("/api/satellite",        satelliteRoutes);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ status: "error", message: "Route not found." })
);

// ── Global error handler (MUST be last) ──────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;