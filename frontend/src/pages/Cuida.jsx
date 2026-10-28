// frontend/src/pages/Cuida.jsx
import { useState } from 'react';
import CalculadoraIMC from '../components/CalculadoraIMC';
import CalculadoraAgua from '../components/CalculadoraAgua';

export default function Cuida() {
  const [tab, setTab] = useState('imc');

  return (
    <section className="screen on" id="s-cuida" style={{ paddingTop: '120px' }}>
      <div className="wrap">
        {/* Pestañas */}
        <div className="cuida-nav-tabs">
          <button 
            className={`cuida-tab-btn ${tab === 'imc' ? 'active' : ''}`}
            onClick={() => setTab('imc')}
          >
            <span>⚖️ Índice de Masa Corporal (IMC)</span>
          </button>
          <button 
            className={`cuida-tab-btn ${tab === 'agua' ? 'active' : ''}`}
            onClick={() => setTab('agua')}
          >
            <span>💧 Agua por Día (Hidratación)</span>
            <span className="badge-pill blue" style={{ fontSize: '11px' }}>Nuevo</span>
          </button>
        </div>

        {/* Panel IMC */}
        {tab === 'imc' && (
          <div>
            <div className="section-header">
              <span className="kicker"><span className="kicker-dot"></span> Nutrición y Salud</span>
              <h2>Tu Índice de Masa Corporal</h2>
              <p className="lead">Conoce tu estado nutricional en segundos y recibe recomendaciones preventivas adaptadas por Mol.</p>
            </div>
            <CalculadoraIMC />
          </div>
        )}

        {/* Panel Agua */}
        {tab === 'agua' && (
          <div>
            <div className="section-header">
              <span className="kicker"><span className="kicker-dot"></span> Resolución 3803 de 2016 (RIEN) & IDEAM</span>
              <h2>Agua por día: Tu hidratación inteligente</h2>
              <p className="lead">
                Calcula tu ingesta diaria de líquidos de referencia según tu edad, nivel de actividad física y el clima habitual de tu ciudad.
              </p>
            </div>
            <CalculadoraAgua />
          </div>
        )}
      </div>
    </section>
  );
}