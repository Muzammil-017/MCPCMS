import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, roles = ['Admin', 'HR', 'SuperAdmin'], superAdminOnly = false }) {
  const { user, isSuperAdmin } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (superAdminOnly && !isSuperAdmin) return <Navigate to="/dashboard" replace />;
  if (isSuperAdmin && !superAdminOnly) return <Navigate to="/companies" replace />;
  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'Employee' ? '/employee/dashboard' : '/'} replace />;
  }
  return children;
}
