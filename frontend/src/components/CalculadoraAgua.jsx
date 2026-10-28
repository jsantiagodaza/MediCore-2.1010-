// frontend/src/components/CalculadoraAgua.jsx
import { useState, useEffect } from 'react';
import { RIEN_AGUA, CIUDADES_IDEAM, FUNCIONES_AGUA, ESCALA_ORINA, FUENTES_AGUA } from '../data/agua';

const getTodayKey = () => {
  const d = new Date();
  return `medicore_vasos_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function CalculadoraAgua() {
  // Estado del formulario
  const [form, setForm] = useState({
    edad: '19-50',
    sexo: 'f',
    ciudad: 'bogota',
    actividad: 'bajo',
    ejercicio: '0',
    calor: 'rara',
    condicion: 'ninguna',
    peso: ''
  });

  // Estado del resultado
  const [resultado, setResultado] = useState(null);
  
  // Estado del rastreador de vasos (guardado en localStorage)
  const [vasosTomados, setVasosTomados] = useState(0);

  // Cargar vasos del día al iniciar
  useEffect(() => {
    const saved = parseInt(localStorage.getItem(getTodayKey()) || '0', 10);
    setVasosTomados(saved);
  }, []);

  // Guardar vasos cuando cambien
  const updateVasos = (count) => {
    setVasosTomados(count);
    localStorage.setItem(getTodayKey(), count.toString());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Lógica especial: si elige embarazo/lactancia, forzar sexo femenino
    if (name === 'condicion' && (value === 'embarazo' || value === 'lactancia')) {
      setForm(prev => ({ ...prev, sexo: 'f' }));
    }
  };

  const calcularHidratacion = (e) => {
    e.preventDefault();
    const { edad, sexo, ciudad, actividad, ejercicio, calor, condicion, peso } = form;
    const cityData = CIUDADES_IDEAM[ciudad] || CIUDADES_IDEAM.bogota;

    let baseRien;
    let esPediatrico = false;

    // 1. Selección de referencia base
    if (edad === 'menor14') {
      esPediatrico = true;
      baseRien = { total: 2.0, bebidas: 1.6, vasos: 6, label: 'Menores de 14 años (pediátrico)' };
    } else if (condicion === 'embarazo') {
      baseRien = RIEN_AGUA.embarazo;
    } else if (condicion === 'lactancia') {
      baseRien = RIEN_AGUA.lactancia;
    } else if (edad === '14-18') {
      baseRien = sexo === 'm' ? RIEN_AGUA.hombres_14_18 : RIEN_AGUA.mujeres_14_18;
    } else {
      baseRien = sexo === 'm' ? RIEN_AGUA.hombres_19_mas : RIEN_AGUA.mujeres_19_mas;
    }

    // 2. Factores contextuales
    const esClimaCalido = cityData.tempPromedio >= 26 || calor === 'frecuente' || cityData.tipoClima.includes('calido');
    const haceEjercicio = ejercicio === '30-60' || ejercicio === '>60' || actividad === 'alto';
    const tieneRestriccion = condicion === 'restriccion';

    setResultado({
      litrosBebidas: baseRien.bebidas.toFixed(1).replace('.', ','),
      litrosTotal: baseRien.total.toFixed(1).replace('.', ','),
      vasos: baseRien.vasos,
      label: baseRien.label,
      ciudad: cityData,
      esClimaCalido,
      haceEjercicio,
      tieneRestriccion,
      esPediatrico
    });

    // Reiniciar los vasos si se calcula de nuevo (opcional, pero útil)
    updateVasos(0);
  };

  // Renderizar el contexto (lógica extraída de tu agua.js)
  const getContexto = () => {
    if (!resultado) return {};
    const { esPediatrico, tieneRestriccion, esClimaCalido, haceEjercicio, ciudad } = resultado;

    if (esPediatrico) return {
      img: '/assets/mol_toma_agua.png', badge: '👶 Orientación pediátrica', badgeClass: 'badge-mid',
      texto: 'En niños menores de 14 años las necesidades de hidratación cambian rápidamente con la edad, el peso y la actividad. Consulta siempre con el pediatra.',
      mol: '¡Los niños suelen olvidarse de beber agua cuando están jugando! Ofréceles agua fresca con frecuencia.'
    };
    if (tieneRestriccion) return {
      img: '/assets/mol_paramedico.png', badge: '⚠️ Restricción Médica Prioritaria', badgeClass: 'badge-empty',
      texto: 'Si tu médico te indicó un límite estricto de líquidos diarios debido a enfermedad renal o cardíaca, esa indicación clínica prevalece sobre cualquier cálculo general.',
      mol: 'Tu salud es lo primero: sigue estrictamente la cantidad exacta que te indicó tu médico.'
    };
    if (esClimaCalido && haceEjercicio) return {
      img: '/assets/mol-calorcito.png', badge: `🔥 Calor Intenso + Esfuerzo (${ciudad.tempPromedio} °C)`, badgeClass: 'badge-full',
      texto: `En ${ciudad.nombre}, con ${ciudad.tempPromedio} °C y ejercicio habitual, las pérdidas por transpiración son altas. Aumenta la atención a beber agua antes, durante y después del esfuerzo.`,
      mol: '¡Uf, qué calor y qué buen entreno! Bebe pequeños sorbos cada 15 a 20 minutos durante el ejercicio.'
    };
    if (esClimaCalido) return {
      img: '/assets/mol-calorcito.png', badge: `☀️ Clima Cálido (${ciudad.tempPromedio} °C)`, badgeClass: 'badge-full',
      texto: `${ciudad.contexto} En climas cálidos el cuerpo utiliza la sudoración para enfriarse. Tu necesidad de líquidos puede ser superior al valor base.`,
      mol: 'En ciudades calurosas como esta, lleva siempre una botella reutilizable contigo.'
    };
    if (haceEjercicio) return {
      img: '/assets/rendimineto-fisico-agua.png', badge: '🏃 Actividad Física Regular', badgeClass: 'badge-good',
      texto: 'El ejercicio aumenta las demandas metabólicas de agua. Bebe unos 400–500 ml unas dos horas antes de entrenar y repón líquidos al finalizar.',
      mol: '¡Buen trabajo manteniéndote activo! El agua lubrica tus articulaciones y evita calambres.'
    };
    return {
      img: '/assets/mol_toma_agua.png', badge: `🍃 Clima Moderado (${ciudad.tempPromedio} °C)`, badgeClass: 'badge-good',
      texto: `${ciudad.contexto} Cumplir tu meta de referencia de bebidas a lo largo del día te mantendrá con energía y enfoque.`,
      mol: '¡Excelente! Mantén el hábito de beber un vaso de agua al despertar y acompaña tus comidas principales.'
    };
  };

  const contexto = getContexto();

  return (
    <>
      <div className="distincion-medica-banner">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <div>
          <strong>Distinción médica importante:</strong> No existe una fórmula universal que calcule con exactitud cuánta agua necesita cualquier persona. Las necesidades varían con la actividad física, la temperatura ambiental, la alimentación y las condiciones de salud.
        </div>
      </div>

      <div className="two">
        {/* Formulario */}
        <div className="card form-card">
          <h3 style={{ marginBottom: '6px' }}>Tus datos de hidratación</h3>
          <p className="sub" style={{ marginBottom: '20px' }}>Basado en las recomendaciones poblacionales del Ministerio de Salud</p>
          <form className="form" onSubmit={calcularHidratacion}>
            <label>1. ¿Cuál es tu grupo de edad?
              <select name="edad" value={form.edad} onChange={handleChange}>
                <option value="19-50">19–50 años (Adulto)</option>
                <option value="51+">51 años o más (Adulto mayor)</option>
                <option value="14-18">14–18 años (Adolescente)</option>
                <option value="menor14">Menor de 14 años (Pediátrico)</option>
              </select>
            </label>
            <label>2. Referencia fisiológica
              <div className="radio-chip-group">
                <label className="radio-chip">
                  <input type="radio" name="sexo" value="m" checked={form.sexo === 'm'} onChange={handleChange} /> <span>Masculina</span>
                </label>
                <label className="radio-chip">
                  <input type="radio" name="sexo" value="f" checked={form.sexo === 'f'} onChange={handleChange} /> <span>Femenina</span>
                </label>
              </div>
            </label>
            <label>3. ¿En qué ciudad vives habitualmente?
              <select name="ciudad" value={form.ciudad} onChange={handleChange}>
                {Object.entries(CIUDADES_IDEAM).map(([key, c]) => (
                  <option key={key} value={key}>{c.nombre} ({c.tempPromedio} °C)</option>
                ))}
              </select>
            </label>
            <label>4. Nivel de actividad
              <select name="actividad" value={form.actividad} onChange={handleChange}>
                <option value="bajo">Bajo: principalmente sentado</option>
                <option value="moderado">Moderado: caminatas frecuentes</option>
                <option value="alto">Alto: trabajo físico intenso</option>
              </select>
            </label>
            <label>5. Tiempo de ejercicio diario
              <select name="ejercicio" value={form.ejercicio} onChange={handleChange}>
                <option value="0">No hago ejercicio</option>
                <option value="<30">Menos de 30 minutos</option>
                <option value="30-60">30 a 60 minutos</option>
                <option value=">60">Más de 60 minutos</option>
              </select>
            </label>
            <label>6. Condición médica especial
              <select name="condicion" value={form.condicion} onChange={handleChange}>
                <option value="ninguna">Ninguna conocida</option>
                <option value="embarazo">Embarazo</option>
                <option value="lactancia">Lactancia</option>
                <option value="restriccion">Enfermedad renal/cardíaca o restricción de líquidos</option>
              </select>
            </label>
            <button type="submit" className="btn btn-primary full" style={{ marginTop: '10px' }}>
              Calcular mi Hidratación Diaria
            </button>
          </form>
        </div>

        {/* Resultados */}
        <div className="showcase-container">
          <div className="blob blob-cyan"></div>
          
          {!resultado ? (
            <div className="card center">
              <img src="/assets/mol-toma-agua.png" alt="Mol" className="mol-md float" />
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Mol te acompaña a hidratarte</h3>
              <p style={{ color: 'var(--color-slate-gray)', fontSize: '15px', maxWidth: '380px', margin: '0 auto' }}>
                Completa tus datos para obtener tu objetivo de líquidos en litros y vasos.
              </p>
            </div>
          ) : (
            <div id="agua-result">
              <div className="agua-result-display-card">
                <span className="product-status-pill" style={{ marginBottom: '8px' }}>Objetivo de Bebidas Diarias</span>
                <div className="agua-big-val">{resultado.litrosBebidas} L</div>
                <div className="agua-vasos-state">≈ {resultado.vasos} vasos al día</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-slate-gray)' }}>
                  Referencia RIEN: {resultado.label}
                </div>
                <div className="agua-breakdown-box">
                  <strong>Agua total estimada:</strong> {resultado.litrosTotal} L/día. El cuerpo obtiene aprox. el 80% ({resultado.litrosBebidas} L) a través de bebidas y el 20% restante de los alimentos.
                </div>
              </div>

              {resultado.tieneRestriccion && (
                <div className="alerta-restriccion-card">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <div>
                    <h4>Atención: Restricción médica indicada</h4>
                    <p>Si padeces enfermedad renal o tienes restricción de líquidos, <strong>esa necesidad individual debe prevalecer</strong>. No aumentes tu ingesta sin consultar a tu especialista.</p>
                  </div>
                </div>
              )}

              <div className="agua-contexto-card">
                <div className="clima-badge-wrap">
                  <span className={`progress-status-badge ${contexto.badgeClass}`}>{contexto.badge}</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-slate-gray)', fontWeight: '500' }}>Fuente: IDEAM</span>
                </div>
                <h4 style={{ fontSize: '17px', marginTop: '10px', marginBottom: '6px', color: 'var(--color-ink-navy)' }}>Contexto en {resultado.ciudad.nombre}</h4>
                <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--color-ink-navy)', margin: 0 }}>{contexto.texto}</p>
              </div>

              <div className="mol-say" style={{ marginBottom: '24px' }}>
                <img src={contexto.img} alt="Mol" className="float" />
                <div>
                  <b>Mol dice</b>
                  <p>{contexto.mol}</p>
                </div>
              </div>

              {/* Rastreador de Vasos */}
              <div className="vasos-tracker-card">
                <div className="tracker-header">
                  <div>
                    <h4>Rastreador de Vasos de Hoy (250 ml)</h4>
                    <span style={{ fontSize: '13px', color: 'var(--color-slate-gray)' }}>Toca cada vaso a medida que lo tomes</span>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => updateVasos(0)}>Reiniciar</button>
                </div>
                <div className="vasos-grid">
                  {Array.from({ length: resultado.vasos }).map((_, i) => {
                    const num = i + 1;
                    const isChecked = num <= vasosTomados;
                    return (
                      <button 
                        key={num} 
                        className={`vaso-btn ${isChecked ? 'vaso-tomado' : ''}`}
                        onClick={() => updateVasos(num === vasosTomados ? num - 1 : num)}
                        title={`Vaso ${num}`}
                      >
                        <span className="vaso-icon">{isChecked ? '💧' : '🥛'}</span>
                        <span className="vaso-num">{num}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="tracker-footer">
                  <strong style={{ color: 'var(--color-signal-blue)' }}>
                    {vasosTomados} de {resultado.vasos} vasos ({(vasosTomados * 250 / 1000).toFixed(2).replace('.', ',')} L tomados)
                  </strong>
                  <span style={{ fontSize: '12.5px' }}>
                    {vasosTomados === 0 ? 'Empieza a registrar tu avance.' : vasosTomados < resultado.vasos ? '¡Buen ritmo! Sigue así.' : '🎉 ¡Felicitaciones! Has completado tu meta.'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sección Educativa */}
      <div className="agua-edu-section">
        <div className="section-header" style={{ textAlign: 'left', marginBottom: '28px' }}>
          <span className="kicker"><span className="kicker-dot"></span> Fisiología y Beneficios</span>
          <h2>¿Por qué beber agua es necesario y beneficioso?</h2>
          <p className="lead" style={{ textAlign: 'left', margin: 0 }}>Funciones vitales descritas por MedlinePlus y el impacto en tu bienestar diario.</p>
        </div>

        <div className="agua-funciones-grid">
          {FUNCIONES_AGUA.map(f => (
            <div key={f.num} className="card agua-func-card">
              <div className="func-header">
                <span className="func-badge">{f.badge}</span>
                <span className="func-num">0{f.num}</span>
              </div>
              <div className="func-body">
                <div className="func-text">
                  <h4>{f.titulo}</h4>
                  <p>{f.desc}</p>
                </div>
                <div className="func-visual">
                  <img src={`/${f.img}`} alt={f.titulo} className="func-img float" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="orina-section-card">
          <div className="section-header" style={{ textAlign: 'left', marginBottom: '8px' }}>
            <span className="kicker" style={{ background: '#fffbeb', color: '#b45309' }}><span className="kicker-dot" style={{ background: '#f59e0b' }}></span> Autoevaluación Visual</span>
            <h3>¿Qué puede ocurrir si no bebes suficiente agua?</h3>
            <p className="sub" style={{ marginTop: '6px' }}>Los primeros signos de alerta son sed, boca seca, cansancio o mareos. Puedes evaluar tu nivel observando el color de tu orina:</p>
          </div>
          <div className="orina-escala-container">
            {ESCALA_ORINA.map((item, idx) => (
              <div key={idx} className="orina-item">
                <div className="orina-sample" style={{ backgroundColor: item.color, border: `2px solid ${item.border}` }}>
                  {idx + 1}
                </div>
                <div className="orina-info">
                  <h5>{item.label}</h5>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sources-card" style={{ marginBottom: 0 }}>
          <div className="section-header" style={{ textAlign: 'left', marginBottom: '8px' }}>
            <span className="kicker"><span className="kicker-dot"></span> Documentación Oficial</span>
            <h3 style={{ fontSize: '20px' }}>Fuentes y Referencias</h3>
          </div>
          <div className="sources-grid">
            {FUENTES_AGUA.map((f, i) => (
              <div key={i} className="source-item">
                <h5>{f.titulo}</h5>
                <p>{f.desc}</p>
                <a href={f.url} target="_blank" rel="noopener noreferrer">Consultar sitio oficial ↗</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}