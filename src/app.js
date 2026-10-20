/**
 * INVENTARIO DE INFRAESTRUCTURA — PREPARATORIA TONALÁ SUR
 * Lógica de inicialización, cálculo de métricas reactivas y renderizado del plano interactivo.
 */

// Importación directa del JSON para empaquetado autónomo sin fetch externo
import inventarioData from '../inventario.json';

// Estado global de la aplicación
const state = {
  data: inventarioData,
  currentLabId: 'LAB-A',
  selectedPC: null
};

// ============================================================================
// Funciones de cálculo y métricas
// ============================================================================

/**
 * Calcula todas las métricas dinámicas a partir de los datos del inventario.
 */
function calculateMetrics(data) {
  let totalPCs = 0;
  let totalAlumnos = 0;
  let totalDocentes = 0;
  const labCounts = {};
  const labBreakdown = {};

  const upsDispositivos = new Set();
  const volteckDispositivos = new Set();

  data.laboratorios.forEach((lab) => {
    let labPcCount = 0;
    let labAlumnosCount = 0;
    let labDocentesCount = 0;
    const labUps = new Set();
    const labVolteck = new Set();

    if (lab.docentePC) {
      totalPCs++;
      labPcCount++;
      totalDocentes++;
      labDocentesCount++;
    }

    lab.filas.forEach((f) => {
      const allRowPcs = [...f.izquierda, ...f.derecha];
      allRowPcs.forEach((pc) => {
        totalPCs++;
        labPcCount++;
        if (pc.rol === 'alumno') {
          totalAlumnos++;
          labAlumnosCount++;
        }

        if (pc.proteccion && pc.proteccion.dispositivoId) {
          if (pc.proteccion.tipo === 'ups_apc') {
            upsDispositivos.add(pc.proteccion.dispositivoId);
            labUps.add(pc.proteccion.dispositivoId);
          } else if (pc.proteccion.tipo === 'regulador_volteck') {
            volteckDispositivos.add(pc.proteccion.dispositivoId);
            labVolteck.add(pc.proteccion.dispositivoId);
          }
        }
      });
    });

    labCounts[lab.id] = labPcCount;
    labBreakdown[lab.id] = {
      total: labPcCount,
      alumnos: labAlumnosCount,
      docentes: labDocentesCount,
      filas: lab.filas.length,
      upsCount: labUps.size,
      volteckCount: labVolteck.size
    };
  });

  return {
    totalPCs,
    totalLabs: data.laboratorios.length,
    totalAlumnos,
    totalDocentes,
    totalUpsApc: upsDispositivos.size,
    totalVolteck: volteckDispositivos.size,
    labCounts,
    labBreakdown
  };
}

/**
 * Renderiza los indicadores numéricos del panel superior.
 */
function renderMetrics(metrics) {
  const elTotalPcs = document.getElementById('stat-total-pcs');
  const elTotalLabs = document.getElementById('stat-total-labs');
  const elPcsAlumnos = document.getElementById('stat-pcs-alumnos');
  const elPcsDocentes = document.getElementById('stat-pcs-docentes');
  const elUpsApc = document.getElementById('stat-ups-apc');
  const elRegVolteck = document.getElementById('stat-reg-volteck');

  if (elTotalPcs) elTotalPcs.textContent = metrics.totalPCs;
  if (elTotalLabs) elTotalLabs.textContent = metrics.totalLabs;
  if (elPcsAlumnos) elPcsAlumnos.textContent = metrics.totalAlumnos;
  if (elPcsDocentes) elPcsDocentes.textContent = metrics.totalDocentes;
  if (elUpsApc) elUpsApc.textContent = metrics.totalUpsApc;
  if (elRegVolteck) elRegVolteck.textContent = metrics.totalVolteck;

  // Comparativa visual
  const countA = metrics.labCounts['LAB-A'] || 0;
  const countB = metrics.labCounts['LAB-B'] || 0;
  const total = metrics.totalPCs || 1;

  const pctA = ((countA / total) * 100).toFixed(1);
  const pctB = ((countB / total) * 100).toFixed(1);

  const barA = document.getElementById('bar-lab-a');
  const barB = document.getElementById('bar-lab-b');
  const barCountA = document.getElementById('bar-count-a');
  const barCountB = document.getElementById('bar-count-b');
  const totalLabel = document.getElementById('comparative-total-label');

  if (barA) barA.style.width = `${pctA}%`;
  if (barB) barB.style.width = `${pctB}%`;
  if (barCountA) barCountA.textContent = countA;
  if (barCountB) barCountB.textContent = countB;
  if (totalLabel) totalLabel.textContent = `${total} computadoras totales`;
}

