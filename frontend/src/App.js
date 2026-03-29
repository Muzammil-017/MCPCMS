import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Compliance from './pages/Compliance';
import Analytics from './pages/Analytics';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/companies"  element={<PrivateRoute><Companies /></PrivateRoute>} />
          <Route path="/employees"  element={<PrivateRoute><Employees /></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
          <Route path="/payroll"    element={<PrivateRoute><Payroll /></PrivateRoute>} />
          <Route path="/compliance" element={<PrivateRoute><Compliance /></PrivateRoute>} />
          <Route path="/analytics"  element={<PrivateRoute><Analytics /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
