import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Register from './pages/Register'
import HomePage from './pages/HomePage'
import NavBar from './components/NavBar'
import PageFooter from './components/PageFooter'
import GameSetup from './pages/GameSetup'
import Login from "./pages/Login"
import GamePage from './pages/GamePage'
import { useEffect } from "react";
import { updateThemeColors } from "./utils/themeController";
import "./ui.css"


function App() {

  useEffect(() => {
    updateThemeColors({
        accentColor: "#1976d2",
        buttonColor: "#1976d2",
        buttonText: "#ffffff",
        inputBg: "rgba(255, 255, 255, 0.5)",
        inputOutline: "rgba(0, 0, 0, 0.23)",
        textPrimary: "rgba(0, 0, 0, 0.87)",
        textSecondary: "rgba(0, 0, 0, 0.6)",
        cardBg: "rgba(255, 255, 255, 0.65)"
      });
  }, []);

  return (
    <div className="App">
      <NavBar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/set" element={<GameSetup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <PageFooter />
    </div>
  )
}

export default App
