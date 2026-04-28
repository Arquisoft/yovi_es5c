import { useSession } from '../SessionContext'
import { useNavigate } from 'react-router-dom'

const apiEndpoint = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function NavBar() {
  const { isLoggedIn, username, destroySession } = useSession()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const u = username

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

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #ddd',
        background: 'rgba(15, 15, 39, 0.75)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ fontWeight: 700, cursor: 'pointer', color: 'white' }} onClick={() => navigate('/')}>
        Game Y
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'white' }}>
        {isLoggedIn && (
          <span>
            Hi, <b>{username}</b>
          </span>
        )}
        {isLoggedIn && <button onClick={handleLogout}>Logout</button>}
      </div>
    </header>
  )
}