// ════════════════════════════════════════════════════════
// 🛰️ SatellitePage — GET /api/satellite?lat=&lon=
//    Returns simulated 5×5 NDVI grid around your farm.
//    Connect to ESA Sentinel Hub / ISRO Bhuvan for live data.
// ════════════════════════════════════════════════════════
import { useState } from "react";
import { DS } from "../constants/designSystem";
import { useApp } from "../context/AppContext";
import { fetchSatellite } from "../api/agriBackend";
import { PageShell } from "../components/layout";
import { Card, Btn, Spinner, ErrorCard, Tag, StatCard, ResultSection } from "../components/ui";
import { LocationBanner } from "./shared";

// NDVI status → color mapping
const NDVI_COLORS = {
  healthy:  { bg: "#dcfce7", border: "#4ade80", text: "#166534", dot: "#16a34a" },
  moderate: { bg: "#fef9c3", border: "#facc15", text: "#713f12", dot: "#ca8a04" },
  stressed: { bg: "#ffedd5", border: "#fb923c", text: "#7c2d12", dot: "#ea580c" },
  dry:      { bg: "#fee2e2", border: "#f87171", text: "#7f1d1d", dot: "#dc2626" },
};

const NDVI_EMOJIS = { healthy: "🟢", moderate: "🟡", stressed: "🟠", dry: "🔴" };

