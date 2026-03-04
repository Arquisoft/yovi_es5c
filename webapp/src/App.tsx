import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Register from './pages/Register'
import PrivateRoute from './pages/PrivateRoute'
import HomePage from './pages/HomePage'
import NavBar from './components/NavBar'
import PageFooter from './components/PageFooter'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <div className="App">
      <NavBar />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landingPage" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/homepage" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <PageFooter />
    </div>
  )
}

export default App