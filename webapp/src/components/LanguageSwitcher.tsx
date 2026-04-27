import { useState } from 'react'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded'
import { Box, ButtonBase, ListItemText, Menu, MenuItem, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const menuOpen = Boolean(anchorEl)
  const currentLanguage = i18n.language.startsWith('es') ? 'es' : 'en'

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const closeMenu = () => {
    setAnchorEl(null)
  }

  const handleChangeLanguage = (language: 'en' | 'es') => {
    closeMenu()
    void i18n.changeLanguage(language)
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
    <>
      <ButtonBase
        onClick={openMenu}
        aria-label={t('common.language')}
        sx={headerControlButtonSx}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LanguageRoundedIcon sx={{ fontSize: '1rem', opacity: 0.8 }} />
          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {currentLanguage === 'es' ? t('common.spanish') : t('common.english')}
          </Typography>
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
              minWidth: 180,
              borderRadius: 2,
            },
          },
        }}
      >
        <MenuItem selected={currentLanguage === 'en'} onClick={() => handleChangeLanguage('en')}>
          <ListItemText primary={t('common.english')} />
        </MenuItem>
        <MenuItem selected={currentLanguage === 'es'} onClick={() => handleChangeLanguage('es')}>
          <ListItemText primary={t('common.spanish')} />
        </MenuItem>
      </Menu>
    </>
  )
}
