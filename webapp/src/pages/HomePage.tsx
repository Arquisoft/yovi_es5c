import reactLogo from '../assets/react.svg'
import { useSession } from '../SessionContext'
import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const { isLoggedIn, username } = useSession()
  const navigate = useNavigate()

  return (
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

      {!isLoggedIn ? (
        <div style={{display: "flex", alignItems: "center", flexDirection: "column"}}>
          <Button variant="contained" onClick={() => navigate('/register')} sx={{ marginTop: 2 }}>
            Go to Register
          </Button>
          <Button variant="contained" onClick={() => navigate('/login')} sx={{ marginTop: 2 }}>
            Go to Login
          </Button>
        </div>
      ) : (
        <p style={{ marginTop: 16 }}>
          You are in as <b>{username}</b>
        </p>
      )}
    </div>
  )
}