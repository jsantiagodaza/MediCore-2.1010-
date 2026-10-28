// frontend/src/pages/Botiquin.jsx
import { useState, useEffect } from 'react';
import { BOTIQUIN_ITEMS, BOTIQUIN_KITS, BOTIQUIN_REVISIONES, BOTIQUIN_FUENTES } from '../data/botiquin';
import ModalFichaBotiquin from '../components/ModalFichaBotiquin';

export default function Botiquin() {
  const [currentKitId, setCurrentKitId] = useState('calle');
  const [itemFilter, setItemFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Estados persistentes (localStorage)
  const [checkedState, setCheckedState] = useState(() => {
    const saved = localStorage.getItem('medicore_botiquin_checked_v1');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [lastRevision, setLastRevision] = useState(() => {
    const saved = localStorage.getItem('medicore_botiquin_last_revision');
    return saved || new Date().toISOString().split('T')[0];
  });

  const [revisionChecks, setRevisionChecks] = useState(() => {
    const saved = localStorage.getItem('medicore_botiquin_rev_items');
    return saved ? JSON.parse(saved) : {};
  });

  // Sincronizar con localStorage
  useEffect(() => {
    localStorage.setItem('medicore_botiquin_checked_v1', JSON.stringify(checkedState));
  }, [checkedState]);

  useEffect(() => {
    localStorage.setItem('medicore_botiquin_last_revision', lastRevision);
  }, [lastRevision]);

  useEffect(() => {
    localStorage.setItem('medicore_botiquin_rev_items', JSON.stringify(revisionChecks));
  }, [revisionChecks]);

  // Obtener items según el kit seleccionado
  const getItemsForCurrentKit = () => {
    if (currentKitId === 'todos') {
      return BOTIQUIN_ITEMS.map(item => ({
        ...item,
        cant: item.cantidadSugerida,
        checked: !!checkedState[`todos_${item.id}`]
      }));
    }
    const kit = BOTIQUIN_KITS[currentKitId];
    if (!kit) return [];
    
    return kit.items.map(kItem => {
      const full = BOTIQUIN_ITEMS.find(i => i.id === kItem.id) || { 
        id: kItem.id, nombre: kItem.id, emoji: '🩹', catLabel: 'Curaciones', sirve: '' 
      };
      return {
        ...full,
        cant: kItem.cant,
        tag: kItem.tag || full.tag,
        tagLabel: kItem.tag === 'esencial' ? 'Esencial' : kItem.tag === 'personal' ? 'Personal' : 'Recomendado',
        checked: !!checkedState[`${currentKitId}_${full.id}`]
      };
    });
  };

  const allKitItems = getItemsForCurrentKit();
  
  // Filtrado de la lista
  const filteredItems = allKitItems.filter(item => {
    const matchSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (item.sirve && item.sirve.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchSearch) return false;
    
    if (itemFilter === 'pending') return !item.checked;
    if (itemFilter === 'done') return item.checked;
    if (itemFilter === 'essential') return item.tag === 'esencial';
    return true;
  });

  // Métricas de progreso
  const total = allKitItems.length;
  const checkedCount = allKitItems.filter(i => i.checked).length;
  const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
  const missingCount = total - checkedCount;

  // Handlers
  const toggleItem = (id) => {
    const key = `${currentKitId}_${id}`;
    setCheckedState(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  const markAll = (status) => {
    const next = { ...checkedState };
    allKitItems.forEach(item => {
      const key = `${currentKitId}_${item.id}`;
      if (status) next[key] = true;
      else delete next[key];
    });
    setCheckedState(next);
  };

  const copyMissing = () => {
    const missing = allKitItems.filter(i => !i.checked);
    if (!missing.length) {
      alert('¡No tienes elementos pendientes! Tu botiquín está completo.');
      return;
    }
    let text = `📋 LISTA DE FALTANTES — ${currentKitId.toUpperCase()}\n`;
    text += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;
    missing.forEach((m, i) => {
      text += `${i + 1}. [ ] ${m.nombre} (${m.cant || m.tagLabel})\n   Función: ${m.sirve}\n`;
    });
    navigator.clipboard.writeText(text);
    alert(`✅ Se copiaron ${missing.length} elementos pendientes al portapapeles`);
  };

  const kit = currentKitId === 'todos' ? null : BOTIQUIN_KITS[currentKitId];

  // Lógica del semáforo de revisión
  const diffDays = Math.floor((new Date() - new Date(lastRevision)) / (1000 * 60 * 60 * 24));
  let revStatus = { class: 'status-ok', text: '🟢 Botiquín al día', msg: '¡Excelente hábito! Un botiquín revisado mensualmente garantiza que ningún material esté vencido.' };
  if (diffDays > 30 && diffDays <= 45) {
    revStatus = { class: 'status-warn', text: '🟡 Revisión próxima', msg: 'Han pasado más de 30 días. Revisa rápidamente los vencimientos y el estado de los empaques.' };
  } else if (diffDays > 45) {
    revStatus = { class: 'status-alert', text: '🔴 Revisión vencida', msg: '¡Alerta preventiva! Toma 5 minutos para inspeccionar tu botiquín hoy mismo.' };
  }

  return (
    <section className="screen on" id="s-botiquin" style={{ paddingTop: '120px' }}>
      <div className="wrap">
        
        {/* HERO BOTIQUIN */}
        <div className="hero-botiquin-showcase">
          <div className="blob blob-cyan"></div>
          <div className="blob blob-magenta"></div>
          <div className="hero-botiquin-grid">
            <div className="hero-botiquin-text">
              <div className="kicker"><span className="kicker-dot"></span> MediCore · Botiquín Esencial</div>
              <h2>Guía para preparar, organizar y transportar botiquines seguros</h2>
              <p className="lead">Aprende qué llevar, cómo conservarlo y qué precauciones seguir con la supervisión de <strong>Mol Paramédico</strong>.</p>
              <div className="hero-botiquin-actions">
                <a href="#botiquin-tabs" className="btn btn-primary btn-sm">🎒 Armar mi botiquín</a>
                <a href="#sec-emergencias" className="btn btn-outline btn-sm">🚨 Cuándo buscar ayuda</a>
              </div>
            </div>
            <div className="hero-botiquin-visuals">
              <img src="/assets/mol_paramedico.png" alt="Mol Paramédico" className="hero-mol-paramedico float" />
            </div>
          </div>
        </div>

        {/* SELECTOR DE KITS */}
        <div className="botiquin-tabs-wrapper" id="botiquin-tabs">
          <div className="botiquin-tabs-header">
            <div>
              <span className="kicker" style={{ marginBottom: '8px' }}><span className="kicker-dot"></span> Situaciones</span>
              <h3 style={{ fontSize: '22px' }}>Elige tu actividad</h3>
            </div>
          </div>
          <div className="botiquin-tabs">
            {Object.keys(BOTIQUIN_KITS).map(key => (
              <button key={key} className={`kit-tab-btn ${currentKitId === key ? 'active' : ''}`} onClick={() => { setCurrentKitId(key); setItemFilter('all'); setSearchTerm(''); }}>
                <span className="tab-icon">{BOTIQUIN_KITS[key].icono}</span> {BOTIQUIN_KITS[key].titulo}
              </button>
            ))}
            <button className={`kit-tab-btn ${currentKitId === 'todos' ? 'active' : ''}`} onClick={() => { setCurrentKitId('todos'); setItemFilter('all'); setSearchTerm(''); }}>
              <span className="tab-icon">🎒</span> Catálogo Completo
            </button>
          </div>
        </div>

        {/* BANNER DEL KIT ACTIVO */}
        <div className="kit-banner-card">
          <div className="kit-banner-info">
            <span className="kit-banner-subtitle">{currentKitId === 'todos' ? 'Todos los insumos' : kit.subtitulo}</span>
            <h3>{currentKitId === 'todos' ? 'Catálogo Completo de Elementos' : kit.titulo}</h3>
            <p className="kit-banner-desc">{currentKitId === 'todos' ? 'Consulta los 20 elementos fundamentales de primeros auxilios.' : kit.descripcion}</p>
            <div className="kit-comollevar-box">
              <strong>Cómo llevarlo:</strong> {currentKitId === 'todos' ? 'Separar materiales, mantener en estuche limpio y protegido de la humedad.' : kit.comoLlevar}
            </div>
          </div>
          <div className="kit-mol-avatar-callout">
            <img src="/assets/mol_paramedico.png" alt="Mol Paramédico" className="float" />
            <b>Mol Paramédico dice</b>
            <p>{currentKitId === 'todos' ? 'Toca cualquier elemento para ver su guía médica.' : kit.dicoMol}</p>
          </div>
        </div>

        {/* BARRA DE PROGRESO */}
        <div className="kit-progress-card">
          <div className="kit-progress-corner-img-wrap">
            <img src="/assets/botiquin.png" alt="Botiquín" className="kit-corner-botiquin-img" />
          </div>
          <div className="kit-progress-main-content">
            <div className="progress-header">
              <div className="progress-title-meta">
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink-navy)' }}>Verificación del Botiquín</h4>
                <span className={`progress-status-badge ${percent === 100 ? 'badge-full' : percent > 0 ? 'badge-mid' : 'badge-empty'}`}>
                  {percent === 100 ? '🎉 ¡Completo!' : percent > 0 ? `⚠️ Faltan ${missingCount}` : '📋 Sin empacar'}
                </span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-signal-blue)' }}>{checkedCount} de {total} listos ({percent}%)</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
            </div>
          </div>
        </div>

        {/* HERRAMIENTAS Y FILTROS */}
        <div className="botiquin-toolbar">
          <div className="toolbar-filters">
            {['all', 'pending', 'done', 'essential'].map(f => (
              <button key={f} className={`filter-chip ${itemFilter === f ? 'active' : ''}`} onClick={() => setItemFilter(f)}>
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'done' ? 'En botiquín' : 'Esenciales'}
              </button>
            ))}
          </div>
          <div className="toolbar-actions">
            <div className="search-mini-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="search" placeholder="Filtrar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button className="btn btn-outline btn-sm" onClick={copyMissing}>📋 Copiar faltantes</button>
            <button className="btn btn-outline btn-sm" onClick={() => markAll(true)}>✓ Marcar todos</button>
            <button className="btn btn-outline btn-sm" onClick={() => markAll(false)}>✕ Limpiar</button>
          </div>
        </div>

        {/* GRID DEL CHECKLIST */}
        <div className="botiquin-checklist-grid">
          {filteredItems.length === 0 ? (
            <div className="botiquin-empty-state">
              <img src="/assets/mol_paramedico.png" alt="Mol" className="mol-empty-state float" />
              <h4>No hay elementos que coincidan</h4>
              <p>Prueba con otro filtro o borra la búsqueda.</p>
              <button className="btn btn-outline btn-sm" onClick={() => { setItemFilter('all'); setSearchTerm(''); }}>Restablecer filtros</button>
            </div>
          ) : (
            filteredItems.map(item => {
              const tagClass = item.tag === 'esencial' ? 'tag-esencial' : item.tag === 'personal' ? 'tag-personal' : 'tag-opcional';
              return (
                <div key={item.id} className={`botiquin-item-card ${item.checked ? 'item-checked' : ''}`}>
                  <div className="item-card-header">
                    <label className="custom-checkbox-wrap">
                      <input type="checkbox" checked={item.checked} onChange={() => toggleItem(item.id)} />
                      <span className="custom-checkmark"></span>
                    </label>
                    <div className="item-title-wrap">
                      <span className="item-emoji">{item.emoji}</span>
                      <div className="item-title-meta">
                        <h4 className="item-name">{item.nombre}</h4>
                        <span className="item-cant">{item.cant || ''}</span>
                      </div>
                    </div>
                    <span className={`botiquin-tag ${tagClass}`}>{item.tagLabel}</span>
                  </div>
                  <p className="item-sirve-brief">{item.sirve}</p>
                  <div className="item-card-footer">
                    <span className="item-status-text">{item.checked ? '✅ En tu botiquín' : '⭕ Pendiente'}</span>
                    <button className="btn-ficha-view" onClick={() => setSelectedItem(item)}>Ver ficha técnica →</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* SECCIÓN EMERGENCIAS */}
        <div className="emergency-section" id="sec-emergencias">
          <div className="emergency-alert-banner">
            <div className="alert-banner-content">
              <h4>🚨 Emergencias Médicas: Cuándo no basta un botiquín</h4>
              <p>Si identificas signos de alarma, solicita asistencia urgente. En Colombia, llama a la Línea 123.</p>
            </div>
            <a href="tel:123" className="btn-emergency-call">📞 Llamar al 123</a>
          </div>
          <div className="emergency-grid">
            <div className="emergency-card"><div className="emergency-card-top"><span className="emergency-card-icon">🩸</span><h5>Sangrado Abundante</h5></div><p>Si el sangrado no cede tras 5–10 minutos de presión, mantén la presión y traslada de urgencia.</p></div>
            <div className="emergency-card"><div className="emergency-card-top"><span className="emergency-card-icon">🫁</span><h5>Dificultad Respiratoria</h5></div><p>Asfixia, labios azulados o hinchazón súbita requieren atención médica inmediata.</p></div>
            <div className="emergency-card"><div className="emergency-card-top"><span className="emergency-card-icon">🧠</span><h5>Pérdida de Conciencia</h5></div><p>Desmayos prolongados, convulsiones o traumatismos craneales fuertes. Proteger y pedir ayuda.</p></div>
            <div className="emergency-card"><div className="emergency-card-top"><span className="emergency-card-icon">☀️</span><h5>Golpe de Calor</h5></div><p>Confusión, piel caliente sin sudor o náuseas severas tras sol intenso. No basta con dar agua.</p></div>
          </div>
        </div>

        {/* SECCIÓN REVISIÓN */}
        <div className="revision-section" id="sec-revision" style={{ marginTop: '40px' }}>
          <div className="revision-widget-card">
            <div className="widget-header">
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink-navy)' }}>Semáforo de Revisión</h4>
                <span style={{ fontSize: '13px', color: 'var(--color-slate-gray)' }}>Control mensual</span>
              </div>
              <span className={`rev-status-pill ${revStatus.class}`}>{revStatus.text}</span>
            </div>
            <div className="rev-input-row">
              <label>Última revisión:</label>
              <input type="date" value={lastRevision} onChange={(e) => setLastRevision(e.target.value)} />
              <button className="btn btn-outline btn-sm" onClick={() => setLastRevision(new Date().toISOString().split('T')[0])}>Revisar hoy</button>
            </div>
            <div className="rev-days-info">Han pasado {diffDays} días desde la última inspección.</div>
            <div className="rev-checklist-group">
              {BOTIQUIN_REVISIONES.map(rev => (
                <label key={rev.id} className={`rev-check-item ${revisionChecks[rev.id] ? 'rev-done' : ''}`}>
                  <input type="checkbox" checked={!!revisionChecks[rev.id]} onChange={(e) => setRevisionChecks(prev => ({ ...prev, [rev.id]: e.target.checked }))} />
                  <span className="custom-checkmark"></span>
                  <span className="rev-check-text">{rev.texto}</span>
                </label>
              ))}
            </div>
            <div className="rev-mol-callout">
              <img src="/assets/mol_paramedico.png" alt="Mol Paramédico" />
              <p>{revStatus.msg}</p>
            </div>
          </div>
        </div>

        {/* FUENTES */}
        <div className="sources-card" style={{ marginTop: '40px' }}>
          <h3 style={{ fontSize: '20px' }}>Fuentes Médicas e Institucionales</h3>
          <div className="sources-grid" style={{ marginTop: '20px' }}>
            {BOTIQUIN_FUENTES.map((f, i) => (
              <div key={i} className="source-item">
                <h5>{f.nombre}</h5>
                <p>{f.desc}</p>
                <a href={f.url} target="_blank" rel="noopener noreferrer">Visitar sitio ↗</a>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL FICHA TÉCNICA */}
      <ModalFichaBotiquin 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />
    </section>
  );
}