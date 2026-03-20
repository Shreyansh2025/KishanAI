// ══════════════════════════════════════════════
// 🎨 KisanMitra — Design System Tokens (DS)
// ══════════════════════════════════════════════

export const DS = {
  // Colors
  green50: "#f0fdf4",  green100: "#dcfce7", green200: "#bbf7d0",
  green300: "#86efac", green400: "#4ade80", green500: "#22c55e",
  green600: "#16a34a", green700: "#15803d", green800: "#166534",
  green900: "#14532d",
  emerald600: "#059669", emerald700: "#047857",
  amber300: "#fcd34d",
  amber400: "#fbbf24",  amber500: "#f59e0b", amber600: "#d97706",
  orange500: "#f97316",
  blue500: "#3b82f6",   blue600: "#2563eb",
  red300: "#fca5a5",
  red400: "#f87171",    red500: "#ef4444",   red600: "#dc2626",
  slate50: "#f8fafc",   slate100: "#f1f5f9", slate200: "#e2e8f0",
  slate300: "#cbd5e1",  slate400: "#94a3b8", slate500: "#64748b",
  slate600: "#475569",  slate700: "#334155", slate800: "#1e293b",
  slate900: "#0f172a",
  white: "#ffffff",     black: "#000000",

  // Typography
  fontDisplay: "'Playfair Display', Georgia, serif",
  fontBody: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', monospace",

  // Spacing helper
  sp: (n) => `${n * 4}px`,

  // Border radius
  sm: "8px", md: "12px", lg: "16px", xl: "20px", "2xl": "24px", full: "9999px",

  // Shadows
  shadowSm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)",
  shadowLg: "0 10px 30px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)",
  shadowXl: "0 20px 50px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08)",
  shadowGreen: "0 8px 24px rgba(22,163,74,0.25), 0 3px 8px rgba(22,163,74,0.15)",
  shadowGreenLg: "0 16px 48px rgba(22,163,74,0.30), 0 6px 16px rgba(22,163,74,0.20)",

  // Gradients
  gradientGreen: "linear-gradient(135deg, #14532d 0%, #166534 30%, #15803d 65%, #16a34a 100%)",
  gradientEmerald: "linear-gradient(135deg, #064e3b, #065f46, #047857)",
  gradientCard: "linear-gradient(145deg, #ffffff, #f8fffe)",
  gradientHero: "linear-gradient(160deg, #052e16 0%, #14532d 40%, #166534 70%, #15803d 100%)",
};

// ── Shared input base style ──────────────────────────────────
export const inputBase = {
  width: "100%", padding: "12px 16px",
  border: `1.5px solid ${DS.slate200}`,
  borderRadius: DS.md, background: DS.white,
  fontSize: 15, fontWeight: 600, color: DS.slate800,
  fontFamily: DS.fontBody,
  transition: "all 0.2s",
  outline: "none",
  boxSizing: "border-box",
};
