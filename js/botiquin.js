
/* ==========================================================================
   MediCore — Lógica interactiva del Botiquín Esencial
   Checklists dinámicos, cálculo de faltantes, fichas clínicas y seguimiento
   ========================================================================== */

let currentKitId = 'calle';
let currentItemFilter = 'all'; // 'all', 'pending', 'done', 'essential'
let botiquinSearchTerm = '';

// Almacenamiento local persistente
const STORAGE_KEY_CHECKED = 'medicore_botiquin_checked_v1';
const STORAGE_KEY_REVISION = 'medicore_botiquin_last_revision';
const STORAGE_KEY_REV_ITEMS = 'medicore_botiquin_rev_items';

function getCheckedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHECKED);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveCheckedState(state) {
  try {
    localStorage.setItem(STORAGE_KEY_CHECKED, JSON.stringify(state));
  } catch (e) {
    console.error('Error guardando checklist:', e);
  }
}

function getLastRevisionDate() {
  try {
    return localStorage.getItem(STORAGE_KEY_REVISION) || '';
  } catch (e) {
    return '';
  }
}

function saveLastRevisionDate(dateStr) {
  try {
    localStorage.setItem(STORAGE_KEY_REVISION, dateStr);
  } catch (e) {
    console.error('Error guardando fecha de revisión:', e);
  }
}

/* ==========================================================================
   Inicialización y renderizado del Botiquín
   ========================================================================== */

function initBotiquin() {
  renderKitNav();
  selectKit(currentKitId);
  initRevisionWidget();
  bindBotiquinEvents();
}

