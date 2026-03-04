import reactLogo from '../assets/react.svg'
import { useSession } from '../SessionContext'
import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import '../components/LandingPage.css'

export default function LandingPage() {
  const { isLoggedIn, username } = useSession()
  const navigate = useNavigate()

  return (
      <div className="home-container">
      <video autoPlay loop muted playsInline className="background-video">
        <source src="/background.mp4" type="video/mp4" />
      </video>

        <div className="main-content">
          <div>
            <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
              <img src="/vite.svg" className="logo" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank" rel="noreferrer">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>

          <h2>Welcome to the Software Architecture 2025-2026 course</h2>
          {!isLoggedIn ? (
                  <Button
                    variant="contained"
                    onClick={() => navigate('/register')}
                    sx={{ marginTop: 2, backgroundColor: '#1976d2' }}
                  > 
                    Go to Register
                  </Button>
                ) : (
                  <p style={{ marginTop: 16, color: 'white' }}>
                    You are in as <b>{username}</b>
                  </p>
            )}
        </div>
    </div>
  )
}