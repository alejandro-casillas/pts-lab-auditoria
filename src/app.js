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
  let totalHabilitadas = 0;
  let totalInhabilitadas = 0;
  let totalAlumnos = 0;
  let totalDocentes = 0;
  let totalAmpliacion = 0;
  let totalPuestosVacios = 0;

  const labCounts = {};
  const labBreakdown = {};

  const upsDispositivos = new Set();
  const volteckDispositivos = new Set();
  const extensionesDispositivos = new Set();

  data.laboratorios.forEach((lab) => {
    let labPcCount = 0;
    let labAlumnosCount = 0;
    let labDocentesCount = 0;
    let labAmpliacionCount = 0;
    let labHabilitadasCount = 0;
    let labInhabilitadasCount = 0;
    let labPuestosVaciosCount = 0;

    const labUps = new Set();
    const labVolteck = new Set();
    const labExtensiones = new Set();

    if (lab.docentePC) {
      totalPCs++;
      labPcCount++;
      totalDocentes++;
      labDocentesCount++;

      if (lab.docentePC.operativo && lab.docentePC.operativo.estado === 'habilitada') {
        totalHabilitadas++;
        labHabilitadasCount++;
      } else {
        totalInhabilitadas++;
        labInhabilitadasCount++;
      }
    }

    lab.filas.forEach((f) => {
      const allRowItems = [...f.izquierda, ...f.derecha];
      allRowItems.forEach((item) => {
        // Los puestos vacíos no se cuentan como computadoras
        if (item.tipo === 'vacio') {
          totalPuestosVacios++;
          labPuestosVaciosCount++;
          return;
        }

        totalPCs++;
        labPcCount++;

        if (item.rol === 'alumno') {
          totalAlumnos++;
          labAlumnosCount++;
        } else if (item.rol === 'ampliacion') {
          totalAmpliacion++;
          labAmpliacionCount++;
        }

        if (item.operativo && item.operativo.estado === 'habilitada') {
          totalHabilitadas++;
          labHabilitadasCount++;
        } else {
          totalInhabilitadas++;
          labInhabilitadasCount++;
        }

        // Protección eléctrica (estaciones numeradas de alumnos)
        if (item.proteccion && item.proteccion.dispositivoId) {
          if (item.proteccion.tipo === 'ups_apc') {
            upsDispositivos.add(item.proteccion.dispositivoId);
            labUps.add(item.proteccion.dispositivoId);
          } else if (item.proteccion.tipo === 'regulador_volteck') {
            volteckDispositivos.add(item.proteccion.dispositivoId);
            labVolteck.add(item.proteccion.dispositivoId);
          }
        }

        // Extensiones eléctricas
        if (item.extensionElectrica && item.extensionElectrica.dispositivoId) {
          extensionesDispositivos.add(item.extensionElectrica.dispositivoId);
          labExtensiones.add(item.extensionElectrica.dispositivoId);
        }
      });
    });

    labCounts[lab.id] = labPcCount;
    labBreakdown[lab.id] = {
      total: labPcCount,
      alumnos: labAlumnosCount,
      docentes: labDocentesCount,
      ampliacion: labAmpliacionCount,
      habilitadas: labHabilitadasCount,
      inhabilitadas: labInhabilitadasCount,
      puestosVacios: labPuestosVaciosCount,
      filas: lab.filas.length,
      upsCount: labUps.size,
      volteckCount: labVolteck.size,
      extensionesCount: labExtensiones.size
    };
  });

  return {
    totalPCs,
    totalLabs: data.laboratorios.length,
    totalHabilitadas,
    totalInhabilitadas,
    totalAlumnos,
    totalDocentes,
    totalAmpliacion,
    totalPuestosVacios,
    totalUpsApc: upsDispositivos.size,
    totalVolteck: volteckDispositivos.size,
    totalExtensiones: extensionesDispositivos.size,
    labCounts,
    labBreakdown
  };
}

/**
 * Renderiza los indicadores numéricos del panel superior.
 */
function renderMetrics(metrics) {
  const elTotalPcs = document.getElementById('stat-total-pcs');
  const elHabilitadas = document.getElementById('stat-pcs-habilitadas');
  const elInhabilitadas = document.getElementById('stat-pcs-inhabilitadas');
  const elPcsAlumnos = document.getElementById('stat-pcs-alumnos');
  const elPcsDocentes = document.getElementById('stat-pcs-docentes');
  const elUpsApc = document.getElementById('stat-ups-apc');
  const elRegVolteck = document.getElementById('stat-reg-volteck');
  const elExtensiones = document.getElementById('stat-extensiones');

  if (elTotalPcs) elTotalPcs.textContent = metrics.totalPCs;
  if (elHabilitadas) elHabilitadas.textContent = metrics.totalHabilitadas;
  if (elInhabilitadas) elInhabilitadas.textContent = metrics.totalInhabilitadas;
  if (elPcsAlumnos) elPcsAlumnos.textContent = metrics.totalAlumnos;
  if (elPcsDocentes) elPcsDocentes.textContent = metrics.totalDocentes;
  if (elUpsApc) elUpsApc.textContent = metrics.totalUpsApc;
  if (elRegVolteck) elRegVolteck.textContent = metrics.totalVolteck;
  if (elExtensiones) elExtensiones.textContent = metrics.totalExtensiones;

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
  if (totalLabel) totalLabel.textContent = `${total} computadoras físicas`;
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
  return 'pc-sin-proteccion';
}

