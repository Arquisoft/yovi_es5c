import { Button, Typography, Box } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom'
import '../components/HomePage.css'

const GameTitle = styled(Typography)({
  fontWeight: 900,
  fontSize: 'clamp(3rem, 10vw, 6rem)', 
  letterSpacing: '0.3em',
  color: '#fff', 
  marginBottom: '20px',
  textTransform: 'uppercase',
  textAlign: 'center',
  textShadow: '0px 4px 20px rgba(0,0,0,0.6)', 
  zIndex: 1,
});

const PlayButton = styled(Button)({
  backgroundColor: '#fff',
  color: '#000',
  padding: '15px 50px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  borderRadius: '50px',
  zIndex: 1,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#e0e0e0',
    transform: 'scale(1.1)',
  },
});

export default function HomePage() {
  const navigate = useNavigate()

  return (
      <div className="home-container">

        <Box sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', 
          zIndex: 0
          }} />
        <GameTitle variant="h1">GAME Y</GameTitle>

        <PlayButton 
            variant="contained" 
            onClick={() => navigate('/set')}
            startIcon={<PlayArrowIcon />}
          >
            Play
        </PlayButton>
      </div>
  )
}