// ============================================================================
// Renderizado del Plano Arquitectónico
// ============================================================================

/**
 * Retorna la clase CSS adecuada según el tipo de protección eléctrica del PC.
 */
function getProtectionClass(pc) {
  if (pc.rol === 'docente') return 'pc-docente';
  if (pc.proteccion && pc.proteccion.tipo === 'ups_apc') return 'pc-ups';
  if (pc.proteccion && pc.proteccion.tipo === 'regulador_volteck') return 'pc-volteck';
  return '';
}

/**
 * Retorna una etiqueta corta para mostrar dentro del botón del PC.
 */
function getProtectionShortLabel(pc) {
  if (pc.rol === 'docente') return 'Docente';
  if (pc.proteccion && pc.proteccion.tipo === 'ups_apc') return 'UPS';
  if (pc.proteccion && pc.proteccion.tipo === 'regulador_volteck') return 'Volteck';
  return 'Directo';
}

/**
 * Genera el elemento de botón accesible para una estación de cómputo.
 */
function createPcButton(pc) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `pc-btn ${getProtectionClass(pc)}`;
  btn.id = `btn-${pc.laboratorio}-${pc.id}`;
  btn.setAttribute('data-pc-id', pc.id);
  btn.setAttribute('data-lab-id', pc.laboratorio);

  const isSelected = state.selectedPC && state.selectedPC.id === pc.id && state.selectedPC.laboratorio === pc.laboratorio;
  if (isSelected) {
    btn.classList.add('selected');
    btn.setAttribute('aria-pressed', 'true');
  } else {
    btn.setAttribute('aria-pressed', 'false');
  }

  const protLabel = getProtectionShortLabel(pc);
  const protName = pc.proteccion ? pc.proteccion.nombre : 'Sin dispositivo';
  btn.setAttribute(
    'aria-label',
    `Computadora ${pc.id}, ${pc.rol === 'docente' ? 'Estación docente' : 'Estación alumno'}, ${pc.fila}, ${pc.seccion}, Protección: ${protName}`
  );

  btn.innerHTML = `
    <span class="pc-id">${pc.id}</span>
    <span class="pc-sub">${protLabel}</span>
  `;

  btn.addEventListener('click', () => {
    selectPC(pc);
  });

  return btn;
}

/**
 * Agrupa una lista de 4 computadoras en 2 pares de carga eléctrica (2 PCs por dispositivo).
 */
function renderSectionPairs(pcsList) {
  const sectionContainer = document.createElement('div');
  sectionContainer.className = 'stations-section';

  // Asumimos bloques de 2 en 2
  for (let i = 0; i < pcsList.length; i += 2) {
    const pairWrapper = document.createElement('div');
    pairWrapper.className = 'pc-pair';
    pairWrapper.title = `Pareja de carga eléctrica: ${pcsList[i].id} y ${pcsList[i + 1] ? pcsList[i + 1].id : ''}`;

    pairWrapper.appendChild(createPcButton(pcsList[i]));
    if (pcsList[i + 1]) {
      pairWrapper.appendChild(createPcButton(pcsList[i + 1]));
    }

    sectionContainer.appendChild(pairWrapper);
  }

  return sectionContainer;
}

/**
 * Renderiza el plano del laboratorio activo.
 */