/**
 * Retorna una etiqueta corta para mostrar dentro del botón del PC.
 */
function getProtectionShortLabel(pc) {
  if (pc.rol === 'docente') return 'Docente';
  if (pc.proteccion && pc.proteccion.tipo === 'ups_apc') return 'UPS';
  if (pc.proteccion && pc.proteccion.tipo === 'regulador_volteck') return 'Volteck';
  if (!pc.proteccion) return 'Sin prot.';
  return 'Directo';
}

/**
 * Genera el elemento para un puesto vacío en la sala.
 */
function createEmptySlotElement(item) {
  const slot = document.createElement('div');
  slot.className = 'pc-slot-vacio';
  slot.title = `Puesto vacío (${item.fila}, ${item.seccion}, Puesto ${item.puesto})`;
  slot.innerHTML = `<span>Vacío</span>`;
  return slot;
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
  const protName = pc.proteccion ? pc.proteccion.nombre : 'Sin dispositivo de protección';
  const isInhabilitada = pc.operativo && pc.operativo.estado === 'inhabilitada';

  btn.setAttribute(
    'aria-label',
    `Computadora ${pc.id}, ${pc.rol === 'docente' ? 'Estación docente' : (pc.rol === 'ampliacion' ? 'Estación ampliación' : 'Estación alumno')}, ${pc.fila}, ${pc.seccion}, Estado: ${isInhabilitada ? 'Inhabilitada' : 'Habilitada'}, Protección: ${protName}`
  );

  btn.innerHTML = `
    ${isInhabilitada ? '<span class="pc-badge-disabled" title="Estación inhabilitada" aria-hidden="true">⚠️</span>' : ''}
    <span class="pc-id">${pc.id}</span>
    <span class="pc-sub">${protLabel}</span>
  `;

  btn.addEventListener('click', () => {
    selectPC(pc);
  });

  return btn;
}

/**
 * Agrupa una lista de computadoras/puestos en parejas de carga eléctrica (2 puestos por bloque).
 */
