
import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import '../components/HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()

  return (
      <div className="home-container">
        <Button
          variant="contained"
          onClick={() => navigate('/game')}
          sx={{
            mt: 3,
            fontSize: '1rem',
            padding: '10px 20px',
            backgroundColor: 'white',
            color: 'black',
            '&:hover': {
              backgroundColor: '#e0e0e0',
            },
          }}
        >
          Play the Game
        </Button>
      </div>
  )
}