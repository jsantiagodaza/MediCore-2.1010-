/* MediCore — Lógica de la interfaz & Interacciones Calendly Design */

const MOL = {
  normal: 'assets/mol.png',
  ok: 'assets/mol-verde.png',
  warn: 'assets/mol-amarillo.png',
  alert: 'assets/mol-rojo.png'
};

const $ = (id) => document.getElementById(id);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const MED_ICON_PATH = 'assets/iconos-medicamentos/';
const MED_ICONS = {
  '💊': 'analgesicos.png',
  '🔵': 'antihistaminico.png',
  '🟣': 'antibiotico.png',
  '🟢': 'gastroprotector.png',
  '💛': 'vitaminas.png',
  '🩺': 'vitaminas.png',
  '❤️': 'cardiaco.png',
  '🫁': 'respiratorio.png',
  '🌿': 'ciertos analgesicos.png',
  '🫧': 'Respiratorios.png'
};

const MED_ICONS_BY_CLASS = {
  'cat-analg': 'analgesicos.png',
  'cat-antih': 'antihistaminico.png',
  'cat-antib': 'antibiotico.png',
  'cat-gast': 'gastroprotector.png',
  'cat-vita': 'vitaminas.png',
  'cat-card': 'cardiaco.png',
  'cat-resp': 'respiratorio.png',
  'cat-derm': 'dermatologico.png'
};

const medIcon = (med) => {
  const file = MED_ICONS[med.e] || MED_ICONS_BY_CLASS[med.catCls];
  return file ? `${MED_ICON_PATH}${file}` : null;
};

/* Quita medicamentos repetidos en los datos (conserva el primero) */
const MEDS_UNIQUE = [
  ...new Map(
    MedsRepository.getAll().map((m) => [m.n, m])
  ).values()
];

/* ---------- Navegación ---------- */
const MOL_MSGS = {
  home: '¡Hola! Estoy aquí para ayudarte con tu salud. ¿Cómo te sientes hoy?',
  meds: 'Aquí puedes ver todos los medicamentos. ¡Toca uno para saber más!',
  cuida: 'Calcula tu índice de masa corporal e hidratación diaria recomendada.',
  agua: '¡El agua es vida! Calculemos tu meta de hidratación según tu edad, clima y actividad.',
  mal: 'Dime tus síntomas y te ayudo a entender qué puede estar pasando.',
  prep: 'Explora recursos preventivos y prepara tu botiquín con Mol Paramédico.',
  botiquin: '¡Hola! Soy Mol Paramédico 🩺. Te guiaré para preparar, revisar y transportar botiquines seguros.'
};

function show(id) {
  if (id === 'agua') {
    show('cuida');
    if (typeof switchCuidaTab === 'function') {
      switchCuidaTab('agua');
    }
    return;
  }
  $$('.screen').forEach((s) => s.classList.toggle('on', s.id === 's-' + id));
  $$('.links button').forEach((b) => b.classList.toggle('on', b.dataset.go === id));
  const msgEl = $('mol-msg');
  if (msgEl) msgEl.textContent = MOL_MSGS[id] || MOL_MSGS.home;
  if (id === 'botiquin' && typeof renderActiveKitContent === 'function') {
    renderActiveKitContent();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go]');
  if (t) {
    e.preventDefault();
    show(t.dataset.go);
  }
});

/* ---------- Medicamentos & Filtros ---------- */
let currentCategory = 'all';
let currentSearch = '';

