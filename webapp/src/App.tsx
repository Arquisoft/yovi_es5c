import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import Register from './pages/Register'
import PrivateRoute from './pages/PrivateRoute'
import HomePage from './pages/HomePage'
import NavBar from './components/NavBar'
import PageFooter from './components/PageFooter'
import LandingPage from './pages/LandingPage'

function App() {

  const location = useLocation()
  const isLanding = location.pathname === '/' || location.pathname === '/landingPage'

  return (
    <div className="App">
      {!isLanding && <NavBar />}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landingPage" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/homepage" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isLanding && <PageFooter />}
    </div>
  )
}

export default App