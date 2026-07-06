// ════════════════════════════════════════════════════════
// 🌾 CropRecPage — POST /api/crop
//    Scores crops using rule table + live weather from GPS.
//    Falls back to Claude AI if backend is disabled.
// ════════════════════════════════════════════════════════
import { useState } from "react";
import { DS } from "../constants/designSystem";
import { useApp } from "../context/AppContext";
// import { askClaudeJSON } from "../api/claude";
import { fetchCropRecommendation } from "../api/agriBackend";
import { USE_BACKEND } from "../api/config";
import { PageShell } from "../components/layout";
import { Card, FormGroup, Input, Btn, Spinner, ErrorCard, AIBadge, Tag, InfoRow, ResultSection } from "../components/ui";
import { LocationBanner } from "./shared";

export function CropRecPage() {
  const { t, loc, location } = useApp();
  const [form, setForm] = useState({ N: "", P: "", K: "", ph: "", rainfall: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isValid = Object.values(form).every(v => v !== "");

  const handleSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      if (USE_BACKEND.crop && loc?.lat) {
        const data = await fetchCropRecommendation({
          lat: loc.lat, lon: loc.lon, state: loc.state,
          N: form.N, P: form.P, K: form.K, ph: form.ph, rainfall: form.rainfall,
        });
        setResult({ _source: "backend", ...data });
      } else {
        const data = await askClaudeJSON(
          `Indian agriculture advisor. Soil NPK: N=${form.N}, P=${form.P}, K=${form.K}, pH=${form.ph}, rainfall=${form.rainfall}mm.
           Recommend 3 crops. JSON only:
           {"crops":[{"name":"","emoji":"","reason":"","tips":"","waterReq":"Low/Medium/High","profitPotential":"Low/Medium/High","growthDays":0}]}`,
          "Agriculture expert. Always respond with valid JSON only."
        );
        setResult({ _source: "claude", ...data });
      }
    } catch (e) { setError(e.message || t.error); }
    setLoading(false);
  };

  return (
    <PageShell title={t.cropRec} icon="🌾">
      <LocationBanner loc={loc} onRequest={location.requestLocation} loading={location.loading} />
      <Card>
        <p style={{ fontSize: 13, color: DS.slate500, fontWeight: 600, marginBottom: 16 }}>
          Enter your soil test report values. Location enables live weather scoring.
        </p>
        <div className="form-grid">
          <FormGroup label="Nitrogen — N (kg/ha)">
            <Input type="number" value={form.N} onChange={e => set("N", e.target.value)} placeholder="e.g. 80" min="0" max="200" />
          </FormGroup>
          <FormGroup label="Phosphorus — P (kg/ha)">
            <Input type="number" value={form.P} onChange={e => set("P", e.target.value)} placeholder="e.g. 50" min="0" max="150" />
          </FormGroup>
          <FormGroup label="Potassium — K (kg/ha)">
            <Input type="number" value={form.K} onChange={e => set("K", e.target.value)} placeholder="e.g. 40" min="0" max="150" />
          </FormGroup>
          <FormGroup label="Soil pH">
            <Input type="number" value={form.ph} onChange={e => set("ph", e.target.value)} placeholder="e.g. 6.5" min="4" max="9" step="0.1" />
          </FormGroup>
          <FormGroup label="Annual Rainfall (mm)">
            <Input type="number" value={form.rainfall} onChange={e => set("rainfall", e.target.value)} placeholder="e.g. 120" min="0" max="4000" />
          </FormGroup>
        </div>
        <div style={{ marginTop: 24 }}>
          <Btn onClick={handleSubmit} disabled={!isValid || loading} size="full">
            {loading ? `⏳ ${t.loading}` : `🌱 ${t.getRec}`}
          </Btn>
        </div>
      </Card>

      {loading && <Spinner />}
      {error && <ErrorCard msg={error} t={t} />}

      {/* ── Backend result ── */}
      {result?._source === "backend" && (
        <ResultSection>
          {result.weather && (
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <Tag label={`🌡️ ${result.weather.temperature}°C`} color={DS.amber600} />
              <Tag label={`💧 ${result.weather.humidity}% humidity`} color={DS.blue600} />
              <Tag label={`📍 ${result.location?.zone || result.location?.state}`} color={DS.green700} />
              {result.weather.isMock && <Tag label="⚠️ Demo weather" color={DS.slate500} />}
            </div>
          )}
          <Card style={{ border: `2px solid ${DS.green300}`, background: DS.green50, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DS.green700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>✅ Top Recommendation</div>
            <div style={{ fontFamily: DS.fontDisplay, fontWeight: 800, fontSize: 28, color: DS.green800 }}>{result.recommended?.crop}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag label={`🎯 ${result.recommended?.confidence} match`} color={DS.green700} />
              <Tag label={result.recommended?.matchScore} color={DS.green600} />
              <AIBadge label="Backend AI" />
            </div>
            {result.reasoning && (
              <div style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: DS.green800, lineHeight: 1.6, background: "#dcfce7", borderRadius: DS.md, padding: "12px 14px" }}>
                💡 {result.reasoning}
              </div>
            )}
          </Card>
          {result.alternatives?.length > 0 && (
            <div>
              <h4 style={{ fontWeight: 800, color: DS.slate700, marginBottom: 12 }}>Also Suitable</h4>
              <div className="responsive-grid-3">
                {result.alternatives.map((c, i) => (
                  <Card key={i} style={{ animation: `bounceIn 0.4s ease ${i * 0.1}s both` }}>
                    <div style={{ fontFamily: DS.fontDisplay, fontWeight: 700, fontSize: 18, color: DS.slate800, marginBottom: 8 }}>{c.crop}</div>
                    <Tag label={`${c.confidence} match`} color={DS.green600} />
                  </Card>
                ))}
              </div>
            </div>
          )}
        </ResultSection>
      )}

      {/* ── Claude fallback result ── */}
      {result?._source === "claude" && (
        <ResultSection>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <h3 style={{ fontFamily: DS.fontDisplay, fontWeight: 700, fontSize: 20, color: DS.slate800 }}>Recommended Crops</h3>
            <AIBadge />
          </div>
          <div className="responsive-grid-3">
            {result.crops?.map((crop, i) => (
              <Card key={i} style={{ animation: `bounceIn 0.4s ease ${i * 0.1}s both` }}>
                <div style={{ textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 40, marginBottom: 6 }}>{crop.emoji || "🌱"}</div>
                  <div style={{ fontFamily: DS.fontDisplay, fontWeight: 700, fontSize: 20, color: DS.green800 }}>{crop.name}</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <Tag label={`💧 ${crop.waterReq}`} color={DS.blue600} />
                  <Tag label={`📈 ${crop.profitPotential}`} color={DS.green600} />
                  <Tag label={`📅 ${crop.growthDays}d`} color={DS.amber600} />
                </div>
                <InfoRow label="Why?" value={crop.reason} icon="🔍" />
                <InfoRow label="Tips" value={crop.tips} icon="💡" />
              </Card>
            ))}
          </div>
        </ResultSection>
      )}
    </PageShell>
  );
}
