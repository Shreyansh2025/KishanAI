// routes/fertilizer.routes.js
const router = require("express").Router();
const { optionalLocation }           = require("../middleware/location.middleware");
const { getFertilizerRecommendation }= require("../controllers/fertilizer.controller");

// GET /api/fertilizer?crop=rice&lat=&lon=&state=
router.get("/", optionalLocation, getFertilizerRecommendation);

module.exports = router;
