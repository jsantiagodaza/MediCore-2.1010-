/* ==========================================================================
   MediCore — Lógica interactiva de Hidratación (Agua por día)
   Cálculo según Resolución 3803 de 2016 (Minsalud RIEN), Clima IDEAM y MedlinePlus
   ========================================================================== */

let currentCuidaTab = 'imc'; // 'imc' o 'agua'

function getTodayKey() {
  const d = new Date();
  return `medicore_vasos_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayGlassesCount() {
  try {
    return parseInt(localStorage.getItem(getTodayKey()) || '0', 10);
  } catch (e) {
    return 0;
  }
}

function saveTodayGlassesCount(count) {
  try {
    localStorage.setItem(getTodayKey(), count.toString());
  } catch (e) {
    console.error('Error guardando contador de vasos:', e);
  }
}

/* ==========================================================================
   Inicialización y Selector de Pestañas Cuídate (IMC vs Agua)
   ========================================================================== */

function initAguaModule() {
  initCuidaTabs();
  initAguaFormEvents();
  renderFuncionesAgua();
  renderEscalaOrina();
  populateCiudadesSelect();
}

function initCuidaTabs() {
  document.querySelectorAll('[data-cuida-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchCuidaTab(btn.dataset.cuidaTab);
    });
  });
}

function switchCuidaTab(tabId) {
  currentCuidaTab = tabId;

  // Actualizar botones
  document.querySelectorAll('[data-cuida-tab]').forEach((b) => {
    b.classList.toggle('active', b.dataset.cuidaTab === tabId);
  });

  // Mostrar / ocultar paneles
  const panelImc = document.getElementById('panel-cuida-imc');
  const panelAgua = document.getElementById('panel-cuida-agua');

  if (panelImc) panelImc.hidden = tabId !== 'imc';
  if (panelAgua) panelAgua.hidden = tabId !== 'agua';

  // Actualizar mensaje de Mol en el estado global si aplica
  const molMsg = document.getElementById('mol-msg');
  if (molMsg) {
    if (tabId === 'agua') {
      molMsg.textContent = '¡El agua es vida! Calculemos cuántos líquidos necesita tu cuerpo según tu edad, clima y actividad.';
    } else {
      molMsg.textContent = 'Revisemos tu índice de masa corporal. ¡Ingresa tus datos!';
    }
  }
}

function populateCiudadesSelect() {
  const select = document.getElementById('agua-ciudad');
  if (!select) return;

  let html = '';
  Object.keys(CIUDADES_IDEAM).forEach((key) => {
    const c = CIUDADES_IDEAM[key];
    html += `<option value="${key}">${c.nombre} (${c.tempPromedio} °C)</option>`;
  });
  select.innerHTML = html;
}

/* ==========================================================================
   Eventos y Validación del Formulario de Hidratación
   ========================================================================== */

function initAguaFormEvents() {
  const btnCalc = document.getElementById('btn-calc-agua');
  if (btnCalc) {
    btnCalc.addEventListener('click', calcularHidratacion);
  }

  // Si cambia la condición médica a embarazo/lactancia, fijar sexo en femenino
  const selectCondicion = document.getElementById('agua-condicion');
  if (selectCondicion) {
    selectCondicion.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'embarazo' || val === 'lactancia') {
        const radioFem = document.querySelector('input[name="agua-sexo"][value="f"]');
        if (radioFem) radioFem.checked = true;
      }
    });
  }
}

/* ==========================================================================
   Cálculo Clínico Diferenciado (Resolución 3803 de 2016 Minsalud / RIEN)
   ========================================================================== */

function calcularHidratacion() {
  const edad = document.getElementById('agua-edad')?.value || '19-50';
  const sexo = document.querySelector('input[name="agua-sexo"]:checked')?.value || 'f';
  const ciudadKey = document.getElementById('agua-ciudad')?.value || 'bogota';
  const actividad = document.getElementById('agua-actividad')?.value || 'bajo';
  const ejercicio = document.getElementById('agua-ejercicio')?.value || '0';
  const calor = document.getElementById('agua-calor')?.value || 'rara';
  const condicion = document.getElementById('agua-condicion')?.value || 'ninguna';
  const peso = parseFloat(document.getElementById('agua-peso')?.value) || 0;

  const ciudad = CIUDADES_IDEAM[ciudadKey] || CIUDADES_IDEAM.bogota;

  // 1. Selección de referencia base poblacional según tabla RIEN
  let baseRien;
  let esEspecial = false;
  let esPediatrico = false;

  if (edad === 'menor14') {
    esPediatrico = true;
    baseRien = { total: 2.0, bebidas: 1.6, vasos: 6, label: 'Menores de 14 años (pediátrico)' };
  } else if (condicion === 'embarazo') {
    baseRien = RIEN_AGUA.embarazo;
    esEspecial = true;
  } else if (condicion === 'lactancia') {
    baseRien = RIEN_AGUA.lactancia;
    esEspecial = true;
  } else if (edad === '14-18') {
    baseRien = sexo === 'm' ? RIEN_AGUA.hombres_14_18 : RIEN_AGUA.mujeres_14_18;
  } else {
    // 19 a 50 años o 51+ años
    baseRien = sexo === 'm' ? RIEN_AGUA.hombres_19_mas : RIEN_AGUA.mujeres_19_mas;
  }

  // 2. Evaluación de factores contextuales (clima y esfuerzo físico)
  const esClimaCalido = ciudad.tempPromedio >= 26 || calor === 'frecuente' || ciudad.tipoClima.includes('calido');
  const haceEjercicioIntenso = ejercicio === '30-60' || ejercicio === '>60' || actividad === 'alto';
  const tieneRestriccion = condicion === 'restriccion';

  // Mostrar panel de resultados y ocultar placeholder
  const placeholder = document.getElementById('agua-placeholder');
  const resultPanel = document.getElementById('agua-result');
  if (placeholder) placeholder.hidden = true;
  if (resultPanel) resultPanel.hidden = false;

  // Renderizar Resultado 1: Referencia de líquidos y vasos
  const litrosBebidas = baseRien.bebidas.toFixed(1).replace('.', ',');
  const litrosTotal = baseRien.total.toFixed(1).replace('.', ',');
  const numVasos = baseRien.vasos;

  const valEl = document.getElementById('agua-val-litros');
  const vasosEl = document.getElementById('agua-val-vasos');
  const grupoLabelEl = document.getElementById('agua-grupo-label');
  const totalDescEl = document.getElementById('agua-total-desc');

  if (valEl) valEl.textContent = `${litrosBebidas} L`;
  if (vasosEl) vasosEl.textContent = `≈ ${numVasos} vasos al día`;
  if (grupoLabelEl) grupoLabelEl.textContent = `Referencia RIEN: ${baseRien.label}`;
  if (totalDescEl) {
    totalDescEl.innerHTML = `
      <strong>Agua total estimada:</strong> ${litrosTotal} L/día. El cuerpo obtiene aproximadamente el <strong>80% (${litrosBebidas} L)</strong> a través de bebidas directas (agua pura, infusiones, caldos) y el <strong>20% restante</strong> a través de la humedad de los alimentos. <em>La contribución de los alimentos ya está contemplada y no debe sumarse por segunda vez.</em>
    `;
  }

  // Renderizar Resultado 2: Contexto climático (IDEAM) y actividad
  renderContextoClimatico(ciudad, esClimaCalido, haceEjercicioIntenso, tieneRestriccion, esPediatrico);

  // Renderizar Resultado 3: Tracker interactivo de vasos
  renderTrackerVasos(numVasos);

  // Advertencia de restricción médica si aplica
  const boxRestriccion = document.getElementById('agua-box-restriccion');
  if (boxRestriccion) {
    boxRestriccion.hidden = !tieneRestriccion;
  }

  // Scroll suave al resultado
  resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderContextoClimatico(ciudad, esClimaCalido, haceEjercicio, tieneRestriccion, esPediatrico) {
  const container = document.getElementById('agua-contexto-card');
  const molImg = document.getElementById('agua-mol-avatar');
  const molSay = document.getElementById('agua-mol-say');
  if (!container) return;

  let avatarSrc = 'assets/mol_toma_agua.png';
  let badgeClima = '🌤️ Clima templado';
  let badgeClass = 'badge-good';
  let consejoClima = '';
  let consejoMol = '';

  if (esPediatrico) {
    avatarSrc = 'assets/mol_toma_agua.png';
    badgeClima = '👶 Orientación pediátrica';
    badgeClass = 'badge-mid';
    consejoClima = 'En niños menores de 14 años las necesidades de hidratación cambian rápidamente con la edad, el peso y la actividad lúdica. La meta mostrada es una guía general; consulta siempre con el pediatra.';
    consejoMol = '¡Los niños suelen olvidarse de beber agua cuando están jugando! Es importante ofrecerles agua fresca con frecuencia.';
  } else if (tieneRestriccion) {
    avatarSrc = 'assets/mol_paramedico.png';
    badgeClima = '⚠️ Restricción Médica Prioritaria';
    badgeClass = 'badge-empty';
    consejoClima = 'Si tu médico te indicó un límite estricto de líquidos diarios debido a enfermedad renal o insuficiencia cardíaca, <strong>esa indicación clínica debe prevalecer sobre cualquier cálculo general</strong>. No aumentes tu ingesta sin autorización médica.';
    consejoMol = 'Tu salud es lo primero: sigue estrictamente la cantidad exacta en mililitros que te indicó tu nefrólogo o cardiólogo.';
  } else if (esClimaCalido && haceEjercicio) {
    avatarSrc = 'assets/mol-calorcito.png';
    badgeClima = `🔥 Calor Intenso + Esfuerzo (${ciudad.tempPromedio} °C)`;
    badgeClass = 'badge-full';
    consejoClima = `En ${ciudad.nombre}, con una normal de ${ciudad.tempPromedio} °C y ejercicio habitual, las pérdidas por transpiración son altas. <strong>Aumenta la atención a beber agua antes, durante y después del esfuerzo</strong>, busca sombra y no entrenes en las horas pico de sol.`;
    consejoMol = '¡Uf, qué calor y qué buen entreno! Bebe pequeños sorbos cada 15 a 20 minutos durante el ejercicio. ¡No esperes a tener la boca seca!';
  } else if (esClimaCalido) {
    avatarSrc = 'assets/mol-calorcito.png';
    badgeClima = `☀️ Clima Cálido (${ciudad.tempPromedio} °C)`;
    badgeClass = 'badge-full';
    consejoClima = `${ciudad.contexto} En climas cálidos el cuerpo utiliza la sudoración para enfriarse. Si pasas tiempo al aire libre, tu necesidad de líquidos puede ser superior al valor base.`;
    consejoMol = 'En ciudades calurosas como esta, lleva siempre una botella reutilizable contigo. Mantente hidratado durante todo el día.';
  } else if (haceEjercicio) {
    avatarSrc = 'assets/rendimineto-fisico-agua.png';
    badgeClima = `🏃 Actividad Física Regular`;
    badgeClass = 'badge-good';
    consejoClima = `El ejercicio aumenta las demandas metabólicas de agua. Bebe unos 400–500 ml unas dos horas antes de entrenar y repón líquidos al finalizar para evitar calambres y fatiga.`;
    consejoMol = '¡Buen trabajo manteniéndote activo! El agua lubrica tus articulaciones y evita que los músculos se acambren.';
  } else {
    avatarSrc = 'assets/mol_toma_agua.png';
    badgeClima = `🍃 Clima Moderado (${ciudad.tempPromedio} °C)`;
    badgeClass = 'badge-good';
    consejoClima = `${ciudad.contexto} En este clima el cuerpo conserva mejor los líquidos. Cumplir tu meta de referencia de bebidas a lo largo del día te mantendrá con energía y enfoque.`;
    consejoMol = '¡Excelente! Mantén el hábito de beber un vaso de agua al despertar y acompaña tus comidas principales.';
  }

  // Actualizar imagen con animación
  if (molImg) {
    molImg.src = avatarSrc;
    molImg.classList.remove('pulse');
    void molImg.offsetWidth;
    molImg.classList.add('pulse');
  }

  if (molSay) molSay.textContent = consejoMol;

  container.innerHTML = `
    <div class="clima-badge-wrap">
      <span class="progress-status-badge ${badgeClass}">${badgeClima}</span>
      <span style="font-size: 13px; color: var(--color-slate-gray); font-weight: 500;">Fuente: IDEAM (1991–2020)</span>
    </div>
    <h4 style="font-size: 17px; margin-top: 10px; margin-bottom: 6px; color: var(--color-ink-navy);">
      Contexto en ${ciudad.nombre}
    </h4>
    <p style="font-size: 14px; line-height: 1.5; color: var(--color-ink-navy); margin: 0;">
      ${consejoClima}
    </p>
  `;
}

/* ==========================================================================
   Rastreador Interactivo de Vasos del Día
   ========================================================================== */

function renderTrackerVasos(targetVasos) {
  const container = document.getElementById('agua-vasos-tracker');
  const countDisplay = document.getElementById('agua-vasos-log-count');
  const feedbackMsg = document.getElementById('agua-vasos-feedback');
  if (!container) return;

  const currentCount = getTodayGlassesCount();

  let html = '';
  for (let i = 1; i <= targetVasos; i++) {
    const isChecked = i <= currentCount;
    html += `
      <button class="vaso-btn ${isChecked ? 'vaso-tomado' : ''}" data-vaso-num="${i}" title="Vaso ${i} (250 ml)">
        <span class="vaso-icon">${isChecked ? '💧' : '🥛'}</span>
        <span class="vaso-num">${i}</span>
      </button>
    `;
  }

  container.innerHTML = html;

  updateVasosText(currentCount, targetVasos, countDisplay, feedbackMsg);

  container.querySelectorAll('.vaso-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const num = parseInt(btn.dataset.vasoNum, 10);
      let newCount;
      if (num === getTodayGlassesCount()) {
        newCount = num - 1; // desmarcar el último
      } else {
        newCount = num; // marcar hasta este número
      }
      saveTodayGlassesCount(newCount);
      renderTrackerVasos(targetVasos);
    });
  });

  const btnReset = document.getElementById('btn-reset-vasos');
  if (btnReset) {
    btnReset.onclick = () => {
      saveTodayGlassesCount(0);
      renderTrackerVasos(targetVasos);
    };
  }
}

function updateVasosText(current, target, countDisplay, feedbackMsg) {
  if (countDisplay) {
    const ml = current * 250;
    countDisplay.textContent = `${current} de ${target} vasos (${(ml / 1000).toFixed(2).replace('.', ',')} L tomados)`;
  }

  if (feedbackMsg) {
    if (current === 0) {
      feedbackMsg.textContent = 'Toca los vasos a medida que vayas bebiendo a lo largo del día para registrar tu avance.';
    } else if (current < target) {
      const restantes = target - current;
      feedbackMsg.textContent = `¡Buen ritmo! Te faltan ${restantes} vaso${restantes > 1 ? 's' : ''} para alcanzar tu meta diaria recomendada.`;
    } else {
      feedbackMsg.textContent = '🎉 ¡Felicitaciones! Has completado tu objetivo de hidratación de hoy.';
    }
  }
}

/* ==========================================================================
   Sección Educativa: 6 Funciones del Agua y Escala de Color de Orina
   ========================================================================== */

function renderFuncionesAgua() {
  const grid = document.getElementById('agua-funciones-grid');
  if (!grid) return;

  let html = '';
  FUNCIONES_AGUA.forEach((f) => {
    html += `
      <div class="card agua-func-card">
        <div class="func-header">
          <span class="func-badge">${f.badge}</span>
          <span class="func-num">0${f.num}</span>
        </div>
        <div class="func-body">
          <div class="func-text">
            <h4>${f.titulo}</h4>
            <p>${f.desc}</p>
          </div>
          <div class="func-visual">
            <img src="${f.img}" alt="${f.titulo}" class="func-img float">
          </div>
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
}

function renderEscalaOrina() {
  const container = document.getElementById('agua-orina-escala');
  if (!container) return;

  let html = '';
  ESCALA_ORINA.forEach((item, idx) => {
    html += `
      <div class="orina-item">
        <div class="orina-sample" style="background-color: ${item.color}; border: 2px solid ${item.border};">
          <span class="orina-level">${idx + 1}</span>
        </div>
        <div class="orina-info">
          <h5>${item.label}</h5>
          <p>${item.desc}</p>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// Inicialización automática
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAguaModule);
} else {
  initAguaModule();
}

