// ══════════════════════════════════════════════════════════════
// 📍 KisanMitra — useLocation Hook
//    Handles browser geolocation + reverse geocoding for state.
//    Stores result in sessionStorage so it persists per tab.
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { inferStateFromCoords } from "../utils/geoUtils";

const STORAGE_KEY = "kisanmitra_location";

export function useLocation() {
  const [loc, setLoc] = useState(() => {
    // Try to restore from previous session
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { lat: null, lon: null, state: "", resolved: false };
    } catch {
      return { lat: null, lon: null, state: "", resolved: false };
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const resolveLocation = useCallback(async (lat, lon) => {
    // 1. Try Nominatim reverse geocode (free, no key)
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const geo  = await resp.json();
      const state =
        geo.address?.state ||
        geo.address?.region ||
        inferStateFromCoords(lat, lon) ||
        "";
      return state;
    } catch {
      // 2. Fallback to local bounding-box lookup (no network needed)
      return inferStateFromCoords(lat, lon) || "";
    }
  }, []);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        const state = await resolveLocation(lat, lon);
        const result = { lat, lon, state, resolved: true };
        setLoc(result);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Location access denied. Please allow location access and try again."
            : "Could not get your location. Please try again."
        );
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, [resolveLocation]);

  // Auto-request on first mount if not already resolved
  useEffect(() => {
    if (!loc.resolved) requestLocation();
  }, []); // eslint-disable-line

  const clearLocation = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setLoc({ lat: null, lon: null, state: "", resolved: false });
  }, []);

  return {
    loc,          // { lat, lon, state, resolved }
    loading,      // true while fetching GPS
    error,        // error string or null
    requestLocation,
    clearLocation,
    // Convenience: true only when lat/lon are available
    hasLocation: !!(loc.lat && loc.lon),
  };
}
