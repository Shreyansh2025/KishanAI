// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { T, LANGUAGES } from "../constants/translations";
import { useLocation } from "../hooks/useLocation";
import { checkBackendHealth } from "../api/agriBackend";

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const [page, setPage]           = useState("home");
  const [lang, setLang]           = useState(() => localStorage.getItem("km_lang") || "en");
  const [backendOk, setBackendOk] = useState(null);

  const t        = T[lang] || T.en;
  const location = useLocation();

  // Persist language choice
  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem("km_lang", code);
  };

  const navigate = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    checkBackendHealth().then(setBackendOk);
  }, []);

  return (
    <AppCtx.Provider value={{
      page, navigate,
      lang, setLang: changeLang,
      languages: LANGUAGES,
      t,
      location,
      loc: location.loc,
      hasLocation: location.hasLocation,
      backendOk,
    }}>
      {children}
    </AppCtx.Provider>
  );
}