function renderSectionPairs(itemsList) {
  const sectionContainer = document.createElement('div');
  sectionContainer.className = 'stations-section';

  for (let i = 0; i < itemsList.length; i += 2) {
    const item1 = itemsList[i];
    const item2 = itemsList[i + 1];

    const pairWrapper = document.createElement('div');
    pairWrapper.className = 'pc-pair';

    // Determinar si la pareja utiliza extensión eléctrica de pasillo
    const hasExtension = (item1 && item1.extensionElectrica) || (item2 && item2.extensionElectrica);
    if (hasExtension) {
      pairWrapper.classList.add('has-extension');
    }

    // Renderizar primer elemento
    if (item1) {
      if (item1.tipo === 'vacio') {
        pairWrapper.appendChild(createEmptySlotElement(item1));
      } else {
        pairWrapper.appendChild(createPcButton(item1));
      }
    }

    // Renderizar segundo elemento
    if (item2) {
      if (item2.tipo === 'vacio') {
        pairWrapper.appendChild(createEmptySlotElement(item2));
      } else {
        pairWrapper.appendChild(createPcButton(item2));
      }
    }

    // Indicador visual discreto de extensión de pasillo
    if (hasExtension) {
      const extTag = document.createElement('span');
      extTag.className = 'pc-pair-extension-indicator';
      extTag.textContent = 'EXT 4M';
      extTag.title = 'Pareja interior conectada mediante extensión reforzada Volteck 4m (Calibre 3x14 AWG)';
      pairWrapper.appendChild(extTag);
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
    subEl.textContent = `Distribución física: ${lab.filas.length} filas • Estaciones frontales y pasillo central`;
  }

  // Notificación de datos provisionales si existen estaciones provisionales en el laboratorio
  const bannerEl = document.getElementById('provisional-banner');
  if (bannerEl) {
    const hasProvisional = lab.filas.some((f) =>
      [...f.izquierda, ...f.derecha].some((item) => item.proteccion && item.proteccion.provisional)
    );
    bannerEl.style.display = hasProvisional ? 'flex' : 'none';
  }

  // Estación Docente (PC00)
  const docenteSlot = document.getElementById('docente-slot');
  if (docenteSlot) {
    docenteSlot.innerHTML = '';
    if (lab.docentePC) {
      docenteSlot.appendChild(createPcButton(lab.docentePC));
    }
  }

  // Filas de la sala (incluyendo F0 si existe)
  const rowsContainer = document.getElementById('rows-container');
  if (rowsContainer) {
    rowsContainer.innerHTML = '';

    lab.filas.forEach((fila) => {
      const rowWrapper = document.createElement('div');
      rowWrapper.className = 'row-wrapper';

      // Etiqueta de la fila (F0, F1, F2...)
      const rowTag = document.createElement('div');
      rowTag.className = 'row-tag';
      rowTag.textContent = fila.id;
      rowTag.title = fila.descripcion ? `${fila.descripcion} (${fila.id})` : `Fila ${fila.filaNumero}`;

      // Sección Izquierda (4 puestos)
      const leftSection = renderSectionPairs(fila.izquierda);

      // Pasillo central
      const aisle = document.createElement('div');
      aisle.className = 'aisle-corridor';
      aisle.textContent = 'PASILLO';

      // Sección Derecha (4 puestos)
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
    <li><span>Estaciones operativas:</span> <strong>${info.habilitadas} habilitadas</strong></li>
    <li><span>Estaciones inhabilitadas:</span> <strong>${info.inhabilitadas} equipos</strong></li>
    <li><span>Estaciones de alumnos:</span> <strong>${info.alumnos} PCs</strong></li>
    ${info.ampliacion > 0 ? `<li><span>Equipos de ampliación (F0):</span> <strong>${info.ampliacion} PCs</strong></li>` : ''}
    <li><span>Estación docente:</span> <strong>${info.docentes} PC (${lab.docentePC ? lab.docentePC.id : 'N/A'})</strong></li>
    <li><span>Filas en la sala:</span> <strong>${info.filas} filas</strong></li>
    <li><span>UPS APC:</span> <strong>${info.upsCount} unidades</strong></li>
    <li><span>Reguladores Volteck:</span> <strong>${info.volteckCount} unidades</strong></li>
    <li><span>Extensiones pasillo (4m):</span> <strong>${info.extensionesCount} unidades</strong></li>
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

  let roleLabel = 'Alumno';
  if (pc.rol === 'docente') roleLabel = 'Docente';
  else if (pc.rol === 'ampliacion') roleLabel = 'Ampliación F0';

  if (roleBadge) {
    roleBadge.textContent = roleLabel;
  }

  const op = pc.operativo || { estado: 'habilitada', alimentacion: true, redLan: true, motivoInhabilitacion: null };
  const isInhabilitada = op.estado === 'inhabilitada';

  if (pcStatusEl) {
    if (isInhabilitada) {
      pcStatusEl.textContent = 'Estación inhabilitada';
      pcStatusEl.style.color = '#d97706';
    } else {
      pcStatusEl.textContent = 'Estación habilitada y operativa';
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
  if (specRow) specRow.textContent = pc.rol === 'docente' ? 'Frente del aula' : (pc.fila === 'F0' ? 'Fila F0 (Ampliación)' : `Fila ${pc.fila}`);
  if (specSection) specSection.textContent = pc.seccion;
  if (specPos) specPos.textContent = pc.posicion ? `Puesto ${pc.posicion}` : 'Puesto único';
  if (specRole) specRole.textContent = pc.rol === 'docente' ? 'Docente / Instructor' : (pc.rol === 'ampliacion' ? 'Ampliación física' : 'Alumno');

  // Estado operativo independiente
  const opBadge = document.getElementById('detail-op-badge');
  const opPower = document.getElementById('detail-op-power');
  const opLan = document.getElementById('detail-op-lan');
  const opMotivoBox = document.getElementById('detail-op-motivo-box');
  const opMotivoText = document.getElementById('detail-op-motivo-text');

  if (opBadge) {
    opBadge.textContent = isInhabilitada ? 'Inhabilitada' : 'Habilitada';
    if (isInhabilitada) opBadge.classList.add('is-disabled');
    else opBadge.classList.remove('is-disabled');
  }

  if (opPower) {
    opPower.textContent = op.alimentacion ? 'Disponible' : 'No disponible';
    if (!op.alimentacion) opPower.classList.add('val-bad');
    else opPower.classList.remove('val-bad');
  }

  if (opLan) {
    opLan.textContent = op.redLan ? 'Disponible' : 'No disponible';
    if (!op.redLan) opLan.classList.add('val-bad');
    else opLan.classList.remove('val-bad');
  }

  if (opMotivoBox) {
    if (isInhabilitada && op.motivoInhabilitacion) {
      opMotivoBox.style.display = 'block';
      if (opMotivoText) opMotivoText.textContent = op.motivoInhabilitacion;
    } else {
      opMotivoBox.style.display = 'none';
    }
  }

  // Sección de protección eléctrica
  const protName = document.getElementById('detail-protection-name');
  const protId = document.getElementById('detail-protection-id');
  const protIcon = document.getElementById('detail-protection-icon');
  const protPaired = document.getElementById('detail-protection-paired');
  const provNote = document.getElementById('detail-provisional-note');
  const provText = document.getElementById('detail-provisional-text');
  const btnJump = document.getElementById('btn-paired-jump');

  const prot = pc.proteccion;

  if (prot) {
    if (protName) protName.textContent = prot.nombre || 'No registrado';
    if (protId) protId.textContent = prot.dispositivoId ? `ID: ${prot.dispositivoId}` : 'ID no asignado';

    if (protIcon) {
      if (prot.tipo === 'ups_apc') protIcon.textContent = '🔋';
      else if (prot.tipo === 'regulador_volteck') protIcon.textContent = '🔌';
      else protIcon.textContent = '⚡';
    }

    // Pareja de carga compartida
    if (prot.compartidoCon) {
      if (protPaired) {
        protPaired.style.display = 'block';
        protPaired.innerHTML = `<strong>Pareja de carga:</strong> Comparte este dispositivo con <button type="button" class="btn-paired-jump" id="btn-paired-jump">${prot.compartidoCon}</button>`;
        const newJumpBtn = document.getElementById('btn-paired-jump');
        if (newJumpBtn) {
          newJumpBtn.onclick = () => {
            findAndSelectPc(pc.laboratorio, prot.compartidoCon);
          };
        }
      }
    } else {
      if (protPaired) {
        protPaired.style.display = 'block';
        protPaired.innerHTML = pc.rol === 'docente'
          ? '<strong>Línea de alimentación:</strong> Estación individual independiente.'
          : '<strong>Línea de alimentación:</strong> Sin pareja de carga vinculada.';
      }
    }

    if (prot.provisional) {
      if (provNote) provNote.style.display = 'block';
      if (provText) provText.textContent = prot.nota || 'Asignación preliminar sujeta a relevamiento.';
    } else {
      if (provNote) provNote.style.display = 'none';
    }
  } else {
    // Sin protección asignada (ej. F0)
    if (protName) protName.textContent = 'Sin protección eléctrica asignada';
    if (protId) protId.textContent = 'No aplica';
    if (protIcon) protIcon.textContent = '⚠️';
    if (protPaired) {
      protPaired.style.display = 'block';
      protPaired.innerHTML = '<strong>Alimentación:</strong> Sin dispositivo asignado ni toma eléctrica disponible.';
    }
    if (provNote) provNote.style.display = 'none';
  }

  // Extensión eléctrica (activo independiente)
  const extBox = document.getElementById('detail-extension-box');
  const extId = document.getElementById('detail-ext-id');
  const extDesc = document.getElementById('detail-ext-desc');

  if (pc.extensionElectrica) {
    if (extBox) extBox.style.display = 'block';
    if (extId) extId.textContent = `ID: ${pc.extensionElectrica.dispositivoId} (Pendiente de verificación física)`;
    if (extDesc) extDesc.textContent = `${pc.extensionElectrica.modelo}. Requerida por distribución física de pasillo.`;
  } else {
    if (extBox) extBox.style.display = 'none';
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
      const op = pc.operativo || { estado: 'habilitada', alimentacion: true, redLan: true };
      const text = `Preparatoria Tonalá Sur - Ficha de Inventario
Estación: ${pc.id} (${pc.rol})
Laboratorio: ${pc.laboratorio}
Ubicación: ${pc.fila}, ${pc.seccion}
Estado Operativo: ${op.estado.toUpperCase()} (Alimentación: ${op.alimentacion ? 'SÍ' : 'NO'}, LAN: ${op.redLan ? 'SÍ' : 'NO'})
${op.motivoInhabilitacion ? `Motivo Inhabilitación: ${op.motivoInhabilitacion}\n` : ''}Protección Eléctrica: ${pc.proteccion ? pc.proteccion.nombre : 'Sin dispositivo'} (${pc.proteccion ? pc.proteccion.dispositivoId : 'N/A'})
Compartido con: ${pc.proteccion && pc.proteccion.compartidoCon ? pc.proteccion.compartidoCon : 'Ninguno'}
Extensión de Pasillo: ${pc.extensionElectrica ? `SÍ (${pc.extensionElectrica.dispositivoId})` : 'NO'}`;

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