export function SatellitePage() {
  const { t, loc, location } = useApp();
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);

  const handleFetch = async () => {
    if (!loc?.lat) { await location.requestLocation(); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await fetchSatellite({ lat: loc.lat, lon: loc.lon, state: loc.state });
      setResult(data);
    } catch (e) { setError(e.message || t.error); }
    setLoading(false);
  };

  const summary = result?.summary;

  return (
    <PageShell title="Satellite Monitor" icon="🛰️">
      <LocationBanner loc={loc} onRequest={location.requestLocation} loading={location.loading} />

      <Card>
        {loc?.lat
          ? <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🛰️</div>
              <div style={{ fontWeight: 700, color: DS.slate700 }}>{loc.state || "Your Farm"}</div>
              <div style={{ fontSize: 13, color: DS.slate400, marginTop: 4 }}>
                {loc.lat.toFixed(4)}°N, {loc.lon.toFixed(4)}°E · Sentinel-2 (simulated)
              </div>
            </div>
          : <div style={{ textAlign: "center", padding: "16px 0", color: DS.slate500 }}>
              <div style={{ fontSize: 40 }}>🌍</div>
              <div style={{ marginTop: 8, fontWeight: 600 }}>Allow location access to scan your field</div>
            </div>
        }
        <div style={{ marginTop: 20 }}>
          <Btn onClick={handleFetch} disabled={loading} size="full">
            {loading ? `⏳ ${t.loading}` : loc?.lat ? "🛰️ Scan My Field" : `📍 ${t.useLocation}`}
          </Btn>
        </div>
      </Card>

      {loading && <Spinner />}
      {error && <ErrorCard msg={error} t={t} />}

      {result && (
        <ResultSection>
          {/* Overall health banner */}
          <div style={{
            background: summary?.overallHealth === "Good" ? DS.gradientGreen
              : summary?.overallHealth === "Poor" ? "linear-gradient(135deg,#7f1d1d,#991b1b)"
              : "linear-gradient(135deg,#78350f,#92400e)",
            borderRadius: DS["2xl"], padding: "20px 24px",
            color: DS.white, marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700, marginBottom: 4 }}>
                🛰️ {result.satellite} · {result.resolution}
              </div>
              <div style={{ fontFamily: DS.fontDisplay, fontWeight: 800, fontSize: 26 }}>
                Field Health: {summary?.overallHealth}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                📍 {result.location?.state} · {result.location?.zone}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Scanned at</div>
              <div style={{ fontWeight: 700 }}>{new Date(result.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>

          {/* Summary stat cards */}
          <div className="responsive-grid-4" style={{ marginBottom: 20 }}>
            <StatCard icon="🟢" label="Healthy"  value={`${summary?.percentages?.healthy}`}  color={DS.green600} />
            <StatCard icon="🟡" label="Moderate" value={`${summary?.percentages?.moderate}`} color={DS.amber600} />
            <StatCard icon="🟠" label="Stressed" value={`${summary?.percentages?.stressed}`} color="#ea580c" />
            <StatCard icon="🔴" label="Dry"      value={`${summary?.percentages?.dry}`}      color={DS.red600} />
          </div>

          {/* 5×5 NDVI Grid */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: DS.slate700, marginBottom: 6 }}>
              🗺️ NDVI Zone Grid — {summary?.totalZones} zones (1 ha each)
            </div>
            <div style={{ fontSize: 12, color: DS.slate400, fontWeight: 600, marginBottom: 16 }}>
              Hover a zone for NDVI value
            </div>

            {/* Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 6,
            }}>
              {result.ndviGrid?.map((zone) => {
                const c = NDVI_COLORS[zone.status] || NDVI_COLORS.moderate;
                const isHovered = hoveredZone === zone.id;
                return (
                  <div
                    key={zone.id}
                    onMouseEnter={() => setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                    title={`Zone ${zone.id} · NDVI ${zone.ndvi} · ${zone.status}`}
                    style={{
                      background: c.bg,
                      border: `2px solid ${isHovered ? c.dot : c.border}`,
                      borderRadius: DS.md,
                      padding: "10px 6px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      transform: isHovered ? "scale(1.06)" : "scale(1)",
                      boxShadow: isHovered ? `0 4px 12px ${c.dot}40` : "none",
                      position: "relative",
                    }}
                  >
                    <div style={{ fontSize: 18 }}>{NDVI_EMOJIS[zone.status]}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: c.text, marginTop: 3 }}>
                      {zone.id}
                    </div>
                    {isHovered && (
                      <div style={{
                        position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
                        transform: "translateX(-50%)",
                        background: DS.slate800, color: DS.white,
                        fontSize: 11, fontWeight: 700,
                        padding: "4px 8px", borderRadius: DS.sm,
                        whiteSpace: "nowrap", zIndex: 10,
                        pointerEvents: "none",
                      }}>
                        NDVI: {zone.ndvi}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              {Object.entries(NDVI_COLORS).map(([status, c]) => (
                <div key={status} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: c.dot }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: DS.slate600, textTransform: "capitalize" }}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Legend descriptions */}
          <Card style={{ background: DS.slate50, border: `1px solid ${DS.slate200}`, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: DS.slate700, marginBottom: 12 }}>📖 NDVI Legend</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(result.legend || {}).map(([key, desc]) => (
                <div key={key} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: NDVI_COLORS[key]?.dot || DS.slate400,
                    marginTop: 4, flexShrink: 0,
                  }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: DS.slate600, lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Recommendations */}
          {result.recommendations?.length > 0 && (
            <Card style={{ background: DS.green50, border: `1.5px solid ${DS.green200}`, marginBottom: 14 }}>
              <div style={{ fontWeight: 800, color: DS.green800, fontSize: 15, marginBottom: 12 }}>
                💡 Field Management Recommendations
              </div>
              {result.recommendations.map((rec, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  padding: "8px 0",
                  borderBottom: i < result.recommendations.length - 1 ? `1px solid ${DS.green200}` : "none",
                }}>
                  <span style={{ flexShrink: 0, fontSize: 16 }}>{rec.startsWith("✅") || rec.startsWith("⚠️") || rec.startsWith("🏜️") || rec.startsWith("🌱") ? "" : "→"}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: DS.green800, lineHeight: 1.55 }}>{rec}</span>
                </div>
              ))}
            </Card>
          )}

          <div style={{ fontSize: 12, color: DS.slate400, fontWeight: 600 }}>
            ⚠️ {result.disclaimer}
          </div>
        </ResultSection>
      )}
    </PageShell>
  );
}
