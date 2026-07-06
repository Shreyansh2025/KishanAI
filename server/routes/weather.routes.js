// routes/weather.routes.js
const router = require("express").Router();
const { requireLocation } = require("../middleware/location.middleware");
const { getWeather }      = require("../controllers/weather.controller");

// GET /api/weather?lat=&lon=&state=
router.get("/", requireLocation, getWeather);

module.exports = router;
