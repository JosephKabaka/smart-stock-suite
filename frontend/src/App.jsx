import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Sidenav from './components/Sidenav';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import StockLogs from './pages/StockLogs';
import Settings from './pages/Settings';
import Login from './pages/Login'; 
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard'; // Import your new page

// Smart wrapper to check for login AND specific roles
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null; // Wait for context to load user from localStorage

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is needed (like 'superadmin') but user is just 'admin'
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/superadmin-login" element={<SuperAdminLogin />} />

      {/* 2. SUPERADMIN DASHBOARD (No Sidenav) */}
      <Route 
        path="/super-dashboard" 
        element={
          <ProtectedRoute requiredRole="superAdmin">
            <SuperAdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* 3. MANAGER PROTECTED ROUTES (With Sidenav) */}
      <Route
        element={
          <ProtectedRoute>
            <Sidenav />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/stock-logs" element={<StockLogs />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* 4. CATCH-ALL */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;