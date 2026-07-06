// routes/location.routes.js
const router = require("express").Router();
const { requireLocation }     = require("../middleware/location.middleware");
const { getLocationSummary }  = require("../controllers/location.controller");

// GET /api/location-summary?lat=&lon=&state=
router.get("/", requireLocation, getLocationSummary);

module.exports = router;
