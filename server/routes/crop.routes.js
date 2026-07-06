// routes/crop.routes.js
const router = require("express").Router();
const { requireLocation }        = require("../middleware/location.middleware");
const { getCropRecommendation }  = require("../controllers/crop.controller");

// POST /api/crop  { lat, lon, state, N, P, K, ph, rainfall }
router.post("/", requireLocation, getCropRecommendation);

module.exports = router;
