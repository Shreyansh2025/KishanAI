// models/User.js
// KisanMitra user accounts — stores credentials and farmer profile.
const mongoose = require("mongoose");
const crypto   = require("crypto");

const UserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    phone:    {
      type: String, trim: true,
      match: [/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"],
    },
    email:    {
      type: String, trim: true, lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"],
    },
    password: { type: String, required: true, minlength: 6 },  // "salt:hash", both hex (see below)
    state:    { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// Require at least one of phone/email
UserSchema.pre("validate", function (next) {
  if (!this.phone && !this.email) {
    this.invalidate("phone", "Phone number or email is required.");
  }
  next();
});

// ── Password hashing ─────────────────────────────────────────────────────
// Previously this used a bare, unsalted SHA-256 hash. That's insecure:
// identical passwords always hash to the same value, so a leaked DB can be
// cracked with precomputed rainbow tables in seconds. This uses a per-user
// random salt + PBKDF2 (100k iterations, SHA-256) instead — still zero
// extra dependencies (crypto is built into Node), just salted and
// deliberately slow to brute-force.
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN     = 64;

UserSchema.statics.hashPassword = (raw) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(raw, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, "sha256")
    .toString("hex");
  return `${salt}:${hash}`;
};

UserSchema.methods.checkPassword = function (raw) {
  const [salt, storedHash] = (this.password || "").split(":");
  if (!salt || !storedHash) return false; // legacy/unsalted hash — fail closed

  const hash = crypto
    .pbkdf2Sync(raw, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, "sha256")
    .toString("hex");

  // Constant-time comparison to avoid timing attacks.
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Unique index on email (sparse — allows multiple docs with no email)
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", UserSchema);