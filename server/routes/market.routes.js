// routes/market.routes.js
const router = require("express").Router();
const { optionalLocation } = require("../middleware/location.middleware");
const { getMarket, addMarket, getTrending } = require("../controllers/market.controller");

// GET  /api/market?lat=&lon=&state=&crop=&district=
router.get("/",          optionalLocation, getMarket);
// GET  /api/market/trending?lat=&lon=&state=
router.get("/trending",  optionalLocation, getTrending);
// POST /api/market  — add new price record
router.post("/",         optionalLocation, addMarket);

module.exports = router;
