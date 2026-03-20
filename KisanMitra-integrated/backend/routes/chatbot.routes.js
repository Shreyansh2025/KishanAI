// routes/chatbot.routes.js
const router  = require("express").Router();
const multer  = require("multer");
const path    = require("path");
const { optionalLocation }      = require("../middleware/location.middleware");
const { chat, getLanguages }    = require("../controllers/chatbot.controller");

// ── Multer for audio uploads ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename:    (_req, file, cb) =>
    cb(null, `audio_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

// POST /api/chat  — field "audio" (optional), body fields: text, language, history
router.post("/",          optionalLocation, upload.single("audio"), chat);
// GET  /api/chat/languages
router.get("/languages",  getLanguages);

module.exports = router;
