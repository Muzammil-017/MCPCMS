import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function EmployeeRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/employee-login" replace />;
  if (user.role !== 'Employee') return <Navigate to="/dashboard" replace />;
  return children;
}
