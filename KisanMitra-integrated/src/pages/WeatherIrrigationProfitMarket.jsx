import { useState } from "react";
import { DS } from "../constants/designSystem";
import { useApp } from "../context/AppContext";
import {
  fetchWeather,
  fetchIrrigation,
  fetchProfit,
  fetchMarketPrices,
} from "../api/agriBackend";
import { USE_BACKEND } from "../api/config";
import { CROP_DATA } from "../constants/data";
import { PageShell } from "../components/layout";
import {
  Card, FormGroup, Input, Select, Btn, Spinner,
  ErrorCard, AIBadge, Tag, InfoRow, StatCard, ResultSection,
} from "../components/ui";
import { LocationBanner } from "./shared";

// ════════════════════════════════════════════════════════
// 🌦️ WeatherPage — Colorful Redesign
//    7-Day Forecast + Alerts + Bold Colors
// ════════════════════════════════════════════════════════

function weatherEmoji(condition = "") {
  const c = condition.toLowerCase();
  if (c.includes("thunder") || c.includes("storm")) return "⛈️";
  if (c.includes("rain") || c.includes("drizzle"))  return "🌧️";
  if (c.includes("snow"))                           return "❄️";
  if (c.includes("mist") || c.includes("fog"))       return "🌫️";
  if (c.includes("cloud"))                           return "☁️";
  if (c.includes("clear") || c.includes("sunny"))    return "☀️";
  return "⛅";
}

const DAY_COLORS = [
  { bg:"linear-gradient(135deg,#1a7a3c,#27ae60)",  light:"#d5f5e3", border:"#27ae60",  text:"#0d3b1e"  },
  { bg:"linear-gradient(135deg,#8e44ad,#9b59b6)",  light:"#f3e5f5", border:"#9b59b6",  text:"#4a235a"  },
  { bg:"linear-gradient(135deg,#c0392b,#e74c3c)",  light:"#fde8e8", border:"#e74c3c",  text:"#7b241c"  },
  { bg:"linear-gradient(135deg,#d35400,#e67e22)",  light:"#fef0e6", border:"#e67e22",  text:"#784212"  },
  { bg:"linear-gradient(135deg,#1a5276,#2980b9)",  light:"#ebf5fb", border:"#2980b9",  text:"#1a3a5c"  },
  { bg:"linear-gradient(135deg,#117a65,#1abc9c)",  light:"#e8f8f5", border:"#1abc9c",  text:"#0e6655"  },
  { bg:"linear-gradient(135deg,#b7950b,#f1c40f)",  light:"#fef9e7", border:"#f39c12",  text:"#7d6608"  },
];

function alertColor(severity = "") {
  const s = severity.toLowerCase();
  if (s.includes("extreme") || s.includes("critical")) return { bg:"#fde8e8", border:"#e74c3c", text:"#922b21", badge:"#e74c3c", icon:"🚨" };
  if (s.includes("severe")  || s.includes("high"))     return { bg:"#fef0e6", border:"#e67e22", text:"#784212", badge:"#e67e22", icon:"⚠️" };
  if (s.includes("moderate") || s.includes("medium"))  return { bg:"#fef9e7", border:"#f1c40f", text:"#7d6608", badge:"#f1c40f", icon:"⚡" };
  return { bg:"#eaf4fb", border:"#3498db", text:"#1a5276", badge:"#3498db", icon:"ℹ️" };
}

function generateForecast(w) {
  const today = new Date();
  const dayNames = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dayNames.push(i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en",{weekday:"short"}));
  }
  const base  = Math.round(w?.temperature || 28);
  const humid = w?.humidity || 65;
  return dayNames.map((day, i) => {
    const hi   = base + Math.round(Math.sin(i*0.9)*3) + (i%2);
    const lo   = hi - 6 - (i%3);
    const rain = humid > 70 ? Math.round(20 + Math.random()*60) : Math.round(Math.random()*30);
    const conds = rain>50 ? ["Heavy Rain","Thunderstorm","Rainy"][i%3] : rain>25 ? ["Partly Cloudy","Light Rain","Cloudy"][i%3] : ["Sunny","Clear","Partly Sunny"][i%3];
    return { day, hi, lo, rain, condition:conds, emoji:weatherEmoji(conds), color:DAY_COLORS[i] };
  });
}

function generateAlerts(w, ins) {
  const alerts = [];
  if (!w) return alerts;
  if (w.windSpeed > 10)      alerts.push({ title:"💨 High Wind Advisory",    severity:"Moderate", message:`Wind speed ${w.windSpeed} m/s detected. Avoid pesticide spraying. Secure farm equipment and shade nets.`, icon:"💨" });
  if (w.humidity > 85)       alerts.push({ title:"💧 High Humidity Warning",  severity:"High",     message:`Humidity at ${w.humidity}%. High risk of fungal & bacterial diseases. Apply preventive fungicide spray today.`, icon:"💧" });
  if (w.temperature > 40)    alerts.push({ title:"🌡️ Extreme Heat Alert",     severity:"Severe",   message:`Temperature ${w.temperature}°C is dangerous for crops. Irrigate in early morning only. Avoid field work 11am–4pm.`, icon:"🌡️" });
  if (w.temperature < 10)    alerts.push({ title:"❄️ Frost Warning",          severity:"High",     message:`Temperature dropping to ${w.temperature}°C. Cover sensitive crops with cloth. Use smoke/fire frost protection.`, icon:"❄️" });
  if (w.rainLastHr > 5)      alerts.push({ title:"🌧️ Heavy Rainfall Alert",   severity:"Severe",   message:`Rain: ${w.rainLastHr}mm/hr. Ensure proper field drainage. Delay fertilizer and pesticide by 48hrs.`, icon:"🌧️" });
  if (ins?.irrigationAdvised) alerts.push({ title:"🚿 Irrigation Recommended", severity:"Low",     message:"Current conditions suggest your crops need watering. Best time: early morning (5am–8am) to reduce evaporation.", icon:"🚿" });
  if (alerts.length === 0)   alerts.push({ title:"✅ All Clear — Good Day!",  severity:"Low",     message:"No weather warnings for your area. Excellent conditions for field work, spraying, and harvesting today.", icon:"✅" });
  return alerts;
}

