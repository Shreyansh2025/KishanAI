// ══════════════════════════════════════════════════════════════
// 🤖 KisanMitra — AI Chatbot  (Backend: POST /api/chat)
//    Supports: text + voice input, multilingual (Bhashini)
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { DS, inputBase } from "../constants/designSystem";
import { useApp } from "../context/AppContext";
import { fetchChat } from "../api/agriBackend";
import { useVoice } from "../hooks/useVoice";
import { PageShell } from "../components/layout";
import { Btn } from "../components/ui";

// ✅ Fixed: full language code map so all languages pass correctly
const LANG_CODES = {
  en: "en", hi: "hi", mr: "mr",
  te: "te", ta: "ta", kn: "kn",
  bn: "bn", gu: "gu", pa: "pa",
};

const QUICK_QUESTIONS = [
  "Best crops for summer in Maharashtra?",
  "How to treat tomato blight?",
  "What is MSP for wheat 2024?",
  "Tips for organic farming",
];

const QUICK_QUESTIONS_HI = [
  "टमाटर में रोग कैसे पहचानें?",
  "सोयाबीन की खेती की सलाह",
  "पीएम-किसान योजना क्या है?",
  "जैविक खाद कैसे बनाएं?",
];

export function ChatbotPage() {
  const { t, lang, loc } = useApp();
  const bhashiniLang = LANG_CODES[lang] || "en";

  const [messages, setMessages] = useState([{
    role: "assistant",
    text: lang === "hi"
      ? "नमस्ते! 🌾 मैं KrishiMitra हूं। फसल, मौसम, रोग, खाद, या किसी भी खेती से जुड़े सवाल पूछें!"
      : "Hello! 🌾 I'm KrishiMitra, your AI Farm Assistant. Ask me anything about crops, diseases, irrigation, fertilizers, market prices, or government schemes!",
    ts: new Date(),
  }]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const audioRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const { active: voiceActive, toggle: voiceToggle } = useVoice(
    (text) => setInput(p => p + text),
    lang === "hi" ? "hi-IN" : "en-IN"
  );

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput(""); setError(null);

    const userMsg = { role: "user", text, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history from last 6 messages for context
      const history = [...messages, userMsg]
        .slice(-6)
        .map(m => ({ role: m.role, content: m.text }));

      const data = await fetchChat({
        text,
        language: bhashiniLang,
        history,
        loc: loc || {},
      });

      const botText   = data.bot_text || "";
      const audioData = data.audio_output?.data || null;

      setMessages(prev => [...prev, { role: "assistant", text: botText, ts: new Date() }]);

      // Play TTS audio if returned
      if (audioData) {
        try {
          const blob = await fetch(`data:audio/wav;base64,${audioData}`).then(r => r.blob());
          const url  = URL.createObjectURL(blob);
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play().catch(() => {});
          }
        } catch { /* TTS is optional — non-fatal */ }
      }
    } catch (e) {
      setError(e.message || t.error);
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const formatTime = (ts) =>
    ts?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const quickQs = lang === "hi" ? QUICK_QUESTIONS_HI : QUICK_QUESTIONS;

  return (
    <PageShell title={t.chatbot} icon="🤖">
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} style={{ display: "none" }} />

      {/* Quick questions */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {quickQs.map((q, i) => (
          <button
            key={i}
            onClick={() => { setInput(q); inputRef.current?.focus(); }}
            style={{
              background: DS.white, border: `1.5px solid ${DS.green200}`,
              borderRadius: DS.full, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, color: DS.green700,
              cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s", flexShrink: 0,
            }}
          >{q}</button>
        ))}
      </div>

      {/* Chat window */}
      <div style={{
        background: DS.white, border: `1.5px solid ${DS.slate200}`,
        borderRadius: DS["2xl"], overflow: "hidden",
        display: "flex", flexDirection: "column",
        height: "min(65vh, 520px)", boxShadow: DS.shadowLg,
      }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12, background: "#fafffe" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
              {m.role === "assistant" && (
                <div style={{ width: 34, height: 34, borderRadius: DS.full, background: DS.gradientGreen, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🌾</div>
              )}
              <div style={{ maxWidth: "78%" }}>
                <div style={{
                  padding: "12px 16px",
                  borderRadius: m.role === "user" ? "20px 20px 6px 20px" : "6px 20px 20px 20px",
                  background: m.role === "user" ? DS.gradientGreen : DS.white,
                  color: m.role === "user" ? DS.white : DS.slate800,
                  fontSize: 14, fontWeight: 600, lineHeight: 1.65,
                  boxShadow: m.role === "user" ? DS.shadowGreen : DS.shadowSm,
                  border: m.role === "assistant" ? `1.5px solid ${DS.green100}` : "none",
                  whiteSpace: "pre-wrap",
                }}>{m.text}</div>
                <div style={{ fontSize: 11, color: DS.slate400, fontWeight: 600, marginTop: 4, textAlign: m.role === "user" ? "right" : "left", paddingLeft: m.role === "assistant" ? 4 : 0 }}>
                  {formatTime(m.ts)}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: DS.full, background: DS.gradientGreen, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🌾</div>
              <div style={{ background: DS.white, border: `1.5px solid ${DS.green100}`, borderRadius: "6px 20px 20px 20px", padding: "12px 18px", boxShadow: DS.shadowSm }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{ width: 8, height: 8, borderRadius: DS.full, background: DS.green400, animation: `pulse 1.2s ease ${d * 0.3}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error bar */}
        {error && (
          <div style={{ padding: "8px 16px", background: "#fff5f5", borderTop: `1px solid ${DS.red400}20` }}>
            <div style={{ fontSize: 13, color: DS.red600, fontWeight: 600 }}>⚠️ {error}</div>
          </div>
        )}

        {/* Input area */}
        <div style={{ padding: "12px 16px", background: DS.white, borderTop: `1.5px solid ${DS.slate100}`, display: "flex", gap: 8, alignItems: "flex-end" }}>
          <button
            onClick={voiceToggle}
            style={{
              padding: "12px", borderRadius: DS.md,
              background: voiceActive ? DS.red500 : DS.green50,
              border: `1.5px solid ${voiceActive ? DS.red400 : DS.green200}`,
              fontSize: 18, cursor: "pointer", flexShrink: 0,
              color: voiceActive ? DS.white : DS.green700,
            }}
          >🎤</button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={voiceActive ? (t.listening || "Listening…") : (t.typeMsg || "Type your question…")}
            rows={1}
            style={{ ...inputBase, flex: 1, resize: "none", maxHeight: 120, overflowY: "auto", lineHeight: 1.5 }}
          />
          <Btn onClick={sendMessage} disabled={!input.trim() || loading} style={{ flexShrink: 0, padding: "12px 18px" }}>
            {t.send || "Send"} →
          </Btn>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: DS.slate400, fontWeight: 600, textAlign: "center" }}>
        🔌 Powered by agri-backend · Bhashini multilingual · HuggingFace Mistral-7B
      </div>
    </PageShell>
  );
}