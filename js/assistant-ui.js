/* MediCore — UI del asistente (prototipo). Solo habla con el backend; no contiene claves. */
(function () {
  const ENDPOINT = '/api/v1/assistant/messages';
  const log = document.getElementById('log');
  const form = document.getElementById('f');
  const input = document.getElementById('q');
  const btn = document.getElementById('b');

  function add(cls, text, meta) {
    const d = document.createElement('div');
    d.className = 'msg ' + cls;
    d.textContent = text; // textContent: nunca innerHTML con texto de usuario o del modelo
    if (meta) {
      const m = document.createElement('div');
      m.className = 'meta';
      m.textContent = meta.text;
      (meta.sources || []).forEach((s) => {
        m.append(' · ');
        if (s.url) { const a = document.createElement('a'); a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = s.name; m.append(a); }
        else m.append(s.name);
      });
      d.appendChild(m);
    }
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  add('bot', 'Hola, soy el asistente informativo de MediCore (prototipo). Pregúntame sobre medicamentos del catálogo, hidratación o botiquín.');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    add('me', message);
    input.value = '';
    btn.disabled = true;
    try {
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || data.error);
      const el = add('bot' + (data.safety.level === 'emergency' ? ' emergency' : ''), data.reply, { text: 'Prototipo · ' + data.disclaimer, sources: data.sources });
      void el;
    } catch (err) {
      add('bot', 'No pude responder en este momento (' + err.message + '). Si es una emergencia, llama al 123.');
    } finally {
      btn.disabled = false;
      input.focus();
    }
  });
})();
