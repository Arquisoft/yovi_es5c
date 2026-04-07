import { Navigate } from 'react-router-dom';
import { useSession } from '../SessionContext';

interface PrivateRouteProps {
  children: React.ReactNode
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isLoggedIn } = useSession();

  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

export default PrivateRoute;