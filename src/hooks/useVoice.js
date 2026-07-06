// ══════════════════════════════════════════════
// 🎤 KisanMitra — useVoice Custom Hook
// ══════════════════════════════════════════════
import { useState, useRef, useCallback } from "react";

export function useVoice(onResult, langCode = "en-IN") {
  const [active, setActive] = useState(false);
  const recRef = useRef(null);

  const toggle = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input not supported in this browser.");
      return;
    }
    if (active) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = langCode;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart  = () => setActive(true);
    rec.onend    = () => setActive(false);
    rec.onresult = (e) => onResult(e.results[0][0].transcript);
    rec.onerror  = () => setActive(false);
    recRef.current = rec;
    rec.start();
  }, [active, onResult, langCode]);

  return { active, toggle };
}
