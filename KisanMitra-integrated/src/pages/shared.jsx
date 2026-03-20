// ══════════════════════════════════════════════
// 🧩 KisanMitra — Shared Page Components
// ══════════════════════════════════════════════
import { DS } from "../constants/designSystem";
import { Btn } from "../components/ui";

/**
 * Shows GPS state when resolved, or a warning with "Allow" button when not.
 */
export function LocationBanner({ loc, onRequest, loading }) {
  if (loc?.lat) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#f0fdf4", border: `1px solid #86efac`,
        borderRadius: "10px", padding: "8px 14px", marginBottom: 16,
        fontSize: 13, fontWeight: 700, color: "#166534",
      }}>
        <span>📍</span>
        <span>{loc.state || `${loc.lat.toFixed(2)}°N, ${loc.lon.toFixed(2)}°E`}</span>
        <span style={{ opacity: 0.6, fontWeight: 500 }}>· Location active</span>
      </div>
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "#fffbeb", border: `1px solid #fbbf24`,
      borderRadius: "10px", padding: "8px 14px", marginBottom: 16,
      fontSize: 13, fontWeight: 600, color: "#92400e",
    }}>
      <span>⚠️</span>
      <span>Location not set — some features use GPS for best results.</span>
      <Btn onClick={onRequest} disabled={loading} size="sm" variant="secondary"
        style={{ marginLeft: "auto", flexShrink: 0 }}>
        {loading ? "Locating…" : "📍 Allow"}
      </Btn>
    </div>
  );
}

/**
 * "Powered by" footer tag for pages that use the backend.
 */
export function BackendBadge({ label = "Backend AI" }) {
  return (
    <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, fontWeight: 600, color: DS.slate400 }}>
      🔌 Powered by {label}
    </div>
  );
}