function renderKitNav() {
  const container = document.getElementById('botiquin-tabs');
  if (!container) return;

  const kitsKeys = Object.keys(BOTIQUIN_KITS);
  let html = '';

  kitsKeys.forEach((key) => {
    const kit = BOTIQUIN_KITS[key];
    const isAct = key === currentKitId ? 'active' : '';
    html += `
      <button class="kit-tab-btn ${isAct}" data-kit="${key}">
        <span class="tab-icon">${kit.icono}</span>
        <span class="tab-text">${kit.titulo}</span>
      </button>
    `;
  });

  // Botón para vista general de catálogo completo
  html += `
    <button class="kit-tab-btn ${currentKitId === 'todos' ? 'active' : ''}" data-kit="todos">
      <span class="tab-icon">🎒</span>
      <span class="tab-text">Catálogo Completo</span>
    </button>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.kit-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectKit(btn.dataset.kit);
    });
  });
}

function selectKit(kitId) {
  currentKitId = kitId;
  currentItemFilter = 'all';
  botiquinSearchTerm = '';

  const searchInput = document.getElementById('botiquin-item-search');
  if (searchInput) searchInput.value = '';

  // Actualizar clases de botones
  document.querySelectorAll('.kit-tab-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.kit === kitId);
  });

  // Actualizar filtros de estado
  document.querySelectorAll('.filter-chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.filter === 'all');
  });

  renderActiveKitContent();
}

function renderActiveKitContent() {
  const isAll = currentKitId === 'todos';
  const kit = isAll ? null : BOTIQUIN_KITS[currentKitId];

  // Actualizar encabezado del kit
  const titleEl = document.getElementById('kit-active-title');
  const subEl = document.getElementById('kit-active-sub');
  const descEl = document.getElementById('kit-active-desc');
  const comoLlevarEl = document.getElementById('kit-active-comollevar');
  const molMsgEl = document.getElementById('kit-mol-speech');
  const kitBannerEl = document.getElementById('kit-banner-card');

  if (titleEl) {
    titleEl.textContent = isAll ? 'Catálogo Completo de Elementos' : `${kit.icono} ${kit.titulo}`;
  }
  if (subEl) {
    subEl.textContent = isAll ? 'Todos los insumos clasificados y detallados' : kit.subtitulo;
  }
  if (descEl) {
    descEl.textContent = isAll
      ? 'Consulta los 20 elementos fundamentales de primeros auxilios, sus fichas clínicas, conservación y precauciones.'
      : kit.descripcion;
  }
  if (comoLlevarEl) {
    if (isAll) {
      comoLlevarEl.innerHTML = `<strong>Criterio editorial MediCore:</strong> Separar materiales de primeros auxilios, higiene, medicamentos OTC y tratamientos personales prescritos. Mantener en estuche limpio, cerrado y protegido de la humedad.`;
    } else {
      comoLlevarEl.innerHTML = `<strong>Cómo llevarlo:</strong> ${kit.comoLlevar}`;
    }
  }
  if (molMsgEl) {
    molMsgEl.textContent = isAll
      ? 'Aquí tienes cada producto con su ficha técnica oficial. ¡Toca cualquier elemento para ver su guía médica!'
      : kit.dicoMol;
  }

  renderChecklistGrid();
}

function getItemsForCurrentKit() {
  const checkedMap = getCheckedState();

  if (currentKitId === 'todos') {
    return BOTIQUIN_ITEMS.map((item) => ({
      ...item,
      cant: item.cantidadSugerida,
      checked: !!checkedMap[`todos_${item.id}`]
    }));
  }

  const kit = BOTIQUIN_KITS[currentKitId];
  if (!kit) return [];

  return kit.items.map((kItem) => {
    const full = BOTIQUIN_ITEMS.find((i) => i.id === kItem.id) || {
      id: kItem.id,
      nombre: kItem.id,
      emoji: '🩹',
      catLabel: 'Curaciones',
      sirve: '',
      tag: kItem.tag,
      tagLabel: kItem.tag === 'esencial' ? 'Esencial' : kItem.tag === 'personal' ? 'Personal' : 'Recomendado'
    };

    return {
      ...full,
      cant: kItem.cant,
      tag: kItem.tag || full.tag,
      tagLabel: kItem.tag === 'esencial' ? 'Esencial' : kItem.tag === 'personal' ? 'Personal' : 'Recomendado',
      checked: !!checkedMap[`${currentKitId}_${full.id}`]
    };
  });
}

function renderChecklistGrid() {
  const grid = document.getElementById('botiquin-checklist-grid');
  const progressWrap = document.getElementById('kit-progress-card');
  if (!grid) return;

  const allKitItems = getItemsForCurrentKit();

  // Calcular métricas de progreso
  const total = allKitItems.length;
  const checkedCount = allKitItems.filter((i) => i.checked).length;
  const essentialItems = allKitItems.filter((i) => i.tag === 'esencial');
  const essentialChecked = essentialItems.filter((i) => i.checked).length;
  const missingCount = total - checkedCount;
  const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

  // Actualizar barra de progreso y estado
  updateProgressDisplay(total, checkedCount, missingCount, percent, essentialItems.length, essentialChecked);

  // Filtrado de elementos
  let filtered = allKitItems.filter((item) => {
    // Filtro por término de búsqueda
    if (botiquinSearchTerm) {
      const q = botiquinSearchTerm.toLowerCase();
      const matchName = item.nombre.toLowerCase().includes(q);
      const matchSirve = item.sirve && item.sirve.toLowerCase().includes(q);
      const matchCat = item.catLabel && item.catLabel.toLowerCase().includes(q);
      if (!matchName && !matchSirve && !matchCat) return false;
    }

    // Filtro por chip
    if (currentItemFilter === 'pending') return !item.checked;
    if (currentItemFilter === 'done') return item.checked;
    if (currentItemFilter === 'essential') return item.tag === 'esencial';
    return true;
  });

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="botiquin-empty-state">
        <img src="assets/mol_paramedico.png" alt="Mol Paramédico" class="mol-empty-state float">
        <h4>No hay elementos que coincidan con este filtro</h4>
        <p>Prueba seleccionando "Todos los elementos" o borra el término de búsqueda.</p>
        <button class="btn btn-outline btn-sm" id="btn-reset-botiquin-filter">Restablecer filtros</button>
      </div>
    `;
    const btnReset = document.getElementById('btn-reset-botiquin-filter');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        currentItemFilter = 'all';
        botiquinSearchTerm = '';
        const input = document.getElementById('botiquin-item-search');
        if (input) input.value = '';
        document.querySelectorAll('.filter-chip').forEach((c) => {
          c.classList.toggle('active', c.dataset.filter === 'all');
        });
        renderChecklistGrid();
      });
    }
    return;
  }

  let html = '';
  filtered.forEach((item) => {
    const isChecked = item.checked;
    const tagClass = item.tag === 'esencial' ? 'tag-esencial' : item.tag === 'personal' ? 'tag-personal' : 'tag-opcional';

    html += `
      <div class="botiquin-item-card ${isChecked ? 'item-checked' : ''}" data-item-id="${item.id}">
        <div class="item-card-header">
          <label class="custom-checkbox-wrap" title="${isChecked ? 'Marcar como pendiente' : 'Marcar como empacado'}">
            <input type="checkbox" class="botiquin-item-chk" data-item-id="${item.id}" ${isChecked ? 'checked' : ''}>
            <span class="custom-checkmark"></span>
          </label>
          <div class="item-title-wrap">
            <span class="item-emoji">${item.emoji}</span>
            <div class="item-title-meta">
              <h4 class="item-name">${item.nombre}</h4>
              <span class="item-cant">${item.cant || ''}</span>
            </div>
          </div>
          <span class="botiquin-tag ${tagClass}">${item.tagLabel}</span>
        </div>

        <p class="item-sirve-brief">${item.sirve}</p>

        <div class="item-card-footer">
          <span class="item-status-text">
            ${isChecked ? '✅ En tu botiquín' : '⭕ Pendiente de empacar'}
          </span>
          <button class="btn-ficha-view" data-open-ficha="${item.id}">
            Ver ficha técnica →
          </button>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;

  // Event listeners para checkboxes
  grid.querySelectorAll('.botiquin-item-chk').forEach((chk) => {
    chk.addEventListener('change', (e) => {
      const itemId = e.target.dataset.itemId;
      toggleItemChecked(itemId, e.target.checked);
    });
  });

  // Event listeners para abrir ficha médica
  grid.querySelectorAll('[data-open-ficha]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openFichaModal(btn.dataset.openFicha);
    });
  });
}

function updateProgressDisplay(total, checkedCount, missingCount, percent, essentialTotal, essentialChecked) {
  const bar = document.getElementById('kit-progress-bar');
  const countText = document.getElementById('kit-progress-count');
  const badgeText = document.getElementById('kit-progress-badge');
  const molTip = document.getElementById('kit-progress-mol-tip');

  if (bar) {
    bar.style.width = `${percent}%`;
  }
  if (countText) {
    countText.textContent = `${checkedCount} de ${total} elementos listos (${percent}%)`;
  }

  if (badgeText) {
    if (percent === 100) {
      badgeText.className = 'progress-status-badge badge-full';
      badgeText.innerHTML = '🎉 ¡Botiquín 100% equipado!';
    } else if (essentialChecked === essentialTotal && essentialTotal > 0) {
      badgeText.className = 'progress-status-badge badge-good';
      badgeText.innerHTML = '🛡️ Esenciales listos';
    } else if (percent > 0) {
      badgeText.className = 'progress-status-badge badge-mid';
      badgeText.innerHTML = `⚠️ Faltan ${missingCount} elementos`;
    } else {
      badgeText.className = 'progress-status-badge badge-empty';
      badgeText.innerHTML = '📋 Sin empacar aún';
    }
  }

  if (molTip) {
    if (percent === 100) {
      molTip.textContent = '¡Excelente trabajo! Este botiquín está completamente preparado para cualquier eventualidad.';
    } else if (missingCount > 0) {
      molTip.textContent = `Tienes ${missingCount} elemento${missingCount > 1 ? 's' : ''} pendiente${missingCount > 1 ? 's' : ''}. Asegúrate de priorizar los marcados como "Esencial".`;
    } else {
      molTip.textContent = 'Marca los elementos a medida que los vayas guardando en tu estuche.';
    }
  }
}

function toggleItemChecked(itemId, isChecked) {
  const checkedMap = getCheckedState();
  const key = `${currentKitId}_${itemId}`;

  if (isChecked) {
    checkedMap[key] = true;
  } else {
    delete checkedMap[key];
  }

  saveCheckedState(checkedMap);
  renderChecklistGrid();
}

function markAllCurrentKit(setDone) {
  const checkedMap = getCheckedState();
  const items = getItemsForCurrentKit();

  items.forEach((item) => {
    const key = `${currentKitId}_${item.id}`;
    if (setDone) {
      checkedMap[key] = true;
    } else {
      delete checkedMap[key];
    }
  });

  saveCheckedState(checkedMap);
  renderChecklistGrid();
}

/* ==========================================================================
   Copiar lista de faltantes al portapapeles
   ========================================================================== */

function copyMissingListToClipboard() {
  const items = getItemsForCurrentKit();
  const missing = items.filter((i) => !i.checked);

  if (!missing.length) {
    showToast('¡No tienes elementos pendientes! Tu botiquín está completo.');
    return;
  }

  const kitName = currentKitId === 'todos' ? 'Botiquín General' : BOTIQUIN_KITS[currentKitId].titulo;
  let text = `📋 LISTA DE FALTANTES — ${kitName.toUpperCase()} (MediCore)\n`;
  text += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;

  missing.forEach((m, idx) => {
    text += `${idx + 1}. [ ] ${m.nombre} (${m.cant || m.tagLabel})\n`;
    text += `   Función: ${m.sirve}\n`;
  });

  text += `\nGenerado con MediCore · Botiquín Esencial con Mol Paramédico.`;

  navigator.clipboard.writeText(text).then(() => {
    showToast(`✅ Se copiaron ${missing.length} elementos pendientes al portapapeles`);
  }).catch(() => {
    showToast('⚠️ No se pudo copiar automáticamente. Revisa los permisos del navegador.');
  });
}

function showToast(msg) {
  let toast = document.getElementById('botiquin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'botiquin-toast';
    toast.className = 'botiquin-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3200);
}

/* ==========================================================================
   Ficha Médica Modal (Detalle clínico según documento oficial)
   ========================================================================== */

function openFichaModal(itemId) {
  const item = BOTIQUIN_ITEMS.find((i) => i.id === itemId);
  if (!item) return;

  const modal = document.getElementById('modal-ficha-botiquin');
  if (!modal) return;

  document.getElementById('ficha-emoji').textContent = item.emoji;
  document.getElementById('ficha-nombre').textContent = item.nombre;
  document.getElementById('ficha-cat').textContent = item.catLabel;

  const tagEl = document.getElementById('ficha-tag');
  if (tagEl) {
    tagEl.textContent = item.tagLabel;
    tagEl.className = `botiquin-tag ${item.tag === 'esencial' ? 'tag-esencial' : item.tag === 'personal' ? 'tag-personal' : 'tag-opcional'}`;
  }

  document.getElementById('ficha-sirve').textContent = item.sirve;
  document.getElementById('ficha-cuando').textContent = item.cuando;
  document.getElementById('ficha-conservacion').textContent = item.conservacion;
  document.getElementById('ficha-precaucion').textContent = item.precaucion;

  const fuenteEl = document.getElementById('ficha-fuente');
  if (fuenteEl) {
    fuenteEl.innerHTML = `<a href="${item.fuenteUrl}" target="_blank" rel="noopener noreferrer">${item.fuente} ↗</a>`;
  }

  document.getElementById('ficha-mol-msg').textContent = item.mol;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeFichaModal() {
  const modal = document.getElementById('modal-ficha-botiquin');
  if (modal) {
    modal.hidden = true;
    document.body.style.overflow = '';
  }
}

/* ==========================================================================
   Widget de Revisión Mensual e Inspección Periódica (Sección 5 y 7)
   ========================================================================== */

function initRevisionWidget() {
  const lastDate = getLastRevisionDate();
  const dateInput = document.getElementById('rev-last-date-input');
  if (dateInput) {
    if (lastDate) {
      dateInput.value = lastDate;
    } else {
      // Valor por defecto: hoy
      const todayIso = new Date().toISOString().split('T')[0];
      dateInput.value = todayIso;
      saveLastRevisionDate(todayIso);
    }

    dateInput.addEventListener('change', (e) => {
      saveLastRevisionDate(e.target.value);
      updateRevisionTrafficLight(e.target.value);
    });
  }

  updateRevisionTrafficLight(lastDate || new Date().toISOString().split('T')[0]);
  renderRevisionChecklist();

  const btnHoy = document.getElementById('btn-registrar-rev-hoy');
  if (btnHoy) {
    btnHoy.addEventListener('click', () => {
      const todayIso = new Date().toISOString().split('T')[0];
      if (dateInput) dateInput.value = todayIso;
      saveLastRevisionDate(todayIso);
      updateRevisionTrafficLight(todayIso);
      showToast('🎉 ¡Revisión registrada con éxito para el día de hoy!');
    });
  }
}

function updateRevisionTrafficLight(dateStr) {
  const statusEl = document.getElementById('rev-traffic-status');
  const daysEl = document.getElementById('rev-days-calc');
  const molMsg = document.getElementById('rev-mol-advice');
  if (!statusEl || !dateStr) return;

  const revDate = new Date(dateStr);
  const today = new Date();
  const diffTime = today - revDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 30 && diffDays >= 0) {
    statusEl.className = 'rev-status-pill status-ok';
    statusEl.innerHTML = '🟢 Botiquín al día';
    if (daysEl) daysEl.textContent = `Revisado hace ${diffDays === 0 ? 'hoy' : `${diffDays} días`}. Próxima revisión sugerida en ${Math.max(1, 30 - diffDays)} días.`;
    if (molMsg) molMsg.textContent = '¡Excelente hábito! Un botiquín revisado mensualmente garantiza que ningún material esté vencido en una urgencia.';
  } else if (diffDays > 30 && diffDays <= 45) {
    statusEl.className = 'rev-status-pill status-warn';
    statusEl.innerHTML = '🟡 Revisión próxima';
    if (daysEl) daysEl.textContent = `Han pasado ${diffDays} días desde la última inspección. Conviene revisar antes de tu próxima salida.`;
    if (molMsg) molMsg.textContent = 'Han pasado más de 30 días. Revisa rápidamente los vencimientos y el estado de los empaques.';
  } else {
    statusEl.className = 'rev-status-pill status-alert';
    statusEl.innerHTML = '🔴 Revisión vencida';
    if (daysEl) daysEl.textContent = `Han pasado ${diffDays} días sin registro. Puede haber productos caducados o deteriorados.`;
    if (molMsg) molMsg.textContent = '¡Alerta preventiva! Toma 5 minutos para inspeccionar tu botiquín hoy mismo con la lista de abajo.';
  }
}

function renderRevisionChecklist() {
  const container = document.getElementById('rev-checklist-container');
  if (!container) return;

  let savedChecks = {};
  try {
    savedChecks = JSON.parse(localStorage.getItem(STORAGE_KEY_REV_ITEMS) || '{}');
  } catch (e) {}

  let html = '';
  BOTIQUIN_REVISIONES.forEach((rev) => {
    const isChecked = !!savedChecks[rev.id];
    html += `
      <label class="rev-check-item ${isChecked ? 'rev-done' : ''}">
        <input type="checkbox" class="rev-checkbox" data-rev-id="${rev.id}" ${isChecked ? 'checked' : ''}>
        <span class="custom-checkmark"></span>
        <span class="rev-check-text">${rev.texto}</span>
      </label>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.rev-checkbox').forEach((chk) => {
    chk.addEventListener('change', (e) => {
      const id = e.target.dataset.revId;
      savedChecks[id] = e.target.checked;
      try {
        localStorage.setItem(STORAGE_KEY_REV_ITEMS, JSON.stringify(savedChecks));
      } catch (err) {}
      e.target.closest('.rev-check-item').classList.toggle('rev-done', e.target.checked);
    });
  });
}

