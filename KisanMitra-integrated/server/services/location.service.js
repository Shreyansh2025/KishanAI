// services/location.service.js
// Static geo-intelligence for Indian states:
//   • Soil type & pH band
//   • Agro-climatic zone
//   • Dominant crops
//   • Lat/lon → state resolver (bounding-box approximation)
// All data is used to enrich location-aware API responses.

// ─── State soil & zone profiles ──────────────────────────────────────────────
const STATE_PROFILES = {
  "Madhya Pradesh":  { soil: "Black Cotton Soil (Vertisol)", ph: [6.5, 8.0], zone: "Central Plateau", crops: ["Soybean","Wheat","Chickpea","Maize","Cotton"] },
  Maharashtra:       { soil: "Black Basalt / Red Laterite", ph: [6.0, 8.0], zone: "Deccan Plateau",  crops: ["Cotton","Soybean","Sugarcane","Onion","Jowar"] },
  Punjab:            { soil: "Alluvial (Indo-Gangetic)",    ph: [7.0, 8.5], zone: "North-West Plain", crops: ["Wheat","Rice","Maize","Mustard","Sugarcane"] },
  Haryana:           { soil: "Alluvial",                   ph: [7.0, 8.5], zone: "North-West Plain", crops: ["Wheat","Rice","Mustard","Sugarcane","Cotton"] },
  "Uttar Pradesh":   { soil: "Alluvial / Loam",            ph: [6.5, 8.0], zone: "Upper Gangetic",   crops: ["Wheat","Rice","Sugarcane","Potato","Mustard"] },
  Rajasthan:         { soil: "Arid Sandy / Red",           ph: [7.0, 9.0], zone: "Arid Western",     crops: ["Bajra","Mustard","Chickpea","Groundnut","Cumin"] },
  Gujarat:           { soil: "Black Cotton / Alluvial",    ph: [6.5, 8.5], zone: "Gujarat Plain",    crops: ["Groundnut","Cotton","Wheat","Tobacco","Castor"] },
  Karnataka:         { soil: "Red Laterite / Black",       ph: [5.5, 7.5], zone: "Southern Plateau", crops: ["Ragi","Maize","Cotton","Sugarcane","Sunflower"] },
  "Andhra Pradesh":  { soil: "Black / Red Loam",           ph: [6.0, 7.5], zone: "Eastern Deccan",   crops: ["Rice","Cotton","Groundnut","Chilli","Tobacco"] },
  Telangana:         { soil: "Black Cotton / Red",         ph: [6.0, 7.5], zone: "Central Deccan",   crops: ["Rice","Cotton","Soybean","Maize","Turmeric"] },
  "Tamil Nadu":      { soil: "Red Sandy / Black",          ph: [5.5, 7.5], zone: "Eastern Coastal",  crops: ["Rice","Sugarcane","Banana","Cotton","Groundnut"] },
  Kerala:            { soil: "Laterite / Red Sandy",       ph: [4.5, 6.5], zone: "Western Coast",    crops: ["Coconut","Rubber","Pepper","Tea","Coffee"] },
  "West Bengal":     { soil: "Alluvial",                   ph: [5.5, 7.0], zone: "Eastern Gangetic", crops: ["Rice","Jute","Potato","Wheat","Vegetables"] },
  Bihar:             { soil: "Alluvial",                   ph: [6.5, 8.0], zone: "Middle Gangetic",  crops: ["Rice","Wheat","Maize","Lentil","Sugarcane"] },
  Odisha:            { soil: "Red Laterite / Alluvial",    ph: [5.5, 7.0], zone: "Eastern Coastal",  crops: ["Rice","Groundnut","Mustard","Jute","Sugarcane"] },
  Jharkhand:         { soil: "Red Laterite / Sandy",       ph: [5.0, 6.5], zone: "Chhotanagpur",     crops: ["Rice","Maize","Wheat","Potato","Vegetables"] },
  Chhattisgarh:      { soil: "Red Yellow / Black",         ph: [5.5, 7.0], zone: "Upper Mahanadi",   crops: ["Rice","Maize","Soybean","Chickpea","Wheat"] },
  "Himachal Pradesh":{ soil: "Mountain / Sandy Loam",      ph: [5.0, 6.5], zone: "Western Himalaya", crops: ["Apple","Wheat","Maize","Potato","Ginger"] },
  Uttarakhand:       { soil: "Mountain Alluvial",          ph: [5.5, 7.0], zone: "Central Himalaya", crops: ["Wheat","Rice","Maize","Potato","Lentil"] },
  Assam:             { soil: "Alluvial / Red",             ph: [5.0, 6.5], zone: "North-East",       crops: ["Rice","Tea","Jute","Mustard","Sugarcane"] },
  Default:           { soil: "Loamy (mixed)",              ph: [6.0, 7.5], zone: "General",          crops: ["Wheat","Rice","Maize","Soybean","Groundnut"] },
};

