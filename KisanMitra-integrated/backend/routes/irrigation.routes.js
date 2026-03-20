// routes/irrigation.routes.js
const router = require("express").Router();
const { optionalLocation }    = require("../middleware/location.middleware");
const { getIrrigationAdvice } = require("../controllers/irrigation.controller");

// POST /api/irrigation  { lat, lon, state, temperature, soilMoisture, crop?, cropStage? }
router.post("/", optionalLocation, getIrrigationAdvice);

module.exports = router;
