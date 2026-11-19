import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/authStore';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useAuth();

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Support both wrapper usage (<ProtectedRoute><Child /></ProtectedRoute>)
  // and nested route usage (<Route element={<ProtectedRoute />}><Route ... /></Route>)
  return children ? <>{children}</> : <Outlet />;
}
