// frontend/src/components/ModalCalendarioAlerta.jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ModalCalendarioAlerta({ alerta, onClose }) {
  const [currentDate, setCurrentDate] = useState(new Date()); 

  // Efecto para posicionar el calendario en el mes de inicio de la alerta
  useEffect(() => {
    if (alerta && alerta.startsOn) {
      // startsOn viene en formato 'YYYY-MM-DD'
      const [y, m, d] = alerta.startsOn.split('-').map(Number);
      setCurrentDate(new Date(y, m - 1, 1));
    } else {
      setCurrentDate(new Date());
    }
  }, [alerta]);

  useEffect(() => {
    if (alerta) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [alerta]);

  if (!alerta) return null;

  // Generar array de fechas afectadas entre startsOn y endsOn
  const getFechasAfectadas = () => {
    if (!alerta.startsOn || !alerta.endsOn) return [];
    
    const fechas = [];
    // Usamos T00:00:00 para evitar problemas de zona horaria
    let current = new Date(`${alerta.startsOn}T00:00:00`);
    const end = new Date(`${alerta.endsOn}T00:00:00`);

    while (current <= end) {
      // Formatear a YYYY-MM-DD
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      fechas.push(`${y}-${m}-${d}`);
      
      current.setDate(current.getDate() + 1);
    }
    return fechas;
  };

  const fechasAfectadas = getFechasAfectadas();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const emptyCells = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const getRiskColors = (nivel) => {
    switch (nivel?.toUpperCase()) {
      case 'ALTO': return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' };
      case 'MEDIO': return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      case 'BAJO': return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      default: return { bg: '#f8f9fb', color: '#476788', border: '#d4e0ed' };
    }
  };
  const risk = getRiskColors(alerta.riskLevel);

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', padding: 0 }}>
        
        <div className="calendario-header">
          <div>
            <h3 style={{ fontSize: '22px', marginBottom: '4px', color: 'var(--color-ink-navy)' }}>{alerta.title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-slate-gray)' }}>📍 {alerta.city || 'Nacional'} · {alerta.source}</p>
          </div>
          <button className="close" onClick={onClose} style={{ position: 'static' }}>✕</button>
        </div>

        <div className="calendario-body">
          <div className="calendario-month-nav">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>&lt;</button>
            <h4>{monthNames[month]} {year}</h4>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>&gt;</button>
          </div>

          {fechasAfectadas.length > 0 ? (
            <div className="calendario-grid">
              {daysOfWeek.map(day => (
                <div key={day} className="calendario-dow">{day}</div>
              ))}

              {Array.from({ length: emptyCells }).map((_, i) => (
                <div key={`empty-${i}`} className="calendario-day empty"></div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNumber = i + 1;
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                const isAffected = fechasAfectadas.includes(dateString);

                return (
                  <div 
                    key={dayNumber} 
                    className={`calendario-day ${isAffected ? 'affected' : ''}`}
                    style={isAffected ? { 
                      backgroundColor: risk.bg, 
                      color: risk.color, 
                      borderColor: risk.border 
                    } : {}}
                  >
                    <span className="calendario-day-number">{dayNumber}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty" style={{ padding: '40px 0' }}>
              <p style={{ color: 'var(--color-slate-gray)' }}>No hay fechas específicas registradas para esta alerta.</p>
            </div>
          )}

          <div className="calendario-leyenda">
            <span className="calendario-leyenda-title">Leyenda:</span>
            <div className="calendario-leyenda-item">
              <span className="calendario-leyenda-box" style={{ backgroundColor: risk.bg, border: `1px solid ${risk.border}` }}></span>
              Días afectados por esta alerta
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}