function renderFloorPlan() {
  const lab = state.data.laboratorios.find((l) => l.id === state.currentLabId);
  if (!lab) return;

  // Título y subtítulo del plano
  const titleEl = document.getElementById('current-lab-title');
  const subEl = document.getElementById('current-lab-subtitle');
  if (titleEl) titleEl.textContent = lab.nombre;
  if (subEl) {
    subEl.textContent = `Distribución física: ${lab.filas.length} filas &bull; Estaciones frontales y pasillo central`;
  }

  // Notificación de datos provisionales para LAB B
  const bannerEl = document.getElementById('provisional-banner');
  if (bannerEl) {
    bannerEl.style.display = (lab.id === 'LAB-B') ? 'flex' : 'none';
  }

  // Estación Docente (PC00)
  const docenteSlot = document.getElementById('docente-slot');
  if (docenteSlot) {
    docenteSlot.innerHTML = '';
    if (lab.docentePC) {
      docenteSlot.appendChild(createPcButton(lab.docentePC));
    }
  }

  // Filas de alumnos
  const rowsContainer = document.getElementById('rows-container');
  if (rowsContainer) {
    rowsContainer.innerHTML = '';

    lab.filas.forEach((fila) => {
      const rowWrapper = document.createElement('div');
      rowWrapper.className = 'row-wrapper';

      // Etiqueta de la fila (F1, F2...)
      const rowTag = document.createElement('div');
      rowTag.className = 'row-tag';
      rowTag.textContent = fila.id;
      rowTag.title = `Fila ${fila.filaNumero}`;

      // Sección Izquierda (4 PCs)
      const leftSection = renderSectionPairs(fila.izquierda);

      // Pasillo central
      const aisle = document.createElement('div');
      aisle.className = 'aisle-corridor';
      aisle.textContent = 'PASILLO';

      // Sección Derecha (4 PCs)
      const rightSection = renderSectionPairs(fila.derecha);

      rowWrapper.appendChild(rowTag);
      rowWrapper.appendChild(leftSection);
      rowWrapper.appendChild(aisle);
      rowWrapper.appendChild(rightSection);

      rowsContainer.appendChild(rowWrapper);
    });
  }

  renderLabSummary(lab);
}

/**
 * Renderiza la ficha de resumen del laboratorio activo en el panel lateral.
 */
function renderLabSummary(lab) {
  const listEl = document.getElementById('current-lab-summary-list');
  if (!listEl) return;

  const metrics = calculateMetrics(state.data);
  const info = metrics.labBreakdown[lab.id];

  listEl.innerHTML = `
    <li><span>Total de equipos:</span> <strong>${info.total} computadoras</strong></li>
    <li><span>Estaciones de alumnos:</span> <strong>${info.alumnos} PCs</strong></li>
    <li><span>Estación docente:</span> <strong>${info.docentes} PC (${lab.docentePC ? lab.docentePC.id : 'N/A'})</strong></li>
    <li><span>Filas en la sala:</span> <strong>${info.filas} filas</strong></li>
    <li><span>UPS APC:</span> <strong>${info.upsCount} unidades</strong></li>
    <li><span>Reguladores Volteck:</span> <strong>${info.volteckCount} unidades</strong></li>
  `;
}

// ============================================================================
// Selección y Detalle de Equipos
// ============================================================================

/**
 * Selecciona una estación de cómputo y actualiza el panel de detalles.
 */
function selectPC(pc) {
  state.selectedPC = pc;

  // Actualizar estado visual de selección en botones
  document.querySelectorAll('.pc-btn').forEach((btn) => {
    btn.classList.remove('selected');
    btn.setAttribute('aria-pressed', 'false');
  });

  const activeBtn = document.getElementById(`btn-${pc.laboratorio}-${pc.id}`);
  if (activeBtn) {
    activeBtn.classList.add('selected');
    activeBtn.setAttribute('aria-pressed', 'true');
  }

  renderDetailPanel(pc);
}

/**
 * Limpia la selección de computadora.
 */
