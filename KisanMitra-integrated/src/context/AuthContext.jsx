// ══════════════════════════════════════════════════════════════
// 🔐 KisanMitra — Auth Context
//    Manages user login state, token storage, register/login/logout
// ══════════════════════════════════════════════════════════════
import { createContext, useContext, useState, useCallback } from "react";

const API = "https://kishanai.onrender.com"

export const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

async function authFetch(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function loadUser() {
  try {
    const raw = localStorage.getItem("km_user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(loadUser);
  const [token, setToken] = useState(() => localStorage.getItem("km_token") || null);

  const persist = useCallback((u, t) => {
    setUser(u);
    setToken(t);
    if (u && t) {
      localStorage.setItem("km_user",  JSON.stringify(u));
      localStorage.setItem("km_token", t);
    } else {
      localStorage.removeItem("km_user");
      localStorage.removeItem("km_token");
    }
  }, []);

  const register = useCallback(async (fields) => {
    const data = await authFetch("/api/auth/register", fields);
    persist(data.user, data.token);
    return data.user;
  }, [persist]);

  const login = useCallback(async (identifier, password) => {
    const data = await authFetch("/api/auth/login", { identifier, password });
    persist(data.user, data.token);
    return data.user;
  }, [persist]);

  const logout = useCallback(() => persist(null, null), [persist]);

  return (
    <AuthCtx.Provider value={{ user, token, register, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthCtx.Provider>
  );
}