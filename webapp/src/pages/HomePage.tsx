import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [helpOpen, setHelpOpen] = useState(false);
  const [tab, setTab] = useState(0);

  // Define bots array with translations
  const BOTS = [
    { 
      name: t('home.bots.random.name'),  
      desc: t('home.bots.random.desc')
    },
    { 
      name: t('home.bots.center.name'),  
      desc: t('home.bots.center.desc')
    },
    { 
      name: t('home.bots.edge.name'),    
      desc: t('home.bots.edge.desc')
    },
    { 
      name: t('home.bots.mirror.name'),  
      desc: t('home.bots.mirror.desc')
    },
  ];

  return (
    <div className="home-container">
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 0,
      }} />

      <GameTitle variant="h1">GAME Y</GameTitle>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1 }}>
        <PlayButton onClick={() => navigate('/set')}>
          <PlayArrowIcon fontSize="small" /> {t('home.play')}
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
                {t('home.howToPlay')}
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
              <Tab label={t('home.rules')} />
              <Tab label={t('home.opponents')} />
            </Tabs>

            {/* ── Rules ── */}
            {tab === 0 && (
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {t('home.goal')}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, mb: 2, color: '#fff' }}>
                  {t('home.goalDescription')}
                </Typography>


                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {t('home.keyRules')}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, mb: 1, color: '#fff' }}>
                  <strong>{t('home.cornerRule')}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#fff' }}>
                  {t('home.noDrawRule')}
                </Typography>

                <Box sx={{
                  bgcolor: 'rgba(255,255,255,0.08)',
                  borderLeft: '3px solid #378ADD',
                  borderRadius: '0 8px 8px 0',
                  p: 1.5,
                }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    <strong style={{ color: '#fff' }}>{t('home.tipLabel')}</strong> {t('home.tipDescription')}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* ── Opponents ── */}
            {tab === 1 && (
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {t('home.chooseOpponent')}
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
                  {t('home.difficulties.easy')}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  {[t('home.difficulties.easy'), t('home.difficulties.medium'), t('home.difficulties.hard')].map(d => (
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