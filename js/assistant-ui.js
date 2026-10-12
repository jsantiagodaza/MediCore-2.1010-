/* MediCore — UI del asistente "Pregúntale a Mol" (prototipo, issue #3).
   Solo habla con el backend (POST /api/v1/assistant/messages). No contiene claves. */
(function () {
  const ENDPOINT = '/api/v1/assistant/messages';
  const $ = (id) => document.getElementById(id);
  const log = $('ast-log');
  const form = $('ast-form');
  if (!log || !form) return;
  const input = $('ast-input');
  const send = $('ast-send');
  const molImg = $('ast-mol');
  const molState = $('ast-mol-state');

  // Mol cambia de imagen según lo que pasa en la conversación
  const MOL = {
    normal: 'assets/mol_paramedico.png',
    ok: 'assets/mol-verde.png',
    warn: 'assets/mol-amarillo.png',
    alert: 'assets/mol-rojo.png',
    water: 'assets/mol-toma-agua.png'
  };
  function molFor(data) {
    if (data.safety.level === 'emergency') return ['alert', 'Esto puede ser urgente. Llama al 123.'];
    if (data.safety.level === 'refused' || data.safety.level === 'blocked') return ['warn', 'Eso no lo puedo hacer, pero te cuento qué sí.'];
    if (data.category === 'hydration') return ['water', '¡A hidratarse!'];
    if (data.category === 'first_aid_kit') return ['normal', 'Mol Paramédico al rescate.'];
    if (data.category === 'medication_info') return ['ok', 'Información general, siempre confirma con un profesional.'];
    return ['normal', 'Hola, soy Mol Paramédico. ¿En qué te ayudo?'];
  }
  function setMol(key, text) {
    molImg.src = MOL[key] || MOL.normal;
    molState.textContent = text;
  }

  function add(cls, text, meta) {
    const d = document.createElement('div');
    d.className = 'ast-msg ' + cls;
    d.textContent = text; // textContent: nunca innerHTML con texto del usuario o del modelo
    if (meta) {
      const m = document.createElement('div');
      m.className = 'ast-meta';
      m.append(meta.text);
      (meta.sources || []).forEach((s) => {
        m.append(' · ');
        if (s.url) {
          const a = document.createElement('a');
          a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = s.name;
          m.append(a);
        } else m.append(s.name);
      });
      d.appendChild(m);
    }
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  async function ask(message) {
    add('me', message);
    send.disabled = true;
    try {
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || data.error);
      add('bot' + (data.safety.level === 'emergency' ? ' emergency' : ''), data.reply, { text: 'Prototipo informativo · no es consejo médico.', sources: data.sources });
      const [key, text] = molFor(data);
      setMol(key, text);
    } catch (err) {
      add('bot', 'No pude responder ahora (' + err.message + '). ¿Abriste la app con "npm start"? Si es una emergencia, llama al 123.');
      setMol('warn', 'Algo falló con mi conexión.');
    } finally {
      send.disabled = false;
      input.focus();
    }
  }

  add('bot', 'Hola, soy Mol Paramédico 🩺 (prototipo). Puedo darte información general sobre medicamentos del catálogo, hidratación y botiquín. No diagnostico ni receto.');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    input.value = '';
    ask(message);
  });
  $('ast-chips').addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    if (q) ask(q.dataset.q);
  });
})();
