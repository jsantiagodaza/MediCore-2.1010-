// frontend/src/components/Header.jsx
import { NavLink, Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  
  // Verificamos si hay un token guardado (simulando la sesión activa)
  // Lo leemos directamente en el render para que se actualice al recargar
  const isLoggedIn = !!localStorage.getItem('medicore_token');

  const handleLogout = () => {
    // Borramos los datos de sesión
    localStorage.removeItem('medicore_token');
    localStorage.removeItem('medicore_user');
    // Redirigimos al inicio y recargamos para actualizar el Header
    navigate('/');
    window.location.reload();
  };

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
          {isLoggedIn ? (
            <>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-signal-blue)' }}>
                {/* Mostramos la primera letra del correo */}
                Hola, {localStorage.getItem('medicore_user')?.split('@')[0]}
              </span>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Cerrar sesión
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