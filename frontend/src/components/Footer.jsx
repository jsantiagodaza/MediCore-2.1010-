// frontend/src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="brand" href="#">
              <img src="/assets/mol.png" alt="MediCore" width="24" height="24" />
              <span>MediCore</span>
            </a>
            <p>Tu plataforma de orientación en salud y medicamentos con la calidez y compañía de Mol.</p>
          </div>
          <div className="footer-col">
            <h5>Navegación</h5>
            <ul>
              <li><button>Inicio</button></li>
              <li><button>Medicamentos</button></li>
              <li><button>Cuídate (IMC)</button></li>
              <li><button>Me siento mal</button></li>
              <li><button>Botiquín Esencial</button></li>
              <li><button>Prepárate</button></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Aviso Legal</h5>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-slate-gray)' }}>
              MediCore es una herramienta orientativa e informativa. No reemplaza bajo ninguna circunstancia la evaluación, diagnóstico o prescripción médica profesional.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 MediCore. Todos los derechos reservados.</span>
          <span>Inspirado en Navy ink on cool marble · Mol te acompaña siempre.</span>
        </div>
      </div>
    </footer>
  );
}