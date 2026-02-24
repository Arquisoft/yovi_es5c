import './App.css'
import RegisterForm from './components/RegisterForm'
import NavBar from './components/NavBar'
import PageFooter from './components/PageFooter'
import reactLogo from './assets/react.svg'
import { useState } from 'react'


function App() {

  const [username, setUsername] = useState<string | null>(() => {
    return localStorage.getItem('username')
  })

  const handleRegistered = (u: string) => {
    localStorage.setItem('username', u)
    setUsername(u)
  }

  const handleLogout = async () => {
    const u = username

    localStorage.removeItem('username')
    setUsername(null)

    if (!u) return

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u }),
      })
    } catch {
      // Ignora errores en logout
    }
  }

  return (
  <div className="App">
    <NavBar username={username} onLogout={handleLogout} />

    <div className="main-content">
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h2>Welcome to the Software Arquitecture 2025-2026 course</h2>

      {!username ? (
        <RegisterForm onRegistered={handleRegistered} />
      ) : (
        <p>You are in as <b>{username}</b></p>
      )}
    </div>

    <PageFooter />
  </div>
)
}

export default App