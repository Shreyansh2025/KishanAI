// models/Market.js
// Stores real-time / seeded crop market prices per mandi.
const mongoose = require("mongoose");

const MarketSchema = new mongoose.Schema(
  {
    crop:       { type: String, required: true, trim: true, lowercase: true },
    variety:    { type: String, trim: true, default: "General" },
    market:     { type: String, required: true, trim: true },          // Mandi name
    state:      { type: String, required: true, trim: true },          // State — used for location filter
    district:   { type: String, trim: true },
    minPrice:   { type: Number, required: true, min: 0 },
    maxPrice:   { type: Number, required: true, min: 0 },
    modalPrice: { type: Number, required: true, min: 0 },
    unit:       { type: String, default: "quintal" },                  // Per quintal (100 kg)
    trend:      { type: String, enum: ["up", "down", "stable"], default: "stable" },
    date:       { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index for fast state + crop lookups
MarketSchema.index({ state: 1, crop: 1, date: -1 });

module.exports = mongoose.model("Market", MarketSchema);