function clearSelection() {
  state.selectedPC = null;
  document.querySelectorAll('.pc-btn').forEach((btn) => {
    btn.classList.remove('selected');
    btn.setAttribute('aria-pressed', 'false');
  });

  const emptyState = document.getElementById('detail-empty-state');
  const detailContent = document.getElementById('detail-content');
  const roleBadge = document.getElementById('detail-role-badge');

  if (emptyState) emptyState.style.display = 'block';
  if (detailContent) detailContent.style.display = 'none';
  if (roleBadge) roleBadge.textContent = 'Selección';
}

/**
 * Renderiza el panel de detalles para el equipo seleccionado.
 */
function renderDetailPanel(pc) {
  const emptyState = document.getElementById('detail-empty-state');
  const detailContent = document.getElementById('detail-content');
  const roleBadge = document.getElementById('detail-role-badge');

  if (emptyState) emptyState.style.display = 'none';
  if (detailContent) detailContent.style.display = 'flex';

  // Identificador y Rol
  const pcIdEl = document.getElementById('detail-pc-id');
  const pcLabEl = document.getElementById('detail-pc-lab');
  const pcStatusEl = document.getElementById('detail-pc-status');

  const labObj = state.data.laboratorios.find((l) => l.id === pc.laboratorio);
  const labNombre = labObj ? labObj.nombre : pc.laboratorio;

  if (pcIdEl) pcIdEl.textContent = pc.id;
  if (pcLabEl) pcLabEl.textContent = labNombre;
  if (roleBadge) {
    roleBadge.textContent = pc.rol === 'docente' ? 'Docente' : 'Alumno';
  }
  if (pcStatusEl) {
    if (pc.proteccion && pc.proteccion.provisional) {
      pcStatusEl.textContent = 'Asignación de protección provisional';
      pcStatusEl.style.color = '#d97706';
    } else {
      pcStatusEl.textContent = 'Estación mapeada y verificada';
      pcStatusEl.style.color = '#10b981';
    }
  }

  // Ficha de especificaciones
  const specLab = document.getElementById('detail-spec-lab');
  const specRow = document.getElementById('detail-spec-row');
  const specSection = document.getElementById('detail-spec-section');
  const specPos = document.getElementById('detail-spec-position');
  const specRole = document.getElementById('detail-spec-role');

  if (specLab) specLab.textContent = `${labNombre} (${pc.laboratorio})`;
  if (specRow) specRow.textContent = pc.rol === 'docente' ? 'Frente del aula' : `Fila ${pc.fila}`;
  if (specSection) specSection.textContent = pc.seccion;
  if (specPos) specPos.textContent = pc.posicion ? `Puesto ${pc.posicion}` : 'Puesto único';
  if (specRole) specRole.textContent = pc.rol === 'docente' ? 'Docente / Instructor' : 'Alumno';

  // Sección de protección eléctrica
  const protName = document.getElementById('detail-protection-name');
  const protId = document.getElementById('detail-protection-id');
  const protIcon = document.getElementById('detail-protection-icon');
  const protPaired = document.getElementById('detail-protection-paired');
  const provNote = document.getElementById('detail-provisional-note');
  const provText = document.getElementById('detail-provisional-text');
  const btnJump = document.getElementById('btn-paired-jump');

  const prot = pc.proteccion || {};

  if (protName) protName.textContent = prot.nombre || 'No registrado';
  if (protId) protId.textContent = prot.dispositivoId ? `ID: ${prot.dispositivoId}` : 'ID no asignado';

  if (protIcon) {
    if (prot.tipo === 'ups_apc') protIcon.textContent = '🔋';
    else if (prot.tipo === 'regulador_volteck') protIcon.textContent = '🔌';
    else protIcon.textContent = '⚡';
  }

  // Pareja de carga compartida
  if (prot.compartidoCon) {
    if (protPaired) protPaired.style.display = 'block';
    if (btnJump) {
      btnJump.textContent = prot.compartidoCon;
      btnJump.onclick = () => {
        findAndSelectPc(pc.laboratorio, prot.compartidoCon);
      };
    }
  } else {
    if (protPaired) {
      protPaired.style.display = 'block';
      protPaired.innerHTML = pc.rol === 'docente'
        ? '<strong>Línea de alimentación:</strong> Estación individual independiente.'
        : '<strong>Línea de alimentación:</strong> Sin pareja de carga vinculada.';
    }
  }

  // Nota provisional
  if (prot.provisional) {
    if (provNote) provNote.style.display = 'block';
    if (provText) {
      provText.textContent = prot.nota || 'Asignación preliminar sujeta a relevamiento en sitio.';
    }
  } else {
    if (provNote) provNote.style.display = 'none';
  }
}

