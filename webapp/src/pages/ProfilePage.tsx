import EditRoundedIcon from '@mui/icons-material/EditRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import { Avatar, Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useSession } from '../SessionContext'

export default function ProfilePage() {
  const { username } = useSession()

  return (
    <Box
      sx={{
        minHeight: '100%',
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        py: { xs: 4, md: 7 },
        background: 'linear-gradient(180deg, #f4f8ff 0%, #eef2f7 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 960,
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          border: '1px solid rgba(25, 118, 210, 0.12)',
          backgroundColor: 'rgba(255,255,255,0.92)',
        }}
      >
        <Stack spacing={4}>
          <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2.5, flexDirection: { xs: 'column', md: 'row' } }}>
            <Avatar sx={{ width: 88, height: 88, bgcolor: '#1976d2', fontSize: '2rem', fontWeight: 700 }}>
              {username?.slice(0, 1).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.12em' }}>
                Player profile
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {username}
              </Typography>
              <Typography sx={{ mt: 1, color: 'text.secondary', maxWidth: 560 }}>
                Here you will see your account details and activity.
              </Typography>
            </Box>

            <Button variant="contained" startIcon={<EditRoundedIcon />} disabled>
              Edit profile
            </Button>
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Paper variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
              <Stack direction="row" spacing={1.5} sx={{ mb: 1.5, alignItems: 'center' }}>
                <PersonRoundedIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Account details
                </Typography>
              </Stack>
              <Typography sx={{ fontWeight: 700 }}>Username</Typography>
              <Typography sx={{ color: 'text.secondary' }}>{username}</Typography>
            </Paper>

            <Paper variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
              <Stack direction="row" spacing={1.5} sx={{ mb: 1.5, alignItems: 'center' }}>
                <SecurityRoundedIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Change password
                </Typography>
              </Stack>
              <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                You will be able to change your password here.
              </Typography>
              <Button variant="outlined" disabled>
                Change password
              </Button>
            </Paper>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}