// ─── Bounding-box lat/lon → state resolver ───────────────────────────────────
// Approximate bounding boxes for major states (lat_min, lat_max, lon_min, lon_max)
const STATE_BOUNDS = [
  { state: "Punjab",             b: [29.5, 32.5, 73.8, 76.9] },
  { state: "Haryana",            b: [27.6, 30.9, 74.5, 77.6] },
  { state: "Himachal Pradesh",   b: [30.3, 33.2, 75.5, 79.0] },
  { state: "Uttarakhand",        b: [28.7, 31.5, 77.5, 81.0] },
  { state: "Uttar Pradesh",      b: [23.8, 30.4, 77.0, 84.7] },
  { state: "Rajasthan",          b: [23.0, 30.2, 69.3, 78.3] },
  { state: "Gujarat",            b: [20.1, 24.7, 68.0, 74.5] },
  { state: "Madhya Pradesh",     b: [21.0, 26.9, 74.0, 82.8] },
  { state: "Chhattisgarh",       b: [17.7, 24.1, 80.2, 84.4] },
  { state: "Maharashtra",        b: [15.6, 22.1, 72.6, 80.9] },
  { state: "Bihar",              b: [24.2, 27.5, 83.2, 88.3] },
  { state: "Jharkhand",          b: [21.9, 25.3, 83.3, 87.5] },
  { state: "West Bengal",        b: [21.4, 27.2, 85.7, 89.9] },
  { state: "Odisha",             b: [17.7, 22.6, 81.3, 87.5] },
  { state: "Andhra Pradesh",     b: [12.4, 19.9, 76.7, 84.8] },
  { state: "Telangana",          b: [15.8, 19.9, 77.0, 81.4] },
  { state: "Karnataka",          b: [11.5, 18.5, 74.0, 78.6] },
  { state: "Tamil Nadu",         b: [8.0,  13.6, 76.2, 80.3] },
  { state: "Kerala",             b: [8.2,  12.8, 74.8, 77.4] },
  { state: "Assam",              b: [24.1, 28.2, 89.7, 96.0] },
];

/**
 * Infer state name from lat/lon using bounding-box matching.
 * @returns {string} Matched state name, or "Unknown"
 */
const inferStateFromCoords = (lat, lon) => {
  const match = STATE_BOUNDS.find(
    ({ b: [latMin, latMax, lonMin, lonMax] }) =>
      lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax
  );
  return match ? match.state : "Unknown";
};

/**
 * Get the soil & zone profile for a state.
 * Falls back to Default profile.
 */
const getStateProfile = (state) =>
  STATE_PROFILES[state] || STATE_PROFILES["Default"];

/**
 * Build a full location context object used by multiple controllers.
 * @param {number} lat
 * @param {number} lon
 * @param {string} stateOverride  — state provided by the user (preferred over inferred)
 */
const buildLocationContext = (lat, lon, stateOverride = "") => {
  const resolvedState =
    stateOverride && stateOverride !== "Unknown" && stateOverride.length > 1
      ? stateOverride
      : inferStateFromCoords(lat, lon);

  const profile = getStateProfile(resolvedState);

  return {
    lat,
    lon,
    state: resolvedState,
    soil:  profile.soil,
    phRange: profile.ph,
    zone:  profile.zone,
    dominantCrops: profile.crops,
  };
};

module.exports = { buildLocationContext, getStateProfile, inferStateFromCoords };
