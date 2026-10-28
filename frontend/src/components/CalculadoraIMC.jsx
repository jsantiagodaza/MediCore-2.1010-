// frontend/src/components/CalculadoraIMC.jsx
import { useState } from 'react';

const IMC_RANGES = [
  { max: 18.5, label: 'Bajo peso', pct: 12, mol: '/assets/mol-amarillo.png', msg: 'Tu peso está por debajo del rango ideal. Sería recomendable consultar con un nutricionista para evaluar tu plan alimentario.' },
  { max: 25, label: 'Peso saludable', pct: 42, mol: '/assets/mol-verde.png', msg: '¡Excelente! Tu IMC se encuentra en el rango saludable normal. Mantén tus hábitos activos y equilibrados.' },
  { max: 30, label: 'Sobrepeso', pct: 66, mol: '/assets/mol-amarillo.png', msg: 'Estás un poco por encima del rango ideal. Pequeños ajustes consistentes en actividad física y nutrición generan gran impacto.' },
  { max: 35, label: 'Obesidad grado I', pct: 82, mol: '/assets/mol-rojo.png', msg: 'Te sugerimos consultar con un médico o nutricionista para recibir orientación guiada y segura.' },
  { max: Infinity, label: 'Obesidad grado II+', pct: 95, mol: '/assets/mol-rojo.png', msg: 'Es muy importante que un profesional médico evalúe tu salud integral y te brinde un acompañamiento personalizado.' }
];

export default function CalculadoraIMC() {
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [resultado, setResultado] = useState(null);

  const calcularIMC = () => {
    const p = parseFloat(peso);
    const a = parseFloat(altura) / 100;

    if (!p || !a || a <= 0) {
      alert("Por favor ingresa un peso y una altura válidos.");
      return;
    }

    const imc = Math.round((p / (a * a)) * 100) / 100;
    const rango = IMC_RANGES.find((x) => imc < x.max);
    
    setResultado({ valor: imc, ...rango });
  };

  return (
    <div className="two">
      <div className="card form-card">
        <h3 style={{ marginBottom: '20px' }}>Ingresa tus datos</h3>
        <div className="form">
          <label>Edad (años)<input type="number" placeholder="ej. 24" min="1" max="120" /></label>
          <label>Peso (kg)<input type="number" placeholder="ej. 68" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} /></label>
          <label>Altura (cm)<input type="number" placeholder="ej. 172" value={altura} onChange={(e) => setAltura(e.target.value)} /></label>
          <button className="btn btn-primary full" onClick={calcularIMC}>Calcular IMC</button>
        </div>
      </div>

      <div className="showcase-container">
        <div className="blob blob-cyan"></div>
        {!resultado ? (
          <div className="card center">
            <img src="/assets/mol.png" alt="Mol" className="mol-sm float" />
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Mol está listo</h3>
            <p style={{ color: 'var(--color-slate-gray)', fontSize: '15px' }}>Ingresa tu peso y altura en el formulario para obtener tu análisis de IMC en tiempo real.</p>
          </div>
        ) : (
          <div id="imc-result">
            <div className="card center">
              <span className="product-status-pill" style={{ marginBottom: '12px' }}>Resultado del Cálculo</span>
              <div className="big">{resultado.valor}</div>
              <div className="state">{resultado.label}</div>
              <div className="scale">
                <i style={{ left: `${resultado.pct}%`, transition: 'left 0.5s ease' }}></i>
              </div>
              <div className="scale-l">
                <span>Bajo</span><span>Normal</span><span>Sobrepeso</span><span>Obesidad</span>
              </div>
            </div>
            <div className="mol-say">
              <img src={resultado.mol} alt="Mol" />
              <div>
                <b>Mol dice</b>
                <div>{resultado.msg}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}