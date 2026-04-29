import { Navigate } from 'react-router-dom';
import { useSession } from '../SessionContext';

interface PrivateRouteProps {
  children: React.ReactNode
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isLoggedIn, isReady } = useSession();

  if (!isReady) {
    return null; 
  }

  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

export default PrivateRoute;