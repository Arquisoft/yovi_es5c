
import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import '../components/HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()

  return (
      <div className="home-container">
          <Button variant="contained" onClick={() => navigate('/game')} sx={{ marginTop: 2 }}>
            Play
          </Button>
      </div>
  )
}
