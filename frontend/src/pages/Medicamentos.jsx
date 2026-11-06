// frontend/src/pages/Medicamentos.jsx
import { useEffect, useState } from 'react';
import ModalMedicamento from '../components/ModalMedicamento';
import { fetchCategories, fetchMedicines } from '../api/medicines';

const MED_ICON_PATH = '/assets/iconos-medicamentos/';
const MED_ICONS_BY_CLASS = {
  'cat-analg': 'analgesicos.png',
  'cat-antih': 'antihistaminico.png',
  'cat-antib': 'antibiotico.png',
  'cat-gast': 'gastroprotector.png',
  'cat-vita': 'vitaminas.png',
  'cat-card': 'cardiaco.png',
  'cat-resp': 'respiratorio.png',
  'cat-derm': 'dermatologico.png'
};

const ETIQUETAS_CATEGORIA = {
  'Analgésico': '💊 Analgésicos',
  'Antihistamínico': '🔵 Antihistamínicos',
  'Antibiótico': '🟣 Antibióticos',
  'Gastroprotector': '🟢 Gastroprotectores',
  'Vitamina': '💛 Vitaminas',
  'Cardiovascular': '❤️ Cardiovascular',
  'Respiratorio': '🫁 Respiratorios',
  'Dermatológico': '🔴 Dermatológicos',
  'Antidiabético': '🩺 Antidiabéticos'
};

export default function Medicamentos() {
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('all');

  const [resultado, setResultado] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState(null);
  const [medSeleccionado, setMedSeleccionado] = useState(null);

  // NUEVO: Estado para forzar la recarga de datos al reintentar
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const temporizador = setTimeout(() => setBusquedaAplicada(busqueda), 300);
    return () => clearTimeout(temporizador);
  }, [busqueda]);

  useEffect(() => {
    const control = new AbortController();
    fetchCategories(control.signal)
      .then(setCategorias)
      .catch(() => {});
    return () => control.abort();
  }, []);

  useEffect(() => {
    const control = new AbortController();

    fetchMedicines({
      search: busquedaAplicada,
      category: categoriaActiva,
      signal: control.signal
    })
      .then((items) => {
        setResultado({
          items,
          busqueda: busquedaAplicada,
          categoria: categoriaActiva
        });
        setError(null);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setError(e.message);
        // Si hay error, limpiamos el resultado para no mezclar datos viejos
        setResultado({ items: [], busqueda: busquedaAplicada, categoria: categoriaActiva });
      });

    return () => control.abort();
  }, [busquedaAplicada, categoriaActiva, retryCount]); // NUEVO: retryCount dispara la petición

  const items = resultado?.items ?? [];
  const cargandoInicial = resultado === null && !error;
  const actualizando =
    resultado !== null &&
    (resultado.busqueda !== busquedaAplicada || resultado.categoria !== categoriaActiva);

  const restablecer = () => {
    setBusqueda('');
    setBusquedaAplicada('');
    setCategoriaActiva('all');
  };

  return (
    <section className="screen on" id="s-meds" style={{ paddingTop: '120px' }}>
      <div className="wrap">
        <div className="section-header">
          <span className="kicker"><span className="kicker-dot"></span> Catálogo Farmacéutico</span>
          <h2>Medicamentos</h2>
          <p className="lead">Consulta indicaciones, posología y precauciones clave. Toca cualquier medicamento para ver detalles completos.</p>
        </div>

        <div className="search-container">
          <div className="search-input-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              className="search"
              type="search"
              placeholder="Buscar medicamento por nombre o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="cat-filters">
          <button
            className={`cat-chip ${categoriaActiva === 'all' ? 'active' : ''}`}
            onClick={() => setCategoriaActiva('all')}
          >
            Todos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              className={`cat-chip ${categoriaActiva === cat ? 'active' : ''}`}
              onClick={() => setCategoriaActiva(cat)}
            >
              {ETIQUETAS_CATEGORIA[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* NUEVO: Interfaz de Error con botón de Reintentar */}
        {error && (
          <div className="warn" style={{ marginBottom: '20px', textAlign: 'center', maxWidth: '600px', margin: '20px auto' }}>
            <strong>No se pudo cargar el catálogo:</strong> {error}
            <br />
            <small style={{ display: 'block', marginTop: '4px', marginBottom: '12px' }}>
              Verifica que el backend esté corriendo en http://localhost:8080
            </small>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => {
                setError(null);
                setRetryCount(prev => prev + 1); // Fuerza la recarga
              }}
            >
              🔄 Reintentar conexión
            </button>
          </div>
        )}

        {cargandoInicial ? (
          <div className="empty">
            <img src="/assets/mol.png" alt="Mol" className="mol-empty float" />
            <p>Cargando catálogo...</p>
          </div>
        ) : items.length === 0 && !error ? (
          <div className="empty">
            <img src="/assets/mol.png" alt="Mol" className="mol-empty float" />
            <h4 style={{ fontSize: '18px', color: 'var(--color-ink-navy)', marginBottom: '6px' }}>No se encontraron resultados</h4>
            <p>Mol no encontró medicamentos que coincidan con tu búsqueda.</p>
            <button className="btn btn-outline btn-sm" onClick={restablecer}>
              Restablecer filtros
            </button>
          </div>
        ) : (
          // Solo mostramos la grilla si NO hay error
          !error && (
            <>
              <p className="sub" style={{ marginBottom: '12px' }}>
                {items.length} medicamento{items.length === 1 ? '' : 's'} encontrado
                {items.length === 1 ? '' : 's'}
                {actualizando ? ' · actualizando...' : ''}
              </p>
              <div className="med-grid">
                {items.map((med) => {
                  const iconFile = MED_ICONS_BY_CLASS[med.categoryClass];
                  return (
                    <button key={med.id} className="med" onClick={() => setMedSeleccionado(med)}>
                      <div className="med-header">
                        {iconFile ? (
                          <img className="e" src={`${MED_ICON_PATH}${iconFile}`} alt={med.name} />
                        ) : (
                          <span className="e">{med.emoji}</span>
                        )}
                        <span className={`tag ${med.categoryClass}`}>{med.category}</span>
                      </div>
                      <span className="n">{med.name}</span>
                      <span className="d">{med.dose}</span>
                      <span className="med-view">Ver ficha clínica →</span>
                    </button>
                  );
                })}
              </div>
            </>
          )
        )}
      </div>

      <ModalMedicamento
        med={medSeleccionado}
        iconSrc={medSeleccionado ? `${MED_ICON_PATH}${MED_ICONS_BY_CLASS[medSeleccionado.categoryClass]}` : null}
        onClose={() => setMedSeleccionado(null)}
      />
    </section>
  );
}