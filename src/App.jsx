import { useState } from 'react';
import { AppProvider, useApp } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";  // ← NAYA
import { globalStyles } from "./styles/globalStyles";
import { Navbar } from "./components/layout";
import { HomePage } from "./components/home/HomePage";
import { AuthPage } from "./pages/AuthPage";                    // ← NAYA
import {
  CropRecPage, VegPlannerPage, DiseaseDetectPage,
  FertilizerPage, SatellitePage,
  WeatherPage, IrrigationPage, ProfitCalcPage, MarketPricePage,
} from "./pages/index";
import { ChatbotPage } from "./pages/ChatbotPage";

function Router() {
  const { page } = useApp();
  const { isLoggedIn } = useAuth();                            // ← NAYA

  if (page === "auth") return <AuthPage />;                    // ← NAYA

  const PROTECTED = [                                          // ← NAYA
    "cropRec","vegPlan","diseaseDetect","fertilizer","weather",
    "irrigation","profitCalc","marketPrice","chatbot","satellite",
  ];
  if (!isLoggedIn && PROTECTED.includes(page)) return <AuthPage />; // ← NAYA

  const pages = {
    home:          <HomePage />,
    cropRec:       <CropRecPage />,
    vegPlan:       <VegPlannerPage />,
    diseaseDetect: <DiseaseDetectPage />,
    fertilizer:    <FertilizerPage />,
    weather:       <WeatherPage />,
    irrigation:    <IrrigationPage />,
    profitCalc:    <ProfitCalcPage />,
    marketPrice:   <MarketPricePage />,
    chatbot:       <ChatbotPage />,
    satellite:     <SatellitePage />,
  };
  return pages[page] || pages.home;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <style>{globalStyles}</style>
        <Navbar />
        <main style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "24px 16px 80px",
          minHeight: "calc(100vh - 64px)",
        }}>
          <Router />
        </main>
      </AppProvider>
    </AuthProvider>
  );
}