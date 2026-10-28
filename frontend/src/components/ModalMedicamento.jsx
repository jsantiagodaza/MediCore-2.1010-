// frontend/src/components/ModalMedicamento.jsx
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ModalMedicamento({ med, iconSrc, onClose }) {
  // Efecto para bloquear el scroll del fondo cuando el modal está abierto
  useEffect(() => {
    if (med) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [med]);

  if (!med) return null;

  // createPortal renderiza el HTML directamente en el <body>, evitando problemas de posicionamiento
  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Cerrar">✕</button>
        
        <div className="m-emoji">
          {/* Si hay icono, mostramos la imagen; si no, el emoji */}
          {iconSrc ? (
            <img src={iconSrc} alt={med.n} />
          ) : (
            <span style={{ fontSize: '48px' }}>{med.e}</span>
          )}
        </div>
        
        <h3>{med.n}</h3>
        <div style={{ marginBottom: '16px' }}>
          <span className={`tag ${med.catCls}`}>{med.cat}</span> 
          <span className="d" style={{ color: 'var(--color-slate-gray)', fontSize: '14px', marginLeft: '8px' }}>{med.dose}</span>
        </div>

        <div className="m-sec">
          <h4>¿Para qué sirve?</h4>
          <p>{med.uso}</p>
        </div>
        
        <div className="m-sec">
          <h4>Dosis común</h4>
          <p>{med.dosis}</p>
        </div>
        
        <div className="m-sec">
          <h4>¿Cuándo tomarlo?</h4>
          <p>{med.cuando}</p>
        </div>
        
        <div className="m-sec">
          <h4>Precauciones</h4>
          <ul>
            {med.prec?.map((p, index) => (
              <li key={index}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="mol-say">
          <img src="/assets/mol.png" alt="Mol" />
          <div>
            <b>Mol dice</b>
            <p>{med.dico}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body // Aquí le decimos que lo renderice en el body
  );
}