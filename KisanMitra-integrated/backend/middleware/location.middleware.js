// middleware/location.middleware.js
// ─────────────────────────────────────────────────────────────────────────────
// CORE MIDDLEWARE — extracts lat, lon, state from every request and attaches
// a validated `req.location` object.  Controllers never parse location manually.
//
// Lookup priority (first found wins):
//   1. req.body   (POST/PUT with JSON or form-data)
//   2. req.query  (GET ?lat=&lon=&state=)
//   3. req.headers (x-latitude / x-longitude / x-state)
// ─────────────────────────────────────────────────────────────────────────────

const { validationError } = require("../utils/responseHandler");

/**
 * Strict location middleware — rejects the request when lat/lon are absent.
 * Attach to routes that REQUIRE coordinates (weather, crop, satellite …).
 */
const requireLocation = (req, res, next) => {
  const loc = extractLocation(req);

  if (!loc.lat || !loc.lon) {
    return validationError(
      res,
      "Location is required. Provide lat & lon via query (?lat=&lon=), request body, or headers (x-latitude / x-longitude)."
    );
  }

  const latNum = parseFloat(loc.lat);
  const lonNum = parseFloat(loc.lon);

  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    return validationError(res, "Invalid latitude. Must be a number between -90 and 90.");
  }
  if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
    return validationError(res, "Invalid longitude. Must be a number between -180 and 180.");
  }

  req.location = {
    lat: latNum,
    lon: lonNum,
    state: normaliseState(loc.state || ""),
    raw: loc,
  };

  next();
};

/**
 * Soft location middleware — populates req.location if data is present,
 * but does NOT reject when absent.  Used on routes where location is optional.
 */
const optionalLocation = (req, res, next) => {
  const loc = extractLocation(req);

  req.location = {
    lat: loc.lat ? parseFloat(loc.lat) : null,
    lon: loc.lon ? parseFloat(loc.lon) : null,
    state: normaliseState(loc.state || ""),
    raw: loc,
  };

  next();
};

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Pull location fields from body → query → headers (in that priority order). */
const extractLocation = (req) => ({
  lat:
    req.body?.lat   ?? req.query?.lat   ?? req.headers["x-latitude"]  ?? null,
  lon:
    req.body?.lon   ?? req.query?.lon   ?? req.headers["x-longitude"] ?? null,
  state:
    req.body?.state ?? req.query?.state ?? req.headers["x-state"]     ?? "",
});

/** Normalise state name to Title Case, trim whitespace. */
const normaliseState = (state) =>
  state
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

module.exports = { requireLocation, optionalLocation };
