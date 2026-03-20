// ══════════════════════════════════════════════════════════════
// 🔐 KisanMitra — Auth Page  (Login + Register)
// ══════════════════════════════════════════════════════════════
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp }  from "../context/AppContext";
import { DS, inputBase } from "../constants/designSystem";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

function Field({ label, type = "text", value, onChange, placeholder, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontWeight: 700, fontSize: 13,
        color: DS.slate600, marginBottom: 6, letterSpacing: 0.3,
      }}>{label}{required && <span style={{ color: DS.red500 }}> *</span>}</label>
      {children || (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...inputBase }}
          onFocus={e  => { e.target.style.borderColor = DS.green600; e.target.style.boxShadow = `0 0 0 3px ${DS.green100}`; }}
          onBlur={e   => { e.target.style.borderColor = DS.slate200;  e.target.style.boxShadow = "none"; }}
        />
      )}
    </div>
  );
}

export function AuthPage() {
  const { register, login } = useAuth();
  const { navigate, t }     = useApp();

  const [mode,   setMode]   = useState("login");  // "login" | "register"
  const [loading, setLoad]  = useState(false);
  const [error,  setError]  = useState("");

  // Login fields
  const [identifier, setId] = useState("");
  const [password,   setPw] = useState("");

  // Register fields
  const [name,     setName]    = useState("");
  const [regId,    setRegId]   = useState("");   // email or phone
  const [regPw,    setRegPw]   = useState("");
  const [confirm,  setConfirm] = useState("");
  const [state,    setState]   = useState("");
  const [idType,   setIdType]  = useState("phone"); // "phone" | "email"
  const [showPw,   setShowPw]  = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!identifier || !password) return setError("Please fill in all fields.");
    setLoad(true);
    try {
      await login(identifier, password);
      navigate("home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoad(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    if (!name || !regId || !regPw) return setError("Please fill required fields.");
    if (regPw !== confirm) return setError("Passwords do not match.");
    if (regPw.length < 6) return setError("Password must be at least 6 characters.");

    const isEmail = idType === "email";
    if (!isEmail && !/^[6-9]\d{9}$/.test(regId.trim()))
      return setError("Enter a valid 10-digit Indian mobile number.");

    const payload = {
      name, password: regPw, state,
      ...(isEmail ? { email: regId } : { phone: regId }),
    };

    setLoad(true);
    try {
      await register(payload);
      navigate("home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoad(false);
    }
  }

  const switchMode = (m) => { setMode(m); setError(""); };

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      {/* Background decoration */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -120, right: -120, width: 400, height: 400,
          background: DS.green100, borderRadius: DS.full, opacity: 0.5 }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300,
          background: DS.green200, borderRadius: DS.full, opacity: 0.3 }} />
      </div>

      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🌾</div>
          <h1 style={{
            fontFamily: DS.fontDisplay, fontSize: 28, fontWeight: 700,
            color: DS.green800, margin: "0 0 4px",
          }}>KisanMitra</h1>
          <p style={{ color: DS.slate500, fontSize: 14, margin: 0 }}>
            Smart Farming, Better Living
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: DS.white, borderRadius: DS["2xl"],
          boxShadow: DS.shadowXl,
          border: `1px solid ${DS.slate100}`,
          overflow: "hidden",
        }}>
          {/* Tab switcher */}
          <div style={{
            display: "flex", background: DS.slate50,
            borderBottom: `1px solid ${DS.slate100}`,
          }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: "14px 0",
                background: mode === m ? DS.white : "transparent",
                border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 14,
                color: mode === m ? DS.green700 : DS.slate400,
                borderBottom: mode === m ? `2px solid ${DS.green600}` : "2px solid transparent",
                transition: "all 0.2s",
                fontFamily: DS.fontBody,
                letterSpacing: 0.3,
              }}>
                {m === "login" ? "🔑 Login" : "✨ Register"}
              </button>
            ))}
          </div>

          <div style={{ padding: "28px 28px 24px" }}>
            {/* Error banner */}
            {error && (
              <div style={{
                background: "#fef2f2", border: `1px solid ${DS.red300}`,
                borderRadius: DS.md, padding: "10px 14px",
                color: DS.red600, fontSize: 14, fontWeight: 600,
                marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
              }}>
                ⚠️ {error}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin}>
                <Field label="Mobile Number or Email" required
                  value={identifier} onChange={setId}
                  placeholder="9876543210 or name@email.com" />

                <Field label="Password" type={showPw ? "text" : "password"} required
                  value={password} onChange={setPw} placeholder="Your password">
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPw(e.target.value)}
                      placeholder="Your password"
                      style={{ ...inputBase, paddingRight: 48 }}
                      onFocus={e  => { e.target.style.borderColor = DS.green600; e.target.style.boxShadow = `0 0 0 3px ${DS.green100}`; }}
                      onBlur={e   => { e.target.style.borderColor = DS.slate200;  e.target.style.boxShadow = "none"; }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", fontSize: 18, color: DS.slate400,
                    }}>{showPw ? "🙈" : "👁️"}</button>
                  </div>
                </Field>

                <button type="submit" disabled={loading} style={{
                  width: "100%", padding: "13px",
                  background: loading ? DS.green300 : DS.gradientGreen,
                  color: DS.white, border: "none", borderRadius: DS.md,
                  fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: DS.fontBody, letterSpacing: 0.3,
                  boxShadow: loading ? "none" : DS.shadowGreen,
                  transition: "all 0.2s", marginTop: 4,
                }}>
                  {loading ? "Logging in..." : "🔑 Login to KisanMitra"}
                </button>

                <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: DS.slate500 }}>
                  Don't have an account?{" "}
                  <button type="button" onClick={() => switchMode("register")} style={{
                    background: "none", border: "none", color: DS.green600,
                    fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: DS.fontBody,
                  }}>Register here →</button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <Field label="Full Name" required value={name} onChange={setName} placeholder="Ramesh Kumar" />

                {/* ID type toggle */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: "block", fontWeight: 700, fontSize: 13,
                    color: DS.slate600, marginBottom: 6, letterSpacing: 0.3,
                  }}>Contact <span style={{ color: DS.red500 }}>*</span></label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    {["phone","email"].map(t => (
                      <button key={t} type="button" onClick={() => { setIdType(t); setRegId(""); }} style={{
                        flex: 1, padding: "7px 0",
                        background: idType === t ? DS.green600 : DS.slate100,
                        color: idType === t ? DS.white : DS.slate600,
                        border: "none", borderRadius: DS.sm,
                        fontWeight: 700, fontSize: 13, cursor: "pointer",
                        fontFamily: DS.fontBody, transition: "all 0.15s",
                      }}>
                        {t === "phone" ? "📱 Phone" : "📧 Email"}
                      </button>
                    ))}
                  </div>
                  <input
                    type={idType === "email" ? "email" : "tel"}
                    value={regId}
                    onChange={e => setRegId(e.target.value)}
                    placeholder={idType === "email" ? "name@example.com" : "10-digit mobile number"}
                    maxLength={idType === "phone" ? 10 : undefined}
                    style={{ ...inputBase }}
                    onFocus={e  => { e.target.style.borderColor = DS.green600; e.target.style.boxShadow = `0 0 0 3px ${DS.green100}`; }}
                    onBlur={e   => { e.target.style.borderColor = DS.slate200;  e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <Field label="Password" type={showPw ? "text" : "password"} required
                  value={regPw} onChange={setRegPw}>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      value={regPw}
                      onChange={e => setRegPw(e.target.value)}
                      placeholder="Min. 6 characters"
                      style={{ ...inputBase, paddingRight: 48 }}
                      onFocus={e  => { e.target.style.borderColor = DS.green600; e.target.style.boxShadow = `0 0 0 3px ${DS.green100}`; }}
                      onBlur={e   => { e.target.style.borderColor = DS.slate200;  e.target.style.boxShadow = "none"; }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", fontSize: 18, color: DS.slate400,
                    }}>{showPw ? "🙈" : "👁️"}</button>
                  </div>
                </Field>

                <Field label="Confirm Password" type="password" required
                  value={confirm} onChange={setConfirm} placeholder="Re-enter password" />

                {/* State (optional) */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{
                    display: "block", fontWeight: 700, fontSize: 13,
                    color: DS.slate600, marginBottom: 6, letterSpacing: 0.3,
                  }}>State <span style={{ color: DS.slate400, fontWeight: 500 }}>(optional)</span></label>
                  <select
                    value={state} onChange={e => setState(e.target.value)}
                    style={{ ...inputBase, color: state ? DS.slate800 : DS.slate400 }}
                    onFocus={e  => { e.target.style.borderColor = DS.green600; e.target.style.boxShadow = `0 0 0 3px ${DS.green100}`; }}
                    onBlur={e   => { e.target.style.borderColor = DS.slate200;  e.target.style.boxShadow = "none"; }}
                  >
                    <option value="">-- Select your state --</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: "100%", padding: "13px",
                  background: loading ? DS.green300 : DS.gradientGreen,
                  color: DS.white, border: "none", borderRadius: DS.md,
                  fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: DS.fontBody, letterSpacing: 0.3,
                  boxShadow: loading ? "none" : DS.shadowGreen,
                  transition: "all 0.2s",
                }}>
                  {loading ? "Creating account..." : "🌱 Create Account"}
                </button>

                <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: DS.slate500 }}>
                  Already registered?{" "}
                  <button type="button" onClick={() => switchMode("login")} style={{
                    background: "none", border: "none", color: DS.green600,
                    fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: DS.fontBody,
                  }}>Login →</button>
                </p>
              </form>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: DS.slate400 }}>
          🔒 Your data is secure and never shared
        </p>
      </div>
    </div>
  );
}