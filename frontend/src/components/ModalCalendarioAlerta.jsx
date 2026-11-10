// frontend/src/components/ModalCalendarioAlerta.jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ModalCalendarioAlerta({ alerta, onClose }) {
  // Iniciamos en el mes actual por defecto
  const [currentDate, setCurrentDate] = useState(new Date()); 

  // Efecto para posicionar el calendario en el mes de la alerta automáticamente
  useEffect(() => {
    if (alerta && alerta.fechasAfectadas && alerta.fechasAfectadas.length > 0) {
      // Ordenamos las fechas para encontrar la primera
      const sortedDates = [...alerta.fechasAfectadas].sort();
      const firstDateStr = sortedDates[0]; // Formato YYYY-MM-DD
      const [y, m, d] = firstDateStr.split('-').map(Number);
      // m - 1 porque en JS los meses van de 0 a 11
      setCurrentDate(new Date(y, m - 1, 1));
    } else {
      // Si no hay fechas, volvemos a Noviembre 2026 (mes de nuestros mocks)
      setCurrentDate(new Date(2026, 10, 1));
    }
  }, [alerta]);

  useEffect(() => {
    if (alerta) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [alerta]);

  if (!alerta) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Ajustamos para que la semana empiece en Lunes (0 = Lunes, 6 = Domingo)
  const emptyCells = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const getRiskColors = (nivel) => {
    switch (nivel) {
      case 'alto': return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' };
      case 'medio': return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      case 'bajo': return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      default: return { bg: '#f8f9fb', color: '#476788', border: '#d4e0ed' };
    }
  };
  const risk = getRiskColors(alerta.nivelRiesgo);

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', padding: 0 }}>
        
        <div className="calendario-header">
          <div>
            <h3 style={{ fontSize: '22px', marginBottom: '4px', color: 'var(--color-ink-navy)' }}>{alerta.titulo}</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-slate-gray)' }}>📍 {alerta.ciudad} · {alerta.fuente}</p>
          </div>
          <button className="close" onClick={onClose} style={{ position: 'static' }}>✕</button>
        </div>

        <div className="calendario-body">
          <div className="calendario-month-nav">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>&lt;</button>
            <h4>{monthNames[month]} {year}</h4>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>&gt;</button>
          </div>

          {alerta.fechasAfectadas && alerta.fechasAfectadas.length > 0 ? (
            <div className="calendario-grid">
              {daysOfWeek.map(day => (
                <div key={day} className="calendario-dow">{day}</div>
              ))}

              {/* Celdas vacías invisibles */}
              {Array.from({ length: emptyCells }).map((_, i) => (
                <div key={`empty-${i}`} className="calendario-day calendario-day--vacio"></div>
              ))}

              {/* Días del mes */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNumber = i + 1;
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                const isAffected = alerta.fechasAfectadas?.includes(dateString);

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
            <div className="calendario-leyenda-item">
              <span className="calendario-leyenda-box" style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-hairline)' }}></span>
              Días sin alerta
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}