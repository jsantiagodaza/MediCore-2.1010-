// frontend/src/pages/Preparate.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_ALERTAS, CIUDADES_DISPONIBLES, CATEGORIAS_DISPONIBLES } from '../data/alertas-mock';
import ModalCalendarioAlerta from '../components/ModalCalendarioAlerta';

export default function Preparate() {
  const [alertas, setAlertas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para el modal del calendario
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);

  // Filtros
  const [ciudadFiltro, setCiudadFiltro] = useState('Todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  // Simulamos la carga de la API
  useEffect(() => {
    const cargarAlertas = async () => {
      setCargando(true);
      setError(null);
      try {
        // Simulamos un retraso de 1 segundo
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAlertas(MOCK_ALERTAS);
      } catch (err) {
        setError('No se pudieron cargar las alertas. Intenta de nuevo.');
      } finally {
        setCargando(false);
      }
    };
    cargarAlertas();
  }, []);

  // Lógica de filtrado
  const alertasFiltradas = (alertas || []).filter(alerta => {
    const matchCiudad = ciudadFiltro === 'Todas' || alerta.ciudad === ciudadFiltro;
    const matchCategoria = categoriaFiltro === 'todas' || alerta.categoria === categoriaFiltro;
    return matchCiudad && matchCategoria;
  });

  // Colores por nivel de riesgo
  const getRiskStyles = (nivel) => {
    switch (nivel) {
      case 'alto': return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca', label: 'Riesgo Alto' };
      case 'medio': return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Riesgo Medio' };
      case 'bajo': return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Riesgo Bajo' };
      default: return { bg: '#f8f9fb', color: '#476788', border: '#d4e0ed', label: 'Informativo' };
    }
  };

  return (
    <section className="screen on" id="s-prep" style={{ paddingTop: '120px' }}>
      <div className="wrap">
        
        {/* Encabezado de la Sección */}
        <div className="section-header">
          <span className="kicker"><span className="kicker-dot"></span> Prevención y Cuidado</span>
          <h2>Alertas por Temporada</h2>
          <p className="lead">
            Mantente informado sobre las condiciones climáticas, ambientales y de salud en tu ciudad para tomar decisiones preventivas.
          </p>
        </div>

        {/* Panel de Filtros y Preferencias */}
        <div className="alertas-toolbar">
          <div className="alertas-filters">
            <select 
              className="alertas-select" 
              value={ciudadFiltro} 
              onChange={(e) => setCiudadFiltro(e.target.value)}
            >
              {CIUDADES_DISPONIBLES.map(c => <option key={c} value={c}>{c === 'Todas' ? '📍 Todas las ciudades' : c}</option>)}
            </select>

            <div className="alertas-cat-chips">
              {CATEGORIAS_DISPONIBLES.map(cat => (
                <button
                  key={cat.id}
                  className={`alertas-chip ${categoriaFiltro === cat.id ? 'active' : ''}`}
                  onClick={() => setCategoriaFiltro(cat.id)}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
          
          <button className="btn btn-outline btn-sm" onClick={() => alert('Configuración de preferencias de notificación (Próximamente)')}>
            ⚙️ Preferencias
          </button>
        </div>

        {/* Estados de Carga, Error y Vacío */}
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
          /* Grid de Alertas */
          <div className="alertas-grid">
            {alertasFiltradas.map(alerta => {
              const risk = getRiskStyles(alerta.nivelRiesgo);
              return (
                <div 
                  key={alerta.id} 
                  className="alerta-card" 
                  onClick={() => setAlertaSeleccionada(alerta)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="alerta-header">
                    <span className="alerta-ciudad">📍 {alerta.ciudad}</span>
                    <span 
                      className="alerta-risk-badge" 
                      style={{ backgroundColor: risk.bg, color: risk.color, border: `1px solid ${risk.border}` }}
                    >
                      {risk.label}
                    </span>
                  </div>
                  
                  <h3 className="alerta-title">{alerta.titulo}</h3>
                  <p className="alerta-desc">{alerta.descripcion}</p>
                  
                  <div className="alerta-recomendaciones">
                    <strong>Recomendaciones:</strong>
                    <ul>
                      {alerta.recomendaciones.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="alerta-footer">
                    <div className="alerta-meta">
                      <span>Fuente: {alerta.fuente}</span>
                      <span>Actualizado: {alerta.fechaActualizacion}</span>
                    </div>
                    {/* Aviso visual para el usuario */}
                    <span className="alerta-vigencia">📅 Ver calendario</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tarjeta de Botiquín */}
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

      {/* MODAL CALENDARIO */}
      <ModalCalendarioAlerta 
        alerta={alertaSeleccionada} 
        onClose={() => setAlertaSeleccionada(null)} 
      />
    </section>
  );
}