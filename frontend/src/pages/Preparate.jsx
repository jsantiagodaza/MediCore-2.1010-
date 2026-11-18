// frontend/src/pages/Preparate.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAlerts } from '../api/alerts';
import ModalCalendarioAlerta from '../components/ModalCalendarioAlerta';

export default function Preparate() {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);

  // Filtros locales
  const [ciudadFiltro, setCiudadFiltro] = useState('Todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  useEffect(() => {
    const control = new AbortController();
    setCargando(true);
    setError(null);

    fetchAlerts({ signal: control.signal })
      .then(data => {
        // Asumiendo que el backend devuelve un array directo. 
        // Si devuelve { alertas: [...] }, cámbialo a setAlertas(data.alertas || [])
        setAlertas(data);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'No se pudieron cargar las alertas. Verifica que el backend esté corriendo y el CORS configurado.');
      })
      .finally(() => {
        setCargando(false);
      });

    return () => control.abort();
  }, []);

  const alertasFiltradas = alertas.filter(a => {
    const matchCiudad = ciudadFiltro === 'Todas' || a.city === ciudadFiltro;
    const matchCategoria = categoriaFiltro === 'todas' || a.category?.toLowerCase() === categoriaFiltro;
    return matchCiudad && matchCategoria;
  });

  const getRiskStyles = (nivel) => {
    // El backend envía los niveles en MAYÚSCULAS (ALTO, MEDIO, BAJO)
    switch (nivel?.toUpperCase()) {
      case 'ALTO': return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca', label: 'Riesgo Alto' };
      case 'MEDIO': return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Riesgo Medio' };
      case 'BAJO': return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Riesgo Bajo' };
      default: return { bg: '#f8f9fb', color: '#476788', border: '#d4e0ed', label: 'Informativo' };
    }
  };

  return (
    <section className="screen on" id="s-prep" style={{ paddingTop: '120px' }}>
      <div className="wrap">
        
        <div className="section-header">
          <span className="kicker"><span className="kicker-dot"></span> Prevención y Cuidado</span>
          <h2>Alertas por Temporada</h2>
          <p className="lead">
            Mantente informado sobre las condiciones climáticas, ambientales y de salud en tu ciudad para tomar decisiones preventivas.
          </p>
        </div>

        <div className="alertas-toolbar">
          <div className="alertas-filters">
            <select 
              className="alertas-select" 
              value={ciudadFiltro} 
              onChange={(e) => setCiudadFiltro(e.target.value)}
            >
              <option value="Todas">📍 Todas las ciudades</option>
              {/* Extraemos las ciudades únicas de las alertas */}
              {[...new Set(alertas.map(a => a.city).filter(Boolean))].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="alertas-cat-chips">
              <button className={`alertas-chip ${categoriaFiltro === 'todas' ? 'active' : ''}`} onClick={() => setCategoriaFiltro('todas')}>🌍 Todas</button>
              <button className={`alertas-chip ${categoriaFiltro === 'clima' ? 'active' : ''}`} onClick={() => setCategoriaFiltro('clima')}>⛅ Clima</button>
              <button className={`alertas-chip ${categoriaFiltro === 'salud' ? 'active' : ''}`} onClick={() => setCategoriaFiltro('salud')}>🩺 Salud</button>
              <button className={`alertas-chip ${categoriaFiltro === 'ambiental' ? 'active' : ''}`} onClick={() => setCategoriaFiltro('ambiental')}>🌿 Ambiental</button>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="empty">
            <img src="/assets/mol.png" alt="Cargando" className="mol-empty float" style={{ opacity: 0.5 }} />
            <p>Consultando fuentes oficiales...</p>
          </div>
        ) : error ? (
          <div className="warn" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <strong>Error:</strong> {error}
            <br />
            <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => window.location.reload()}>
              🔄 Reintentar
            </button>
          </div>
        ) : alertasFiltradas.length === 0 ? (
          <div className="empty">
            <img src="/assets/mol.png" alt="Mol" className="mol-empty float" />
            <h4 style={{ fontSize: '18px', color: 'var(--color-ink-navy)', marginBottom: '6px' }}>No hay alertas para esta selección</h4>
            <p>Actualmente no se registran alertas para {ciudadFiltro} en la categoría seleccionada.</p>
            <button className="btn btn-outline btn-sm" onClick={() => { setCiudadFiltro('Todas'); setCategoriaFiltro('todas'); }}>
              Ver todas las alertas
            </button>
          </div>
        ) : (
          <div className="alertas-grid">
            {alertasFiltradas.map(alerta => {
              const risk = getRiskStyles(alerta.riskLevel);
              return (
                <div 
                  key={alerta.id} 
                  className="alerta-card" 
                  onClick={() => setAlertaSeleccionada(alerta)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="alerta-header">
                    <span className="alerta-ciudad">📍 {alerta.city || 'Nacional'}</span>
                    <span 
                      className="alerta-risk-badge" 
                      style={{ backgroundColor: risk.bg, color: risk.color, border: `1px solid ${risk.border}` }}
                    >
                      {risk.label}
                    </span>
                  </div>
                  
                  <h3 className="alerta-title">{alerta.title}</h3>
                  <p className="alerta-desc">{alerta.description}</p>
                  
                  <div className="alerta-footer" style={{ marginTop: 'auto' }}>
                    <div className="alerta-meta">
                      <span>Fuente: {alerta.source}</span>
                    </div>
                    <span className="alerta-vigencia">📅 Ver calendario</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="prep-features" style={{ marginTop: '64px' }}>
          <div className="prep-card" style={{ gridColumn: '1 / -1', textAlign: 'center', background: '#f0f7ff', borderColor: 'var(--color-signal-blue)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎒</div>
            <h4 style={{ fontSize: '22px', marginBottom: '12px' }}>¿Ya tienes tu botiquín listo para cualquier emergencia?</h4>
            <p style={{ maxWidth: '600px', margin: '0 auto 20px' }}>Asegúrate de contar con los elementos esenciales según tu actividad y entorno con la guía de Mol Paramédico.</p>
            <Link to="/botiquin" className="btn btn-primary">
              Ir a mi Botiquín
            </Link>
          </div>
        </div>

      </div>

      <ModalCalendarioAlerta 
        alerta={alertaSeleccionada} 
        onClose={() => setAlertaSeleccionada(null)} 
      />
    </section>
  );
}