/* ==========================================================================
   Asignación de Eventos Generales del Botiquín
   ========================================================================== */

function bindBotiquinEvents() {
  // Búsqueda en vivo de elementos
  const searchInput = document.getElementById('botiquin-item-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      botiquinSearchTerm = e.target.value;
      renderChecklistGrid();
    });
  }

  // Chips de filtro
  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentItemFilter = chip.dataset.filter;
      renderChecklistGrid();
    });
  });

  // Acciones en lote
  const btnMarkAll = document.getElementById('btn-mark-all');
  if (btnMarkAll) {
    btnMarkAll.addEventListener('click', () => markAllCurrentKit(true));
  }

  const btnClearAll = document.getElementById('btn-clear-all');
  if (btnClearAll) {
    btnClearAll.addEventListener('click', () => markAllCurrentKit(false));
  }

  const btnCopyMissing = document.getElementById('btn-copy-missing');
  if (btnCopyMissing) {
    btnCopyMissing.addEventListener('click', copyMissingListToClipboard);
  }

  // Modal Cerrar
  const btnCloseModal = document.getElementById('m-ficha-close');
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeFichaModal);
  }

  const modalOverlay = document.getElementById('modal-ficha-botiquin');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target.id === 'modal-ficha-botiquin') closeFichaModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFichaModal();
  });

  // Acordeón o toggles en las advertencias de emergencia
  document.querySelectorAll('.emergency-card-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.emergency-card');
      if (parent) {
        parent.classList.toggle('expanded');
      }
    });
  });
}

// Iniciar al cargar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBotiquin);
} else {
  initBotiquin();
}
