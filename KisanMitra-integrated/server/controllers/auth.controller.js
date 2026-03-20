// controllers/auth.controller.js
// Handles register, login, and get-current-user.
const User  = require("../models/user");
const { signToken } = require("../middleware/auth.middleware");

// ── POST /api/auth/register ────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, state, district } = req.body;

    if (!name || !password)
      return res.status(400).json({ status: "error", message: "Name and password are required." });
    if (password.length < 6)
      return res.status(400).json({ status: "error", message: "Password must be at least 6 characters." });

    // Check duplicate
    if (email) {
      const exists = await User.findOne({ email });
      if (exists)
        return res.status(409).json({ status: "error", message: "Email already registered. Please login." });
    }
    if (phone) {
      const exists = await User.findOne({ phone });
      if (exists)
        return res.status(409).json({ status: "error", message: "Phone already registered. Please login." });
    }

    const user = await User.create({
      name, phone, email,
      password: User.hashPassword(password),
      state, district,
    });

    const token = signToken(user);
    res.status(201).json({
      status: "success",
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, state: user.state },
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ status: "error", message: `${field} already in use.` });
    }
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)[0].message;
      return res.status(400).json({ status: "error", message: msg });
    }
    console.error(err);
    res.status(500).json({ status: "error", message: "Registration failed. Try again." });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;   // identifier = email OR phone
    if (!identifier || !password)
      return res.status(400).json({ status: "error", message: "Credentials required." });

    const isEmail = identifier.includes("@");
    const user = isEmail
      ? await User.findOne({ email: identifier.toLowerCase() })
      : await User.findOne({ phone: identifier.trim() });

    if (!user || !user.checkPassword(password))
      return res.status(401).json({ status: "error", message: "Invalid credentials." });

    const token = signToken(user);
    res.json({
      status: "success",
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, state: user.state },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Login failed. Try again." });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ status: "error", message: "User not found." });
    res.json({ status: "success", user });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Could not fetch profile." });
  }
};