import { Navigate } from 'react-router-dom';
import { obtenerToken, obtenerUsuarioActual } from '../utils/api';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ciudadano' | 'operador' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const token = obtenerToken();
  const usuario = obtenerUsuarioActual();

  // Si no hay token, redirigir a inicio
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Si se requiere un rol específico y no lo tiene, redirigir
  if (requiredRole && usuario?.rol !== requiredRole) {
    // Si es admin, puede ver todo
    if (usuario?.rol !== 'admin' && usuario?.rol !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
