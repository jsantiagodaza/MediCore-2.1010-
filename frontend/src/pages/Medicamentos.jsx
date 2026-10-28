// frontend/src/pages/Medicamentos.jsx
import { useState } from 'react';
import { MEDS } from '../data/meds';

const CATEGORIAS = [
  { id: 'all', label: 'Todos' },
  { id: 'Analgésico', label: '💊 Analgésicos' },
  { id: 'Antihistamínico', label: '🔵 Antihistamínicos' },
  { id: 'Antibiótico', label: '🟣 Antibióticos' },
  { id: 'Gastroprotector', label: '🟢 Gastroprotectores' },
  { id: 'Vitamina', label: '💛 Vitaminas' },
  { id: 'Cardiovascular', label: '❤️ Cardiovascular' },
  { id: 'Respiratorio', label: '🫁 Respiratorios' },
  { id: 'Dermatológico', label: '🔴 Dermatológicos' },
];

export default function Medicamentos() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('all');

  // Lógica de filtrado (similar a tu app.js original)
  const medicamentosFiltrados = MEDS.filter((med) => {
    const coincideBusqueda = med.n.toLowerCase().includes(busqueda.toLowerCase()) || 
                             med.cat.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaActiva === 'all' || med.cat === categoriaActiva;
    return coincideBusqueda && coincideCategoria;
  });

  return (
    <section className="screen on" id="s-meds" style={{ paddingTop: '120px' }}>
      <div className="wrap">
        <div className="section-header">
          <span className="kicker"><span className="kicker-dot"></span> Catálogo Farmacéutico</span>
          <h2>Medicamentos</h2>
          <p className="lead">Consulta indicaciones, posología y precauciones clave. Toca cualquier medicamento para ver detalles completos.</p>
        </div>

        {/* Buscador */}
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

        {/* Filtros de Categoría */}
        <div className="cat-filters">
          {CATEGORIAS.map((cat) => (
            <button 
              key={cat.id}
              className={`cat-chip ${categoriaActiva === cat.id ? 'active' : ''}`}
              onClick={() => setCategoriaActiva(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid de Medicamentos */}
        <div className="med-grid">
          {medicamentosFiltrados.length === 0 ? (
            <div className="empty">
              <img src="/assets/mol.png" alt="Mol" className="mol-empty float" />
              <h4 style={{ fontSize: '18px', color: 'var(--color-ink-navy)', marginBottom: '6px' }}>No se encontraron resultados</h4>
              <p>Mol no encontró medicamentos que coincidan con tu búsqueda.</p>
              <button className="btn btn-outline btn-sm" onClick={() => { setBusqueda(''); setCategoriaActiva('all'); }}>
                Restablecer filtros
              </button>
            </div>
          ) : (
            medicamentosFiltrados.map((med, index) => (
              <button key={index} className="med" onClick={() => alert(`Aquí abriremos el modal de: ${med.n}`)}>
                <div className="med-header">
                  <span className="e">{med.e}</span>
                  <span className={`tag ${med.catCls}`}>{med.cat}</span>
                </div>
                <span className="n">{med.n}</span>
                <span className="d">{med.dose}</span>
                <span className="med-view">Ver ficha clínica →</span>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}