function renderMeds(filter = '') {
  currentSearch = filter.trim().toLowerCase();
  const grid = $('med-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const list = MEDS_UNIQUE.filter((m) => {
    const matchesSearch = !currentSearch ||
      m.n.toLowerCase().includes(currentSearch) ||
      m.cat.toLowerCase().includes(currentSearch) ||
      (m.uso && m.uso.toLowerCase().includes(currentSearch));

    const matchesCat = currentCategory === 'all' ||
      m.cat.toLowerCase().includes(currentCategory.toLowerCase());

    return matchesSearch && matchesCat;
  });

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty">
        <img src="assets/mol.png" alt="Mol" class="mol-empty float">
        <h4 style="font-size: 18px; color: var(--color-ink-navy); margin-bottom: 6px;">No se encontraron resultados</h4>
        <p>Mol no encontró medicamentos que coincidan con tu búsqueda.</p>
        <button class="btn btn-outline btn-sm" id="btn-reset-filters">Restablecer filtros</button>
      </div>`;
    const btnReset = $('btn-reset-filters');
    if (btnReset) {
      btnReset.onclick = () => {
        currentCategory = 'all';
        currentSearch = '';
        if ($('med-search')) $('med-search').value = '';
        $$('.cat-chip').forEach((c) => c.classList.toggle('active', c.dataset.cat === 'all'));
        renderMeds();
      };
    }
    return;
  }

  list.forEach((m) => {
    const b = document.createElement('button');
    b.className = `med stripe-${m.catCls}`;
    const icon = medIcon(m);
    b.innerHTML = `
      <div class="med-header">
        ${icon ? `<img class="e" src="${icon}" alt="${m.n}">` : `<span class="e">${m.e}</span>`}
        <span class="tag ${m.catCls}">${m.cat}</span>
      </div>
      <span class="n">${m.n}</span>
      <span class="d">${m.dose}</span>
      <span class="med-view">Ver ficha clínica →</span>
    `;
    b.onclick = () => openMed(m);
    grid.appendChild(b);
  });
}

function initCatFilters() {
  const container = $('cat-filters');
  if (!container) return;
  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.cat-chip');
    if (!chip) return;
    $$('.cat-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    currentCategory = chip.dataset.cat || 'all';
    renderMeds($('med-search')?.value || '');
  });
}

function openMed(m) {
  const icon = medIcon(m);
  $('m-emoji').innerHTML = icon ? `<img src="${icon}" alt="${m.n}">` : `<span style="font-size: 48px;">${m.e}</span>`;
  $('m-name').textContent = m.n;
  $('m-cat').innerHTML = `<span class="tag ${m.catCls}">${m.cat}</span> <span class="d" style="color:var(--color-slate-gray);font-size:14px;margin-left:8px">${m.dose}</span>`;
  $('m-uso').textContent = m.uso;
  $('m-dosis').textContent = m.dosis;
  $('m-cuando').textContent = m.cuando;
  $('m-prec').innerHTML = (m.prec || []).map((p) => `<li>${p}</li>`).join('');
  $('m-mol').textContent = m.dico;
  $('modal').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('modal').hidden = true;
  document.body.style.overflow = '';
}

$('m-close').onclick = closeModal;
$('modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal') closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

const searchInput = $('med-search');
if (searchInput) {
  searchInput.addEventListener('input', (e) => renderMeds(e.target.value));
}

/* ---------- Síntomas ---------- */
function renderSymptoms() {
  const list = $('symptom-list');
  if (!list) return;
  list.innerHTML = '';
  SYMPTOMS.forEach((s) => {
    const b = document.createElement('button');
    b.className = 'sym';
    b.dataset.name = s.n;
    b.innerHTML = `
      <span class="ic">${s.e}</span>
      <span class="sym-name">${s.n}</span>
      <span class="ck"></span>
    `;
    b.onclick = () => {
      b.classList.toggle('sel');
      const ck = b.querySelector('.ck');
      if (ck) ck.textContent = b.classList.contains('sel') ? '✓' : '';
      updateMolMal();
    };
    list.appendChild(b);
  });
}

function setMolMal(src, msg) {
  const img = $('mol-mal-img');
  if (!img) return;
  if (!img.src.endsWith(src)) {
    img.src = src;
    img.classList.remove('pulse');
    void img.offsetWidth;
    img.classList.add('pulse');
  }
  const msgEl = $('mol-mal-msg');
  if (msgEl) msgEl.textContent = msg;
}

function updateMolMal() {
  const n = $$('.sym.sel').length;
  if (n === 0) {
    setMolMal(MOL.normal, 'Dime tus síntomas, te ayudaremos a que te sientas mejor.');
  } else if (n <= 2) {
    setMolMal(MOL.normal, `Ya veo, has seleccionado ${n} síntoma${n > 1 ? 's' : ''}. ¿Hay algo más que sientas?`);
  } else {
    setMolMal(MOL.warn, `Con ${n} síntomas podemos realizar una buena evaluación. ¡Presiona el botón cuando estés listo!`);
  }
}

function evaluarSintomas() {
  const sel = $$('.sym.sel').map((b) => b.dataset.name);
  const panel = $('result-panel');
  if (!panel) return;

  if (!sel.length) {
    setMolMal(MOL.normal, '¡Selecciona al menos un síntoma para que pueda orientarte!');
    return;
  }

  let best = null, bestScore = 0;
  DIAGNOSES.forEach((d) => {
    const score = d.cond.filter((c) => sel.includes(c)).length / d.cond.length;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  });

  if (!best || bestScore < 0.25) {
    panel.innerHTML = `
      <div class="res mod">
        <h4>Síntomas poco específicos</h4>
        <p class="meta">No se identifica un cuadro concluyente con lo seleccionado. Si los malestares persisten o empeoran, consulta con un profesional de la salud.</p>
      </div>`;
    setMolMal(MOL.warn, 'Necesito más información para orientarte de forma más precisa.');
    return;
  }

  const pct = Math.min(Math.round(bestScore * 100 * (0.85 + Math.random() * 0.15)), best.pct);
  const cls = best.color;
  const molImg = cls === 'leve' ? MOL.ok : cls === 'mod' ? MOL.warn : MOL.alert;
  const sev = cls === 'leve' ? 'algo leve' : cls === 'mod' ? 'un cuadro moderado' : 'un cuadro que requiere pronta atención';

  setMolMal(molImg, best.dico);

  panel.innerHTML = `
    <div class="res ${cls}">
      <div class="res-head">
        <h4>${best.dx}</h4>
        <span class="tag ${cls === 'leve' ? 'cat-gast' : cls === 'mod' ? 'cat-vita' : 'cat-analg'}">${pct}% coincidencia</span>
      </div>
      <p class="meta">Coincidencia con tus síntomas actuales — parece tratarse de <strong>${sev}</strong>.</p>
      <div class="bar"><i id="pct-anim"></i></div>
      <small>⚠️ Esto es una guía de orientación preventiva, no un diagnóstico definitivo.</small>
    </div>
    <div class="res" style="border-left: 5px solid var(--color-signal-blue);">
      <h4 style="font-size: 18px; margin-bottom: 8px;">Recomendaciones sugeridas</h4>
      <div class="chips">
        ${best.rec_med.map((r) => `<span class="chip">💊 ${r}</span>`).join('')}
        ${best.rec_casa.map((r) => `<span class="chip">✅ ${r}</span>`).join('')}
      </div>
      <div class="warn"><strong>Advertencia:</strong> ${best.warn}</div>
    </div>`;

  requestAnimationFrame(() => {
    setTimeout(() => {
      const animEl = $('pct-anim');
      if (animEl) animEl.style.width = pct + '%';
    }, 60);
  });

  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

const btnEval = $('btn-eval');
if (btnEval) btnEval.onclick = evaluarSintomas;

/* ---------- IMC ---------- */
const IMC_RANGES = [
  { max: 18.5, label: 'Bajo peso', pct: 12, mol: MOL.warn, msg: 'Tu peso está por debajo del rango ideal. Sería recomendable consultar con un nutricionista para evaluar tu plan alimentario.' },
  { max: 25, label: 'Peso saludable', pct: 42, mol: MOL.ok, msg: '¡Excelente! Tu IMC se encuentra en el rango saludable normal. Mantén tus hábitos activos y equilibrados.' },
  { max: 30, label: 'Sobrepeso', pct: 66, mol: MOL.warn, msg: 'Estás un poco por encima del rango ideal. Pequeños ajustes consistentes en actividad física y nutrición generan gran impacto.' },
  { max: 35, label: 'Obesidad grado I', pct: 82, mol: MOL.alert, msg: 'Te sugerimos consultar con un médico o nutricionista para recibir orientación guiada y segura.' },
  { max: Infinity, label: 'Obesidad grado II+', pct: 95, mol: MOL.alert, msg: 'Es muy importante que un profesional médico evalúe tu salud integral y te brinde un acompañamiento personalizado.' }
];

function calcIMC() {
  const peso = parseFloat($('imc-peso').value);
  const altura = parseFloat($('imc-altura').value) / 100;

  if (!peso || !altura || altura <= 0) {
    const molMsg = $('mol-msg');
    if (molMsg) molMsg.textContent = 'Por favor ingresa un peso y una altura válidos.';
    $('imc-peso').focus();
    return;
  }

  const imc = Math.round((peso / (altura * altura)) * 100) / 100;
  const r = IMC_RANGES.find((x) => imc < x.max);

  $('imc-placeholder').hidden = true;
  $('imc-result').hidden = false;
  $('imc-val').textContent = imc;
  $('imc-label').textContent = r.label;

  const marker = $('imc-marker');
  marker.style.left = '0%';
  requestAnimationFrame(() => {
    setTimeout(() => {
      marker.style.left = r.pct + '%';
    }, 60);
  });

  $('imc-mol').innerHTML = `
    <img src="${r.mol}" alt="Mol">
    <div>
      <b>Mol dice</b>
      <div>${r.msg}</div>
    </div>`;

  const molMsg = $('mol-msg');
  if (molMsg) molMsg.textContent = `Tu IMC es ${imc} (${r.label}).`;
}

const btnImc = $('btn-imc');
if (btnImc) btnImc.onclick = calcIMC;

/* ---------- Inicialización ---------- */
renderMeds();
initCatFilters();
renderSymptoms();
