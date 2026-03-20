// server.js
// Entry point: connects DB, seeds data, then starts the HTTP server.
require("dotenv").config();

const app              = require("./app");
const connectDB        = require("./config/db");
const { seedMarketData } = require("./services/market.service");

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "https://kishan-ai.vercel.app/", // Your Vercel link
  credentials: true
}));
const start = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Seed initial market price data (runs only on empty collection)
  await seedMarketData();

  // 3. Start HTTP server
  const server = app.listen(PORT, "0.0.0.0",() => {
    console.log(`\n🚀  Agri Advisor API running on http://localhost:${PORT}`);
    console.log(`📋  Health check → http://localhost:${PORT}/health`);
    console.log(`🌾  Environment  → ${process.env.NODE_ENV || "development"}\n`);
  });

  // Graceful shutdown
  const shutdown = (sig) => {
    console.log(`\n⚠️   ${sig} received — shutting down gracefully…`);
    server.close(() => {
      console.log("✅  HTTP server closed.");
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
};

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
