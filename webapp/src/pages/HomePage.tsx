import { useState } from 'react';
import { Typography, Box, IconButton, Tabs, Tab, Divider, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import '../components/HomePage.css';

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

const PlayButton = styled('button')({
  backgroundColor: '#fff',
  color: '#000',
  padding: '15px 50px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  borderRadius: '50px',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  zIndex: 1,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#e0e0e0',
    transform: 'scale(1.1)',
  },
});

const HelpBtn = styled('button')({
  width: 42,
  height: 42,
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.6)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: '17px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
  transition: 'background 0.2s',
  '&:hover': { background: 'rgba(255,255,255,0.22)' },
});

const BOTS = [
  { name: 'Random bot',  desc: 'Places pieces at random. Great for learning the board.' },
  { name: 'Center bot',  desc: 'Targets the center of the board to reach all three sides.' },
  { name: 'Edge bot',    desc: 'Prioritizes corners and edges for quick side connections.' },
  { name: 'Mirror bot',  desc: 'Copies your moves using rotational symmetry. Hard to read.' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [tab, setTab] = useState(0);

  return (
    <div className="home-container">
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 0,
      }} />

      <GameTitle variant="h1">GAME Y</GameTitle>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1 }}>
        <PlayButton onClick={() => navigate('/set')}>
          <PlayArrowIcon fontSize="small" /> Play
        </PlayButton>
        <HelpBtn onClick={() => { setHelpOpen(true); setTab(0); }}>
          ?
        </HelpBtn>
      </Box>

      {helpOpen && (
        <Box sx={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Box sx={{
            bgcolor: '#1a2744',
            borderRadius: 3,
            p: '22px 26px',
            width: { xs: '92%', sm: 480 },
            maxHeight: '82vh',
            overflowY: 'auto',
            color: '#fff',
          }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography fontWeight={600} fontSize={17} color="#fff">
                How to play
              </Typography>
              <IconButton size="small" onClick={() => setHelpOpen(false)} sx={{ color: '#fff' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                mb: 2,
                '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', textTransform: 'none' },
                '& .Mui-selected': { color: '#fff' },
                '& .MuiTabs-indicator': { backgroundColor: '#fff' },
              }}
            >
              <Tab label="Rules" />
              <Tab label="Opponents" />
            </Tabs>

            {/* ── Rules ── */}
            {tab === 0 && (
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Goal
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, mb: 2, color: '#fff' }}>
                  Connect the <strong>three sides</strong> of the triangular hexagonal board with an
                  unbroken chain of your pieces. The first player to do so wins.
                </Typography>


                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Key rules
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, mb: 1, color: '#fff' }}>
                  <strong>Corner</strong> cells belong to both sides they touch.
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#fff' }}>
                  The game <strong>cannot end in a draw</strong> — a full board always has exactly one winner.
                </Typography>

                <Box sx={{
                  bgcolor: 'rgba(255,255,255,0.08)',
                  borderLeft: '3px solid #378ADD',
                  borderRadius: '0 8px 8px 0',
                  p: 1.5,
                }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    <strong style={{ color: '#fff' }}>Tip:</strong> controlling the center is powerful,
                    but it makes your strategy predictable. Balance expansion with defense.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* ── Opponents ── */}
            {tab === 1 && (
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Choose your opponent
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  {BOTS.map(bot => (
                    <Box key={bot.name} sx={{
                      border: '0.5px solid rgba(255,255,255,0.15)',
                      borderRadius: 2,
                      p: 1.5,
                    }}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#fff' }}>
                        {bot.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {bot.desc}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.15)' }} />

                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Difficulty
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  {['Easy', 'Medium', 'Hard'].map(d => (
                    <Chip
                      key={d}
                      label={d}
                      size="small"
                      sx={{
                        color: 'rgba(255,255,255,0.8)',
                        border: '0.5px solid rgba(255,255,255,0.25)',
                        bgcolor: 'rgba(255,255,255,0.08)',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </div>
  );
}