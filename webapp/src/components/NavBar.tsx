import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import HistoryRounded from '@mui/icons-material/HistoryRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import { Avatar, Box, ButtonBase, Divider, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material'
import { useSession } from '../SessionContext'
import { useNavigate } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'

const apiEndpoint = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function NavBar() {
  const { isLoggedIn, username, destroySession } = useSession()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const menuOpen = Boolean(anchorEl)

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const closeMenu = () => {
    setAnchorEl(null)
  }

  const navigateFromMenu = (path: string) => {
    closeMenu()
    navigate(path)
  }

  const handleLogout = async () => {
    const u = username

    closeMenu()
    destroySession()
    navigate('/')

    if (!u) return

    try {
      await fetch(`${apiEndpoint}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u }),
      })
    } catch {
      // Ignoramos errores de red
    }
  }

  const headerControlButtonSx = {
    borderRadius: '999px',
    px: 1.1,
    py: 0.4,
    color: 'rgba(255,255,255,0.92)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.16)',
    },
  }

  return (
    <header
      style={{
        height: 'clamp(52px, 8vh, 72px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid #ddd',
        background: 'rgba(15, 15, 39, 0.75)',
      }}
    >
      <ButtonBase
        onClick={() => navigate('/')}
        sx={headerControlButtonSx}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.05em' }}>GAME Y</Typography>
        </Box>
      </ButtonBase>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'white' }}>
        {isLoggedIn && (
          <>
            <LanguageSwitcher />

            <ButtonBase
              onClick={openMenu}
              sx={headerControlButtonSx}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: '0.8rem',
                    bgcolor: 'rgba(255,255,255,0.14)',
                    color: 'white',
                  }}
                >
                  {username?.slice(0, 1).toUpperCase() || <AccountCircleOutlinedIcon fontSize="small" />}
                </Avatar>
                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{t('nav.profile')}</Typography>
                <ExpandMoreRoundedIcon sx={{ fontSize: '1rem', opacity: 0.8 }} />
              </Box>
            </ButtonBase>

           

            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={closeMenu}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    minWidth: 220,
                    borderRadius: 2,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>{username}</Typography>
              </Box>

              <Divider />

              <MenuItem onClick={() => navigateFromMenu('/profile')}>
                <ListItemIcon>
                  <PersonRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('nav.myProfile')} />
              </MenuItem>

              <MenuItem onClick={() => navigateFromMenu('/history')}>
                <ListItemIcon>
                  <HistoryRounded fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('nav.history')} />
              </MenuItem>

              <MenuItem onClick={() => navigateFromMenu('/game/ranking')}>
                <ListItemIcon>
                  <EmojiEventsRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Ranking" />
              </MenuItem>

              <Divider />

              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('nav.logout')} />
              </MenuItem>
            </Menu>
          </>
        )}
      </div>
    </header>
  )
}
