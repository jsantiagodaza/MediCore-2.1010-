import { NavLink, Link } from 'react-router-dom';

export default function Header() {
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
        
        <div className="gnav-cta">
          <Link to="/mal" className="btn btn-primary btn-sm">Evaluar síntomas</Link>
        </div>
      </nav>
    </header>
  );
}