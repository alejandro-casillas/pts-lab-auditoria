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

// ============================================================================
// Generación del Informe Imprimible (Exportar PDF Monocromático ATS)
// ============================================================================
/**
 * Renderiza una celda compacta de estación para la tabla del plano en el informe ATS.
 */
function formatPrintCell(p) {
  if (!p) return '';
  if (p.tipo === 'vacio') {
    return `<span class="ats-slot-vacio">[Vacío]</span>`;
  }
  const isInh = p.operativo && p.operativo.estado === 'inhabilitada';
  const protCode = !p.proteccion ? 'SP' : (p.proteccion.tipo === 'ups_apc' ? 'UPS' : (p.proteccion.tipo === 'regulador_volteck' ? 'VOL' : 'DIR'));
  const extMark = p.extensionElectrica ? '*' : '';
  const inhMark = isInh ? '(!)' : '';

  return `<span class="ats-pc-item ${isInh ? 'ats-pc-inh' : ''}">${p.id}${inhMark} <small>[${protCode}${extMark}]</small></span>`;
}

/**
 * Renderiza el plano físico estructurado como tabla formal ATS.
 */
function renderPrintLabTable(lab) {
  const docenteInh = lab.docentePC?.operativo?.estado === 'inhabilitada' ? '(!)' : '';
  const docenteProt = lab.docentePC?.proteccion?.tipo === 'ups_apc' ? 'UPS' : 'DIR';
  
  let rowsHtml = '';
  lab.filas.forEach((f) => {
    // Left: 4 slots -> 2 pairs
    const izq1 = `${formatPrintCell(f.izquierda[0])}  ${formatPrintCell(f.izquierda[1])}`;
    const izq2 = `${formatPrintCell(f.izquierda[2])}  ${formatPrintCell(f.izquierda[3])}`;
    // Right: 4 slots -> 2 pairs
    const der1 = `${formatPrintCell(f.derecha[0])}  ${formatPrintCell(f.derecha[1])}`;
    const der2 = `${formatPrintCell(f.derecha[2])}  ${formatPrintCell(f.derecha[3])}`;

    rowsHtml += `
      <tr>
        <td class="ats-col-row"><strong>${f.id}</strong></td>
        <td class="ats-col-group">${izq1}</td>
        <td class="ats-col-group">${izq2}</td>
        <td class="ats-col-aisle">|</td>
        <td class="ats-col-group">${der1}</td>
        <td class="ats-col-group">${der2}</td>
      </tr>
    `;
  });

  return `
    <div class="ats-plan-wrapper">
      <div class="ats-plan-subhead">
        <strong>${lab.nombre.toUpperCase()}</strong> (${lab.filas.length} filas • Docente: ${lab.docentePC ? lab.docentePC.id : 'N/A'}${docenteInh} [${docenteProt}])
      </div>
      <table class="ats-plan-table">
        <thead>
          <tr>
            <th style="width: 8%;">Fila</th>
            <th colspan="2" style="width: 44%;">Sección Izquierda (Pares 1 y 2)</th>
            <th style="width: 4%;">Pasillo</th>
            <th colspan="2" style="width: 44%;">Sección Derecha (Pares 1 y 2)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Genera el informe institucional para impresión / exportación a PDF con estética ATS.
 */
function renderPrintReport() {
  const container = document.getElementById('print-report');
  if (!container) return;

  const metrics = calculateMetrics(state.data);
  const now = new Date();
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const fechaMesAno = `${meses[now.getMonth()]} de ${now.getFullYear()}`;
  const fechaCompleta = `${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;

  const labA = state.data.laboratorios.find((l) => l.id === 'LAB-A');
  const labB = state.data.laboratorios.find((l) => l.id === 'LAB-B');

  container.innerHTML = `
    <div class="ats-report">
      <!-- Encabezado Institucional Centrado Monocromático -->
      <header class="ats-header">
        <h1 class="ats-inst-title">UNIVERSIDAD DE GUADALAJARA</h1>
        <h2 class="ats-inst-subtitle">PREPARATORIA TONALÁ SUR</h2>
        <h3 class="ats-doc-title">INVENTARIO DE INFRAESTRUCTURA</h3>
        <p class="ats-doc-meta">Laboratorios de cómputo A y B • ${fechaMesAno}</p>
        <div class="ats-divider"></div>
      </header>

      <!-- Sección 1: Resumen Ejecutivo y Comparativo -->
      <section class="ats-section">
        <h4 class="ats-section-title">1. RESUMEN EJECUTIVO Y COMPARATIVA DE INFRAESTRUCTURA</h4>
        <table class="ats-table">
          <thead>
            <tr>
              <th style="text-align: left;">CONCEPTO</th>
              <th style="text-align: center; width: 22%;">LABORATORIO A</th>
              <th style="text-align: center; width: 22%;">LABORATORIO B</th>
              <th style="text-align: center; width: 22%;">TOTAL GENERAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Computadoras físicas totales</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-A'].total}</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-B'].total}</td>
              <td style="text-align: center;"><strong>${metrics.totalPCs}</strong></td>
            </tr>
            <tr>
              <td>Estaciones habilitadas (operativas)</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-A'].habilitadas}</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-B'].habilitadas}</td>
              <td style="text-align: center;"><strong>${metrics.totalHabilitadas}</strong></td>
            </tr>
            <tr>
              <td>Estaciones inhabilitadas</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-A'].inhabilitadas}</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-B'].inhabilitadas}</td>
              <td style="text-align: center;"><strong>${metrics.totalInhabilitadas}</strong></td>
            </tr>
            <tr>
              <td>Estaciones de alumnos (numeradas regulares)</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-A'].alumnos}</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-B'].alumnos}</td>
              <td style="text-align: center;">${metrics.totalAlumnos}</td>
            </tr>
            <tr>
              <td>Estaciones de ampliación física (Fila F0)</td>
              <td style="text-align: center;">0</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-B'].ampliacion}</td>
              <td style="text-align: center;">${metrics.totalAmpliacion}</td>
            </tr>
            <tr>
              <td>Estaciones docentes principales (PC00)</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-A'].docentes}</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-B'].docentes}</td>
              <td style="text-align: center;">${metrics.totalDocentes}</td>
            </tr>
            <tr>
              <td>Unidades UPS APC (estaciones de alumnos)</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-A'].upsCount}</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-B'].upsCount}</td>
              <td style="text-align: center;"><strong>${metrics.totalUpsApc}</strong></td>
            </tr>
            <tr>
              <td>Reguladores Volteck (estaciones de alumnos)</td>
              <td style="text-align: center;">0</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-B'].volteckCount}</td>
              <td style="text-align: center;"><strong>${metrics.totalVolteck}</strong></td>
            </tr>
            <tr>
              <td>Extensiones eléctricas de pasillo (4m, Cal. 3x14)</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-A'].extensionesCount}</td>
              <td style="text-align: center;">${metrics.labBreakdown['LAB-B'].extensionesCount}</td>
              <td style="text-align: center;"><strong>${metrics.totalExtensiones}</strong></td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Sección 2: Distribución Física y Topología de Equipos -->
      <section class="ats-section">
        <h4 class="ats-section-title">2. DISTRIBUCIÓN FÍSICA Y TOPOLOGÍA DE EQUIPOS</h4>
        <p class="ats-legend-note">
          <strong>Nomenclatura:</strong> [UPS] = UPS APC &bull; [VOL] = Regulador Volteck &bull; [DIR] = Toma directa &bull; [SP] = Sin protección &bull; (*) = Requiere extensión de pasillo 4m &bull; (!) = Estación inhabilitada.
        </p>
        ${labA ? renderPrintLabTable(labA) : ''}
        <div style="margin-top: 10px;"></div>
        ${labB ? renderPrintLabTable(labB) : ''}
      </section>

      <div class="ats-page-break"></div>

      <!-- Sección 3: Observaciones Técnicas y Diagnóstico -->
      <section class="ats-section">
        <h4 class="ats-section-title">3. OBSERVACIONES TÉCNICAS Y EQUIPOS INHABILITADOS</h4>
        <div class="ats-obs-block">
          <p class="ats-obs-item">
            <strong>• Laboratorio B — Estación PC16 (Inhabilitada):</strong> Equipo con suministro eléctrico normal y protección de respaldo mediante UPS APC (UPS-B-04). Presenta falla física en el puerto de red ethernet de pared (nodo desconectado/dañado), imposibilitando la conexión a la red institucional LAN. Se requiere reponchado o sustitución del jack RJ45.
          </p>
          <p class="ats-obs-item">
            <strong>• Laboratorio B — Fila F0 de Ampliación (LAB-B-EX01, EX02 y EX03 - Inhabilitadas):</strong> Tres computadoras físicas colocadas en el frente derecho del aula como parte de una ampliación no habilitada. No cuentan con infraestructura eléctrica disponible, conectividad de red LAN ni dispositivos de protección asignados. Se mantendrán fuera de servicio hasta el tendido de cableado e instalación de contactos regulados.
          </p>
          <p class="ats-obs-item">
            <strong>• Infraestructura Eléctrica y Extensiones:</strong> Se registraron 18 extensiones reforzadas aterrizadas Volteck de 4 metros calibre 3x14 AWG (10 en LAB A y 8 en LAB B), necesarias para energizar las parejas de estaciones contiguas al pasillo central desde los contactos perimetrales.
          </p>
          <p class="ats-obs-item">
            <strong>• Verificación en Sitio:</strong> La distribución eléctrica del Laboratorio B cuenta con confirmación física para las 8 parejas Volteck y las 8 parejas UPS APC.
          </p>
        </div>
      </section>

      <!-- Sección 4: Bloque Formal de Firmas -->
      <section class="ats-section ats-signatures-section">
        <div class="ats-signatures">
          <div class="ats-sig-col">
            <div class="ats-sig-line"></div>
            <p class="ats-sig-name">Mtro. Responsable de Auditoría y TI</p>
            <p class="ats-sig-dept">Preparatoria Tonalá Sur</p>
          </div>
          <div class="ats-sig-col">
            <div class="ats-sig-line"></div>
            <p class="ats-sig-name">Dirección / Secretaría Administrativa</p>
            <p class="ats-sig-dept">Preparatoria Tonalá Sur</p>
          </div>
        </div>
        <p class="ats-footer-date">Documento generado el ${fechaCompleta} • Sistema de Inventario de Infraestructura PTS</p>
      </section>
    </div>
  `;
}

function setupEventListeners() {
  const tabA = document.getElementById('tab-lab-a');
  const tabB = document.getElementById('tab-lab-b');
  const btnClear = document.getElementById('btn-clear-selection');
  const btnCopy = document.getElementById('btn-copy-info');
  const btnExportPdf = document.getElementById('btn-export-pdf');

  if (tabA) {
    tabA.addEventListener('click', () => switchTab('LAB-A'));
  }

  if (tabB) {
    tabB.addEventListener('click', () => switchTab('LAB-B'));
  }

  if (btnClear) {
    btnClear.addEventListener('click', clearSelection);
  }

  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
      renderPrintReport();
      window.print();
    });
  }

  window.addEventListener('beforeprint', () => {
    renderPrintReport();
  });

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
  renderPrintReport();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
