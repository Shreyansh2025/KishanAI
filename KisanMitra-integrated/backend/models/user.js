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
    password: { type: String, required: true, minlength: 6 },  // stored as SHA-256 hex (no bcrypt dep needed)
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

// Simple hash — avoids adding bcrypt dependency
UserSchema.statics.hashPassword = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

UserSchema.methods.checkPassword = function (raw) {
  return this.password === UserSchema.statics.hashPassword(raw);
};

// Unique index on email (sparse — allows multiple docs with no email)
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", UserSchema);