
import { useSession } from '../SessionContext'
import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import '../components/LandingPage.css'
import backgroundVideo from '../assets/background.mp4'

export default function LandingPage() {
  const { isLoggedIn, username } = useSession()
  const navigate = useNavigate()

  return (
    <div className="home-container">
      <video autoPlay loop muted playsInline className="background-video">
        <source src={backgroundVideo} type="video/mp4" />
      </video>

      <div className="main-content">
        <h1 className="title">
          Welcome to <span>GAMEY</span>
        </h1>

        {!isLoggedIn ? (
          <div className="button-group">
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate('/register')}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Create Account
            </Button>
          </div>
        ) : (
          <div className="button-group">
            <h3>
              Welcome back, <span>{username}</span> 🎮
            </h3>

            <Button
              variant="contained"
              onClick={() => navigate('/homepage')}
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}