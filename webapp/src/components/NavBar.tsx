type TopBarProps = {
  username: string | null
  onLogout: () => void
}

export default function TopBar({ username, onLogout }: TopBarProps) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: '1px solid #ddd'
    }}>
      <div style={{ fontWeight: 700 }}>Game Y</div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {username && <span>Hi, <b>{username}</b></span>}
        {username && <button onClick={onLogout}>Logout</button>}
      </div>
    </header>
  )
}