/**
 * Busca una PC por su ID en el laboratorio y la selecciona.
 */
function findAndSelectPc(labId, pcId) {
  const lab = state.data.laboratorios.find((l) => l.id === labId);
  if (!lab) return;

  let targetPc = null;
  if (lab.docentePC && lab.docentePC.id === pcId) {
    targetPc = lab.docentePC;
  } else {
    for (const f of lab.filas) {
      const found = [...f.izquierda, ...f.derecha].find((p) => p.id === pcId);
      if (found) {
        targetPc = found;
        break;
      }
    }
  }

  if (targetPc) {
    selectPC(targetPc);
  }
}

// ============================================================================
// Inicialización y Event Listeners
// ============================================================================

function switchTab(labId) {
  state.currentLabId = labId;

  // Actualizar estado visual de los botones de pestañas
  const tabA = document.getElementById('tab-lab-a');
  const tabB = document.getElementById('tab-lab-b');

  if (tabA && tabB) {
    if (labId === 'LAB-A') {
      tabA.classList.add('active');
      tabA.setAttribute('aria-selected', 'true');
      tabB.classList.remove('active');
      tabB.setAttribute('aria-selected', 'false');
    } else {
      tabB.classList.add('active');
      tabB.setAttribute('aria-selected', 'true');
      tabA.classList.remove('active');
      tabA.setAttribute('aria-selected', 'false');
    }
  }

  // Limpiar selección previa al cambiar de laboratorio
  clearSelection();

  // Renderizar plano
  renderFloorPlan();
}

function setupEventListeners() {
  const tabA = document.getElementById('tab-lab-a');
  const tabB = document.getElementById('tab-lab-b');
  const btnClear = document.getElementById('btn-clear-selection');
  const btnCopy = document.getElementById('btn-copy-info');

  if (tabA) {
    tabA.addEventListener('click', () => switchTab('LAB-A'));
  }

  if (tabB) {
    tabB.addEventListener('click', () => switchTab('LAB-B'));
  }

  if (btnClear) {
    btnClear.addEventListener('click', clearSelection);
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      if (!state.selectedPC) return;
      const pc = state.selectedPC;
      const text = `Preparatoria Tonalá Sur - Ficha de Inventario
Estación: ${pc.id} (${pc.rol})
Laboratorio: ${pc.laboratorio}
Ubicación: ${pc.fila}, ${pc.seccion}
Protección Eléctrica: ${pc.proteccion ? pc.proteccion.nombre : 'Sin registrar'} (${pc.proteccion ? pc.proteccion.dispositivoId : 'N/A'})
Compartido con: ${pc.proteccion && pc.proteccion.compartidoCon ? pc.proteccion.compartidoCon : 'Ninguno'}
Estado: ${pc.proteccion && pc.proteccion.provisional ? 'PROVISIONAL' : 'VERIFICADO'}`;

      navigator.clipboard.writeText(text).then(() => {
        const originalText = btnCopy.textContent;
        btnCopy.textContent = '¡Copiado al portapapeles!';
        setTimeout(() => {
          btnCopy.textContent = originalText;
        }, 2000);
      });
    });
  }
}

function init() {
  const metrics = calculateMetrics(state.data);
  renderMetrics(metrics);
  setupEventListeners();
  renderFloorPlan();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
