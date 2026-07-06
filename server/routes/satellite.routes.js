// routes/satellite.routes.js
const router = require("express").Router();
const { requireLocation }   = require("../middleware/location.middleware");
const { getSatelliteData }  = require("../controllers/satellite.controller");

// GET /api/satellite?lat=&lon=&state=
router.get("/", requireLocation, getSatelliteData);

module.exports = router;
