// ════════════════════════════════════════════════════════
// 💊 FertilizerPage — Attractive Redesign
// ════════════════════════════════════════════════════════
import { useState } from "react";
import { DS } from "../constants/designSystem";
import { useApp } from "../context/AppContext";
import { fetchFertilizer } from "../api/agriBackend";
import { USE_BACKEND } from "../api/config";
import { PageShell } from "../components/layout";
import { Spinner, ErrorCard, AIBadge } from "../components/ui";
import { LocationBanner } from "./shared";

const CROPS = [
  { value:"rice",       emoji:"🌾", hi:"चावल",    en:"Rice"      },
  { value:"wheat",      emoji:"🌿", hi:"गेहूं",    en:"Wheat"     },
  { value:"maize",      emoji:"🌽", hi:"मक्का",    en:"Maize"     },
  { value:"soybean",    emoji:"🫘", hi:"सोयाबीन",  en:"Soybean"   },
  { value:"cotton",     emoji:"☁️", hi:"कपास",     en:"Cotton"    },
  { value:"mustard",    emoji:"🌼", hi:"सरसों",    en:"Mustard"   },
  { value:"chickpea",   emoji:"🟡", hi:"चना",      en:"Chickpea"  },
  { value:"groundnut",  emoji:"🥜", hi:"मूंगफली",  en:"Groundnut" },
  { value:"tomato",     emoji:"🍅", hi:"टमाटर",    en:"Tomato"    },
  { value:"onion",      emoji:"🧅", hi:"प्याज",    en:"Onion"     },
];

const NPK_META = {
  N: { label:"नाइट्रोजन", short:"N", color:"#16a34a", bg:"#dcfce7", border:"#86efac", icon:"🟢", desc:"पत्तों की बढ़त" },
  P: { label:"फास्फोरस",  short:"P", color:"#ea580c", bg:"#ffedd5", border:"#fdba74", icon:"🟠", desc:"जड़ों की मजबूती" },
  K: { label:"पोटाश",     short:"K", color:"#2563eb", bg:"#dbeafe", border:"#93c5fd", icon:"🔵", desc:"फल-फूल की गुणवत्ता" },
};

function SectionTitle({ icon, text, small }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: small ? 10 : 14 }}>
      <span style={{ fontSize: small ? 16 : 20 }}>{icon}</span>
      <span style={{ fontWeight:900, fontSize: small ? 14 : 18, color: DS.green800 }}>{text}</span>
      <div style={{ flex:1, height:2, background:`linear-gradient(90deg,${DS.green200},transparent)`, borderRadius:2, marginLeft:4 }} />
    </div>
  );
}

