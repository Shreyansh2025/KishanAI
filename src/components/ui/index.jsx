// ══════════════════════════════════════════════════════════════
// 🧩 KisanMitra — UI Components
//    Spinner, ErrorCard, AIBadge, Card, FormGroup,
//    Input, Select, Textarea, Btn, VoiceBtn,
//    InfoRow, StatCard, Tag, ResultSection
// ══════════════════════════════════════════════════════════════
import { useState } from "react";
import { DS, inputBase } from "../../constants/designSystem";
import { useApp } from "../../context/AppContext";
import { useVoice } from "../../hooks/useVoice";

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 40 }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "32px 0" }}>
      <div style={{
        width: size, height: size,
        border: `${size / 10}px solid ${DS.green100}`,
        borderTop: `${size / 10}px solid ${DS.green600}`,
        borderRadius: DS.full,
        animation: "spin 0.75s linear infinite",
      }} />
    </div>
  );
}

// ── ErrorCard ─────────────────────────────────────────────────
export function ErrorCard({ msg, t }) {
  return (
    <div style={{
      background: "#fff5f5", border: `1.5px solid ${DS.red400}`,
      borderRadius: DS.lg, padding: "16px 20px",
      display: "flex", alignItems: "flex-start", gap: 12, marginTop: 16,
      animation: "fadeSlideIn 0.3s ease",
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
      <div>
        <div style={{ fontWeight: 700, color: DS.red600, marginBottom: 2 }}>Error</div>
        <div style={{ color: DS.red600, fontSize: 14 }}>{msg || t?.error}</div>
      </div>
    </div>
  );
}

// ── AIBadge ───────────────────────────────────────────────────
export function AIBadge({ label }) {
  const { t } = useApp();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: DS.gradientGreen, color: DS.white,
      fontSize: 11, fontWeight: 800, padding: "3px 10px",
      borderRadius: DS.full, letterSpacing: 0.5,
      textTransform: "uppercase",
    }}>✦ {label || t.aiRec}</span>
  );
}

// ── Tag ───────────────────────────────────────────────────────
export function Tag({ label, color }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: color + "15", color,
      fontSize: 12, fontWeight: 700, padding: "3px 10px",
      borderRadius: DS.full, border: `1px solid ${color}30`,
    }}>{label}</span>
  );
}

// ── ResultSection ─────────────────────────────────────────────
export function ResultSection({ children, fadeIn = true }) {
  return (
    <div style={{ marginTop: 24, animation: fadeIn ? "fadeSlideIn 0.4s ease" : "none" }}>
      {children}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, style = {}, hover = true }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: DS.white,
        borderRadius: DS["2xl"],
        padding: "24px",
        boxShadow: hov ? DS.shadowLg : DS.shadowMd,
        border: `1px solid ${hov ? DS.green200 : DS.slate200}`,
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── FormGroup ─────────────────────────────────────────────────
export function FormGroup({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 13, fontWeight: 700, color: DS.slate600,
        textTransform: "uppercase", letterSpacing: 0.5,
      }}>{label}</label>
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────
export function Input({ style = {}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputBase,
        borderColor: focused ? DS.green500 : DS.slate200,
        boxShadow: focused ? `0 0 0 3px ${DS.green100}` : "none",
        ...style,
      }}
      {...props}
    />
  );
}

// ── Select ────────────────────────────────────────────────────
export function Select({ options = [], placeholder = "Select...", style = {}, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value} onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputBase,
        borderColor: focused ? DS.green500 : DS.slate200,
        boxShadow: focused ? `0 0 0 3px ${DS.green100}` : "none",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='%2364748b' d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3e%3c/svg%3e")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        backgroundSize: "14px",
        paddingRight: 36,
        cursor: "pointer",
        ...style,
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o, i) => (
        <option key={i} value={typeof o === "object" ? o.value : o}>
          {typeof o === "object" ? o.label : o}
        </option>
      ))}
    </select>
  );
}

// ── Textarea ──────────────────────────────────────────────────
export function Textarea({ style = {}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputBase,
        resize: "vertical", minHeight: 88,
        borderColor: focused ? DS.green500 : DS.slate200,
        boxShadow: focused ? `0 0 0 3px ${DS.green100}` : "none",
        ...style,
      }}
      {...props}
    />
  );
}

// ── Btn ───────────────────────────────────────────────────────
export function Btn({ children, onClick, disabled, variant = "primary", size = "md", style = {} }) {
  const [hov, setHov] = useState(false);
  const variants = {
    primary: {
      background: disabled ? DS.slate300 : hov ? DS.green700 : DS.gradientGreen,
      color: DS.white,
      boxShadow: disabled ? "none" : hov ? DS.shadowGreenLg : DS.shadowGreen,
    },
    secondary: {
      background: hov ? DS.green50 : DS.white,
      color: DS.green700,
      border: `1.5px solid ${DS.green300}`,
      boxShadow: DS.shadowSm,
    },
    ghost: { background: "transparent", color: DS.slate600 },
    danger: { background: hov ? DS.red600 : DS.red500, color: DS.white },
  };
  const sizes = {
    sm:   { padding: "8px 16px",  fontSize: 13 },
    md:   { padding: "12px 24px", fontSize: 15 },
    lg:   { padding: "16px 32px", fontSize: 16 },
    full: { padding: "16px 24px", fontSize: 16, width: "100%" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: "none", borderRadius: DS.md,
        fontFamily: DS.fontBody, fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        transform: hov && !disabled ? "translateY(-1px)" : "translateY(0)",
        letterSpacing: 0.3,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
    >{children}</button>
  );
}

// ── VoiceBtn ──────────────────────────────────────────────────
export function VoiceBtn({ onResult, lang }) {
  const { t } = useApp();
  const langCode = lang === "hi" ? "hi-IN" : "en-IN";
  const { active, toggle } = useVoice(onResult, langCode);
  return (
    <button
      onClick={toggle}
      title={t.voiceBtn}
      style={{
        padding: "12px 14px", borderRadius: DS.md,
        background: active ? DS.red500 : DS.green50,
        border: `1.5px solid ${active ? DS.red400 : DS.green200}`,
        color: active ? DS.white : DS.green700,
        cursor: "pointer", fontSize: 18, fontWeight: 700,
        flexShrink: 0, minWidth: 50,
        animation: active ? "pulse 1.2s ease infinite" : "none",
        transition: "all 0.2s",
      }}
    >{active ? "🔴" : "🎤"}</button>
  );
}

// ── InfoRow ───────────────────────────────────────────────────
export function InfoRow({ label, value, icon }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 0", borderBottom: `1px solid ${DS.slate100}`,
    }}>
      {icon && <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: DS.slate400, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: DS.slate800 }}>{value}</div>
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────
export function StatCard({ icon, label, value, sub, color = DS.green600 }) {
  return (
    <div style={{
      background: DS.white, border: `1.5px solid ${DS.slate200}`,
      borderRadius: DS.xl, padding: "16px",
      textAlign: "center", boxShadow: DS.shadowSm,
    }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: DS.slate400, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: DS.fontDisplay, marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: DS.slate400, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}
