import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route and redirects unauthenticated users to /login.
 * Optionally enforces a required role.
 */
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to the user's own dashboard
    const roleHome = {
      Customer: '/customer/search',
      Provider: '/provider/dashboard',
      Admin: '/admin/dashboard',
    };
    return <Navigate to={roleHome[user?.role] || '/login'} replace />;
  }

  return children;
}

export default ProtectedRoute;
