// frontend/src/components/ModalFichaBotiquin.jsx
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ModalFichaBotiquin({ item, onClose }) {
  // Evitar scroll en el fondo cuando el modal está abierto
  useEffect(() => {
    if (item) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [item]);

  if (!item) return null;

  const tagClass = item.tag === 'esencial' ? 'tag-esencial' : item.tag === 'personal' ? 'tag-personal' : 'tag-opcional';

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <button className="close" onClick={onClose} aria-label="Cerrar">✕</button>
        
        <div className="m-emoji" style={{ fontSize: '52px', marginBottom: '8px' }}>{item.emoji}</div>
        
        <div className="ficha-meta-top">
          <span className={`botiquin-tag ${tagClass}`}>{item.tagLabel}</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-slate-gray)' }}>{item.catLabel}</span>
        </div>
        
        <h3 style={{ fontSize: '26px', color: 'var(--color-ink-navy)', marginBottom: '16px' }}>{item.nombre}</h3>
        
        <div className="ficha-sec">
          <h4>¿Para qué sirve?</h4>
          <p>{item.sirve}</p>
        </div>
        <div className="ficha-sec">
          <h4>¿Cuándo llevarlo?</h4>
          <p>{item.cuando}</p>
        </div>
        <div className="ficha-sec">
          <h4>¿Cómo conservarlo?</h4>
          <p>{item.conservacion}</p>
        </div>
        <div className="ficha-sec">
          <h4>Precauciones y advertencias</h4>
          <p style={{ color: '#991b1b', fontWeight: '500' }}>{item.precaucion}</p>
        </div>
        <div className="ficha-sec">
          <h4>Fuente médica institucional</h4>
          <p style={{ fontSize: '13.5px' }}>
            <a href={item.fuenteUrl} target="_blank" rel="noopener noreferrer">{item.fuente} ↗</a>
          </p>
        </div>

        <div className="ficha-mol-box">
          <img src="/assets/mol_paramedico.png" alt="Mol Paramédico" />
          <div>
            <b>Mol Paramédico dice</b>
            <p>{item.mol}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body 
  );
}