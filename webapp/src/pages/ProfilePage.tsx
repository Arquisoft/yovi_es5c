import EditRoundedIcon from '@mui/icons-material/EditRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import { useEffect, useState } from 'react'
import { Alert, Avatar, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useSession } from '../SessionContext'
import { useNavigate } from 'react-router-dom'

type ProfileData = {
  username: string
  name: string
  surname: string
  email: string
}

type ProfileMessage = {
  severity: 'error' | 'success'
  text: string
}

const apiEndpoint = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const emptyProfile: ProfileData = {
  username: '',
  name: '',
  surname: '',
  email: '',
}

async function loadProfile(username: string): Promise<ProfileData> {
  const token = localStorage.getItem('sessionId'); // Obtenemos el token
  const response = await fetch(`${apiEndpoint}/user/${encodeURIComponent(username)}`, {
    headers: {
      'Authorization': `Bearer ${token}` // Lo enviamos al Gateway
    }
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Could not load profile information.')
  }

  return data
}

async function saveProfile(profile: ProfileData): Promise<ProfileData> {
  const token = localStorage.getItem('sessionId'); // Obtenemos el token
  const response = await fetch(`${apiEndpoint}/user/${encodeURIComponent(profile.username)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Lo enviamos al Gateway
    },
    body: JSON.stringify({
      name: profile.name,
      surname: profile.surname,
      email: profile.email,
    }),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Could not update profile information.')
  }

  return data
}

export default function ProfilePage() {
  const { username } = useSession()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [formData, setFormData] = useState<ProfileData>(emptyProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<ProfileMessage | null>(null)

  useEffect(() => {
    let ignore = false

    const fetchProfile = async () => {
      if (!username) {
        setProfile(null)
        setFormData(emptyProfile)
        return
      }

      try {
        setMessage(null)
        const data = await loadProfile(username)

        if (!ignore) {
          setProfile(data)
          setFormData(data)
        }
      } catch (fetchError) {
        if (!ignore) {
          setMessage({
            severity: 'error',
            text: fetchError instanceof Error ? fetchError.message : 'Could not load profile information.',
          })
        }
      }
    }

    fetchProfile()

    return () => {
      ignore = true
    }
  }, [username])

  const displayUsername = profile?.username || username

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleEditStart = () => {
    if (!profile) {
      return
    }

    setFormData(profile)
    setMessage(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData(profile || emptyProfile)
    setMessage(null)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!displayUsername) {
      return
    }

    try {
      setIsSaving(true)
      setMessage(null)
      const data = await saveProfile({ ...formData, username: displayUsername })

      setProfile(data)
      setFormData(data)
      setIsEditing(false)
      setMessage({
        severity: 'success',
        text: 'Profile updated successfully.',
      })
    } catch (saveError) {
      setMessage({
        severity: 'error',
        text: saveError instanceof Error ? saveError.message : 'Could not update profile information.',
      })
    } finally {
      setIsSaving(false)
    }
  }

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
              {displayUsername?.slice(0, 1).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.12em' }}>
                Player profile
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {displayUsername}
              </Typography>
              <Typography sx={{ mt: 1, color: 'text.secondary', maxWidth: 560 }}>
                Here you will see your account details and activity.
              </Typography>
            </Box>

            {isEditing ? (
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSave} disabled={isSaving}>
                  Save
                </Button>
              </Stack>
            ) : (
              <Button variant="contained" startIcon={<EditRoundedIcon />} onClick={handleEditStart} disabled={!profile}>
                Edit profile
              </Button>
            )}
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Paper variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
              <Stack direction="row" spacing={1.5} sx={{ mb: 1.5, alignItems: 'center' }}>
                <PersonRoundedIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Account details
                </Typography>
              </Stack>
              <Stack spacing={1.25}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Username</Typography>
                  <Typography sx={{ color: 'text.secondary' }}>{displayUsername}</Typography>
                </Box>
                {isEditing ? (
                  <>
                    <TextField
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleFieldChange}
                      fullWidth
                      disabled={isSaving}
                    />
                    <TextField
                      label="Surname"
                      name="surname"
                      value={formData.surname}
                      onChange={handleFieldChange}
                      fullWidth
                      disabled={isSaving}
                    />
                    <TextField
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFieldChange}
                      fullWidth
                      disabled={isSaving}
                    />
                  </>
                ) : (
                  <>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>Name</Typography>
                      <Typography sx={{ color: 'text.secondary' }}>{profile?.name || 'Loading...'}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>Surname</Typography>
                      <Typography sx={{ color: 'text.secondary' }}>{profile?.surname || 'Loading...'}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>Email</Typography>
                      <Typography sx={{ color: 'text.secondary' }}>{profile?.email || 'Loading...'}</Typography>
                    </Box>
                  </>
                )}
                {message ? (
                  <Alert severity={message.severity}>
                    {message.text}
                  </Alert>
                ) : null}
              </Stack>
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

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} sx={{ mb: 1.5, alignItems: 'center' }}>
              <HistoryRoundedIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Match history
              </Typography>
            </Stack>
            <Typography sx={{ color: 'text.secondary', mb: 2 }}>
              Review your recent matches and results.
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/history')}>
              View history
            </Button>
          </Paper>
        </Stack>
      </Paper>
    </Box>
  )
}
