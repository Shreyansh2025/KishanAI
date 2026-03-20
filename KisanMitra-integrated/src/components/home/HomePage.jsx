// ══════════════════════════════════════════════
// 🏠 KisanMitra — Home Page (with Auth-aware cards)
// ══════════════════════════════════════════════
import { useState } from "react";
import { DS } from "../../constants/designSystem";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { TIPS, FEATURE_META } from "../../constants/data";

function FeatureCard({ onClick, icon, color, accent, bgLight, title, desc, delay, locked }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        gap: 12, padding: "24px",
        background: DS.white,
        border: `1.5px solid ${hov ? accent + "60" : DS.slate200}`,
        borderRadius: DS["2xl"],
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? `0 16px 40px ${accent}20, 0 4px 12px ${accent}15` : DS.shadowSm,
        animation: `fadeSlideIn 0.4s ease ${delay}s both`,
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Lock badge for unauthenticated */}
      {locked && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: DS.slate700, color: DS.white,
          borderRadius: DS.full, padding: "2px 8px",
          fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
          display: "flex", alignItems: "center", gap: 4,
          opacity: 0.75,
        }}>🔒 Login</div>
      )}
      <div style={{
        width: 56, height: 56, borderRadius: DS.xl,
        background: hov ? `linear-gradient(135deg, ${color}, ${accent})` : bgLight,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, transition: "all 0.25s", flexShrink: 0,
        boxShadow: hov ? `0 8px 20px ${accent}30` : "none",
        filter: locked && !hov ? "grayscale(0.3)" : "none",
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: DS.fontBody, fontWeight: 800, fontSize: 16,
          color: hov ? accent : DS.slate800,
          marginBottom: 6, transition: "color 0.2s",
        }}>{title}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: DS.slate500, lineHeight: 1.55 }}>{desc}</div>
      </div>
      <div style={{
        fontSize: 13, fontWeight: 700, color: accent,
        display: "flex", alignItems: "center", gap: 4,
        opacity: hov ? 1 : 0, transition: "opacity 0.2s",
      }}>
        {locked ? "Login to use →" : "Explore →"}
      </div>
    </button>
  );
}

export function HomePage() {
  const { t, navigate } = useApp();
  const { isLoggedIn, user } = useAuth();
  const tipIdx = useState(() => Math.floor(Math.random() * TIPS.length))[0];

  return (
    <div style={{ animation: "fadeSlideIn 0.4s ease" }}>
      {/* Hero */}
      <div style={{
        background: DS.gradientHero, borderRadius: DS["2xl"],
        padding: "clamp(24px,5vw,48px) clamp(20px,5vw,40px)",
        marginBottom: 28, color: DS.white,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute",top:-40,right:-40,width:200,height:200,background:"rgba(255,255,255,0.04)",borderRadius:DS.full }} />
        <div style={{ position:"absolute",bottom:-60,left:20,width:160,height:160,background:"rgba(255,255,255,0.03)",borderRadius:DS.full }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "clamp(40px,8vw,64px)", marginBottom: 8 }}>🌾</div>
          <h1 style={{ fontFamily: DS.fontDisplay, fontWeight: 800, fontSize: "clamp(28px,6vw,46px)", lineHeight: 1.15, marginBottom: 10 }}>
            {isLoggedIn ? `Welcome, ${user.name.split(" ")[0]}! 👋` : t.appName}
          </h1>
          <p style={{ fontSize: "clamp(14px,3vw,18px)", opacity: 0.80, fontWeight: 500, maxWidth: 400 }}>
            {t.appTag}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.15)",
              padding: "8px 16px", borderRadius: DS.full,
              backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)",
            }}>
              <span style={{ fontSize: 14 }}>✦</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>AI-Powered · Bilingual · Free</span>
            </div>
            {!isLoggedIn && (
              <button onClick={() => navigate("auth")} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: DS.amber400,
                padding: "8px 18px", borderRadius: DS.full,
                border: "none", cursor: "pointer",
                color: DS.slate800, fontWeight: 800, fontSize: 13,
                letterSpacing: 0.3, fontFamily: DS.fontBody,
                boxShadow: "0 4px 16px rgba(251,191,36,0.4)",
                transition: "all 0.15s",
              }}>
                🔑 Login / Register
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Login prompt banner for guests */}
      {!isLoggedIn && (
        <div style={{
          background: `linear-gradient(135deg, ${DS.green800}18, ${DS.green600}10)`,
          border: `1.5px solid ${DS.green500}40`,
          borderRadius: DS.xl, padding: "14px 20px",
          marginBottom: 20, display: "flex", alignItems: "center", gap: 12,
          flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🌱</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: DS.green700, fontSize: 14, marginBottom: 2 }}>
              Create a free account to access all features
            </div>
            <div style={{ fontSize: 13, color: DS.slate500, fontWeight: 500 }}>
              Crop recommendations, disease detection, market prices and more — all for free.
            </div>
          </div>
          <button onClick={() => navigate("auth")} style={{
            background: DS.green600, color: DS.white,
            border: "none", borderRadius: DS.md,
            padding: "8px 18px", fontWeight: 700, fontSize: 13,
            cursor: "pointer", fontFamily: DS.fontBody, flexShrink: 0,
          }}>
            Get Started →
          </button>
        </div>
      )}

      {/* Tip of the Day */}
      <div style={{
        background: `linear-gradient(135deg, ${DS.amber500}15, ${DS.amber400}10)`,
        border: `1.5px solid ${DS.amber400}40`,
        borderRadius: DS.xl, padding: "16px 20px",
        marginBottom: 28, display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ fontWeight: 800, color: DS.amber600, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
            {t.tipOfDay}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: DS.slate700, lineHeight: 1.6 }}>
            {TIPS[tipIdx]}
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <h2 style={{ fontFamily: DS.fontDisplay, fontWeight: 700, fontSize: 22, color: DS.slate800, marginBottom: 16 }}>
        {t.features}
      </h2>
      <div className="responsive-grid-3">
        {FEATURE_META.map(({ key, icon, color, accent, bgLight }, i) => (
          <FeatureCard
            key={key}
            onClick={() => navigate(key)}
            icon={icon} color={color} accent={accent} bgLight={bgLight}
            title={t[key]} desc={t[`${key}Desc`]}
            delay={i * 0.05}
            locked={!isLoggedIn}
          />
        ))}
      </div>
    </div>
  );
}