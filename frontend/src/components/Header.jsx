// frontend/src/components/Header.jsx
import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { logout as apiLogout } from '../api/auth';
import { clearSession, getSession, subscribeSession } from '../auth/session';

export default function Header() {
  const navigate = useNavigate();

  // Sesion actual (null si no hay). Se actualiza sola cuando cambia el login.
  const [sesion, setSesion] = useState(() => getSession());
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    return subscribeSession(() => setSesion(getSession()));
  }, []);

  const handleLogout = async () => {
    setSaliendo(true);
    try {
      if (sesion?.token) {
        await apiLogout(sesion.token);
      }
    } catch {
      // Si el token ya no es valido, igual cerramos la sesion en el navegador.
    }
    clearSession();
    setSaliendo(false);
    navigate('/');
  };

  const nombreVisible = sesion?.usuario?.name
    || sesion?.usuario?.email?.split('@')[0]
    || 'usuario';

  return (
    <header className="gnav">
      <nav className="gnav-inner" aria-label="Principal">
        <Link className="brand" to="/">
          <img src="/assets/mol.png" alt="MediCore" width="28" height="28" />
          <span>MediCore</span>
        </Link>

        <div className="links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'on' : ''}>Inicio</NavLink>
          <NavLink to="/medicamentos" className={({ isActive }) => isActive ? 'on' : ''}>Medicamentos</NavLink>
          <NavLink to="/cuida" className={({ isActive }) => isActive ? 'on' : ''}>Cuídate</NavLink>
          <NavLink to="/mal" className={({ isActive }) => isActive ? 'on' : ''}>Me siento mal</NavLink>
          <NavLink to="/botiquin" className={({ isActive }) => isActive ? 'on' : ''}>Botiquín <span className="badge-pill">Nuevo</span></NavLink>
          <NavLink to="/preparate" className={({ isActive }) => isActive ? 'on' : ''}>Prepárate</NavLink>
        </div>

        <div className="gnav-cta" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {sesion ? (
            <>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-signal-blue)' }}>
                Hola, {nombreVisible}
              </span>
              <button onClick={handleLogout} className="btn btn-outline btn-sm" disabled={saliendo}>
                {saliendo ? 'Saliendo...' : 'Cerrar sesión'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm" style={{ border: 'none' }}>
                Iniciar sesión
              </Link>
              <Link to="/mal" className="btn btn-primary btn-sm">Evaluar síntomas</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
