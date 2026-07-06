// routes/profit.routes.js
const router = require("express").Router();
const { optionalLocation }  = require("../middleware/location.middleware");
const { calculateProfit }   = require("../controllers/profit.controller");

// POST /api/profit  { lat, lon, state, investment, expectedRevenue, area?, crop? }
router.post("/", optionalLocation, calculateProfit);

module.exports = router;
