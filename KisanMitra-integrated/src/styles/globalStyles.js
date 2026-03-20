// ══════════════════════════════════════════════
// 🖌️ KisanMitra — Global Styles
// ══════════════════════════════════════════════

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 100%);
    color: #1e293b; min-height: 100vh;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeSlideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse { 0%,100% { box-shadow:0 0 0 0 rgba(239,68,68,0.4); } 50% { box-shadow:0 0 0 8px rgba(239,68,68,0); } }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
  @keyframes bounceIn { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
  input:focus, select:focus, textarea:focus { outline: none; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #86efac; border-radius: 99px; }
  button { font-family: 'DM Sans', system-ui, sans-serif; }
  select option { font-weight: 600; }

  .responsive-grid-3 {
    display: grid; grid-template-columns: 1fr; gap: 16px;
  }
  @media (min-width: 640px) { .responsive-grid-3 { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 900px) { .responsive-grid-3 { grid-template-columns: repeat(3, 1fr); } }

  .responsive-grid-2 {
    display: grid; grid-template-columns: 1fr; gap: 16px;
  }
  @media (min-width: 640px) { .responsive-grid-2 { grid-template-columns: repeat(2, 1fr); } }

  .responsive-grid-4 {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
  }
  @media (min-width: 640px) { .responsive-grid-4 { grid-template-columns: repeat(4, 1fr); } }

  .form-grid {
    display: grid; grid-template-columns: 1fr; gap: 16px;
  }
  @media (min-width: 640px) { .form-grid { grid-template-columns: repeat(2, 1fr); } }
`;