export function WeatherPage() {
  const { t, loc, location } = useApp();
  const [result,    setResult]   = useState(null);
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState(null);
  const [activeDay, setActiveDay]= useState(0);

  const fetchData = async () => {
    if (!loc?.lat) { await location.requestLocation(); return; }
    setLoading(true); setError(null); setResult(null); setActiveDay(0);
    try {
      const data = await fetchWeather({ lat:loc.lat, lon:loc.lon, state:loc.state });
      setResult({ _source:"backend", ...data });
    } catch(e) { setError(e.message || t.error); }
    setLoading(false);
  };

  return (
    <PageShell title={t.weather} icon="🌦️">

      {/* ── Location Card ── */}
      <Card>
        {loc?.lat
          ? <div style={{ textAlign:"center", padding:"8px 0" }}>
              <div style={{ fontSize:40, marginBottom:8 }}>📍</div>
              <div style={{ fontWeight:700, color:DS.slate700, fontSize:16 }}>{loc.state || "Your Location"}</div>
              <div style={{ fontSize:13, color:DS.slate400, marginTop:4 }}>{loc.lat.toFixed(4)}°N, {loc.lon.toFixed(4)}°E</div>
            </div>
          : <div style={{ textAlign:"center", color:DS.slate500, padding:"16px 0" }}>
              <div style={{ fontSize:40 }}>🌍</div>
              <div style={{ marginTop:8, fontWeight:600 }}>Allow location access for live weather data</div>
            </div>
        }
        <div style={{ display:"flex", gap:10, marginTop:16, flexWrap:"wrap" }}>
          <Btn onClick={fetchData} disabled={loading} style={{ flex:1, minWidth:140 }}>
            {loading ? `⏳ ${t.loading}` : loc?.lat ? `🌤 ${t.getWeather}` : `📍 ${t.useLocation}`}
          </Btn>
          {loc?.lat && (
            <Btn onClick={location.requestLocation} disabled={location.loading} variant="secondary" style={{ flex:1, minWidth:140 }}>
              {location.loading ? "⏳..." : "🔄 Refresh Location"}
            </Btn>
          )}
        </div>
      </Card>

      {loading && <Spinner />}
      {error   && <ErrorCard msg={error} t={t} />}

      {result?._source === "backend" && result.weather && (() => {
        const w        = result.weather;
        const ins      = result.agriculturalInsights;
        const forecast = generateForecast(w);
        const alerts   = generateAlerts(w, ins);
        const selected = forecast[activeDay];

        return (
          <ResultSection>
            {/* Demo warning */}
            {w.isMock && (
              <div style={{ background:"#fffbeb", border:`1px solid ${DS.amber400}`, borderRadius:DS.lg, padding:"10px 16px", marginBottom:14, fontSize:13, fontWeight:600, color:DS.amber700 }}>
                ⚠️ Demo weather — set OPENWEATHER_API_KEY in backend .env for live data
              </div>
            )}

            {/* ══════════════════════════════════════
                🌡️ MAIN HERO CARD
            ══════════════════════════════════════ */}
            <div style={{ background:"linear-gradient(135deg,#0d2137,#1a3a5c,#1a5276)", borderRadius:DS["2xl"], padding:"28px 24px", color:"#fff", marginBottom:20, position:"relative", overflow:"hidden", boxShadow:"0 8px 32px rgba(26,82,118,.45)" }}>
              <div style={{ position:"absolute", top:-30, right:-30, width:150, height:150, background:"rgba(255,255,255,.04)", borderRadius:"50%" }} />
              <div style={{ position:"absolute", bottom:-40, left:10, width:100, height:100, background:"rgba(255,255,255,.03)", borderRadius:"50%" }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16, position:"relative" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, opacity:.75, marginBottom:4 }}>📍 {w.city}, {w.country}</div>
                  <div style={{ fontSize:"clamp(56px,12vw,80px)", fontWeight:900, lineHeight:1, fontFamily:DS.fontDisplay }}>{Math.round(w.temperature)}°</div>
                  <div style={{ fontSize:18, fontWeight:600, opacity:.9, marginTop:6 }}>{weatherEmoji(w.condition)} {w.condition}</div>
                  <div style={{ fontSize:13, opacity:.65, marginTop:4 }}>{w.description} · Feels like {Math.round(w.feelsLike)}°C</div>
                  <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
                    <span style={{ background:"rgba(255,255,255,.15)", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>🌅 {new Date(w.sunrise).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                    <span style={{ background:"rgba(255,255,255,.15)", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>🌇 {new Date(w.sunset).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                    <span style={{ background:"rgba(255,255,255,.15)", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>☁️ {w.cloudiness}%</span>
                  </div>
                </div>
                <div style={{ fontSize:"clamp(60px,12vw,90px)", filter:"drop-shadow(0 4px 12px rgba(0,0,0,.3))" }}>{weatherEmoji(w.condition)}</div>
              </div>
            </div>

            {/* ══════════════════════════════════════
                📊 COLORFUL STAT CARDS
            ══════════════════════════════════════ */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
              {[
                { icon:"💧", label:"Humidity",    value:`${w.humidity}%`,        bg:"linear-gradient(135deg,#1a5276,#2980b9)", shadow:"rgba(41,128,185,.35)"  },
                { icon:"🌧️", label:"Rain/hr",     value:`${w.rainLastHr}mm`,     bg:"linear-gradient(135deg,#0e6655,#1abc9c)", shadow:"rgba(26,188,156,.35)"  },
                { icon:"💨", label:"Wind Speed",  value:`${w.windSpeed}m/s`,     bg:"linear-gradient(135deg,#4a235a,#9b59b6)", shadow:"rgba(155,89,182,.35)"  },
                { icon:"🌡️", label:"Pressure",    value:`${w.pressure}hPa`,      bg:"linear-gradient(135deg,#784212,#e67e22)", shadow:"rgba(230,126,34,.35)"  },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg, borderRadius:DS.xl, padding:"16px 12px", textAlign:"center", boxShadow:`0 4px 16px ${s.shadow}`, color:"#fff" }}>
                  <div style={{ fontSize:28 }}>{s.icon}</div>
                  <div style={{ fontSize:20, fontWeight:900, marginTop:4, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:11, opacity:.8, fontWeight:700, marginTop:4, textTransform:"uppercase", letterSpacing:.5 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* ══════════════════════════════════════
                🚨 WEATHER ALERTS & WARNINGS
            ══════════════════════════════════════ */}
            <div style={{ marginBottom:24 }}>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <div style={{ width:40, height:40, background:"linear-gradient(135deg,#7b241c,#e74c3c)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 4px 12px rgba(231,76,60,.4)" }}>🚨</div>
                <span style={{ fontWeight:900, fontSize:20, color:DS.slate800 }}>Weather Alerts & Warnings</span>
                <span style={{
                  background: alerts.some(a => !a.severity.includes("Low")) ? "#fde8e8" : "#d5f5e3",
                  color:      alerts.some(a => !a.severity.includes("Low")) ? "#922b21"  : "#1a7a3c",
                  borderRadius:20, padding:"3px 14px", fontSize:12, fontWeight:800,
                }}>
                  {alerts.filter(a => a.title !== "✅ All Clear — Good Day!").length} Active
                </span>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {alerts.map((alert, i) => {
                  const col = alertColor(alert.severity);
                  return (
                    <div key={i} style={{ background:col.bg, border:`2.5px solid ${col.border}`, borderRadius:DS.xl, padding:"18px 20px", display:"flex", gap:14, alignItems:"flex-start", boxShadow:`0 3px 16px ${col.border}25`, animation:`fadeUp .3s ease ${i*.08}s both` }}>
                      {/* Icon badge */}
                      <div style={{ width:52, height:52, borderRadius:14, background:col.badge, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0, boxShadow:`0 4px 14px ${col.badge}55` }}>
                        {alert.icon}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                          <span style={{ fontWeight:900, fontSize:15, color:col.text }}>{alert.title}</span>
                          <span style={{ background:col.badge, color:"#fff", borderRadius:20, padding:"2px 12px", fontSize:11, fontWeight:800 }}>
                            {alert.severity}
                          </span>
                        </div>
                        <div style={{ fontSize:14, fontWeight:600, color:DS.slate700, lineHeight:1.7 }}>{alert.message}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══════════════════════════════════════
                📅 7-DAY FORECAST
            ══════════════════════════════════════ */}
            <div style={{ marginBottom:24 }}>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <div style={{ width:40, height:40, background:"linear-gradient(135deg,#4a235a,#9b59b6)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 4px 12px rgba(155,89,182,.4)" }}>📅</div>
                <span style={{ fontWeight:900, fontSize:20, color:DS.slate800 }}>7-Day Forecast</span>
              </div>

              {/* Selected day BIG detail card */}
              <div style={{ background:selected.color.bg, borderRadius:DS["2xl"], padding:"24px 28px", color:"#fff", marginBottom:14, boxShadow:"0 8px 28px rgba(0,0,0,.22)", animation:"fadeUp .3s ease", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:-20, right:-20, width:120, height:120, background:"rgba(255,255,255,.07)", borderRadius:"50%" }} />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, opacity:.8, marginBottom:4 }}>{selected.day}</div>
                    <div style={{ fontSize:56, marginTop:4 }}>{selected.emoji}</div>
                    <div style={{ fontSize:20, fontWeight:800, marginTop:8 }}>{selected.condition}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:60, fontWeight:900, lineHeight:1 }}>{selected.hi}°C</div>
                    <div style={{ fontSize:16, opacity:.75, marginTop:4 }}>Low: {selected.lo}°C</div>
                    <div style={{ marginTop:12, background:"rgba(255,255,255,.22)", borderRadius:20, padding:"8px 16px", fontSize:14, fontWeight:800 }}>
                      🌧️ Rain: {selected.rain}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 7 mini day cards — each unique color */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:8 }}>
                {forecast.map((day, i) => (
                  <div key={i} onClick={() => setActiveDay(i)} style={{
                    background:  activeDay===i ? day.color.light : "#fff",
                    border:     `2.5px solid ${activeDay===i ? day.color.border : DS.slate100}`,
                    borderRadius: DS.lg, padding:"10px 4px",
                    textAlign:"center", cursor:"pointer", transition:"all .15s",
                    boxShadow: activeDay===i ? `0 6px 16px ${day.color.border}44` : "none",
                    transform:  activeDay===i ? "translateY(-3px)" : "none",
                  }}>
                    <div style={{ fontSize:10, fontWeight:800, color: activeDay===i ? day.color.text : DS.slate400, marginBottom:4 }}>{day.day.slice(0,3).toUpperCase()}</div>
                    <div style={{ fontSize:22 }}>{day.emoji}</div>
                    <div style={{ fontSize:15, fontWeight:900, color: activeDay===i ? day.color.text : DS.slate800, marginTop:4 }}>{day.hi}°</div>
                    <div style={{ fontSize:11, color:DS.slate400 }}>{day.lo}°</div>
                    <div style={{ fontSize:10, fontWeight:800, marginTop:4, color: day.rain>50 ? "#2563eb" : day.rain>25 ? "#0891b2" : DS.slate300 }}>
                      {day.rain}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ══════════════════════════════════════
                🌾 AGRICULTURAL INSIGHTS
            ══════════════════════════════════════ */}
            {ins && (
              <div style={{ background:"linear-gradient(135deg,#d5f5e3,#a9dfbf)", border:`2px solid #27ae60`, borderRadius:DS.xl, padding:"22px 24px" }}>
                <div style={{ fontWeight:900, color:"#1a7a3c", fontSize:18, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:24 }}>🌾</span> Agricultural Insights
                </div>
                {/* Status badges */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                  <span style={{ padding:"8px 16px", borderRadius:20, fontSize:13, fontWeight:800, background: ins.sprayingOk ? "#1a7a3c" : "#e74c3c", color:"#fff", boxShadow:`0 3px 10px ${ins.sprayingOk ? "#1a7a3c" : "#e74c3c"}44` }}>
                    {ins.sprayingOk ? "✅ Spraying OK" : "⛔ No Spraying"}
                  </span>
                  <span style={{ padding:"8px 16px", borderRadius:20, fontSize:13, fontWeight:800, background: ins.irrigationAdvised ? "#2980b9" : "#1a7a3c", color:"#fff", boxShadow:`0 3px 10px ${ins.irrigationAdvised ? "#2980b9" : "#1a7a3c"}44` }}>
                    {ins.irrigationAdvised ? "💧 Irrigate Today" : "✅ No Irrigation"}
                  </span>
                  <span style={{ padding:"8px 16px", borderRadius:20, fontSize:13, fontWeight:800, background: ins.fieldWorkOk ? "#1a7a3c" : "#e67e22", color:"#fff", boxShadow:`0 3px 10px ${ins.fieldWorkOk ? "#1a7a3c" : "#e67e22"}44` }}>
                    {ins.fieldWorkOk ? "✅ Field Work OK" : "⛔ Avoid Field Work"}
                  </span>
                </div>
                {/* Tips */}
                {ins.tips?.map((tip, i) => (
                  <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"10px 0", borderBottom: i < ins.tips.length-1 ? "1px solid #a9dfbf" : "none" }}>
                    <span style={{ flexShrink:0, fontSize:18 }}>💡</span>
                    <span style={{ fontSize:14, fontWeight:600, color:"#1a3a2a", lineHeight:1.65 }}>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }`}</style>
          </ResultSection>
        );
      })()}
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════
// 💧 IrrigationPage — POST /api/irrigation
// ════════════════════════════════════════════════════════
const IRR_CROPS = ["rice","wheat","cotton","tomato","sugarcane","maize","potato","onion","mustard","soybean"];

export function IrrigationPage() {
  const { t, loc } = useApp();
  const [form, setForm] = useState({
    temperature: "", soilMoisture: "", crop: "", humidity: "", windSpeed: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const set      = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isValid  = form.temperature !== "" && form.soilMoisture !== "";

  const handleSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await fetchIrrigation({
        lat:         loc?.lat,
        lon:         loc?.lon,
        state:       loc?.state,
        temperature: form.temperature,
        soilMoisture: form.soilMoisture,
        crop:        form.crop,
        humidity:    form.humidity,
        windSpeed:   form.windSpeed,
      });
      setResult(data);
    } catch (e) { setError(e.message || t.error); }
    setLoading(false);
  };

  return (
    <PageShell title={t.irrigation || "Irrigation Advisor"} icon="💧">
      <Card>
        <div className="form-grid">
          <FormGroup label="🌡️ Temperature (°C) *">
            <Input type="number" value={form.temperature}
              onChange={e => set("temperature", e.target.value)}
              placeholder="e.g. 32" min="0" max="55" />
          </FormGroup>
          <FormGroup label="💧 Soil Moisture (%) *">
            <Input type="number" value={form.soilMoisture}
              onChange={e => set("soilMoisture", e.target.value)}
              placeholder="e.g. 45" min="0" max="100" />
          </FormGroup>
          <FormGroup label="🌾 Crop (optional)">
            <Select value={form.crop} onChange={e => set("crop", e.target.value)}
              options={IRR_CROPS.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
              placeholder="-- Crop Select Karein --" />
          </FormGroup>
          <FormGroup label="🌫️ Humidity % (optional)">
            <Input type="number" value={form.humidity}
              onChange={e => set("humidity", e.target.value)}
              placeholder="e.g. 60" min="0" max="100" />
          </FormGroup>
          <FormGroup label="🌬️ Wind Speed m/s (optional)">
            <Input type="number" value={form.windSpeed}
              onChange={e => set("windSpeed", e.target.value)}
              placeholder="e.g. 3" min="0" />
          </FormGroup>
        </div>
        <div style={{ marginTop: 20 }}>
          <Btn onClick={handleSubmit} disabled={!isValid || loading} size="full">
            {loading ? `⏳ ${t.loading}` : "💧 Get Irrigation Advice"}
          </Btn>
        </div>
      </Card>

      {loading && <Spinner />}
      {error && <ErrorCard msg={error} t={t} />}

      {result && (
        <ResultSection>
          {/* Decision banner */}
          {result.decision && (
            <div style={{
              background: result.decision.urgency === "Critical" || result.decision.urgency === "High"
                ? "linear-gradient(135deg,#7f1d1d,#991b1b)"
                : DS.gradientGreen,
              borderRadius: DS["2xl"], padding: "20px 24px",
              color: DS.white, marginBottom: 16,
            }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{result.decision.action}</div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", opacity: 0.85, fontSize: 14, fontWeight: 600 }}>
                <span>⚡ Urgency: {result.decision.urgency}</span>
                <span>💦 Amount: {result.decision.amount}</span>
                <span>📅 Next: {result.decision.nextIn}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>⏰ {result.decision.bestTime}</div>
            </div>
          )}

          {/* Stats */}
          <div className="responsive-grid-4" style={{ marginBottom: 16 }}>
            <StatCard icon="🌡️" label="Temperature"  value={`${result.inputs?.temperature}°C`} color={DS.amber600} />
            <StatCard icon="💧" label="Soil Moisture" value={result.inputs?.soilMoisture}       color={DS.blue600} />
            <StatCard icon="🌾" label="Crop"          value={result.inputs?.crop || "General"}  color={DS.green600} />
            <StatCard icon="📊" label="ET₀"           value={result.evapotranspiration?.estimated} color={DS.slate600} />
          </div>

          {/* AI Advice */}
          {result.aiAdvice && (
            <Card style={{ background: DS.green50, border: `1.5px solid ${DS.green200}`, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ fontWeight: 800, color: DS.green800, fontSize: 15 }}>🤖 AI Advice</div>
                <Tag label={result.modelUsed} color={DS.green600} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: DS.green800, lineHeight: 1.65 }}>
                {result.aiAdvice}
              </div>
            </Card>
          )}

          {/* Conservation tips */}
          {result.conservationTips?.length > 0 && (
            <Card style={{ background: DS.green50, border: `1.5px solid ${DS.green200}` }}>
              <div style={{ fontWeight: 800, color: DS.green800, fontSize: 15, marginBottom: 12 }}>
                💡 Water Conservation Tips
              </div>
              {result.conservationTips.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", borderBottom: i < result.conservationTips.length - 1 ? `1px solid ${DS.green200}` : "none" }}>
                  <span style={{ flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: DS.green800 }}>{tip}</span>
                </div>
              ))}
            </Card>
          )}
        </ResultSection>
      )}
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════
// 💰 ProfitCalcPage — POST /api/profit
// ════════════════════════════════════════════════════════
const PROFIT_CROPS = ["rice","wheat","maize","cotton","soybean","tomato","onion","sugarcane","mustard","groundnut","potato"];

export function ProfitCalcPage() {
  const { t, loc } = useApp();
  const [form, setForm] = useState({ crop: "", investment: "", expectedRevenue: "", area: "1" });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const set     = (k, v) => { setForm(f => ({ ...f, [k]: v })); setResult(null); };
  const isValid = form.investment && form.expectedRevenue;

  const handleSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await fetchProfit({ lat: loc?.lat, lon: loc?.lon, state: loc?.state, ...form });
      setResult(data);
    } catch (e) { setError(e.message || t.error); }
    setLoading(false);
  };

  return (
    <PageShell title={t.profitCalc} icon="💰">
      <Card>
        <div className="form-grid">
          <FormGroup label={t.cropType}>
            <Select value={form.crop} onChange={e => set("crop", e.target.value)}
              options={PROFIT_CROPS.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
              placeholder="Select crop (optional for benchmark)" />
          </FormGroup>
          <FormGroup label="Total Investment (₹)">
            <Input type="number" value={form.investment} onChange={e => set("investment", e.target.value)} placeholder="e.g. 25000" min="0" />
          </FormGroup>
          <FormGroup label="Expected Revenue (₹)">
            <Input type="number" value={form.expectedRevenue} onChange={e => set("expectedRevenue", e.target.value)} placeholder="e.g. 45000" min="0" />
          </FormGroup>
          <FormGroup label="Farm Area (acres)">
            <Input type="number" value={form.area} onChange={e => set("area", e.target.value)} placeholder="e.g. 2" min="0.1" step="0.1" />
          </FormGroup>
        </div>
        <div style={{ marginTop: 24 }}>
          <Btn onClick={handleSubmit} disabled={!isValid || loading} size="full">
            {loading ? `⏳ ${t.loading}` : `💰 ${t.calcProfit}`}
          </Btn>
        </div>
      </Card>

      {loading && <Spinner />}
      {error && <ErrorCard msg={error} t={t} />}

      {result?.summary && (
        <ResultSection>
          {/* Big result banner */}
          <div style={{
            background: result.summary.netProfit >= 0 ? DS.gradientGreen : "linear-gradient(135deg,#7f1d1d,#991b1b)",
            borderRadius: DS["2xl"], padding: "24px", color: DS.white, marginBottom: 16, textAlign: "center",
          }}>
            <div style={{ fontSize: 40 }}>{result.summary.emoji}</div>
            <div style={{ fontFamily: DS.fontDisplay, fontWeight: 800, fontSize: "clamp(36px,8vw,56px)", margin: "8px 0" }}>
              {result.summary.netProfit >= 0 ? "+" : ""}₹{Math.abs(result.summary.netProfit).toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: 16, opacity: 0.85, fontWeight: 600 }}>
              {result.summary.status} {result.summary.status === "PROFIT" ? "🌾" : ""}
            </div>
          </div>

          {/* Financials */}
          {result.financials && (
            <div className="responsive-grid-4" style={{ marginBottom: 16 }}>
              <StatCard icon="💵" label="Revenue"    value={`₹${result.financials.totalRevenue?.toLocaleString("en-IN")}`}    color={DS.green600} />
              <StatCard icon="💸" label="Investment" value={`₹${result.financials.totalInvestment?.toLocaleString("en-IN")}`} color={DS.red500} />
              <StatCard icon="📊" label="Margin"     value={result.financials.grossMargin} color={DS.green600} />
              <StatCard icon="📈" label="ROI"        value={result.financials.roi}         color={DS.green600} />
            </div>
          )}

          {/* Per acre */}
          {result.perAcre && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: DS.slate700, marginBottom: 12 }}>📐 Per Acre Breakdown</div>
              <InfoRow label="Area"            value={result.perAcre.area}                                        icon="🗺️" />
              <InfoRow label="Investment/acre" value={`₹${result.perAcre.investment?.toLocaleString("en-IN")}`}  icon="💸" />
              <InfoRow label="Revenue/acre"    value={`₹${result.perAcre.revenue?.toLocaleString("en-IN")}`}     icon="💵" />
              <InfoRow label="Profit/acre"     value={`₹${result.perAcre.profit?.toLocaleString("en-IN")}`}      icon="✅" />
            </Card>
          )}

          {/* Risk — backend sends riskLevel object */}
          {result.riskLevel && (
            <Card style={{ background: "#fffbeb", border: `1px solid ${DS.amber400}`, marginBottom: 16 }}>
              <div style={{ fontWeight: 800, color: DS.amber600, fontSize: 14, marginBottom: 6 }}>
                ⚠️ Risk Level: {result.riskLevel.level}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: DS.slate700 }}>{result.riskLevel.msg}</div>
            </Card>
          )}

          {/* Benchmark — backend sends benchmark.vsAverage */}
          {result.benchmark && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: DS.slate700, marginBottom: 12 }}>
                📊 vs State Average ({result.benchmark.crop})
              </div>
              <InfoRow label="Avg Investment" value={`₹${result.benchmark.avgInvestment?.toLocaleString("en-IN")}`} icon="💸" />
              <InfoRow label="Avg Revenue"    value={`₹${result.benchmark.avgRevenue?.toLocaleString("en-IN")}`}    icon="💵" />
              <InfoRow label="Avg Profit"     value={`₹${result.benchmark.avgProfit?.toLocaleString("en-IN")}`}     icon="✅" />
              <InfoRow label="Your result"    value={result.benchmark.vsAverage}                                     icon="📈" />
            </Card>
          )}

          {/* AI recommendations — backend sends aiRecommendations (string) or fallbackRecs (array) */}
          {(result.aiRecommendations || result.fallbackRecs?.length > 0) && (
            <Card style={{ background: DS.green50, border: `1.5px solid ${DS.green200}`, marginBottom: 16 }}>
              <div style={{ fontWeight: 800, color: DS.green800, fontSize: 15, marginBottom: 12 }}>💡 Recommendations</div>
              {result.aiRecommendations
                ? <div style={{ fontSize: 14, fontWeight: 600, color: DS.green800, lineHeight: 1.65 }}>{result.aiRecommendations}</div>
                : result.fallbackRecs.map((r, i) => (
                    <div key={i} style={{ fontSize: 14, fontWeight: 600, color: DS.green800, padding: "4px 0" }}>→ {r}</div>
                  ))
              }
            </Card>
          )}

          {/* Schemes — backend sends array of plain strings */}
          {result.schemes?.length > 0 && (
            <Card style={{ background: DS.green50, border: `1.5px solid ${DS.green200}` }}>
              <div style={{ fontWeight: 800, color: DS.green800, fontSize: 15, marginBottom: 12 }}>🏛️ Govt. Schemes</div>
              {result.schemes.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: i < result.schemes.length - 1 ? `1px solid ${DS.green200}` : "none" }}>
                  <span>✅</span>
                  <div style={{ fontWeight: 600, color: DS.green800, fontSize: 14 }}>{s}</div>
                </div>
              ))}
            </Card>
          )}
        </ResultSection>
      )}
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════
// 📈 MarketPricePage — Full Featured Redesign
//    Price Chart + MSP + AI Advice + Nearby Mandis + Compare
// ════════════════════════════════════════════════════════

// MSP Data 2024-25 (Government official rates)
const MSP_DATA = {
  rice:      { msp:2300,  unit:"₹/quintal", season:"Kharif",  declared:"Oct 2024" },
  wheat:     { msp:2275,  unit:"₹/quintal", season:"Rabi",    declared:"Dec 2024" },
  maize:     { msp:2090,  unit:"₹/quintal", season:"Kharif",  declared:"Oct 2024" },
  cotton:    { msp:7121,  unit:"₹/quintal", season:"Kharif",  declared:"Oct 2024" },
  sugarcane: { msp:340,   unit:"₹/quintal", season:"Annual",  declared:"Nov 2024" },
  groundnut: { msp:6783,  unit:"₹/quintal", season:"Kharif",  declared:"Oct 2024" },
  mustard:   { msp:5650,  unit:"₹/quintal", season:"Rabi",    declared:"Dec 2024" },
  soybean:   { msp:4892,  unit:"₹/quintal", season:"Kharif",  declared:"Oct 2024" },
  tomato:    { msp:null,  unit:"₹/quintal", season:"—",       declared:"No MSP"   },
  potato:    { msp:null,  unit:"₹/quintal", season:"—",       declared:"No MSP"   },
  onion:     { msp:null,  unit:"₹/quintal", season:"—",       declared:"No MSP"   },
  chickpea:  { msp:5440,  unit:"₹/quintal", season:"Rabi",    declared:"Dec 2024" },
  turmeric:  { msp:null,  unit:"₹/quintal", season:"—",       declared:"No MSP"   },
  chilli:    { msp:null,  unit:"₹/quintal", season:"—",       declared:"No MSP"   },
  jute:      { msp:5050,  unit:"₹/quintal", season:"Kharif",  declared:"Oct 2024" },
  coconut:   { msp:12100, unit:"₹/1000 nuts",season:"Annual", declared:"Nov 2024" },
};

// Best selling months per crop
const SELL_TIME = {
  rice:      { best:["Nov","Dec","Jan"], avoid:["Sep","Oct"], tip:"Sell after 2 months storage — prices rise 15-20% in Jan" },
  wheat:     { best:["May","Jun","Jul"], avoid:["Mar","Apr"], tip:"Avoid harvest month — wait 6-8 weeks for better rates"    },
  maize:     { best:["Dec","Jan","Feb"], avoid:["Oct","Nov"], tip:"Post-festival demand spikes — hold if possible"           },
  cotton:    { best:["Jan","Feb","Mar"], avoid:["Nov","Dec"], tip:"Jan-Mar sees peak textile demand from mills"              },
  sugarcane: { best:["Jan","Feb"],       avoid:["Jun","Jul"], tip:"Mill rates fixed — sell directly to nearest sugar mill"   },
  groundnut: { best:["Feb","Mar"],       avoid:["Nov","Dec"], tip:"Oil mill demand peaks in Feb — get 10-15% premium"        },
  mustard:   { best:["May","Jun"],       avoid:["Mar","Apr"], tip:"Hold 60 days post-harvest for oil mill premium"           },
  soybean:   { best:["Jan","Feb","Mar"], avoid:["Oct","Nov"], tip:"Processing demand peaks Jan — don't sell immediately"     },
  tomato:    { best:["Dec","Jan"],       avoid:["Jul","Aug"], tip:"Summer demand highest — greenhouses fetch 3x monsoon rate"},
  onion:     { best:["Apr","May"],       avoid:["Nov","Dec"], tip:"Store in cool dry place — Apr prices 40-60% higher"       },
  potato:    { best:["Jun","Jul"],       avoid:["Feb","Mar"], tip:"Cold storage till June gives best returns"                },
  chickpea:  { best:["Jun","Jul"],       avoid:["Mar","Apr"], tip:"Dal mill demand peaks pre-monsoon — good premium"         },
  default:   { best:["Jan","Feb"],       avoid:["Oct","Nov"], tip:"Generally hold 1-2 months after harvest for better price" },
};

// Generate 7-day price history from modal price
function generatePriceHistory(modalPrice, trend) {
  const days = ["7d ago","6d ago","5d ago","4d ago","3d ago","2d ago","Yesterday","Today"];
  let price = modalPrice;
  const dir = trend === "up" ? -1 : trend === "down" ? 1 : 0;
  return days.map((day, i) => {
    const change = (Math.random() * 60 - 30) + (dir * (7-i) * 8);
    price = i === 7 ? modalPrice : Math.max(modalPrice * 0.85, modalPrice - change * (7-i) * 0.15);
    return { day, price: Math.round(i === 7 ? modalPrice : price) };
  }).reverse().slice(0,8);
}

// Mini Bar Chart component
function PriceBarChart({ data, modalPrice, trend }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.price));
  const min = Math.min(...data.map(d => d.price));
  const range = max - min || 1;
  const trendColor = trend === "up" ? "#27ae60" : trend === "down" ? "#e74c3c" : "#f39c12";

  return (
    <div style={{ background:"#fff", borderRadius:16, padding:"20px", border:"2px solid #e8f5e9", marginBottom:20 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:38, height:38, background:"linear-gradient(135deg,#1a5276,#2980b9)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📊</div>
          <span style={{ fontWeight:900, fontSize:18, color:"#1e293b" }}>7-Day Price Chart</span>
        </div>
        <span style={{ fontWeight:900, fontSize:14, color:trendColor, background: trend==="up"?"#d5f5e3":trend==="down"?"#fde8e8":"#fef9e7", padding:"4px 12px", borderRadius:20 }}>
          {trend==="up" ? "↑ Rising" : trend==="down" ? "↓ Falling" : "→ Stable"}
        </span>
      </div>

      {/* Bars */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120, paddingBottom:4 }}>
        {data.map((d, i) => {
          const height = Math.max(12, ((d.price - min) / range) * 100);
          const isToday = i === data.length - 1;
          const isHigh  = d.price === max;
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              {/* Price label on top */}
              {(isToday || isHigh) && (
                <div style={{ fontSize:9, fontWeight:800, color: isToday ? trendColor : "#f39c12", whiteSpace:"nowrap" }}>
                  ₹{d.price.toLocaleString("en-IN")}
                </div>
              )}
              {/* Bar */}
              <div style={{
                width:"100%", height:`${height}%`,
                background: isToday
                  ? `linear-gradient(180deg,${trendColor},${trendColor}88)`
                  : isHigh
                    ? "linear-gradient(180deg,#f39c12,#f39c1288)"
                    : "linear-gradient(180deg,#2980b9,#2980b944)",
                borderRadius:"6px 6px 3px 3px",
                boxShadow: isToday ? `0 4px 12px ${trendColor}44` : "none",
                transition:"height .3s ease",
                minHeight:12,
              }} />
              {/* Day label */}
              <div style={{ fontSize:9, fontWeight:700, color: isToday?"#1e293b":"#94a3b8", textAlign:"center" }}>
                {isToday ? "Today" : d.day.replace(" ago","").replace("esterday","yday")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Min/Max range */}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:12, padding:"8px 12px", background:"#f8fafc", borderRadius:10 }}>
        <span style={{ fontSize:12, fontWeight:800, color:"#e74c3c" }}>📉 Low: ₹{min.toLocaleString("en-IN")}</span>
        <span style={{ fontSize:12, fontWeight:800, color:"#94a3b8" }}>Range: ₹{(max-min).toLocaleString("en-IN")}</span>
        <span style={{ fontSize:12, fontWeight:800, color:"#27ae60" }}>📈 High: ₹{max.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}

const MARKET_CROPS = ["rice","wheat","maize","cotton","sugarcane","groundnut","mustard","soybean","tomato","potato","onion","chickpea","turmeric","chilli","jute","coconut"];

const CROP_EMOJI = { rice:"🌾",wheat:"🌿",maize:"🌽",cotton:"☁️",sugarcane:"🎋",groundnut:"🥜",mustard:"🌼",soybean:"🫘",tomato:"🍅",potato:"🥔",onion:"🧅",chickpea:"🟡",turmeric:"🟠",chilli:"🌶️",jute:"🌱",coconut:"🥥" };

export function MarketPricePage() {
  const { t, loc } = useApp();
  const [crop,         setCrop]        = useState("");
  const [compareCrop, setCompareCrop] = useState("");
  const [result,       setResult]      = useState(null);
  const [cmpResult,    setCmpResult]   = useState(null);
  const [loading,      setLoading]     = useState(false);
  const [cmpLoading,  setCmpLoading]  = useState(false);
  const [error,        setError]       = useState(null);
  const [activeTab,    setActiveTab]   = useState("price"); // price | compare

  const handleGet = async (cropName, setter, loadSetter) => {
    loadSetter(true); setError(null);
    try {
      const data = await fetchMarketPrices({ crop: cropName, state: loc?.state, loc: loc || {} });
      setter({ _source:"backend", ...data });
    } catch(e) { setError(e.message || t.error); }
    loadSetter(false);
  };

  const mspInfo  = MSP_DATA[crop]  || null;
  const sellInfo = SELL_TIME[crop] || SELL_TIME.default;
  const cmpMsp   = MSP_DATA[compareCrop] || null;
  const cmpSell  = SELL_TIME[compareCrop] || SELL_TIME.default;

  // Get modal price from result
  const getModalPrice = (res) => {
    if (!res) return 0;
    return res.prices?.[0]?.modalPrice || res.stats?.average || 0;
  };
  const getTrend = (res) => res?.prices?.[0]?.trend || "stable";

  const modalPrice   = getModalPrice(result);
  const trend        = getTrend(result);
  const priceHistory = modalPrice ? generatePriceHistory(modalPrice, trend) : [];

  // AI sell advice
  const getSellAdvice = (price, msp, tr) => {
    if (!price) return null;
    if (msp?.msp && price < msp.msp * 0.95) return { action:"⛔ WAIT — Don't Sell", color:"#e74c3c", bg:"#fde8e8", border:"#e74c3c", msg:`Current price ₹${price} is BELOW MSP ₹${msp.msp}. Contact nearest APMC or PM-AASHA scheme. Don't sell below MSP!` };
    if (msp?.msp && price >= msp.msp * 1.15) return { action:"✅ SELL NOW — Great Price!", color:"#1a7a3c", bg:"#d5f5e3", border:"#27ae60", msg:`Price is ${Math.round(((price/msp.msp)-1)*100)}% above MSP. Excellent time to sell! Consider selling 60-70% now and hold rest.` };
    if (tr === "up")   return { action:"⏳ HOLD — Price Rising!", color:"#d97706", bg:"#fef3c7", border:"#f59e0b", msg:"Prices are trending upward. Hold for 7-10 more days if you have storage. Expected to rise 5-8% more." };
    if (tr === "down") return { action:"⚠️ SELL SOON — Falling!", color:"#dc2626", bg:"#fef2f2", border:"#f87171", msg:"Prices falling. Sell within 3-5 days to avoid further loss. Check nearest mandi for best rate today." };
    return { action:"✅ GOOD TIME TO SELL", color:"#1a7a3c", bg:"#d5f5e3", border:"#27ae60", msg:"Price is stable and above MSP. Good time to sell. Compare 2-3 nearby mandis before selling." };
  };

  const advice = getSellAdvice(modalPrice, mspInfo, trend);

  // Tab styles
  const tabStyle = (active) => ({
    padding:"10px 20px", borderRadius:10, border:"none",
    fontWeight:800, fontSize:14, cursor:"pointer",
    background: active ? "linear-gradient(135deg,#1a7a3c,#27ae60)" : "#f1f5f9",
    color:      active ? "#fff" : "#64748b",
    boxShadow:  active ? "0 4px 12px rgba(26,122,60,.3)" : "none",
    transition:"all .2s",
  });

  return (
    <PageShell title={t.marketPrice} icon="📈">

      {/* ── TABS ── */}
      <div style={{ display:"flex", gap:8, marginBottom:20, background:"#f8fafc", padding:6, borderRadius:14, width:"fit-content" }}>
        <button style={tabStyle(activeTab==="price")}   onClick={() => setActiveTab("price")}>📊 Price Analysis</button>
        <button style={tabStyle(activeTab==="compare")} onClick={() => setActiveTab("compare")}>🔍 Compare Crops</button>
      </div>

      {/* ══════════════════════════════════════
          TAB 1 — SINGLE CROP ANALYSIS
      ══════════════════════════════════════ */}
      {activeTab === "price" && (
        <>
          {/* Crop Selector */}
          <div style={{ background:"#fff", borderRadius:20, padding:"24px", border:"2px solid #e2f5ea", marginBottom:20, boxShadow:"0 4px 20px rgba(26,122,60,.08)" }}>
            <div style={{ fontWeight:900, fontSize:17, color:"#1a7a3c", marginBottom:16 }}>🌾 Fasal Chuniye — Select Crop</div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))", gap:8, marginBottom:16 }}>
              {MARKET_CROPS.map(c => (
                <button key={c} onClick={() => { setCrop(c); setResult(null); }}
                  style={{
                    padding:"10px 6px", borderRadius:12, border:`2px solid ${crop===c?"#27ae60":"#e2e8f0"}`,
                    background: crop===c ? "#d5f5e3" : "#f8fafc", cursor:"pointer",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                    transform: crop===c ? "translateY(-2px)" : "none",
                    boxShadow: crop===c ? "0 4px 12px rgba(39,174,96,.25)" : "none",
                    transition:"all .15s",
                  }}>
                  <span style={{ fontSize:22 }}>{CROP_EMOJI[c] || "🌿"}</span>
                  <span style={{ fontSize:11, fontWeight:800, color: crop===c?"#0d3b1e":"#475569" }}>
                    {c.charAt(0).toUpperCase()+c.slice(1)}
                  </span>
                </button>
              ))}
            </div>

            {loc?.state && (
              <div style={{ fontSize:13, fontWeight:700, color:"#15803d", background:"#f0fdf4", borderRadius:10, padding:"8px 14px", display:"inline-flex", alignItems:"center", gap:6, marginBottom:12 }}>
                📍 Prices for: <strong>{loc.state}</strong>
              </div>
            )}

            <button onClick={() => handleGet(crop, setResult, setLoading)} disabled={!crop || loading}
              style={{ width:"100%", padding:"15px", background: (!crop||loading)?"#94a3b8":"linear-gradient(135deg,#1a7a3c,#27ae60)", color:"#fff", border:"none", borderRadius:12, fontSize:17, fontWeight:900, cursor:(!crop||loading)?"not-allowed":"pointer", boxShadow:"0 4px 16px rgba(26,122,60,.3)", transition:"all .2s" }}>
              {loading ? "⏳ Loading prices..." : "📊 Get Market Price"}
            </button>
          </div>

          {loading && <Spinner />}
          {error   && <ErrorCard msg={error} t={t} />}

          {result?._source === "backend" && (
            <>
              {/* ── HERO PRICE CARD ── */}
              <div style={{ background:"linear-gradient(135deg,#0d3b1e,#1a7a3c,#27ae60)", borderRadius:20, padding:"28px 24px", color:"#fff", marginBottom:20, boxShadow:"0 8px 32px rgba(26,122,60,.4)", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:-30, right:-30, width:150, height:150, background:"rgba(255,255,255,.05)", borderRadius:"50%" }} />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, opacity:.8, marginBottom:4 }}>
                      {CROP_EMOJI[crop]} {crop.charAt(0).toUpperCase()+crop.slice(1)} — {result.filters?.state || "All India"}
                    </div>
                    <div style={{ fontSize:"clamp(40px,10vw,64px)", fontWeight:900, lineHeight:1 }}>
                      ₹{modalPrice?.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize:14, opacity:.8, marginTop:6 }}>Per Quintal · Modal Price</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:14, opacity:.75, marginBottom:4 }}>{result.totalRecords} mandis</div>
                    <div style={{ fontSize:24, fontWeight:900, background:"rgba(255,255,255,.2)", padding:"8px 18px", borderRadius:12 }}>
                      {trend==="up" ? "↑ Rising" : trend==="down" ? "↓ Falling" : "→ Stable"}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── STATS ROW ── */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                {[
                  { icon:"💰", label:"Avg Price",    value:`₹${result.stats?.average}`,          bg:"linear-gradient(135deg,#1a7a3c,#27ae60)", sh:"rgba(39,174,96,.3)" },
                  { icon:"📈", label:"Rising",       value:result.stats?.trending?.up,            bg:"linear-gradient(135deg,#0e6655,#1abc9c)", sh:"rgba(26,188,156,.3)" },
                  { icon:"📉", label:"Falling",      value:result.stats?.trending?.down,          bg:"linear-gradient(135deg,#7b241c,#e74c3c)", sh:"rgba(231,76,60,.3)"  },
                  { icon:"🏆", label:"Top Crop",     value:result.stats?.highest?.crop || "—",    bg:"linear-gradient(135deg,#784212,#f39c12)", sh:"rgba(243,156,18,.3)" },
                ].map(s => (
                  <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:"16px 12px", textAlign:"center", color:"#fff", boxShadow:`0 4px 14px ${s.sh}` }}>
                    <div style={{ fontSize:26 }}>{s.icon}</div>
                    <div style={{ fontSize:18, fontWeight:900, marginTop:4, lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:11, opacity:.8, fontWeight:700, marginTop:4, textTransform:"uppercase", letterSpacing:.5 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* ── PRICE CHART ── */}
              <PriceBarChart data={priceHistory} modalPrice={modalPrice} trend={trend} />

              {/* ── AI SELL ADVICE ── */}
              {advice && (
                <div style={{ background:advice.bg, border:`3px solid ${advice.border}`, borderRadius:18, padding:"20px 22px", marginBottom:20, boxShadow:`0 4px 20px ${advice.border}22` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                    <div style={{ width:48, height:48, background:advice.border, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:"#fff", boxShadow:`0 4px 12px ${advice.border}44`, flexShrink:0 }}>💡</div>
                    <div style={{ fontWeight:900, fontSize:20, color:advice.color }}>{advice.action}</div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:600, color:"#334155", lineHeight:1.7 }}>{advice.msg}</div>
                </div>
              )}

              {/* ── MSP INFO ── */}
              {mspInfo && (
                <div style={{ background: mspInfo.msp ? "linear-gradient(135deg,#1e3a5f,#2980b9)" : "linear-gradient(135deg,#374151,#6b7280)", borderRadius:18, padding:"20px 24px", color:"#fff", marginBottom:20, boxShadow:"0 6px 20px rgba(41,128,185,.35)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, opacity:.8, marginBottom:4 }}>📦 MSP — Minimum Support Price 2024-25</div>
                      {mspInfo.msp
                        ? <div style={{ fontSize:"clamp(32px,8vw,48px)", fontWeight:900, lineHeight:1 }}>₹{mspInfo.msp.toLocaleString("en-IN")}</div>
                        : <div style={{ fontSize:22, fontWeight:800, opacity:.8 }}>No MSP declared</div>
                      }
                      <div style={{ fontSize:13, opacity:.75, marginTop:4 }}>Season: {mspInfo.season} · {mspInfo.declared}</div>
                    </div>
                    {mspInfo.msp && modalPrice && (
                      <div style={{ textAlign:"center", background:"rgba(255,255,255,.18)", padding:"16px 20px", borderRadius:14 }}>
                        <div style={{ fontSize:11, fontWeight:700, opacity:.8, marginBottom:4 }}>MARKET vs MSP</div>
                        <div style={{ fontSize:26, fontWeight:900, color: modalPrice>=mspInfo.msp ? "#a9dfbf" : "#f1948a" }}>
                          {modalPrice >= mspInfo.msp ? "+" : ""}
                          {Math.round(((modalPrice/mspInfo.msp)-1)*100)}%
                        </div>
                        <div style={{ fontSize:12, opacity:.75 }}>{modalPrice>=mspInfo.msp ? "Above MSP ✅" : "Below MSP ⚠️"}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── BEST SELLING TIME ── */}
              <div style={{ background:"#fff", borderRadius:18, padding:"22px", border:"2px solid #fde68a", marginBottom:20, boxShadow:"0 4px 16px rgba(245,158,11,.15)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <div style={{ width:38, height:38, background:"linear-gradient(135deg,#92400e,#f59e0b)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏆</div>
                  <span style={{ fontWeight:900, fontSize:18, color:"#1e293b" }}>Best Time to Sell</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
                  <div style={{ background:"#d5f5e3", borderRadius:12, padding:"14px", border:"2px solid #27ae60" }}>
                    <div style={{ fontSize:12, fontWeight:800, color:"#0d3b1e", marginBottom:8, textTransform:"uppercase" }}>✅ Best Months</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {sellInfo.best.map(m => (
                        <span key={m} style={{ background:"#1a7a3c", color:"#fff", padding:"4px 12px", borderRadius:20, fontSize:13, fontWeight:800 }}>{m}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ background:"#fde8e8", borderRadius:12, padding:"14px", border:"2px solid #e74c3c" }}>
                    <div style={{ fontSize:12, fontWeight:800, color:"#7b241c", marginBottom:8, textTransform:"uppercase" }}>⛔ Avoid Months</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {sellInfo.avoid.map(m => (
                        <span key={m} style={{ background:"#e74c3c", color:"#fff", padding:"4px 12px", borderRadius:20, fontSize:13, fontWeight:800 }}>{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ background:"#fef3c7", border:"2px solid #f59e0b", borderRadius:12, padding:"12px 16px", fontSize:14, fontWeight:700, color:"#78350f" }}>
                  💡 {sellInfo.tip}
                </div>
              </div>

              {/* ── NEARBY MANDIS TABLE ── */}
              {result.prices?.length > 0 && (
                <div style={{ background:"#fff", borderRadius:18, padding:"22px", border:"2px solid #e2e8f0", marginBottom:20, boxShadow:"0 4px 16px rgba(0,0,0,.06)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                    <div style={{ width:38, height:38, background:"linear-gradient(135deg,#4a235a,#9b59b6)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🗺️</div>
                    <span style={{ fontWeight:900, fontSize:18, color:"#1e293b" }}>Nearby Mandis Comparison</span>
                  </div>

                  {/* Table header */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 90px 80px", gap:8, padding:"10px 14px", background:"linear-gradient(135deg,#0d3b1e,#1a7a3c)", borderRadius:"10px 10px 0 0", color:"#fff", fontSize:12, fontWeight:800, textTransform:"uppercase" }}>
                    <span>Mandi / Market</span>
                    <span style={{ textAlign:"center" }}>Modal ₹</span>
                    <span style={{ textAlign:"center" }}>Min–Max</span>
                    <span style={{ textAlign:"center" }}>Trend</span>
                  </div>

                  {result.prices?.slice(0,12).map((p, i) => (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 80px 90px 80px", gap:8, padding:"12px 14px", background: i%2===0 ? "#fff" : "#f8fafc", borderBottom:"1px solid #f1f5f9", alignItems:"center" }}>
                      <div>
                        <div style={{ fontWeight:800, color:"#1e293b", fontSize:14 }}>{p.market}</div>
                        <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{p.state} · {p.variety}</div>
                      </div>
                      <div style={{ textAlign:"center", fontWeight:900, color:"#1a7a3c", fontSize:16 }}>₹{p.modalPrice?.toLocaleString("en-IN")}</div>
                      <div style={{ textAlign:"center", fontSize:12, color:"#64748b", fontWeight:600 }}>₹{p.minPrice}–{p.maxPrice}</div>
                      <div style={{ textAlign:"center" }}>
                        <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:800,
                          background: p.trend==="up"?"#d5f5e3":p.trend==="down"?"#fde8e8":"#fef9e7",
                          color:      p.trend==="up"?"#0d3b1e":p.trend==="down"?"#7b241c":"#78350f",
                        }}>
                          {p.trend==="up" ? "↑" : p.trend==="down" ? "↓" : "→"} {p.trend}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div style={{ padding:"10px 14px", background:"#f8fafc", borderRadius:"0 0 10px 10px", fontSize:12, color:"#94a3b8", fontWeight:600 }}>
                    ⚠️ {result.tip}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════
          TAB 2 — COMPARE TWO CROPS
      ══════════════════════════════════════ */}
      {activeTab === "compare" && (
        <div style={{ background:"#fff", borderRadius:20, padding:"24px", border:"2px solid #e2e8f0", boxShadow:"0 4px 20px rgba(0,0,0,.06)" }}>
          <div style={{ fontWeight:900, fontSize:18, color:"#1e293b", marginBottom:20 }}>🔍 Do Faslon Ka Bhav Tulna</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
            {/* Crop 1 */}
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:"#1a7a3c", marginBottom:8, textTransform:"uppercase" }}>🅰️ Pehli Fasal</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:10 }}>
                {MARKET_CROPS.slice(0,8).map(c => (
                  <button key={c} onClick={() => setCrop(c)}
                    style={{ padding:"8px 4px", borderRadius:10, border:`2px solid ${crop===c?"#27ae60":"#e2e8f0"}`, background:crop===c?"#d5f5e3":"#f8fafc", cursor:"pointer", fontSize:20, transition:"all .15s" }}>
                    {CROP_EMOJI[c]}
                  </button>
                ))}
              </div>
              <div style={{ fontWeight:700, fontSize:13, color:"#475569", textAlign:"center" }}>{crop ? crop.charAt(0).toUpperCase()+crop.slice(1) : "—"}</div>
            </div>

            {/* Crop 2 */}
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:"#9b59b6", marginBottom:8, textTransform:"uppercase" }}>🅱️ Doosri Fasal</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:10 }}>
                {MARKET_CROPS.slice(8).map(c => (
                  <button key={c} onClick={() => setCompareCrop(c)}
                    style={{ padding:"8px 4px", borderRadius:10, border:`2px solid ${compareCrop===c?"#9b59b6":"#e2e8f0"}`, background:compareCrop===c?"#f3e5f5":"#f8fafc", cursor:"pointer", fontSize:20, transition:"all .15s" }}>
                    {CROP_EMOJI[c]}
                  </button>
                ))}
              </div>
              <div style={{ fontWeight:700, fontSize:13, color:"#475569", textAlign:"center" }}>{compareCrop ? compareCrop.charAt(0).toUpperCase()+compareCrop.slice(1) : "—"}</div>
            </div>
          </div>

          <button
            onClick={async () => {
              if (crop)        handleGet(crop,        setResult,    setLoading);
              if (compareCrop) handleGet(compareCrop, setCmpResult, setCmpLoading);
            }}
            disabled={(!crop && !compareCrop) || loading || cmpLoading}
            style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#1a7a3c,#27ae60)", color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:900, cursor:"pointer", marginBottom:20 }}>
            {(loading||cmpLoading) ? "⏳ Comparing..." : "🔍 Compare Prices"}
          </button>

          {/* Side by side comparison */}
          {(result || cmpResult) && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {[
                { label:"🅰️", cropName:crop,        res:result,    msp:mspInfo, sell:sellInfo, color:"#1a7a3c", light:"#d5f5e3", border:"#27ae60" },
                { label:"🅱️", cropName:compareCrop, res:cmpResult, msp:cmpMsp,  sell:cmpSell,  color:"#9b59b6", light:"#f3e5f5", border:"#9b59b6" },
              ].map((side, si) => {
                const price = getModalPrice(side.res);
                const tr    = getTrend(side.res);
                return (
                  <div key={si} style={{ background:side.light, border:`2.5px solid ${side.border}`, borderRadius:16, padding:"18px", overflow:"hidden" }}>
                    <div style={{ fontWeight:900, fontSize:13, color:side.color, marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
                      {side.label} {CROP_EMOJI[side.cropName]} {side.cropName ? side.cropName.charAt(0).toUpperCase()+side.cropName.slice(1) : "—"}
                    </div>
                    {price ? (
                      <>
                        <div style={{ fontSize:"clamp(28px,6vw,40px)", fontWeight:900, color:side.color, lineHeight:1 }}>₹{price.toLocaleString("en-IN")}</div>
                        <div style={{ fontSize:12, color:"#64748b", fontWeight:700, marginTop:4 }}>Per Quintal</div>
                        <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
                          <span style={{ background:side.color, color:"#fff", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:800 }}>
                            {tr==="up"?"↑ Rising":tr==="down"?"↓ Falling":"→ Stable"}
                          </span>
                          {side.msp?.msp && (
                            <span style={{
                              background: price >= side.msp.msp ? "#0d3b1e" : "#7b241c",
                              color: "#fff",
                              padding: "3px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 800
                            }}>
                              {price >= side.msp.msp ? "Above MSP ✅" : "Below MSP ⚠️"}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>
                        Select a crop to compare.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}