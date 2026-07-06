// routes/disease.routes.js
const router  = require("express").Router();
const multer  = require("multer");
const path    = require("path");
const { optionalLocation } = require("../middleware/location.middleware");
const { detectDisease }    = require("../controllers/disease.controller");

// ── Multer storage config ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename:    (_req, file, cb) =>
    cb(null, `disease_${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits:      { fileSize: 5 * 1024 * 1024 },              // 5 MB
  fileFilter:  (_req, file, cb) => {
    /image\/(jpeg|jpg|png|webp)/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only JPEG / PNG / WEBP images accepted"), false);
  },
});

// POST /api/disease  — field name: "image"
router.post("/", optionalLocation, upload.single("image"), detectDisease);

module.exports = router;
