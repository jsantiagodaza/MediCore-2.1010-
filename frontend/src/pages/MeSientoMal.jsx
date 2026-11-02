// frontend/src/pages/MeSientoMal.jsx
import { useState } from 'react';
import { SYMPTOMS, DIAGNOSES } from '../data/symptoms';

// Imágenes de Mol según el estado
const MOL_IMAGES = {
  normal: '/assets/mol.png',
  leve: '/assets/mol-verde.png',
  mod: '/assets/mol-amarillo.png',
  grave: '/assets/mol-rojo.png'
};

export default function MeSientoMal() {
  const [seleccionados, setSeleccionados] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [molMsg, setMolMsg] = useState('Dime tus síntomas, te ayudaremos a que te sientas mejor.');
  const [molImg, setMolImg] = useState(MOL_IMAGES.normal);

  const toggleSintoma = (nombre) => {
    setSeleccionados(prev => 
      prev.includes(nombre) 
        ? prev.filter(s => s !== nombre) 
        : [...prev, nombre]
    );
    setResultado(null); // Limpiar resultado previo al cambiar síntomas
  };

  const evaluarSintomas = () => {
    if (seleccionados.length === 0) {
      setMolMsg('¡Selecciona al menos un síntoma para que pueda orientarte!');
      return;
    }

    let bestMatch = null;
    let bestScore = 0;

    // Lógica de coincidencia (traída de tu app.js)
    DIAGNOSES.forEach((diag) => {
      const coincidencias = diag.cond.filter(c => seleccionados.includes(c)).length;
      const score = coincidencias / diag.cond.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = diag;
      }
    });

    if (!bestMatch || bestScore < 0.25) {
      setResultado({ tipo: 'mod', dx: 'Síntomas poco específicos', pct: 0, meta: 'No se identifica un cuadro concluyente. Si los malestares persisten, consulta a un médico.', rec: [], warn: '' });
      setMolMsg('Necesito más información para orientarte de forma más precisa.');
      setMolImg(MOL_IMAGES.mod);
      return;
    }

    const pct = Math.min(Math.round(bestScore * 100 * (0.85 + Math.random() * 0.15)), bestMatch.pct);
    
    setResultado({
      tipo: bestMatch.color,
      dx: bestMatch.dx,
      pct: pct,
      meta: `Coincidencia con tus síntomas actuales — parece tratarse de un cuadro ${bestMatch.sev}.`,
      rec_med: bestMatch.rec_med,
      rec_casa: bestMatch.rec_casa,
      warn: bestMatch.warn
    });

    setMolMsg(bestMatch.dico);
    setMolImg(MOL_IMAGES[bestMatch.color] || MOL_IMAGES.normal);
  };

  return (
    <section className="screen on" id="s-mal" style={{ paddingTop: '120px' }}>
      <div className="wrap">
        <div className="section-header">
          <span className="kicker"><span className="kicker-dot"></span> Orientación de Síntomas</span>
          <h2>Me siento mal</h2>
          <p className="lead">Indica tus síntomas para recibir un análisis de orientación clínica y saber qué medidas preventivas tomar.</p>
        </div>

        <div className="two">
          <div>
            <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
              <p className="sub">Selecciona todos los síntomas que experimentas hoy</p>
              <div className="sym-list">
                {SYMPTOMS.map((s, idx) => (
                  <button 
                    key={idx}
                    className={`sym ${seleccionados.includes(s.n) ? 'sel' : ''}`}
                    onClick={() => toggleSintoma(s.n)}
                  >
                    <span className="ic">{s.e}</span>
                    <span className="sym-name">{s.n}</span>
                    <span className="ck">{seleccionados.includes(s.n) ? '✓' : ''}</span>
                  </button>
                ))}
              </div>
              <button className="btn btn-primary full" onClick={evaluarSintomas}>
                Evaluar síntomas seleccionados
              </button>
            </div>
          </div>

          <div className="showcase-container">
            <div className="blob blob-magenta"></div>
            <div className="card center" style={{ marginBottom: '20px' }}>
              <img src={molImg} alt="Mol" className="mol-sm float" />
              <p style={{ color: 'var(--color-slate-gray)', fontSize: '15px', marginTop: '12px', fontWeight: '500' }}>
                {molMsg}
              </p>
            </div>

            {resultado && (
              <div className={`res ${resultado.tipo}`}>
                <div className="res-head">
                  <h4>{resultado.dx}</h4>
                  {resultado.pct > 0 && (
                    <span className={`tag ${resultado.tipo === 'leve' ? 'cat-gast' : resultado.tipo === 'mod' ? 'cat-vita' : 'cat-analg'}`}>
                      {resultado.pct}% coincidencia
                    </span>
                  )}
                </div>
                <p className="meta">{resultado.meta}</p>
                
                {resultado.pct > 0 && (
                  <>
                    <div className="bar"><i style={{ width: `${resultado.pct}%` }}></i></div>
                    <small>⚠️ Esto es una guía de orientación preventiva, no un diagnóstico definitivo.</small>
                  </>
                )}
              </div>
            )}

            {resultado && resultado.rec_med && (
              <div className="res" style={{ borderLeft: '5px solid var(--color-signal-blue)' }}>
                <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>Recomendaciones sugeridas</h4>
                <div className="chips">
                  {resultado.rec_med.map((r, i) => <span key={i} className="chip">💊 {r}</span>)}
                  {resultado.rec_casa.map((r, i) => <span key={i} className="chip">✅ {r}</span>)}
                </div>
                <div className="warn"><strong>Advertencia:</strong> {resultado.warn}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}