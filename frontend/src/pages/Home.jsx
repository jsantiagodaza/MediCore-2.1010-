// frontend/src/pages/Home.jsx
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="screen on" id="s-home">
      <div className="hero-wrapper">
        <div className="wrap">
          <div className="hero-grid">
            {/* Left Column */}
            <div className="hero-content">
              <div className="kicker">
                <span className="kicker-dot"></span>
                MediCore · Conoce a Mol
              </div>
              <h1>Tu salud,<br />simple.</h1>
              <p className="lead">Medicamentos, IMC y orientación de síntomas en un solo lugar, con Mol a tu lado para guiarte en cada paso.</p>
              
              <div className="cta">
                <Link to="/mal" className="btn btn-primary">Evaluar síntomas</Link>
                <Link to="/medicamentos" className="btn btn-outline">Ver medicamentos</Link>
              </div>
              
              <div className="hero-highlights">
                <div className="hero-highlight-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Orientación médica preventiva inmediata</span>
                </div>
                <div className="hero-highlight-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Más de 50 medicamentos detallados con posología y advertencias</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="hero-showcase">
              <div className="blob blob-cyan"></div>
              <div className="blob blob-magenta"></div>
              <div className="product-card">
                <div className="product-card-topbar">
                  <span className="product-status-pill">
                    <span className="product-status-dot"></span> Asistente Activo
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--color-slate-gray)', fontWeight: '500' }}>MediCore 2.0</span>
                </div>
                <img src="/assets/mol.png" alt="Mol, la mascota de MediCore" className="hero-mol float" />
                <div className="callout">
                  <b>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Mol dice
                  </b>
                  <span>¡Hola! Estoy aquí para ayudarte con tu salud. ¿Cómo te sientes hoy?</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Strip Band */}
      <div className="trust-strip">
        <div className="wrap trust-inner">
          <div className="trust-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Orientación clínica preventiva
          </div>
          <span className="trust-sep">•</span>
          <div className="trust-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Catálogo con +50 medicamentos
          </div>
          <span className="trust-sep">•</span>
          <div className="trust-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Cálculo de IMC al instante
          </div>
        </div>
      </div>

      {/* Features Band */}
      <div className="band">
        <div className="wrap">
          <div className="section-header">
            <span className="kicker"><span className="kicker-dot"></span> Módulos Principales</span>
            <h2>Todo lo que necesitas para cuidarte</h2>
            <p className="lead">Herramientas simples y directas diseñadas para darte tranquilidad y respuestas médicas confiables.</p>
          </div>
          <div className="grid3">
            <Link to="/medicamentos" className="card feat">
              <div className="feat-icon-badge">💊</div>
              <h3>Medicamentos</h3>
              <p>Para qué sirven, dosis recomendadas, cuándo tomarlos y precauciones esenciales de seguridad.</p>
              <span className="link">Explorar catálogo ›</span>
            </Link>
            <Link to="/cuida" className="card feat">
              <div className="feat-icon-badge">⚖️💧</div>
              <h3>Cuídate (IMC y Agua)</h3>
              <p>Calcula tu índice de masa corporal y tu ingesta diaria de agua personalizada según tu clima y actividad con Mol.</p>
              <span className="link">Calcular IMC y Agua ›</span>
            </Link>
            <Link to="/mal" className="card feat">
              <div className="feat-icon-badge">🩺</div>
              <h3>Me siento mal</h3>
              <p>Selecciona tus síntomas para recibir orientación guiada, causas probables y pautas seguras.</p>
              <span className="link">Evaluar mis síntomas ›</span>
            </Link>
            <Link to="/botiquin" className="card feat">
              <div className="feat-icon-badge">🎒</div>
              <h3>Botiquín Esencial <span className="badge-pill" style={{ fontSize: '11px' }}>Nuevo</span></h3>
              <p>Guías para armar, organizar y revisar botiquines seguros según tu actividad con Mol Paramédico.</p>
              <span className="link">Preparar mi botiquín ›</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}