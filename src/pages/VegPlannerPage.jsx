// ════════════════════════════════════════════════════════
// 🥕 VegPlannerPage — Claude AI only (no backend route)
// ════════════════════════════════════════════════════════
import { useState } from "react";
import { DS } from "../constants/designSystem";
import { useApp } from "../context/AppContext";
import { askClaudeJSON } from "../api/claude";
import { PageShell } from "../components/layout";
import { Card, FormGroup, Select, Btn, Spinner, ErrorCard, AIBadge, Tag, ResultSection } from "../components/ui";

export function VegPlannerPage() {
  const { t } = useApp();
  const [form, setForm] = useState({ season: "", region: "", soil: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isValid = Object.values(form).every(Boolean);

  const handleSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await askClaudeJSON(
        `Vegetable farming expert India. Season: ${form.season}, Region: ${form.region}, Soil: ${form.soil}.
         List 6 suitable vegetables. JSON only:
         {"vegetables":[{"name":"","emoji":"","plantingTime":"","harvestDays":0,"waterNeed":"Low/Medium/High","difficulty":"Easy/Medium/Hard","tip":"","profit":"Low/Medium/High"}]}`,
        "Agriculture expert. Always respond with valid JSON only."
      );
      setResult(data);
    } catch (e) { setError(e.message || t.error); }
    setLoading(false);
  };

  return (
    <PageShell title={t.vegPlan} icon="🥕">
      <Card>
        <div className="form-grid">
          <FormGroup label={t.season}><Select value={form.season} onChange={e => set("season", e.target.value)} options={t.seasons} placeholder={`-- ${t.season} --`} /></FormGroup>
          <FormGroup label={t.region}><Select value={form.region} onChange={e => set("region", e.target.value)} options={t.regions} placeholder={`-- ${t.region} --`} /></FormGroup>
          <FormGroup label={t.soilType}><Select value={form.soil} onChange={e => set("soil", e.target.value)} options={t.soils} placeholder={`-- ${t.soilType} --`} /></FormGroup>
        </div>
        <div style={{ marginTop: 24 }}>
          <Btn onClick={handleSubmit} disabled={!isValid || loading} size="full">
            {loading ? `⏳ ${t.loading}` : "🥬 Plan My Garden"}
          </Btn>
        </div>
      </Card>
      {loading && <Spinner />}
      {error && <ErrorCard msg={error} t={t} />}
      {result && (
        <ResultSection>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <h3 style={{ fontFamily: DS.fontDisplay, fontWeight: 700, fontSize: 20 }}>Recommended Vegetables</h3>
            <AIBadge />
          </div>
          <div className="responsive-grid-3">
            {result.vegetables?.map((veg, i) => (
              <Card key={i} style={{ animation: `bounceIn 0.4s ease ${i * 0.08}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: DS.xl, background: DS.green50, border: `1.5px solid ${DS.green200}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{veg.emoji || "🌿"}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: DS.slate800 }}>{veg.name}</div>
                    <div style={{ fontSize: 12, color: DS.slate400 }}>Harvest: {veg.harvestDays} days</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  <Tag label={`💧 ${veg.waterNeed}`} color={DS.blue600} />
                  <Tag label={`⭐ ${veg.difficulty}`} color={veg.difficulty === "Easy" ? DS.green600 : veg.difficulty === "Medium" ? DS.amber600 : DS.red500} />
                  <Tag label={`💰 ${veg.profit}`} color={DS.green700} />
                </div>
                <div style={{ fontSize: 13, color: DS.slate500, fontWeight: 600, marginBottom: 8 }}>🗓 {veg.plantingTime}</div>
                <div style={{ background: DS.green50, border: `1px solid ${DS.green200}`, borderRadius: DS.md, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: DS.green800, lineHeight: 1.5 }}>💡 {veg.tip}</div>
              </Card>
            ))}
          </div>
        </ResultSection>
      )}
    </PageShell>
  );
}