export function FertilizerPage() {
  const { t, loc, location } = useApp();
  const [crop,    setCrop]    = useState("");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const selectedCrop = CROPS.find(c => c.value === crop);

  const handleSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      if (USE_BACKEND.fertilizer) {
        const data = await fetchFertilizer({ crop: crop.toLowerCase(), loc: loc || {} });
        setResult({ _source:"backend", ...data });
      }
    } catch(e) { setError(e.message || t.error); }
    setLoading(false);
  };

  return (
    <PageShell title="खाद सुझाव" icon="🌱">
      <LocationBanner loc={loc} onRequest={location.requestLocation} loading={location.loading} />

      <div style={S.selectorCard}>
        <div style={S.selectorTitle}>🌾 फसल चुनो — कौन सी फसल लगाई है?</div>
        <div style={S.cropGrid}>
          {CROPS.map(c => (
            <button key={c.value} onClick={() => { setCrop(c.value); setResult(null); }}
              style={{ ...S.cropBtn, ...(crop === c.value ? S.cropBtnActive : {}) }}>
              <span style={{ fontSize: 28 }}>{c.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: crop === c.value ? DS.green800 : DS.slate700 }}>{c.hi}</span>
              <span style={{ fontSize: 11, color: DS.slate400, fontWeight: 600 }}>{c.en}</span>
            </button>
          ))}
        </div>

        {selectedCrop && (
          <div style={S.selectedPreview}>
            <span style={{ fontSize: 32 }}>{selectedCrop.emoji}</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 17, color: DS.green800 }}>{selectedCrop.hi} ({selectedCrop.en})</div>
              <div style={{ fontSize: 13, color: DS.slate500, marginTop: 2 }}>✅ चुना गया — अब नीचे button दबाएं</div>
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={!crop || loading}
          style={{ ...S.submitBtn, opacity: (!crop || loading) ? 0.6 : 1, cursor: (!crop || loading) ? "not-allowed" : "pointer" }}>
          {loading ? "⏳ शेड्यूल लोड हो रहा है..." : "🌱 खाद की पूरी जानकारी दिखाओ"}
        </button>
      </div>

      {loading && (
        <div style={S.loadingBox}>
          <Spinner />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: DS.green700 }}>AI खाद शेड्यूल बना रहा है...</div>
            <div style={{ fontSize: 13, color: DS.slate400, marginTop: 4 }}>मिट्टी + मौसम + फसल analysis हो रही है</div>
          </div>
        </div>
      )}

      {error && <ErrorCard msg={error} t={t} />}

      {result?._source === "backend" && (
        <div style={{ animation: "fadeUp .4s ease" }}>
          <div style={S.resultHeader}>
            <div style={{ display:"flex", alignItems:"center", gap: 16 }}>
              <span style={{ fontSize: 52 }}>{selectedCrop?.emoji || "🌾"}</span>
              <div>
                <div style={{ fontSize: 26, fontWeight: 900, color:"#fff" }}>{result.crop} — {selectedCrop?.hi}</div>
                <div style={{ fontSize: 14, opacity: .85, marginTop: 4 }}>मौसम: <strong>{result.season}</strong></div>
              </div>
            </div>
            <AIBadge label="Backend AI" />
          </div>

          <SectionTitle icon="⚗️" text="NPK की जरूरत — प्रति एकड़" />
          <div style={S.npkGrid}>
            {Object.entries(NPK_META).map(([key, meta]) => (
              <div key={key} style={{ ...S.npkCard, background: meta.bg, border: `2.5px solid ${meta.border}` }}>
                <div style={{ fontSize: 36 }}>{meta.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: meta.color, lineHeight: 1 }}>{result.npk?.[key] || "—"}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: meta.color }}>{meta.label} ({meta.short})</div>
                <div style={{ fontSize: 12, color: DS.slate500, marginTop: 4 }}>{meta.desc}</div>
              </div>
            ))}
          </div>

          {result.schedule?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionTitle icon="📅" text="कब और कितनी खाद डालें — पूरा शेड्यूल" />
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>{["🌱 अवस्था (Stage)","🟡 यूरिया","🔵 DAP","🔴 MOP"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.schedule.map((s, i) => (
                      <tr key={i} style={{ background: i%2===0 ? "#fff" : DS.green50 }}>
                        <td style={{ ...S.td, fontWeight:800, color: DS.green800 }}>
                          <span style={{ display:"inline-block", width:22, height:22, background: DS.green600, color:"#fff", borderRadius:"50%", textAlign:"center", lineHeight:"22px", fontSize:12, marginRight:8, fontWeight:900 }}>{i+1}</span>
                          {s.stage}
                        </td>
                        <td style={S.td}>{s.urea && s.urea!=="-" ? <span style={{ display:"inline-block", padding:"4px 12px", background:"#fef3c7", color:"#d97706", borderRadius:20, fontSize:13, fontWeight:800 }}>{s.urea}</span> : <span style={{ color: DS.slate300 }}>—</span>}</td>
                        <td style={S.td}>{s.dap  && s.dap!=="-"  ? <span style={{ display:"inline-block", padding:"4px 12px", background:"#dbeafe", color:"#2563eb", borderRadius:20, fontSize:13, fontWeight:800 }}>{s.dap}</span>  : <span style={{ color: DS.slate300 }}>—</span>}</td>
                        <td style={S.td}>{s.mop  && s.mop!=="-"  ? <span style={{ display:"inline-block", padding:"4px 12px", background:"#fce7f3", color:"#db2777", borderRadius:20, fontSize:13, fontWeight:800 }}>{s.mop}</span>  : <span style={{ color: DS.slate300 }}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
            {result.micro?.length > 0 && (
              <div style={S.infoCard}>
                <SectionTitle icon="🔬" text="सूक्ष्म पोषक तत्व" small />
                {result.micro.map((m,i) => <div key={i} style={{ padding:"8px 12px", background:"#dcfce7", borderRadius:DS.md, marginBottom:6, fontSize:13, fontWeight:700, color:"#16a34a" }}>✅ {m}</div>)}
              </div>
            )}
            {result.organic?.length > 0 && (
              <div style={S.infoCard}>
                <SectionTitle icon="🌿" text="जैविक विकल्प" small />
                {result.organic.map((o,i) => <div key={i} style={{ padding:"8px 12px", background:"#fef9c3", borderRadius:DS.md, marginBottom:6, fontSize:13, fontWeight:700, color:"#ca8a04" }}>🌱 {o}</div>)}
              </div>
            )}
          </div>

          {(result.ai_advice || result.aiPersonalizedAdvice) && (
            <div style={S.aiBox}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <span style={{ fontSize:24 }}>🤖</span>
                <span style={{ fontWeight:900, fontSize:16, color: DS.green800 }}>AI की विशेष सलाह</span>
                <AIBadge />
              </div>
              <div style={{ fontSize:15, lineHeight:1.8, color: DS.slate700, fontWeight:600 }}>
                {result.ai_advice || result.aiPersonalizedAdvice}
              </div>
            </div>
          )}

          {(result.locationNote || result.location_note) && (
            <div style={{ background:"#eff6ff", border:"1.5px solid #93c5fd", borderRadius:DS.lg, padding:"12px 16px", fontSize:13, fontWeight:700, color:"#2563eb", marginBottom:12 }}>
              📍 {result.locationNote || result.location_note}
            </div>
          )}

          {result.caution && (
            <div style={{ background:"#fffbeb", border:`1.5px solid ${DS.amber400}`, borderRadius:DS.lg, padding:"14px 18px", fontSize:14, fontWeight:700, color: DS.amber600, marginBottom:16 }}>
              <strong>⚠️ ध्यान दें:</strong> {result.caution}
            </div>
          )}

          <div style={{ fontSize:12, color: DS.slate400, fontWeight:600, padding:"12px 0", borderTop:`1px solid ${DS.slate100}` }}>
            ⚠️ {result.disclaimer}
          </div>
        </div>
      )}

      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }`}</style>
    </PageShell>
  );
}

const S = {
  selectorCard: { background:"#fff", borderRadius: DS["2xl"], padding:"28px 24px", boxShadow: DS.shadowLg, border:`2px solid ${DS.green200}`, marginBottom:24 },
  selectorTitle: { fontSize:18, fontWeight:900, color: DS.green800, marginBottom:20 },
  cropGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))", gap:10, marginBottom:20 },
  cropBtn: { display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"14px 8px", border:`2px solid ${DS.slate200}`, borderRadius: DS.lg, background: DS.slate50, cursor:"pointer", transition:"all .2s" },
  cropBtnActive: { border:`2px solid ${DS.green400}`, background: DS.green50, boxShadow: DS.shadowGreen, transform:"translateY(-2px)" },
  selectedPreview: { display:"flex", alignItems:"center", gap:14, padding:"14px 18px", background: DS.green50, border:`2px solid ${DS.green300}`, borderRadius: DS.lg, marginBottom:20 },
  submitBtn: { width:"100%", padding:"16px", background: DS.gradientGreen, color:"#fff", border:"none", borderRadius: DS.lg, fontSize:17, fontWeight:900, boxShadow: DS.shadowGreen, transition:"all .2s" },
  loadingBox: { display:"flex", alignItems:"center", gap:20, padding:"28px 24px", background:"#fff", borderRadius: DS.xl, boxShadow: DS.shadowMd, border:`2px solid ${DS.green100}`, marginBottom:20 },
  resultHeader: { background: DS.gradientGreen, borderRadius: DS.xl, padding:"24px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, marginBottom:24, boxShadow: DS.shadowGreenLg },
  npkGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 },
  npkCard: { borderRadius: DS.xl, padding:"22px 16px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:6, boxShadow: DS.shadowSm },
  tableWrap: { background:"#fff", borderRadius: DS.xl, boxShadow: DS.shadowMd, border:`2px solid ${DS.green100}`, overflow:"hidden" },
  table: { width:"100%", borderCollapse:"collapse", fontSize:14 },
  th: { background: DS.gradientGreen, color:"#fff", padding:"12px 16px", textAlign:"left", fontWeight:800, fontSize:13 },
  td: { padding:"12px 16px", borderBottom:`1px solid ${DS.slate100}`, fontWeight:600, color: DS.slate700 },
  infoCard: { background:"#fff", borderRadius: DS.xl, padding:"20px", boxShadow: DS.shadowSm, border:`2px solid ${DS.green100}` },
  aiBox: { background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:`2px solid ${DS.green300}`, borderRadius: DS.xl, padding:"20px 22px", marginBottom:16, boxShadow: DS.shadowSm },
};