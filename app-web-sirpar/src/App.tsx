import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { DashboardCiudadano } from './components/DashboardCiudadano';
import { DashboardOperador } from './components/DashboardOperador';
import { DashboardAdmin } from './components/DashboardAdmin';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

export default function App() {
  console.log('✅ App iniciado');
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard/ciudadano"
          element={
            <ProtectedRoute requiredRole="ciudadano">
              <DashboardCiudadano />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/operador"
          element={
            <ProtectedRoute requiredRole="operador">
              <DashboardOperador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}