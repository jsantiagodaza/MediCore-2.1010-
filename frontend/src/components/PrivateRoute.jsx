// frontend/src/components/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { getSession } from '../auth/session';

export default function PrivateRoute() {
  const sesion = getSession();

  // Si no hay sesión (o caducó), redirigimos al login.
  // El 'replace' evita que el usuario pueda volver atrás con el botón del navegador.
  if (!sesion) {
    return <Navigate to="/login" replace />;
  }

  // Si hay sesión, renderiza la ruta hija que se esté intentando acceder
  return <Outlet />;
}