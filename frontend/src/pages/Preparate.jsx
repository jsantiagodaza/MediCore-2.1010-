// frontend/src/pages/Preparate.jsx
import { Link } from 'react-router-dom';

export default function Preparate() {
  return (
    <section className="screen on" id="s-prep" style={{ paddingTop: '120px' }}>
      <div className="wrap center">
        <div className="hero-showcase" style={{ marginBottom: '20px' }}>
          <div className="blob blob-cyan"></div>
          <div className="blob blob-magenta"></div>
          <img 
            src="/assets/mol-amarillo.png" 
            alt="Mol en construcción" 
            className="mol-md float" 
            style={{ position: 'relative', zIndex: 1 }} 
          />
        </div>
        
        <span className="kicker">
          <span className="kicker-dot"></span> Próximamente
        </span>
        <h2>Prepárate</h2>
        <p className="lead narrow" style={{ margin: '0 auto 36px' }}>
          Herramientas preventivas, contingencias de salud y guías clínicas para mantenerte listo ante cualquier situación.
        </p>
        
        <div className="prep-features narrow" style={{ margin: '0 auto' }}>
          <div className="prep-card">
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>🌦️</div>
            <h4>Alertas por Temporada</h4>
            <p>Prevención de picos de gripe, polen estacional y olas de calor o frío (en desarrollo).</p>
          </div>
          
          <Link 
            to="/botiquin" 
            className="prep-card" 
            style={{ 
              display: 'block',
              textDecoration: 'none',
              cursor: 'pointer', 
              borderColor: 'var(--color-signal-blue)', 
              background: '#f0f7ff' 
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎒</div>
            <h4>
              Botiquín Esencial <span className="badge-pill blue" style={{ fontSize: '10px' }}>¡Ya disponible!</span>
            </h4>
            <p>Guías para armar, organizar y revisar botiquines seguros según tu actividad con Mol Paramédico.</p>
            <span 
              className="link" 
              style={{ 
                fontSize: '13px', 
                fontWeight: '700', 
                color: 'var(--color-signal-blue)', 
                marginTop: '8px', 
                display: 'inline-block' 
              }}
            >
              Abrir módulo de botiquín →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}