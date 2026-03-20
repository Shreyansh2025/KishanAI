// ════════════════════════════════════════════════════════
// 🔬 DiseaseDetectPage — POST /api/disease (multipart)
//    Uploads image; backend returns disease + treatment.
// ════════════════════════════════════════════════════════
import { useState, useRef } from "react";
import { DS } from "../constants/designSystem";
import { useApp } from "../context/AppContext";
import { fetchDiseaseDetection } from "../api/agriBackend";
import { USE_BACKEND } from "../api/config";
import { PageShell } from "../components/layout";
import { Card, FormGroup, Btn, Spinner, ErrorCard, AIBadge, Tag, ResultSection } from "../components/ui";

export function DiseaseDetectPage() {
  const { t, loc } = useApp();
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setResult(null); setError(null);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null);
    try {
      if (USE_BACKEND.disease) {
        const data = await fetchDiseaseDetection({ imageFile: file, loc: loc || {} });
        setResult({ _source: "backend", ...data });
      } else {
        // Claude vision fallback
        const b64 = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result.split(",")[1]);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514", max_tokens: 1000,
            system: "Expert plant pathologist. JSON only.",
            messages: [{ role: "user", content: [
              { type: "image", source: { type: "base64", media_type: file.type, data: b64 } },
              { type: "text", text: `Analyze crop image. JSON: {"disease":"","confidence":85,"severity":"None/Low/Medium/High","symptoms":[],"causes":[],"treatment":[],"prevention":[],"urgency":"Low/Medium/High"}` }
            ]}]
          })
        });
        const d = await resp.json();
        const text = d.content.map(c => c.text || "").join("");
        const match = text.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);
        setResult({ _source: "claude", ...JSON.parse(match[0]) });
      }
    } catch (e) { setError(e.message || t.error); }
    setLoading(false);
  };

  const isBackend   = result?._source === "backend";
  const diseaseName = isBackend ? result?.diagnosis?.name : result?.disease;
  const isHealthy   = diseaseName === "Healthy";

  return (
    <PageShell title={t.diseaseDetect} icon="🔬">
      <Card>
        <FormGroup label={t.imgUpload}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${preview ? DS.green400 : DS.slate300}`, borderRadius: DS.xl, padding: "32px 20px", background: preview ? DS.green50 : DS.slate50, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
          >
            {preview
              ? <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: 250, borderRadius: DS.lg, objectFit: "contain" }} />
              : <><div style={{ fontSize: 40, marginBottom: 8 }}>📷</div><div style={{ fontWeight: 700, color: DS.slate600 }}>Click to upload crop photo</div><div style={{ fontSize: 13, color: DS.slate400, marginTop: 4 }}>JPG · PNG · WEBP · max 5 MB</div></>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          {preview && (
            <button onClick={() => { setFile(null); setPreview(null); setResult(null); }}
              style={{ fontSize: 12, color: DS.red500, background: "none", border: "none", cursor: "pointer", fontWeight: 700, marginTop: 6 }}>
              ✕ Remove photo
            </button>
          )}
        </FormGroup>
        <div style={{ marginTop: 20 }}>
          <Btn onClick={handleDetect} disabled={!file || loading} size="full">
            {loading ? `⏳ ${t.loading}` : `🔍 ${t.detect}`}
          </Btn>
        </div>
      </Card>

      {loading && <Spinner />}
      {error && <ErrorCard msg={error} t={t} />}

      {result && (
        <ResultSection>
          <Card style={{ border: `2px solid ${isHealthy ? DS.green400 : DS.red400}`, background: isHealthy ? DS.green50 : "#fff9f9" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 36, marginBottom: 4 }}>{isHealthy ? "✅" : "🦠"}</div>
                <h3 style={{ fontFamily: DS.fontDisplay, fontWeight: 700, fontSize: 22, color: DS.slate800 }}>{diseaseName}</h3>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <AIBadge label={isBackend ? "Backend AI" : "Claude AI"} />
                  <Tag label={`${isBackend ? result.diagnosis?.confidence : result.confidence + "%"} confidence`} color={DS.blue600} />
                  {(isBackend ? result.diagnosis?.severity : result.severity) !== "None" && (
                    <Tag label={`${isBackend ? result.diagnosis?.severity : result.severity} severity`}
                      color={["High","Critical"].includes(isBackend ? result.diagnosis?.severity : result.severity) ? DS.red500 : DS.amber500} />
                  )}
                </div>
              </div>
              {isBackend && result.image && (
                <div style={{ fontSize: 13, color: DS.slate400, fontWeight: 600, textAlign: "right" }}>
                  📁 {result.image.filename}<br />{result.image.size}
                </div>
              )}
            </div>

            {/* Backend layout */}
            {isBackend && result.treatment && (
              <>
                {result.diagnosis?.cause && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: DS.slate600, marginBottom: 14, background: DS.slate100, borderRadius: DS.md, padding: "8px 12px" }}>
                    🧬 Cause: {result.diagnosis.cause}
                  </div>
                )}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, color: DS.slate700, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>💊 Chemical Treatment</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: DS.slate700, lineHeight: 1.6 }}>{result.treatment.chemical}</div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, color: DS.slate700, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>🌿 Organic Option</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: DS.slate700, lineHeight: 1.6 }}>{result.treatment.organic}</div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, color: DS.slate700, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>🛡️ Prevention</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: DS.slate600, lineHeight: 1.6 }}>{result.treatment.prevention}</div>
                </div>
                {result.locationNote && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: DS.blue600, background: "#eff6ff", borderRadius: DS.md, padding: "10px 12px" }}>
                    📍 {result.locationNote}
                  </div>
                )}
              </>
            )}

            {/* Claude layout */}
            {!isBackend && (
              <>
                {result.symptoms?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, color: DS.slate700, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>🔍 Symptoms</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{result.symptoms.map((s, i) => <Tag key={i} label={s} color={DS.red500} />)}</div>
                  </div>
                )}
                {result.treatment?.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: DS.full, background: DS.green600, color: DS.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: DS.slate700 }}>{step}</div>
                  </div>
                ))}
              </>
            )}

            <div style={{ marginTop: 12, fontSize: 12, color: DS.slate400, fontWeight: 600 }}>
              ⚠️ {result.disclaimer || "For severe cases, consult your local Krishi Vigyan Kendra (KVK)."}
            </div>
          </Card>
        </ResultSection>
      )}
    </PageShell>
  );
}
