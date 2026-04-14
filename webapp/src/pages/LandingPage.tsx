import { useTranslation } from 'react-i18next'
import { useSession } from '../SessionContext'
import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import '../components/LandingPage.css'

export default function LandingPage() {
  const { isLoggedIn, username } = useSession()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="home-container">
      <video autoPlay loop muted playsInline className="background-video">
        <source src="/background.mp4" type="video/mp4" />
      </video>

      <div className="main-content">
        <h1 className="title">
          {t("landing.welcomeTo")} <span>GAMEY</span>
        </h1>

        {!isLoggedIn ? (
          <div className="button-group">
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
            >
              {t("landing.signIn")}
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate('/register')}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              {t("landing.createAccount")}
            </Button>
          </div>
        ) : (
          <div className="button-group">
            <h3>
              {t("landing.welcomeBack", { username })} 🎮
            </h3>

            <Button
              variant="contained"
              onClick={() => navigate('/homepage')}
            >
              {t("landing.goToDashboard")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}