// src/components/layout/index.jsx
import { useState, useRef, useEffect } from "react";
import { DS } from "../../constants/designSystem";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { Btn } from "../ui";

// ── Language Dropdown ──────────────────────────────────────────
function LangDropdown({ lang, setLang, languages }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = languages.find(l => l.code === lang) || languages[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: "rgba(255,255,255,0.18)",
          border: "1.5px solid rgba(255,255,255,0.3)",
          borderRadius: DS.full, padding: "6px 12px",
          color: DS.white, fontWeight: 800, fontSize: 13,
          cursor: "pointer", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", gap: 6,
          whiteSpace: "nowrap",
        }}
      >
        <span>{current.flag}</span>
        <span>{current.native}</span>
        <span style={{ fontSize: 10, opacity: 0.8 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: DS.white, borderRadius: DS.lg,
          boxShadow: DS.shadowLg, border: `1px solid ${DS.slate200}`,
          zIndex: 999, minWidth: 160, overflow: "hidden",
        }}>
          {languages.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 16px",
                background: lang === l.code ? DS.green50 : "transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                borderLeft: lang === l.code ? `3px solid ${DS.green600}` : "3px solid transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = lang === l.code ? DS.green50 : DS.slate50}
              onMouseLeave={e => e.currentTarget.style.background = lang === l.code ? DS.green50 : "transparent"}
            >
              <span style={{ fontSize: 18 }}>{l.flag}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: lang === l.code ? DS.green700 : DS.slate800 }}>
                  {l.native}
                </div>
                <div style={{ fontSize: 11, color: DS.slate400, fontWeight: 600 }}>{l.name}</div>
              </div>
              {lang === l.code && <span style={{ marginLeft: "auto", color: DS.green600, fontSize: 14 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────
export function Navbar() {
  const { page, navigate, lang, setLang, languages, t } = useApp();
  const { user, logout, isLoggedIn } = useAuth();

  function handleLogout() {
    logout();
    navigate("home");
  }

  return (
    <nav style={{
      background: DS.gradientGreen,
      position: "sticky", top: 0, zIndex: 200,
      boxShadow: DS.shadowGreen,
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "0 16px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12,
      }}>
        {/* Logo */}
        <button onClick={() => navigate("home")} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          <span style={{ fontSize: 30 }}>🌾</span>
          <span style={{
            fontFamily: DS.fontDisplay, fontWeight: 700,
            fontSize: 22, color: DS.white, letterSpacing: -0.3,
          }}>{t.appName}</span>
        </button>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
          {page !== "home" && (
            <Btn onClick={() => navigate("home")} variant="ghost" size="sm"
              style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, flexShrink: 0 }}>
              🏠 {t.home}
            </Btn>
          )}

          {/* Language dropdown — all 9 languages */}
          <LangDropdown lang={lang} setLang={setLang} languages={languages} />

          {/* Auth */}
          {isLoggedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.15)",
                border: "1.5px solid rgba(255,255,255,0.3)",
                borderRadius: DS.full, padding: "5px 12px 5px 6px",
                backdropFilter: "blur(8px)",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: DS.full,
                  background: DS.amber400,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 13, color: DS.slate800, flexShrink: 0,
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{
                  color: DS.white, fontWeight: 700, fontSize: 13,
                  maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {user.name.split(" ")[0]}
                </span>
              </div>
              <button onClick={handleLogout} style={{
                background: "rgba(255,255,255,0.12)",
                border: "1.5px solid rgba(255,255,255,0.25)",
                borderRadius: DS.full, padding: "6px 12px",
                color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 12,
                cursor: "pointer", backdropFilter: "blur(8px)",
                fontFamily: DS.fontBody, flexShrink: 0,
              }}>
                👋 {t.logout || "Logout"}
              </button>
            </div>
          ) : (
            <button onClick={() => navigate("auth")} style={{
              background: DS.amber400, border: "none",
              borderRadius: DS.full, padding: "7px 16px",
              color: DS.slate800, fontWeight: 800, fontSize: 13,
              cursor: "pointer", flexShrink: 0,
              boxShadow: "0 2px 8px rgba(251,191,36,0.4)",
              fontFamily: DS.fontBody,
            }}>
              🔑 {t.login || "Login"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── PageShell ──────────────────────────────────────────────────
export function PageShell({ title, icon, children }) {
  return (
    <div style={{ animation: "fadeSlideIn 0.35s ease" }}>
      <div style={{
        background: DS.gradientGreen,
        borderRadius: DS["2xl"], padding: "24px",
        marginBottom: 24, color: DS.white,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, background: "rgba(255,255,255,0.06)", borderRadius: DS.full }} />
        <div style={{ position: "absolute", bottom: -30, left: 30, width: 80, height: 80, background: "rgba(255,255,255,0.04)", borderRadius: DS.full }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <div style={{
            width: 56, height: 56, borderRadius: DS.xl,
            background: "rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, backdropFilter: "blur(8px)", flexShrink: 0,
          }}>{icon}</div>
          <h1 style={{
            fontFamily: DS.fontDisplay, fontWeight: 700,
            fontSize: "clamp(18px,4vw,24px)", margin: 0, lineHeight: 1.2,
          }}>{title}</h1>
        </div>
      </div>
      {children}
    </div>
  );
}