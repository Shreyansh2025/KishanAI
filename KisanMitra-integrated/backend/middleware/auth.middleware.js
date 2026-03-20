// middleware/auth.middleware.js
// Verifies the JWT token sent in the Authorization header.
// Attaches req.user = { id, name } on success.
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "kisan-mitra-secret-change-in-prod";

// Tiny JWT implementation — avoids adding jsonwebtoken dependency
function base64url(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function sign(payload) {
  const header  = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body    = base64url(JSON.stringify(payload));
  const sig     = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${header}.${body}.${sig}`;
}

function verify(token) {
  const [header, body, sig] = token.split(".");
  const expected = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(Buffer.from(body, "base64").toString());
  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error("Token expired");
  return payload;
}

module.exports.signToken = (user) =>
  sign({ id: user._id, name: user.name, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 });

module.exports.verifyToken = verify;

module.exports.authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ status: "error", message: "Authentication required." });
  }
  try {
    req.user = verify(auth.slice(7));
    next();
  } catch {
    res.status(401).json({ status: "error", message: "Invalid or expired token." });
  }
};