import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./App.css";
import Register from "./pages/Register";
import PrivateRoute from "./pages/PrivateRoute";
import HomePage from "./pages/HomePage";
import NavBar from "./components/NavBar";
import PageFooter from "./components/PageFooter";
import LandingPage from "./pages/LandingPage";
import GameSetup from "./pages/GameSetup";
import Login from "./pages/Login";
import GamePage from "./pages/GamePage";
import { useEffect } from "react";
import { updateThemeColors } from "./utils/themeController";
import "./ui.css";
import GameHistory from "./pages/GameHistory";

function App() {
  const location = useLocation();
  const isLanding =
    location.pathname === "/" || location.pathname === "/landingPage";

  useEffect(() => {
    updateThemeColors({
      accentColor: "#1976d2",
      buttonColor: "#1976d2",
      buttonText: "#ffffff",
      inputBg: "rgba(255, 255, 255, 0.5)",
      inputOutline: "rgba(0, 0, 0, 0.23)",
      textPrimary: "rgba(0, 0, 0, 0.87)",
      textSecondary: "rgba(0, 0, 0, 0.6)",
      cardBg: "rgba(255, 255, 255, 0.65)",
    });
  }, []);

  return (
    <div className="App">
      {!isLanding && <NavBar />}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landingPage" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/homepage"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/set"
          element={
            <PrivateRoute>
              <GameSetup />
            </PrivateRoute>
          }
        />
        <Route
          path="/game"
          element={
            <PrivateRoute>
              <GamePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute>
              <GameHistory />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isLanding && <PageFooter />}
    </div>
  );
}

export default App;
