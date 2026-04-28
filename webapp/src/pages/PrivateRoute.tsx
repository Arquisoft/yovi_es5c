import { Navigate } from 'react-router-dom'

interface PrivateRouteProps {
  children: React.ReactNode
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const storedSessionId = localStorage.getItem('sessionId')

  return storedSessionId ? <>{children}</> : <Navigate to="/login" replace />
}

export default PrivateRoute