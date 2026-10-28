// frontend/src/components/Header.jsx
export default function Header() {
  return (
    <header className="gnav">
      <nav className="gnav-inner" aria-label="Principal">
        <a className="brand" href="#">
          <img src="/assets/mol.png" alt="MediCore" width="28" height="28" />
          <span>MediCore</span>
        </a>
        <div className="links">
          <button className="on">Inicio</button>
          <button>Medicamentos</button>
          <button>Cuídate</button>
          <button>Me siento mal</button>
          <button>Botiquín <span className="badge-pill">Nuevo</span></button>
          <button>Prepárate</button>
        </div>
        <div className="gnav-cta">
          <button className="btn btn-primary btn-sm">Evaluar síntomas</button>
        </div>
      </nav>
    </header>
  );
}