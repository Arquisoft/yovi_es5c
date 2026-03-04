import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Register from './pages/Register'
import HomePage from './pages/HomePage'
import NavBar from './components/NavBar'
import PageFooter from './components/PageFooter'
import GameSetup from './pages/GameSetup'
import Login from "./pages/Login"
import GamePage from './pages/GamePage'


function App() {
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
